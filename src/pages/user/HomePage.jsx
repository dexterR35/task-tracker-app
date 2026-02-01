import React from "react";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import UmbrellaLogo from "@/components/ui/UmbrellaLogo";
import { APP_CONFIG } from "@/constants";

const HomePage = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center flex-col">
      <div className="max-w-[90%] w-full mx-auto px-4 relative pt-10">
        {/* Hero Section */}
        <div className="mb-5 flex-center flex-col">
          <div className="flex justify-center items-stretch gap-6 mb-6">
            <div className="flex flex-col items-center">
            {/* <p className="text-gray-900 dark:text-white text-4xl self-start font-bold ">Welcome to </p> */}
              <h1 className="text-7xl md:text-[120px] text-center my-0 !font-bold">
                <span className="text-[#f68700]">./{APP_CONFIG.NAME}</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 text-end w-full !leading-1">Task Tracker </p>
            </div>
            <UmbrellaLogo size={100} className="flex-shrink-0 self-center" />
          </div>
          <p className="md:text-lg max-w-xl  text-center mb-10">
            The task management  designed for teams that prioritize{" "} <br></br>
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
      </div>
    </div>
  );
};

export default HomePage;
