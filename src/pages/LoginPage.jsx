import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../features/auth/authSlice';
import { toast } from 'react-toastify';

const validationSchema = yup.object({
  email: yup.string().email('Must be a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
}).required();

const LoginPage = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);

  React.useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  return (
    <div className="container-center">
      <div className="card w-full max-w-md">
        <h2 className="title">Login</h2>
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={validationSchema}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await dispatch(loginUser(values)).unwrap();
              toast.success('Login successful!');
            } catch (err) {
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="form-col" noValidate>
              <Field
                type="email"
                name="email"
                placeholder="Email"
                disabled={isSubmitting || loading}
                className="input-default"
              />
              <ErrorMessage name="email" component="div" className="text-red-600 text-sm" />

              <Field
                type="password"
                name="password"
                placeholder="Password"
                disabled={isSubmitting || loading}
                className="input-default"
              />
              <ErrorMessage name="password" component="div" className="text-red-600 text-sm" />

              <button type="submit" disabled={isSubmitting || loading} className="btn-primary">
                {isSubmitting || loading ? 'Logging in...' : 'Login'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default LoginPage;