import React, { lazy, Suspense } from 'react';
import Loader from '@/components/ui/Loader/Loader';

// Lazy load the ReactHookFormWrapper component
const ReactHookFormWrapper = lazy(() => import('@/components/forms/ReactHookFormWrapper'));

/**
 * Lazy-loaded ReactHookFormWrapper wrapper
 * Reduces initial bundle size by loading form only when needed
 */
const LazyUniversalForm = (props) => {
  return (
    <Suspense 
      fallback={
        <div className="flex justify-center items-center py-8">
          <Loader size="lg" text="Loading form..." />
        </div>
      }
    >
      <ReactHookFormWrapper {...props} />
    </Suspense>
  );
};

export default LazyUniversalForm;
