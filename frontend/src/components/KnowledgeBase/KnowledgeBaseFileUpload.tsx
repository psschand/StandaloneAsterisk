import { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api';

interface KnowledgeBaseFileUploadProps {
  onUploadComplete?: () => void;
}

interface Website {
  id: number;
  name: string;
  domain: string;
}

export default function KnowledgeBaseFileUpload({ onUploadComplete }: KnowledgeBaseFileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState(5);
  const [websiteId, setWebsiteId] = useState<string>(''); // Empty = tenant-wide
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['General', 'Policies', 'Products', 'Support', 'FAQs', 'Procedures', 'Guidelines'];
  const acceptedTypes = ['.txt', '.csv', '.pdf', '.doc', '.docx'];

  // Fetch websites
  const { data: websites = [] } = useQuery<Website[]>({
    queryKey: ['websites'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/websites');
      return response.data.data || [];
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(fileExt)) {
        setMessage({ type: 'error', text: `Invalid file type. Allowed: ${acceptedTypes.join(', ')}` });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 10MB' });
        return;
      }

      setSelectedFile(file);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', category);
    formData.append('priority', priority.toString());
    formData.append('language', 'en');
    if (websiteId) {
      formData.append('website_id', websiteId);
    }

    setUploading(true);
    setUploadProgress(0);
    setMessage(null);

    try {
      await apiClient.post('/api/v1/knowledge-base/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      setMessage({
        type: 'success',
        text: `File uploaded successfully!`,
      });
      setSelectedFile(null);
      setUploadProgress(0);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error?.message || 'Upload failed. Please try again.',
      });
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Upload Document
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Upload PDF, Word, CSV, or TXT files to add to the knowledge base
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {message.text}
            </p>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
          className="hidden"
          id="file-upload"
        />
        
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-blue-600">
              <FileText className="w-12 h-12" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              onClick={handleRemoveFile}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Remove
            </button>
          </div>
        ) : (
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PDF, DOCX, CSV, TXT (max 10MB)
            </p>
          </label>
        )}
      </div>

      {selectedFile && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Website (Optional)
            </label>
            <select
              value={websiteId}
              onChange={(e) => setWebsiteId(e.target.value)}
              disabled={uploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="">All Websites (Tenant-wide)</option>
              {websites.map((website) => (
                <option key={website.id} value={website.id}>
                  {website.name} ({website.domain})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Leave as "All Websites" to make this file available to all your websites, or select a specific website to restrict access
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={uploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                disabled={uploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                  <option key={p} value={p}>
                    {p} {p >= 8 ? '(High)' : p <= 3 ? '(Low)' : '(Medium)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="text-gray-900 font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Document
              </>
            )}
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Supported File Types</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>PDF</strong> - Text will be automatically extracted</li>
          <li>• <strong>Word (DOC/DOCX)</strong> - Document content will be parsed</li>
          <li>• <strong>CSV</strong> - Converted to searchable text format</li>
          <li>• <strong>TXT</strong> - Plain text files</li>
        </ul>
        <p className="text-xs text-blue-600 mt-3">
          All uploaded files are searchable by agents and AI assistants.
        </p>
      </div>
    </div>
  );
}
