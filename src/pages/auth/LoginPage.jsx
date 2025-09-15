import React from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/forms";

const LoginPage = () => {
  const navigate = useNavigate();
  const onSuccess = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center flex-col  justify-center bg-gray-100 dark:bg-gray-800">         
          <LoginForm
            onSuccess={onSuccess}
            className="bg-transparent"
          />
    </div>
  );
};

export default LoginPage;