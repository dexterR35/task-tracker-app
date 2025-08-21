import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";

const WelcomeMessage = () => {
  const { user } = useAuth();
  const { addSuccess } = useNotifications();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  useEffect(() => {
    if (user && !hasShownWelcome) {
      // Check if we're on the login page - don't show welcome there
      const isLoginPage = window.location.pathname === '/login';
      if (isLoginPage) return;
      
      const currentTime = new Date();
      const hour = currentTime.getHours();
      
      let greeting = "Good morning";
      if (hour >= 12 && hour < 17) {
        greeting = "Good afternoon";
      } else if (hour >= 17) {
        greeting = "Good evening";
      }

      const welcomeMessage = `${greeting}, ${user.name || user.email}! Welcome back to Task Tracker.`;
      
      addSuccess(welcomeMessage, {
        title: "Welcome Back!",
        autoClose: 5000,
        position: "top-center"
      });
      
      setHasShownWelcome(true);
    }
  }, [user, hasShownWelcome, addSuccess]);

  return null; // This component doesn't render anything visible
};

export default WelcomeMessage;
