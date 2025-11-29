import { useQuery } from '@tanstack/react-query';
import { 
  X, 
  Phone, 
  Mail, 
  Building2, 
  Calendar,
  Clock,
  Tag as TagIcon,
  Edit
} from 'lucide-react';
import apiClient from '../../lib/api';
import config from '../../config';
import { format } from 'date-fns';

interface Contact {
  id: number;
  tenant_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tags?: Record<string, any>;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface ContactDetailsProps {
  contactId: number;
  onClose: () => void;
  onEdit: () => void;
}

export default function ContactDetails({ contactId, onClose, onEdit }: ContactDetailsProps) {
  const { data: contact, isLoading } = useQuery<Contact>({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const response = await apiClient.get(config.api.contacts.get(contactId));
      return response.data.data;
    },
  });

  const { data: callHistory = [] } = useQuery({
    queryKey: ['contact-calls', contactId],
    queryFn: async () => {
      // Fetch CDRs for this contact's phone number
      if (contact?.phone) {
        const response = await apiClient.get(`${config.api.cdrs.list}?phone=${contact.phone}`);
        return response.data.data || [];
      }
      return [];
    },
    enabled: !!contact?.phone,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-2xl">
                {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{contact.name}</h2>
              {contact.company && (
                <p className="text-gray-600">{contact.company}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="btn-secondary flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contact.phone && (
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{contact.phone}</p>
                  </div>
                </div>
              )}

              {contact.email && (
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a 
                      href={`mailto:${contact.email}`}
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>
              )}

              {contact.company && (
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="font-medium text-gray-900">{contact.company}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(contact.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {contact.tags && Object.keys(contact.tags).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TagIcon className="w-5 h-5 mr-2" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(contact.tags).map(([key, value]) => (
                  <span
                    key={key}
                    className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {key}
                    {typeof value !== 'boolean' && `: ${value}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {contact.custom_fields && Object.keys(contact.custom_fields).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Fields</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {Object.entries(contact.custom_fields).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{key}</span>
                    <span className="text-sm text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recent Call History
            </h3>
            {callHistory.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Phone className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No call history found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {callHistory.slice(0, 10).map((call: any) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        call.disposition === 'ANSWERED' ? 'bg-green-500' :
                        call.disposition === 'NO ANSWER' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {call.direction === 'inbound' ? 'Incoming' : 'Outgoing'} Call
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(call.start_time), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{call.disposition}</p>
                      {call.duration && (
                        <p className="text-xs text-gray-500">{call.duration}s</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
