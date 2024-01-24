// ScrollingText.tsx
import React from "react";
import "./scrolling-text.css";

interface ScrollingTextProps {
  strings: string[];
}

const ScrollingText: React.FC<ScrollingTextProps> = ({ strings }) => {
  const quadruple = [
    ...strings,
    ...strings,
    ...strings,
    ...strings,
    ...strings,
    ...strings,
  ];

  return (
    <div className="scroll-container">
      <div className="scroll-text text-black text-6xl text-center">
        {quadruple.map((str, index) => (
          <div key={index}>{str}</div>
        ))}
      </div>
    </div>
  );
};

export default ScrollingText;
