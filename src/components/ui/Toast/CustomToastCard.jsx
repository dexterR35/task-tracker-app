import React from "react";
import toast from "react-hot-toast";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.2&w=160&h=160&q=80";

/**
 * Card-style custom toast for react-hot-toast.
 * Use with: toast.custom((t) => <CustomToastCard t={t} name="..." message="..." />)
 * Or use showCustomToast() from @/utils/toast.
 */
const CustomToastCard = ({
  t,
  name = "Notification",
  message = "",
  avatarSrc = DEFAULT_AVATAR,
  closeLabel = "Close",
  accentClass = "text-indigo-600 hover:text-indigo-500 focus:ring-indigo-500",
}) => {
  const handleClose = () => toast.dismiss(t.id);

  return (
    <div
      className={`${
        t.visible ? "animate-custom-enter" : "animate-custom-leave"
      } max-w-md w-full bg-white dark:bg-smallCard shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10`}
    >
      <div className="flex-1 w-0 p-4 min-w-0">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-0.5">
            <img
              className="h-10 w-10 rounded-full object-cover bg-gray-200 dark:bg-gray-700"
              src={avatarSrc}
              alt=""
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {name}
            </p>
            {message ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {message}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200 dark:border-gray-600">
        <button
          type="button"
          onClick={handleClose}
          className={`w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-inset ${accentClass}`}
        >
          {closeLabel}
        </button>
      </div>
    </div>
  );
};

export default CustomToastCard;
