import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Download, 
  Search, 
  Calendar,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Filter,
  Play
} from 'lucide-react';
import apiClient from '../../lib/api';
import config from '../../config';

interface CDR {
  id: number;
  call_id: string;
  direction: 'inbound' | 'outbound';
  caller_id: string;
  callee_id: string;
  start_time: string;
  answer_time?: string;
  end_time: string;
  duration: number;
  billsec: number;
  disposition: 'ANSWERED' | 'NO ANSWER' | 'BUSY' | 'FAILED';
  queue?: string;
  agent?: string;
  recording_url?: string;
}

export default function CDRs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('');
  const [dispositionFilter, setDispositionFilter] = useState<string>('');

  const { data: cdrs = [], isLoading } = useQuery<CDR[]>({
    queryKey: ['cdrs', searchTerm, dateFrom, dateTo, directionFilter, dispositionFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      if (directionFilter) params.append('direction', directionFilter);
      if (dispositionFilter) params.append('disposition', dispositionFilter);

      const response = await apiClient.get(`${config.api.cdrs.list}?${params}`);
      return response.data.data || [];
    },
  });

  const exportToCSV = () => {
    const headers = ['Call ID', 'Direction', 'Caller', 'Callee', 'Start Time', 'Duration', 'Disposition', 'Queue', 'Agent'];
    const rows = cdrs.map(cdr => [
      cdr.call_id,
      cdr.direction,
      cdr.caller_id,
      cdr.callee_id,
      new Date(cdr.start_time).toLocaleString(),
      formatDuration(cdr.duration),
      cdr.disposition,
      cdr.queue || '',
      cdr.agent || ''
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

  const getDirectionIcon = (direction: string) => {
    return direction === 'inbound' ? (
      <PhoneIncoming className="w-4 h-4 text-green-600" />
    ) : (
      <PhoneOutgoing className="w-4 h-4 text-blue-600" />
    );
  };

  const stats = {
    total: cdrs.length,
    answered: cdrs.filter(c => c.disposition === 'ANSWERED').length,
    missed: cdrs.filter(c => c.disposition === 'NO ANSWER').length,
    avgDuration: cdrs.length > 0 
      ? Math.round(cdrs.reduce((acc, c) => acc + c.duration, 0) / cdrs.length)
      : 0,
  };

  return (
    <div className="space-y-6">
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
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
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Filter className="w-4 h-4 inline mr-1" />
            Disposition
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value=""
                checked={dispositionFilter === ''}
                onChange={(e) => setDispositionFilter(e.target.value)}
                className="mr-2"
              />
              All
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="ANSWERED"
                checked={dispositionFilter === 'ANSWERED'}
                onChange={(e) => setDispositionFilter(e.target.value)}
                className="mr-2"
              />
              Answered
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="NO ANSWER"
                checked={dispositionFilter === 'NO ANSWER'}
                onChange={(e) => setDispositionFilter(e.target.value)}
                className="mr-2"
              />
              No Answer
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="BUSY"
                checked={dispositionFilter === 'BUSY'}
                onChange={(e) => setDispositionFilter(e.target.value)}
                className="mr-2"
              />
              Busy
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="FAILED"
                checked={dispositionFilter === 'FAILED'}
                onChange={(e) => setDispositionFilter(e.target.value)}
                className="mr-2"
              />
              Failed
            </label>
          </div>
        </div>
      </div>

      {/* CDR Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Direction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Caller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Callee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disposition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Queue/Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recording
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Loading call records...
                  </td>
                </tr>
              ) : cdrs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No call records found
                  </td>
                </tr>
              ) : (
                cdrs.map((cdr) => (
                  <tr key={cdr.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getDirectionIcon(cdr.direction)}
                        <span className="text-sm capitalize">{cdr.direction}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cdr.caller_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cdr.callee_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(cdr.start_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(cdr.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDispositionColor(cdr.disposition)}`}>
                        {cdr.disposition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cdr.queue && <div>Q: {cdr.queue}</div>}
                      {cdr.agent && <div>A: {cdr.agent}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cdr.recording_url ? (
                        <button
                          onClick={() => window.open(cdr.recording_url, '_blank')}
                          className="text-primary-600 hover:text-primary-900"
                          title="Play Recording"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
