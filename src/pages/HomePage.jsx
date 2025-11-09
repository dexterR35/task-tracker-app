import React from "react";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import netbetLogo from "@/assets/netbet-logo.png";
import logo from "@/assets/logo.webp";
import { APP_CONFIG } from "@/constants";

const HomePage = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center flex-col">
      <div className="max-w-[90%] w-full mx-auto px-4 relative pt-10">
        {/* Hero Section */}
        <div className="mb-5">
          <div className="flex justify-center items-center mb-4">
            <img 
              src={logo} 
              alt={`${APP_CONFIG.NAME} Logo`}
              className="w-16 h-16 object-contain mr-4"
            />
            <h1 className="text-6xl">
              <span >Welcome to </span>
              <span className="text-red-error ">{APP_CONFIG.NAME}</span>
            </h1>
          </div>
          <p className="md:text-lg max-w-xl mx-auto text-center mb-10">
            The task management platform designed for teams that prioritize{" "}
           <span className="text-red-error">calculate monthly reports</span> and <span className="text-blue-default">analyze performance</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <DynamicButton
              to="/login"
              variant="primary"
              size="lg"
              className="w-48"
              type="button"
              iconName="default"
            >
              Get Started
            </DynamicButton>
          </div>
        </div>
        {/* Footer */}
        <div className="flex-center space-x-2 mt-20 mb-10">
          <p className="font-base italic text-xs text-gray-500">Powered by</p>
          <img
            src={netbetLogo}
            alt="NetBet Logo"
            className="h-auto w-20 object-contain opacity-80"
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
