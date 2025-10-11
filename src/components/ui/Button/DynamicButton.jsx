import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Icons from "@/components/icons";
import { showSuccess, showError } from "@/utils/toast";
import { BUTTON_SYSTEM } from "@/constants";

const DynamicButton = ({
  id,
  variant = BUTTON_SYSTEM.DEFAULTS.VARIANT,
  size = BUTTON_SYSTEM.DEFAULTS.SIZE,
  children,
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = BUTTON_SYSTEM.DEFAULTS.ICON_POSITION, // "left" | "right" | "center"
  iconName,
  iconCategory = BUTTON_SYSTEM.DEFAULTS.ICON_CATEGORY,
  type = BUTTON_SYSTEM.DEFAULTS.TYPE,
  className = "",
  loadingText = BUTTON_SYSTEM.DEFAULTS.LOADING_TEXT,
  successMessage,
  errorMessage,
  to,
  ...props
}) => {
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = loading || localLoading;
  const isDisabled = disabled || isLoading;

  const buttonClasses = `
    ${BUTTON_SYSTEM.BASE_CLASSES} 
    ${BUTTON_SYSTEM.VARIANT_MAP[variant] || BUTTON_SYSTEM.VARIANT_MAP[BUTTON_SYSTEM.DEFAULTS.VARIANT]} 
    ${BUTTON_SYSTEM.SIZE_MAP[size] || BUTTON_SYSTEM.SIZE_MAP[BUTTON_SYSTEM.DEFAULTS.SIZE]}
    ${isDisabled ? BUTTON_SYSTEM.STATES.DISABLED : ""}
    ${isLoading ? BUTTON_SYSTEM.STATES.LOADING : ""}
    ${className}
  `.trim();

  const handleClick = useCallback(
    async (e) => {
      if (type === "submit") return;
      if (isLoading || isDisabled || !onClick) return;

      try {
        setLocalLoading(true);
        await onClick(e);
        if (successMessage) {
          showSuccess(successMessage);
        }
      } catch (error) {
        const message = errorMessage || error.message || "An error occurred";
        showError(message);
      } finally {
        setLocalLoading(false);
      }
    },
    [isLoading, isDisabled, onClick, successMessage, errorMessage, type]
  );

  const renderIcon = () => {
    if (isLoading) {
      return (
        <div className={BUTTON_SYSTEM.LOADING_SPINNER_CLASSES} />
      );
    }
    // Backward compatibility: explicit Icon prop wins
    if (Icon) {
      return <Icon className={BUTTON_SYSTEM.ICON_CLASSES} />;
    }
    // Resolve from centralized registry if provided
    if (iconName && Icons?.[iconCategory]?.[iconName]) {
      const ResolvedIcon = Icons[iconCategory][iconName];
      return <ResolvedIcon className={BUTTON_SYSTEM.ICON_CLASSES} />;
    }
    return null;
  };

  // Build button content based on iconPosition
  const content = (() => {
    const contentClasses = BUTTON_SYSTEM.ICON_POSITION_MAP[iconPosition] || BUTTON_SYSTEM.ICON_POSITION_MAP[BUTTON_SYSTEM.DEFAULTS.ICON_POSITION];
    
    switch (iconPosition) {
      case "left":
        return (
          <div className={contentClasses}>
            {renderIcon()}
            <span>{isLoading ? loadingText : children}</span>
          </div>
        );
      case "right":
        return (
          <div className={contentClasses}>
            <span>{isLoading ? loadingText : children}</span>
            {renderIcon()}
          </div>
        );
      case "center":
        return (
          <div className={contentClasses}>
            {renderIcon()}
            <span>{isLoading ? loadingText : children}</span>
          </div>
        );
      default:
        return (
          <div className={contentClasses}>
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
