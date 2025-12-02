import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Calendar, 
  MapPin, 
  Video, 
  Building, 
  Tag,
  ArrowLeft,
  Save,
  Loader2,
  Globe,
  Link as LinkIcon
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import EventImageUpload from "@/components/events/EventImageUpload";

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export default function CreateEvent() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(false);
  const [isProgramEvent, setIsProgramEvent] = useState(true);
  const [selectedWebinarId, setSelectedWebinarId] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    program_tag: "",
    start_date: "",
    end_date: "",
    location: "",
    image_url: "",
    available_seats: "",
    delivery_mode: "offline",
    zoom_webinar_id: null,
    online_url: ""
  });

  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ['/api/entities/Program'],
    queryFn: () => base44.entities.Program.list()
  });

  const { data: webinars = [], isLoading: loadingWebinars } = useQuery({
    queryKey: ['/api/zoom/webinars'],
    queryFn: async () => {
      const data = await apiRequest('/api/zoom/webinars');
      return data.filter(w => w.status === 'scheduled' && new Date(w.start_time) > new Date());
    },
    enabled: isOnline
  });

  // Query for webinar show join link settings
  const { data: joinLinkSettings, isLoading: loadingJoinLinkSettings } = useQuery({
    queryKey: ['webinar-join-link-settings'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      const setting = allSettings.find(s => s.setting_key === 'webinar_show_join_link');
      if (setting && setting.setting_value) {
        try {
          return JSON.parse(setting.setting_value);
        } catch {
          return {};
        }
      }
      return {};
    },
    enabled: isOnline
  });

  // Get show join link status for a webinar
  const getShowJoinLink = (webinarId) => {
    if (!joinLinkSettings || !webinarId) return false;
    return joinLinkSettings[webinarId] === true;
  };

  const selectedWebinar = webinars.find(w => w.id === selectedWebinarId);

  useEffect(() => {
    if (selectedWebinar) {
      const startTime = new Date(selectedWebinar.start_time);
      const endTime = new Date(startTime.getTime() + (selectedWebinar.duration || 60) * 60000);
      
      setFormData(prev => ({
        ...prev,
        title: selectedWebinar.topic || prev.title,
        description: selectedWebinar.agenda || prev.description,
        start_date: startTime.toISOString(),
        end_date: endTime.toISOString(),
        zoom_webinar_id: selectedWebinar.id,
        online_url: selectedWebinar.join_url || "",
        delivery_mode: "online",
        location: "Online Event",
        available_seats: 0
      }));
    }
  }, [selectedWebinar]);

  const createEventMutation = useMutation({
    mutationFn: async (eventData) => {
      return base44.entities.Event.create(eventData);
    },
    onSuccess: () => {
      toast.success('Event created successfully');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setTimeout(() => {
        window.location.href = createPageUrl('Events');
      }, 500);
    },
    onError: (error) => {
      console.error('Create event error:', error);
      const errorMessage = error.message || error.error || 'Unknown error occurred';
      toast.error('Failed to create event: ' + errorMessage);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isProgramEvent && !formData.program_tag) {
      toast.error('Please select a program');
      return;
    }
    
    if (!formData.start_date) {
      toast.error('Please set a start date');
      return;
    }
    
    if (isOnline && !selectedWebinarId) {
      toast.error('Please select a Zoom webinar for online events');
      return;
    }

    if (isOnline && loadingJoinLinkSettings) {
      toast.error('Please wait for settings to load');
      return;
    }

    if (!formData.title) {
      toast.error('Please enter an event title');
      return;
    }

    // Build event data - only include fields that exist in the event table
    // For online events: store URL in location only if show join link setting is enabled
    let locationValue = formData.location;
    if (isOnline) {
      const showJoinLink = getShowJoinLink(selectedWebinarId);
      if (showJoinLink && formData.online_url) {
        locationValue = `Online - ${formData.online_url}`;
      } else {
        locationValue = 'Online Event';
      }
    }

    const eventData = {
      title: formData.title,
      description: formData.description || null,
      program_tag: isProgramEvent ? formData.program_tag : "",
      start_date: formData.start_date,
      end_date: formData.end_date || formData.start_date,
      location: locationValue,
      image_url: formData.image_url || null,
      available_seats: isOnline ? null : (formData.available_seats ? parseInt(formData.available_seats) : null),
      zoom_webinar_id: isOnline && selectedWebinarId ? selectedWebinarId : null
    };

    createEventMutation.mutate(eventData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDeliveryModeChange = (online) => {
    setIsOnline(online);
    if (!online) {
      setSelectedWebinarId("");
      setFormData(prev => ({
        ...prev,
        delivery_mode: "offline",
        zoom_webinar_id: null,
        online_url: "",
        available_seats: prev.available_seats || ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        delivery_mode: "online",
        available_seats: 0
      }));
    }
  };

  const formatWebinarDateTime = (webinar) => {
    if (!webinar.start_time) return '';
    const date = new Date(webinar.start_time);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
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
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create Event</h1>
            <p className="text-slate-600">Set up a new event for your members</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-slate-200 shadow-sm mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-600" />
                Event Type
              </CardTitle>
              <CardDescription>Choose whether this is an online or in-person event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {isOnline ? (
                    <Video className="h-5 w-5 text-green-600" />
                  ) : (
                    <Building className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <p className="font-medium text-slate-900">
                      {isOnline ? 'Online Event' : 'In-Person Event'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {isOnline 
                        ? 'Event will be hosted via Zoom webinar'
                        : 'Event will be held at a physical location'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isOnline}
                  onCheckedChange={handleDeliveryModeChange}
                  data-testid="switch-delivery-mode"
                />
              </div>

              {isOnline && (
                <div className="space-y-3">
                  <Label>Select Zoom Webinar</Label>
                  <Select
                    value={selectedWebinarId}
                    onValueChange={setSelectedWebinarId}
                    disabled={loadingWebinars}
                    data-testid="select-webinar"
                  >
                    <SelectTrigger data-testid="select-webinar-trigger">
                      <SelectValue placeholder={loadingWebinars ? "Loading webinars..." : "Choose a scheduled webinar"} />
                    </SelectTrigger>
                    <SelectContent>
                      {webinars.length === 0 && !loadingWebinars && (
                        <div className="p-4 text-center text-sm text-slate-500">
                          No upcoming webinars available.
                          <Button 
                            variant="link" 
                            className="p-0 h-auto ml-1"
                            onClick={() => window.location.href = createPageUrl('ZoomWebinarProvisioning')}
                          >
                            Create one first
                          </Button>
                        </div>
                      )}
                      {webinars.map((webinar) => (
                        <SelectItem key={webinar.id} value={webinar.id} data-testid={`select-webinar-${webinar.id}`}>
                          <div className="flex flex-col">
                            <span className="font-medium">{webinar.topic}</span>
                            <span className="text-xs text-slate-500">{formatWebinarDateTime(webinar)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedWebinar && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-900">Webinar Selected</span>
                      </div>
                      <div className="space-y-1 text-sm text-green-800">
                        <p><strong>Topic:</strong> {selectedWebinar.topic}</p>
                        <p><strong>Date:</strong> {formatWebinarDateTime(selectedWebinar)}</p>
                        <p><strong>Duration:</strong> {selectedWebinar.duration} minutes</p>
                        {selectedWebinar.timezone && (
                          <p><strong>Timezone:</strong> {selectedWebinar.timezone}</p>
                        )}
                        <div className="mt-2 pt-2 border-t border-green-300">
                          <p className="flex items-center gap-2">
                            <strong>Join Link:</strong>
                            {loadingJoinLinkSettings ? (
                              <span className="text-slate-500">Loading settings...</span>
                            ) : getShowJoinLink(selectedWebinarId) ? (
                              <span className="text-green-700">Will be visible on event page</span>
                            ) : (
                              <span className="text-amber-700">Hidden - members must register via ticket purchase</span>
                            )}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Change this setting in Zoom Webinar Provisioning
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Program vs One-off Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="program-toggle" className="text-base font-medium">
                    {isProgramEvent ? "Program Event" : "One-off Event"}
                  </Label>
                  <p className="text-sm text-slate-500">
                    {isProgramEvent 
                      ? "Event is part of a program - requires program tickets to attend" 
                      : "Standalone event - not linked to any program"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${!isProgramEvent ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                    One-off
                  </span>
                  <Switch
                    id="program-toggle"
                    checked={isProgramEvent}
                    onCheckedChange={(checked) => {
                      setIsProgramEvent(checked);
                      if (!checked) {
                        handleInputChange('program_tag', '');
                      }
                    }}
                    data-testid="switch-program-toggle"
                  />
                  <span className={`text-sm ${isProgramEvent ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                    Program
                  </span>
                </div>
              </div>

              {/* Program Selection - Only shown when isProgramEvent is true */}
              {isProgramEvent && (
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
                          value={program.program_tag || program.name}
                          data-testid={`select-program-${program.id}`}
                        >
                          {program.name || program.program_tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    The program determines ticket types that can be used for this event
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter event title"
                  required
                  readOnly={isOnline && selectedWebinar}
                  className={isOnline && selectedWebinar ? "bg-slate-100" : ""}
                  data-testid="input-title"
                />
                {isOnline && selectedWebinar && (
                  <p className="text-xs text-slate-500">Title is synced from the Zoom webinar</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the event..."
                  rows={4}
                  readOnly={isOnline && selectedWebinar}
                  className={isOnline && selectedWebinar ? "bg-slate-100" : ""}
                  data-testid="input-description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date & Time *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date ? format(new Date(formData.start_date), "yyyy-MM-dd'T'HH:mm") : ""}
                    onChange={(e) => handleInputChange('start_date', new Date(e.target.value).toISOString())}
                    required
                    readOnly={isOnline && selectedWebinar}
                    className={isOnline && selectedWebinar ? "bg-slate-100" : ""}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date & Time</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date ? format(new Date(formData.end_date), "yyyy-MM-dd'T'HH:mm") : ""}
                    onChange={(e) => handleInputChange('end_date', new Date(e.target.value).toISOString())}
                    readOnly={isOnline && selectedWebinar}
                    className={isOnline && selectedWebinar ? "bg-slate-100" : ""}
                    data-testid="input-end-date"
                  />
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
              {isOnline ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Online Event</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      Participants will join via Zoom. The join link will be provided upon registration.
                    </p>
                  </div>
                  {formData.online_url && (
                    <div className="space-y-2">
                      <Label>Zoom Join URL</Label>
                      <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg">
                        <LinkIcon className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-slate-600 truncate">{formData.online_url}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="location">Venue / Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Enter venue address or location name"
                      required={!isOnline}
                      data-testid="input-location"
                    />
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
                      data-testid="input-seats"
                    />
                    <p className="text-xs text-slate-500">
                      Leave empty or set to 0 for unlimited capacity
                    </p>
                  </div>
                </>
              )}

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
              disabled={createEventMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEventMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-create-event"
            >
              {createEventMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Event
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
