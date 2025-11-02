import { useState } from 'react';
import { X, Upload, Loader2, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import apiClient from '../../lib/api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportKnowledgeBaseModal({ onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      
      const fileExt = selectedFile.name.toLowerCase().split('.').pop();
      
      // Check if it's a document file (PDF, DOCX, TXT)
      if (fileExt === 'pdf' || fileExt === 'docx' || fileExt === 'doc' || fileExt === 'txt') {
        // Document files will be processed on the server
        return;
      }
      
      // Read CSV file
      const reader = new FileReader();
      reader.onload = (event) => {
        const csv = event.target?.result as string;
        try {
          const entries = parseCSV(csv);
          setJsonData(JSON.stringify(entries, null, 2));
        } catch (err: any) {
          setError(err.message);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const parseCSV = (csv: string) => {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have a header row and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const entries = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const entry: any = {};
      
      headers.forEach((header, index) => {
        if (values[index]) {
          entry[header] = values[index];
        }
      });

      // Validate required fields
      if (!entry.category || !entry.question || !entry.answer) {
        continue; // Skip invalid entries
      }

      // Set defaults
      entry.title = entry.title || entry.question.substring(0, 50);
      entry.keywords = entry.keywords || '';
      entry.language = entry.language || 'en';
      entry.priority = entry.priority ? parseInt(entry.priority) : 5;
      entry.is_active = entry.is_active !== 'false';

      entries.push(entry);
    }

    return entries;
  };

  const handleImport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if it's a document upload
      if (file) {
        const fileExt = file.name.toLowerCase().split('.').pop();
        if (fileExt === 'pdf' || fileExt === 'docx' || fileExt === 'doc' || fileExt === 'txt') {
          // Upload document for processing
          const formData = new FormData();
          formData.append('file', file);
          formData.append('category', 'Documents');
          formData.append('language', 'en');
          formData.append('priority', '5');

          const response = await apiClient.post('/api/v1/knowledge-base/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          const result = response.data.data;
          setSuccess(true);
          setImportedCount(result.entries_created || 0);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
          return;
        }
      }

      // Handle CSV/JSON import
      if (!jsonData.trim()) {
        setError('Please paste JSON data or upload a file');
        return;
      }

      const entries = JSON.parse(jsonData);
      
      if (!Array.isArray(entries)) {
        throw new Error('Data must be an array of entries');
      }

      await apiClient.post('/api/v1/knowledge-base/import', { entries });
      
      setSuccess(true);
      setImportedCount(entries.length);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to import entries');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleCSV = `category,title,question,answer,keywords,language,priority,is_active
Shipping,Shipping Time,How long does shipping take?,Standard shipping takes 3-5 business days,"shipping,delivery,time",en,5,true
Returns,Return Policy,What is your return policy?,We accept returns within 30 days,"return,refund,policy",en,5,true`;

  const sampleJSON = `[
  {
    "category": "Shipping",
    "title": "Shipping Time",
    "question": "How long does shipping take?",
    "answer": "Standard shipping takes 3-5 business days",
    "keywords": "shipping, delivery, time",
    "language": "en",
    "priority": 5,
    "is_active": true
  }
]`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-600" />
              Import Knowledge Base Entries
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload CSV file or paste JSON data
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-900">Import Successful!</h4>
                <p className="text-sm text-green-700 mt-1">
                  Successfully imported {importedCount} entries
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-900">Import Failed</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File (CSV, PDF, DOCX, TXT)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <label className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700 font-medium">
                  Choose a file
                </span>
                <input
                  type="file"
                  accept=".csv,.pdf,.docx,.doc,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">CSV for bulk import, PDF/DOCX/TXT for document processing</p>
              {file && (
                <p className="text-sm text-gray-700 mt-2">
                  Selected: <strong>{file.name}</strong>
                </p>
              )}
            </div>
          </div>

          {/* JSON Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Paste JSON Data
            </label>
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder={sampleJSON}
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* Sample Formats */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Sample CSV Format:</h4>
            <pre className="text-xs text-gray-700 bg-white p-3 rounded border border-gray-200 overflow-x-auto">
              {sampleCSV}
            </pre>
            <h4 className="text-sm font-medium text-gray-900 mt-4 mb-3">Sample JSON Format:</h4>
            <pre className="text-xs text-gray-700 bg-white p-3 rounded border border-gray-200 overflow-x-auto">
              {sampleJSON}
            </pre>
          </div>

          {/* Required Fields */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Required Fields:</h4>
            <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
              <li><strong>category</strong> - Category name (e.g., Shipping, Returns)</li>
              <li><strong>question</strong> - The question customers ask</li>
              <li><strong>answer</strong> - The answer to provide</li>
            </ul>
            <h4 className="text-sm font-medium text-blue-900 mt-3 mb-2">Optional Fields:</h4>
            <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
              <li><strong>title</strong> - Short title (defaults to first 50 chars of question)</li>
              <li><strong>keywords</strong> - Comma-separated keywords for search</li>
              <li><strong>language</strong> - Language code (defaults to "en")</li>
              <li><strong>priority</strong> - Priority 1-10 (defaults to 5)</li>
              <li><strong>is_active</strong> - true/false (defaults to true)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isLoading || !jsonData.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import Entries
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
