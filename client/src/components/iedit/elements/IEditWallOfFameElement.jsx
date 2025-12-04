import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import WallOfFameDisplay from "../../walloffame/WallOfFameDisplay";

export function IEditWallOfFameElementEditor({ element, onChange }) {
  const { data: sections = [] } = useQuery({
    queryKey: ['wall-of-fame-sections-selector'],
    queryFn: () => base44.entities.WallOfFameSection.list(),
  });

  const activeSections = sections.filter(s => s.is_active).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const content = element.content || {};

  const updateContent = (key, value) => {
    onChange({
      ...element,
      content: {
        ...content,
        [key]: value
      }
    });
  };

  const fontFamilies = [
    'Poppins',
    'Degular Medium', 
    'Degular Bold',
    'Degular Semibold',
    'Inter',
    'Arial',
    'Georgia',
    'Times New Roman'
  ];

  const fontWeights = [
    { value: 300, label: 'Light' },
    { value: 400, label: 'Regular' },
    { value: 500, label: 'Medium' },
    { value: 600, label: 'Semibold' },
    { value: 700, label: 'Bold' },
    { value: 800, label: 'Extra Bold' }
  ];

  return (
    <div className="space-y-4">
      {/* Section Selection */}
      <div className="space-y-2">
        <Label>Wall of Fame Section</Label>
        <Select
          value={content.section_id || ''}
          onValueChange={(value) => updateContent('section_id', value)}
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

      {/* Custom Title */}
      <div className="border-t pt-4 mt-4">
        <h4 className="font-semibold text-sm mb-3">Title Settings</h4>
        
        <div className="space-y-3">
          <div>
            <Label>Custom Title (Optional)</Label>
            <Input
              value={content.custom_title || ''}
              onChange={(e) => updateContent('custom_title', e.target.value)}
              placeholder="Leave empty to use category name"
            />
            <p className="text-xs text-slate-500 mt-1">
              If set, this title will be used instead of the category name
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Font Family</Label>
              <select
                value={content.title_font_family || 'Poppins'}
                onChange={(e) => updateContent('title_font_family', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                {fontFamilies.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Font Weight</Label>
              <select
                value={content.title_font_weight || 700}
                onChange={(e) => updateContent('title_font_weight', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                {fontWeights.map(weight => (
                  <option key={weight.value} value={weight.value}>{weight.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Font Size (px)</Label>
              <Input
                type="number"
                value={content.title_font_size || 32}
                onChange={(e) => updateContent('title_font_size', parseInt(e.target.value) || 32)}
                min="12"
                max="96"
              />
            </div>
            <div>
              <Label>Text Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={content.title_color || '#1e293b'}
                  onChange={(e) => updateContent('title_color', e.target.value)}
                  className="w-12 h-9 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                />
                <Input
                  value={content.title_color || '#1e293b'}
                  onChange={(e) => updateContent('title_color', e.target.value)}
                  className="flex-1 font-mono text-xs"
                  placeholder="#1e293b"
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Title Alignment</Label>
            <select
              value={content.title_align || 'center'}
              onChange={(e) => updateContent('title_align', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      </div>

      {/* Card Layout Settings */}
      <div className="border-t pt-4 mt-4">
        <h4 className="font-semibold text-sm mb-3">Card Layout</h4>
        
        <div className="space-y-3">
          <div>
            <Label>Cards Per Row</Label>
            <select
              value={content.cards_per_row || 4}
              onChange={(e) => updateContent('cards_per_row', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value={1}>1 Card</option>
              <option value={2}>2 Cards</option>
              <option value={3}>3 Cards</option>
              <option value={4}>4 Cards</option>
              <option value={5}>5 Cards</option>
              <option value={6}>6 Cards</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Number of cards to display per row on desktop
            </p>
          </div>

          <div>
            <Label>Row Alignment</Label>
            <select
              value={content.row_align || 'center'}
              onChange={(e) => updateContent('row_align', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              How to align cards when there are fewer than the maximum per row
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IEditWallOfFameElementRenderer({ element, content }) {
  const sectionId = element.content?.section_id || content?.section_id;
  const displaySettings = element.content || content || {};
  
  if (!sectionId) {
    return (
      <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
        <p className="text-slate-600">Please select a Wall of Fame section to display</p>
      </div>
    );
  }

  return (
    <WallOfFameDisplay 
      sectionId={sectionId} 
      customTitle={displaySettings.custom_title}
      titleFontFamily={displaySettings.title_font_family}
      titleFontWeight={displaySettings.title_font_weight}
      titleFontSize={displaySettings.title_font_size}
      titleColor={displaySettings.title_color}
      titleAlign={displaySettings.title_align}
      cardsPerRow={displaySettings.cards_per_row}
      rowAlign={displaySettings.row_align}
    />
  );
}
