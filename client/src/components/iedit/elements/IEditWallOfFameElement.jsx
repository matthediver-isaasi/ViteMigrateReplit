import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WallOfFameDisplay from "../../walloffame/WallOfFameDisplay";

export function IEditWallOfFameElementEditor({ element, onChange }) {
  const { data: sections = [] } = useQuery({
    queryKey: ['wall-of-fame-sections-selector'],
    queryFn: () => base44.entities.WallOfFameSection.list(),
  });

  const activeSections = sections.filter(s => s.is_active).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const handleChange = (sectionId) => {
    onChange({
      ...element,
      content: {
        ...element.content,
        section_id: sectionId
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Wall of Fame Section</Label>
        <Select
          value={element.content?.section_id || ''}
          onValueChange={handleChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a section to display" />
          </SelectTrigger>
          <SelectContent>
            {activeSections.length === 0 ? (
              <div className="p-2 text-sm text-slate-500">No sections available</div>
            ) : (
              activeSections.map(section => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500">
          Choose which Wall of Fame section to display on this page
        </p>
      </div>
    </div>
  );
}

export function IEditWallOfFameElementRenderer({ element, content }) {
  const sectionId = element.content?.section_id || content?.section_id;
  
  if (!sectionId) {
    return (
      <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
        <p className="text-slate-600">Please select a Wall of Fame section to display</p>
      </div>
    );
  }

  return <WallOfFameDisplay sectionId={sectionId} />;
}