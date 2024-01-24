import React from "react";

interface BarChartComponentProps {
  barClassName?: string;
  chartClassName?: string;
  data: {
    [key: string]: number;
  };
}

const BarChart: React.FC<BarChartComponentProps> = ({
  data,
  barClassName,
  chartClassName,
}) => {
  // Find the maximum value to scale the bars
  const maxValue = Math.max(...Object.values(data));

  return (
    <div className="mx-10 mt-5">
      {Object.entries(data).map(([day, value]) => (
        <div
          key={day}
          className={`flex items-start flex-col ${chartClassName}`}
        >
          <div style={{ fontWeight: "bold" }}>{day}</div>
          <div
            className={barClassName}
            style={{
              width: `${(value / maxValue) * 100}%`,
              textAlign: "right",
              padding: "5px",
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BarChart;
