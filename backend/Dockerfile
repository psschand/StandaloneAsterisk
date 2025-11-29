# Build stage
FROM golang:1.24-alpine AS builder

# Install build dependencies
RUN apk --no-cache add git ca-certificates tzdata

WORKDIR /app

# Cache dependencies first for better layer caching
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Build with optimizations: static binary, stripped, compressed
RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm64 \
    go build -a -installsuffix cgo \
    -ldflags="-s -w -extldflags '-static'" \
    -trimpath \
    -o main cmd/api/main.go

# Compress binary with UPX (optional but saves space)
RUN apk --no-cache add upx && upx --best --lzma main || true

# Runtime stage - Use distroless for minimal size and attack surface
FROM alpine:latest

# Install only essential runtime dependencies
RUN apk --no-cache add --no-progress \
	ca-certificates \
	tzdata \
	wget \
	&& rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/main .

# Copy migrations (if needed at runtime)
COPY --from=builder /app/migrations ./migrations

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8001

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8001/api/v1/health || exit 1

# Set memory limits via environment
ENV GOGC=50 \
    GOMEMLIMIT=256MiB \
    GOMAXPROCS=2

# Run the application
CMD ["./main"]
