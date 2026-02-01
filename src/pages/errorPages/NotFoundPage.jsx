import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useDepartmentApp } from "@/hooks/useDepartmentApp";
import StatusPage from "@/components/ui/StatusPage";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loginRedirectPath } = useDepartmentApp();
  const homePath = user ? loginRedirectPath : "/";
  const homeLabel = user ? "Go to app home" : "Go to Homepage";

  return (
    <StatusPage
      variant="not-found"
      title="404"
      message="The page you're looking for doesn't exist or has been moved."
      primaryAction={{ to: homePath, label: homeLabel, iconName: "home" }}
      secondaryAction={{ onClick: () => navigate(-1), label: "Go Back", iconName: "back" }}
    />
  );
};

export default NotFoundPage;
