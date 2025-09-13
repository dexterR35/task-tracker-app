import React from 'react';

const AdminPageHeader = ({ 
  title, 
  subtitle, 
  icon = '⚙️',
  gradient = 'from-blue-900 via-purple-900 to-indigo-900',
  rightContent = null 
}) => {
  return (
    <div className={`bg-gradient-to-r ${gradient} border-b border-gray-700`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`flex items-center ${rightContent ? 'justify-between' : 'justify-start'}`}>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <span className="text-4xl mr-3">{icon}</span>
              {title}
            </h1>
            <p className="text-blue-200 text-lg">
              {subtitle}
            </p>
          </div>
          {rightContent && (
            <div className="hidden sm:block">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPageHeader;
