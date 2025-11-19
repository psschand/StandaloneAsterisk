import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Plus, Edit2, Trash2, Play, Save, Volume2, Settings, Hash } from 'lucide-react';
import apiClient from '../lib/api';

interface IVRMenu {
  id: number;
  name: string;
  display_name?: string | null;
  description?: string | null;
  greeting_text?: string | null;
  greeting_audio_url?: string | null;
  timeout: number;
  max_attempts: number;
  invalid_option_action: string;
  timeout_action: string;
  status: string;
  options: IVROption[];
}

interface IVROption {
  id?: number;
  digit: string;
  action_type: 'queue' | 'extension' | 'submenu' | 'hangup' | 'voicemail' | 'operator';
  action_target: string;
  description: string;
}

interface Queue {
  id: number;
  name: string;
  display_name?: string;
}

interface Extension {
  id: string;
  display_name?: string;
}

interface IVRFormState {
  name: string;
  display_name: string;
  description: string;
  greeting_text: string;
  greeting_audio_url: string;
  timeout: number;
  max_attempts: number;
  invalid_option_action: string;
  timeout_action: string;
  status: string;
  options: IVROption[];
}

export default function IVRBuilder() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIVR, setEditingIVR] = useState<IVRMenu | null>(null);
  const [previewText, setPreviewText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState<IVRFormState>({
    name: '',
    display_name: '',
    description: '',
    greeting_text: '',
    greeting_audio_url: '',
    timeout: 10,
    max_attempts: 3,
    invalid_option_action: 'repeat',
    timeout_action: 'repeat',
    status: 'active',
    options: [],
  });

  const queryClient = useQueryClient();

  const { data: ivrsData, isLoading } = useQuery({
    queryKey: ['ivr-menus'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/ivr-menus');
      return response.data;
    },
  });

  const { data: queuesData } = useQuery({
    queryKey: ['queues'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/queues');
      return response.data;
    },
  });

  const { data: extensionsData } = useQuery({
    queryKey: ['extensions'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/extensions');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await apiClient.post('/api/v1/ivr-menus', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ivr-menus'] });
      setShowAddModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const response = await apiClient.put(`/api/v1/ivr-menus/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ivr-menus'] });
      setEditingIVR(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/api/v1/ivr-menus/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ivr-menus'] });
    },
  });

  const generateTTSMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiClient.post('/api/v1/tts/generate', { text });
      return response.data;
    },
    onSuccess: (data: { data: { audio_file: string } }) => {
      // Construct full URL for audio playback
      const audioFile = data.data.audio_file;
      const audioUrl = audioFile.startsWith('http') || audioFile.startsWith('data:')
        ? audioFile
        : `${window.location.origin}${audioFile}`;
      setFormData((prev) => ({ ...prev, greeting_audio_url: audioUrl }));
    },
    onError: (error: any) => {
      console.error('TTS generation failed:', error);
      alert('Failed to generate TTS audio. Please try again.');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      greeting_text: '',
      greeting_audio_url: '',
      timeout: 10,
      max_attempts: 3,
      invalid_option_action: 'repeat',
      timeout_action: 'repeat',
      status: 'active',
      options: [],
    });
  };

  const handleEdit = (ivr: IVRMenu) => {
    setEditingIVR(ivr);
    setFormData({
      name: ivr.name,
      display_name: ivr.display_name || '',
      description: ivr.description || '',
      greeting_text: ivr.greeting_text || '',
      greeting_audio_url: ivr.greeting_audio_url || '',
      timeout: ivr.timeout,
      max_attempts: ivr.max_attempts,
      invalid_option_action: ivr.invalid_option_action,
      timeout_action: ivr.timeout_action,
      status: ivr.status,
      options: ivr.options || [],
    });
  };

  const buildIVRPayload = (form: IVRFormState) => {
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      timeout: form.timeout > 0 ? form.timeout : 10,
      max_attempts: form.max_attempts > 0 ? form.max_attempts : 3,
      status: form.status.trim() || 'active',
      invalid_option_action: form.invalid_option_action.trim() || 'repeat',
      timeout_action: form.timeout_action.trim() || 'repeat',
    };

    const displayName = form.display_name.trim();
    if (displayName) {
      payload.display_name = displayName;
    }

    const description = form.description.trim();
    if (description) {
      payload.description = description;
    }

    const greetingText = form.greeting_text.trim();
    if (greetingText) {
      payload.greeting_text = greetingText;
    }

    const greetingAudio = form.greeting_audio_url.trim();
    if (greetingAudio) {
      payload.greeting_audio_url = greetingAudio;
    }

    const sanitizedOptions = form.options
      .map((option) => ({
        digit: option.digit.trim(),
        action_type: option.action_type,
        action_target: option.action_target.trim(),
        description: option.description.trim(),
      }))
      .filter((option) => option.digit !== '');

    payload.options = sanitizedOptions;

    return payload;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      alert('Internal name is required.');
      return;
    }

    const seenDigits = new Set<string>();
    for (const option of formData.options) {
      const digit = option.digit.trim();
      if (!digit) {
        alert('Each IVR option must have a digit.');
        return;
      }
      if (seenDigits.has(digit)) {
        alert(`Digit "${digit}" is used more than once.`);
        return;
      }
      seenDigits.add(digit);

      const requiresTarget = !['hangup', 'operator'].includes(option.action_type);
      if (requiresTarget && !option.action_target.trim()) {
        alert(`Option ${digit} requires a destination.`);
        return;
      }
    }

    const payload = buildIVRPayload({ ...formData, name: trimmedName });

    if (editingIVR) {
      updateMutation.mutate({ id: editingIVR.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete IVR menu "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        { digit: '', action_type: 'queue', action_target: '', description: '' },
      ],
    });
  };

  const updateOption = (index: number, field: keyof IVROption, value: string) => {
    const newOptions = [...formData.options];
    const updatedOption = { ...newOptions[index], [field]: value };
    if (field === 'action_type') {
      updatedOption.action_target = '';
    }
    newOptions[index] = updatedOption;
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_: IVROption, i: number) => i !== index),
    });
  };

  const handleGenerateTTS = () => {
    if (!previewText.trim()) {
      alert('Please enter text for TTS generation');
      return;
    }
    setFormData((prev) => ({ ...prev, greeting_text: previewText }));
    generateTTSMutation.mutate(previewText);
    setShowPreview(false);
  };

  const ivrs = ivrsData?.data || [];
  const queues = queuesData?.data || [];
  const extensions = extensionsData?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IVR Builder</h1>
          <p className="text-gray-600 mt-1">Create interactive voice menus with text-to-speech</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingIVR(null);
            setShowAddModal(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create IVR Menu
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Phone className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total IVRs</p>
              <p className="text-2xl font-bold text-gray-900">{ivrs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Volume2 className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Menus</p>
              <p className="text-2xl font-bold text-gray-900">
                {ivrs.filter((i: IVRMenu) => i.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Hash className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Options</p>
              <p className="text-2xl font-bold text-gray-900">
                {ivrs.reduce((sum: number, ivr: IVRMenu) => sum + (ivr.options?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Options</p>
              <p className="text-2xl font-bold text-gray-900">
                {ivrs.length > 0 
                    ? Math.round(ivrs.reduce((sum: number, ivr: IVRMenu) => sum + (ivr.options?.length || 0), 0) / ivrs.length)
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* IVR List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ivrs.map((ivr: IVRMenu) => (
          <div key={ivr.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{ivr.display_name || ivr.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{ivr.name}</p>
                {ivr.description && (
                  <p className="text-sm text-gray-500 mt-1">{ivr.description}</p>
                )}
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${ivr.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {ivr.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Volume2 className="w-4 h-4 mr-2" />
                <span className="truncate">
                  {ivr.greeting_text || (ivr.greeting_audio_url ? 'Custom audio greeting' : 'No greeting set')}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Hash className="w-4 h-4 mr-2" />
                <span>{ivr.options?.length || 0} menu options</span>
              </div>
            </div>

            {/* Menu Options Preview */}
            {ivr.options && ivr.options.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Options:</p>
                <div className="space-y-1">
                  {ivr.options.slice(0, 3).map((opt: IVROption, idx: number) => (
                    <div key={idx} className="text-xs text-gray-600 flex items-center">
                      <span className="w-6 font-mono font-bold">{opt.digit}:</span>
                      <span className="truncate">{opt.description || opt.action_target}</span>
                    </div>
                  ))}
                  {ivr.options.length > 3 && (
                    <div className="text-xs text-gray-500">+{ivr.options.length - 3} more</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(ivr)}
                className="flex-1 btn bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(ivr.id, ivr.name)}
                className="btn bg-red-50 hover:bg-red-100 text-red-600 text-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {ivrs.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Phone className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No IVR menus</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first IVR menu to get started.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingIVR) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingIVR ? 'Edit IVR Menu' : 'Create IVR Menu'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Internal Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="main-menu"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      className="input"
                      placeholder="Main Menu"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input"
                      rows={2}
                      placeholder="Optional context for admins"
                    />
                  </div>
                </div>

                {/* Greeting Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Greeting Message *
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.greeting_text}
                      onChange={(e) => setFormData({ ...formData, greeting_text: e.target.value })}
                      className="input min-h-[100px]"
                      placeholder="Welcome to our call center. Press 1 for sales, press 2 for support..."
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewText(formData.greeting_text);
                        setShowPreview(true);
                      }}
                      className="absolute top-2 right-2 btn btn-sm bg-purple-50 hover:bg-purple-100 text-purple-600"
                    >
                      <Volume2 className="w-4 h-4 mr-1" />
                      Generate TTS
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This text will be converted to speech using text-to-speech
                  </p>
                  {formData.greeting_audio_url && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">Generated Audio Preview</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, greeting_audio_url: '' })}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove audio
                        </button>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <audio 
                          controls 
                          src={formData.greeting_audio_url} 
                          className="w-full"
                          preload="auto"
                        >
                          Your browser does not support the audio element.
                        </audio>
                        <p className="text-xs text-gray-500 mt-2">
                          Audio file: {formData.greeting_audio_url.split('/').pop()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Settings */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      value={formData.timeout}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        setFormData({ ...formData, timeout: Number.isNaN(value) ? 0 : value });
                      }}
                      className="input"
                      min="1"
                      max="60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      value={formData.max_attempts}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        setFormData({ ...formData, max_attempts: Number.isNaN(value) ? 1 : value });
                      }}
                      className="input"
                      min="1"
                      max="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Menu Options */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Menu Options
                    </label>
                    <button
                      type="button"
                      onClick={addOption}
                      className="btn btn-sm bg-green-50 hover:bg-green-100 text-green-600"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Option
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {formData.options.map((option, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Digit *
                            </label>
                            <select
                              value={option.digit}
                              onChange={(e) => updateOption(index, 'digit', e.target.value)}
                              className="input text-sm"
                              required
                            >
                              <option value="">-</option>
                              {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'].map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Action *
                            </label>
                            <select
                              value={option.action_type}
                              onChange={(e) => updateOption(index, 'action_type', e.target.value)}
                              className="input text-sm"
                            >
                              <option value="queue">Queue</option>
                              <option value="extension">Extension</option>
                              <option value="submenu">Sub-menu</option>
                              <option value="voicemail">Voicemail</option>
                              <option value="hangup">Hangup</option>
                              <option value="operator">Operator</option>
                            </select>
                          </div>

                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Target
                            </label>
                            {option.action_type === 'queue' && (
                              <select
                                value={option.action_target}
                                onChange={(e) => updateOption(index, 'action_target', e.target.value)}
                                className="input text-sm"
                              >
                                <option value="">Select queue...</option>
                                {queues.map((q: Queue) => (
                                  <option key={q.id} value={q.name}>{q.display_name || q.name}</option>
                                ))}
                              </select>
                            )}
                            {option.action_type === 'extension' && (
                              <select
                                value={option.action_target}
                                onChange={(e) => updateOption(index, 'action_target', e.target.value)}
                                className="input text-sm"
                              >
                                <option value="">Select extension...</option>
                                {extensions.map((ext: Extension) => (
                                  <option key={ext.id} value={ext.id}>{ext.display_name || ext.id}</option>
                                ))}
                              </select>
                            )}
                            {option.action_type === 'submenu' && (
                              <select
                                value={option.action_target}
                                onChange={(e) => updateOption(index, 'action_target', e.target.value)}
                                className="input text-sm"
                              >
                                <option value="">Select IVR menu...</option>
                                {ivrs
                                  .filter((menu: IVRMenu) => menu.name !== formData.name)
                                  .map((menu: IVRMenu) => (
                                    <option key={menu.id} value={menu.name}>
                                      {menu.display_name || menu.name}
                                    </option>
                                  ))}
                              </select>
                            )}
                            {!['queue', 'extension', 'hangup', 'operator', 'submenu'].includes(option.action_type) && (
                              <input
                                type="text"
                                value={option.action_target}
                                onChange={(e) => updateOption(index, 'action_target', e.target.value)}
                                className="input text-sm"
                                placeholder="Enter target..."
                              />
                            )}
                          </div>

                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={option.description}
                              onChange={(e) => updateOption(index, 'description', e.target.value)}
                              className="input text-sm"
                              placeholder="Sales department"
                            />
                          </div>

                          <div className="col-span-1 flex items-end">
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="btn btn-sm bg-red-50 hover:bg-red-100 text-red-600 w-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {formData.options.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Hash className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">No menu options added yet</p>
                    </div>
                  )}
                </div>

                {/* Fallback Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invalid Option Action
                    </label>
                    <select
                      value={formData.invalid_option_action}
                      onChange={(e) => setFormData({ ...formData, invalid_option_action: e.target.value })}
                      className="input"
                    >
                      <option value="repeat">Repeat menu</option>
                      <option value="hangup">Hangup</option>
                      <option value="voicemail">Voicemail</option>
                      <option value="operator">Transfer to operator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeout Action
                    </label>
                    <select
                      value={formData.timeout_action}
                      onChange={(e) => setFormData({ ...formData, timeout_action: e.target.value })}
                      className="input"
                    >
                      <option value="repeat">Repeat menu</option>
                      <option value="hangup">Hangup</option>
                      <option value="voicemail">Voicemail</option>
                      <option value="operator">Transfer to operator</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingIVR(null);
                      resetForm();
                    }}
                    className="flex-1 btn bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 btn btn-primary"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingIVR ? 'Update IVR' : 'Create IVR'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TTS Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Text-to-Speech Preview</h3>
            
            <textarea
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="input min-h-[150px] mb-4"
              placeholder="Enter text to convert to speech..."
            />

            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The generated audio will be saved and used as your IVR greeting.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewText('');
                }}
                className="flex-1 btn bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateTTS}
                disabled={generateTTSMutation.isPending}
                className="flex-1 btn btn-primary"
              >
                <Play className="w-4 h-4 mr-2" />
                {generateTTSMutation.isPending ? 'Generating...' : 'Generate Audio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
