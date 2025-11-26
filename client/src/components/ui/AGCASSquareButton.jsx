import React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AGCASSquareButton({ 
  onClick, 
  className,
  disabled = false,
  ...props 
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center",
        "rounded-none bg-transparent",
        "w-16 h-16 text-black",
        "transition-all duration-300",
        "hover:text-white",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "agcas-square-button",
        className
      )}
      style={{ fontFamily: 'Poppins, sans-serif' }}
      {...props}
    >
      <style jsx>{`
        .agcas-square-button {
          box-shadow: inset 0 0 0 2px black;
        }
        .agcas-square-button:hover:not(:disabled) {
          background: linear-gradient(to right top, rgb(92, 0, 133), rgb(186, 0, 135), rgb(238, 0, 195), rgb(255, 66, 41), rgb(255, 176, 0));
          box-shadow: none !important;
        }
        .agcas-square-button:disabled {
          background: transparent;
        }
      `}</style>
      <ArrowUpRight className="w-10 h-10" strokeWidth={2.5} />
    </button>
  );
}