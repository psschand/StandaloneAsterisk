import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Phone, Mail, Shield, Plus, Edit, Trash2, CheckCircle, XCircle, KeyRound } from 'lucide-react';
import apiClient from '../lib/api';
import config from '../config';
import UserForm from '../components/forms/UserForm';
import type { User } from '../types';

interface UsersResponse {
  success: boolean;
  data: User[];
  meta: {
    page: number;
    page_size: number;
    total_pages: number;
    total_count: number;
  };
}

export default function Agents() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get(config.api.users.list);
      return response.data;
    },
  });

  // Save user mutation (create or update)
  const saveMutation = useMutation({
    mutationFn: async (userData: any) => {
      if (editingUser) {
        return await apiClient.put(config.api.users.update(editingUser.id), userData);
      } else {
        return await apiClient.post(config.api.users.create, userData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setEditingUser(undefined);
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(config.api.users.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingUser(undefined);
    setShowModal(true);
  };

  const handleSave = async (userData: any) => {
    await saveMutation.mutateAsync(userData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const users = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-600 mt-1">Manage call center agents and users</p>
        </div>
        <button 
          onClick={handleCreate}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Agent
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{data?.meta.total_count || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="h-3 w-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Agents</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.roles?.some(r => r.role === 'agent')).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Managers</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.roles?.some(r => r.role === 'manager' || r.role === 'admin')).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {user.phone}
                      </div>
                    )}
                    {user.roles?.[0]?.endpoint_id && (
                      <div className="text-sm text-blue-600 flex items-center mt-1 font-medium gap-2">
                        <Shield className="w-4 h-4 mr-2" />
                        Ext: {user.roles[0].endpoint_id}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.sip_status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          {user.sip_status === 'online' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {user.sip_status || 'offline'}
                        </span>
                      </div>
                    )}
                    {user.sip_password && (
                      <div className="text-xs text-amber-700 flex items-center mt-1">
                        <KeyRound className="w-3 h-3 mr-1" />
                        SIP password available in edit view
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.roles?.map((role, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-1
                          ${role.role === 'admin' ? 'bg-purple-100 text-purple-800' : ''}
                          ${role.role === 'manager' ? 'bg-blue-100 text-blue-800' : ''}
                          ${role.role === 'agent' ? 'bg-green-100 text-green-800' : ''}
                          ${role.role === 'supervisor' ? 'bg-orange-100 text-orange-800' : ''}
                        `}
                      >
                        {role.role}
                      </span>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${user.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                        ${user.status === 'inactive' ? 'bg-gray-100 text-gray-800' : ''}
                      `}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      type="button"
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 mr-4 inline-flex items-center"
                      title="Edit user"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete user ${user.email}?`)) {
                          deleteMutation.mutate(user.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900 inline-flex items-center"
                      title="Delete user"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new user.</p>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      {showModal && (
        <UserForm
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(undefined);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

