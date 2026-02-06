/**
 * RTK Query API - Centralized API configuration with automatic deduplication and caching
 * 
 * Features:
 * - Request deduplication (same endpoint + args = one request)
 * - Normalized caching per query key
 * - Built-in invalidation via tags
 * - Auth token handling with automatic refresh
 * - Abort handling
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG } from '@/constants';
import { getToken, refreshAccessToken } from '@/app/api';

/**
 * Base query with auth token handling and automatic refresh on 401
 */
const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  credentials: 'include', // Include cookies for refresh token
  prepareHeaders: (headers, { getState }) => {
    // Get token from memory (managed by api.js)
    const token = getToken();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
  timeout: API_CONFIG.TIMEOUT,
});

/**
 * Base query with automatic token refresh on 401
 */
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Try to refresh the token
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Retry the original query with the new token
      result = await baseQuery(args, api, extraOptions);
    }
  }
  
  return result;
};

/**
 * RTK Query API slice with all endpoints
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Users',
    'Department',
    'Departments',
    'TaskBoard',
    'TaskBoards',
    'Task',
    'Tasks',
    'OrderBoard',
    'OrderBoards',
    'Order',
    'Orders',
  ],
  endpoints: (builder) => ({
    // ============================================================================
    // AUTH ENDPOINTS
    // ============================================================================
    login: builder.mutation({
      query: (credentials) => ({
        url: `${API_CONFIG.AUTH_PREFIX}/login`,
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    
    me: builder.query({
      query: () => `${API_CONFIG.AUTH_PREFIX}/me`,
      providesTags: ['User'],
    }),
    
    refresh: builder.mutation({
      query: () => ({
        url: `${API_CONFIG.AUTH_PREFIX}/refresh`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    
    logout: builder.mutation({
      query: () => ({
        url: `${API_CONFIG.AUTH_PREFIX}/logout`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['User'],
    }),
    
    logoutAll: builder.mutation({
      query: () => ({
        url: `${API_CONFIG.AUTH_PREFIX}/logout-all`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['User'],
    }),

    // ============================================================================
    // USERS ENDPOINTS
    // ============================================================================
    getUsers: builder.query({
      query: () => '/api/users',
      providesTags: ['Users'],
    }),
    
    getUserById: builder.query({
      query: (id) => `/api/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    
    updateUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/api/users/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        'Users',
      ],
    }),

    // ============================================================================
    // DEPARTMENTS ENDPOINTS
    // ============================================================================
    getDepartments: builder.query({
      query: () => '/api/departments',
      providesTags: ['Departments'],
    }),

    // ============================================================================
    // TASK BOARDS ENDPOINTS
    // ============================================================================
    getTaskBoards: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.year) searchParams.set('year', params.year);
        if (params.month) searchParams.set('month', params.month);
        const query = searchParams.toString();
        return `/api/task-boards${query ? `?${query}` : ''}`;
      },
      providesTags: ['TaskBoards'],
    }),
    
    getTaskBoardById: builder.query({
      query: (id) => `/api/task-boards/${id}`,
      providesTags: (result, error, id) => [{ type: 'TaskBoard', id }],
    }),
    
    createTaskBoard: builder.mutation({
      query: (body) => ({
        url: '/api/task-boards',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TaskBoards'],
    }),

    // ============================================================================
    // TASKS ENDPOINTS
    // ============================================================================
    getTasks: builder.query({
      query: (boardId) => `/api/tasks?boardId=${encodeURIComponent(boardId)}`,
      providesTags: (result, error, boardId) => [
        { type: 'Tasks', id: boardId },
        'Tasks',
      ],
    }),
    
    getTaskById: builder.query({
      query: (id) => `/api/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),
    
    createTask: builder.mutation({
      query: (body) => ({
        url: '/api/tasks',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tasks', 'TaskBoards'],
    }),
    
    updateTask: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/api/tasks/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id },
        'Tasks',
      ],
    }),
    
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/api/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tasks', 'TaskBoards'],
    }),

    // ============================================================================
    // ORDER BOARDS ENDPOINTS
    // ============================================================================
    getOrderBoards: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.year) searchParams.set('year', params.year);
        if (params.month) searchParams.set('month', params.month);
        const query = searchParams.toString();
        return `/api/order-boards${query ? `?${query}` : ''}`;
      },
      providesTags: ['OrderBoards'],
    }),
    
    getOrderBoardById: builder.query({
      query: (id) => `/api/order-boards/${id}`,
      providesTags: (result, error, id) => [{ type: 'OrderBoard', id }],
    }),
    
    createOrderBoard: builder.mutation({
      query: (body) => ({
        url: '/api/order-boards',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['OrderBoards'],
    }),

    // ============================================================================
    // ORDERS ENDPOINTS
    // ============================================================================
    getOrders: builder.query({
      query: (boardId) => `/api/orders?boardId=${encodeURIComponent(boardId)}`,
      providesTags: (result, error, boardId) => [
        { type: 'Orders', id: boardId },
        'Orders',
      ],
    }),
    
    getOrderById: builder.query({
      query: (id) => `/api/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    
    createOrder: builder.mutation({
      query: (body) => ({
        url: '/api/orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Orders', 'OrderBoards'],
    }),
    
    updateOrder: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/api/orders/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        'Orders',
      ],
    }),
    
    deleteOrder: builder.mutation({
      query: (id) => ({
        url: `/api/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Orders', 'OrderBoards'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  // Auth
  useLoginMutation,
  useMeQuery,
  useRefreshMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  
  // Users
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  
  // Departments
  useGetDepartmentsQuery,
  
  // Task Boards
  useGetTaskBoardsQuery,
  useGetTaskBoardByIdQuery,
  useCreateTaskBoardMutation,
  
  // Tasks
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  
  // Order Boards
  useGetOrderBoardsQuery,
  useGetOrderBoardByIdQuery,
  useCreateOrderBoardMutation,
  
  // Orders
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} = api;
