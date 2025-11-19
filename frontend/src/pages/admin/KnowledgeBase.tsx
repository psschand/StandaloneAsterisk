import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Download,
  Upload,
  TestTube,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  FolderOpen,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import KnowledgeBaseForm from '../../components/forms/KnowledgeBaseForm';
import TestQueryModal from '../../components/modals/TestQueryModal';
import ImportModal from '../../components/modals/ImportKnowledgeBaseModal';
import StatsModal from '../../components/modals/KnowledgeBaseStatsModal';
import KnowledgeBaseFileUpload from '../../components/KnowledgeBase/KnowledgeBaseFileUpload';

interface KnowledgeBaseEntry {
  id: number;
  tenant_id: string;
  category: string;
  title: string;
  question: string;
  answer: string;
  keywords: string;
  language: string;
  priority: number;
  is_active: boolean;
  usage_count: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  category: string;
  count: number;
}

export default function KnowledgeBase() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeBaseEntry | undefined>(undefined);

  // Fetch knowledge base entries
  const { data: entries = [], isLoading } = useQuery<KnowledgeBaseEntry[]>({
    queryKey: ['knowledge-base', searchTerm, selectedCategory, selectedLanguage, showActiveOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedLanguage) params.append('language', selectedLanguage);
      if (showActiveOnly) params.append('is_active', 'true');
      
      const response = await apiClient.get(`/api/v1/knowledge-base?${params.toString()}`);
      return response.data.data || [];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['knowledge-base-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/knowledge-base/categories');
      return response.data.data || [];
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<KnowledgeBaseEntry>) => {
      if (editingEntry) {
        return await apiClient.put(`/api/v1/knowledge-base/${editingEntry.id}`, data);
      } else {
        return await apiClient.post('/api/v1/knowledge-base', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-categories'] });
      setShowForm(false);
      setEditingEntry(undefined);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/api/v1/knowledge-base/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-categories'] });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return await apiClient.put(`/api/v1/knowledge-base/${id}`, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
  });

  // Export to CSV
  const handleExport = async () => {
    try {
      const response = await apiClient.get('/api/v1/knowledge-base/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `knowledge-base-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleEdit = (entry: KnowledgeBaseEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (id: number, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id, is_active: !currentStatus });
  };

  const handleAddNew = () => {
    setEditingEntry(undefined);
    setShowForm(true);
  };

  const filteredEntries = entries;

  // Group entries by category
  const entriesByCategory = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {} as Record<string, KnowledgeBaseEntry[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Knowledge Base
                </h1>
                <p className="text-gray-600 text-sm max-w-2xl">
                  Manage FAQs, documentation, and knowledge articles that power your AI agent's responses
                </p>
              </div>
            </div>
            
            {/* Action Buttons - Organized in groups */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Primary Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Entry</span>
                </button>
              </div>
              
              {/* Secondary Actions */}
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload Files</span>
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Import CSV</span>
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
              
              {/* Utility Actions */}
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <button
                  onClick={() => setShowTestModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium"
                >
                  <TestTube className="w-4 h-4" />
                  <span className="hidden sm:inline">Test Query</span>
                </button>
                <button
                  onClick={() => setShowStatsModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Statistics</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats - Enhanced Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Entries</p>
                <p className="text-3xl font-bold text-gray-900">{entries.length}</p>
              </div>
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Categories</p>
                <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
              </div>
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Active</p>
                <p className="text-3xl font-bold text-green-600">
                  {entries.filter(e => e.is_active).length}
                </p>
              </div>
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Usage</p>
                <p className="text-3xl font-bold text-gray-900">
                  {entries.reduce((sum, e) => sum + (e.usage_count || 0), 0)}
                </p>
              </div>
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Enhanced Design */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Search & Filter</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.count})
                </option>
              ))}
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
            >
              <option value="">All Languages</option>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>

            <label className="flex items-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Active only</span>
            </label>
          </div>
        </div>

        {/* Entries List */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Loading knowledge base entries...</p>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No entries found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCategory || selectedLanguage
                  ? 'Try adjusting your filters to see more results'
                  : 'Get started by adding your first knowledge base entry'}
              </p>
              <button
                onClick={handleAddNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Your First Entry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(entriesByCategory).map(([category, categoryEntries]) => (
              <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <FolderOpen className="w-5 h-5 text-gray-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{category}</h3>
                    <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-600 shadow-sm">
                      {categoryEntries.length} {categoryEntries.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {categoryEntries.map((entry) => (
                    <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          {/* Title and Badges */}
                          <div className="flex items-start gap-3 mb-3">
                            <h4 className="text-lg font-semibold text-gray-900 flex-1">{entry.title}</h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {entry.is_active ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                  <CheckCircle className="w-3 h-3" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                  Inactive
                                </span>
                              )}
                              {entry.priority > 5 && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  High Priority
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Question */}
                          <div className="mb-3 bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold text-blue-700">Q:</span> {entry.question}
                            </p>
                          </div>
                          
                          {/* Answer */}
                          <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-3 rounded-r-lg">
                            <p className="text-sm text-gray-800">
                              <span className="font-semibold text-green-700">A:</span>{' '}
                              {entry.answer.length > 200 ? `${entry.answer.substring(0, 200)}...` : entry.answer}
                            </p>
                          </div>
                          
                          {/* Metadata Footer */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md">
                              <BarChart3 className="w-3.5 h-3.5" />
                              <span className="font-medium">{entry.usage_count || 0}</span> uses
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-100 rounded-md">
                              <ThumbsUp className="w-3.5 h-3.5 text-green-600" />
                              <span className="font-medium">{entry.helpful_count || 0}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 rounded-md">
                              <ThumbsDown className="w-3.5 h-3.5 text-red-600" />
                              <span className="font-medium">{entry.not_helpful_count || 0}</span>
                            </span>
                            <span className="px-2 py-1 bg-purple-100 rounded-md text-purple-700 font-medium">
                              {entry.keywords}
                            </span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleActive(entry.id, entry.is_active)}
                            className={`p-2.5 rounded-lg transition-all shadow-sm hover:shadow ${
                              entry.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                            }`}
                            title={entry.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-2.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all shadow-sm hover:shadow border border-blue-200"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all shadow-sm hover:shadow border border-red-200"
                            title="Delete"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {showForm && (
          <KnowledgeBaseForm
            entry={editingEntry}
            categories={categories.map(c => c.category)}
            onClose={() => {
              setShowForm(false);
              setEditingEntry(undefined);
            }}
            onSave={(data) => saveMutation.mutate(data)}
            isLoading={saveMutation.isPending}
          />
        )}

        {showTestModal && (
          <TestQueryModal
            onClose={() => setShowTestModal(false)}
          />
        )}

        {showImportModal && (
          <ImportModal
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
              queryClient.invalidateQueries({ queryKey: ['knowledge-base-categories'] });
            }}
          />
        )}

        {showStatsModal && (
          <StatsModal
            onClose={() => setShowStatsModal(false)}
          />
        )}

        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h2 className="text-xl font-bold text-gray-900">Upload Documents</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <KnowledgeBaseFileUpload
                  onUploadComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
                    queryClient.invalidateQueries({ queryKey: ['knowledge-base-categories'] });
                    setShowUploadModal(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
