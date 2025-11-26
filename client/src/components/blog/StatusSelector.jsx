import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function StatusSelector({ status, setStatus }) {
  const statusConfig = {
    draft: { label: "Draft", color: "bg-amber-100 text-amber-700" },
    published: { label: "Published", color: "bg-green-100 text-green-700" },
    archived: { label: "Archived", color: "bg-slate-100 text-slate-700" }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Status</CardTitle>
          <Badge className={statusConfig[status]?.color}>
            {statusConfig[status]?.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 mt-2">
          {status === 'draft' && 'Only visible to you'}
          {status === 'published' && 'Visible to all members'}
          {status === 'archived' && 'Hidden from listings'}
        </p>
      </CardContent>
    </Card>
  );
}