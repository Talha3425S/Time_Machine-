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
  const [repoDetails, setRepoDetails] = useState<any>(null);

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
        setRepoDetails(validation.repository);
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
            {/* Help sidebar */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Setting up a new project</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Connect a GitHub repository to track environment changes</li>
                <li>• We'll automatically detect PHP, Composer, and Docker configurations</li>
                <li>• Specify your test command for failure detection</li>
                <li>• Once connected, you can start debugging with Environment Bisect</li>
              </ul>
            </div>

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
                GitHub Repository URL <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="url"
                  name="repositoryUrl"
                  id="repositoryUrl"
                  required
                  value={formData.repositoryUrl}
                  onChange={(e) => {
                    handleChange(e);
                    setRepoValid(null);
                    setRepoDetails(null);
                  }}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                  placeholder="https://github.com/owner/repo"
                />
                <button
                  type="button"
                  onClick={validateRepository}
                  disabled={validating || !formData.repositoryUrl}
                  className={`inline-flex items-center px-4 rounded-r-md border border-l-0 text-sm font-medium ${
                    repoValid === true 
                      ? 'bg-green-50 border-green-300 text-green-700' 
                      : repoValid === false 
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  } disabled:opacity-50`}
                >
                  {validating ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Validating...
                    </span>
                  ) : repoValid === true ? (
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Valid
                    </span>
                  ) : repoValid === false ? (
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Invalid
                    </span>
                  ) : (
                    'Validate'
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Paste the full GitHub repository URL. We'll validate access and fetch repository details.
              </p>
              {repoDetails && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md p-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{repoDetails.name}</p>
                      <p className="text-xs text-gray-500">{repoDetails.description || 'No description'}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>⭐ {repoDetails.stargazers_count || 0}</span>
                        <span>🔀 {repoDetails.forks_count || 0}</span>
                        <span>🌟 {repoDetails.language || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
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
