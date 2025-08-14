import React, { useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../features/auth/authSlice';
import { toast } from 'react-toastify';

const validationSchema = yup.object({
  email: yup.string().email('Must be a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const LoginPage = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.auth.loading.loginUser);
  const error = useSelector((state) => state.auth.error.loginUser);
  const fetchError = useSelector((state) => state.auth.error.fetchCurrentUser);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError('loginUser'));
    }
  }, [error, dispatch]);

  return (
    <div className="container-center">
      <div className="card w-full max-w-md">
        <h2 className="title">Login</h2>
        
        {/* Show admin re-auth message if needed */}
        {fetchError && fetchError.includes('sign back in') && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">{fetchError}</p>
          </div>
        )}
        
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={validationSchema}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={async (values, { setSubmitting }) => {
            if (isLoading) {
              setSubmitting(false);
              return;
            }
            try {
              await dispatch(loginUser(values)).unwrap();
              toast.success('Login successful!');
            } catch {}
            setSubmitting(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form className="form-col" noValidate>
              <Field type="email" name="email" placeholder="Email" disabled={isSubmitting || isLoading} className="input-default" />
              <ErrorMessage name="email" component="div" className="text-red-600 text-sm" />

              <Field
                type="password"
                name="password"
                placeholder="Password"
                disabled={isSubmitting || isLoading}
                className="input-default"
              />
              <ErrorMessage name="password" component="div" className="text-red-600 text-sm" />

              <button type="submit" disabled={isSubmitting || isLoading} className="btn-primary">
                {isSubmitting || isLoading ? 'Logging in...' : 'Login'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default LoginPage;
