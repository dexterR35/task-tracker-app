import React from 'react';
import { useSelector } from 'react-redux';
import Loader from './Loader';

const DashboardLoader = ({ children }) => {
  const tasksApiState = useSelector((state) => state.tasksApi);
  const usersApiState = useSelector((state) => state.usersApi);

  const isLoading =
    Object.values(tasksApiState?.queries || {}).some(q => q?.status === 'pending') ||
    Object.values(tasksApiState?.mutations || {}).some(m => m?.status === 'pending') ||
    Object.values(usersApiState?.queries || {}).some(q => q?.status === 'pending') ||
    Object.values(usersApiState?.mutations || {}).some(m => m?.status === 'pending');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="xl" variant="spinner" text="Please wait..." />
      </div>
    );
  }

  return children;
};

export default DashboardLoader;
