import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import DarkModeToggle from "../ui/DarkModeToggle";

const PublicLayout = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-white dark:bg-primary transition-colors duration-300">
      {/* Navigation - Only show for unauthenticated users */}
      {!isAuthenticated && (
        <nav className="bg-white dark:bg-primary shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Link
                  to="/"
                  className="text-2xl font-bold text-gray-800 dark:text-white hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  Task Tracker
                </Link>
              </div>

              {/* Right Side - Only Dark Mode Toggle */}
              <div className="flex items-center space-x-4">
                <DarkModeToggle />
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="relative">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
