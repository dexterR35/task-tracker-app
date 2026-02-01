import { useState, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import Icons from "@/components/icons";
import { showSuccess, showError } from "@/utils/toast";
import { BUTTON_SYSTEM, CARD_SYSTEM } from "@/constants";

const COLORS = CARD_SYSTEM.COLOR_HEX_MAP;
const variantBg = {
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
const darkTextVariants = new Set(["success", "warning", "orange", "amber"]);
const POSITION_MAP = BUTTON_SYSTEM.ICON_POSITION_MAP;
const DEF = BUTTON_SYSTEM.DEFAULTS;

const DynamicButton = memo(function DynamicButton({
  id,
  variant = DEF.VARIANT,
  size = DEF.SIZE,
  children,
  onClick,
  disabled = false,
  loading = false,
  isLoading: isLoadingProp, // alias for loading; do not pass to DOM
  icon: Icon,
  iconPosition = DEF.ICON_POSITION,
  iconName,
  iconCategory = DEF.ICON_CATEGORY,
  type = DEF.TYPE,
  className = "",
  loadingText = DEF.LOADING_TEXT,
  successMessage,
  errorMessage,
  to,
  ...props
}) {
  const [localLoading, setLocalLoading] = useState(false);
  const isLoading = loading || isLoadingProp || localLoading;
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
    const backgroundColor = variantBg[variant] ?? variantBg.primary;
    const color = darkTextVariants.has(variant) ? "var(--color-text-primary)" : "var(--color-text-white)";
    return { backgroundColor, color, border: "none", opacity, cursor };
  }, [variant, isDisabled, isLoading]);

  const handleClick = useCallback(
    async (e) => {
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
    <div className={BUTTON_SYSTEM.LOADING_SPINNER_CLASSES} />
  ) : Icon ? (
    <Icon className={BUTTON_SYSTEM.ICON_CLASSES} />
  ) : ResolvedIcon ? (
    <ResolvedIcon className={BUTTON_SYSTEM.ICON_CLASSES} />
  ) : null;

  const text = isLoading ? loadingText : children;
  const contentClasses = POSITION_MAP[iconPosition] ?? POSITION_MAP.left;
  const isRight = iconPosition === "right";
  const content = (
    <div className={contentClasses}>
      {isRight ? <><span>{text}</span>{iconEl}</> : <>{iconEl}<span>{text}</span></>}
    </div>
  );

  const buttonClasses = `${BUTTON_SYSTEM.BASE_CLASSES} ${BUTTON_SYSTEM.SIZE_MAP[size] ?? BUTTON_SYSTEM.SIZE_MAP[DEF.SIZE]} ${className}`.trim();

  const common = {
    id,
    className: buttonClasses,
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
