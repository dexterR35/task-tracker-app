import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Icons from "../../icons";
import { useNotifications } from "../../hooks/useNotifications";

const DynamicButton = ({
  id,
  variant = "primary",
  size = "md",
  children,
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = "left", // "left" | "right" | "center"
  iconName,
  iconCategory = "buttons",
  type = "button",
  className = "",
  loadingText = "Loading...",
  successMessage,
  errorMessage,
  to,
  ...props
}) => {
  const [localLoading, setLocalLoading] = useState(false);
  const { addSuccess, addError } = useNotifications();

  const buttonConfig = {
    baseClasses:
      "px-4 py-2 inline-flex rounded-lg font-medium !focus:outline-none focus:ring-gray-200 focus:ring-1 focus:ring-offset-0",
    variants: {
      primary: "bg-btn-primary text-gray-200 shadow-sm",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
      success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm",
      danger: "bg-red-error text-white hover:bg-red-500 !focus:ring-red-error shadow-sm",
      warning: "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 shadow-sm",
      outline: "border-2 border-gray-300 text-gray-200",
    },
    sizes: {
      xs: "px-2 py-1 text-xs",
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-lg !font-medium",
      xl: "px-8 py-4 text-lg",
    },
  };

  const isLoading = loading || localLoading;
  const isDisabled = disabled || isLoading;

  const buttonClasses = `
    ${buttonConfig.baseClasses} 
    ${buttonConfig.variants?.[variant] || buttonConfig.variants.primary} 
    ${buttonConfig.sizes?.[size] || "px-4 py-2 text-sm"}
    ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
    ${className}
  `.trim();

  const handleClick = useCallback(
    async (e) => {
      if (type === "submit") return;
      if (isLoading || isDisabled || !onClick) return;

      try {
        setLocalLoading(true);
        await onClick(e);
        if (successMessage) addSuccess(successMessage);
      } catch (error) {
        const message = errorMessage || error.message || "An error occurred";
        addError(message);
      } finally {
        setLocalLoading(false);
      }
    },
    [isLoading, isDisabled, onClick, successMessage, errorMessage, addSuccess, addError, type]
  );

  const renderIcon = () => {
    if (isLoading) {
      return (
        <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-white animate-spin" />
      );
    }
    // Backward compatibility: explicit Icon prop wins
    if (Icon) {
      return <Icon className="w-4 h-4" />;
    }
    // Resolve from centralized registry if provided
    if (iconName && Icons?.[iconCategory]?.[iconName]) {
      const ResolvedIcon = Icons[iconCategory][iconName];
      return <ResolvedIcon />;
    }
    return null;
  };

  // Build button content based on iconPosition
  const content = (() => {
    switch (iconPosition) {
      case "left":
        return (
          <div className="flex items-center justify-center gap-2 w-full">
            {renderIcon()}
            <span>{isLoading ? loadingText : children}</span>
          </div>
        );
      case "right":
        return (
          <div className="flex items-center justify-center gap-2 w-full">
            <span>{isLoading ? loadingText : children}</span>
            {renderIcon()}
          </div>
        );
      case "center":
        return (
          <div className="flex flex-col items-center justify-center gap-2 w-full">
            {renderIcon()}
            <span>{isLoading ? loadingText : children}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center gap-2 w-full">
            {renderIcon()}
            <span>{isLoading ? loadingText : children}</span>
          </div>
        );
    }
  })();

  // React Router Link
  if (to) {
    const handleLinkClick = async (e) => {
      if (isDisabled || isLoading) {
        e.preventDefault();
        return;
      }
      if (onClick) {
        e.preventDefault();
        await handleClick(e);
      }
    };

    return (
      <Link
        id={id}
        to={to}
        className={buttonClasses}
        onClick={handleLinkClick}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        {...props}
      >
        {content}
      </Link>
    );
  }

  // Native button
  return (
    <button
      id={id}
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      {...props}
    >
      {content}
    </button>
  );
};

export default DynamicButton;
