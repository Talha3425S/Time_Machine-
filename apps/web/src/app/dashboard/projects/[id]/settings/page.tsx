'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '../../../../../components/DashboardLayout';
import { Project } from '../../../../../types';
import api from '../../../../../lib/api';

export default function ProjectSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    repositoryUrl: '',
    defaultTestCommand: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/organizations/projects/${params.id}`);
      setProject(response.data);
      setFormData({
        name: response.data.name,
        repositoryUrl: response.data.repositoryUrl,
        defaultTestCommand: response.data.defaultTestCommand || '',
      });
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.put(`/organizations/projects/${params.id}`, {
        name: formData.name,
        repositoryUrl: formData.repositoryUrl,
        defaultTestCommand: formData.defaultTestCommand,
      });
      router.push(`/dashboard/projects/${params.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
            <p className="mt-1 text-sm text-gray-500">Configure your project settings</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Project Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="repositoryUrl" className="block text-sm font-medium text-gray-700">
                GitHub Repository URL
              </label>
              <input
                type="url"
                name="repositoryUrl"
                id="repositoryUrl"
                required
                value={formData.repositoryUrl}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="defaultTestCommand" className="block text-sm font-medium text-gray-700">
                Default Test Command
              </label>
              <input
                type="text"
                name="defaultTestCommand"
                id="defaultTestCommand"
                value={formData.defaultTestCommand}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                placeholder="npm test"
              />
              <p className="mt-1 text-xs text-gray-500">
                Command to run tests for failure detection
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/projects/${params.id}`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
          <p className="mt-2 text-sm text-red-700">
            Once you delete a project, there is no going back. Please be certain.
          </p>
          <div className="mt-4">
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to delete this project?')) {
                  try {
                    await api.delete(`/organizations/projects/${params.id}`);
                    router.push('/dashboard/projects');
                  } catch (error) {
                    setError('Failed to delete project');
                  }
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
            >
              Delete Project
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
