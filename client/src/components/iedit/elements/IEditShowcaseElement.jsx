import React from "react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, Trash2, Calendar, FileText, Sparkles, Briefcase, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

function CardSlotEditor({ index, card, onUpdate }) {
  // Fetch article display name setting
  const { data: articleDisplayName = 'Articles' } = useQuery({
    queryKey: ['article-display-name'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      const setting = allSettings.find(s => s.setting_key === 'article_display_name');
      return setting?.setting_value || 'Articles';
    }
  });

  // Fetch items based on content type
  const { data: items = [] } = useQuery({
    queryKey: ['showcase-items', card.contentType],
    queryFn: async () => {
      switch (card.contentType) {
        case 'news':
          const news = await base44.entities.NewsPost.list('-published_date');
          return news.filter(n => n.status === 'published');
        case 'resources':
          return await base44.entities.Resource.list('-created_date');
        case 'articles':
          const articles = await base44.entities.BlogPost.list('-published_date');
          return articles.filter(a => a.status === 'published');
        case 'jobs':
          const jobs = await base44.entities.JobPosting.list('-created_date');
          return jobs.filter(j => j.status === 'active');
        default:
          return [];
      }
    }
  });

  const getDefaultLabel = (contentType) => {
    switch (contentType) {
      case 'news': return 'News';
      case 'resources': return 'Resource';
      case 'articles': return articleDisplayName?.slice(0, -1) || 'Article';
      case 'jobs': return 'Job';
      default: return '';
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
      <div className="text-xs font-medium text-slate-600 mb-2">Card {index + 1}</div>
      <div className="space-y-3">
        <Select
          value={card.contentType}
          onValueChange={(value) => onUpdate(index, 'contentType', value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="news">News</SelectItem>
            <SelectItem value="resources">Resources</SelectItem>
            <SelectItem value="articles">{articleDisplayName}</SelectItem>
            <SelectItem value="jobs">Jobs</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={card.itemId || ''}
          onValueChange={(value) => onUpdate(index, 'itemId', value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select item..." />
          </SelectTrigger>
          <SelectContent>
            {items.length === 0 ? (
              <div className="p-2 text-xs text-slate-500">No items available</div>
            ) : (
              items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title || item.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <div className="pt-2 border-t border-slate-300 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`showLabel-${index}`}
              checked={card.showLabel ?? true}
              onChange={(e) => onUpdate(index, 'showLabel', e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor={`showLabel-${index}`} className="cursor-pointer text-xs">
              Show Label
            </Label>
          </div>

          {card.showLabel !== false && (
            <>
              <div>
                <Label htmlFor={`labelText-${index}`} className="text-xs">Label Text</Label>
                <Input
                  id={`labelText-${index}`}
                  value={card.labelText || getDefaultLabel(card.contentType)}
                  onChange={(e) => onUpdate(index, 'labelText', e.target.value)}
                  placeholder="Custom label..."
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`labelBg-${index}`} className="text-xs">Background</Label>
                  <input
                    id={`labelBg-${index}`}
                    type="color"
                    value={card.labelBgColor || '#2563eb'}
                    onChange={(e) => onUpdate(index, 'labelBgColor', e.target.value)}
                    className="w-full h-8 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                  />
                </div>
                <div>
                  <Label htmlFor={`labelText-${index}`} className="text-xs">Text Color</Label>
                  <input
                    id={`labelTextColor-${index}`}
                    type="color"
                    value={card.labelTextColor || '#ffffff'}
                    onChange={(e) => onUpdate(index, 'labelTextColor', e.target.value)}
                    className="w-full h-8 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function IEditShowcaseElementEditor({ element, onChange }) {
  const [isUploadingBg, setIsUploadingBg] = React.useState(false);
  
  const content = element.content || {
    headerText: '',
    descriptionText: '',
    heading_font_family: 'Poppins',
    heading_font_size: 48,
    heading_letter_spacing: 0,
    heading_underline_enabled: false,
    heading_underline_color: '#000000',
    heading_underline_width: 100,
    heading_underline_weight: 2,
    heading_underline_spacing: 16,
    heading_underline_to_content_spacing: 24,
    heading_underline_alignment: 'center',
    subheading_font_family: 'Poppins',
    subheading_font_size: 20,
    subheading_line_height: 1.5,
    text_align: 'center',
    padding_left: 16,
    padding_right: 16,
    backgroundImage: '',
    backgroundColor: '#ffffff',
    cardCount: 4,
    cardHeight: 400,
    imageHeightPercent: 50,
    cardBorderRadius: 8,
    descriptionLineClamp: 3,
    showPublishedDate: false,
    showImageBorder: false,
    imageBorderWeight: 3,
    imageBorderColor: '#2563eb',
    showCTAButton: true,
    ctaButtonSize: 48,
    ctaButtonBgColor: '#2563eb',
    ctaButtonArrowColor: '#ffffff',
    ctaButtonMargin: 16,
    card_text_align: 'left',
    cards: [
      { contentType: 'news', itemId: '', showLabel: true, labelText: '', labelBgColor: '#2563eb', labelTextColor: '#ffffff' },
      { contentType: 'resources', itemId: '', showLabel: true, labelText: '', labelBgColor: '#2563eb', labelTextColor: '#ffffff' },
      { contentType: 'articles', itemId: '', showLabel: true, labelText: '', labelBgColor: '#2563eb', labelTextColor: '#ffffff' },
      { contentType: 'jobs', itemId: '', showLabel: true, labelText: '', labelBgColor: '#2563eb', labelTextColor: '#ffffff' }
    ]
  };

  // Ensure cards array matches cardCount
  const cardCount = content.cardCount || 4;
  if (!content.cards || content.cards.length !== cardCount) {
    const newCards = [];
    const types = ['news', 'resources', 'articles', 'jobs'];
    for (let i = 0; i < cardCount; i++) {
      newCards.push(content.cards?.[i] || { contentType: types[i] || 'news', itemId: '' });
    }
    content.cards = newCards;
  }

  const updateContent = (key, value) => {
    const newContent = { ...content, [key]: value };
    onChange({ ...element, content: newContent });
  };

  const updateCard = (index, field, value) => {
    const cards = [...content.cards];
    cards[index] = { ...cards[index], [field]: value };
    // Reset itemId when content type changes
    if (field === 'contentType') {
      cards[index].itemId = '';
    }
    updateContent('cards', cards);
  };

  const handleBgImageUpload = async (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
      return;
    }

    setIsUploadingBg(true);

    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      updateContent('backgroundImage', response.file_url);
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setIsUploadingBg(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="headerText">Header Title</Label>
        <Input
          id="headerText"
          value={content.headerText || ''}
          onChange={(e) => updateContent('headerText', e.target.value)}
          placeholder="Section title"
        />
      </div>

      <div>
        <Label htmlFor="descriptionText">Description</Label>
        <Textarea
          id="descriptionText"
          value={content.descriptionText || ''}
          onChange={(e) => updateContent('descriptionText', e.target.value)}
          placeholder="Section description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="heading_font_family">Heading Font</Label>
          <Select
            value={content.heading_font_family || 'Poppins'}
            onValueChange={(value) => updateContent('heading_font_family', value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Poppins">Poppins</SelectItem>
              <SelectItem value="Degular Medium">Degular Medium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="heading_font_size">Heading Size (px)</Label>
          <Input
            id="heading_font_size"
            type="number"
            value={content.heading_font_size || 48}
            onChange={(e) => updateContent('heading_font_size', parseInt(e.target.value) || 48)}
            min="12"
            max="200"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="heading_letter_spacing">Heading Letter Spacing (px)</Label>
        <Input
          id="heading_letter_spacing"
          type="number"
          step="0.5"
          value={content.heading_letter_spacing || 0}
          onChange={(e) => updateContent('heading_letter_spacing', parseFloat(e.target.value) || 0)}
          min="-5"
          max="20"
        />
      </div>

      <div>
        <Label htmlFor="heading_color">Heading Color</Label>
        <div className="flex gap-2">
          <input
            id="heading_color"
            type="color"
            value={content.heading_color || '#0f172a'}
            onChange={(e) => updateContent('heading_color', e.target.value)}
            className="w-16 h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
          />
          <Input
            value={content.heading_color || '#0f172a'}
            onChange={(e) => updateContent('heading_color', e.target.value)}
            placeholder="#0f172a"
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="heading_underline_enabled"
            checked={content.heading_underline_enabled || false}
            onChange={(e) => updateContent('heading_underline_enabled', e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="heading_underline_enabled" className="cursor-pointer">
            Show line below heading
          </Label>
        </div>

        {content.heading_underline_enabled && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="heading_underline_color">Line Color</Label>
                <input
                  id="heading_underline_color"
                  type="color"
                  value={content.heading_underline_color || '#000000'}
                  onChange={(e) => updateContent('heading_underline_color', e.target.value)}
                  className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                />
              </div>
              <div>
                <Label htmlFor="heading_underline_width">Line Width (px)</Label>
                <Input
                  id="heading_underline_width"
                  type="number"
                  value={content.heading_underline_width || 100}
                  onChange={(e) => updateContent('heading_underline_width', parseInt(e.target.value) || 0)}
                  min="10"
                  max="1000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="heading_underline_weight">Line Weight (px)</Label>
                <Input
                  id="heading_underline_weight"
                  type="number"
                  value={content.heading_underline_weight || 2}
                  onChange={(e) => updateContent('heading_underline_weight', parseInt(e.target.value) || 1)}
                  min="1"
                  max="20"
                />
              </div>
              <div>
                <Label htmlFor="heading_underline_spacing">Spacing from Header (px)</Label>
                <Input
                  id="heading_underline_spacing"
                  type="number"
                  value={content.heading_underline_spacing || 16}
                  onChange={(e) => updateContent('heading_underline_spacing', parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="heading_underline_alignment">Line Alignment</Label>
              <Select
                value={content.heading_underline_alignment || 'center'}
                onValueChange={(value) => updateContent('heading_underline_alignment', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="heading_underline_to_content_spacing">Spacing to Content (px)</Label>
              <Input
                id="heading_underline_to_content_spacing"
                type="number"
                value={content.heading_underline_to_content_spacing || 24}
                onChange={(e) => updateContent('heading_underline_to_content_spacing', parseInt(e.target.value) || 0)}
                min="0"
                max="100"
              />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="subheading_font_family">Description Font</Label>
          <Select
            value={content.subheading_font_family || 'Poppins'}
            onValueChange={(value) => updateContent('subheading_font_family', value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Poppins">Poppins</SelectItem>
              <SelectItem value="Degular Medium">Degular Medium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="subheading_font_size">Size (px)</Label>
          <Input
            id="subheading_font_size"
            type="number"
            value={content.subheading_font_size || 20}
            onChange={(e) => updateContent('subheading_font_size', parseInt(e.target.value) || 20)}
            min="12"
            max="100"
          />
        </div>
        <div>
          <Label htmlFor="subheading_line_height">Line Height</Label>
          <Input
            id="subheading_line_height"
            type="number"
            step="0.1"
            value={content.subheading_line_height || 1.5}
            onChange={(e) => updateContent('subheading_line_height', parseFloat(e.target.value) || 1.5)}
            min="1"
            max="3"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description_color">Description Color</Label>
        <div className="flex gap-2">
          <input
            id="description_color"
            type="color"
            value={content.description_color || '#475569'}
            onChange={(e) => updateContent('description_color', e.target.value)}
            className="w-16 h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
          />
          <Input
            value={content.description_color || '#475569'}
            onChange={(e) => updateContent('description_color', e.target.value)}
            placeholder="#475569"
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="text_align">Header Text Alignment</Label>
        <Select
          value={content.text_align || 'center'}
          onValueChange={(value) => updateContent('text_align', value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="card_text_align">Card Text Alignment</Label>
        <Select
          value={content.card_text_align || 'left'}
          onValueChange={(value) => updateContent('card_text_align', value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="padding_left">Left Padding (px)</Label>
          <Input
            id="padding_left"
            type="number"
            value={content.padding_left || 16}
            onChange={(e) => updateContent('padding_left', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="padding_right">Right Padding (px)</Label>
          <Input
            id="padding_right"
            type="number"
            value={content.padding_right || 16}
            onChange={(e) => updateContent('padding_right', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cardCount">Number of Cards</Label>
        <Select
          value={String(content.cardCount || 4)}
          onValueChange={(value) => updateContent('cardCount', parseInt(value))}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Card</SelectItem>
            <SelectItem value="2">2 Cards</SelectItem>
            <SelectItem value="3">3 Cards</SelectItem>
            <SelectItem value="4">4 Cards</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="backgroundColor">Background Color</Label>
        <div className="flex gap-2">
          <input
            id="backgroundColor"
            type="color"
            value={content.backgroundColor || '#ffffff'}
            onChange={(e) => updateContent('backgroundColor', e.target.value)}
            className="w-16 h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
          />
          <Input
            value={content.backgroundColor || '#ffffff'}
            onChange={(e) => updateContent('backgroundColor', e.target.value)}
            placeholder="#ffffff"
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cardHeight">Card Height (px)</Label>
        <Input
          id="cardHeight"
          type="number"
          value={content.cardHeight || 400}
          onChange={(e) => updateContent('cardHeight', parseInt(e.target.value) || 400)}
          min="200"
          max="800"
        />
      </div>

      <div>
        <Label htmlFor="imageHeightPercent">Image Height (% of card)</Label>
        <Input
          id="imageHeightPercent"
          type="number"
          value={content.imageHeightPercent || 50}
          onChange={(e) => updateContent('imageHeightPercent', parseInt(e.target.value) || 50)}
          min="20"
          max="80"
        />
      </div>

      <div>
        <Label htmlFor="cardBorderRadius">Card Border Radius (px)</Label>
        <Input
          id="cardBorderRadius"
          type="number"
          value={content.cardBorderRadius ?? 8}
          onChange={(e) => {
            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
            updateContent('cardBorderRadius', isNaN(val) ? 0 : val);
          }}
          min="0"
          max="50"
        />
      </div>

      <div>
        <Label htmlFor="descriptionLineClamp">Description Lines</Label>
        <Select
          value={String(content.descriptionLineClamp ?? 3)}
          onValueChange={(value) => updateContent('descriptionLineClamp', value === 'none' ? 'none' : parseInt(value))}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Title Only (No Description)</SelectItem>
            <SelectItem value="1">1 Line</SelectItem>
            <SelectItem value="2">2 Lines</SelectItem>
            <SelectItem value="3">3 Lines</SelectItem>
            <SelectItem value="4">4 Lines</SelectItem>
            <SelectItem value="5">5 Lines</SelectItem>
            <SelectItem value="none">No Limit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showPublishedDate"
          checked={content.showPublishedDate || false}
          onChange={(e) => updateContent('showPublishedDate', e.target.checked)}
          className="w-4 h-4"
        />
        <Label htmlFor="showPublishedDate" className="cursor-pointer">
          Show Published Date
        </Label>
      </div>

      <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showImageBorder"
            checked={content.showImageBorder || false}
            onChange={(e) => updateContent('showImageBorder', e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="showImageBorder" className="cursor-pointer">
            Show Line Below Image
          </Label>
        </div>

        {content.showImageBorder && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="imageBorderWeight">Line Weight (px)</Label>
              <Input
                id="imageBorderWeight"
                type="number"
                value={content.imageBorderWeight || 3}
                onChange={(e) => updateContent('imageBorderWeight', parseInt(e.target.value) || 3)}
                min="1"
                max="20"
              />
            </div>
            <div>
              <Label htmlFor="imageBorderColor">Line Color</Label>
              <input
                id="imageBorderColor"
                type="color"
                value={content.imageBorderColor || '#2563eb'}
                onChange={(e) => updateContent('imageBorderColor', e.target.value)}
                className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showCTAButton"
            checked={content.showCTAButton ?? true}
            onChange={(e) => updateContent('showCTAButton', e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="showCTAButton" className="cursor-pointer">
            Show CTA Button
          </Label>
        </div>

        {content.showCTAButton !== false && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ctaButtonSize">Button Size (px)</Label>
                <Input
                  id="ctaButtonSize"
                  type="number"
                  value={content.ctaButtonSize || 48}
                  onChange={(e) => updateContent('ctaButtonSize', parseInt(e.target.value) || 48)}
                  min="24"
                  max="80"
                />
              </div>
              <div>
                <Label htmlFor="ctaButtonMargin">Margin (px)</Label>
                <Input
                  id="ctaButtonMargin"
                  type="number"
                  value={content.ctaButtonMargin ?? 16}
                  onChange={(e) => updateContent('ctaButtonMargin', parseInt(e.target.value) ?? 0)}
                  min="0"
                  max="50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ctaButtonBgColor">Background</Label>
                <input
                  id="ctaButtonBgColor"
                  type="color"
                  value={content.ctaButtonBgColor || '#2563eb'}
                  onChange={(e) => updateContent('ctaButtonBgColor', e.target.value)}
                  className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                />
              </div>
              <div>
                <Label htmlFor="ctaButtonArrowColor">Arrow Color</Label>
                <input
                  id="ctaButtonArrowColor"
                  type="color"
                  value={content.ctaButtonArrowColor || '#ffffff'}
                  onChange={(e) => updateContent('ctaButtonArrowColor', e.target.value)}
                  className="w-full h-10 px-1 py-1 border border-slate-300 rounded-md cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <Label>Card Slots</Label>
        <div className="space-y-4 mt-2">
          {content.cards.map((card, index) => (
            <CardSlotEditor
              key={index}
              index={index}
              card={card}
              onUpdate={updateCard}
            />
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="backgroundImage">Background Image</Label>
        <div className="flex gap-2">
          <Input
            id="backgroundImage"
            value={content.backgroundImage || ''}
            onChange={(e) => updateContent('backgroundImage', e.target.value)}
            placeholder="Background image URL"
            className="flex-1"
          />
          <Label htmlFor="bg-upload" className="cursor-pointer">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              isUploadingBg
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}>
              {isUploadingBg ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </div>
            <input
              id="bg-upload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBgImageUpload(file);
                e.target.value = '';
              }}
              className="hidden"
              disabled={isUploadingBg}
            />
          </Label>
          {content.backgroundImage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateContent('backgroundImage', '')}
              className="text-red-600"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        {content.backgroundImage && (
          <img
            src={content.backgroundImage}
            alt="Background preview"
            className="mt-2 w-full h-32 object-cover rounded"
          />
        )}
      </div>
    </div>
  );
}

export function IEditShowcaseElementRenderer({ element, settings }) {
  const content = element.content || {
    headerText: '',
    descriptionText: '',
    heading_font_family: 'Poppins',
    heading_font_size: 48,
    heading_letter_spacing: 0,
    heading_color: '#0f172a',
    heading_underline_enabled: false,
    heading_underline_color: '#000000',
    heading_underline_width: 100,
    heading_underline_weight: 2,
    heading_underline_spacing: 16,
    heading_underline_to_content_spacing: 24,
    heading_underline_alignment: 'center',
    subheading_font_family: 'Poppins',
    subheading_font_size: 20,
    subheading_line_height: 1.5,
    description_color: '#475569',
    text_align: 'center',
    padding_left: 16,
    padding_right: 16,
    backgroundImage: '',
    backgroundColor: '#ffffff',
    cardCount: 4,
    cardHeight: 400,
    imageHeightPercent: 50,
    cardBorderRadius: 8,
    descriptionLineClamp: 3,
    showPublishedDate: false,
    showImageBorder: false,
    imageBorderWeight: 3,
    imageBorderColor: '#2563eb',
    showCTAButton: true,
    ctaButtonSize: 48,
    ctaButtonBgColor: '#2563eb',
    ctaButtonArrowColor: '#ffffff',
    ctaButtonMargin: 16,
    card_text_align: 'left',
    cards: []
  };

  const fullWidth = settings?.fullWidth;

  // Fetch article display name setting
  const { data: articleDisplayName = 'Articles' } = useQuery({
    queryKey: ['article-display-name'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      const setting = allSettings.find(s => s.setting_key === 'article_display_name');
      return setting?.setting_value || 'Articles';
    }
  });

  // Fetch all items for selected cards
  const { data: allNews = [] } = useQuery({
    queryKey: ['showcase-news'],
    queryFn: async () => {
      const news = await base44.entities.NewsPost.list();
      return news.filter(n => n.status === 'published');
    },
    enabled: content.cards?.some(c => c.contentType === 'news' && c.itemId)
  });

  const { data: allResources = [] } = useQuery({
    queryKey: ['showcase-resources'],
    queryFn: () => base44.entities.Resource.list(),
    enabled: content.cards?.some(c => c.contentType === 'resources' && c.itemId)
  });

  const { data: allArticles = [] } = useQuery({
    queryKey: ['showcase-articles'],
    queryFn: async () => {
      const articles = await base44.entities.BlogPost.list();
      return articles.filter(a => a.status === 'published');
    },
    enabled: content.cards?.some(c => c.contentType === 'articles' && c.itemId)
  });

  const { data: allJobs = [] } = useQuery({
    queryKey: ['showcase-jobs'],
    queryFn: async () => {
      const jobs = await base44.entities.JobPosting.list();
      return jobs.filter(j => j.status === 'active');
    },
    enabled: content.cards?.some(c => c.contentType === 'jobs' && c.itemId)
  });

  // Build items array from selected cards with metadata
  const items = React.useMemo(() => {
    if (!content.cards) return [];

    return content.cards
      .map(card => {
        if (!card.itemId) return null;
        
        let item;
        switch (card.contentType) {
          case 'news':
            item = allNews.find(n => n.id === card.itemId);
            break;
          case 'resources':
            item = allResources.find(r => r.id === card.itemId);
            break;
          case 'articles':
            item = allArticles.find(a => a.id === card.itemId);
            break;
          case 'jobs':
            item = allJobs.find(j => j.id === card.itemId);
            break;
        }
        return item ? { ...item, _contentType: card.contentType, _cardConfig: card } : null;
      })
      .filter(Boolean);
  }, [content.cards, allNews, allResources, allArticles, allJobs]);

  const getItemUrl = (item) => {
    switch (item._contentType) {
      case 'news':
        return createPageUrl(`NewsView?id=${item.id}`);
      case 'resources':
        return item.download_url || item.content_url || '#';
      case 'articles':
        return createPageUrl(`ArticleView?slug=${item.slug}`);
      case 'jobs':
        return createPageUrl(`JobDetails?id=${item.id}`);
      default:
        return '#';
    }
  };

  const getContentTypeLabel = (contentType) => {
    switch (contentType) {
      case 'news': return 'News';
      case 'resources': return 'Resource';
      case 'articles': return articleDisplayName?.slice(0, -1) || 'Article';
      case 'jobs': return 'Job';
      default: return '';
    }
  };

  const getContentTypeBadgeColor = (contentType) => {
    switch (contentType) {
      case 'news': return 'bg-blue-600 text-white';
      case 'resources': return 'bg-purple-600 text-white';
      case 'articles': return 'bg-green-600 text-white';
      case 'jobs': return 'bg-amber-600 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  const sectionStyle = content.backgroundImage ? {
    backgroundImage: `url(${content.backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : {
    backgroundColor: content.backgroundColor || '#ffffff'
  };

  const backgroundWrapperClass = fullWidth ? 'w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]' : 'w-full';

  const containerStyle = {
    paddingLeft: `${content.padding_left || 16}px`,
    paddingRight: `${content.padding_right || 16}px`,
    textAlign: content.text_align || 'center'
  };

  return (
    <div className={`${backgroundWrapperClass} py-16 relative`} style={sectionStyle}>
      <div className="max-w-7xl mx-auto px-4 relative z-10" style={containerStyle}>
        {(content.headerText || content.descriptionText) && (
          <div style={{ marginBottom: '48px' }}>
            {content.headerText && (
              <div>
                <h2 
                  style={{ 
                    fontWeight: 'bold', 
                    fontFamily: content.heading_font_family || 'Poppins',
                    fontSize: `${content.heading_font_size || 48}px`,
                    letterSpacing: `${content.heading_letter_spacing || 0}px`,
                    marginBottom: content.heading_underline_enabled ? `${content.heading_underline_spacing || 16}px` : '24px',
                    color: content.heading_color || '#0f172a'
                  }}
                >
                  {content.headerText}
                </h2>
                {content.heading_underline_enabled && (
                  <div 
                    style={{
                      width: `${content.heading_underline_width || 100}px`,
                      height: `${content.heading_underline_weight || 2}px`,
                      backgroundColor: content.heading_underline_color || '#000000',
                      marginLeft: (content.heading_underline_alignment || 'center') === 'center' ? 'auto' : (content.heading_underline_alignment || 'center') === 'right' ? 'auto' : '0',
                      marginRight: (content.heading_underline_alignment || 'center') === 'center' ? 'auto' : '0',
                      marginBottom: `${content.heading_underline_to_content_spacing || 24}px`,
                      display: 'block'
                    }}
                  />
                )}
              </div>
            )}
            {content.descriptionText && (
              <p 
                style={{ 
                  fontFamily: content.subheading_font_family || 'Poppins',
                  fontSize: `${content.subheading_font_size || 20}px`,
                  lineHeight: content.subheading_line_height || 1.5,
                  maxWidth: '48rem',
                  margin: '0 auto',
                  color: content.description_color || '#475569'
                }}
              >
                {content.descriptionText}
              </p>
            )}
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12 bg-white/90 rounded-lg">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500">No items selected</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${content.cardCount >= 2 ? 'md:grid-cols-2' : ''} ${content.cardCount >= 4 ? 'lg:grid-cols-4' : content.cardCount === 3 ? 'lg:grid-cols-3' : ''} gap-6`}>
            {items.map((item) => {
              const isExternalLink = item._contentType === 'resources' && (item.download_url || item.content_url);
              const url = getItemUrl(item);

              const imageHeight = Math.round((content.cardHeight || 400) * ((content.imageHeightPercent || 50) / 100));
              const buttonSize = content.ctaButtonSize || 48;
              const buttonMargin = content.ctaButtonMargin ?? 0;

              const cardContent = (
                <>
                  <div className="relative" style={{ height: `${imageHeight}px` }}>
                    {(item.image_url || item.feature_image_url) && (
                      <img
                        src={item.image_url || item.feature_image_url}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {item._cardConfig?.showLabel !== false && (
                      <Badge 
                        className="absolute top-0 left-0 text-xs font-semibold rounded-none px-3 py-1"
                        style={{
                          backgroundColor: item._cardConfig?.labelBgColor || '#2563eb',
                          color: item._cardConfig?.labelTextColor || '#ffffff'
                        }}
                      >
                        {item._cardConfig?.labelText || getContentTypeLabel(item._contentType)}
                      </Badge>
                    )}
                  </div>
                  {content.showImageBorder && (
                    <div 
                      style={{
                        height: `${content.imageBorderWeight || 3}px`,
                        backgroundColor: content.imageBorderColor || '#2563eb'
                      }}
                    />
                  )}
                  <div className="p-4 flex-1 overflow-hidden relative" style={{ textAlign: content.card_text_align || 'left' }}>
                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                      {item.title || item.name}
                    </h3>
                    {content.descriptionLineClamp !== 0 && (item.summary || item.description) && (
                      <p className={`text-sm text-slate-600 ${content.descriptionLineClamp === 'none' ? '' : `line-clamp-${content.descriptionLineClamp ?? 3}`}`}>
                        {item.summary || item.description}
                      </p>
                    )}
                    {content.showPublishedDate && item.published_date && (
                      <div className="flex items-center gap-1 mt-3 text-xs text-slate-500" style={{ justifyContent: content.card_text_align === 'center' ? 'center' : content.card_text_align === 'right' ? 'flex-end' : 'flex-start' }}>
                        <Calendar className="w-3 h-3" />
                        {new Date(item.published_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                    {content.showCTAButton !== false && (
                      <div 
                        className="absolute flex items-center justify-center transition-transform hover:scale-110"
                        style={{
                          width: `${buttonSize}px`,
                          height: `${buttonSize}px`,
                          backgroundColor: content.ctaButtonBgColor || '#2563eb',
                          borderRadius: `${content.cardBorderRadius ?? 8}px`,
                          bottom: `${buttonMargin}px`,
                          right: `${buttonMargin}px`
                        }}
                      >
                        <ArrowUpRight 
                          style={{ 
                            width: `${buttonSize * 0.5}px`, 
                            height: `${buttonSize * 0.5}px`,
                            color: content.ctaButtonArrowColor || '#ffffff'
                          }} 
                        />
                      </div>
                    )}
                  </div>
                </>
              );

              return isExternalLink ? (
                <a
                  key={item.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white shadow-xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 block flex flex-col"
                  style={{ 
                    height: `${content.cardHeight || 400}px`,
                    borderRadius: `${content.cardBorderRadius ?? 8}px`
                  }}
                >
                  {cardContent}
                </a>
              ) : (
                <Link
                  key={item.id}
                  to={url}
                  className="bg-white shadow-xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 block flex flex-col"
                  style={{ 
                    height: `${content.cardHeight || 400}px`,
                    borderRadius: `${content.cardBorderRadius ?? 8}px`
                  }}
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}