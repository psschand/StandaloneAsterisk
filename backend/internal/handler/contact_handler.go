package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/helpdesk"
	"github.com/psschand/callcenter/internal/service"
	"github.com/psschand/callcenter/pkg/response"
)

type ContactHandler struct {
	contactService service.ContactService
}

func NewContactHandler(contactService service.ContactService) *ContactHandler {
	return &ContactHandler{
		contactService: contactService,
	}
}

type CreateContactRequest struct {
	FirstName    string                 `json:"first_name" binding:"required"`
	LastName     string                 `json:"last_name"`
	Email        string                 `json:"email"`
	Phone        string                 `json:"phone"`
	Company      string                 `json:"company"`
	Tags         map[string]interface{} `json:"tags"`
	CustomFields map[string]interface{} `json:"custom_fields"`
}

func (h *ContactHandler) Create(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req CreateContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	contact := &helpdesk.Contact{
		TenantID:     tenantID,
		Name:         req.FirstName + " " + req.LastName,
		Email:        req.Email,
		Phone:        &req.Phone,
		Company:      &req.Company,
		Tags:         req.Tags,
		CustomFields: req.CustomFields,
	}

	if err := h.contactService.Create(c.Request.Context(), contact); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, contact)
}

func (h *ContactHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")

	var contacts []helpdesk.Contact
	var total int64
	var err error

	if search != "" {
		contacts, total, err = h.contactService.Search(c.Request.Context(), tenantID, search, page, limit)
	} else {
		contacts, total, err = h.contactService.GetByTenant(c.Request.Context(), tenantID, page, limit)
	}

	if err != nil {
		response.Error(c, err)
		return
	}

	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}

	meta := &response.Meta{
		Page:       page,
		PageSize:   limit,
		TotalPages: totalPages,
		TotalCount: int(total),
	}

	response.SuccessWithMeta(c, contacts, meta)
}

func (h *ContactHandler) Get(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid ID"})
		return
	}

	contact, err := h.contactService.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, contact)
}

func (h *ContactHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid ID"})
		return
	}

	var req CreateContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	contact, err := h.contactService.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	contact.Name = req.FirstName + " " + req.LastName
	contact.Email = req.Email
	contact.Phone = &req.Phone
	contact.Company = &req.Company
	contact.Tags = req.Tags
	contact.CustomFields = req.CustomFields

	if err := h.contactService.Update(c.Request.Context(), contact); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, contact)
}

func (h *ContactHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid ID"})
		return
	}

	if err := h.contactService.Delete(c.Request.Context(), id); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

func (h *ContactHandler) GetByPhone(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	phone := c.Query("phone")

	if phone == "" {
		response.ValidationError(c, map[string]string{"phone": "required"})
		return
	}

	contact, err := h.contactService.GetByPhone(c.Request.Context(), tenantID, phone)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, contact)
}
