import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Phone, 
  Mail,
  Building2,
  X,
  Eye
} from 'lucide-react';
import apiClient from '../../lib/api';
import config from '../../config';
import ContactDetails from '../../components/contacts/ContactDetails';

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

interface ContactFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  tags: Record<string, any>;
  custom_fields: Record<string, any>;
}

export default function Contacts() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContactId, setViewingContactId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tagInput, setTagInput] = useState('');
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');

  const [formData, setFormData] = useState<ContactFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    tags: {},
    custom_fields: {},
  });

  const { data: contactsResponse, isLoading } = useQuery({
    queryKey: ['contacts', searchTerm, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', currentPage.toString());
      params.append('limit', '20');
      
      const response = await apiClient.get(`${config.api.contacts.list}?${params}`);
      return response.data;
    },
  });

  const contacts = contactsResponse?.data || [];
  const meta = contactsResponse?.meta;

  const saveContactMutation = useMutation({
    mutationFn: async (contact: ContactFormData) => {
      if (editingContact) {
        return await apiClient.put(config.api.contacts.update(editingContact.id), contact);
      } else {
        return await apiClient.post(config.api.contacts.create, contact);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      handleCloseModal();
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(config.api.contacts.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      // Parse name into first and last
      const nameParts = contact.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setFormData({
        first_name: firstName,
        last_name: lastName,
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        tags: contact.tags || {},
        custom_fields: contact.custom_fields || {},
      });
    } else {
      setEditingContact(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        tags: {},
        custom_fields: {},
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContact(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveContactMutation.mutate(formData);
  };

  const handleCall = (phone: string) => {
    // This would integrate with your call API
    if (confirm(`Call ${phone}?`)) {
      apiClient.post(config.api.calls.make, { number: phone });
    }
  };

  const addTag = (key: string, value: string) => {
    if (key.trim()) {
      setFormData({
        ...formData,
        tags: { ...formData.tags, [key]: value || true }
      });
      setTagInput('');
    }
  };

  const removeTag = (key: string) => {
    const newTags = { ...formData.tags };
    delete newTags[key];
    setFormData({ ...formData, tags: newTags });
  };

  const addCustomField = () => {
    if (customFieldKey.trim()) {
      setFormData({
        ...formData,
        custom_fields: { ...formData.custom_fields, [customFieldKey]: customFieldValue }
      });
      setCustomFieldKey('');
      setCustomFieldValue('');
    }
  };

  const removeCustomField = (key: string) => {
    const newFields = { ...formData.custom_fields };
    delete newFields[key];
    setFormData({ ...formData, custom_fields: newFields });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your customer contacts</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <UserCircle className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">With Phone</p>
              <p className="text-2xl font-bold text-gray-900">
                {contacts.filter((c: Contact) => c.phone).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">With Email</p>
              <p className="text-2xl font-bold text-gray-900">
                {contacts.filter((c: Contact) => c.email).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts by name, company, phone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Loading contacts...
          </div>
        ) : contacts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No contacts found</p>
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary mt-4"
            >
              Add Your First Contact
            </button>
          </div>
        ) : (
          contacts.map((contact: Contact) => (
            <div key={contact.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-lg">
                      {contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {contact.name}
                    </h3>
                    {contact.company && (
                      <p className="text-sm text-gray-500">{contact.company}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setViewingContactId(contact.id)}
                    className="p-1 text-gray-400 hover:text-primary-600"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenModal(contact)}
                    className="p-1 text-gray-400 hover:text-primary-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this contact?')) {
                        deleteContactMutation.mutate(contact.id);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {contact.company && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 className="w-4 h-4 mr-2" />
                    {contact.company}
                  </div>
                )}
                
                {contact.phone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {contact.phone}
                    </div>
                    <button
                      onClick={() => handleCall(contact.phone!)}
                      className="p-1 text-green-600 hover:text-green-700"
                      title="Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {contact.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <a href={`mailto:${contact.email}`} className="hover:text-primary-600 truncate">
                      {contact.email}
                    </a>
                  </div>
                )}

                {contact.tags && Object.keys(contact.tags).length > 0 && (
                  <div className="flex items-center flex-wrap gap-1 mt-2">
                    {Object.entries(contact.tags).map(([key, value]) => (
                      <span
                        key={key}
                        className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs"
                        title={typeof value === 'boolean' ? key : `${key}: ${value}`}
                      >
                        {key}
                      </span>
                    ))}
                  </div>
                )}

                {contact.custom_fields && Object.keys(contact.custom_fields).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    {Object.entries(contact.custom_fields).slice(0, 2).map(([key, value]) => (
                      <div key={key} className="text-xs text-gray-500">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {meta.page} of {meta.total_pages} ({meta.total_count} total contacts)
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(meta.total_pages, p + 1))}
                disabled={currentPage === meta.total_pages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    placeholder="+1234567890"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    💡 Tip: Add additional phone numbers using Custom Fields below (e.g., "Mobile", "Work Phone", "Home Phone")
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(tagInput, '');
                        }
                      }}
                      placeholder="Add tag (e.g., VIP, Customer, etc.)"
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => addTag(tagInput, '')}
                      className="btn-secondary"
                    >
                      Add
                    </button>
                  </div>
                  {Object.keys(formData.tags).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(formData.tags).map(([key]) => (
                        <span
                          key={key}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {key}
                          <button
                            type="button"
                            onClick={() => removeTag(key)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Fields Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Fields
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  📱 Examples: Add "Mobile", "Work Phone", "Home Phone" for additional phone numbers, 
                  or any other custom data like "Department", "Account ID", "Preferred Contact Time", etc.
                </p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customFieldKey}
                      onChange={(e) => setCustomFieldKey(e.target.value)}
                      placeholder="Field name"
                      className="input flex-1"
                    />
                    <input
                      type="text"
                      value={customFieldValue}
                      onChange={(e) => setCustomFieldValue(e.target.value)}
                      placeholder="Field value"
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      onClick={addCustomField}
                      className="btn-secondary"
                    >
                      Add
                    </button>
                  </div>
                  {Object.keys(formData.custom_fields).length > 0 && (
                    <div className="space-y-1">
                      {Object.entries(formData.custom_fields).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded"
                        >
                          <div className="flex-1">
                            <span className="font-medium text-sm">{key}:</span>
                            <span className="text-sm text-gray-600 ml-2">{String(value)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCustomField(key)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveContactMutation.isPending}
                  className="btn-primary"
                >
                  {saveContactMutation.isPending ? 'Saving...' : editingContact ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Details Modal */}
      {viewingContactId && (
        <ContactDetails
          contactId={viewingContactId}
          onClose={() => setViewingContactId(null)}
          onEdit={() => {
            const contact = contacts?.data?.find((c: Contact) => c.id === viewingContactId);
            if (contact) {
              handleOpenModal(contact);
              setViewingContactId(null);
            }
          }}
        />
      )}
    </div>
  );
}
