package chat

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"github.com/ledongthuc/pdf"
	"github.com/psschand/callcenter/pkg/errors"
	"gorm.io/gorm"
)

// DocumentUploadService handles document uploads and text extraction
type DocumentUploadService struct {
	db                   *gorm.DB
	knowledgeBaseService *KnowledgeBaseService
}

// NewDocumentUploadService creates a new document upload service
func NewDocumentUploadService(db *gorm.DB, kbService *KnowledgeBaseService) *DocumentUploadService {
	return &DocumentUploadService{
		db:                   db,
		knowledgeBaseService: kbService,
	}
}

// UploadDocumentRequest represents document upload data
type UploadDocumentRequest struct {
	TenantID string `json:"tenant_id"`
	Category string `json:"category" binding:"required"`
	Language string `json:"language"`
	Priority int    `json:"priority"`
}

// UploadDocumentResponse represents upload result
type UploadDocumentResponse struct {
	EntriesCreated int      `json:"entries_created"`
	Filename       string   `json:"filename"`
	FileType       string   `json:"file_type"`
	TextExtracted  int      `json:"text_extracted"`
	Chunks         []string `json:"chunks,omitempty"`
}

// ProcessDocument processes uploaded document and creates KB entries
func (s *DocumentUploadService) ProcessDocument(ctx context.Context, file *multipart.FileHeader, req *UploadDocumentRequest) (*UploadDocumentResponse, error) {
	// Validate file type
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".pdf" && ext != ".txt" && ext != ".doc" && ext != ".docx" {
		return nil, errors.NewValidation("only PDF, TXT, DOC, and DOCX files are supported")
	}

	// Open file
	src, err := file.Open()
	if err != nil {
		return nil, errors.Wrap(err, "failed to open file")
	}
	defer src.Close()

	// Extract text based on file type
	var text string
	switch ext {
	case ".pdf":
		text, err = s.extractTextFromPDF(src)
	case ".txt":
		text, err = s.extractTextFromTXT(src)
	case ".doc", ".docx":
		text, err = s.extractTextFromDOCX(src)
	default:
		return nil, errors.NewValidation("unsupported file type")
	}

	if err != nil {
		return nil, errors.Wrap(err, "failed to extract text from document")
	}

	if len(text) == 0 {
		return nil, errors.NewValidation("no text found in document")
	}

	// Split text into chunks (max 2000 chars per chunk for better context)
	chunks := s.splitTextIntoChunks(text, 2000)

	// Create knowledge base entries
	entriesCreated := 0
	for i, chunk := range chunks {
		if len(strings.TrimSpace(chunk)) < 50 {
			continue // Skip very short chunks
		}

		// Try to create a meaningful title from first 100 chars
		title := strings.TrimSpace(chunk)
		if len(title) > 100 {
			title = title[:100] + "..."
		}

		kbEntry := &CreateKBRequest{
			TenantID: req.TenantID,
			Category: req.Category,
			Title:    fmt.Sprintf("%s - Part %d", filepath.Base(file.Filename), i+1),
			Question: title,
			Answer:   chunk,
			Keywords: s.extractKeywords(chunk),
			Language: req.Language,
			Priority: req.Priority,
			IsActive: true,
		}

		_, err := s.knowledgeBaseService.CreateEntry(ctx, kbEntry)
		if err != nil {
			// Log error but continue with other chunks
			continue
		}
		entriesCreated++
	}

	return &UploadDocumentResponse{
		EntriesCreated: entriesCreated,
		Filename:       file.Filename,
		FileType:       ext,
		TextExtracted:  len(text),
		Chunks:         chunks[:min(3, len(chunks))], // Return first 3 chunks as preview
	}, nil
}

// extractTextFromPDF extracts text from PDF file
func (s *DocumentUploadService) extractTextFromPDF(reader io.ReaderAt) (string, error) {
	// Get file size
	var buf []byte
	if seeker, ok := reader.(io.ReadSeeker); ok {
		size, err := seeker.Seek(0, io.SeekEnd)
		if err != nil {
			return "", err
		}
		seeker.Seek(0, io.SeekStart)

		buf = make([]byte, size)
		if _, err := io.ReadFull(seeker.(io.Reader), buf); err != nil {
			return "", err
		}
	}

	pdfReader, err := pdf.NewReader(reader, int64(len(buf)))
	if err != nil {
		return "", err
	}

	var text strings.Builder
	numPages := pdfReader.NumPage()

	for pageNum := 1; pageNum <= numPages; pageNum++ {
		page := pdfReader.Page(pageNum)
		if page.V.IsNull() {
			continue
		}

		pageText, err := page.GetPlainText(nil)
		if err != nil {
			continue // Skip pages with errors
		}

		text.WriteString(pageText)
		text.WriteString("\n\n")
	}

	return text.String(), nil
}

// extractTextFromTXT extracts text from TXT file
func (s *DocumentUploadService) extractTextFromTXT(reader io.Reader) (string, error) {
	buf := new(strings.Builder)
	_, err := io.Copy(buf, reader)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

// extractTextFromDOCX extracts text from DOCX file
// Note: This is a simplified version. For production, use a library like github.com/nguyenthenguyen/docx
func (s *DocumentUploadService) extractTextFromDOCX(reader io.Reader) (string, error) {
	// For now, treat as binary and try to extract readable text
	buf := new(strings.Builder)
	_, err := io.Copy(buf, reader)
	if err != nil {
		return "", err
	}

	// Basic text extraction - in production use proper DOCX parser
	text := buf.String()
	// Remove non-printable characters
	cleaned := strings.Map(func(r rune) rune {
		if r >= 32 && r <= 126 || r == '\n' || r == '\r' || r == '\t' {
			return r
		}
		return -1
	}, text)

	return cleaned, nil
}

// splitTextIntoChunks splits text into manageable chunks
func (s *DocumentUploadService) splitTextIntoChunks(text string, maxChunkSize int) []string {
	var chunks []string

	// Split by paragraphs first
	paragraphs := strings.Split(text, "\n\n")

	var currentChunk strings.Builder
	for _, para := range paragraphs {
		para = strings.TrimSpace(para)
		if len(para) == 0 {
			continue
		}

		// If adding this paragraph exceeds max size, save current chunk and start new one
		if currentChunk.Len()+len(para)+2 > maxChunkSize && currentChunk.Len() > 0 {
			chunks = append(chunks, currentChunk.String())
			currentChunk.Reset()
		}

		if currentChunk.Len() > 0 {
			currentChunk.WriteString("\n\n")
		}
		currentChunk.WriteString(para)

		// If single paragraph is too large, split by sentences
		if currentChunk.Len() > maxChunkSize {
			sentences := strings.Split(currentChunk.String(), ". ")
			currentChunk.Reset()

			for _, sentence := range sentences {
				if currentChunk.Len()+len(sentence)+2 > maxChunkSize && currentChunk.Len() > 0 {
					chunks = append(chunks, currentChunk.String())
					currentChunk.Reset()
				}
				if currentChunk.Len() > 0 {
					currentChunk.WriteString(". ")
				}
				currentChunk.WriteString(sentence)
			}
		}
	}

	// Add remaining chunk
	if currentChunk.Len() > 0 {
		chunks = append(chunks, currentChunk.String())
	}

	return chunks
}

// extractKeywords extracts important keywords from text
func (s *DocumentUploadService) extractKeywords(text string) string {
	// Simple keyword extraction - in production use NLP library
	words := strings.Fields(strings.ToLower(text))

	// Common stop words to exclude
	stopWords := map[string]bool{
		"the": true, "a": true, "an": true, "and": true, "or": true, "but": true,
		"in": true, "on": true, "at": true, "to": true, "for": true, "of": true,
		"with": true, "by": true, "from": true, "as": true, "is": true, "was": true,
		"be": true, "been": true, "being": true, "have": true, "has": true, "had": true,
		"do": true, "does": true, "did": true, "will": true, "would": true, "could": true,
		"should": true, "may": true, "might": true, "can": true, "this": true, "that": true,
		"these": true, "those": true, "i": true, "you": true, "he": true, "she": true,
		"it": true, "we": true, "they": true, "what": true, "which": true, "who": true,
		"when": true, "where": true, "why": true, "how": true,
	}

	wordCount := make(map[string]int)
	for _, word := range words {
		// Clean word
		word = strings.Trim(word, ".,!?;:\"'()[]{}")
		if len(word) < 4 || stopWords[word] {
			continue
		}
		wordCount[word]++
	}

	// Get top 10 most frequent words
	type wordFreq struct {
		word  string
		count int
	}
	var frequencies []wordFreq
	for word, count := range wordCount {
		frequencies = append(frequencies, wordFreq{word, count})
	}

	// Simple sort by frequency
	for i := 0; i < len(frequencies); i++ {
		for j := i + 1; j < len(frequencies); j++ {
			if frequencies[j].count > frequencies[i].count {
				frequencies[i], frequencies[j] = frequencies[j], frequencies[i]
			}
		}
	}

	// Take top 10
	var keywords []string
	for i := 0; i < min(10, len(frequencies)); i++ {
		keywords = append(keywords, frequencies[i].word)
	}

	return strings.Join(keywords, ", ")
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// KnowledgeBaseDocument represents an uploaded document
type KnowledgeBaseDocument struct {
	ID             int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	TenantID       string    `gorm:"column:tenant_id;type:varchar(64);not null;index" json:"tenant_id"`
	Filename       string    `gorm:"column:filename;type:varchar(255);not null" json:"filename"`
	FileType       string    `gorm:"column:file_type;type:varchar(10);not null" json:"file_type"`
	FileSize       int64     `gorm:"column:file_size;not null" json:"file_size"`
	Category       string    `gorm:"column:category;type:varchar(100);not null" json:"category"`
	EntriesCreated int       `gorm:"column:entries_created;default:0" json:"entries_created"`
	UploadedBy     int64     `gorm:"column:uploaded_by;not null" json:"uploaded_by"`
	CreatedAt      time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

// TableName specifies the table name
func (KnowledgeBaseDocument) TableName() string {
	return "knowledge_base_documents"
}
