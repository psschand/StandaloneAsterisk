import { useState } from 'react';
import { X, Send, Loader2, CheckCircle, AlertCircle, Brain } from 'lucide-react';
import apiClient from '../../lib/api';

interface TestResult {
  answer: string;
  confidence: number;
  knowledge_base_ids: number[];
  intent?: string;
  sentiment?: number;
}

interface Props {
  onClose: () => void;
}

export default function TestQueryModal({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.post('/api/v1/knowledge-base/test', {
        query: query.trim(),
      });

      setResult(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to test query');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTest();
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.3) return { label: 'Positive', color: 'text-green-600' };
    if (sentiment < -0.3) return { label: 'Negative', color: 'text-red-600' };
    return { label: 'Neutral', color: 'text-gray-600' };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Brain className="w-6 h-6 text-green-600" />
              Test AI Agent Response
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              See how the AI agent will respond to customer queries
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
          {/* Query Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Question
            </label>
            <div className="flex gap-2">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., How long does shipping take?"
                rows={3}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleTest}
                disabled={isLoading || !query.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-fit"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Test
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Press Enter to test (Shift+Enter for new line)
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-900">Test Failed</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              {/* AI Response */}
              <div className="bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Brain className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">AI Agent Response:</h4>
                    <p className="text-gray-800 whitespace-pre-wrap">{result.answer}</p>
                  </div>
                </div>
              </div>

              {/* Analysis */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Response Analysis</h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Confidence */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            result.confidence >= 0.8
                              ? 'bg-green-600'
                              : result.confidence >= 0.5
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${result.confidence * 100}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium px-2 py-0.5 rounded ${getConfidenceColor(result.confidence)}`}>
                        {getConfidenceLabel(result.confidence)} ({Math.round(result.confidence * 100)}%)
                      </span>
                    </div>
                  </div>

                  {/* Knowledge Base Usage */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Knowledge Base</p>
                    <div className="flex items-center gap-2">
                      {result.knowledge_base_ids.length > 0 ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            Used ({result.knowledge_base_ids.length} entries)
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-700">
                            Not used (Gemini only)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Intent */}
                  {result.intent && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Detected Intent</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {result.intent}
                      </span>
                    </div>
                  )}

                  {/* Sentiment */}
                  {result.sentiment !== undefined && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Sentiment</p>
                      <span className={`text-sm font-medium ${getSentimentLabel(result.sentiment).color}`}>
                        {getSentimentLabel(result.sentiment).label} ({result.sentiment.toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendation */}
              <div className={`border rounded-lg p-4 ${
                result.confidence >= 0.8
                  ? 'bg-green-50 border-green-200'
                  : result.confidence >= 0.5
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendation</h4>
                <p className="text-sm text-gray-700">
                  {result.confidence >= 0.8 ? (
                    <>
                      ✅ <strong>Great!</strong> The AI agent has high confidence and can handle this query well.
                    </>
                  ) : result.confidence >= 0.5 ? (
                    <>
                      ⚠️ <strong>Moderate confidence.</strong> Consider adding more knowledge base entries or improving existing ones.
                    </>
                  ) : (
                    <>
                      ❌ <strong>Low confidence.</strong> The AI agent might need human assistance. Consider adding specific knowledge base entries for this topic.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Sample Queries */}
          {!result && !isLoading && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Try these sample queries:</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  'How long does shipping take?',
                  'What is your return policy?',
                  'What are your business hours?',
                  'Can I track my order?',
                  'What payment methods do you accept?',
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => setQuery(sample)}
                    className="text-xs px-3 py-1 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
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
