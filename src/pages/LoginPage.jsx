import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import DynamicButton from '../components/DynamicButton';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await login(values);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-center">
      <div className="card w-full max-w-md">
        <h1 className="title">Sign In</h1>
        
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <div>
                <label className="label" htmlFor="email">
                  Email Address
                </label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  className="input w-full"
                  placeholder="Enter your email"
                />
                <ErrorMessage 
                  name="email" 
                  component="div" 
                  className="text-red-500 text-sm mt-1" 
                />
              </div>

              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <Field
                  id="password"
                  name="password"
                  type="password"
                  className="input w-full"
                  placeholder="Enter your password"
                />
                <ErrorMessage 
                  name="password" 
                  component="div" 
                  className="text-red-500 text-sm mt-1" 
                />
              </div>

              <DynamicButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
                loading={isSubmitting}
                loadingText="Signing in..."
                successMessage="Login successful!"
                errorMessage="Login failed. Please try again."
              >
                Sign In
              </DynamicButton>
            </Form>
          )}
        </Formik>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
