import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginForm from "@/components/forms/LoginForm";
import { showCustomToast } from "@/utils/toast";
import { DEPARTMENT_APP } from "@/constants";

/** Safe redirect path: same-origin app path, not login (avoid loop). */
const getRedirectPath = (from, user) => {
  if (!from || typeof from !== "string") return null;
  const path = from.split("?")[0].split("#")[0].trim();
  if (!path.startsWith("/") || path === "/login" || path === "/unauthorized") return null;
  const slug = user?.departmentSlug;
  const designBase = DEPARTMENT_APP.DESIGN_BASE;
  const foodBase = DEPARTMENT_APP.FOOD_BASE;
  if (path.startsWith(designBase) && slug !== DEPARTMENT_APP.FOOD_SLUG) return path;
  if (path.startsWith(foodBase) && slug === DEPARTMENT_APP.FOOD_SLUG) return path;
  if (path.startsWith("/settings")) return path;
  return null;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const onSuccess = (result) => {
    const name = result?.user?.name || result?.user?.email || "User";
    showCustomToast({
      name,
      message: "Welcome! Greetings.",
    });
    const redirect = getRedirectPath(from, result?.user);
    if (redirect) {
      navigate(redirect, { replace: true });
      return;
    }
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
