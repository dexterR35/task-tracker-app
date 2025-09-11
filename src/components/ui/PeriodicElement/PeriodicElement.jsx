import React from "react";
import "./PeriodicElement.css";

const PeriodicElement = ({
  symbol,
  name,
  size = "large",
  type = "user", // 'user' or 'reporter' only
  atomicNumber,
  atomicWeight,
  customNumber,
}) => {
  const sizeClasses = {
    small: "periodic-element--small",
    medium: "periodic-element--medium",
    large: "periodic-element--large",
  };

  // Add type-specific class for styling
  const typeClass = `periodic-element--${type}`;

  return (
    <div className={`periodic-element ${sizeClasses[size]} ${typeClass}`}>
      <div className="periodic-element__atomic-number">
        <span>{atomicNumber}</span> <span>{customNumber}</span>
      </div>
      <div className="periodic-element__symbol">{symbol}</div>
      <div className="periodic-element__name">{name}</div>
      <div className="periodic-element__atomic-weight">{atomicWeight}</div>
    </div>
  );
};

export default PeriodicElement;
