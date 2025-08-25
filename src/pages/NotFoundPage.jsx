import { Link } from "react-router-dom";
import { useAuth } from "../shared/hooks/useAuth";
import DynamicButton from "../shared/components/ui/DynamicButton";

const NotFoundPage = () => {
  const { isAuthenticated, role } = useAuth();

  const getHomePath = () => {
    if (!isAuthenticated) return "/";
    if (role === "admin") return "/admin";
    return "/user";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="max-w-lg w-full text-center">
        <div className="mb-4">
          <div className="text-7xl font-bold text-gray-300 mb-2">404</div>
          <h2 className="">
            Page Not Found , Chill
          </h2>
          <p className="text-gray-600 mb-8">
            Sorry, the page you're looking for doesn't exist or has been moved .
          </p>
        </div>
        
        <div className="space-y-4 flex flex-col gap-2">
          <Link to={getHomePath()}>
            <DynamicButton variant="primary" size="lg" className="w-2/4">
              Go to Dashboard
            </DynamicButton>
          </Link>
          
          {!isAuthenticated && (
            <Link to="/">
              <DynamicButton variant="outline" size="lg" className="w-2/4">
                Go to Home
              </DynamicButton>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
