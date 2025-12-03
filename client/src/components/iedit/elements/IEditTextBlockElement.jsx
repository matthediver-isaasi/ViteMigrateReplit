import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function IEditTextBlockElement({ content, variant, settings }) {
  const {
    heading = '',
    text = '',
    heading_font_family = 'Poppins',
    heading_font_size = 30,
    heading_font_weight = 700,
    heading_color = '#1e293b',
    heading_letter_spacing = 0,
    heading_line_height = 1.3,
    heading_align = 'left',
    heading_margin_bottom = 24,
    content_font_family = 'Poppins',
    content_font_size = 16,
    content_font_weight = 400,
    content_color = '#475569',
    content_letter_spacing = 0,
    content_line_height = 1.6,
    content_align = 'left'
  } = content || {};

  const variants = {
    default: "",
    centered: "text-center",
    large: "text-lg",
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <div className={variantClass}>
      {heading && (
        <h2 
          style={{ 
            fontFamily: heading_font_family,
            fontSize: `${heading_font_size}px`,
            fontWeight: heading_font_weight,
            color: heading_color,
            letterSpacing: `${heading_letter_spacing}px`,
            lineHeight: heading_line_height,
            textAlign: heading_align,
            margin: 0,
            marginBottom: text ? `${heading_margin_bottom}px` : 0
          }}
        >
          {heading}
        </h2>
      )}
      {text && (
        <div 
          className="prose max-w-none iedit-text-block-content"
          style={{
            fontFamily: content_font_family,
            fontSize: `${content_font_size}px`,
            fontWeight: content_font_weight,
            color: content_color,
            letterSpacing: `${content_letter_spacing}px`,
            lineHeight: content_line_height,
            textAlign: content_align,
            '--content-color': content_color,
            '--content-font-size': `${content_font_size}px`,
            '--content-line-height': content_line_height
          }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      )}
      <style>{`
        .iedit-text-block-content p,
        .iedit-text-block-content li,
        .iedit-text-block-content span {
          color: inherit !important;
          font-size: inherit !important;
          line-height: inherit !important;
        }
        .iedit-text-block-content h1,
        .iedit-text-block-content h2,
        .iedit-text-block-content h3 {
          color: inherit !important;
        }
      `}</style>
    </div>
  );
}

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
      {/* Heading Section */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-slate-900 mb-3">Heading</h4>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Heading Text</Label>
            <Input
              value={content.heading || ''}
              onChange={(e) => updateContent('heading', e.target.value)}
              placeholder="Enter heading text (optional)"
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1">Font</label>
              <select
                value={content.heading_font_family || 'Poppins'}
                onChange={(e) => updateContent('heading_font_family', e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm"
              >
                {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Weight</label>
              <select
                value={content.heading_font_weight || 700}
                onChange={(e) => updateContent('heading_font_weight', parseInt(e.target.value))}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm"
              >
                {fontWeights.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Size (px)</label>
              <input
                type="number"
                value={content.heading_font_size || 30}
                onChange={(e) => updateContent('heading_font_size', parseInt(e.target.value) || 30)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm"
                min="10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Color</label>
              <div className="flex gap-1">
                <input
                  type="color"
                  value={content.heading_color || '#1e293b'}
                  onChange={(e) => updateContent('heading_color', e.target.value)}
                  className="w-10 h-8 border border-slate-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={content.heading_color || '#1e293b'}
                  onChange={(e) => updateContent('heading_color', e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Letter Spacing (px)</label>
              <input
                type="number"
                value={content.heading_letter_spacing || 0}
                onChange={(e) => updateContent('heading_letter_spacing', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Line Height</label>
              <input
                type="number"
                value={content.heading_line_height || 1.3}
                onChange={(e) => updateContent('heading_line_height', parseFloat(e.target.value) || 1.3)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm"
                step="0.1"
                min="0.5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Alignment</label>
              <select
                value={content.heading_align || 'left'}
                onChange={(e) => updateContent('heading_align', e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Bottom Margin (px)</label>
              <input
                type="number"
                value={content.heading_margin_bottom || 24}
                onChange={(e) => updateContent('heading_margin_bottom', parseInt(e.target.value) || 24)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-slate-900 mb-3">Content</h4>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Text Content</Label>
            <div className="border border-slate-200 rounded-md overflow-hidden mt-1">
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
            <p className="text-xs text-slate-500 mt-1">
              Use the toolbar to format your text with headings, lists, links, and more.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1">Font</label>
              <select
                value={content.content_font_family || 'Poppins'}
                onChange={(e) => updateContent('content_font_family', e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm"
              >
                {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Weight</label>
              <select
                value={content.content_font_weight || 400}
                onChange={(e) => updateContent('content_font_weight', parseInt(e.target.value))}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm"
              >
                {fontWeights.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Size (px)</label>
              <input
                type="number"
                value={content.content_font_size || 16}
                onChange={(e) => updateContent('content_font_size', parseInt(e.target.value) || 16)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm"
                min="10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Color</label>
              <div className="flex gap-1">
                <input
                  type="color"
                  value={content.content_color || '#475569'}
                  onChange={(e) => updateContent('content_color', e.target.value)}
                  className="w-10 h-8 border border-slate-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={content.content_color || '#475569'}
                  onChange={(e) => updateContent('content_color', e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Letter Spacing (px)</label>
              <input
                type="number"
                value={content.content_letter_spacing || 0}
                onChange={(e) => updateContent('content_letter_spacing', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Line Height</label>
              <input
                type="number"
                value={content.content_line_height || 1.6}
                onChange={(e) => updateContent('content_line_height', parseFloat(e.target.value) || 1.6)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm"
                step="0.1"
                min="0.5"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1">Alignment</label>
              <select
                value={content.content_align || 'left'}
                onChange={(e) => updateContent('content_align', e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
