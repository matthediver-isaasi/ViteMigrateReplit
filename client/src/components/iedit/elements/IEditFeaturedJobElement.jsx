import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowRight, MapPin, Building2, Clock, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { createPageUrl } from "@/utils";

export default function IEditFeaturedJobElement({ content, variant, settings }) {
  const {
    header_text = 'JOBS',
    main_heading = 'Featured\nOpportunity',
    button_text = 'View All Jobs',
    button_url = '/JobBoard',
    gradient_start_color = '#FFB000',
    gradient_end_color = '#D02711',
    gradient_angle = 135,
    right_side_color = '#1a1a2e',
    card_background = '#FFFFFF',
    text_color = '#000000',
    header_font_family = 'Poppins',
    heading_font_family = 'inherit',
    heading_font_size = 55,
    show_latest_job = true,
    specific_job_id = null,
    max_jobs_to_show = 1,
    show_job_details = true,
    show_company_logo = true,
    layout_style = 'side-gradient',
    min_height = 550
  } = content || {};

  const fullWidth = settings?.fullWidth;

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['featured-jobs-element', specific_job_id, max_jobs_to_show],
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
      return activeJobs.slice(0, max_jobs_to_show);
    },
    staleTime: 60000
  });

  const featuredJob = jobs[0];

  const isClosingSoon = (closingDate) => {
    if (!closingDate) return false;
    const days = differenceInDays(new Date(closingDate), new Date());
    return days >= 0 && days <= 7;
  };

  const gradientStyle = {
    background: `linear-gradient(${gradient_angle}deg, ${gradient_start_color} 0%, ${gradient_end_color} 100%)`
  };

  if (layout_style === 'full-width') {
    return (
      <div className="w-full py-16" style={gradientStyle}>
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="mb-4">
                <span 
                  className="text-sm font-bold tracking-[0.31em] uppercase"
                  style={{ fontFamily: header_font_family, color: card_background }}
                >
                  {header_text}
                </span>
                <div className="w-9 h-0.5 mt-2" style={{ background: card_background }} />
              </div>
              <h2 
                className="font-medium leading-tight whitespace-pre-line mb-8"
                style={{ 
                  fontFamily: heading_font_family,
                  fontSize: `${heading_font_size}px`,
                  lineHeight: '0.91em',
                  color: card_background
                }}
              >
                {main_heading}
              </h2>
            </div>

            {featuredJob && show_job_details && (
              <div 
                className="flex-1 p-8 rounded-lg shadow-lg"
                style={{ background: card_background }}
              >
                <JobCard job={featuredJob} textColor={text_color} isClosingSoon={isClosingSoon} />
              </div>
            )}
          </div>

          <div className="mt-8">
            <Link to={button_url}>
              <button 
                className="inline-flex items-center gap-3 px-6 py-3 border-2 font-semibold text-lg transition-all hover:bg-white/10"
                style={{ borderColor: card_background, color: card_background }}
              >
                {button_text}
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default: Split background layout
  // Full-bleed backgrounds with centered content
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
      <div className="relative max-w-6xl mx-auto px-8 py-12 h-full flex items-center">
        {/* Two-column grid for content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          {/* Left column - Overlay card within content area */}
          <div className="flex items-center justify-center lg:justify-start">
            <div 
              className="w-full max-w-md p-10 shadow-xl"
              style={{ background: card_background }}
            >
              <div className="mb-6">
                <span 
                  className="text-sm font-bold tracking-[0.31em] uppercase"
                  style={{ fontFamily: header_font_family, color: text_color }}
                >
                  {header_text}
                </span>
                <div className="w-9 h-0.5 mt-2 bg-black" />
              </div>

              <h2 
                className="font-medium leading-tight whitespace-pre-line mb-8"
                style={{ 
                  fontFamily: heading_font_family,
                  fontSize: `${heading_font_size}px`,
                  lineHeight: '0.91em',
                  color: text_color
                }}
              >
                {main_heading}
              </h2>

              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                </div>
              ) : featuredJob && show_job_details ? (
                <JobCard job={featuredJob} textColor={text_color} isClosingSoon={isClosingSoon} />
              ) : null}

              <div className="mt-8">
                <Link to={button_url}>
                  <button 
                    className="inline-flex items-center gap-3 px-6 py-3 border-2 font-semibold text-lg transition-all hover:bg-black/5"
                    style={{ borderColor: text_color, color: text_color, fontFamily: header_font_family }}
                  >
                    {button_text}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right column - Empty or can be used for additional content */}
          <div className="hidden lg:block">
            {/* This space intentionally left for the solid color background to show through */}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, textColor, isClosingSoon }) {
  return (
    <Link 
      to={createPageUrl('JobDetails') + `?id=${job.id}`}
      className="block group"
    >
      <div className="space-y-3">
        {job.company_logo && (
          <img 
            src={job.company_logo} 
            alt={job.company_name}
            className="h-10 w-auto object-contain mb-4"
          />
        )}
        
        <h3 
          className="text-xl font-semibold group-hover:underline"
          style={{ color: textColor }}
        >
          {job.title}
        </h3>

        <div className="flex flex-wrap gap-4 text-sm" style={{ color: textColor, opacity: 0.7 }}>
          {job.company_name && (
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {job.company_name}
            </span>
          )}
          {job.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {job.location}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {job.job_type && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
              style={{ background: `${textColor}10`, color: textColor }}
            >
              <Briefcase className="w-3 h-3" />
              {job.job_type}
            </span>
          )}
          {job.hours && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
              style={{ background: `${textColor}10`, color: textColor }}
            >
              <Clock className="w-3 h-3" />
              {job.hours}
            </span>
          )}
          {job.closing_date && isClosingSoon(job.closing_date) && (
            <span className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-800">
              Closing Soon
            </span>
          )}
        </div>

        {job.description && (
          <p 
            className="text-sm line-clamp-2 mt-2"
            style={{ color: textColor, opacity: 0.6 }}
          >
            {job.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
          </p>
        )}
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Header Text</label>
          <input 
            type="text"
            value={content.header_text || 'JOBS'}
            onChange={(e) => updateContent('header_text', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Button Text</label>
          <input 
            type="text"
            value={content.button_text || 'View All Jobs'}
            onChange={(e) => updateContent('button_text', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
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

      <div className="border-t pt-4">
        <h4 className="font-medium mb-4">Background Colors</h4>
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

        {content.layout_style !== 'full-width' && (
          <div className="mt-4 space-y-2">
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
        )}
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
          <label className="text-sm font-medium">Gradient Angle</label>
          <input 
            type="number"
            value={content.gradient_angle || 135}
            onChange={(e) => updateContent('gradient_angle', parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
            min="0"
            max="360"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Minimum Height (px)</label>
        <input 
          type="number"
          value={content.min_height || 550}
          onChange={(e) => updateContent('min_height', parseInt(e.target.value))}
          className="w-full px-3 py-2 border rounded-md"
          min="300"
          max="800"
        />
      </div>

      <div className="border-t pt-4 space-y-4">
        <h4 className="font-medium">Job Data Source</h4>
        
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

        <div className="flex items-center gap-2">
          <input 
            type="checkbox"
            id="show_job_details"
            checked={content.show_job_details !== false}
            onChange={(e) => updateContent('show_job_details', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="show_job_details" className="text-sm">
            Show job details in the element
          </label>
        </div>
      </div>
    </div>
  );
}
