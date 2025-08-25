import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import Loader from './Loader';

const DashboardLoader = ({ children }) => {
  // Get loading states directly from Redux
  const tasksApiState = useSelector((state) => state.tasksApi);
  const usersApiState = useSelector((state) => state.usersApi);

  // Track loading states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [loadingType, setLoadingType] = useState("dots");
  const [currentOperation, setCurrentOperation] = useState(null);
  const [loadingStartTime, setLoadingStartTime] = useState(null);
  const timeoutRef = useRef(null);

  // Check if any loading is happening
  const hasPendingQueries = 
    (tasksApiState?.queries && Object.values(tasksApiState.queries).some(query => query?.status === 'pending')) ||
    (usersApiState?.queries && Object.values(usersApiState.queries).some(query => query?.status === 'pending'));

  const hasPendingMutations = 
    (tasksApiState?.mutations && Object.values(tasksApiState.mutations).some(mutation => mutation?.status === 'pending')) ||
    (usersApiState?.mutations && Object.values(usersApiState.mutations).some(mutation => mutation?.status === 'pending'));

  // Minimum loading duration to prevent flickering
  const MIN_LOADING_DURATION = 1000; // 1 second minimum

  // Determine loading state and message
  useEffect(() => {
    let shouldShowLoader = false;
    let message = "Loading...";
    let operation = null;

    // Determine current operation
    if (hasPendingMutations) {
      shouldShowLoader = true;
      
      if (tasksApiState?.mutations && Object.values(tasksApiState.mutations).some(mutation => mutation?.status === 'pending')) {
        const pendingMutations = Object.values(tasksApiState.mutations).filter(mutation => mutation?.status === 'pending');
        if (pendingMutations.some(mutation => mutation.originalArgs?.operation === 'create')) {
          message = "Creating new task...";
          operation = 'create';
        } else if (pendingMutations.some(mutation => mutation.originalArgs?.operation === 'update')) {
          message = "Updating task data...";
          operation = 'update';
        } else if (pendingMutations.some(mutation => mutation.originalArgs?.operation === 'delete')) {
          message = "Deleting task...";
          operation = 'delete';
        } else if (pendingMutations.some(mutation => mutation.originalArgs?.monthId && mutation.originalArgs?.monthId.includes('generate'))) {
          message = "Generating board structure...";
          operation = 'generate';
        } else if (pendingMutations.some(mutation => mutation.originalArgs?.chartsData)) {
          message = "Saving chart data...";
          operation = 'charts';
        } else {
          message = "Saving changes...";
          operation = 'save';
        }
      } else if (usersApiState?.mutations && Object.values(usersApiState.mutations).some(mutation => mutation?.status === 'pending')) {
        const pendingMutations = Object.values(usersApiState.mutations).filter(mutation => mutation?.status === 'pending');
        if (pendingMutations.some(mutation => mutation.originalArgs?.operation === 'update')) {
          message = "Updating user profile...";
          operation = 'user_update';
        } else if (pendingMutations.some(mutation => mutation.originalArgs?.operation === 'delete')) {
          message = "Removing user...";
          operation = 'user_delete';
        } else {
          message = "Updating user data...";
          operation = 'user_save';
        }
      }
    } 
    // Continue loading after mutation with detailed messages
    else if (hasPendingQueries && currentOperation) {
      shouldShowLoader = true;
      
      if (currentOperation === 'create') {
        message = "Refreshing task list...";
      } else if (currentOperation === 'update') {
        message = "Updating task display...";
      } else if (currentOperation === 'delete') {
        message = "Removing task from view...";
      } else if (currentOperation === 'generate') {
        message = "Loading board data...";
      } else if (currentOperation === 'charts') {
        message = "Updating analytics...";
      } else if (currentOperation.startsWith('user_')) {
        message = "Refreshing user data...";
      } else {
        message = "Loading updated data...";
      }
    }
    // Regular queries (not after mutations)
    else if (hasPendingQueries && !currentOperation) {
      shouldShowLoader = true;
      
      if (tasksApiState?.queries && Object.values(tasksApiState.queries).some(query => query?.status === 'pending')) {
        const pendingQueries = Object.values(tasksApiState.queries).filter(query => query?.status === 'pending');
        if (pendingQueries.some(query => query.originalArgs?.monthId)) {
          message = "Loading task data...";
        } else if (pendingQueries.some(query => query.originalArgs?.monthId && query.originalArgs?.monthId.includes('board'))) {
          message = "Checking board status...";
        } else {
          message = "Loading dashboard data...";
        }
      } else if (usersApiState?.queries && Object.values(usersApiState.queries).some(query => query?.status === 'pending')) {
        message = "Loading user information...";
      }
    }

    // Start loading
    if (shouldShowLoader && !isLoading) {
      setIsLoading(true);
      setLoadingMessage(message);
      setLoadingType("dots"); // Always use dots for consistency
      setLoadingStartTime(Date.now());
      if (operation) {
        setCurrentOperation(operation);
      }
    }
    // Update loading message if already loading (continuous flow)
    else if (shouldShowLoader && isLoading) {
      setLoadingMessage(message);
      if (operation && operation !== currentOperation) {
        setCurrentOperation(operation);
      }
    }
    // Stop loading with minimum duration check
    else if (!shouldShowLoader && isLoading) {
      const elapsedTime = Date.now() - (loadingStartTime || Date.now());
      
      if (elapsedTime >= MIN_LOADING_DURATION) {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Stop loading and reset operation
        setIsLoading(false);
        setLoadingStartTime(null);
        setCurrentOperation(null);
      } else {
        // Wait for minimum duration
        const remainingTime = MIN_LOADING_DURATION - elapsedTime;
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          setIsLoading(false);
          setLoadingStartTime(null);
          setCurrentOperation(null);
        }, remainingTime);
      }
    }
  }, [hasPendingMutations, hasPendingQueries, tasksApiState, usersApiState, isLoading, loadingStartTime, currentOperation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Show loader only when necessary
  if (isLoading) {
    return (
      <div className="min-h-screen flex-center bg-primary">
        <div className="text-center">
          <Loader 
            size="xl" 
            text={loadingMessage} 
            variant={loadingType}
          />
          {/* Optional: Show loading details in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-gray-400 space-y-1">
              <div>Has Pending Queries: {hasPendingQueries ? '✅' : '❌'}</div>
              <div>Has Pending Mutations: {hasPendingMutations ? '✅' : '❌'}</div>
              <div>Current Operation: {currentOperation || 'None'}</div>
              <div>Should Show Loader: {isLoading ? '✅' : '❌'}</div>
              <div>Loading Duration: {loadingStartTime ? Math.round((Date.now() - loadingStartTime) / 100) / 10 : 0}s</div>
              <div>Tasks Queries: {tasksApiState?.queries ? Object.values(tasksApiState.queries).filter(query => query?.status === 'pending').length : 0}</div>
              <div>Users Queries: {usersApiState?.queries ? Object.values(usersApiState.queries).filter(query => query?.status === 'pending').length : 0}</div>
              <div>Tasks Mutations: {tasksApiState?.mutations ? Object.values(tasksApiState.mutations).filter(mutation => mutation?.status === 'pending').length : 0}</div>
              <div>Users Mutations: {usersApiState?.mutations ? Object.values(usersApiState.mutations).filter(mutation => mutation?.status === 'pending').length : 0}</div>
              <div>Message: {loadingMessage}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show children when no loading is needed
  return children;
};

export default DashboardLoader;
