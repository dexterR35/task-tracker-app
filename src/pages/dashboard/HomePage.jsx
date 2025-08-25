import React from "react";
import { useAuth } from "../../shared/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import netbetLogo from "../../assets/netbet-logo.png";

const HomePage = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  // If auth is still loading, don't show anything - let GlobalLoader handle it
  if (isLoading) {
    return null;
  }

  // If authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/user" replace />;
  }

  // Show homepage for unauthenticated users
  return (
    <div className="min-h-screen flex-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="text-center max-w-2xl mx-auto px-6">
        {/* Logo */}
        <img
          src={netbetLogo}
          alt="NetBet Logo"
          className="h-32 w-auto mx-auto mb-8"
        />
        
        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Task Tracker
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-200 mb-8">
          Streamline your workflow and track progress with precision
        </p>
        
        {/* Description */}
        <p className="text-lg text-gray-300 mb-12 leading-relaxed">
          Manage tasks, track time, and analyze performance with our comprehensive 
          task management platform. Built for teams that demand efficiency and clarity.
        </p>
        
        {/* CTA Button */}
        <div className="space-y-4">
          <DynamicButton
            as={Link}
            to="/login"
            variant="primary"
            size="lg"
            className="text-lg px-8 py-4"
          >
            Get Started
          </DynamicButton>
          
          <p className="text-sm text-gray-400">
            Sign in to access your dashboard
          </p>
        </div>
        
        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Task Management</h3>
            <p className="text-gray-300">Organize and track your tasks efficiently</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Time Tracking</h3>
            <p className="text-gray-300">Monitor time spent on tasks and projects</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Analytics</h3>
            <p className="text-gray-300">Get insights into your productivity</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
