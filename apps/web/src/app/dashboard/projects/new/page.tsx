'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/DashboardLayout';
import { Organization, GitHubRepoValidation } from '../../../../types';
import api from '../../../../lib/api';

export default function NewProjectPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [formData, setFormData] = useState({
    organizationId: '',
    name: '',
    repositoryUrl: '',
    defaultTestCommand: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);
  const [repoValid, setRepoValid] = useState<boolean | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/organizations');
      setOrganizations(response.data);
      if (response.data.length > 0) {
        setFormData((prev) => ({ ...prev, organizationId: response.data[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  const validateRepository = async () => {
    if (!formData.repositoryUrl) return;

    setValidating(true);
    setRepoValid(null);

    try {
      // Parse GitHub URL to get owner and repo
      const urlMatch = formData.repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        setError('Invalid GitHub repository URL');
        setValidating(false);
        return;
      }

      const [, owner, repo] = urlMatch;
      const response = await api.post('/github/validate', { owner, repo });
      const validation: GitHubRepoValidation = response.data;

      setRepoValid(validation.valid);
      if (!validation.valid) {
        setError(validation.error || 'Repository validation failed');
      } else {
        setError('');
        // Auto-fill project name if empty
        if (!formData.name) {
          setFormData((prev) => ({ ...prev, name: validation.repository?.name || repo }));
        }
      }
    } catch (err: any) {
      setError('Failed to validate repository');
      setRepoValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/organizations/${formData.organizationId}/projects`, {
        name: formData.name,
        repositoryUrl: formData.repositoryUrl,
        defaultTestCommand: formData.defaultTestCommand,
      });
      router.push(`/dashboard/projects/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Add Project</h1>
            <p className="mt-1 text-sm text-gray-500">Connect a GitHub repository to track environment changes</p>
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
              <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700">
                Organization
              </label>
              <select
                id="organizationId"
                name="organizationId"
                required
                value={formData.organizationId}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
              >
                {organizations.length === 0 ? (
                  <option value="">No organizations available</option>
                ) : (
                  organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))
                )}
              </select>
            </div>

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
                placeholder="My App"
              />
            </div>

            <div>
              <label htmlFor="repositoryUrl" className="block text-sm font-medium text-gray-700">
                GitHub Repository URL
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="url"
                  name="repositoryUrl"
                  id="repositoryUrl"
                  required
                  value={formData.repositoryUrl}
                  onChange={handleChange}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                  placeholder="https://github.com/owner/repo"
                />
                <button
                  type="button"
                  onClick={validateRepository}
                  disabled={validating || !formData.repositoryUrl}
                  className="inline-flex items-center px-4 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  {validating ? 'Validating...' : 'Validate'}
                </button>
              </div>
              {repoValid === true && (
                <p className="mt-1 text-xs text-green-600">✓ Repository is accessible</p>
              )}
              {repoValid === false && (
                <p className="mt-1 text-xs text-red-600">✗ Repository validation failed</p>
              )}
            </div>

            <div>
              <label htmlFor="defaultTestCommand" className="block text-sm font-medium text-gray-700">
                Default Test Command (optional)
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
                onClick={() => router.push('/dashboard/projects')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || repoValid === false}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Add Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
