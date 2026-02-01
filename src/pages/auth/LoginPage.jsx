import React from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/forms/LoginForm";
import { showCustomToast } from "@/utils/toast";
import { DEPARTMENT_APP } from "@/constants";

const LoginPage = () => {
  const navigate = useNavigate();
  const onSuccess = (result) => {
    const name = result?.user?.name || result?.user?.email || "User";
    showCustomToast({
      name,
      message: "Welcome! Greetings.",
    });
    // 2-apps-in-1: same route /dashboard for both departments (different content); profile is shared
    const slug = result?.user?.departmentSlug;
    const path = slug === DEPARTMENT_APP.FOOD_SLUG
      ? DEPARTMENT_APP.FOOD_BASE + "/dashboard"
      : DEPARTMENT_APP.DESIGN_BASE + "/dashboard";
    navigate(path, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center flex-col justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <LoginForm onSuccess={onSuccess}/>
    </div>
  );
};

export default LoginPage;
