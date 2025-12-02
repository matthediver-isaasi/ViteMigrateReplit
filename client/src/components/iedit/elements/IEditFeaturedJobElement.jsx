import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowRight, MapPin, Building2, Clock, Briefcase, Calendar, Banknote } from "lucide-react";
import { Link } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { createPageUrl } from "@/utils";

export default function IEditFeaturedJobElement({ content, variant, settings }) {
  const {
    // Left side static content
    header_label = 'JOBS',
    header_label_font_family = 'Poppins',
    header_label_font_size = 14,
    header_label_letter_spacing = 0.31,
    header_label_color = '#000000',
    show_header_underline = true,
    header_underline_color = '#000000',
    header_underline_width = 36,
    header_underline_weight = 2,
    
    main_heading = 'Featured\nOpportunity',
    heading_font_family = 'inherit',
    heading_font_size = 55,
    heading_line_height = 0.91,
    heading_color = '#000000',
    
    subheading = '',
    subheading_font_family = 'Poppins',
    subheading_font_size = 18,
    subheading_color = '#666666',
    
    button_text = 'View All Jobs',
    button_url = '/JobBoard',
    button_style = 'outline', // outline or filled
    button_color = '#000000',
    button_font_family = 'Poppins',
    
    // Background settings
    gradient_start_color = '#FFB000',
    gradient_end_color = '#D02711',
    gradient_angle = 135,
    right_side_color = '#1a1a2e',
    card_background = '#FFFFFF',
    
    // Right side job display
    job_title_font_family = 'Poppins',
    job_title_font_size = 32,
    job_title_color = '#FFFFFF',
    job_detail_font_family = 'Poppins',
    job_detail_font_size = 16,
    job_detail_color = '#FFFFFF',
    job_detail_opacity = 0.9,
    divider_color = 'rgba(255,255,255,0.3)',
    divider_weight = 1,
    
    // Data source
    show_latest_job = true,
    specific_job_id = null,
    
    // Layout
    layout_style = 'side-gradient',
    min_height = 550,
    vertical_padding = 48
  } = content || {};

  const fullWidth = settings?.fullWidth;

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['featured-jobs-element', specific_job_id],
    queryFn: async () => {
      if (specific_job_id) {
        const job = await base44.entities.JobPosting.get(specific_job_id);
        return job ? [job] : [];
      }
      const allJobs = await base44.entities.JobPosting.filter({ status: 'active' });
      const now = new Date();
      const activeJobs = allJobs
        .filter(job => !job.closing_date || new Date(job.closing_date) > now)
        .sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.created_date) - new Date(a.created_date);
        });
      return activeJobs.slice(0, 1);
    },
    staleTime: 60000
  });

  const featuredJob = jobs[0];

  const gradientStyle = {
    background: `linear-gradient(${gradient_angle}deg, ${gradient_start_color} 0%, ${gradient_end_color} 100%)`
  };

  const formatClosingDate = (date) => {
    if (!date) return null;
    try {
      return format(new Date(date), 'do MMMM yyyy');
    } catch {
      return date;
    }
  };

  const isClosingSoon = (closingDate) => {
    if (!closingDate) return false;
    const days = differenceInDays(new Date(closingDate), new Date());
    return days >= 0 && days <= 7;
  };

  // Full-width gradient banner layout
  if (layout_style === 'full-width') {
    return (
      <div className="w-full" style={{ ...gradientStyle, padding: `${vertical_padding}px 0` }}>
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Left - Static content */}
            <div className="flex-1">
              <StaticContent 
                content={content} 
                textColorOverride="#FFFFFF"
                underlineColorOverride="rgba(255,255,255,0.5)"
              />
            </div>

            {/* Right - Job details */}
            {featuredJob && (
              <div className="flex-1">
                <JobDetails 
                  job={featuredJob}
                  content={content}
                  formatClosingDate={formatClosingDate}
                  isClosingSoon={isClosingSoon}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: Split background layout
  return (
    <div 
      className="relative w-full overflow-hidden"
      style={{ minHeight: `${min_height}px` }}
    >
      {/* Full-bleed split background */}
      <div className="absolute inset-0 flex">
        {/* Left half - Gradient */}
        <div 
          className="w-1/2 h-full"
          style={gradientStyle}
        />
        {/* Right half - Solid color */}
        <div 
          className="w-1/2 h-full"
          style={{ background: right_side_color }}
        />
      </div>

      {/* Centered content container */}
      <div 
        className="relative max-w-6xl mx-auto px-8 h-full flex items-center"
        style={{ padding: `${vertical_padding}px 32px` }}
      >
        {/* Two-column grid for content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-center">
          {/* Left column - Static content in white card */}
          <div className="flex items-center justify-center lg:justify-start">
            <div 
              className="w-full max-w-md p-10 shadow-xl"
              style={{ background: card_background }}
            >
              <StaticContent content={content} />
            </div>
          </div>

          {/* Right column - Dynamic job content */}
          <div className="flex items-center justify-center lg:justify-start lg:pl-8">
            {isLoading ? (
              <div className="animate-pulse space-y-4 w-full">
                <div className="h-8 bg-white/20 rounded w-3/4" />
                <div className="h-px bg-white/20 w-full" />
                <div className="h-5 bg-white/20 rounded w-1/2" />
                <div className="h-px bg-white/20 w-full" />
                <div className="h-5 bg-white/20 rounded w-2/3" />
              </div>
            ) : featuredJob ? (
              <JobDetails 
                job={featuredJob}
                content={content}
                formatClosingDate={formatClosingDate}
                isClosingSoon={isClosingSoon}
              />
            ) : (
              <div style={{ color: job_detail_color, opacity: job_detail_opacity }}>
                No featured job available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StaticContent({ content, textColorOverride, underlineColorOverride }) {
  const {
    header_label = 'JOBS',
    header_label_font_family = 'Poppins',
    header_label_font_size = 14,
    header_label_letter_spacing = 0.31,
    header_label_color = '#000000',
    show_header_underline = true,
    header_underline_color = '#000000',
    header_underline_width = 36,
    header_underline_weight = 2,
    
    main_heading = 'Featured\nOpportunity',
    heading_font_family = 'inherit',
    heading_font_size = 55,
    heading_line_height = 0.91,
    heading_color = '#000000',
    
    subheading = '',
    subheading_font_family = 'Poppins',
    subheading_font_size = 18,
    subheading_color = '#666666',
    
    button_text = 'View All Jobs',
    button_url = '/JobBoard',
    button_style = 'outline',
    button_color = '#000000',
    button_font_family = 'Poppins'
  } = content || {};

  const labelColor = textColorOverride || header_label_color;
  const headingColorFinal = textColorOverride || heading_color;
  const subheadingColorFinal = textColorOverride || subheading_color;
  const buttonColorFinal = textColorOverride || button_color;
  const underlineColor = underlineColorOverride || header_underline_color;

  return (
    <div>
      {/* Header label */}
      <div className="mb-6">
        <span 
          className="font-bold uppercase"
          style={{ 
            fontFamily: header_label_font_family,
            fontSize: `${header_label_font_size}px`,
            letterSpacing: `${header_label_letter_spacing}em`,
            color: labelColor
          }}
        >
          {header_label}
        </span>
        {show_header_underline && (
          <div 
            className="mt-2"
            style={{ 
              width: `${header_underline_width}px`,
              height: `${header_underline_weight}px`,
              background: underlineColor
            }} 
          />
        )}
      </div>

      {/* Main heading */}
      <h2 
        className="font-medium whitespace-pre-line mb-6"
        style={{ 
          fontFamily: heading_font_family,
          fontSize: `${heading_font_size}px`,
          lineHeight: `${heading_line_height}em`,
          color: headingColorFinal
        }}
      >
        {main_heading}
      </h2>

      {/* Subheading */}
      {subheading && (
        <p
          className="mb-8"
          style={{
            fontFamily: subheading_font_family,
            fontSize: `${subheading_font_size}px`,
            color: subheadingColorFinal
          }}
        >
          {subheading}
        </p>
      )}

      {/* Button */}
      {button_text && (
        <div className="mt-8">
          <Link to={button_url}>
            <button 
              className={`inline-flex items-center gap-3 px-6 py-3 font-semibold text-lg transition-all ${
                button_style === 'filled' 
                  ? 'hover:opacity-90' 
                  : 'border-2 hover:bg-black/5'
              }`}
              style={{ 
                borderColor: button_style === 'outline' ? buttonColorFinal : 'transparent',
                color: button_style === 'filled' ? '#FFFFFF' : buttonColorFinal,
                background: button_style === 'filled' ? buttonColorFinal : 'transparent',
                fontFamily: button_font_family
              }}
            >
              {button_text}
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

function JobDetails({ job, content, formatClosingDate, isClosingSoon }) {
  const {
    job_title_font_family = 'Poppins',
    job_title_font_size = 32,
    job_title_color = '#FFFFFF',
    job_detail_font_family = 'Poppins',
    job_detail_font_size = 16,
    job_detail_color = '#FFFFFF',
    job_detail_opacity = 0.9,
    divider_color = 'rgba(255,255,255,0.3)',
    divider_weight = 1
  } = content || {};

  const details = [
    { label: 'Organisation', value: job.company_name, icon: Building2 },
    { label: 'Contract Type', value: job.job_type, icon: Briefcase },
    { label: 'Salary', value: job.salary, icon: Banknote },
    { label: 'Closing Date', value: formatClosingDate(job.closing_date), icon: Calendar, isClosingSoon: isClosingSoon(job.closing_date) }
  ].filter(d => d.value);

  return (
    <Link 
      to={createPageUrl('JobDetails') + `?id=${job.id}`}
      className="block group w-full"
    >
      {/* Job title as header */}
      <h3 
        className="font-semibold mb-6 group-hover:underline"
        style={{
          fontFamily: job_title_font_family,
          fontSize: `${job_title_font_size}px`,
          color: job_title_color
        }}
      >
        {job.title}
      </h3>

      {/* Details with dividers */}
      <div className="space-y-0">
        {details.map((detail, index) => (
          <div key={detail.label}>
            {/* Divider line */}
            <div 
              style={{ 
                height: `${divider_weight}px`, 
                background: divider_color 
              }} 
            />
            
            {/* Detail row */}
            <div 
              className="flex items-center gap-3 py-4"
              style={{
                fontFamily: job_detail_font_family,
                fontSize: `${job_detail_font_size}px`,
                color: job_detail_color,
                opacity: job_detail_opacity
              }}
            >
              <detail.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium min-w-[120px]">{detail.label}:</span>
              <span className="flex items-center gap-2">
                {detail.value}
                {detail.isClosingSoon && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-500 text-white">
                    Closing Soon
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
        {/* Final divider */}
        <div 
          style={{ 
            height: `${divider_weight}px`, 
            background: divider_color 
          }} 
        />
      </div>
    </Link>
  );
}

export function IEditFeaturedJobElementEditor({ element, onChange }) {
  const { data: jobs = [] } = useQuery({
    queryKey: ['all-jobs-for-selector'],
    queryFn: async () => {
      const allJobs = await base44.entities.JobPosting.list();
      return allJobs.filter(j => j.status === 'active');
    }
  });

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

  return (
    <div className="space-y-6">
      {/* Layout Settings */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm uppercase tracking-wide text-slate-500">Layout</h4>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Layout Style</label>
          <select 
            value={content.layout_style || 'side-gradient'}
            onChange={(e) => updateContent('layout_style', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="side-gradient">Split Background (Gradient Left / Solid Right)</option>
            <option value="full-width">Full Width Gradient Banner</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Minimum Height (px)</label>
            <input 
              type="number"
              value={content.min_height || 550}
              onChange={(e) => updateContent('min_height', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Vertical Padding (px)</label>
            <input 
              type="number"
              value={content.vertical_padding || 48}
              onChange={(e) => updateContent('vertical_padding', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Background Colors */}
      <div className="border-t pt-4 space-y-4">
        <h4 className="font-semibold text-sm uppercase tracking-wide text-slate-500">Background Colors</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Gradient Start</label>
            <div className="flex gap-2">
              <input 
                type="color"
                value={content.gradient_start_color || '#FFB000'}
                onChange={(e) => updateContent('gradient_start_color', e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <input 
                type="text"
                value={content.gradient_start_color || '#FFB000'}
                onChange={(e) => updateContent('gradient_start_color', e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Gradient End</label>
            <div className="flex gap-2">
              <input 
                type="color"
                value={content.gradient_end_color || '#D02711'}
                onChange={(e) => updateContent('gradient_end_color', e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <input 
                type="text"
                value={content.gradient_end_color || '#D02711'}
                onChange={(e) => updateContent('gradient_end_color', e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Gradient Angle (degrees)</label>
          <input 
            type="number"
            value={content.gradient_angle || 135}
            onChange={(e) => updateContent('gradient_angle', parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
            min="0"
            max="360"
          />
        </div>

        {content.layout_style !== 'full-width' && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Right Side Color</label>
              <div className="flex gap-2">
                <input 
                  type="color"
                  value={content.right_side_color || '#1a1a2e'}
                  onChange={(e) => updateContent('right_side_color', e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <input 
                  type="text"
                  value={content.right_side_color || '#1a1a2e'}
                  onChange={(e) => updateContent('right_side_color', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Card Background</label>
              <div className="flex gap-2">
                <input 
                  type="color"
                  value={content.card_background || '#FFFFFF'}
                  onChange={(e) => updateContent('card_background', e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <input 
                  type="text"
                  value={content.card_background || '#FFFFFF'}
                  onChange={(e) => updateContent('card_background', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Left Side - Static Content */}
      <div className="border-t pt-4 space-y-4">
        <h4 className="font-semibold text-sm uppercase tracking-wide text-slate-500">Left Side - Static Content</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Header Label</label>
            <input 
              type="text"
              value={content.header_label || 'JOBS'}
              onChange={(e) => updateContent('header_label', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Label Font Size</label>
            <input 
              type="number"
              value={content.header_label_font_size || 14}
              onChange={(e) => updateContent('header_label_font_size', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox"
              checked={content.show_header_underline !== false}
              onChange={(e) => updateContent('show_header_underline', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show underline</span>
          </label>
          {content.show_header_underline !== false && (
            <div className="flex items-center gap-2">
              <input 
                type="color"
                value={content.header_underline_color || '#000000'}
                onChange={(e) => updateContent('header_underline_color', e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer"
              />
              <input 
                type="number"
                value={content.header_underline_width || 36}
                onChange={(e) => updateContent('header_underline_width', parseInt(e.target.value))}
                className="w-16 px-2 py-1 border rounded-md text-sm"
                placeholder="Width"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Main Heading</label>
          <textarea 
            value={content.main_heading || 'Featured\nOpportunity'}
            onChange={(e) => updateContent('main_heading', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows={2}
            placeholder="Use line breaks for multi-line headings"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Heading Font Size</label>
            <input 
              type="number"
              value={content.heading_font_size || 55}
              onChange={(e) => updateContent('heading_font_size', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Heading Color</label>
            <div className="flex gap-2">
              <input 
                type="color"
                value={content.heading_color || '#000000'}
                onChange={(e) => updateContent('heading_color', e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <input 
                type="text"
                value={content.heading_color || '#000000'}
                onChange={(e) => updateContent('heading_color', e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Subheading (optional)</label>
          <textarea 
            value={content.subheading || ''}
            onChange={(e) => updateContent('subheading', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows={2}
            placeholder="Additional descriptive text"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Button Text</label>
            <input 
              type="text"
              value={content.button_text || 'View All Jobs'}
              onChange={(e) => updateContent('button_text', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Button URL</label>
            <input 
              type="text"
              value={content.button_url || '/JobBoard'}
              onChange={(e) => updateContent('button_url', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Button Style</label>
            <select 
              value={content.button_style || 'outline'}
              onChange={(e) => updateContent('button_style', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="outline">Outline</option>
              <option value="filled">Filled</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Button Color</label>
            <div className="flex gap-2">
              <input 
                type="color"
                value={content.button_color || '#000000'}
                onChange={(e) => updateContent('button_color', e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <input 
                type="text"
                value={content.button_color || '#000000'}
                onChange={(e) => updateContent('button_color', e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Job Details */}
      <div className="border-t pt-4 space-y-4">
        <h4 className="font-semibold text-sm uppercase tracking-wide text-slate-500">Right Side - Job Details</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Title Font Size</label>
            <input 
              type="number"
              value={content.job_title_font_size || 32}
              onChange={(e) => updateContent('job_title_font_size', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Title Color</label>
            <div className="flex gap-2">
              <input 
                type="color"
                value={content.job_title_color || '#FFFFFF'}
                onChange={(e) => updateContent('job_title_color', e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <input 
                type="text"
                value={content.job_title_color || '#FFFFFF'}
                onChange={(e) => updateContent('job_title_color', e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Detail Font Size</label>
            <input 
              type="number"
              value={content.job_detail_font_size || 16}
              onChange={(e) => updateContent('job_detail_font_size', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Detail Color</label>
            <div className="flex gap-2">
              <input 
                type="color"
                value={content.job_detail_color || '#FFFFFF'}
                onChange={(e) => updateContent('job_detail_color', e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <input 
                type="text"
                value={content.job_detail_color || '#FFFFFF'}
                onChange={(e) => updateContent('job_detail_color', e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Divider Line Color</label>
          <input 
            type="text"
            value={content.divider_color || 'rgba(255,255,255,0.3)'}
            onChange={(e) => updateContent('divider_color', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="e.g., rgba(255,255,255,0.3) or #FFFFFF"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Divider Weight (px)</label>
          <input 
            type="number"
            value={content.divider_weight || 1}
            onChange={(e) => updateContent('divider_weight', parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
            min="1"
            max="5"
          />
        </div>
      </div>

      {/* Job Data Source */}
      <div className="border-t pt-4 space-y-4">
        <h4 className="font-semibold text-sm uppercase tracking-wide text-slate-500">Job Data Source</h4>
        
        <div className="flex items-center gap-2">
          <input 
            type="checkbox"
            id="show_latest_job"
            checked={content.show_latest_job !== false}
            onChange={(e) => updateContent('show_latest_job', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="show_latest_job" className="text-sm">
            Show latest featured/active job automatically
          </label>
        </div>

        {!content.show_latest_job && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Specific Job</label>
            <select 
              value={content.specific_job_id || ''}
              onChange={(e) => updateContent('specific_job_id', e.target.value || null)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select a job...</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.company_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
