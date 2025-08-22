import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DynamicButton from "../components/button/DynamicButton";

const NotFoundPage = () => {
  const { isAuthenticated, role } = useAuth();

  const getHomePath = () => {
    if (!isAuthenticated) return "/";
    if (role === "admin") return "/admin";
    return "/me";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to={getHomePath()}>
            <DynamicButton variant="primary" size="lg" className="w-full">
              Go to Dashboard
            </DynamicButton>
          </Link>
          
          {isAuthenticated && (
            <Link to="/">
              <DynamicButton variant="outline" size="lg" className="w-full">
                Go to Home
              </DynamicButton>
            </Link>
          )}
          
          {/* <button
            onClick={() => window.history.back()}
            className="w-full text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Go Back
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
