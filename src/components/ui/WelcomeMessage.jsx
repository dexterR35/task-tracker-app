import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import dayjs from "dayjs";

const WelcomeMessage = () => {
  const { user } = useAuth();
  const { addSuccess } = useNotifications();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  useEffect(() => {
    if (user && !hasShownWelcome) {
      const currentTime = dayjs();
      const hour = currentTime.hour();
      
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
