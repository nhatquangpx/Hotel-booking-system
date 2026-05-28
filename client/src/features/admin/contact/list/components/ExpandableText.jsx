import React from "react";

const ExpandableText = ({ text, isExpanded, onToggle, limit = 180 }) => {
  const rawText = String(text || "");
  const trimmedText = rawText.trim();
  if (!trimmedText) return "-";

  const isLong = trimmedText.length > limit;
  const displayText = !isLong || isExpanded ? trimmedText : `${trimmedText.slice(0, limit)}...`;

  return (
    <div className="expandable-text">
      <div className="expandable-text__content">{displayText}</div>
      {isLong && (
        <button type="button" className="expandable-text__toggle" onClick={onToggle}>
          {isExpanded ? "Thu gọn" : "Hiển thị đầy đủ"}
        </button>
      )}
    </div>
  );
};

export default ExpandableText;
