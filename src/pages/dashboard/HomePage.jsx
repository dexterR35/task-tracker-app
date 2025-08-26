import React from "react";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import netbetLogo from "../../assets/netbet-logo.png";
const HomePage = () => {
  return (
    <div className="min-h-screen flex-center ">
      <div className="text-center md:max-w-4xl mx-auto block px-4">
        {/* Logo */}
        <div className=" md:flex-row space-x-4">
          <h1>
            <span className="text-red-error">Welcome</span> to Task Tracker
          </h1>
        </div>
        <p className="text-sm my-2 md:max-w-xl mx-auto">
          “Manage tasks, track time, calculate monthly reports, and analyze
          performance, designed for teams that prioritize efficiency and
          clarity.”
        </p>

        <div className="my-6">
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
        <div className="flex-center space-x-2 !items-center my-2 absolute bottom-5 left-1/2 -translate-x-1/2 ">
          <p className="font-base italic text-sm min-h-[30px] flex-center !items-end">
            pwd by
          </p>
          <img
            src={netbetLogo}
            alt="NetBet Logo"
            className="h-auto w-32 m-0 object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
