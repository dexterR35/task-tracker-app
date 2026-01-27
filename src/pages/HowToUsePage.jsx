import React, { useState } from "react";
import { Icons } from "@/components/icons";
import { HOW_TO_USE_CONTENT, HOW_TO_USE_ITEMS } from "@/components/layout/HowToUse/howToUseConfig";

const HowToUsePage = () => {
  const [selectedItem, setSelectedItem] = useState(HOW_TO_USE_ITEMS[0]?.id || null);

  const content = selectedItem ? HOW_TO_USE_CONTENT[selectedItem] : null;

  return (
    <div className="how-to-use-page p-6">
      <div className="flex gap-6">
        {/* Left Navigation Sidebar - Sticky */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-6">
            <div className="card">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Icons.generic.help className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    How to Use
                  </h2>
                </div>
              </div>
              <nav className="p-4 space-y-2">
              {HOW_TO_USE_ITEMS.map((item) => {
                const Icon = Icons.generic[item.icon] || Icons.generic.help;
                const isActive = selectedItem === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-700"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-left">{item.label}</span>
                  </button>
                );
              })}
              </nav>
            </div>
          </div>
        </div>

        {/* Right Content Area - Single Card */}
        <div className="flex-1">
          {content ? (
            <div className="card">
              <div className="p-6">
                {/* Title */}
                <div className="flex items-start gap-3 mb-6">
                  <div className="flex-shrink-0 mt-1">
                    <Icons.generic.help className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {content.title}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Complete guide to using this feature
                    </p>
                  </div>
                </div>

                {/* All Content Sections in One Card */}
                <div className="space-y-6">
                  {content.sections.map((section, sectionIndex) => {
                    // Check if section has custom component
                    const hasCustomComponent = section.items?.some(item => item.type === "custom");
                    
                    if (hasCustomComponent) {
                      return (
                        <div key={sectionIndex} className="space-y-4">
                          {section.items.map((item, itemIndex) => {
                            if (item.type === "custom") {
                              return <div key={itemIndex}>{item.component}</div>;
                            }
                            return null;
                          })}
                        </div>
                      );
                    }
                    
                    // Regular section rendering
                    return (
                      <div
                        key={sectionIndex}
                        className={`${
                          section.isImportant
                            ? "bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500"
                            : ""
                        }`}
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          {section.isImportant && (
                            <Icons.generic.warning className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          )}
                          {section.title}
                        </h3>
                        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                          {section.items.map((item, itemIndex) => (
                            <div key={itemIndex}>
                              {item.subItems ? (
                                <div>
                                  <p className="font-semibold mb-2 text-gray-900 dark:text-white">
                                    {item.text}:
                                  </p>
                                  <ul className="list-disc list-inside space-y-1.5 ml-2 text-gray-600 dark:text-gray-400">
                                    {item.subItems.map((subItem, subIndex) => (
                                      <li key={subIndex} className="leading-relaxed">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                          {subItem.text}
                                        </span>
                                        {subItem.description && (
                                          <span className="text-gray-600 dark:text-gray-400">
                                            {" "}- {subItem.description}
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-400">
                                  <li>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      {item.text}
                                    </span>
                                    {item.description && (
                                      <span className="text-gray-600 dark:text-gray-400">
                                        {" "}- {item.description}
                                      </span>
                                    )}
                                  </li>
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="p-12 text-center">
                <Icons.generic.help className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  Select an item from the menu to view instructions
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HowToUsePage;

