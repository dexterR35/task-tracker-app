import React from 'react';
import Loader from './Loader';

const PageLoader = ({ 
  text = 'Loading...', 
  size = 'lg',
  variant = 'spinner',
  className = ''
}) => {
  return (
    <div className={`min-h-[50vh] flex-center ${className}`}>
      <Loader 
        size={size} 
        text={text} 
        variant={variant}
      />
    </div>
  );
};

export default PageLoader;
