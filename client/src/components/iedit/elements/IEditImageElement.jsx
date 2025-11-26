import React from "react";

export default function IEditImageElement({ content, variant, settings }) {
  const variants = {
    default: "rounded-lg",
    rounded: "rounded-2xl",
    circle: "rounded-full",
    none: "",
  };

  const borderClass = variants[variant] || variants.default;

  if (!content.imageUrl) {
    return (
      <div className="bg-slate-100 aspect-video rounded-lg flex items-center justify-center">
        <p className="text-slate-400">No image selected</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <img
        src={content.imageUrl}
        alt={content.altText || ""}
        className={`w-full h-auto object-cover ${borderClass}`}
      />
      {content.caption && (
        <p className="text-sm text-slate-600 mt-2 text-center italic">
          {content.caption}
        </p>
      )}
    </div>
  );
}