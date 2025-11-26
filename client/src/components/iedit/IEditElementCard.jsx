import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Copy, Trash2 } from "lucide-react";

export default function IEditElementCard({ element, isDragging, onEdit, onDelete, onDuplicate }) {
  return (
    <Card className={`border-slate-200 transition-shadow ${isDragging ? 'shadow-2xl' : 'hover:shadow-md'}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Element Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-900 capitalize">
                {element.element_type.replace(/_/g, ' ')}
              </span>
              {element.style_variant && element.style_variant !== 'default' && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {element.style_variant}
                </span>
              )}
            </div>
            
            {/* Content Preview */}
            <div className="text-sm text-slate-600 truncate">
              {element.content?.heading || element.content?.title || element.content?.text || 'No content'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="hover:bg-blue-50 hover:text-blue-700"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="hover:bg-slate-100"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}