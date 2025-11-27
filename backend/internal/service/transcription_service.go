package service

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"github.com/psschand/callcenter/internal/asterisk"
	"github.com/psschand/callcenter/internal/repository"
	"google.golang.org/api/option"
	"gorm.io/gorm"
)

// TranscriptionService handles call recording transcription and summarization
type TranscriptionService interface {
	TranscribeAndSummarize(ctx context.Context, cdrID int64) error
	TranscribeAllPending(ctx context.Context) error
}

type transcriptionService struct {
	db           *gorm.DB
	cdrRepo      repository.CDRRepository
	geminiAPIKey string
}

// NewTranscriptionService creates a new transcription service
func NewTranscriptionService(db *gorm.DB, cdrRepo repository.CDRRepository, geminiAPIKey string) TranscriptionService {
	return &transcriptionService{
		db:           db,
		cdrRepo:      cdrRepo,
		geminiAPIKey: geminiAPIKey,
	}
}

// TranscribeAndSummarize transcribes and summarizes a call recording using Gemini AI
func (s *transcriptionService) TranscribeAndSummarize(ctx context.Context, cdrID int64) error {
	// Get CDR record
	var cdr asterisk.CDR
	if err := s.db.First(&cdr, cdrID).Error; err != nil {
		return fmt.Errorf("failed to find CDR: %w", err)
	}

	// Check if recording exists
	if cdr.RecordingURL == nil || *cdr.RecordingURL == "" {
		return fmt.Errorf("no recording available for CDR %d", cdrID)
	}

	// Update status to processing
	processing := "processing"
	if err := s.db.Model(&cdr).Update("transcription_status", processing).Error; err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}

	// Get the recording file path
	recordingPath := filepath.Join("/var/spool/asterisk/monitor", *cdr.RecordingURL)
	log.Printf("[Transcription] Processing file: %s", recordingPath)

	// Check if file exists
	if _, err := os.Stat(recordingPath); os.IsNotExist(err) {
		failed := "failed"
		s.db.Model(&cdr).Update("transcription_status", failed)
		log.Printf("[Transcription] File not found: %s", recordingPath)
		return fmt.Errorf("recording file not found: %s", recordingPath)
	}

	// Upload audio to Gemini for transcription
	log.Printf("[Transcription] Calling Gemini API for transcription...")
	transcript, err := s.transcribeAudioWithGemini(ctx, recordingPath)
	if err != nil {
		failed := "failed"
		s.db.Model(&cdr).Update("transcription_status", failed)
		log.Printf("[Transcription] Transcription error: %v", err)
		return fmt.Errorf("transcription failed: %w", err)
	}
	log.Printf("[Transcription] Received transcript of %d characters", len(transcript))

	// Generate summary using Gemini (optional - continue even if this fails)
	log.Printf("[Transcription] Generating summary...")
	summary, err := s.generateSummaryWithGemini(ctx, transcript, cdr)
	if err != nil {
		log.Printf("[Transcription] Summary error (will save transcript only): %v", err)
		// Save transcript even if summary fails (quota issue)
		partialComplete := "completed"
		updates := map[string]interface{}{
			"transcript":           transcript,
			"summary":              "Summary generation failed due to API quota limits. Transcript available above.",
			"transcription_status": partialComplete,
		}
		if err := s.db.Model(&cdr).Updates(updates).Error; err != nil {
			return fmt.Errorf("failed to save transcript: %w", err)
		}
		log.Printf("[Transcription] Saved transcript successfully (summary generation skipped)")
		return nil
	}

	// Update CDR with transcript and summary
	completed := "completed"
	updates := map[string]interface{}{
		"transcript":           transcript,
		"summary":              summary,
		"transcription_status": completed,
	}

	if err := s.db.Model(&cdr).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to save transcript and summary: %w", err)
	}

	return nil
}

// transcribeAudioWithGemini uses Gemini 2.0 Flash to transcribe audio
func (s *transcriptionService) transcribeAudioWithGemini(ctx context.Context, audioPath string) (string, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(s.geminiAPIKey))
	if err != nil {
		return "", fmt.Errorf("failed to create Gemini client: %w", err)
	}
	defer client.Close()

	// Use Gemini 2.0 Flash via explicit endpoint
	model := client.GenerativeModel("gemini-2.0-flash")
	model.SetTemperature(0.1)

	// Read audio file
	audioData, err := os.ReadFile(audioPath)
	if err != nil {
		return "", fmt.Errorf("failed to read audio file: %w", err)
	}

	// Prepare the prompt
	prompt := genai.Text(`Please transcribe this phone call recording. 
Provide a detailed, accurate transcription of all speech in the audio.
Format the output as a conversation with speaker labels (e.g., "Agent:", "Customer:").
If you cannot determine speakers clearly, use "Speaker 1:" and "Speaker 2:".`)

	// Create audio part
	audioPart := genai.Blob{
		MIMEType: "audio/wav",
		Data:     audioData,
	}

	// Generate transcription
	resp, err := model.GenerateContent(ctx, prompt, audioPart)
	if err != nil {
		return "", fmt.Errorf("Gemini API error: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no transcription returned from Gemini")
	}

	// Extract text from response
	var transcriptBuilder strings.Builder
	for _, part := range resp.Candidates[0].Content.Parts {
		if txt, ok := part.(genai.Text); ok {
			transcriptBuilder.WriteString(string(txt))
		}
	}

	transcript := strings.TrimSpace(transcriptBuilder.String())
	if transcript == "" {
		return "", fmt.Errorf("empty transcription returned")
	}

	return transcript, nil
}

// generateSummaryWithGemini generates a call summary using Gemini
func (s *transcriptionService) generateSummaryWithGemini(ctx context.Context, transcript string, cdr asterisk.CDR) (string, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(s.geminiAPIKey))
	if err != nil {
		return "", fmt.Errorf("failed to create Gemini client: %w", err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-2.0-flash")
	model.SetTemperature(0.3)

	// Build context
	var direction string
	if cdr.Direction != nil {
		direction = *cdr.Direction
	} else {
		direction = "unknown"
	}

	var queueName string
	if cdr.QueueName != nil {
		queueName = *cdr.QueueName
	} else {
		queueName = "none"
	}

	// Create prompt for summarization
	prompt := fmt.Sprintf(`Analyze this phone call and provide a concise summary.

Call Details:
- Direction: %s
- Queue: %s
- Duration: %d seconds
- Disposition: %s

Transcript:
%s

Please provide a summary in the following format:

**Call Type:** [Type of call - support, sales, complaint, etc.]

**Key Points:**
- [Main topic or issue discussed]
- [Important details mentioned]
- [Actions taken or promised]

**Outcome:** [How the call ended - resolved, escalated, follow-up needed, etc.]

**Sentiment:** [Customer sentiment - positive, neutral, negative]

Keep the summary concise and professional.`,
		direction,
		queueName,
		cdr.Duration,
		func() string {
			if cdr.Disposition != nil {
				return *cdr.Disposition
			}
			return "UNKNOWN"
		}(),
		transcript)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("Gemini API error: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no summary returned from Gemini")
	}

	var summaryBuilder strings.Builder
	for _, part := range resp.Candidates[0].Content.Parts {
		if txt, ok := part.(genai.Text); ok {
			summaryBuilder.WriteString(string(txt))
		}
	}

	summary := strings.TrimSpace(summaryBuilder.String())
	if summary == "" {
		return "", fmt.Errorf("empty summary returned")
	}

	return summary, nil
}

// TranscribeAllPending processes all CDRs with recordings but no transcripts
func (s *transcriptionService) TranscribeAllPending(ctx context.Context) error {
	var cdrs []asterisk.CDR

	// Find CDRs with recordings but no transcript or pending status
	if err := s.db.Where("recording_url IS NOT NULL AND recording_url != ''").
		Where("(transcript IS NULL OR transcript = '') OR transcription_status = 'pending'").
		Limit(10). // Process in batches
		Find(&cdrs).Error; err != nil {
		return fmt.Errorf("failed to find pending CDRs: %w", err)
	}

	for _, cdr := range cdrs {
		// Process each CDR (non-blocking - could be moved to background job)
		if err := s.TranscribeAndSummarize(ctx, cdr.ID); err != nil {
			// Log error but continue with next
			fmt.Printf("Failed to process CDR %d: %v\n", cdr.ID, err)
			continue
		}
	}

	return nil
}
