/**
 * Selected Department Context
 * Viewing department is always the user's own department (no switcher).
 * Used for Main Menu data scope (Dashboard, Analytics).
 * Read-only: viewingDepartment is derived from useAuth().user; setViewingDepartment is a no-op for API compatibility.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';

const defaultValue = {
  viewingDepartment: null,
  /** No-op; viewing department is read-only (derived from user). Kept for API compatibility. */
  setViewingDepartment: () => {},
  viewingDepartmentId: null,
  viewingDepartmentName: null,
  viewingDepartmentSlug: null,
};

const SelectedDepartmentContext = createContext(defaultValue);

export const useSelectedDepartment = () => useContext(SelectedDepartmentContext);

export const SelectedDepartmentProvider = ({ children }) => {
  const { user } = useAuth();

  const viewingDepartment = useMemo(
    () =>
      user?.departmentId
        ? {
            id: user.departmentId,
            name: user.departmentName ?? '',
            slug: user.departmentSlug ?? '',
          }
        : null,
    [user?.departmentId, user?.departmentName, user?.departmentSlug]
  );

  const value = useMemo(
    () => ({
      viewingDepartment,
      setViewingDepartment: () => {},
      viewingDepartmentId: viewingDepartment?.id ?? null,
      viewingDepartmentName: viewingDepartment?.name ?? null,
      viewingDepartmentSlug: viewingDepartment?.slug ?? null,
    }),
    [viewingDepartment]
  );

  return (
    <SelectedDepartmentContext.Provider value={value}>
      {children}
    </SelectedDepartmentContext.Provider>
  );
};

export default SelectedDepartmentContext;
