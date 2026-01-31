import React, { useState, useRef, useEffect } from 'react';

/**
 * Custom Tooltip Component
 * Displays user information with color indicators
 */
const Tooltip = ({ children, content, users = [] }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    // Use requestAnimationFrame to batch DOM reads/writes and avoid forced reflow
    if (isVisible && triggerRef.current && tooltipRef.current) {
      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        // Check if nodes still exist (prevents "Node cannot be found" error)
        if (!triggerRef.current || !tooltipRef.current) {
          return;
        }

        try {
          const triggerRect = triggerRef.current.getBoundingClientRect();
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          // Calculate position
          let top = triggerRect.top - tooltipRect.height - 8;
          let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);

          // Adjust if tooltip goes off screen
          if (left < 8) {
            left = 8;
          } else if (left + tooltipRect.width > viewportWidth - 8) {
            left = viewportWidth - tooltipRect.width - 8;
          }

          if (top < 8) {
            // Show below instead
            top = triggerRect.bottom + 8;
          }

          // Batch style updates
          if (tooltipRef.current) {
            tooltipRef.current.style.top = `${top}px`;
            tooltipRef.current.style.left = `${left}px`;
          }
        } catch (error) {
          // Silently handle DOM access errors (node might have been removed)
          console.warn('Tooltip positioning error:', error);
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isVisible]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  if (!content && users.length === 0) {
    return children;
  }

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full"
      >
        {children}
      </div>
      {isVisible && (content || users.length > 0) && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg pointer-events-none"
          style={{
            transform: 'translateX(-50%)',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {content && (
            <div className={typeof content === 'string' ? 'mb-1 font-semibold' : ''}>
              {typeof content === 'string' ? content : content}
            </div>
          )}
          {users.length > 0 && (
            <div className="space-y-1.5">
              {users.map((user, index) => (
                <div key={user.id || user.userName ? `${user.id || user.userName}-${user.color || index}` : `user-${index}`} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded border border-gray-600 flex-shrink-0"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="whitespace-nowrap">{user.userName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tooltip;

