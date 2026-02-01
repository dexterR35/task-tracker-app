/**
 * Shared status layout – Access Denied, 404, Coming Soon, Error Boundary.
 * Uses CardWithStrip (same small-card layout as SmallCard).
 */
import React from "react";
import CardWithStrip from "@/components/ui/CardWithStrip";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import { Icons } from "@/components/icons";
import { CARD_SYSTEM } from "@/constants";

const COLOR_DEFAULT = CARD_SYSTEM.COLOR_HEX_MAP.color_default;

/** Strip and primary button use color_default from constants. */
const STRIP_COLOR = COLOR_DEFAULT;
const PRIMARY_BUTTON_STYLE = {
  backgroundColor: COLOR_DEFAULT,
  color: "#fff",
};

const VARIANT_ICON_CLASSES = {
  "access-denied":
    "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40",
  "not-found":
    "bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border border-gray-200/80 dark:border-gray-700/60",
  "coming-soon":
    "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40",
  error:
    "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40",
};

const ICON_CIRCLE_VARIANTS = { "access-denied": true, error: true };

function DefaultIcon({ variant }) {
  if (variant === "coming-soon") {
    return <span className="text-3xl" aria-hidden>🚧</span>;
  }
  const Icon = variant === "error" ? Icons.generic.warning : Icons.buttons.alert;
  return Icon ? <Icon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} /> : null;
}

/**
 * @param {{
 *   variant: 'access-denied' | 'not-found' | 'coming-soon' | 'error';
 *   title: string;
 *   message: string;
 *   icon?: React.ReactNode;
 *   primaryAction: { to?: string; onClick?: () => void; label: string; iconName?: string };
 *   secondaryAction?: { to?: string; onClick?: () => void; label: string; iconName?: string };
 *   tertiaryAction?: { to?: string; onClick?: () => void; label: string; iconName?: string };
 *   children?: React.ReactNode;
 *   className?: string;
 *   fullScreen?: boolean;
 * }} props
 */
const StatusPage = ({
  variant,
  title,
  message,
  icon,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  children,
  className = "",
  fullScreen = false,
}) => {
  const iconClass = VARIANT_ICON_CLASSES[variant] ?? VARIANT_ICON_CLASSES["not-found"];
  const iconCircle = ICON_CIRCLE_VARIANTS[variant] ?? false;

  const renderAction = (action, btnVariant = "primary", size = "md") => {
    if (!action) return null;
    const iconName =
      action.iconName ?? (action.label.toLowerCase().includes("home") ? "home" : undefined);
    const isPrimary = btnVariant === "primary";
    return (
      <DynamicButton
        to={action.to}
        onClick={action.onClick}
        variant={btnVariant}
        size={size}
        type="button"
        className="w-full"
        style={isPrimary ? PRIMARY_BUTTON_STYLE : undefined}
        iconName={iconName === "home" ? "home" : iconName}
        iconPosition="left"
        iconCategory={iconName === "home" ? "cards" : "buttons"}
      >
        {action.label}
      </DynamicButton>
    );
  };

  const wrapperClass = [
    "min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-[#0c0e14]",
    fullScreen ? "fixed inset-0 z-50" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass}>
      <div className="w-full max-w-[26rem]">
        <CardWithStrip
          stripColor={STRIP_COLOR}
          innerClassName="flex flex-col items-center text-center"
          stripAriaHidden
        >
          <div
            className={`flex items-center justify-center shrink-0 w-16 h-16 mb-5 rounded-xl ${iconCircle ? "!rounded-full" : ""} ${iconClass}`}
          >
            {icon ?? <DefaultIcon variant={variant} />}
          </div>
          <h1 className="font-bold tracking-tight text-text-primary dark:text-text-white text-[1.375rem] sm:text-2xl leading-tight mb-2 [letter-spacing:-0.025em]">
            {title}
          </h1>
          <p className="text-app-muted text-[0.9375rem] leading-[1.55] max-w-[20rem] mb-7">
            {message}
          </p>
          <div className="flex flex-col gap-3 w-full">
            {primaryAction && renderAction(primaryAction, "primary", "md")}
            {secondaryAction && renderAction(secondaryAction, "outline", "md")}
            {tertiaryAction && renderAction(tertiaryAction, "outline", "sm")}
          </div>
          {children && (
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700/60 w-full text-left [&>p]:text-xs [&>p]:text-app-muted [&>p]:leading-relaxed [&>p]:mb-0 [&>details]:mt-2 [&>summary]:cursor-pointer [&>summary]:text-sm [&>summary]:font-medium [&>summary]:text-app [&>pre]:mt-2 [&>pre]:text-xs [&>pre]:whitespace-pre-wrap [&>pre]:rounded-lg [&>pre]:overflow-auto [&>pre]:max-h-40 [&>pre]:p-3 [&>pre]:bg-gray-100 dark:[&>pre]:bg-gray-700/50 [&>pre]:text-red-error dark:[&>pre]:text-red-400">
              {children}
            </div>
          )}
        </CardWithStrip>
      </div>
    </div>
  );
};

export default StatusPage;
