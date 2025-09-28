import React from "react";
import { Icons } from "@/components/icons";
import Badge from "@/components/ui/Badge/Badge";

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
      default:
        return "secondary";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "current":
        return "green";
      case "inactive":
      case "disabled":
        return "red";
      case "filtered":
        return "blue";
      case "historical":
        return "gray";
      default:
        return "gray";
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
              <Badge variant={getStatusBadgeVariant(card.status)}>
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
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {detail.icon && (
                        <detail.icon className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-400">{detail.label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      {detail.value}
                    </span>
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
