import { useState } from "react";
import { ChevronDown, ChevronUp, Upload, X } from "lucide-react";
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

export default function IEditQuoteElement({ content, variant, settings }) {
  const {
    profile_image_url,
    quote_text = '',
    author_name = '',
    background_type = 'color',
    background_color = '#f8fafc',
    gradient_start_color = '#3b82f6',
    gradient_end_color = '#8b5cf6',
    gradient_angle = 135,
    background_image_url,
    background_image_fit = 'cover',
    overlay_enabled = false,
    overlay_color = '#000000',
    overlay_opacity = 50,
    box_padding = 40,
    box_border_radius = 12,
    box_border_color = '#e2e8f0',
    box_border_width = 1,
    quote_font_family = 'Georgia',
    quote_font_size = 20,
    quote_font_weight = 400,
    quote_color = '#1e293b',
    quote_font_style = 'italic',
    quote_letter_spacing = 0,
    quote_line_height = 1.6,
    quote_align = 'center',
    name_font_family = 'Poppins',
    name_font_size = 16,
    name_font_weight = 600,
    name_color = '#475569',
    name_letter_spacing = 0,
    name_align = 'center',
    quote_mark_color = '#cbd5e1',
    quote_mark_size = 48,
    quote_mark_opacity = 50,
    profile_size = 80,
    profile_border_radius = 50,
    profile_border_color = '#e2e8f0',
    profile_border_width = 2,
    layout = 'stacked'
  } = content || {};

  const getBackgroundStyle = () => {
    if (background_type === 'color') {
      return { backgroundColor: background_color };
    }
    if (background_type === 'gradient') {
      return { 
        background: `linear-gradient(${gradient_angle}deg, ${gradient_start_color}, ${gradient_end_color})` 
      };
    }
    return {};
  };

  const quoteStyle = {
    fontFamily: quote_font_family,
    fontSize: `${quote_font_size}px`,
    fontWeight: quote_font_weight,
    color: quote_color,
    fontStyle: quote_font_style,
    letterSpacing: `${quote_letter_spacing}px`,
    lineHeight: quote_line_height,
    textAlign: quote_align
  };

  const nameStyle = {
    fontFamily: name_font_family,
    fontSize: `${name_font_size}px`,
    fontWeight: name_font_weight,
    color: name_color,
    letterSpacing: `${name_letter_spacing}px`,
    textAlign: name_align
  };

  const quoteMarkStyle = {
    color: quote_mark_color,
    fontSize: `${quote_mark_size}px`,
    opacity: quote_mark_opacity / 100,
    fontFamily: 'Georgia, serif',
    lineHeight: 1
  };

  const profileStyle = {
    width: `${profile_size}px`,
    height: `${profile_size}px`,
    borderRadius: `${profile_border_radius}%`,
    border: `${profile_border_width}px solid ${profile_border_color}`,
    objectFit: 'cover'
  };

  return (
    <div 
      className="relative w-full"
      style={{
        ...getBackgroundStyle(),
        padding: `${box_padding}px`,
        borderRadius: `${box_border_radius}px`,
        border: `${box_border_width}px solid ${box_border_color}`
      }}
    >
      {/* Background image */}
      {background_type === 'image' && background_image_url && (
        <>
          <img 
            src={background_image_url} 
            alt="Background" 
            className="absolute inset-0 w-full h-full"
            style={{ 
              objectFit: background_image_fit,
              borderRadius: `${box_border_radius}px`
            }}
          />
          {overlay_enabled && (
            <div 
              className="absolute inset-0" 
              style={{ 
                backgroundColor: overlay_color, 
                opacity: overlay_opacity / 100,
                borderRadius: `${box_border_radius}px`
              }} 
            />
          )}
        </>
      )}

      {/* Top-right quote mark */}
      <div 
        className="absolute select-none pointer-events-none"
        style={{ 
          ...quoteMarkStyle,
          top: `${box_padding / 2}px`,
          right: `${box_padding / 2}px`
        }}
      >
        "
      </div>

      {/* Bottom-left quote mark */}
      <div 
        className="absolute select-none pointer-events-none"
        style={{ 
          ...quoteMarkStyle,
          bottom: `${box_padding / 2}px`,
          left: `${box_padding / 2}px`,
          transform: 'rotate(180deg)'
        }}
      >
        "
      </div>

      {/* Content */}
      <div className="relative z-10">
        {layout === 'stacked' ? (
          <div className="flex flex-col items-center gap-4">
            {profile_image_url && (
              <img 
                src={profile_image_url} 
                alt={author_name || 'Profile'} 
                style={profileStyle}
              />
            )}
            {quote_text && (
              <p style={quoteStyle} className="max-w-3xl">
                {quote_text}
              </p>
            )}
            {author_name && (
              <p style={nameStyle}>
                — {author_name}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-6">
            {profile_image_url && (
              <img 
                src={profile_image_url} 
                alt={author_name || 'Profile'} 
                style={profileStyle}
                className="flex-shrink-0"
              />
            )}
            <div className="flex-1">
              {quote_text && (
                <p style={{ ...quoteStyle, textAlign: 'left' }} className="mb-4">
                  {quote_text}
                </p>
              )}
              {author_name && (
                <p style={{ ...nameStyle, textAlign: 'left' }}>
                  — {author_name}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function IEditQuoteElementEditor({ element, onChange }) {
  const content = element.content || {};
  const [isUploading, setIsUploading] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    background: false,
    box: false,
    quoteTypography: false,
    nameTypography: false,
    quoteMarks: false,
    profile: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateContent = (key, value) => {
    onChange({ ...element, content: { ...content, [key]: value } });
  };

  const handleImageUpload = async (file, field) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10MB');
      return;
    }

    setIsUploading(prev => ({ ...prev, [field]: true }));
    try {
      const { base44 } = await import("@/api/base44Client");
      const response = await base44.integrations.Core.UploadFile({ file });
      updateContent(field, response.file_url);
    } catch (error) {
      alert('Failed to upload image: ' + error.message);
    } finally {
      setIsUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const backgroundType = content.background_type || 'color';
  const gradientPreview = `linear-gradient(${content.gradient_angle || 135}deg, ${content.gradient_start_color || '#3b82f6'}, ${content.gradient_end_color || '#8b5cf6'})`;

  const SectionHeader = ({ title, section }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-md text-sm font-medium text-slate-700"
    >
      {title}
      {expandedSections[section] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Content Section */}
      <SectionHeader title="Content" section="content" />
      {expandedSections.content && (
        <div className="space-y-3 pl-2">
          <div>
            <label className="block text-sm font-medium mb-1">Layout</label>
            <select
              value={content.layout || 'stacked'}
              onChange={(e) => updateContent('layout', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="stacked">Stacked (centered)</option>
              <option value="side">Side by Side</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quote Text</label>
            <textarea
              value={content.quote_text || ''}
              onChange={(e) => updateContent('quote_text', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              rows={4}
              placeholder="Enter the quote text..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Author Name</label>
            <input
              type="text"
              value={content.author_name || ''}
              onChange={(e) => updateContent('author_name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              placeholder="Author name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Profile Picture</label>
            <div className="space-y-2">
              <label className="inline-block">
                <div className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer ${
                  isUploading.profile_image_url
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}>
                  {isUploading.profile_image_url ? 'Uploading...' : 'Upload Image'}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'profile_image_url');
                    e.target.value = '';
                  }}
                  className="hidden"
                  disabled={isUploading.profile_image_url}
                />
              </label>
            </div>
            {content.profile_image_url && (
              <div className="mt-2 relative inline-block">
                <img
                  src={content.profile_image_url}
                  alt="Profile"
                  className="w-20 h-20 object-cover rounded-full"
                />
                <button
                  onClick={() => updateContent('profile_image_url', '')}
                  className="absolute -top-2 -right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full"
                  type="button"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Background Section */}
      <SectionHeader title="Background" section="background" />
      {expandedSections.background && (
        <div className="space-y-3 pl-2">
          <div>
            <label className="block text-sm font-medium mb-1">Background Type</label>
            <select
              value={backgroundType}
              onChange={(e) => updateContent('background_type', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="color">Solid Color</option>
              <option value="gradient">Gradient</option>
              <option value="image">Image</option>
            </select>
          </div>

          {backgroundType === 'color' && (
            <div>
              <label className="block text-sm font-medium mb-1">Background Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={content.background_color || '#f8fafc'}
                  onChange={(e) => updateContent('background_color', e.target.value)}
                  className="w-16 h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={content.background_color || '#f8fafc'}
                  onChange={(e) => updateContent('background_color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
                />
              </div>
            </div>
          )}

          {backgroundType === 'gradient' && (
            <div className="space-y-3 p-3 bg-slate-50 rounded-md">
              <div 
                className="w-full h-12 rounded-md border border-slate-300"
                style={{ background: gradientPreview }}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={content.gradient_start_color || '#3b82f6'}
                      onChange={(e) => updateContent('gradient_start_color', e.target.value)}
                      className="w-12 h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                    />
                    <input
                      type="text"
                      value={content.gradient_start_color || '#3b82f6'}
                      onChange={(e) => updateContent('gradient_start_color', e.target.value)}
                      className="flex-1 px-2 py-2 border border-slate-300 rounded-md font-mono text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={content.gradient_end_color || '#8b5cf6'}
                      onChange={(e) => updateContent('gradient_end_color', e.target.value)}
                      className="w-12 h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                    />
                    <input
                      type="text"
                      value={content.gradient_end_color || '#8b5cf6'}
                      onChange={(e) => updateContent('gradient_end_color', e.target.value)}
                      className="flex-1 px-2 py-2 border border-slate-300 rounded-md font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Angle: {content.gradient_angle || 135}°</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={content.gradient_angle || 135}
                  onChange={(e) => updateContent('gradient_angle', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {backgroundType === 'image' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Background Image</label>
                <div className="space-y-2">
                  <label className="inline-block">
                    <div className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer ${
                      isUploading.background_image_url
                        ? 'bg-slate-300 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}>
                      {isUploading.background_image_url ? 'Uploading...' : 'Upload Image'}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'background_image_url');
                        e.target.value = '';
                      }}
                      className="hidden"
                      disabled={isUploading.background_image_url}
                    />
                  </label>
                </div>
                {content.background_image_url && (
                  <div className="mt-2 relative">
                    <img
                      src={content.background_image_url}
                      alt="Preview"
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      onClick={() => updateContent('background_image_url', '')}
                      className="absolute bottom-2 right-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image Fit</label>
                <select
                  value={content.background_image_fit || 'cover'}
                  onChange={(e) => updateContent('background_image_fit', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                </select>
              </div>

              <div className="space-y-3 p-3 bg-slate-50 rounded-md">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="overlay_enabled"
                    checked={content.overlay_enabled || false}
                    onChange={(e) => updateContent('overlay_enabled', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="overlay_enabled" className="text-sm font-medium">Enable Overlay</label>
                </div>
                
                {content.overlay_enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Overlay Color</label>
                      <input
                        type="color"
                        value={content.overlay_color || '#000000'}
                        onChange={(e) => updateContent('overlay_color', e.target.value)}
                        className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Opacity (%)</label>
                      <input
                        type="number"
                        value={content.overlay_opacity || 50}
                        onChange={(e) => updateContent('overlay_opacity', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Box Settings Section */}
      <SectionHeader title="Box Settings" section="box" />
      {expandedSections.box && (
        <div className="space-y-3 pl-2">
          <div>
            <label className="block text-sm font-medium mb-1">Padding (px)</label>
            <input
              type="number"
              value={content.box_padding || 40}
              onChange={(e) => updateContent('box_padding', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Border Radius (px)</label>
            <input
              type="number"
              value={content.box_border_radius || 12}
              onChange={(e) => updateContent('box_border_radius', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              min="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Border Color</label>
              <input
                type="color"
                value={content.box_border_color || '#e2e8f0'}
                onChange={(e) => updateContent('box_border_color', e.target.value)}
                className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Border Width (px)</label>
              <input
                type="number"
                value={content.box_border_width || 1}
                onChange={(e) => updateContent('box_border_width', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                min="0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Quote Typography Section */}
      <SectionHeader title="Quote Typography" section="quoteTypography" />
      {expandedSections.quoteTypography && (
        <div className="space-y-3 pl-2">
          <TypographyStyleSelector
            value={content.quote_typography_style_id}
            onChange={(styleId) => updateContent('quote_typography_style_id', styleId)}
            onApplyStyle={(style) => {
              const styleProps = applyTypographyStyle(style);
              if (styleProps.font_family) updateContent('quote_font_family', styleProps.font_family);
              if (styleProps.font_size) updateContent('quote_font_size', styleProps.font_size);
              if (styleProps.font_size_mobile) updateContent('quote_font_size_mobile', styleProps.font_size_mobile);
              if (styleProps.font_weight) updateContent('quote_font_weight', styleProps.font_weight);
              if (styleProps.line_height) updateContent('quote_line_height', styleProps.line_height);
              if (styleProps.letter_spacing) updateContent('quote_letter_spacing', styleProps.letter_spacing);
              if (styleProps.text_transform) updateContent('quote_text_transform', styleProps.text_transform);
              if (styleProps.color) updateContent('quote_color', styleProps.color);
              updateContent('quote_typography_style_id', style.id);
            }}
            filterTypes={['paragraph', 'h3', 'h4']}
            label="Quote Typography Style"
          />
          
          <details className="text-xs">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-medium">Manual Font Settings</summary>
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Font Family</label>
                  <select
                    value={content.quote_font_family || 'Georgia'}
                    onChange={(e) => updateContent('quote_font_family', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    {fontFamilies.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Font Weight</label>
                  <select
                    value={content.quote_font_weight || 400}
                    onChange={(e) => updateContent('quote_font_weight', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    {fontWeights.map(w => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Font Size (px)</label>
                  <input
                    type="number"
                    value={content.quote_font_size || 20}
                    onChange={(e) => updateContent('quote_font_size', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    min="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Font Style</label>
                  <select
                    value={content.quote_font_style || 'italic'}
                    onChange={(e) => updateContent('quote_font_style', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Text Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={content.quote_color || '#1e293b'}
                    onChange={(e) => updateContent('quote_color', e.target.value)}
                    className="w-16 h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={content.quote_color || '#1e293b'}
                    onChange={(e) => updateContent('quote_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Letter Spacing (px)</label>
                  <input
                    type="number"
                    value={content.quote_letter_spacing || 0}
                    onChange={(e) => updateContent('quote_letter_spacing', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Line Height</label>
                  <input
                    type="number"
                    value={content.quote_line_height || 1.6}
                    onChange={(e) => updateContent('quote_line_height', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    step="0.1"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Text Alignment</label>
                <select
                  value={content.quote_align || 'center'}
                  onChange={(e) => updateContent('quote_align', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
          </details>
        </div>
      )}

      {/* Name Typography Section */}
      <SectionHeader title="Name Typography" section="nameTypography" />
      {expandedSections.nameTypography && (
        <div className="space-y-3 pl-2">
          <TypographyStyleSelector
            value={content.name_typography_style_id}
            onChange={(styleId) => updateContent('name_typography_style_id', styleId)}
            onApplyStyle={(style) => {
              const styleProps = applyTypographyStyle(style);
              if (styleProps.font_family) updateContent('name_font_family', styleProps.font_family);
              if (styleProps.font_size) updateContent('name_font_size', styleProps.font_size);
              if (styleProps.font_size_mobile) updateContent('name_font_size_mobile', styleProps.font_size_mobile);
              if (styleProps.font_weight) updateContent('name_font_weight', styleProps.font_weight);
              if (styleProps.letter_spacing) updateContent('name_letter_spacing', styleProps.letter_spacing);
              if (styleProps.color) updateContent('name_color', styleProps.color);
              updateContent('name_typography_style_id', style.id);
            }}
            filterTypes={['paragraph']}
            label="Name Typography Style"
          />
          
          <details className="text-xs">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-medium">Manual Font Settings</summary>
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Font Family</label>
                  <select
                    value={content.name_font_family || 'Poppins'}
                    onChange={(e) => updateContent('name_font_family', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    {fontFamilies.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Font Weight</label>
                  <select
                    value={content.name_font_weight || 600}
                    onChange={(e) => updateContent('name_font_weight', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    {fontWeights.map(w => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Font Size (px)</label>
                <input
                  type="number"
                  value={content.name_font_size || 16}
                  onChange={(e) => updateContent('name_font_size', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  min="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Text Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={content.name_color || '#475569'}
                    onChange={(e) => updateContent('name_color', e.target.value)}
                    className="w-16 h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={content.name_color || '#475569'}
                    onChange={(e) => updateContent('name_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Letter Spacing (px)</label>
                <input
                  type="number"
                  value={content.name_letter_spacing || 0}
                  onChange={(e) => updateContent('name_letter_spacing', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  step="0.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Text Alignment</label>
                <select
                  value={content.name_align || 'center'}
                  onChange={(e) => updateContent('name_align', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
          </details>
        </div>
      )}

      {/* Quote Marks Section */}
      <SectionHeader title="Quote Marks" section="quoteMarks" />
      {expandedSections.quoteMarks && (
        <div className="space-y-3 pl-2">
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={content.quote_mark_color || '#cbd5e1'}
                onChange={(e) => updateContent('quote_mark_color', e.target.value)}
                className="w-16 h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
              />
              <input
                type="text"
                value={content.quote_mark_color || '#cbd5e1'}
                onChange={(e) => updateContent('quote_mark_color', e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Size (px)</label>
              <input
                type="number"
                value={content.quote_mark_size || 48}
                onChange={(e) => updateContent('quote_mark_size', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                min="20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Opacity (%)</label>
              <input
                type="number"
                value={content.quote_mark_opacity || 50}
                onChange={(e) => updateContent('quote_mark_opacity', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Section */}
      <SectionHeader title="Profile Picture Settings" section="profile" />
      {expandedSections.profile && (
        <div className="space-y-3 pl-2">
          <div>
            <label className="block text-sm font-medium mb-1">Size (px)</label>
            <input
              type="number"
              value={content.profile_size || 80}
              onChange={(e) => updateContent('profile_size', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              min="40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Border Radius (%)</label>
            <input
              type="number"
              value={content.profile_border_radius || 50}
              onChange={(e) => updateContent('profile_border_radius', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              min="0"
              max="50"
            />
            <p className="text-xs text-slate-500 mt-1">50% = circle, 0% = square</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Border Color</label>
              <input
                type="color"
                value={content.profile_border_color || '#e2e8f0'}
                onChange={(e) => updateContent('profile_border_color', e.target.value)}
                className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Border Width (px)</label>
              <input
                type="number"
                value={content.profile_border_width || 2}
                onChange={(e) => updateContent('profile_border_width', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                min="0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
