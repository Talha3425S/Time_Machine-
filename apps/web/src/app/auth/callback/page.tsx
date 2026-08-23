'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthResponse } from '../../types';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      // Check if we have the token and user data from the callback
      const token = searchParams.get('token');
      const userData = searchParams.get('user');
      
      if (token && userData) {
        try {
          const user = JSON.parse(decodeURIComponent(userData));
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          router.push('/dashboard');
        } catch (error) {
          console.error('Auth error:', error);
          router.push('/login?error=auth_failed');
        }
      } else {
        // If no token, try to get it from the API directly
        const code = searchParams.get('code');
        if (code) {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/github/callback?code=${code}`,
              {
                credentials: 'include',
              }
            );
            
            if (response.ok) {
              const data: AuthResponse = await response.json();
              localStorage.setItem('token', data.access_token);
              localStorage.setItem('user', JSON.stringify(data.user));
              router.push('/dashboard');
            } else {
              router.push('/login?error=auth_failed');
            }
          } catch (error) {
            console.error('Auth error:', error);
            router.push('/login?error=auth_failed');
          }
        } else {
          router.push('/login?error=no_code');
        }
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
}