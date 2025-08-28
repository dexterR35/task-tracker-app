import { useAuth } from "../shared/hooks/useAuth";
import { Link } from "react-router-dom";
import { Icons } from "../shared/icons";

const NotFoundPage = () => {
  const { user, canAccess } = useAuth();

  const getHomePath = () => {
    if (!user) return "/";
    if (canAccess('admin')) return "/admin";
    return "/user";
  };

  return (
    <div className="min-h-screen flex-center bg-primary">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
        {/* 404 Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Icons.buttons.alert className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-6xl font-bold text-gray-300 mb-2">404</h1>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="space-y-2">
          <Link
            to={getHomePath()}
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            {user ? 'Go to Dashboard' : 'Go to Home'}
          </Link>
          
          <Link
            to="/"
            className="block w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
