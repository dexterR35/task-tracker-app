import React, { useEffect, useState } from 'react';
import { departmentsApi } from '@/app/api';
import Loader from '@/components/ui/Loader/Loader';

/**
 * Departments page – list all departments (admin only).
 * Users are assigned to a department; future: dashboard/tasks per department.
 */
const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    departmentsApi
      .list()
      .then((data) => {
        if (!cancelled) setDepartments(data.departments || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load departments.');
          setDepartments([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader size="lg" text="Loading departments…" variant="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Departments
        </span>
        <span className="h-px flex-1 max-w-[2rem] bg-gray-200 dark:bg-gray-600 rounded-full shrink-0" />
      </div>

      <div className="bg-white dark:bg-smallCard rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 font-semibold text-text-primary dark:text-text-white">Name</th>
                <th className="px-4 py-3 font-semibold text-text-primary dark:text-text-white">Slug</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-text-primary dark:text-text-white">{d.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{d.slug}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {departments.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No departments.</div>
        )}
      </div>
    </div>
  );
};

export default DepartmentsPage;
