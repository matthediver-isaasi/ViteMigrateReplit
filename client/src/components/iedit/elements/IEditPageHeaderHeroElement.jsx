import { useState } from "react";

export default function IEditPageHeaderHeroElement({ content, variant, settings, isFirst }) {
  const { 
    background_type = 'color',
    background_color = '#1e3a5f',
    image_url,
    header_text,
    header_position = 'left',
    header_font_family = 'Poppins',
    header_font_size = '48',
    header_color = '#ffffff',
    text_alignment = 'left',
    padding_vertical = '80',
    padding_horizontal = '16',
    line_spacing = '1.2',
    text_padding_left = '0',
    text_padding_right = '0',
    text_padding_top = '0',
    text_padding_bottom = '0',
    height_type = 'auto',
    custom_height = '400',
    image_fit = 'cover',
    overlay_enabled = false,
    overlay_color = '#000000',
    overlay_opacity = '50'
  } = content;

  const textAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[text_alignment] || 'text-left';

  const getHeightStyle = () => {
    if (background_type === 'image' && image_fit === 'original') return {};
    if (height_type === 'full') return { height: '100vh' };
    if (height_type === 'custom') return { height: `${custom_height}px` };
    return { minHeight: '400px' };
  };

  const getBackgroundStyle = () => {
    if (background_type === 'color') {
      return { backgroundColor: background_color };
    }
    return {};
  };

  return (
    <div 
      className="relative w-full overflow-hidden" 
      style={{ ...getHeightStyle(), ...getBackgroundStyle() }}
    >
      {background_type === 'image' && image_url && (
        <>
          <img 
            src={image_url} 
            alt={header_text || 'Hero image'} 
            className={image_fit === 'original' ? 'w-full h-auto block' : 'absolute inset-0 w-full h-full'}
            style={image_fit === 'original' ? {} : { objectFit: image_fit }}
          />
          {overlay_enabled && (
            <div 
              className="absolute inset-0" 
              style={{ 
                backgroundColor: overlay_color, 
                opacity: parseInt(overlay_opacity) / 100 
              }} 
            />
          )}
        </>
      )}
      
      <div 
        className={`${background_type === 'image' && image_fit === 'original' ? 'absolute inset-0 flex items-center' : 'relative h-full flex items-center'} max-w-7xl mx-auto`} 
        style={{ paddingLeft: `${padding_horizontal}px`, paddingRight: `${padding_horizontal}px` }}
      >
        <div 
          className={`max-w-2xl ${header_position === 'right' ? 'ml-auto' : 'mr-auto'} ${textAlignClass}`}
          style={{
            paddingLeft: `${text_padding_left}px`,
            paddingRight: `${text_padding_right}px`,
            paddingTop: `${text_padding_top}px`,
            paddingBottom: `${text_padding_bottom}px`
          }}
        >
          {header_text && (
            <h1 
              className="whitespace-pre-line"
              style={{ 
                fontFamily: header_font_family,
                fontSize: `${header_font_size}px`,
                color: header_color,
                lineHeight: line_spacing
              }}
            >
              {header_text}
            </h1>
          )}
        </div>
      </div>
    </div>
  );
}

export function IEditPageHeaderHeroElementEditor({ element, onChange }) {
  const content = element.content || {
    background_type: 'color',
    background_color: '#1e3a5f',
    image_url: '',
    header_text: '',
    header_position: 'left',
    header_font_family: 'Poppins',
    header_font_size: '48',
    header_color: '#ffffff',
    text_alignment: 'left',
    padding_vertical: '80',
    padding_horizontal: '16',
    line_spacing: '1.2',
    text_padding_left: '0',
    text_padding_right: '0',
    text_padding_top: '0',
    text_padding_bottom: '0',
    height_type: 'auto',
    custom_height: '400',
    image_fit: 'cover',
    overlay_enabled: false,
    overlay_color: '#000000',
    overlay_opacity: '50'
  };

  const [isUploading, setIsUploading] = useState(false);

  const updateContent = (key, value) => {
    onChange({ ...element, content: { ...content, [key]: value } });
  };

  const handleImageUpload = async (file) => {
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

    setIsUploading(true);
    try {
      const { base44 } = await import("@/api/base44Client");
      const response = await base44.integrations.Core.UploadFile({ file });
      updateContent('image_url', response.file_url);
    } catch (error) {
      alert('Failed to upload image: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Background Type Selection */}
      <div>
        <label className="block text-sm font-medium mb-1">Background Type</label>
        <select
          value={content.background_type || 'color'}
          onChange={(e) => updateContent('background_type', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        >
          <option value="color">Solid Color</option>
          <option value="image">Image</option>
        </select>
      </div>

      {/* Color Background Options */}
      {content.background_type === 'color' && (
        <div>
          <label className="block text-sm font-medium mb-1">Background Color</label>
          <input
            type="color"
            value={content.background_color || '#1e3a5f'}
            onChange={(e) => updateContent('background_color', e.target.value)}
            className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
          />
        </div>
      )}

      {/* Image Background Options */}
      {content.background_type === 'image' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Hero Image *</label>
            <div className="space-y-2">
              <label className="inline-block">
                <div className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer ${
                  isUploading 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}>
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
            {content.image_url && (
              <div className="mt-2 relative">
                <img
                  src={content.image_url}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <button
                  onClick={() => updateContent('image_url', '')}
                  className="absolute bottom-2 right-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                  type="button"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image Display</label>
            <select
              value={content.image_fit || 'cover'}
              onChange={(e) => updateContent('image_fit', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="cover">Cover (Fill & Crop)</option>
              <option value="contain">Contain (Fit Within)</option>
              <option value="original">Original (Full Width, Natural Height)</option>
            </select>
          </div>

          {/* Overlay Options */}
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
                    onChange={(e) => updateContent('overlay_opacity', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Header Text */}
      <div>
        <label className="block text-sm font-medium mb-1">Header Text *</label>
        <textarea
          value={content.header_text || ''}
          onChange={(e) => updateContent('header_text', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          placeholder="Enter header text..."
          rows={3}
        />
      </div>

      {/* Header Position */}
      <div>
        <label className="block text-sm font-medium mb-1">Header Position</label>
        <select
          value={content.header_position || 'left'}
          onChange={(e) => updateContent('header_position', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>

      {/* Container Height - show for color backgrounds or non-original image fit */}
      {(content.background_type === 'color' || content.image_fit !== 'original') && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Container Height</label>
            <select
              value={content.height_type || 'auto'}
              onChange={(e) => updateContent('height_type', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="auto">Auto (Min 400px)</option>
              <option value="full">Full Viewport</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {content.height_type === 'custom' && (
            <div>
              <label className="block text-sm font-medium mb-1">Custom Height (px)</label>
              <input
                type="number"
                value={content.custom_height || 400}
                onChange={(e) => updateContent('custom_height', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                min="100"
              />
            </div>
          )}
        </div>
      )}

      {/* Typography Settings */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Font Family</label>
          <select
            value={content.header_font_family || 'Poppins'}
            onChange={(e) => updateContent('header_font_family', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
          >
            <option value="Poppins">Poppins</option>
            <option value="Degular Medium">Degular Medium</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Font Size (px)</label>
          <input
            type="number"
            value={content.header_font_size || 48}
            onChange={(e) => updateContent('header_font_size', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
            min="16"
            max="96"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Font Color</label>
        <input
          type="color"
          value={content.header_color || '#ffffff'}
          onChange={(e) => updateContent('header_color', e.target.value)}
          className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
        />
      </div>

      {/* Text Alignment */}
      <div>
        <label className="block text-sm font-medium mb-1">Text Alignment</label>
        <select
          value={content.text_alignment || 'left'}
          onChange={(e) => updateContent('text_alignment', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      {/* Line Spacing */}
      <div>
        <label className="block text-sm font-medium mb-1">Line Spacing</label>
        <input
          type="number"
          step="0.1"
          min="0.5"
          max="3"
          value={content.line_spacing || 1.2}
          onChange={(e) => updateContent('line_spacing', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        />
      </div>

      {/* Container Padding */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Container Padding</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Vertical (px)</label>
            <input
              type="number"
              value={content.padding_vertical || 80}
              onChange={(e) => updateContent('padding_vertical', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Horizontal (px)</label>
            <input
              type="number"
              value={content.padding_horizontal || 16}
              onChange={(e) => updateContent('padding_horizontal', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Text Position */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Text Position</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">From Left (px)</label>
            <input
              type="number"
              value={content.text_padding_left || 0}
              onChange={(e) => updateContent('text_padding_left', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">From Right (px)</label>
            <input
              type="number"
              value={content.text_padding_right || 0}
              onChange={(e) => updateContent('text_padding_right', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">From Top (px)</label>
            <input
              type="number"
              value={content.text_padding_top || 0}
              onChange={(e) => updateContent('text_padding_top', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">From Bottom (px)</label>
            <input
              type="number"
              value={content.text_padding_bottom || 0}
              onChange={(e) => updateContent('text_padding_bottom', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              min="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
