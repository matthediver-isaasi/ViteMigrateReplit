import React from "react";
import AGCASButton from "../../ui/AGCASButton";
import TypographyStyleSelector, { applyTypographyStyle } from "../TypographyStyleSelector";

export default function IEditButtonBlockElement({ content, variant, settings }) {
  const { 
    header, 
    header_alignment = 'center',
    background_color = '#ffffff',
    header_font_family = 'Poppins',
    header_font_size = '32',
    header_color = '#000000',
    button_gap = '16',
    buttons = []
  } = content;

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const headerAlign = alignmentClasses[header_alignment] || alignmentClasses.center;

  // Filter out empty buttons
  const validButtons = buttons.filter(btn => btn?.text && btn?.text.trim() !== '');

  return (
    <div 
      className="py-12 px-4"
      style={{ backgroundColor: background_color }}
    >
      <div className="max-w-7xl mx-auto">
        {header && (
          <h2 
            className={`${headerAlign} mb-8 font-bold`}
            style={{ 
              fontFamily: header_font_family,
              fontSize: `${header_font_size}px`,
              color: header_color
            }}
          >
            {header}
          </h2>
        )}
        
        <div 
          className={`flex flex-wrap ${
            header_alignment === 'center' ? 'justify-center' : 
            header_alignment === 'right' ? 'justify-end' : 
            'justify-start'
          }`}
          style={{ gap: `${button_gap}px` }}
        >
          {validButtons.map((button, index) => (
            <AGCASButton
              key={index}
              text={button.text}
              link={button.link}
              buttonStyleId={button.button_style_id}
              customBgColor={button.custom_bg_color}
              customTextColor={button.custom_text_color}
              customBorderColor={button.custom_border_color}
              openInNewTab={button.open_in_new_tab}
              size={button.size || 'medium'}
              showArrow={button.show_arrow}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Editor Component
export function IEditButtonBlockElementEditor({ element, onChange }) {
  const defaultButton = { text: '', link: '', button_style_id: '', open_in_new_tab: false, size: 'medium', show_arrow: false, custom_bg_color: '#000000', custom_text_color: '#ffffff', custom_border_color: '' };
  
  const content = element.content ? {
    header: element.content.header ?? '',
    header_alignment: element.content.header_alignment ?? 'center',
    background_color: element.content.background_color ?? '#ffffff',
    header_font_family: element.content.header_font_family ?? 'Poppins',
    header_font_size: element.content.header_font_size ?? '32',
    header_font_size_mobile: element.content.header_font_size_mobile ?? '',
    header_color: element.content.header_color ?? '#000000',
    header_typography_style_id: element.content.header_typography_style_id ?? null,
    button_gap: element.content.button_gap ?? '16',
    buttons: (element.content.buttons || [defaultButton]).map(btn => ({ ...defaultButton, ...btn }))
  } : {
    header: '',
    header_alignment: 'center',
    background_color: '#ffffff',
    header_font_family: 'Poppins',
    header_font_size: '32',
    header_font_size_mobile: '',
    header_color: '#000000',
    header_typography_style_id: null,
    button_gap: '16',
    buttons: [defaultButton]
  };

  const updateContent = (key, value) => {
    onChange({ ...element, content: { ...content, [key]: value } });
  };

  const updateButton = (index, key, value) => {
    const newButtons = [...(content.buttons || [])];
    newButtons[index] = { ...newButtons[index], [key]: value };
    updateContent('buttons', newButtons);
  };

  const addButton = () => {
    if ((content.buttons || []).length < 4) {
      updateContent('buttons', [
        ...(content.buttons || []),
        { text: '', link: '', button_style_id: '', open_in_new_tab: false, size: 'medium', show_arrow: false, custom_bg_color: '#000000', custom_text_color: '#ffffff', custom_border_color: '' }
      ]);
    }
  };

  const removeButton = (index) => {
    const newButtons = [...(content.buttons || [])];
    newButtons.splice(index, 1);
    updateContent('buttons', newButtons);
  };

  // Fetch button styles
  const [buttonStyles, setButtonStyles] = React.useState([]);
  
  React.useEffect(() => {
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
        <h4 className="font-semibold text-sm">Header Settings</h4>
        
        <div>
          <label className="block text-sm font-medium mb-1">Header Text</label>
          <input
            type="text"
            value={content.header || ''}
            onChange={(e) => updateContent('header', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
            placeholder="Enter header text..."
          />
        </div>

        <TypographyStyleSelector
          value={content.header_typography_style_id}
          onChange={(styleId) => updateContent('header_typography_style_id', styleId)}
          onApplyStyle={(style) => {
            const styleProps = applyTypographyStyle(style);
            if (styleProps.font_family) updateContent('header_font_family', styleProps.font_family);
            if (styleProps.font_size) updateContent('header_font_size', styleProps.font_size);
            if (styleProps.font_size_mobile) updateContent('header_font_size_mobile', styleProps.font_size_mobile);
            if (styleProps.color) updateContent('header_color', styleProps.color);
            updateContent('header_typography_style_id', style.id);
          }}
          filterTypes={['h1', 'h2', 'h3']}
          label="Typography Style"
        />

        <div>
          <label className="block text-sm font-medium mb-1">Alignment</label>
          <select
            value={content.header_alignment || 'center'}
            onChange={(e) => updateContent('header_alignment', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-medium">Manual Font Settings</summary>
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Font</label>
              <select
                value={content.header_font_family || 'Poppins'}
                onChange={(e) => updateContent('header_font_family', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="Poppins">Poppins</option>
                <option value="Degular Medium">Degular Medium</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Font Size (px)</label>
                <input
                  type="number"
                  value={content.header_font_size || 32}
                  onChange={(e) => updateContent('header_font_size', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  min="12"
                  max="72"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Font Color</label>
                <input
                  type="color"
                  value={content.header_color || '#000000'}
                  onChange={(e) => updateContent('header_color', e.target.value)}
                  className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                />
              </div>
            </div>
          </div>
        </details>

        <div>
          <label className="block text-sm font-medium mb-1">Background Color</label>
          <input
            type="color"
            value={content.background_color || '#ffffff'}
            onChange={(e) => updateContent('background_color', e.target.value)}
            className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Button Gap (px)</label>
          <input
            type="number"
            value={content.button_gap || 16}
            onChange={(e) => updateContent('button_gap', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
            min="0"
            max="100"
          />
        </div>
      </div>

      {/* Buttons Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Buttons ({(content.buttons || []).length}/4)</h4>
          {(content.buttons || []).length < 4 && (
            <button
              onClick={addButton}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              + Add Button
            </button>
          )}
        </div>

        {(content.buttons || []).map((button, index) => (
          <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Button {index + 1}</span>
              <button
                onClick={() => removeButton(index)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Button Text *</label>
              <input
                type="text"
                value={button.text || ''}
                onChange={(e) => updateButton(index, 'text', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="e.g., Learn More"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Link URL *</label>
              <input
                type="text"
                value={button.link || ''}
                onChange={(e) => updateButton(index, 'link', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Button Style</label>
              <select
                value={button.button_style_id || ''}
                onChange={(e) => updateButton(index, 'button_style_id', e.target.value)}
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

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Background</label>
                <input
                  type="color"
                  value={button.custom_bg_color || '#000000'}
                  onChange={(e) => updateButton(index, 'custom_bg_color', e.target.value)}
                  className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Text</label>
                <input
                  type="color"
                  value={button.custom_text_color || '#ffffff'}
                  onChange={(e) => updateButton(index, 'custom_text_color', e.target.value)}
                  className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Border (opt.)</label>
                <input
                  type="color"
                  value={button.custom_border_color || ''}
                  onChange={(e) => updateButton(index, 'custom_border_color', e.target.value)}
                  className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Button Size</label>
              <select
                value={button.size || 'medium'}
                onChange={(e) => updateButton(index, 'size', e.target.value)}
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
                id={`arrow-${index}`}
                checked={button.show_arrow || false}
                onChange={(e) => updateButton(index, 'show_arrow', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor={`arrow-${index}`} className="text-sm cursor-pointer">
                Show arrow icon →
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`new-tab-${index}`}
                checked={button.open_in_new_tab || false}
                onChange={(e) => updateButton(index, 'open_in_new_tab', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor={`new-tab-${index}`} className="text-sm cursor-pointer">
                Open in new tab
              </label>
            </div>
          </div>
        ))}

        {(content.buttons || []).length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No buttons added yet. Click "Add Button" to get started.
          </div>
        )}
      </div>
    </div>
  );
}