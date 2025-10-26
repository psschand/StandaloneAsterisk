package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"github.com/psschand/callcenter/internal/asterisk"
	"github.com/psschand/callcenter/internal/config"
	"github.com/psschand/callcenter/internal/database"
	"github.com/psschand/callcenter/internal/handler"
	"github.com/psschand/callcenter/internal/middleware"
	"github.com/psschand/callcenter/internal/repository"
	"github.com/psschand/callcenter/internal/service"
	ws "github.com/psschand/callcenter/internal/websocket"
	"github.com/psschand/callcenter/pkg/jwt"
	"github.com/psschand/callcenter/pkg/response"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Connect to database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	log.Println("Database connected successfully")

	// Initialize JWT service
	jwtService := jwt.NewService(cfg.JWT.Secret, cfg.JWT.Expiration, cfg.JWT.RefreshExpiration)

	// Initialize repositories
	tenantRepo := repository.NewTenantRepository(db)
	userRepo := repository.NewUserRepository(db)
	roleRepo := repository.NewUserRoleRepository(db)
	didRepo := repository.NewDIDRepository(db)
	queueRepo := repository.NewQueueRepository(db)
	queueMemberRepo := repository.NewQueueMemberRepository(db)
	cdrRepo := repository.NewCDRRepository(db)
	agentStateRepo := repository.NewAgentStateRepository(db)
	ticketRepo := repository.NewTicketRepository(db)
	ticketMessageRepo := repository.NewTicketMessageRepository(db)
	contactRepo := repository.NewContactRepository(db)
	chatWidgetRepo := repository.NewChatWidgetRepository(db)
	chatSessionRepo := repository.NewChatSessionRepository(db)
	chatMessageRepo := repository.NewChatMessageRepository(db)
	chatAgentRepo := repository.NewChatAgentRepository(db)
	chatTransferRepo := repository.NewChatTransferRepository(db)
	webhookRepo := repository.NewWebhookRepository(db)

	log.Println("Repositories initialized")

	// Initialize Redis
	redisClient := redis.NewClient(&redis.Options{
		Addr:     cfg.GetRedisAddress(),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})

	// Test Redis connection
	ctx := context.Background()
	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Printf("Warning: Redis connection failed: %v (WebSocket will work in local mode only)", err)
		redisClient = nil
	} else {
		log.Println("Redis connected successfully")
	}

	// Initialize WebSocket hub
	var hub *ws.Hub
	if redisClient != nil {
		// Use PubSubHub for multi-server support
		pubsubHub := ws.NewPubSubHub(redisClient)
		go pubsubHub.Run()
		hub = pubsubHub.Hub
		log.Println("WebSocket PubSubHub started (multi-server mode)")
	} else {
		// Use basic Hub for single server
		hub = ws.NewHub()
		go hub.Run()
		log.Println("WebSocket Hub started (single-server mode)")
	}

	// Initialize webhook system
	webhookManager := ws.NewWebhookManager(10) // 10 concurrent workers
	webhookManager.Start()
	log.Println("Webhook manager started with 10 workers")

	// Initialize event broadcaster (broadcasts to WebSocket AND webhooks)
	broadcaster := ws.NewEventWebhookBroadcaster(hub, webhookManager, webhookRepo)
	log.Println("Event broadcaster initialized (WebSocket + Webhooks)")

	// Initialize Asterisk ARI client and handler
	ariClient := asterisk.NewARIClient(
		cfg.Asterisk.ARIURL,
		cfg.Asterisk.Username,
		cfg.Asterisk.Password,
		cfg.Asterisk.AppName,
	)

	callHandler := asterisk.NewCallHandler(ariClient)

	// Add event handler to broadcast call events via WebSocket
	callHandler.AddEventHandler(func(event asterisk.ARIEvent) {
		// Broadcast ARI events to WebSocket clients
		// You can filter or transform events here
		log.Printf("Broadcasting ARI event: %s", event.Type)
	})

	// Start ARI call handler
	ariCtx, ariCancel := context.WithCancel(context.Background())
	defer ariCancel()

	if err := callHandler.Start(ariCtx); err != nil {
		log.Printf("Warning: Failed to start ARI handler: %v (call features disabled)", err)
	} else {
		log.Println("Asterisk ARI handler started successfully")
	}

	// Initialize services
	authService := service.NewAuthService(userRepo, tenantRepo, roleRepo, jwtService)
	tenantService := service.NewTenantService(tenantRepo)
	userService := service.NewUserService(userRepo, roleRepo, tenantRepo)
	didService := service.NewDIDService(didRepo, tenantRepo, queueRepo, userRepo)
	queueService := service.NewQueueService(queueRepo, queueMemberRepo, tenantRepo, userRepo, roleRepo)
	cdrService := service.NewCDRService(cdrRepo, userRepo)
	agentStateService := service.NewAgentStateService(agentStateRepo, userRepo)
	ticketService := service.NewTicketService(ticketRepo, ticketMessageRepo, contactRepo, userRepo)
	chatService := service.NewChatService(chatWidgetRepo, chatSessionRepo, chatMessageRepo, chatAgentRepo, chatTransferRepo, userRepo)

	log.Println("Services initialized")

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	tenantHandler := handler.NewTenantHandler(tenantService)
	userHandler := handler.NewUserHandler(userService)
	didHandler := handler.NewDIDHandler(didService)
	queueHandler := handler.NewQueueHandler(queueService)
	cdrHandler := handler.NewCDRHandler(cdrService)
	agentStateHandler := handler.NewAgentStateHandler(agentStateService)
	ticketHandler := handler.NewTicketHandler(ticketService)
	chatHandler := handler.NewChatHandler(chatService)
	webhookHandler := handler.NewWebhookHandler(webhookRepo, webhookManager)
	wsHandler := ws.NewHandler(hub)

	log.Println("Handlers initialized")

	// Setup Gin
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Global middleware
	router.Use(middleware.RequestID())
	router.Use(middleware.Recovery())
	router.Use(middleware.CORS(cfg))
	router.Use(gin.Logger())

	// Health check endpoint (no auth required)
	router.GET("/health", func(c *gin.Context) {
		dbErr := database.HealthCheck()
		if dbErr != nil {
			response.InternalError(c, "Database health check failed")
			return
		}

		stats, _ := database.GetStats()
		response.Success(c, gin.H{
			"status":   "ok",
			"database": "connected",
			"stats":    stats,
		})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Public routes (no auth)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/reset-password-request", authHandler.ResetPasswordRequest)
		}

		// Protected auth routes
		authProtected := v1.Group("/auth")
		authProtected.Use(middleware.Auth(jwtService))
		{
			authProtected.POST("/change-password", authHandler.ChangePassword)
			authProtected.GET("/me", authHandler.Me)
			authProtected.POST("/logout", authHandler.Logout)
		}

		// Protected routes (require auth)
		protected := v1.Group("")
		protected.Use(middleware.Auth(jwtService))
		protected.Use(middleware.TenantIsolation())
		{
			// Tenant routes (admin only)
			tenants := protected.Group("/tenants")
			tenants.Use(middleware.RequireRole("superadmin", "admin"))
			{
				tenants.POST("", tenantHandler.Create)
				tenants.GET("", tenantHandler.List)
				tenants.GET("/:id", tenantHandler.Get)
				tenants.PUT("/:id", tenantHandler.Update)
				tenants.DELETE("/:id", tenantHandler.Delete)
				tenants.GET("/by-domain", tenantHandler.GetByDomain)
				tenants.GET("/:id/resource-usage", tenantHandler.GetResourceUsage)
				tenants.PUT("/:id/status", tenantHandler.UpdateStatus)
			}

			// User routes
			users := protected.Group("/users")
			{
				users.POST("", userHandler.Create)
				users.GET("", userHandler.List)
				users.GET("/:id", userHandler.Get)
				users.PUT("/:id", userHandler.Update)
				users.DELETE("/:id", userHandler.Delete)
				users.GET("/search", userHandler.Search)
				users.PUT("/:id/role", userHandler.UpdateRole)
				users.POST("/:id/activate", userHandler.Activate)
				users.POST("/:id/deactivate", userHandler.Deactivate)
			}

			// DID routes
			dids := protected.Group("/dids")
			{
				dids.POST("", didHandler.Create)
				dids.GET("", didHandler.List)
				dids.GET("/:id", didHandler.Get)
				dids.PUT("/:id", didHandler.Update)
				dids.DELETE("/:id", didHandler.Delete)
				dids.PUT("/:id/routing", didHandler.UpdateRouting)
				dids.GET("/by-number", didHandler.GetByNumber)
				dids.GET("/available", didHandler.GetAvailable)
			}

			// Queue routes
			queues := protected.Group("/queues")
			{
				queues.POST("", queueHandler.Create)
				queues.GET("", queueHandler.List)
				queues.GET("/:id", queueHandler.Get)
				queues.PUT("/:id", queueHandler.Update)
				queues.DELETE("/:id", queueHandler.Delete)
				queues.GET("/:id/members", queueHandler.GetMembers)
				queues.POST("/:id/members", queueHandler.AddMember)
				queues.DELETE("/:id/members/:userId", queueHandler.RemoveMember)
				queues.PUT("/members/:memberId", queueHandler.UpdateMember)
			}

			// CDR routes
			cdr := protected.Group("/cdr")
			{
				cdr.GET("", cdrHandler.List)
				cdr.GET("/:id", cdrHandler.Get)
				cdr.GET("/by-date-range", cdrHandler.GetByDateRange)
				cdr.GET("/by-user/:userId", cdrHandler.GetByUser)
				cdr.GET("/by-queue/:queueName", cdrHandler.GetByQueue)
				cdr.GET("/stats", cdrHandler.GetStats)
				cdr.GET("/call-volume", cdrHandler.GetCallVolume)
			}

			// Agent state routes
			agentState := protected.Group("/agent-state")
			{
				agentState.GET("/me", agentStateHandler.GetMyState)
				agentState.PUT("/me", agentStateHandler.UpdateState)
				agentState.GET("", agentStateHandler.List)
				agentState.GET("/:userId", agentStateHandler.Get)
				agentState.GET("/available", agentStateHandler.GetAvailable)
				agentState.GET("/by-state/:state", agentStateHandler.GetByState)
				agentState.POST("/me/break", agentStateHandler.StartBreak)
				agentState.POST("/me/break/end", agentStateHandler.EndBreak)
				agentState.POST("/me/away", agentStateHandler.SetAway)
				agentState.POST("/me/available", agentStateHandler.SetAvailable)
			}

			// Ticket routes
			tickets := protected.Group("/tickets")
			{
				tickets.POST("", ticketHandler.Create)
				tickets.GET("", ticketHandler.List)
				tickets.GET("/:id", ticketHandler.Get)
				tickets.PUT("/:id", ticketHandler.Update)
				tickets.DELETE("/:id", ticketHandler.Delete)
				tickets.POST("/:id/assign", ticketHandler.Assign)
				tickets.PUT("/:id/status", ticketHandler.UpdateStatus)
				tickets.GET("/my", ticketHandler.GetMyTickets)
				tickets.POST("/:id/messages", ticketHandler.AddMessage)
				tickets.GET("/:id/messages", ticketHandler.GetMessages)
				tickets.GET("/search", ticketHandler.Search)
				tickets.GET("/stats", ticketHandler.GetStats)
				tickets.GET("/overdue", ticketHandler.GetOverdue)
			}

			// Chat routes
			chat := protected.Group("/chat")
			{
				// Widget management
				chat.POST("/widgets", chatHandler.CreateWidget)
				chat.GET("/widgets/:id", chatHandler.GetWidget)
				chat.PUT("/widgets/:id", chatHandler.UpdateWidget)
				chat.DELETE("/widgets/:id", chatHandler.DeleteWidget)

				// Session management
				chat.POST("/sessions", chatHandler.CreateSession)
				chat.GET("/sessions/:id", chatHandler.GetSession)
				chat.GET("/sessions", chatHandler.ListSessions)
				chat.GET("/sessions/active", chatHandler.GetActiveSessions)
				chat.POST("/sessions/:id/assign", chatHandler.AssignSession)
				chat.POST("/sessions/:id/end", chatHandler.EndSession)
				chat.POST("/sessions/:id/transfer", chatHandler.TransferSession)

				// Message management
				chat.POST("/messages", chatHandler.SendMessage)
				chat.GET("/sessions/:id/messages", chatHandler.GetMessages)
				chat.POST("/messages/:messageId/read", chatHandler.MarkMessageAsRead)

				// Agent management
				chat.POST("/agents", chatHandler.RegisterAgent)
				chat.PUT("/agents/:agentId/availability", chatHandler.UpdateAgentAvailability)
				chat.GET("/agents/available", chatHandler.GetAvailableAgents)

				// Statistics
				chat.GET("/stats", chatHandler.GetStats)
			}

			// Webhook routes
			webhooks := protected.Group("/webhooks")
			{
				webhooks.POST("", webhookHandler.CreateWebhook)
				webhooks.GET("", webhookHandler.ListWebhooks)
				webhooks.GET("/:id", webhookHandler.GetWebhook)
				webhooks.PUT("/:id", webhookHandler.UpdateWebhook)
				webhooks.DELETE("/:id", webhookHandler.DeleteWebhook)
				webhooks.POST("/:id/test", webhookHandler.TestWebhook)
				webhooks.GET("/:id/logs", webhookHandler.GetWebhookLogs)
				webhooks.GET("/:id/stats", webhookHandler.GetWebhookStats)
				webhooks.GET("/failed", webhookHandler.GetFailedWebhooks)
			}
		}
	}

	// WebSocket endpoints (require auth)
	router.GET("/ws", middleware.Auth(jwtService), wsHandler.HandleWebSocket)
	router.GET("/ws/public/:sessionId", wsHandler.HandleWebSocketPublic)
	router.GET("/ws/stats", middleware.Auth(jwtService), wsHandler.HandleStats)
	router.GET("/ws/users/:userId/online", middleware.Auth(jwtService), wsHandler.HandleUserOnline)

	// Create HTTP server
	server := &http.Server{
		Addr:           cfg.GetServerAddress(),
		Handler:        router,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on %s", cfg.GetServerAddress())
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Close Redis connection
	if redisClient != nil {
		if err := redisClient.Close(); err != nil {
			log.Printf("Error closing Redis: %v", err)
		} else {
			log.Println("Redis connection closed")
		}
	}

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited successfully")
}
