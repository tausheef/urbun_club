import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../utils/api';

export default function GoogleAuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
      fetchUser();
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  const fetchUser = async () => {
    try {
      const data = await authAPI.getMe();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        // Full page reload to /erp/ — ensures AuthContext reinitializes
        window.location.href = '/erp/';
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