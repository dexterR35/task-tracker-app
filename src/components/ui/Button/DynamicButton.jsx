import { useState, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import Icons from "@/components/icons";
import { showSuccess, showError } from "@/utils/toast";
import { CARD_SYSTEM } from "@/constants";

// -----------------------------------------------------------------------------
// Config – base classes, sizes, icon layout, defaults (single source in component)
// -----------------------------------------------------------------------------

const BASE_CLASSES =
  "px-3 py-2 inline-flex rounded-md font-medium shadow-sm !focus:outline-none transition-all duration-200";

const SIZE_CLASSES = {
  xs: "px-2 py-1 text-xs",
  sm: "px-2.5 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-2 py-3 text-lg",
  xl: "px-6 py-3 text-2xl",
};

const ICON_CLASSES = "w-4 h-4";
const LOADING_SPINNER_CLASSES =
  "w-4 h-4 rounded-full border-2 border-transparent border-t-white animate-spin";

const CONTENT_LAYOUT = {
  left: "flex items-center justify-center gap-2 w-full",
  right: "flex items-center justify-center gap-2 w-full",
  center: "flex flex-col items-center justify-center w-full",
};

const DEFAULTS = {
  variant: "primary",
  size: "sm",
  iconPosition: "left",
  iconCategory: "buttons",
  type: "button",
  loadingText: "Loading...",
};

// Variant → background color (from CARD_SYSTEM); outline handled via inline style
const COLORS = CARD_SYSTEM.COLOR_HEX_MAP;
const VARIANT_BG = {
  primary: COLORS.color_default,
  secondary: COLORS.dark_gray,
  success: COLORS.green,
  danger: COLORS.red,
  warning: COLORS.yellow,
  amber: COLORS.amber,
  blue: COLORS.blue,
  pink: COLORS.pink,
  orange: COLORS.orange,
  purple: COLORS.purple,
  crimson: COLORS.crimson,
  edit: COLORS.blue,
};
const DARK_TEXT_VARIANTS = new Set(["success", "warning", "orange", "amber"]);

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * DynamicButton – for forms, login, and simple action buttons.
 *
 * 1. Form submit: type="submit", loading={isSubmitting}, loadingText="Sending…". Form onSubmit runs;
 *    button shows spinner and label from props.
 * 2. Login / submit with icon: same as above + iconName, iconPosition (e.g. iconName="login").
 * 3. Simple button: type="button" (default), onClick, optional iconName/icon, optional to (renders Link).
 *
 * Props: variant, size, type ("button" | "submit"), children, onClick, disabled, loading, loadingText,
 * icon, iconName, iconPosition, iconCategory, successMessage, errorMessage, to, className, + rest.
 */
const DynamicButton = memo(function DynamicButton({
  id,
  variant = DEFAULTS.variant,
  size = DEFAULTS.size,
  children,
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = DEFAULTS.iconPosition,
  iconName,
  iconCategory = DEFAULTS.iconCategory,
  type = DEFAULTS.type,
  className = "",
  loadingText = DEFAULTS.loadingText,
  successMessage,
  errorMessage,
  to,
  ...props
}) {
  const [localLoading, setLocalLoading] = useState(false);
  const isLoading = loading || localLoading;
  const isDisabled = disabled || isLoading;

  const getStyle = useCallback(() => {
    const cursor = isDisabled ? "not-allowed" : isLoading ? "wait" : "pointer";
    const opacity = isDisabled ? 0.5 : 1;
    if (variant === "outline") {
      return {
        backgroundColor: "transparent",
        color: "var(--color-text-primary)",
        border: "1px solid var(--color-gray-200)",
        opacity,
        cursor,
      };
    }
    const backgroundColor = VARIANT_BG[variant] ?? VARIANT_BG.primary;
    const color = DARK_TEXT_VARIANTS.has(variant)
      ? "var(--color-text-primary)"
      : "var(--color-text-white)";
    return { backgroundColor, color, border: "none", opacity, cursor };
  }, [variant, isDisabled, isLoading]);

  const handleClick = useCallback(
    async (e) => {
      // type="submit" → let form onSubmit run; we only handle async onClick for type="button"
      if (type === "submit" || isLoading || isDisabled || !onClick) return;
      try {
        setLocalLoading(true);
        await onClick(e);
        if (successMessage) showSuccess(successMessage);
      } catch (err) {
        showError(errorMessage ?? err.message ?? "An error occurred");
      } finally {
        setLocalLoading(false);
      }
    },
    [type, isLoading, isDisabled, onClick, successMessage, errorMessage]
  );

  const ResolvedIcon = iconName && Icons?.[iconCategory]?.[iconName];
  const iconEl = isLoading ? (
    <div className={LOADING_SPINNER_CLASSES} aria-hidden />
  ) : Icon ? (
    <Icon className={ICON_CLASSES} aria-hidden />
  ) : ResolvedIcon ? (
    <ResolvedIcon className={ICON_CLASSES} aria-hidden />
  ) : null;

  const text = isLoading ? loadingText : children;
  const contentLayout = CONTENT_LAYOUT[iconPosition] ?? CONTENT_LAYOUT.left;
  const isRight = iconPosition === "right";
  const content = (
    <span className={contentLayout}>
      {isRight ? (
        <>
          <span>{text}</span>
          {iconEl}
        </>
      ) : (
        <>
          {iconEl}
          <span>{text}</span>
        </>
      )}
    </span>
  );

  const sizeClasses = SIZE_CLASSES[size] ?? SIZE_CLASSES[DEFAULTS.size];
  const buttonClassName = `${BASE_CLASSES} ${sizeClasses} ${className}`.trim();

  const common = {
    id,
    className: buttonClassName,
    style: getStyle(),
    "aria-disabled": isDisabled,
    "aria-busy": isLoading,
    ...props,
  };

  if (to) {
    return (
      <Link
        to={to}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        onClick={async (e) => {
          if (isDisabled || isLoading) {
            e.preventDefault();
            return;
          }
          if (onClick) {
            e.preventDefault();
            await handleClick(e);
          }
        }}
        {...common}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={handleClick} disabled={isDisabled} {...common}>
      {content}
    </button>
  );
});

export default DynamicButton;
