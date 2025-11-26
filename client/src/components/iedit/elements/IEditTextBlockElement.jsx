import React from "react";
import ReactMarkdown from "react-markdown";

export default function IEditTextBlockElement({ content, variant, settings }) {
  const variants = {
    default: "",
    centered: "text-center",
    large: "text-lg",
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <div className={variantClass}>
      {content.heading && (
        <h2 className="text-3xl font-bold text-slate-900 mb-6">
          {content.heading}
        </h2>
      )}
      {content.text && (
        <div className="prose prose-lg max-w-none text-slate-600">
          <ReactMarkdown>{content.text}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}