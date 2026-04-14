import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Download, 
  Search, 
  Calendar,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Filter,
  Play,
  Square,
  ChevronDown,
  ChevronRight,
  FileText,
  Sparkles
} from 'lucide-react';
import apiClient from '../../lib/api';
import config from '../../config';

interface CDR {
  id: number;
  tenant_id: string;
  calldate: string;
  src?: string;
  dst?: string;
  duration: number;
  billsec: number;
  disposition?: string;
  queue_name?: string;
  agent_name?: string;
  recordingfile?: string;
  direction?: string;
  channel?: string;
  destination_channel?: string;
  transcript?: string;
  summary?: string;
  transcription_status?: string;
}

interface CDRMeta {
  page?: number;
  page_size?: number;
  total_pages?: number;
  total_count?: number;
}

interface CDRListResponse {
  data?: CDR[];
  meta?: CDRMeta;
}

type DirectionCategory = 'inbound' | 'outbound' | 'internal-inbound' | 'internal-outbound';

export default function CDRs() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('');
  const [dispositionFilter, setDispositionFilter] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [transcribingIds, setTranscribingIds] = useState<Set<number>>(new Set());
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [audioProgress, setAudioProgress] = useState<{[key: number]: number}>({});
  const audioRefs = useRef<{[key: number]: HTMLAudioElement}>({});
  
  const queryClient = useQueryClient();

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const transcribeMutation = useMutation({
    mutationFn: async (cdrId: number) => {
      const response = await apiClient.post(`${config.api.cdrs.list}/${cdrId}/transcribe`);
      return response.data;
    },
    onMutate: (cdrId) => {
      setTranscribingIds(prev => new Set(prev).add(cdrId));
    },
    onSuccess: (_, cdrId) => {
      queryClient.invalidateQueries({ queryKey: ['cdrs'] });
      setTimeout(() => {
        setTranscribingIds(prev => {
          const next = new Set(prev);
          next.delete(cdrId);
          return next;
        });
      }, 2000);
    },
    onError: (_error: any, cdrId) => {
      setTranscribingIds(prev => {
        const next = new Set(prev);
        next.delete(cdrId);
        return next;
      });
      // Refresh to show any partial results
      queryClient.invalidateQueries({ queryKey: ['cdrs'] });
    },
  });

  const handleTranscribe = (cdrId: number) => {
    transcribeMutation.mutate(cdrId);
  };

  const handlePlayAudio = (cdrId: number, recordingUrl: string) => {
    // Stop any currently playing audio
    if (playingAudio !== null && playingAudio !== cdrId) {
      const currentAudio = audioRefs.current[playingAudio];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    // Create or get audio element
    if (!audioRefs.current[cdrId]) {
      const audio = new Audio(recordingUrl);
      audioRefs.current[cdrId] = audio;
      
      // Update progress
      audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        setAudioProgress(prev => ({ ...prev, [cdrId]: progress }));
      });

      // Handle audio end
      audio.addEventListener('ended', () => {
        setPlayingAudio(null);
        setAudioProgress(prev => ({ ...prev, [cdrId]: 0 }));
      });
    }

    const audio = audioRefs.current[cdrId];
    audio.play();
    setPlayingAudio(cdrId);
  };

  const handleStopAudio = (cdrId: number) => {
    const audio = audioRefs.current[cdrId];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlayingAudio(null);
    setAudioProgress(prev => ({ ...prev, [cdrId]: 0 }));
  };

  const handleSeek = (cdrId: number, percentage: number) => {
    const audio = audioRefs.current[cdrId];
    if (audio && audio.duration) {
      audio.currentTime = (percentage / 100) * audio.duration;
      setAudioProgress(prev => ({ ...prev, [cdrId]: percentage }));
    }
  };

  const { data: cdrResponse, isLoading } = useQuery<CDRListResponse>({
    queryKey: ['cdrs', currentPage, pageSize, searchTerm, dateFrom, dateTo, directionFilter, dispositionFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      params.page = String(currentPage);
      params.page_size = String(pageSize);
      if (dateFrom) params.start_date = dateFrom;
      if (dateTo) params.end_date = dateTo;
      if (dispositionFilter) params.disposition = dispositionFilter;
      if (directionFilter) params.direction = directionFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await apiClient.get(config.api.cdrs.list, { params });
      return response.data;
    },
  });

  const cdrs = cdrResponse?.data || [];
  const meta = cdrResponse?.meta;

  const isLikelyInternalNumber = (value?: string) => {
    const clean = (value || '').trim();
    return /^[0-9]{2,6}$/.test(clean);
  };

  const isLikelyExternalNumber = (value?: string) => {
    const clean = (value || '').trim();
    if (!clean) return false;
    if (clean.startsWith('+')) return true;
    return /^\d{7,}$/.test(clean);
  };

  const classifyDirection = (cdr: CDR): DirectionCategory => {
    const raw = (cdr.direction || '').toLowerCase().trim();
    const src = cdr.src || '';
    const dst = cdr.dst || '';

    const srcInternal = isLikelyInternalNumber(src);
    const dstInternal = isLikelyInternalNumber(dst);
    const srcExternal = isLikelyExternalNumber(src);
    const dstExternal = isLikelyExternalNumber(dst);

    // Number-pattern truth should take priority over legacy/raw DB direction values.
    if (dstExternal && !dstInternal) {
      return 'outbound';
    }
    if (srcExternal && dstInternal) {
      return 'inbound';
    }

    // Internal extension-to-extension traffic.
    if (srcInternal && dstInternal) {
      if (raw === 'inbound') {
        return 'internal-inbound';
      }
      return 'internal-outbound';
    }

    // Respect explicit inbound/outbound when patterns are ambiguous.
    if (raw === 'inbound') return 'inbound';
    if (raw === 'outbound') return 'outbound';

    // Internal call legs fallback.
    if (raw === 'internal') {
      if (srcInternal && !dstInternal) {
        return 'internal-outbound';
      }
      if (!srcInternal && dstInternal) {
        return 'internal-inbound';
      }
      return 'outbound';
    }

    // Fallback classification when direction is missing.
    if (srcExternal && dstInternal) {
      return 'inbound';
    }
    if (srcInternal && dstExternal) {
      return 'outbound';
    }
    return 'internal-outbound';
  };

  const filteredCdrs = cdrs.filter((cdr) => {
    if (directionFilter && classifyDirection(cdr) !== directionFilter) {
      return false;
    }
    return true;
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'From', 'To', 'Duration', 'Disposition', 'Queue', 'Agent'];
    const rows = filteredCdrs.map(cdr => [
      cdr.id,
      new Date(cdr.calldate).toLocaleString(),
      cdr.src,
      cdr.dst,
      formatDuration(cdr.duration),
      cdr.disposition,
      cdr.queue_name || '',
      cdr.agent_name || ''
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cdrs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getDispositionColor = (disposition: string) => {
    const colors = {
      ANSWERED: 'bg-green-100 text-green-800',
      'NO ANSWER': 'bg-yellow-100 text-yellow-800',
      BUSY: 'bg-orange-100 text-orange-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return colors[disposition as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDirectionIcon = (cdr: CDR) => {
    // Use the direction field if available, otherwise infer from src/dst
    if (cdr.direction) {
      return classifyDirection(cdr).includes('inbound') ? (
        <PhoneIncoming className="w-4 h-4 text-green-600" />
      ) : (
        <PhoneOutgoing className="w-4 h-4 text-blue-600" />
      );
    }
    // Fallback: infer from src/dst pattern
    const isInbound = cdr.src && (cdr.src.startsWith('+') || cdr.src.length > 4);
    return isInbound ? (
      <PhoneIncoming className="w-4 h-4 text-green-600" />
    ) : (
      <PhoneOutgoing className="w-4 h-4 text-blue-600" />
    );
  };

  const stats = {
    total: filteredCdrs.length,
    answered: filteredCdrs.filter(c => c.disposition === 'ANSWERED').length,
    missed: filteredCdrs.filter(c => c.disposition === 'NO ANSWER').length,
    avgDuration: filteredCdrs.length > 0 
      ? Math.round(filteredCdrs.reduce((acc, c) => acc + c.duration, 0) / filteredCdrs.length)
      : 0,
  };

  return (
    <div className="space-y-6 min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Detail Records</h1>
          <p className="text-sm text-gray-600 mt-1">View and analyze call history</p>
        </div>
        <button
          onClick={exportToCSV}
          className="btn-primary flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <PhoneIncoming className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Answered</p>
              <p className="text-2xl font-bold text-gray-900">{stats.answered}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Phone className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Missed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.missed}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.avgDuration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by caller, callee..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Direction
            </label>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="input"
            >
              <option value="">All</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
              <option value="internal-inbound">Internal-Inbound</option>
              <option value="internal-outbound">Internal-Outbound</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Disposition
            </label>
            <select
              value={dispositionFilter}
              onChange={(e) => setDispositionFilter(e.target.value)}
              className="input"
            >
              <option value="">All</option>
              <option value="ANSWERED">Answered</option>
              <option value="NO ANSWER">No Answer</option>
              <option value="BUSY">Busy</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* CDR Table */}
      <div className="card overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                  
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Direction
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Caller
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Callee
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                  Start Time
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Duration
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Disposition
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Queue/Agent
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Recording
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Loading call records...
                  </td>
                </tr>
              ) : filteredCdrs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No call records found
                  </td>
                </tr>
              ) : (
                filteredCdrs.map((cdr) => (
                  <>
                    <tr key={cdr.id} className="hover:bg-gray-50 border-b border-gray-200">
                      <td className="px-3 py-4 align-top">
                        {cdr.recordingfile && (
                          <button
                            onClick={() => toggleRow(cdr.id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {expandedRows.has(cdr.id) ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="flex items-center space-x-2">
                          {getDirectionIcon(cdr)}
                          <span className="text-sm capitalize">{classifyDirection(cdr)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top text-sm text-gray-900 break-all">
                        {cdr.src || 'N/A'}
                      </td>
                      <td className="px-3 py-4 align-top text-sm text-gray-900 break-all">
                        {cdr.dst || 'N/A'}
                      </td>
                      <td className="px-3 py-4 align-top text-sm text-gray-500 break-words">
                        {new Date(cdr.calldate).toLocaleString()}
                      </td>
                      <td className="px-3 py-4 align-top text-sm text-gray-900">
                        {formatDuration(cdr.duration)}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDispositionColor(cdr.disposition || 'UNKNOWN')}`}>
                          {cdr.disposition || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-top text-sm text-gray-500 break-words">
                        {cdr.queue_name && <div>Q: {cdr.queue_name}</div>}
                        {cdr.agent_name && <div>A: {cdr.agent_name}</div>}
                      </td>
                      <td className="px-3 py-4 align-top">
                        {cdr.recordingfile ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              {playingAudio === cdr.id ? (
                                <button
                                  onClick={() => handleStopAudio(cdr.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Stop Recording"
                                >
                                  <Square className="w-5 h-5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handlePlayAudio(cdr.id, cdr.recordingfile!)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Play Recording"
                                >
                                  <Play className="w-5 h-5" />
                                </button>
                              )}
                              <a
                                href={cdr.recordingfile}
                                download
                                className="text-blue-600 hover:text-blue-900"
                                title="Download Recording"
                              >
                                <Download className="w-5 h-5" />
                              </a>
                            </div>
                            {playingAudio === cdr.id && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={audioProgress[cdr.id] || 0}
                                  onChange={(e) => handleSeek(cdr.id, parseFloat(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                  style={{
                                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${audioProgress[cdr.id] || 0}%, #e5e7eb ${audioProgress[cdr.id] || 0}%, #e5e7eb 100%)`
                                  }}
                                />
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {Math.floor(audioProgress[cdr.id] || 0)}%
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </td>
                    </tr>
                    {expandedRows.has(cdr.id) && cdr.recordingfile && (
                      <tr key={`${cdr.id}-details`} className="bg-gray-50">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="space-y-4">
                            {!cdr.transcript && !cdr.summary && cdr.transcription_status !== 'processing' ? (
                              <div className="bg-white rounded-lg p-6 text-center">
                                <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                                <h4 className="font-semibold text-gray-900 mb-2">No Transcript Available</h4>
                                <p className="text-sm text-gray-600 mb-4">
                                  Generate an AI-powered transcript and summary for this call recording
                                </p>
                                <button
                                  onClick={() => handleTranscribe(cdr.id)}
                                  disabled={transcribingIds.has(cdr.id)}
                                  className="btn-primary inline-flex items-center gap-2"
                                >
                                  {transcribingIds.has(cdr.id) ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-4 h-4" />
                                      Generate Transcript & Summary
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : cdr.transcription_status === 'processing' ? (
                              <div className="bg-white rounded-lg p-6 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
                                <h4 className="font-semibold text-gray-900 mb-2">Processing...</h4>
                                <p className="text-sm text-gray-600">
                                  AI is analyzing the recording and generating transcript
                                </p>
                              </div>
                            ) : null}
                            {cdr.summary && (
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <Sparkles className="w-5 h-5 text-purple-600" />
                                  <h4 className="font-semibold text-gray-900">AI Summary</h4>
                                  {cdr.transcription_status && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                      {cdr.transcription_status}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-700 whitespace-pre-wrap prose prose-sm max-w-none">
                                  {cdr.summary}
                                </div>
                                {cdr.summary.includes('Summary generation failed') && (
                                  <div className="mt-3">
                                    <button
                                      onClick={() => handleTranscribe(cdr.id)}
                                      disabled={transcribingIds.has(cdr.id)}
                                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm inline-flex items-center gap-2 transition-colors"
                                    >
                                      {transcribingIds.has(cdr.id) ? (
                                        <>
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                          Retrying...
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3 h-3" />
                                          Retry Summary Generation
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                            {cdr.transcript && (
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                  <h4 className="font-semibold text-gray-900">Transcript</h4>
                                </div>
                                <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded max-h-96 overflow-y-auto">
                                  {cdr.transcript}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(meta?.total_pages || 0) > 1 && (
        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {meta?.page || currentPage} of {meta?.total_pages || 1} ({meta?.total_count || 0} records)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={(meta?.page || currentPage) <= 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(meta?.total_pages || p, p + 1))}
                disabled={(meta?.page || currentPage) >= (meta?.total_pages || currentPage)}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
