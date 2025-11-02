import { useQuery } from '@tanstack/react-query';
import { X, BarChart3, TrendingUp, ThumbsUp, Loader2, FolderOpen } from 'lucide-react';
import apiClient from '../../lib/api';

interface Stats {
  total_entries: number;
  active_entries: number;
  inactive_entries: number;
  total_usage: number;
  by_category: Array<{
    category: string;
    count: number;
  }>;
  most_used: Array<{
    id: number;
    title: string;
    category: string;
    usage_count: number;
  }>;
}

interface Props {
  onClose: () => void;
}

export default function KnowledgeBaseStatsModal({ onClose }: Props) {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['knowledge-base-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/knowledge-base/stats');
      return response.data.data;
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              Knowledge Base Statistics
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Usage analytics and insights
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : stats ? (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">Total Entries</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total_entries}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 font-medium">Active</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{stats.active_entries}</p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium">Inactive</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.inactive_entries}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-700 font-medium">Total Usage</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">{stats.total_usage}</p>
                </div>
              </div>

              {/* Categories Breakdown */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-purple-600" />
                  Entries by Category
                </h3>
                {stats.by_category.length > 0 ? (
                  <div className="space-y-3">
                    {stats.by_category.map((cat) => {
                      const percentage = stats.total_entries > 0 
                        ? (cat.count / stats.total_entries * 100).toFixed(1)
                        : 0;
                      
                      return (
                        <div key={cat.category}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                            <span className="text-sm text-gray-600">{cat.count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No categories yet</p>
                )}
              </div>

              {/* Most Used Entries */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Most Used Entries
                </h3>
                {stats.most_used.length > 0 ? (
                  <div className="space-y-3">
                    {stats.most_used.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{entry.title}</p>
                            <p className="text-xs text-gray-500">{entry.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <BarChart3 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">{entry.usage_count}</span>
                          <span className="text-xs text-gray-500">uses</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No usage data yet</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Stats will appear once the AI agent starts using entries
                    </p>
                  </div>
                )}
              </div>

              {/* Insights */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-blue-600" />
                  Insights & Recommendations
                </h3>
                <div className="space-y-2 text-sm">
                  {stats.active_entries === 0 && (
                    <div className="flex items-start gap-2 text-red-700">
                      <span className="mt-0.5">⚠️</span>
                      <p>No active entries! The AI agent won't have any knowledge to use.</p>
                    </div>
                  )}
                  {stats.active_entries > 0 && stats.active_entries < 10 && (
                    <div className="flex items-start gap-2 text-yellow-700">
                      <span className="mt-0.5">💡</span>
                      <p>You have {stats.active_entries} active entries. Consider adding more to improve AI responses.</p>
                    </div>
                  )}
                  {stats.total_usage === 0 && stats.active_entries > 0 && (
                    <div className="flex items-start gap-2 text-blue-700">
                      <span className="mt-0.5">ℹ️</span>
                      <p>Your knowledge base is ready but hasn't been used yet. Test it with the "Test Query" feature!</p>
                    </div>
                  )}
                  {stats.active_entries >= 10 && (
                    <div className="flex items-start gap-2 text-green-700">
                      <span className="mt-0.5">✅</span>
                      <p>Great! You have {stats.active_entries} active entries providing comprehensive coverage.</p>
                    </div>
                  )}
                  {stats.by_category.length > 5 && (
                    <div className="flex items-start gap-2 text-purple-700">
                      <span className="mt-0.5">🎯</span>
                      <p>You have {stats.by_category.length} categories covering diverse topics.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Failed to load statistics</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
