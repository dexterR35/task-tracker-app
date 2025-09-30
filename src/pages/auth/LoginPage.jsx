import React from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/forms/LoginForm";

const LoginPage = () => {
  const navigate = useNavigate();
  const onSuccess = () => {
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center flex-col  justify-center ">
      <LoginForm onSuccess={onSuccess}/>
    </div>
  );
};

export default LoginPage;
