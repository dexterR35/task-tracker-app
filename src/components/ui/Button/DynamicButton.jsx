import { useState, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import Icons from "@/components/icons";
import { showSuccess, showError } from "@/utils/toast";
import { CARD_SYSTEM } from "@/constants";

// -----------------------------------------------------------------------------
// Config – sizes, icon layout, defaults (styles from index.css .btn)
// -----------------------------------------------------------------------------

const SIZE_MAP = { xs: "xs", sm: "sm", md: "md", lg: "lg", xl: "xl" };
// Primary uses inline style with color_default; others use CSS classes
const CSS_VARIANTS = new Set([
  "secondary",
  "success",
  "danger",
  "warning",
  "outline",
  "ghost",
]);

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

// Fallback for non-CSS variants (amber, blue, pink, etc.) – inline style
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
  "aria-label": ariaLabel,
  ...props
}) {
  const [localLoading, setLocalLoading] = useState(false);
  const isLoading = loading || localLoading;
  const isDisabled = disabled || isLoading;

  const useCssVariant = CSS_VARIANTS.has(variant) || variant === "edit";
  const cssVariant = variant === "edit" ? "primary" : variant;
  const getStyle = useCallback(() => {
    if (useCssVariant) return {};
    const cursor = isDisabled ? "not-allowed" : isLoading ? "wait" : "pointer";
    const opacity = isDisabled ? 0.6 : 1;
    const backgroundColor = VARIANT_BG[variant] ?? VARIANT_BG.primary;
    const color = DARK_TEXT_VARIANTS.has(variant)
      ? "var(--color-text-primary)"
      : "var(--color-text-white)";
    return { backgroundColor, color, border: "none", opacity, cursor };
  }, [variant, isDisabled, isLoading, useCssVariant]);

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
  const iconWrapperClass = "btn__icon";
  const iconEl = isLoading ? (
    <span
      className={`${iconWrapperClass} rounded-full border-2 border-current border-t-transparent animate-spin`}
      aria-hidden
    />
  ) : Icon ? (
    <Icon className={iconWrapperClass} aria-hidden />
  ) : ResolvedIcon ? (
    <ResolvedIcon className={iconWrapperClass} aria-hidden />
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

  const sizeKey = SIZE_MAP[size] ?? SIZE_MAP[DEFAULTS.size];
  const btnClasses = [
    "btn",
    `btn--${sizeKey}`,
    useCssVariant ? `btn--${cssVariant}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const common = {
    id,
    className: btnClasses,
    style: getStyle(),
    "aria-disabled": isDisabled,
    "aria-busy": isLoading,
    "aria-label": ariaLabel ?? (isLoading ? loadingText : undefined),
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
