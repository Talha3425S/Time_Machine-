'use client';

import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

export default function DashboardPage() {
  const { user } = useAuth();

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
              <dd className="mt-1 text-3xl font-semibold text-gray-900">0</dd>
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

        {/* Getting started */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900">Getting Started</h3>
          <p className="mt-2 text-blue-700">
            To start using Software Time Machine, create an organization and add your first project with a GitHub repository.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
