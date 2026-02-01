import React, { useEffect, useState } from 'react';
import { departmentsApi } from '@/app/api';
import Loader from '@/components/ui/Loader/Loader';
import SectionHeader from '@/components/ui/SectionHeader';

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
      <SectionHeader label="Departments" className="mb-4" />

      <div className="bg-white dark:bg-smallCard rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 font-semibold text-text-primary dark:text-text-white">Name</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-text-primary dark:text-text-white">{d.name}</td>
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
