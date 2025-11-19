package chat

import (
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"mime/multipart"
	"os"
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
	TenantID  string `json:"tenant_id"`
	WebsiteID *int64 `json:"website_id"` // Optional: specific website, null = tenant-wide
	Category  string `json:"category" binding:"required"`
	Language  string `json:"language"`
	Priority  int    `json:"priority"`
}

// UploadDocumentResponse represents upload result
type UploadDocumentResponse struct {
	EntriesCreated int      `json:"entries_created"`
	Filename       string   `json:"filename"`
	FileType       string   `json:"file_type"`
	TextExtracted  int      `json:"text_extracted"`
	Chunks         []string `json:"chunks,omitempty"`
}

// ProcessDocument processes uploaded document and creates KB entry with file upload
func (s *DocumentUploadService) ProcessDocument(ctx context.Context, file *multipart.FileHeader, req *UploadDocumentRequest) (*UploadDocumentResponse, error) {
	// Validate file type
	ext := strings.ToLower(filepath.Ext(file.Filename))
	supportedExts := map[string]bool{
		".pdf": true, ".txt": true, ".doc": true, ".docx": true, ".csv": true,
	}
	if !supportedExts[ext] {
		return nil, errors.NewValidation("only PDF, TXT, CSV, DOC, and DOCX files are supported")
	}

	// Open file
	src, err := file.Open()
	if err != nil {
		return nil, errors.Wrap(err, "failed to open file")
	}
	defer src.Close()

	// Save file to storage first
	storagePath := "/app/storage/knowledge_base"
	if envPath := filepath.Clean("/app/storage/knowledge_base"); envPath != "" {
		storagePath = envPath
	}

	tenantDir := filepath.Join(storagePath, req.TenantID)
	if err := ensureDir(tenantDir); err != nil {
		return nil, errors.Wrap(err, "failed to create storage directory")
	}

	// Generate unique filename
	timestamp := time.Now().UnixNano()
	filename := fmt.Sprintf("%d_%s", timestamp, sanitizeFilename(file.Filename))
	filePath := filepath.Join(tenantDir, filename)

	// Save file
	dst, err := createFile(filePath)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create destination file")
	}
	defer dst.Close()

	// Reset source reader
	src.Close()
	src, err = file.Open()
	if err != nil {
		return nil, err
	}

	if _, err := io.Copy(dst, src); err != nil {
		return nil, errors.Wrap(err, "failed to save file")
	}
	dst.Close() // Close early so we can read it

	// Extract text based on file type
	var extractedText string
	switch ext {
	case ".pdf":
		extractedText, err = s.extractPDFText(filePath)
	case ".txt":
		extractedText, err = s.extractPlainText(filePath)
	case ".csv":
		extractedText, err = s.extractCSVText(filePath)
	case ".doc", ".docx":
		extractedText, err = s.extractWordText(filePath)
	}

	if err != nil {
		// Don't fail - just log and store file without extracted text
		extractedText = fmt.Sprintf("[Text extraction failed: %v]\nFile stored successfully for manual review.", err)
	}

	// Generate title from filename
	title := strings.TrimSuffix(filepath.Base(file.Filename), ext)
	title = strings.ReplaceAll(title, "_", " ")
	title = strings.ReplaceAll(title, "-", " ")

	// Insert directly into knowledge_base_articles table with file support
	fileTypeClean := strings.TrimPrefix(ext, ".")

	query := `
		INSERT INTO knowledge_base_articles 
		(tenant_id, website_id, title, content, content_type,
		 file_type, file_path, file_size, file_original_name, extracted_text,
		 category, tags, priority, is_active, created_at, updated_at)
		VALUES (?, ?, ?, '', 'file', ?, ?, ?, ?, ?, ?, '[]', ?, true, NOW(), NOW())
	`

	result := s.db.Exec(query,
		req.TenantID,
		req.WebsiteID, // website_id from request (NULL for tenant-wide, or specific website ID)
		title,
		fileTypeClean,
		filePath,
		file.Size,
		file.Filename,
		extractedText,
		req.Category,
		req.Priority,
	)

	if result.Error != nil {
		// Clean up file on error
		removeFile(filePath)
		return nil, errors.Wrap(result.Error, "failed to create KB article")
	}

	// Get inserted ID
	var lastID int64
	s.db.Raw("SELECT LAST_INSERT_ID()").Scan(&lastID)

	return &UploadDocumentResponse{
		EntriesCreated: 1, // One article per file
		Filename:       file.Filename,
		FileType:       fileTypeClean,
		TextExtracted:  len(extractedText),
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

// Helper functions for file operations
func ensureDir(path string) error {
	return os.MkdirAll(path, 0755)
}

func createFile(path string) (*os.File, error) {
	return os.Create(path)
}

func removeFile(path string) error {
	return os.Remove(path)
}

func sanitizeFilename(filename string) string {
	// Remove unsafe characters
	safe := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '.' || r == '-' || r == '_' {
			return r
		}
		return '_'
	}, filename)
	return safe
}

// extractPDFText extracts text from PDF file path
func (s *DocumentUploadService) extractPDFText(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		return "", err
	}

	pdfReader, err := pdf.NewReader(file, stat.Size())
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

// extractPlainText extracts text from plain text file
func (s *DocumentUploadService) extractPlainText(filePath string) (string, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

// extractCSVText extracts text from CSV file
func (s *DocumentUploadService) extractCSVText(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return "", err
	}

	// Convert CSV to formatted text
	var builder strings.Builder

	for i, record := range records {
		if i == 0 {
			builder.WriteString("COLUMNS: ")
		}
		builder.WriteString(strings.Join(record, " | "))
		builder.WriteString("\n")
	}

	return builder.String(), nil
}

// extractWordText extracts text from Word document
func (s *DocumentUploadService) extractWordText(filePath string) (string, error) {
	// For now, use the existing extractTextFromDOCX method
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	return s.extractTextFromDOCX(file)
}
