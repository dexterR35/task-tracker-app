import React from "react";
import DynamicButton from "../Button/DynamicButton";

const ComingSoonPage = ({
  title = "Coming Soon",
  description = "This feature is under development and will be available soon.",
  showHomeLink = true,
  customAction = null,
}) => {
  return (
     <div className="min-h-screen flex-center relative">
      <div className="card relative">
        <div className="mb-6 text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">🚧</span>
            </div>
          </div>
          <h2>
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{description}</p>
        </div>
        <div className="space-y-3">
          {customAction && <div className="mb-4">{customAction}</div>}

          {showHomeLink && (
            <DynamicButton
              to="/"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              variant="primary"
              size="lg"
              type="button"
              iconName="default"
            >
              Go to Home
            </DynamicButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
