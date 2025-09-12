import React, { lazy, Suspense } from 'react';
import Loader from '@/components/ui/Loader/Loader';

// Lazy load the UniversalFormRHF component
const UniversalFormRHF = lazy(() => import('@/components/forms/UniversalFormRHF'));

/**
 * Lazy-loaded UniversalFormRHF wrapper
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
      <UniversalFormRHF {...props} />
    </Suspense>
  );
};

export default LazyUniversalForm;
