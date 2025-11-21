'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Icons
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const Trash2Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const RefreshIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

import AddUserModal from '@/components/admin/AddUserModal';
import EditUserModal from '@/components/admin/EditUserModal';
import DeleteUserConfirmation from '@/components/admin/DeleteUserConfirmation';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'student';
  school_id: string | null;
  created_at: string;
  updated_at: string;
  schools?: {
    id: string;
    school_name: string;
  } | null;
}

interface School {
  id: string;
  school_name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users
  const fetchUsers = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError('');

      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch schools
  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/admin/schools');
      const data = await response.json();

      if (response.ok) {
        setSchools(data.schools || []);
      }
    } catch (err) {
      console.error('Error fetching schools:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSchools();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    fetchUsers(false);
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Handle copy ID
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle success callbacks
  const handleSuccess = () => {
    fetchUsers(false);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-green-100 text-green-800';
      case 'teacher':
        return 'bg-purple-100 text-purple-800';
      case 'student':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container p-4 mx-auto sm:p-6 lg:p-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 mb-6 sm:gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center p-2 text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400"
            title="Back to Dashboard"
          >
            <ArrowLeftIcon />
          </Link>

          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 sm:text-xl">User Management</h1>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 sm:px-4"
            title="Refresh users list"
          >
            <RefreshIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:px-4"
          >
            <UserPlusIcon />
            <span className="hidden sm:inline">Add User</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 border border-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-medium text-gray-600">Loading users...</p>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        School
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Updated At
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          <div className="flex flex-col items-center">
                            <UserPlusIcon />
                            <p className="mt-2 text-sm font-medium">No users found</p>
                            <p className="text-xs text-gray-400">Click "Add User" to create one</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="transition-colors hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-white bg-indigo-600 rounded-full">
                                <span className="text-sm font-medium">
                                  {user.full_name
                                    ?.split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2) || 'U'}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.full_name || 'N/A'}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <span className="font-mono">
                                    {user.id.slice(0, 8)}...
                                  </span>
                                  <button
                                    onClick={() => handleCopyId(user.id)}
                                    className="p-1 text-gray-400 transition-colors rounded hover:text-indigo-600 hover:bg-indigo-50"
                                    title="Copy full ID"
                                  >
                                    {copiedId === user.id ? (
                                      <CheckIcon />
                                    ) : (
                                      <CopyIcon />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold leading-5 rounded-full ${getRoleBadgeColor(
                                user.role
                              )}`}
                            >
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {user.schools?.school_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {user.updated_at
                              ? new Date(user.updated_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-indigo-600 transition-colors rounded-md hover:bg-indigo-50"
                                title="Edit user"
                              >
                                <PencilIcon />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-2 text-red-600 transition-colors rounded-md hover:bg-red-50"
                                title="Delete user"
                              >
                                <Trash2Icon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 mt-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div>
                  Total Users: <span className="font-semibold text-gray-900">{users.length}</span>
                </div>
                <div className="w-px bg-gray-300"></div>
                <div>
                  Admins:{' '}
                  <span className="font-semibold text-green-600">
                    {users.filter((u) => u.role === 'admin').length}
                  </span>
                </div>
                <div className="w-px bg-gray-300"></div>
                <div>
                  Teachers:{' '}
                  <span className="font-semibold text-purple-600">
                    {users.filter((u) => u.role === 'teacher').length}
                  </span>
                </div>
                <div className="w-px bg-gray-300"></div>
                <div>
                  Students:{' '}
                  <span className="font-semibold text-blue-600">
                    {users.filter((u) => u.role === 'student').length}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modals */}
        <AddUserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSuccess}
          schools={schools}
        />
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleSuccess}
          user={selectedUser}
          schools={schools}
        />
        <DeleteUserConfirmation
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={handleSuccess}
          user={selectedUser}
        />
      </div>
    </div>
  );
}
