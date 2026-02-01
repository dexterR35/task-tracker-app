/**
 * Selected Department Context
 * For super_admin: holds the currently selected department for viewing Main Menu data
 * (Dashboard, Analytics). Settings (Users, UI Showcase, Departments link) stay global.
 * For non–super_admin: viewing department is always the user's own department.
 */

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { canAccess } from '@/features/utils/authUtils';

const defaultValue = {
  viewingDepartment: null,
  setViewingDepartment: () => {},
  viewingDepartmentId: null,
  viewingDepartmentName: null,
  viewingDepartmentSlug: null,
};

const SelectedDepartmentContext = createContext(defaultValue);

export const useSelectedDepartment = () => useContext(SelectedDepartmentContext);

export const SelectedDepartmentProvider = ({ children }) => {
  const { user } = useAuth();
  const isSuperAdmin = canAccess(user, 'super_admin');

  const userDepartment = useMemo(
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

  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Super admin: sync selected department when user loads or changes (e.g. login / switch user)
  useEffect(() => {
    if (!user) {
      setSelectedDepartment(null);
      return;
    }
    if (isSuperAdmin && userDepartment) {
      setSelectedDepartment((prev) => (prev?.id === userDepartment.id ? prev : userDepartment));
    } else {
      setSelectedDepartment(null);
    }
  }, [user?.id, user?.departmentId, isSuperAdmin, userDepartment?.id]);

  const viewingDepartment = isSuperAdmin ? (selectedDepartment || userDepartment) : userDepartment;
  const setViewingDepartment = isSuperAdmin ? setSelectedDepartment : () => {};

  const value = useMemo(
    () => ({
      viewingDepartment,
      setViewingDepartment,
      viewingDepartmentId: viewingDepartment?.id ?? null,
      viewingDepartmentName: viewingDepartment?.name ?? null,
      viewingDepartmentSlug: viewingDepartment?.slug ?? null,
      isSuperAdmin,
    }),
    [viewingDepartment, isSuperAdmin]
  );

  return (
    <SelectedDepartmentContext.Provider value={value}>
      {children}
    </SelectedDepartmentContext.Provider>
  );
};

export default SelectedDepartmentContext;
