/**
 * Tasks API (PERN stub – replace with backend endpoints when ready)
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

export const useTasks = (monthId, _role = 'user', _userUID = null, _filters = {}) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!monthId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }
    setTasks([]);
    setIsLoading(false);
    setError(null);
  }, [monthId]);

  return { tasks, isLoading, error };
};

export const useAllUserTasks = (userUID) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTasks([]);
    setIsLoading(false);
    setError(null);
  }, [userUID]);

  return { tasks, isLoading, error };
};

export const useAllTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTasks([]);
    setIsLoading(false);
    setError(null);
  }, []);

  return { tasks, isLoading, error };
};

export const useCreateTask = () => {
  const createTask = useCallback(async () => {
    logger.warn('[tasksApi] createTask: backend not implemented');
    throw new Error('Tasks API not yet connected. Backend coming soon.');
  }, []);
  return [createTask];
};

export const useUpdateTask = () => {
  const updateTask = useCallback(async () => {
    logger.warn('[tasksApi] updateTask: backend not implemented');
    throw new Error('Tasks API not yet connected. Backend coming soon.');
  }, []);
  return [updateTask];
};

export const useDeleteTask = () => {
  const deleteTask = useCallback(async () => {
    logger.warn('[tasksApi] deleteTask: backend not implemented');
    throw new Error('Tasks API not yet connected. Backend coming soon.');
  }, []);
  return [deleteTask];
};
