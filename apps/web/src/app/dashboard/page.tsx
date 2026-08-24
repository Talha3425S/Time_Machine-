'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import { Organization } from '../../types';
import api from '../../lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/organizations');
      setOrganizations(response.data);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
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

  // Redirect to onboarding if no organizations
  if (organizations.length === 0) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Welcome! Let's get you set up.</p>
          <a
            href="/dashboard/onboarding"
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-gray-800"
          >
            Start Setup
          </a>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.username}!</h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's an overview of your Software Time Machine activity
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Organizations</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{organizations.length}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Projects</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">0</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Incidents</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">0</dd>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <a
                href="/dashboard/organizations/new"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Create Organization
              </a>
              <a
                href="/dashboard/projects/new"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Add Project
              </a>
            </div>
          </div>
        </div>

        {/* Recent organizations */}
        {organizations.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Your Organizations</h3>
              <ul className="divide-y divide-gray-200">
                {organizations.map((org) => (
                  <li key={org.id} className="py-3">
                    <a
                      href={`/dashboard/organizations/${org.id}`}
                      className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-md"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-gray-100 rounded-lg p-2">
                          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h-1m2 0v-2m0 0v-2m0 2h16m-7-2h2" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{org.name}</p>
                          <p className="text-xs text-gray-500">{org.slug}</p>
                        </div>
                      </div>
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
