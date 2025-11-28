import React, { useState } from "react";
import { Icons } from "@/components/icons";
import { HOW_TO_USE_CONTENT, HOW_TO_USE_ITEMS } from "./howToUseConfig";

const HowToUseSidebar = ({ isOpen, onClose }) => {
  const [selectedItem, setSelectedItem] = useState(HOW_TO_USE_ITEMS[0]?.id || null);

  if (!isOpen) return null;

  const content = selectedItem ? HOW_TO_USE_CONTENT[selectedItem] : null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-smallCard shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Icons.generic.help className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              How to Use
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            <Icons.buttons.cancel className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-y-auto">
            <nav className="p-2 space-y-1">
              {HOW_TO_USE_ITEMS.map((item) => {
                const Icon = Icons.generic[item.icon] || Icons.generic.help;
                const isActive = selectedItem === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-left">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {content ? (
              <div className="p-6 space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {content.title}
                </h3>

                {content.sections.map((section, sectionIndex) => (
                  <div
                    key={sectionIndex}
                    className={`${
                      section.isImportant
                        ? "bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500"
                        : ""
                    }`}
                  >
                    <p className="font-medium mb-3 text-gray-900 dark:text-white">
                      {section.title}
                    </p>
                    <div className="space-y-2">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="text-sm">
                          {item.subItems ? (
                            <div className="ml-2">
                              <p className="font-medium mb-2 text-gray-800 dark:text-gray-200">
                                {item.text}:
                              </p>
                              <ul className="list-disc list-inside space-y-1 ml-4 text-gray-600 dark:text-gray-400">
                                {item.subItems.map((subItem, subIndex) => (
                                  <li key={subIndex}>
                                    <span className="font-medium">{subItem.text}</span>
                                    {subItem.description && (
                                      <span> - {subItem.description}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-400">
                              <li>
                                <span className="font-medium">{item.text}</span>
                                {item.description && (
                                  <span> - {item.description}</span>
                                )}
                              </li>
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                Select an item from the menu
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HowToUseSidebar;

