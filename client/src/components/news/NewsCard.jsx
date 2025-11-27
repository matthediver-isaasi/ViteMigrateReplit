// NewsCard component for displaying news articles with optional edit/delete actions
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowUpRight, Download, ExternalLink, PlayCircle, Eye, FileText, Mail, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import AGCASButton from "../ui/AGCASButton";
import AGCASSquareButton from "../ui/AGCASSquareButton";

const iconMap = {
  ArrowUpRight,
  Download,
  ExternalLink,
  PlayCircle,
  Eye,
  FileText,
  Mail,
  Plus,
};

export default function NewsCard({ 
  article, 
  buttonStyles = [], 
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false
}) {
  const buttonStyle = buttonStyles.find(s => s.card_type === 'article') || null;
  const articleUrl = `${createPageUrl('NewsView')}?slug=${article.slug}`;

  const ActionButtons = () => {
    if (!canEdit && !canDelete) return null;
    
    return (
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {canEdit && (
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit?.(article);
            }}
            data-testid={`button-edit-news-${article.id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {canDelete && (
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/90 hover:bg-red-100 text-red-600 shadow-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete?.(article);
            }}
            data-testid={`button-delete-news-${article.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  const renderButton = () => {
    if (!buttonStyle) {
      return (
        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
          <Link to={articleUrl}>
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Read Article
          </Link>
        </Button>
      );
    }

    let buttonText = buttonStyle.button_text || 'Read Article';
    if (buttonText.includes('Article')) {
      buttonText = buttonText.replace('Article', 'Article');
    }
    const buttonType = buttonStyle.button_type;
    const IconComponent = buttonStyle.icon_name && iconMap[buttonStyle.icon_name];

    if (buttonType === "square_agcas") {
      return (
        <Link to={articleUrl}>
          <AGCASSquareButton />
        </Link>
      );
    } else if (buttonType === "rectangular_agcas") {
      return (
        <Link to={articleUrl}>
          <AGCASButton 
            icon={buttonStyle.icon_name !== 'none' ? IconComponent : undefined}
            className="w-full"
          >
            {buttonText}
          </AGCASButton>
        </Link>
      );
    } else {
      return (
        <Button 
          asChild
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Link to={articleUrl}>
            {IconComponent && buttonStyle.icon_name !== 'none' && <IconComponent className="w-4 h-4 mr-2" />}
            {buttonText}
          </Link>
        </Button>
      );
    }
  };

  return (
    <Card 
      className="border-slate-200 hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full flex flex-col relative"
      data-testid={`card-news-${article.id}`}
    >
      {article.feature_image_url ? (
        <>
          <div className="h-48 overflow-hidden bg-slate-100 relative">
            <img 
              src={article.feature_image_url} 
              alt={article.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <ActionButtons />
          </div>
          <div className="w-full h-[3px]" style={{ backgroundColor: '#5d0d77' }}></div>
        </>
      ) : (
        <ActionButtons />
      )}
      
      <CardHeader className="pb-3 flex-grow">
        <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
        
        {article.published_date && (
          <div className="flex items-center gap-1 text-xs text-slate-500 py-2">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(article.published_date), 'MMM d, yyyy')}</span>
          </div>
        )}
        
        {article.author_name && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 pb-3">
            <User className="w-3 h-3" />
            <span>by {article.author_name}</span>
          </div>
        )}
        
        {article.summary && (
          <p className="text-sm text-slate-600 line-clamp-3">
            {article.summary}
          </p>
        )}

        {article.subcategories && article.subcategories.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-4">
            {article.subcategories.slice(0, 3).map((sub, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {sub}
              </Badge>
            ))}
            {article.subcategories.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{article.subcategories.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 pb-4 mt-auto">
        {renderButton()}
      </CardContent>
    </Card>
  );
}
