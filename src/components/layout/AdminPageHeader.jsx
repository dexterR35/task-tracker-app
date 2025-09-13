import React from 'react';
import { Icons } from '@/components/icons';

const AdminPageHeader = ({ 
  title, 
  subtitle, 
  icon = 'settings',
  gradient = 'from-blue-900 via-purple-900 to-indigo-900',
  rightContent = null 
}) => {
  const IconComponent = Icons.admin[icon] || Icons.generic[icon] || Icons.buttons[icon];
  
  return (
    <div className={`bg-gradient-to-r ${gradient} border-b border-gray-700`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`flex items-center ${rightContent ? 'justify-between' : 'justify-start'}`}>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <IconComponent className="w-8 h-8 mr-3" />
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
