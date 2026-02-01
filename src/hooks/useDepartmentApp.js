/**
 * Department app hook – 2-apps-in-1: Design (tasks) vs Food (orders).
 * Centralizes app type from user.departmentSlug. Use for redirect, layout, and nav.
 * Resolves basePath and loginRedirectPath from src/config/departments.
 */
import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DEPARTMENT_APP } from '@/constants';
import { departmentsBySlug } from '@/config/departments';

export function useDepartmentApp() {
  const { user } = useAuth();
  const slug = user?.departmentSlug ?? null;

  return useMemo(() => {
    const isFoodApp = slug === DEPARTMENT_APP.FOOD_SLUG;
    const isDesignApp = !isFoodApp && !!slug;
    const appType = isFoodApp ? 'food' : isDesignApp ? 'design' : null;
    const department = slug ? departmentsBySlug[slug] : null;
    const fallback = departmentsBySlug.design;
    const basePath = department?.basePath ?? fallback?.basePath ?? DEPARTMENT_APP.DESIGN_BASE;
    const loginRedirectPath = department?.loginRedirectPath ?? fallback?.loginRedirectPath ?? DEPARTMENT_APP.DESIGN_BASE + '/dashboard';

    return {
      appType,
      departmentSlug: slug,
      basePath,
      isFoodApp,
      isDesignApp,
      loginRedirectPath,
    };
  }, [slug]);
}

export default useDepartmentApp;
