import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function IEditTextBlockElement({ content, variant, settings }) {
  const variants = {
    default: "",
    centered: "text-center",
    large: "text-lg",
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <div className={variantClass}>
      {content.heading && (
        <h2 className="text-3xl font-bold text-slate-900 mb-6">
          {content.heading}
        </h2>
      )}
      {content.text && (
        <div 
          className="prose prose-lg max-w-none text-slate-600"
          dangerouslySetInnerHTML={{ __html: content.text }}
        />
      )}
    </div>
  );
}

export function IEditTextBlockElementEditor({ element, onChange }) {
  const content = element.content || { heading: '', text: '' };

  const updateContent = (key, value) => {
    onChange({ 
      ...element, 
      content: { ...content, [key]: value } 
    });
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'link'
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Heading</Label>
        <Input
          value={content.heading || ''}
          onChange={(e) => updateContent('heading', e.target.value)}
          placeholder="Enter heading text (optional)"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Text Content</Label>
        <div className="border border-slate-200 rounded-md overflow-hidden">
          <ReactQuill
            theme="snow"
            value={content.text || ''}
            onChange={(value) => updateContent('text', value)}
            modules={quillModules}
            formats={quillFormats}
            placeholder="Enter your text content here..."
            style={{ minHeight: '200px' }}
          />
        </div>
        <p className="text-xs text-slate-500">
          Use the toolbar to format your text with headings, lists, links, and more.
        </p>
      </div>
    </div>
  );
}
