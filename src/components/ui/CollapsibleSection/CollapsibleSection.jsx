import React, { useState } from "react";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import { Icons } from "@/components/icons";

const CollapsibleSection = ({
  title,
  children,
  defaultOpen = true,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={className}>
      {/* Header with title and button */}
      <div className="flex justify-between items-center gap-4 mb-4">
        {title && (
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
        )}
        <DynamicButton
          onClick={toggle}
          variant="outline"
          size="sm"
        >
          {isOpen ? "Hide" : "Show"}
        </DynamicButton>
      </div>

      {/* Content */}
      {isOpen && <div>{children}</div>}
    </div>
  );
};

export default CollapsibleSection;

