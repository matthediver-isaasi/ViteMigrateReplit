import { useState, useEffect } from "react";

const STYLE_TYPE_LABELS = {
  'h1': 'H1 - Main Heading',
  'h2': 'H2 - Section Heading',
  'h3': 'H3 - Subsection Heading',
  'h4': 'H4 - Small Heading',
  'paragraph': 'Paragraph'
};

export default function TypographyStyleSelector({ 
  value, 
  onChange, 
  onApplyStyle,
  filterTypes = null,
  label = "Typography Style",
  placeholder = "Select a style to apply..."
}) {
  const [styles, setStyles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const { base44 } = await import("@/api/base44Client");
        const allStyles = await base44.entities.TypographyStyle.list();
        let activeStyles = allStyles.filter(s => s.is_active);
        
        if (filterTypes && filterTypes.length > 0) {
          activeStyles = activeStyles.filter(s => filterTypes.includes(s.style_type));
        }
        
        activeStyles.sort((a, b) => {
          const typeOrder = ['h1', 'h2', 'h3', 'h4', 'paragraph'];
          const aOrder = typeOrder.indexOf(a.style_type);
          const bOrder = typeOrder.indexOf(b.style_type);
          if (aOrder !== bOrder) return aOrder - bOrder;
          return a.name.localeCompare(b.name);
        });
        
        setStyles(activeStyles);
      } catch (error) {
        console.error('Failed to fetch typography styles:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStyles();
  }, [filterTypes]);

  const handleChange = (styleId) => {
    onChange(styleId);
    
    if (styleId && onApplyStyle) {
      const selectedStyle = styles.find(s => s.id === styleId);
      if (selectedStyle) {
        onApplyStyle(selectedStyle);
      }
    }
  };

  const selectedStyle = value ? styles.find(s => s.id === value) : null;

  const groupedStyles = styles.reduce((acc, style) => {
    const type = style.style_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(style);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium mb-1">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => handleChange(e.target.value || null)}
        className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm"
        disabled={isLoading}
        data-testid="select-typography-style"
      >
        <option value="">{isLoading ? 'Loading styles...' : placeholder}</option>
        {Object.entries(groupedStyles).map(([type, typeStyles]) => (
          <optgroup key={type} label={STYLE_TYPE_LABELS[type] || type}>
            {typeStyles.map(style => (
              <option key={style.id} value={style.id}>
                {style.name} {style.is_default ? '(Default)' : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      
      {selectedStyle && (
        <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
          <span>
            {selectedStyle.font_family.split(',')[0].replace(/'/g, '')} • {selectedStyle.font_size}px • {selectedStyle.font_weight}
          </span>
          <button
            type="button"
            onClick={() => handleChange(null)}
            className="text-red-500 hover:text-red-700 text-xs"
            data-testid="button-clear-typography-style"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

export function applyTypographyStyle(style) {
  if (!style) return {};
  
  return {
    font_family: style.font_family,
    font_size: style.font_size,
    font_size_mobile: style.font_size_mobile,
    font_weight: style.font_weight,
    line_height: style.line_height,
    letter_spacing: style.letter_spacing,
    text_transform: style.text_transform,
    ...(style.color ? { color: style.color } : {})
  };
}

export function getTypographyStyleCSS(style, isMobile = false) {
  if (!style) return {};
  
  const fontSize = isMobile && style.font_size_mobile 
    ? style.font_size_mobile 
    : style.font_size;
  
  return {
    fontFamily: style.font_family,
    fontSize: `${fontSize}px`,
    fontWeight: style.font_weight,
    lineHeight: style.line_height,
    letterSpacing: `${style.letter_spacing}px`,
    textTransform: style.text_transform,
    ...(style.color ? { color: style.color } : {})
  };
}
