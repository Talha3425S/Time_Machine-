'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { Organization } from '../../../types';
import api from '../../../lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    organizationId: '',
    organizationName: '',
    organizationSlug: '',
    projectName: '',
    repositoryUrl: '',
    defaultTestCommand: '',
  });
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
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      setLoading(false);
    }
  };

  const validateRepository = async () => {
    if (!formData.repositoryUrl) return;

    setValidating(true);
    setRepoValid(null);

    try {
      const urlMatch = formData.repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        setError('Invalid GitHub repository URL');
        setValidating(false);
        return;
      }

      const [, owner, repo] = urlMatch;
      const response = await api.post('/github/validate', { owner, repo });
      const validation = response.data;

      setRepoValid(validation.valid);
      if (!validation.valid) {
        setError(validation.error || 'Repository validation failed');
      } else {
        setError('');
        if (!formData.projectName) {
          setFormData((prev) => ({ ...prev, projectName: validation.repository?.name || repo }));
        }
      }
    } catch (err: any) {
      setError('Failed to validate repository');
      setRepoValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleNext = async () => {
    setError('');

    if (step === 1) {
      // Validate organization step
      if (organizations.length > 0) {
        setFormData((prev) => ({ ...prev, organizationId: organizations[0].id }));
        setStep(2);
      } else if (formData.organizationName && formData.organizationSlug) {
        try {
          const response = await api.post('/organizations', {
            name: formData.organizationName,
            slug: formData.organizationSlug,
          });
          setFormData((prev) => ({ ...prev, organizationId: response.data.id }));
          setOrganizations([...organizations, response.data]);
          setStep(2);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to create organization');
        }
      } else {
        setError('Please fill in organization details');
      }
    } else if (step === 2) {
      // Validate project step
      if (formData.projectName && formData.repositoryUrl && repoValid) {
        try {
          await api.post(`/organizations/${formData.organizationId}/projects`, {
            name: formData.projectName,
            repositoryUrl: formData.repositoryUrl,
            defaultTestCommand: formData.defaultTestCommand,
          });
          router.push('/dashboard');
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to create project');
        }
      } else {
        setError('Please complete all required fields');
      }
    }
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSkip = () => {
    router.push('/dashboard');
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

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Software Time Machine</h1>
          <p className="mt-2 text-gray-600">Let's get you set up with your first debugging project</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <div className={`h-1 w-16 ${step >= 2 ? 'bg-gray-900' : 'bg-gray-200'}`} />
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <div className={`h-1 w-16 ${step >= 3 ? 'bg-gray-900' : 'bg-gray-200'}`} />
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-gray-900 text-white' : 'bg-gray-200'}`}>
                3
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>Organization</span>
            <span>Project</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Step 1: Organization */}
        {step === 1 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Set up your organization</h2>
            
            {organizations.length > 0 ? (
              <div>
                <p className="text-gray-600 mb-4">You already have organizations. Select one to continue:</p>
                <div className="space-y-2">
                  {organizations.map((org) => (
                    <label key={org.id} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="organization"
                        value={org.id}
                        checked={formData.organizationId === org.id}
                        onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{org.name}</p>
                        <p className="text-sm text-gray-500">{org.slug}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <span>or</span>
                  <button
                    onClick={() => setFormData({ ...formData, organizationId: '', organizationName: '', organizationSlug: '' })}
                    className="ml-2 text-gray-700 underline"
                  >
                    create a new one
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => {
                      setFormData({ ...formData, organizationName: e.target.value, organizationSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') });
                    setError('');
                    setRepoValid(null);
                    setFormData((prev) => ({ ...prev, organizationId: '' }));
                  }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                    placeholder="My Company"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Slug</label>
                  <input
                    type="text"
                    value={formData.organizationSlug}
                    onChange={(e) => setFormData({ ...formData, organizationSlug: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                    placeholder="my-company"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This will be used in URLs: software-time-machine.com/{formData.organizationSlug || 'organization'}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Skip for now
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Project */}
        {step === 2 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Connect your first project</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Name</label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                  placeholder="My Application"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">GitHub Repository URL</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="url"
                    value={formData.repositoryUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, repositoryUrl: e.target.value });
                      setRepoValid(null);
                    }}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                    placeholder="https://github.com/owner/repo"
                  />
                  <button
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
                <label className="block text-sm font-medium text-gray-700">Default Test Command (optional)</label>
                <input
                  type="text"
                  value={formData.defaultTestCommand}
                  onChange={(e) => setFormData({ ...formData, defaultTestCommand: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                  placeholder="npm test"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Command to run tests for failure detection
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!formData.projectName || !formData.repositoryUrl || repoValid === false}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
              >
                Complete Setup
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your organization and project are ready. You can now start using Software Time Machine to debug your applications.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-gray-800"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
