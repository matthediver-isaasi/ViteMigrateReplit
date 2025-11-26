import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export function IEditTextOverlayImageElementEditor({ element, onChange }) {
  const content = element.content || {};

  const updateContent = (key, value) => {
    onChange({ ...element, content: { ...content, [key]: value } });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateContent('backgroundImage', file_url);
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Background Image</Label>
        {content.backgroundImage ? (
          <div className="mt-2 relative">
            <img 
              src={content.backgroundImage} 
              alt="Background" 
              className="w-full h-32 object-cover rounded-lg"
            />
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={() => updateContent('backgroundImage', '')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="mt-2">
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 transition-colors">
              <div className="text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-sm text-slate-600">Click to upload image</span>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="header">Header</Label>
        <Input
          id="header"
          value={content.header || ''}
          onChange={(e) => updateContent('header', e.target.value)}
          placeholder="Enter header text"
        />
      </div>

      <div>
        <Label htmlFor="text">Text Content</Label>
        <Textarea
          id="text"
          value={content.text || ''}
          onChange={(e) => updateContent('text', e.target.value)}
          placeholder="Enter text content"
          rows={4}
        />
      </div>

      <div>
        <Label>Text Position</Label>
        <Select 
          value={content.textPosition || 'left'} 
          onValueChange={(value) => updateContent('textPosition', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Border Style</Label>
        <Select 
          value={content.borderStyle || 'none'} 
          onValueChange={(value) => updateContent('borderStyle', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="dashed">Dashed</SelectItem>
            <SelectItem value="dotted">Dotted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="borderColor">Border Color</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="borderColor"
            type="color"
            value={content.borderColor || '#000000'}
            onChange={(e) => updateContent('borderColor', e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={content.borderColor || '#000000'}
            onChange={(e) => updateContent('borderColor', e.target.value)}
            placeholder="#000000"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="backgroundColor">Background Color</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="backgroundColor"
            type="color"
            value={content.backgroundColor || '#ffffff'}
            onChange={(e) => updateContent('backgroundColor', e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={content.backgroundColor || '#ffffff'}
            onChange={(e) => updateContent('backgroundColor', e.target.value)}
            placeholder="#ffffff"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="opacity">Background Opacity ({Math.round((content.opacity !== undefined ? content.opacity : 1) * 100)}%)</Label>
        <Input
          id="opacity"
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={content.opacity !== undefined ? content.opacity : 1}
          onChange={(e) => updateContent('opacity', parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
}

export function IEditTextOverlayImageElementRenderer({ element }) {
  const content = element.content || {};
  const textPosition = content.textPosition || 'left';
  const borderStyle = content.borderStyle || 'none';
  const borderColor = content.borderColor || '#000000';
  const backgroundColor = content.backgroundColor || '#ffffff';
  const opacity = content.opacity !== undefined ? content.opacity : 1;

  const contentBoxStyle = {
    backgroundColor: backgroundColor,
    opacity: opacity,
    border: borderStyle !== 'none' ? `2px ${borderStyle} ${borderColor}` : 'none',
  };

  return (
    <div 
      className="relative w-full min-h-[400px] flex items-center justify-center"
      style={{
        backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: !content.backgroundImage ? '#f1f5f9' : undefined
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        <div className={`max-w-xl ${textPosition === 'right' ? 'ml-auto' : 'mr-auto'}`}>
          <div 
            className="p-8 rounded-lg"
            style={contentBoxStyle}
          >
            {content.header && (
              <h2 className="text-3xl font-bold mb-4 text-slate-900">
                {content.header}
              </h2>
            )}
            {content.text && (
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {content.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}