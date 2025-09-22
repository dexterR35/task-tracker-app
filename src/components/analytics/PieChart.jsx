import React from "react";
import { Chart } from "react-google-charts";

const PieChart = ({ 
  data = [],
  title = "Pie Chart",
  options = {},
  width = "100%",
  height = "400px",
  className = ""
}) => {
  // Default chart options
  const defaultOptions = {
    title: title,
    pieHole: 0.4,
    is3D: true,
    pieStartAngle: 100,
    sliceVisibilityThreshold: 0.02,
    legend: {
      position: "bottom",
      alignment: "center",
      textStyle: {
        color: "#ffffff",
        fontSize: 14,
      },
    },
    titleTextStyle: {
      color: "#ffffff",
      fontSize: 18,
    },
    colors: ["#8AD1C2", "#9F8AD1", "#D18A99", "#BCD18A", "#D1C28A", "#C28AD1"],
    backgroundColor: "transparent",
    ...options // Override with custom options
  };

  // If no data provided, show error
  if (!data || data.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
        <div className="text-center text-red-400 py-8">
          <div className="text-lg font-semibold mb-2">⚠️ No Data Available</div>
          <div className="text-gray-300">No data is provided for this chart.</div>
        </div>
      </div>
    );
  }

  // Validate data format
  const isValidData = Array.isArray(data) && data.length > 1 && Array.isArray(data[0]);
  if (!isValidData) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
        <div className="text-center text-red-400 py-8">
          <div className="text-lg font-semibold mb-2">⚠️ Invalid Data Format</div>
          <div className="text-gray-300">Chart data must be an array of arrays (e.g., [["Category", "Value"], ["A", 10], ["B", 20]]).</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      <div className="bg-gray-700 rounded-lg p-4">
        <Chart
          chartType="PieChart"
          data={data}
          options={defaultOptions}
          width={width}
          height={height}
        />
      </div>
    </div>
  );
};

export default PieChart;
