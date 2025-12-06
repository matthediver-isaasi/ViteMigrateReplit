import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import FormRenderer from "../../forms/FormRenderer";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export default function IEditFormElement({ element, memberInfo, organizationInfo }) {
  const isMobile = useIsMobile();
  const content = element.content || {};
  const formSlug = content.form_slug;
  const [formValues, setFormValues] = useState({});
  const [currentStep, setCurrentStep] = useState(0);

  // Extract content fields
  const {
    heading,
    subheading,
    text_content,
    background_color,
    show_form_title = true,
    show_form_description = true,
    vertical_padding = 48,
    content_max_width = 800
  } = content;

  // Get text style for a given prefix
  const getTextStyle = (prefix) => {
    const fontSize = content[`${prefix}_font_size`] || 16;
    const mobileFontSize = content[`${prefix}_font_size_mobile`];
    
    return {
      fontFamily: content[`${prefix}_font_family`] || 'Poppins',
      fontWeight: content[`${prefix}_font_weight`] || 400,
      fontSize: `${(isMobile && mobileFontSize) ? mobileFontSize : fontSize}px`,
      color: content[`${prefix}_color`] || '#1e293b',
      letterSpacing: `${content[`${prefix}_letter_spacing`] || 0}px`,
      lineHeight: content[`${prefix}_line_height`] || 1.5
    };
  };

  const { data: form, isLoading } = useQuery({
    queryKey: ['form-embed', formSlug],
    queryFn: async () => {
      if (!formSlug) return null;
      const allForms = await base44.entities.Form.list();
      return allForms.find(f => f.slug === formSlug && f.is_active);
    },
    enabled: !!formSlug
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">Form not found or inactive</p>
        </div>
      </div>
    );
  }

  // Render header section
  const renderHeaderSection = () => {
    const hasHeaderContent = heading || subheading || text_content;
    if (!hasHeaderContent) return null;

    return (
      <div className="space-y-4 mb-8 text-center">
        {heading && (
          <h2 style={getTextStyle('heading')} className="m-0">
            {heading}
          </h2>
        )}
        {subheading && (
          <h3 style={getTextStyle('subheading')} className="m-0">
            {subheading}
          </h3>
        )}
        {text_content && (
          <div className="prose max-w-none mx-auto" style={getTextStyle('text_content')}>
            <ReactMarkdown>{text_content}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  };

  // Card swipe layout
  if (form.layout_type === 'card_swipe') {
    const currentField = form.fields[currentStep];
    const isLastStep = currentStep === form.fields.length - 1;
    const canProceed = !currentField?.required || formValues[currentField?.id];

    return (
      <div 
        style={{ 
          backgroundColor: background_color || 'transparent',
          paddingTop: `${vertical_padding}px`,
          paddingBottom: `${vertical_padding}px`
        }}
      >
        <div 
          className="mx-auto px-4"
          style={{ maxWidth: `${content_max_width}px` }}
        >
          {renderHeaderSection()}
          <Card className="border-slate-200">
            {(show_form_title || show_form_description) && (
              <CardHeader>
                {show_form_title && <CardTitle>{form.name}</CardTitle>}
                {show_form_description && form.description && (
                  <CardDescription className="whitespace-pre-line">{form.description}</CardDescription>
                )}
                <div className="flex gap-1 mt-4">
                  {form.fields.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded ${
                        index <= currentStep ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </CardHeader>
            )}
            {!show_form_title && !show_form_description && (
              <div className="px-6 pt-6">
                <div className="flex gap-1">
                  {form.fields.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded ${
                        index <= currentStep ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            <CardContent className="min-h-[300px]">
              {currentField && (
                <FormRenderer
                  field={currentField}
                  value={formValues[currentField.id]}
                  onChange={(value) => setFormValues({ ...formValues, [currentField.id]: value })}
                  memberInfo={memberInfo}
                  organizationInfo={organizationInfo}
                />
              )}
            </CardContent>
            <div className="p-6 pt-0 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              {isLastStep ? (
                <Button className="bg-blue-600 hover:bg-blue-700" disabled>
                  {form.submit_button_text || 'Submit'}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Standard layout
  return (
    <div 
      style={{ 
        backgroundColor: background_color || 'transparent',
        paddingTop: `${vertical_padding}px`,
        paddingBottom: `${vertical_padding}px`
      }}
    >
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: `${content_max_width}px` }}
      >
        {renderHeaderSection()}
        <Card className="border-slate-200">
          {(show_form_title || show_form_description) && (
            <CardHeader>
              {show_form_title && <CardTitle>{form.name}</CardTitle>}
              {show_form_description && form.description && (
                <CardDescription className="whitespace-pre-line">{form.description}</CardDescription>
              )}
            </CardHeader>
          )}
          <CardContent className="space-y-6">
            {/* Render fields with column support for standard forms */}
            {(() => {
              const pages = form.pages || [];
              const hasPages = pages.length > 0 && form.layout_type === 'standard';
              
              // For embedded forms without pages, just render all fields
              if (!hasPages) {
                return form.fields && form.fields.map(field => (
                  <FormRenderer
                    key={field.id}
                    field={field}
                    value={formValues[field.id]}
                    onChange={(value) => setFormValues({ ...formValues, [field.id]: value })}
                    memberInfo={memberInfo}
                    organizationInfo={organizationInfo}
                  />
                ));
              }
              
              // Get unassigned fields for backwards compatibility
              const unassignedFields = form.fields.filter(f => !f.page_id);
              
              // For forms with pages, render each page with its columns
              return (
                <>
                  {/* Render unassigned fields first (backwards compat) */}
                  {unassignedFields.length > 0 && (
                    <div className="space-y-4 mb-4">
                      {unassignedFields.map(field => (
                        <FormRenderer
                          key={field.id}
                          field={field}
                          value={formValues[field.id]}
                          onChange={(value) => setFormValues({ ...formValues, [field.id]: value })}
                          memberInfo={memberInfo}
                          organizationInfo={organizationInfo}
                        />
                      ))}
                    </div>
                  )}
                  {/* Render page-assigned fields */}
                  {pages.map((page, pageIndex) => {
                    const pageFields = form.fields.filter(f => f.page_id === page.id);
                    const columnCount = page.column_count || 1;
                    
                    return (
                      <div key={page.id} className="space-y-4">
                        {pages.length > 1 && (
                          <h4 className="font-medium text-slate-700 border-b pb-2">
                            {page.title || `Section ${pageIndex + 1}`}
                          </h4>
                        )}
                        {columnCount === 1 ? (
                          <div className="space-y-4">
                            {pageFields.map(field => (
                              <FormRenderer
                                key={field.id}
                                field={field}
                                value={formValues[field.id]}
                                onChange={(value) => setFormValues({ ...formValues, [field.id]: value })}
                                memberInfo={memberInfo}
                                organizationInfo={organizationInfo}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className={`grid gap-4 ${
                            columnCount === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                          }`}>
                            {Array.from({ length: columnCount }).map((_, colIndex) => {
                              const columnFields = pageFields.filter(f => (f.column_index || 0) === colIndex);
                              return (
                                <div key={colIndex} className="space-y-4">
                                  {columnFields.map(field => (
                                    <FormRenderer
                                      key={field.id}
                                      field={field}
                                      value={formValues[field.id]}
                                      onChange={(value) => setFormValues({ ...formValues, [field.id]: value })}
                                      memberInfo={memberInfo}
                                      organizationInfo={organizationInfo}
                                    />
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              );
            })()}
            <div className="flex justify-end pt-4">
              <Button className="bg-blue-600 hover:bg-blue-700" disabled>
                {form.submit_button_text || 'Submit'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Form Element Editor
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TypographyStyleSelector, { applyTypographyStyle } from "../TypographyStyleSelector";

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

const safeHexColor = (color, fallback = '#000000') => {
  if (!color || typeof color !== 'string') return fallback;
  const trimmed = color.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    return '#' + trimmed[1] + trimmed[1] + trimmed[2] + trimmed[2] + trimmed[3] + trimmed[3];
  }
  return fallback;
};

export function IEditFormElementEditor({ element, onChange }) {
  const content = element.content || {};
  const [expandedSections, setExpandedSections] = useState({
    formSelection: true,
    headerContent: false,
    appearance: false
  });

  const { data: forms = [] } = useQuery({
    queryKey: ['forms-list-editor'],
    queryFn: async () => {
      const allForms = await base44.entities.Form.list();
      return allForms.filter(f => f.is_active);
    }
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateContent = (key, value) => {
    onChange({ ...element, content: { ...content, [key]: value } });
  };

  const updateMultipleContent = (updates) => {
    onChange({ ...element, content: { ...content, ...updates } });
  };

  const renderTypographyControls = (prefix, label) => (
    <div className="space-y-3 border-t pt-3 mt-3">
      <Label className="text-sm font-medium">{label} Typography</Label>
      
      <TypographyStyleSelector
        value={content[`${prefix}_typography_style_id`] || null}
        onChange={(styleId, style) => {
          const updates = { [`${prefix}_typography_style_id`]: styleId };
          if (style) {
            const mapped = applyTypographyStyle(style);
            if (mapped.font_family) updates[`${prefix}_font_family`] = mapped.font_family;
            if (mapped.font_size) updates[`${prefix}_font_size`] = mapped.font_size;
            if (mapped.font_size_mobile) updates[`${prefix}_font_size_mobile`] = mapped.font_size_mobile;
            if (mapped.font_weight) updates[`${prefix}_font_weight`] = mapped.font_weight;
            if (mapped.line_height) updates[`${prefix}_line_height`] = mapped.line_height;
            if (mapped.letter_spacing) updates[`${prefix}_letter_spacing`] = mapped.letter_spacing;
            if (mapped.color) updates[`${prefix}_color`] = mapped.color;
          }
          updateMultipleContent(updates);
        }}
      />
      
      <details className="text-xs">
        <summary className="cursor-pointer text-slate-500 hover:text-slate-700">Manual Font Settings</summary>
        <div className="mt-2 space-y-2 pl-2 border-l-2 border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Font Family</Label>
              <select
                value={content[`${prefix}_font_family`] || 'Poppins'}
                onChange={(e) => updateContent(`${prefix}_font_family`, e.target.value)}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
              >
                {fontFamilies.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Weight</Label>
              <select
                value={content[`${prefix}_font_weight`] || 400}
                onChange={(e) => updateContent(`${prefix}_font_weight`, parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
              >
                {fontWeights.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Size (px)</Label>
              <Input
                type="number"
                value={content[`${prefix}_font_size`] || 16}
                onChange={(e) => updateContent(`${prefix}_font_size`, parseInt(e.target.value))}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Mobile Size (px)</Label>
              <Input
                type="number"
                value={content[`${prefix}_font_size_mobile`] || ''}
                onChange={(e) => updateContent(`${prefix}_font_size_mobile`, e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Same"
                className="h-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Color</Label>
              <input
                type="color"
                value={safeHexColor(content[`${prefix}_color`], '#1e293b')}
                onChange={(e) => updateContent(`${prefix}_color`, e.target.value)}
                className="w-full h-8 px-1 py-1 border border-slate-300 rounded cursor-pointer"
              />
            </div>
            <div>
              <Label className="text-xs">Line Height</Label>
              <Input
                type="number"
                step="0.1"
                value={content[`${prefix}_line_height`] || 1.5}
                onChange={(e) => updateContent(`${prefix}_line_height`, parseFloat(e.target.value))}
                className="h-8"
              />
            </div>
          </div>
        </div>
      </details>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Form Selection Section */}
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('formSelection')}
          className="w-full flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200 text-left"
        >
          <span className="font-semibold text-sm">Form Selection</span>
          {expandedSections.formSelection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.formSelection && (
          <div className="p-4 space-y-4">
            <div>
              <Label className="text-sm">Select Form</Label>
              <Select
                value={content.form_slug || ''}
                onValueChange={(value) => updateContent('form_slug', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a form..." />
                </SelectTrigger>
                <SelectContent>
                  {forms.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500">No active forms available</div>
                  ) : (
                    forms.map((form) => (
                      <SelectItem key={form.id} value={form.slug}>
                        {form.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-form-title"
                checked={content.show_form_title !== false}
                onChange={(e) => updateContent('show_form_title', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="show-form-title" className="text-sm cursor-pointer">Show form title</Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-form-description"
                checked={content.show_form_description !== false}
                onChange={(e) => updateContent('show_form_description', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="show-form-description" className="text-sm cursor-pointer">Show form description</Label>
            </div>
          </div>
        )}
      </div>

      {/* Header Content Section */}
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('headerContent')}
          className="w-full flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200 text-left"
        >
          <span className="font-semibold text-sm">Header Content</span>
          {expandedSections.headerContent ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.headerContent && (
          <div className="p-4 space-y-4">
            <div>
              <Label className="text-sm">Heading</Label>
              <Input
                value={content.heading || ''}
                onChange={(e) => updateContent('heading', e.target.value)}
                placeholder="Enter heading..."
              />
              {renderTypographyControls('heading', 'Heading')}
            </div>

            <div>
              <Label className="text-sm">Subheading</Label>
              <Input
                value={content.subheading || ''}
                onChange={(e) => updateContent('subheading', e.target.value)}
                placeholder="Enter subheading..."
              />
              {renderTypographyControls('subheading', 'Subheading')}
            </div>

            <div>
              <Label className="text-sm">Content (Markdown supported)</Label>
              <Textarea
                value={content.text_content || ''}
                onChange={(e) => updateContent('text_content', e.target.value)}
                placeholder="Enter content text..."
                rows={4}
              />
              {renderTypographyControls('text_content', 'Content')}
            </div>
          </div>
        )}
      </div>

      {/* Appearance Section */}
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('appearance')}
          className="w-full flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200 text-left"
        >
          <span className="font-semibold text-sm">Appearance</span>
          {expandedSections.appearance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.appearance && (
          <div className="p-4 space-y-4">
            <div>
              <Label className="text-sm">Background Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={safeHexColor(content.background_color, '#ffffff')}
                  onChange={(e) => updateContent('background_color', e.target.value)}
                  className="w-12 h-10 px-1 py-1 border border-slate-300 rounded cursor-pointer"
                />
                <Input
                  value={content.background_color || ''}
                  onChange={(e) => updateContent('background_color', e.target.value)}
                  placeholder="transparent"
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateContent('background_color', '')}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm">Vertical Padding: {content.vertical_padding || 48}px</Label>
              <input
                type="range"
                min="0"
                max="120"
                value={content.vertical_padding || 48}
                onChange={(e) => updateContent('vertical_padding', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-sm">Content Max Width: {content.content_max_width || 800}px</Label>
              <input
                type="range"
                min="400"
                max="1200"
                step="50"
                value={content.content_max_width || 800}
                onChange={(e) => updateContent('content_max_width', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}