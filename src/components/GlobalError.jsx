import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { getRegisteredErrorSlices } from '../utils/errorSlicesRegistry';

const GlobalErrorToastHandler = () => {
  const dispatch = useDispatch();

  // Memoize the registered slices list
  const registeredSlices = useMemo(() => getRegisteredErrorSlices(), []);

  // Use one selector to get all errors from slices in one object
  const errors = useSelector((state) => {
    const errs = {};
    for (const { sliceName, getError } of registeredSlices) {
      errs[sliceName] = getError(state);
    }
    return errs;
  });

  useEffect(() => {
    for (const { sliceName, clearError } of registeredSlices) {
      const error = errors[sliceName];
      if (error) {
        toast.error(error, {
          position: 'top-right',
          autoClose: 4000,
          pauseOnHover: true,
          draggable: true,
        });
        if (clearError) dispatch(clearError());
      }
    }
  // Only re-run when errors object or registeredSlices changes
  }, [errors, dispatch, registeredSlices]);

  return null;
};

export default GlobalErrorToastHandler;
