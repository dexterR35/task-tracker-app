import React from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/forms/LoginForm";

const LoginPage = () => {
  const navigate = useNavigate();
  const onSuccess = () => {
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center flex-col justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <LoginForm onSuccess={onSuccess}/>
    </div>
  );
};

export default LoginPage;
