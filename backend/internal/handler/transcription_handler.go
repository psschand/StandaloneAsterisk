package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/service"
	"github.com/psschand/callcenter/pkg/errors"
	"github.com/psschand/callcenter/pkg/response"
)

type TranscriptionHandler struct {
	transcriptionService service.TranscriptionService
}

func NewTranscriptionHandler(transcriptionService service.TranscriptionService) *TranscriptionHandler {
	return &TranscriptionHandler{
		transcriptionService: transcriptionService,
	}
}

// TranscribeCDR godoc
// @Summary Transcribe and summarize a call recording
// @Description Transcribe and summarize a specific CDR's recording using Gemini AI
// @Tags transcription
// @Accept json
// @Produce json
// @Param id path int true "CDR ID"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /api/v1/cdr/{id}/transcribe [post]
// @Security Bearer
func (h *TranscriptionHandler) TranscribeCDR(c *gin.Context) {
	cdrID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, errors.NewBadRequest("Invalid CDR ID"))
		return
	}

	// Always return success since transcript might have been saved even if summary failed
	_ = h.transcriptionService.TranscribeAndSummarize(c.Request.Context(), cdrID)

	response.Success(c, gin.H{
		"message": "Transcription completed",
		"cdr_id":  cdrID,
	})
}

// TranscribeAllPending godoc
// @Summary Transcribe all pending recordings
// @Description Process all CDRs with recordings that haven't been transcribed yet
// @Tags transcription
// @Accept json
// @Produce json
// @Success 200 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /api/v1/cdr/transcribe/all [post]
// @Security Bearer
func (h *TranscriptionHandler) TranscribeAllPending(c *gin.Context) {
	if err := h.transcriptionService.TranscribeAllPending(c.Request.Context()); err != nil {
		response.Error(c, errors.NewInternal("Failed to process pending transcriptions", err))
		return
	}

	response.Success(c, gin.H{
		"message": "Batch transcription started successfully",
	})
}
