// src/pages/GoogleAuthSuccess.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function GoogleAuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Save token to localStorage
      localStorage.setItem('token', token);

      // Fetch user data
      fetchUser(token);
    } else {
      // No token, redirect to login
      navigate('/login');
    }
  }, [searchParams, navigate]);

  const fetchUser = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Save user data
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to home
        window.location.href = '/';
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      navigate('/login');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}