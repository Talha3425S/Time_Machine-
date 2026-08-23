'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '../../../../components/DashboardLayout';
import { Organization, Project } from '../../../../types';
import api from '../../../../lib/api';

export default function OrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganization();
    fetchProjects();
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

  const fetchProjects = async () => {
    try {
      const response = await api.get(`/organizations/${params.id}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
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
            <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{organization.slug}</p>
          </div>
          <a
            href={`/dashboard/organizations/${organization.id}/settings`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
          >
            Settings
          </a>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Projects</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{projects.length}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Members</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">1</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Incidents</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">0</dd>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Projects</h3>
              <a
                href="/dashboard/projects/new"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Add Project
              </a>
            </div>
            
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No projects yet</p>
                <a
                  href="/dashboard/projects/new"
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
                >
                  Add Your First Project
                </a>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <li key={project.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-gray-100 rounded-lg p-2">
                          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{project.name}</p>
                          <p className="text-xs text-gray-500">{project.repositoryUrl}</p>
                        </div>
                      </div>
                      <a
                        href={`/dashboard/projects/${project.id}`}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        View
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Team Members</h3>
            <div className="mt-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">Y</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">You</p>
                    <p className="text-xs text-gray-500">Admin</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Admin
                </span>
              </div>
            </div>
            <div className="mt-4">
              <button className="text-sm text-gray-500 hover:text-gray-700">
                + Invite team member
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
