import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CategorySelector({ category, setCategory }) {
  const categories = [
    "Professional Development",
    "Career Advice",
    "Industry News",
    "Best Practices",
    "Training Resources",
    "Member Spotlights"
  ];

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Category</CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>None</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}