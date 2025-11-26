import React from "react";
import ReactMarkdown from "react-markdown";

export default function IEditTwoColumnElement({ content, variant, settings }) {
  const variants = {
    default: "md:grid-cols-2",
    "60-40": "md:grid-cols-[60%_40%]",
    "40-60": "md:grid-cols-[40%_60%]",
  };

  const gridClass = variants[variant] || variants.default;

  return (
    <div className={`grid ${gridClass} gap-8`}>
      {/* Left Column */}
      <div>
        {content.leftHeading && (
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            {content.leftHeading}
          </h3>
        )}
        {content.leftContent && (
          <div className="prose text-slate-600">
            <ReactMarkdown>{content.leftContent}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Right Column */}
      <div>
        {content.rightHeading && (
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            {content.rightHeading}
          </h3>
        )}
        {content.rightContent && (
          <div className="prose text-slate-600">
            <ReactMarkdown>{content.rightContent}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}