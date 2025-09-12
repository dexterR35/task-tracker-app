import React, { lazy, Suspense } from 'react';
import Loader from '@/components/ui/Loader/Loader';

// Lazy load the TaskTable component
const TaskTable = lazy(() => import('@/features/tasks/components/TaskTable/TaskTable'));

/**
 * Lazy-loaded TaskTable wrapper
 * Reduces initial bundle size by loading TaskTable only when needed
 */
const LazyTaskTable = (props) => {
  return (
    <Suspense 
      fallback={
        <div className="flex justify-center items-center py-8">
          <Loader size="lg" text="Loading task table..." />
        </div>
      }
    >
      <TaskTable {...props} />
    </Suspense>
  );
};

export default LazyTaskTable;
