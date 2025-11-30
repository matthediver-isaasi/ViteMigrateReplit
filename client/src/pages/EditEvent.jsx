import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Calendar, 
  MapPin, 
  ArrowLeft,
  Save,
  Loader2,
  Video,
  Globe
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import EventImageUpload from "@/components/events/EventImageUpload";

export default function EditEvent() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    program_tag: "",
    start_date: "",
    end_date: "",
    location: "",
    image_url: "",
    available_seats: ""
  });

  const { data: event, isLoading: loadingEvent, error: eventError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => base44.entities.Event.get(eventId),
    enabled: !!eventId
  });

  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ['/api/entities/Program'],
    queryFn: () => base44.entities.Program.list()
  });

  const updateEventMutation = useMutation({
    mutationFn: async (eventData) => {
      return base44.entities.Event.update(eventId, eventData);
    },
    onSuccess: () => {
      toast.success('Event updated successfully');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setTimeout(() => {
        window.location.href = createPageUrl('Events');
      }, 500);
    },
    onError: (error) => {
      console.error('Update event error:', error);
      const errorMessage = error.message || error.error || 'Unknown error occurred';
      toast.error('Failed to update event: ' + errorMessage);
    }
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        program_tag: event.program_tag || "",
        start_date: event.start_date || "",
        end_date: event.end_date || "",
        location: event.location || "",
        image_url: event.image_url || "",
        available_seats: event.available_seats !== null && event.available_seats !== undefined 
          ? String(event.available_seats) 
          : ""
      });
    }
  }, [event]);

  const isOnlineEvent = formData.location?.toLowerCase().includes('online') || 
                        formData.location?.includes('zoom.us') ||
                        formData.location?.includes('https://');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.program_tag) {
      toast.error('Please select a program');
      return;
    }
    
    if (!formData.start_date) {
      toast.error('Please set a start date');
      return;
    }

    if (!formData.title) {
      toast.error('Please enter an event title');
      return;
    }

    const parsedSeats = formData.available_seats ? parseInt(formData.available_seats, 10) : null;
    const eventData = {
      title: formData.title,
      description: formData.description || null,
      program_tag: formData.program_tag,
      start_date: formData.start_date,
      end_date: formData.end_date || formData.start_date,
      location: formData.location || null,
      image_url: formData.image_url || null,
      available_seats: isNaN(parsedSeats) ? null : parsedSeats
    };

    updateEventMutation.mutate(eventData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "yyyy-MM-dd'T'HH:mm");
    } catch {
      return "";
    }
  };

  const renderContent = () => {
    if (!eventId) {
      return (
        <div className="max-w-3xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Event Not Found</h1>
          <p className="text-slate-600 mb-6">No event ID was provided.</p>
          <Button onClick={() => window.location.href = createPageUrl('Events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      );
    }

    if (loadingEvent) {
      return (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading event...</span>
          </div>
        </div>
      );
    }

    if (eventError || !event) {
      return (
        <div className="max-w-3xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Event Not Found</h1>
          <p className="text-slate-600 mb-6">The event you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => window.location.href = createPageUrl('Events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => window.location.href = createPageUrl('Events')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Edit Event</h1>
              {isOnlineEvent && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                  <Video className="w-3 h-3 mr-1" />
                  Online Event
                </Badge>
              )}
            </div>
            <p className="text-slate-600">Update event details</p>
          </div>
        </div>

        {isOnlineEvent && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Online Event</span>
            </div>
            <p className="text-sm text-blue-800">
              This is an online event linked to a Zoom webinar. The date, time, and location fields are managed by Zoom and cannot be edited here.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="border-slate-200 shadow-sm mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="program">Program *</Label>
                <Select
                  value={formData.program_tag}
                  onValueChange={(value) => handleInputChange('program_tag', value)}
                  disabled={loadingPrograms}
                  data-testid="select-program"
                >
                  <SelectTrigger data-testid="select-program-trigger">
                    <SelectValue placeholder={loadingPrograms ? "Loading programs..." : "Select a program"} />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem 
                        key={program.id} 
                        value={program.tag || program.name}
                        data-testid={`select-program-${program.id}`}
                      >
                        {program.name || program.tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  The program determines ticket types that can be used for this event
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter event title"
                  required
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the event..."
                  rows={4}
                  data-testid="input-description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date & Time *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formatDateForInput(formData.start_date)}
                    onChange={(e) => handleInputChange('start_date', new Date(e.target.value).toISOString())}
                    required
                    disabled={isOnlineEvent}
                    className={isOnlineEvent ? "bg-slate-100 cursor-not-allowed" : ""}
                    data-testid="input-start-date"
                  />
                  {isOnlineEvent && (
                    <p className="text-xs text-slate-500">Managed by Zoom webinar</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date & Time</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formatDateForInput(formData.end_date)}
                    onChange={(e) => handleInputChange('end_date', new Date(e.target.value).toISOString())}
                    disabled={isOnlineEvent}
                    className={isOnlineEvent ? "bg-slate-100 cursor-not-allowed" : ""}
                    data-testid="input-end-date"
                  />
                  {isOnlineEvent && (
                    <p className="text-xs text-slate-500">Managed by Zoom webinar</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Location & Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Venue / Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter venue address or location name"
                  disabled={isOnlineEvent}
                  className={isOnlineEvent ? "bg-slate-100 cursor-not-allowed" : ""}
                  data-testid="input-location"
                />
                {isOnlineEvent && (
                  <p className="text-xs text-slate-500">
                    Online event - location is managed by Zoom webinar
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="available_seats">Available Seats</Label>
                <Input
                  id="available_seats"
                  type="number"
                  min="0"
                  value={formData.available_seats}
                  onChange={(e) => handleInputChange('available_seats', e.target.value)}
                  placeholder="Leave empty for unlimited"
                  disabled={isOnlineEvent}
                  className={isOnlineEvent ? "bg-slate-100 cursor-not-allowed" : ""}
                  data-testid="input-seats"
                />
                <p className="text-xs text-slate-500">
                  {isOnlineEvent 
                    ? "Online events have unlimited capacity" 
                    : "Leave empty for unlimited capacity"}
                </p>
              </div>

              <EventImageUpload
                value={formData.image_url}
                onChange={(url) => handleInputChange('image_url', url)}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.href = createPageUrl('Events')}
              disabled={updateEventMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateEventMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-save-event"
            >
              {updateEventMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      {renderContent()}
    </div>
  );
}
