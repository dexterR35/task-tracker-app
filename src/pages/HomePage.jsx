import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-xl w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-4">Welcome to NetBet</h1>
        <p className="text-gray-600 mb-6">Track tasks, generate monthly analytics</p>
        <div className="flex gap-3">
          <Link to="/login" className="px-4 py-2 rounded bg-blue-600 text-white">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;


