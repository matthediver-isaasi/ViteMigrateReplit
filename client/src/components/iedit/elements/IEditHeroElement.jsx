import { useState, useEffect } from "react";
import AGCASButton from "../../ui/AGCASButton";

export default function IEditHeroElement({ content, variant, settings }) {
  const {
    background_type = 'color',
    background_color = '#3b82f6',
    gradient_start_color = '#3b82f6',
    gradient_end_color = '#8b5cf6',
    gradient_angle = 135,
    image_url,
    image_fit = 'cover',
    overlay_enabled = false,
    overlay_color = '#000000',
    overlay_opacity = 50,
    text_color = '#ffffff',
    heading_font_family = 'Poppins',
    heading_font_size = 48,
    heading_letter_spacing = 0,
    heading_underline_enabled = false,
    heading_underline_color = '#000000',
    heading_underline_width = 100,
    heading_underline_weight = 2,
    heading_underline_spacing = 16,
    heading_underline_to_content_spacing = 24,
    subheading_font_family = 'Poppins',
    subheading_font_size = 20,
    subheading_line_height = 1.5,
    text_align = 'center',
    padding_left = 16,
    padding_right = 16,
    padding_top = 80,
    padding_bottom = 80,
    height_type = 'auto',
    custom_height = 400,
    button_top_margin = 32,
    text_vertical_align = 'center',
    button
  } = content;

  const isImageSized = height_type === 'image' && background_type === 'image' && image_url;

  const getHeightStyle = () => {
    if (height_type === 'full') return { minHeight: '100vh' };
    if (height_type === 'custom') return { minHeight: `${custom_height}px` };
    if (height_type === 'image') return {};
    return {};
  };

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

  const getTextVerticalAlign = () => {
    if (text_vertical_align === 'top') return 'flex-start';
    if (text_vertical_align === 'bottom') return 'flex-end';
    return 'center';
  };

  const containerStyle = {
    paddingLeft: `${padding_left}px`,
    paddingRight: `${padding_right}px`,
    paddingTop: `${padding_top}px`,
    paddingBottom: `${padding_bottom}px`,
    textAlign: text_align
  };

  if (isImageSized) {
    return (
      <div className="relative w-full">
        <img 
          src={image_url} 
          alt={content.heading || 'Hero background'} 
          className="w-full h-auto block"
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
        <div 
          className="absolute inset-0 flex flex-col"
          style={{ justifyContent: getTextVerticalAlign() }}
        >
          <div className="max-w-7xl mx-auto px-4 w-full" style={containerStyle}>
            {content.heading && (
              <div>
                <h1 
                  className="font-bold"
                  style={{ 
                    fontFamily: heading_font_family,
                    fontSize: `${heading_font_size}px`,
                    letterSpacing: `${heading_letter_spacing}px`,
                    color: text_color,
                    marginBottom: heading_underline_enabled ? `${heading_underline_spacing}px` : '24px'
                  }}
                >
                  {content.heading}
                </h1>
                {heading_underline_enabled && (
                  <div 
                    style={{
                      width: `${heading_underline_width}px`,
                      height: `${heading_underline_weight}px`,
                      backgroundColor: heading_underline_color,
                      margin: text_align === 'center' ? '0 auto' : text_align === 'right' ? '0 0 0 auto' : '0',
                      marginBottom: `${heading_underline_to_content_spacing}px`
                    }}
                  />
                )}
              </div>
            )}
            {content.subheading && (
              <p 
                className="mb-8 opacity-90"
                style={{ 
                  fontFamily: subheading_font_family,
                  fontSize: `${subheading_font_size}px`,
                  lineHeight: subheading_line_height,
                  color: text_color,
                  whiteSpace: 'pre-line'
                }}
              >
                {content.subheading}
              </p>
            )}
            {button && button.text && (
              <div style={{ marginTop: `${button_top_margin}px` }}>
                <AGCASButton
                  text={button.text}
                  link={button.link}
                  buttonStyleId={button.button_style_id}
                  customBgColor={button.custom_bg_color}
                  customTextColor={button.custom_text_color}
                  customBorderColor={button.custom_border_color}
                  openInNewTab={button.open_in_new_tab}
                  size={button.size || 'large'}
                  showArrow={button.show_arrow}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full overflow-hidden"
      style={{ ...getHeightStyle(), ...getBackgroundStyle() }}
    >
      {background_type === 'image' && image_url && (
        <>
          <img 
            src={image_url} 
            alt={content.heading || 'Hero background'} 
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: image_fit }}
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
      
      <div className="relative max-w-7xl mx-auto px-4" style={containerStyle}>
        {content.heading && (
          <div>
            <h1 
              className="font-bold"
              style={{ 
                fontFamily: heading_font_family,
                fontSize: `${heading_font_size}px`,
                letterSpacing: `${heading_letter_spacing}px`,
                color: text_color,
                marginBottom: heading_underline_enabled ? `${heading_underline_spacing}px` : '24px'
              }}
            >
              {content.heading}
            </h1>
            {heading_underline_enabled && (
              <div 
                style={{
                  width: `${heading_underline_width}px`,
                  height: `${heading_underline_weight}px`,
                  backgroundColor: heading_underline_color,
                  margin: text_align === 'center' ? '0 auto' : text_align === 'right' ? '0 0 0 auto' : '0',
                  marginBottom: `${heading_underline_to_content_spacing}px`
                }}
              />
            )}
          </div>
        )}
        {content.subheading && (
          <p 
            className="mb-8 opacity-90"
            style={{ 
              fontFamily: subheading_font_family,
              fontSize: `${subheading_font_size}px`,
              lineHeight: subheading_line_height,
              color: text_color,
              whiteSpace: 'pre-line'
            }}
          >
            {content.subheading}
          </p>
        )}
        {button && button.text && (
          <div style={{ marginTop: `${button_top_margin}px` }}>
            <AGCASButton
              text={button.text}
              link={button.link}
              buttonStyleId={button.button_style_id}
              customBgColor={button.custom_bg_color}
              customTextColor={button.custom_text_color}
              customBorderColor={button.custom_border_color}
              openInNewTab={button.open_in_new_tab}
              size={button.size || 'large'}
              showArrow={button.show_arrow}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function IEditHeroElementEditor({ element, onChange }) {
  const defaultButton = { 
    text: '', 
    link: '', 
    button_style_id: '', 
    open_in_new_tab: false, 
    size: 'large', 
    show_arrow: false, 
    custom_bg_color: '#000000', 
    custom_text_color: '#ffffff', 
    custom_border_color: '' 
  };

  const content = element.content || {};
  
  const backgroundType = content.background_type || 'color';

  const [isUploading, setIsUploading] = useState(false);
  const [buttonStyles, setButtonStyles] = useState([]);

  const updateContent = (key, value) => {
    onChange({ ...element, content: { ...content, [key]: value } });
  };

  const updateButton = (key, value) => {
    const currentButton = content.button || defaultButton;
    updateContent('button', { ...currentButton, [key]: value });
  };

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const { base44 } = await import("@/api/base44Client");
        const styles = await base44.entities.ButtonStyle.list();
        setButtonStyles(styles.filter(s => s.is_active));
      } catch (error) {
        console.error('Failed to fetch button styles:', error);
      }
    };
    fetchStyles();
  }, []);

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

  const button = content.button || defaultButton;

  const gradientPreview = `linear-gradient(${content.gradient_angle || 135}deg, ${content.gradient_start_color || '#3b82f6'}, ${content.gradient_end_color || '#8b5cf6'})`;

  return (
    <div className="space-y-4">
      {/* Background Type Selection */}
      <div>
        <label className="block text-sm font-medium mb-1">Background Type</label>
        <select
          value={backgroundType}
          onChange={(e) => updateContent('background_type', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        >
          <option value="color">Solid Color</option>
          <option value="gradient">Gradient</option>
          <option value="image">Image</option>
        </select>
      </div>

      {/* Solid Color Options */}
      {backgroundType === 'color' && (
        <div>
          <label className="block text-sm font-medium mb-1">Background Color</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={content.background_color || '#3b82f6'}
              onChange={(e) => updateContent('background_color', e.target.value)}
              className="w-16 h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
            />
            <input
              type="text"
              value={content.background_color || '#3b82f6'}
              onChange={(e) => updateContent('background_color', e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
              placeholder="#3b82f6"
            />
          </div>
        </div>
      )}

      {/* Gradient Options */}
      {backgroundType === 'gradient' && (
        <div className="space-y-3 p-3 bg-slate-50 rounded-md">
          <div 
            className="w-full h-16 rounded-md border border-slate-300"
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
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0° (Right)</span>
              <span>90° (Down)</span>
              <span>180° (Left)</span>
              <span>270° (Up)</span>
            </div>
          </div>
        </div>
      )}

      {/* Image Background Options */}
      {backgroundType === 'image' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Background Image</label>
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
            <label className="block text-sm font-medium mb-1">Image Scaling</label>
            <select
              value={content.image_fit || 'cover'}
              onChange={(e) => updateContent('image_fit', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="cover">Fill container (scale proportionally, may crop edges)</option>
              <option value="contain">Fit entire image (scale proportionally, may show gaps)</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              {content.image_fit === 'contain' 
                ? 'The full image will be visible, but there may be empty space around it.'
                : 'Image fills the full width and height, keeping proportions. Parts may be cropped if needed.'}
            </p>
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

      {/* Text Color */}
      <div>
        <label className="block text-sm font-medium mb-1">Text Color</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={content.text_color || '#ffffff'}
            onChange={(e) => updateContent('text_color', e.target.value)}
            className="w-16 h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
          />
          <input
            type="text"
            value={content.text_color || '#ffffff'}
            onChange={(e) => updateContent('text_color', e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
            placeholder="#ffffff"
          />
        </div>
      </div>

      {/* Container Height */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Container Height</label>
          <select
            value={content.height_type || 'auto'}
            onChange={(e) => updateContent('height_type', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
          >
            <option value="auto">Auto (Based on Content)</option>
            <option value="full">Full Viewport</option>
            <option value="custom">Custom</option>
            {backgroundType === 'image' && (
              <option value="image">Match Image Size (text overlays image)</option>
            )}
          </select>
          {content.height_type === 'image' && backgroundType === 'image' && (
            <p className="text-xs text-slate-500 mt-1">
              Container will match the image's natural dimensions. Text will overlay the image.
            </p>
          )}
        </div>

        {content.height_type === 'custom' && (
          <div>
            <label className="block text-sm font-medium mb-1">Custom Height (px)</label>
            <input
              type="number"
              value={content.custom_height || 400}
              onChange={(e) => updateContent('custom_height', parseInt(e.target.value) || 400)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              min="100"
            />
          </div>
        )}

        {content.height_type === 'image' && backgroundType === 'image' && (
          <div>
            <label className="block text-sm font-medium mb-1">Text Vertical Position</label>
            <select
              value={content.text_vertical_align || 'center'}
              onChange={(e) => updateContent('text_vertical_align', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Heading</label>
        <input
          type="text"
          value={content.heading || ''}
          onChange={(e) => updateContent('heading', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          placeholder="Enter heading..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Heading Font</label>
          <select
            value={content.heading_font_family || 'Poppins'}
            onChange={(e) => updateContent('heading_font_family', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
          >
            <option value="Poppins">Poppins</option>
            <option value="Degular Medium">Degular Medium</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Heading Size (px)</label>
          <input
            type="number"
            value={content.heading_font_size || 48}
            onChange={(e) => updateContent('heading_font_size', parseInt(e.target.value) || 48)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
            min="12"
            max="200"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Heading Letter Spacing (px)</label>
        <input
          type="number"
          step="0.5"
          value={content.heading_letter_spacing || 0}
          onChange={(e) => updateContent('heading_letter_spacing', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          min="-5"
          max="20"
        />
      </div>

      <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="underline-enabled"
            checked={content.heading_underline_enabled || false}
            onChange={(e) => updateContent('heading_underline_enabled', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="underline-enabled" className="text-sm font-medium cursor-pointer">
            Show line below heading
          </label>
        </div>

        {content.heading_underline_enabled && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Line Color</label>
                <input
                  type="color"
                  value={content.heading_underline_color || '#000000'}
                  onChange={(e) => updateContent('heading_underline_color', e.target.value)}
                  className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Line Width (px)</label>
                <input
                  type="number"
                  value={content.heading_underline_width || 100}
                  onChange={(e) => updateContent('heading_underline_width', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  min="10"
                  max="1000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Line Weight (px)</label>
                <input
                  type="number"
                  value={content.heading_underline_weight || 2}
                  onChange={(e) => updateContent('heading_underline_weight', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  min="1"
                  max="20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Spacing from Header (px)</label>
                <input
                  type="number"
                  value={content.heading_underline_spacing || 16}
                  onChange={(e) => updateContent('heading_underline_spacing', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Spacing to Content (px)</label>
              <input
                type="number"
                value={content.heading_underline_to_content_spacing || 24}
                onChange={(e) => updateContent('heading_underline_to_content_spacing', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                min="0"
                max="100"
              />
            </div>
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Subheading</label>
        <textarea
          value={content.subheading || ''}
          onChange={(e) => updateContent('subheading', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          rows="3"
          placeholder="Enter subheading..."
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Subheading Font</label>
          <select
            value={content.subheading_font_family || 'Poppins'}
            onChange={(e) => updateContent('subheading_font_family', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
          >
            <option value="Poppins">Poppins</option>
            <option value="Degular Medium">Degular Medium</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Size (px)</label>
          <input
            type="number"
            value={content.subheading_font_size || 20}
            onChange={(e) => updateContent('subheading_font_size', parseInt(e.target.value) || 20)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
            min="12"
            max="100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Line Height</label>
          <input
            type="number"
            step="0.1"
            value={content.subheading_line_height || 1.5}
            onChange={(e) => updateContent('subheading_line_height', parseFloat(e.target.value) || 1.5)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
            min="1"
            max="3"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Text Alignment</label>
        <select
          value={content.text_align || 'center'}
          onChange={(e) => updateContent('text_align', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      {/* Padding Controls */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Padding</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Top (px)</label>
            <input
              type="number"
              value={content.padding_top || 80}
              onChange={(e) => updateContent('padding_top', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bottom (px)</label>
            <input
              type="number"
              value={content.padding_bottom || 80}
              onChange={(e) => updateContent('padding_bottom', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Left (px)</label>
            <input
              type="number"
              value={content.padding_left || 16}
              onChange={(e) => updateContent('padding_left', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Right (px)</label>
            <input
              type="number"
              value={content.padding_right || 16}
              onChange={(e) => updateContent('padding_right', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              min="0"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Button Top Margin (px)</label>
        <input
          type="number"
          value={content.button_top_margin || 32}
          onChange={(e) => updateContent('button_top_margin', parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          min="0"
          max="200"
        />
        <p className="text-xs text-slate-500 mt-1">Space between text and button</p>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <h4 className="font-semibold text-sm mb-3">Button Settings</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Button Text</label>
            <input
              type="text"
              value={button.text || ''}
              onChange={(e) => updateButton('text', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              placeholder="e.g., Get Started"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Link URL</label>
            <input
              type="text"
              value={button.link || ''}
              onChange={(e) => updateButton('link', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Button Style</label>
            <select
              value={button.button_style_id || ''}
              onChange={(e) => updateButton('button_style_id', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="">Default Style</option>
              {buttonStyles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Or use custom colors below</p>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="transparent-bg-hero"
              checked={button.transparent_bg || false}
              onChange={(e) => {
                updateButton('transparent_bg', e.target.checked);
                if (e.target.checked) {
                  updateButton('custom_bg_color', 'transparent');
                }
              }}
              className="w-4 h-4"
            />
            <label htmlFor="transparent-bg-hero" className="text-sm cursor-pointer">
              Transparent background
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Background</label>
              <input
                type="color"
                value={button.custom_bg_color === 'transparent' ? '#000000' : (button.custom_bg_color || '#000000')}
                onChange={(e) => {
                  updateButton('custom_bg_color', e.target.value);
                  updateButton('transparent_bg', false);
                }}
                className={`w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer ${button.transparent_bg ? 'opacity-50' : ''}`}
                disabled={button.transparent_bg}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Text</label>
              <input
                type="color"
                value={button.custom_text_color || '#ffffff'}
                onChange={(e) => updateButton('custom_text_color', e.target.value)}
                className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Border</label>
              <input
                type="color"
                value={button.custom_border_color || ''}
                onChange={(e) => updateButton('custom_border_color', e.target.value)}
                className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Button Size</label>
            <select
              value={button.size || 'large'}
              onChange={(e) => updateButton('size', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="arrow-hero"
              checked={button.show_arrow || false}
              onChange={(e) => updateButton('show_arrow', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="arrow-hero" className="text-sm cursor-pointer">
              Show arrow icon
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="new-tab-hero"
              checked={button.open_in_new_tab || false}
              onChange={(e) => updateButton('open_in_new_tab', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="new-tab-hero" className="text-sm cursor-pointer">
              Open in new tab
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
