import React from "react";
import { Icons } from "@/components/icons";
import Badge from "@/components/ui/Badge/Badge";
import { getBadgeColor } from "./cardColors";

// Dynamic Small Card Component
const SmallCard = ({ card }) => {
  const cardColorHex = getCardColorHex(card.color);

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "current":
        return "success";
      case "inactive":
      case "disabled":
        return "error";
      case "filtered":
        return "primary";
      case "historical":
        return "secondary";
      case "admin":
        return "error";
      case "user":
        return "secondary";
      case "reporter":
        return "primary";
      default:
        return "secondary";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "current":
        return "success";
      case "inactive":
      case "disabled":
        return "error";
      case "filtered":
        return "primary";
      case "historical":
        return "secondary";
      case "admin":
        return "error";
      case "user":
        return "secondary";
      case "reporter":
        return "primary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="card-small p-4">
      <div className="h-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className="icon-bg"
                style={{ backgroundColor: `${cardColorHex}20` }}
              >
                <card.icon
                  className="w-6 h-6"
                  style={{ color: cardColorHex }}
                />
              </div>
              <div className="leading-2">
                <h4 className="text-sm font-semibold text-gray-300 !mb-0">
                  {card.title}
                </h4>
                <h5 className="text-xs text-gray-400 mt-0">
                  {card.subtitle}
                </h5>
              </div>
            </div>
            
            {/* Status Badge */}
            {card.status && (
              <Badge variant="default" color={card.color}>
                {card.status}
              </Badge>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Main Value */}
            <div className="mb-6">
              <p className="text-3xl font-bold mb-2" style={{ color: cardColorHex }}>
                {card.value}
              </p>
              <p className="text-sm text-gray-400">{card.description}</p>
            </div>

            {/* Custom Content */}
            {card.content && (
              <div className="mb-6">
                {card.content}
              </div>
            )}

            {/* Enhanced Data */}
            {card.details && card.details.length > 0 && (
              <div className="space-y-1">
                {card.details.map((detail, index) => (
                  <div 
                    key={index}
                    className="p-2 rounded-lg border hover:bg-gray-700/30 transition-colors"
                    style={{ 
                      backgroundColor: `${cardColorHex}10`,
                      borderColor: `${cardColorHex}20`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ 
                            backgroundColor: cardColorHex,
                            background: `linear-gradient(135deg, ${cardColorHex} 0%, ${cardColorHex}dd 100%)`
                          }}
                        ></div>
                        <span className="text-xs text-gray-400">{detail.label}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-300">
                        {detail.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Badges */}
            {card.badges && card.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {card.badges.map((badge, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-1 px-2 py-1 rounded text-xs font-semibold text-white shadow-sm"
                    style={{ backgroundColor: cardColorHex }}
                  >
                    <span>{badge.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Convert card color to hex
const getCardColorHex = (color) => {
  switch (color) {
    case "green":
      return "#10b981"; // green-success
    case "blue":
      return "#3b82f6"; // blue-default
    case "purple":
      return "#8b5cf6"; // btn-primary
    case "red":
      return "#ef4444"; // red-error
    case "yellow":
      return "#f59e0b"; // warning
    case "pink":
      return "#ec4899"; // btn-secondary
    case "gray":
      return "#6b7280"; // secondary
    default:
      return "#6b7280"; // secondary
  }
};

export default SmallCard;
