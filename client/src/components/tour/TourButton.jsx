import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function TourButton({ onClick }) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="sm"
      className="gap-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100"
      id="page-tour-button"
    >
      <Sparkles className="w-4 h-4 text-purple-600" />
      <span className="text-purple-700 font-medium">Page Tour</span>
    </Button>
  );
}