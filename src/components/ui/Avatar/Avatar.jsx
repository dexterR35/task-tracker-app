import React from 'react';
import { Icons } from '@/components/icons';

const Avatar = ({
  user = null,
  name = null,
  email = null,
  src = null,
  icon = null,
  iconName = null,
  size = 'md',
  gradient = 'from-blue-default to-btn-primary',
  backgroundColor = null,
  className = '',
  showEmail = false,
  showName = true,
  fallbackIcon = Icons.generic.user,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };
  const userName = user?.name || name || 'No Name';
  const userEmail = user?.email || email;
  const userInitials = userName.substring(0, 2).toUpperCase();
  const imageUrl = src ?? user?.avatarUrl;
  const showImage = imageUrl && !imgError;

  const isIconAvatar = icon || iconName;
  const IconComponent = icon || (iconName && Icons[iconName]) || fallbackIcon;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`flex-shrink-0 ${sizeClass}`}>
        <div
          className={`${sizeClass} rounded-full flex items-center justify-center overflow-hidden ${!showImage && (backgroundColor ? '' : `bg-gradient-to-br ${gradient}`)}`}
          style={!showImage && backgroundColor ? { backgroundColor } : {}}
        >
          {showImage ? (
            <img
              src={imageUrl}
              alt=""
              className={`${sizeClass} w-full h-full object-cover`}
              onError={() => setImgError(true)}
            />
          ) : isIconAvatar ? (
            <IconComponent className="text-white" />
          ) : (
            <span className="font-medium text-white">{userInitials}</span>
          )}
        </div>
      </div>

      {/* User Info (only for user avatars) */}
      {!isIconAvatar && showName && (
        <div className="ml-4">
          <div className="text-sm font-medium text-white">
            {userName}
          </div>
          {showEmail && userEmail && (
            <div className="text-xs text-gray-400">
              {userEmail}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Avatar;
