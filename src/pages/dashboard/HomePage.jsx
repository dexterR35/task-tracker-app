import React from "react";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import netbetLogo from "../../assets/netbet-logo.png";
const HomePage = () => {
  return (
    <div className="min-h-screen flex-center bg-primary ">
      <div className="text-center md:max-w-2xl mx-auto block px-4">
        {/* Logo */}
        <div className="flex-center flex- md:flex-row space-x-4">
          <h1>Welcome to</h1>

          <img
            src={netbetLogo}
            alt="NetBet Logo"
            className="h-full w-auto m-0 object-contain"
          />
        </div>
        <h1>Task Tracker</h1>

        {/* Description */}
        <p className="text-lg text-gray-300 mb-12 mt-6">
        “Manage tasks, track time, calculate monthly reports, and analyze performance, designed for teams that prioritize efficiency and clarity.”
        </p>

        {/* CTA Button */}
        <div className="space-y-4">
          <DynamicButton
            to="/login"
            variant="primary"
            size="lg"
            className="text-lg"
            type="button"
            iconName="default"
    
          >
            Get Started
          </DynamicButton>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
