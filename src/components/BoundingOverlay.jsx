
import React, { useState, useEffect, useRef } from 'react';
import './BoundingOverlay.css';

export default function BoundingOverlay({ boxes, imageRef }) {
  const [showBoxes, setShowBoxes] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBoxes(true), 600);
    return () => clearTimeout(timer);
  }, [boxes]);

  if (!boxes || boxes.length === 0) return null;

  return (
    <div className="bounding-overlay">
      {boxes.map((box, i) => (
        <div
          key={i}
          className={`bounding-box ${showBoxes ? 'visible' : ''}`}
          style={{
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: `${box.w}%`,
            height: `${box.h}%`,
            transitionDelay: `${i * 0.2}s`,
          }}
        >
          <span className="bounding-label">
            {box.label} ({Math.round(box.confidence * 100)}%)
          </span>
          <span className="bounding-corner tl" />
          <span className="bounding-corner tr" />
          <span className="bounding-corner bl" />
          <span className="bounding-corner br" />
        </div>
      ))}
    </div>
  );
}
