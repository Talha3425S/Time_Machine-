'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '../../../../../components/DashboardLayout';
import { Organization } from '../../../../../types';
import api from '../../../../../lib/api';

interface Member {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export default function OrganizationMembersPage() {
  const router = useRouter();
  const params = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchOrganization();
    fetchMembers();
  }, [params.id]);

  const fetchOrganization = async () => {
    try {
      const response = await api.get(`/organizations/${params.id}`);
      setOrganization(response.data);
    } catch (error) {
      console.error('Failed to fetch organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      // For now, we'll use mock data since the backend doesn't have a members endpoint yet
      // In a real implementation, this would call the API
      setMembers([
        {
          id: '1',
          username: 'you',
          email: 'your.email@example.com',
          avatarUrl: '',
          role: 'admin',
          joinedAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      // This would call the actual invite endpoint
      // await api.post(`/organizations/${params.id}/members`, {
      //   email: inviteEmail,
      //   role: inviteRole,
      // });
      
      // For now, just add a mock member
      setMembers([
        ...members,
        {
          id: Date.now().toString(),
          username: inviteEmail.split('@')[0],
          email: inviteEmail,
          avatarUrl: '',
          role: inviteRole,
          joinedAt: new Date().toISOString(),
        },
      ]);
      
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member' | 'viewer') => {
    try {
      // This would call the actual role update endpoint
      // await api.patch(`/organizations/${params.id}/members/${memberId}`, {
      //   role: newRole,
      // });
      
      setMembers(members.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ));
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!organization) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Organization not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
            <p className="mt-1 text-sm text-gray-500">Manage access and permissions for {organization.name}</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
          >
            Invite Member
          </button>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Members ({members.length})</h3>
            
            <ul className="divide-y divide-gray-200">
              {members.map((member) => (
                <li key={member.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {member.avatarUrl ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={member.avatarUrl}
                            alt={member.username}
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {member.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{member.username}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'member' | 'viewer')}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-gray-900 focus:border-gray-900"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'member' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Role Descriptions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Role Permissions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Admin</h4>
              <p className="text-sm text-gray-600">Full access to organization settings, projects, and team management</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Member</h4>
              <p className="text-sm text-gray-600">Can create and manage projects, view incidents and experiments</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Viewer</h4>
              <p className="text-sm text-gray-600">Read-only access to view projects, incidents, and experiment results</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                  placeholder="colleague@example.com"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
                >
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
