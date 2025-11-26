import React from "react";
import { Button } from "@/components/ui/button";

export default function IEditCtaButtonElement({ content, variant, settings }) {
  const variants = {
    default: "bg-blue-600 hover:bg-blue-700",
    primary: "bg-indigo-600 hover:bg-indigo-700",
    secondary: "bg-slate-600 hover:bg-slate-700",
    success: "bg-green-600 hover:bg-green-700",
  };

  const alignment = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  const buttonClass = variants[variant] || variants.default;
  const alignClass = alignment[content.alignment] || alignment.center;

  return (
    <div className={`flex ${alignClass}`}>
      <Button
        size="lg"
        className={`${buttonClass} text-white`}
        onClick={() => {
          if (content.link) {
            if (content.openInNewTab) {
              window.open(content.link, '_blank');
            } else {
              window.location.href = content.link;
            }
          }
        }}
      >
        {content.text || "Click Here"}
      </Button>
    </div>
  );
}