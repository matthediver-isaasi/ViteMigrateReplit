import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  ArrowLeft,
  Save,
  Loader2,
  Video,
  Globe,
  PoundSterling,
  Plus,
  Trash2,
  Users,
  Ticket,
  ChevronDown,
  ChevronUp,
  Check,
  Mic
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import EventImageUpload from "@/components/events/EventImageUpload";
import { SpeakerSelectionModal } from "@/components/SpeakerSelectionModal";

// Helper function to create a new ticket class with unique ID
// visibility_mode options:
// - 'members_only': Only visible to logged-in members (respects role_ids if set)
// - 'members_and_public': Visible to both members and public (non-logged-in) users
// - 'public_only': Only visible to public (non-logged-in) users, hidden from members
const createEmptyTicketClass = (isDefault = false) => ({
  id: `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  name: isDefault ? "Standard Ticket" : "",
  price: "",
  is_free: false, // When true, ticket is free (price = 0)
  role_ids: [],
  is_default: isDefault,
  visibility_mode: 'members_only', // 'members_only', 'members_and_public', or 'public_only'
  role_match_only: false, // When true AND visibility includes members, ticket only shows if user's role matches role_ids
  offer_type: "none",
  bogo_logic_type: "buy_x_get_y_free",
  bogo_buy_quantity: "",
  bogo_get_free_quantity: "",
  bulk_discount_threshold: "",
  bulk_discount_percentage: ""
});

export default function EditEvent() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  // Program vs One-off toggle
  const [isProgramEvent, setIsProgramEvent] = useState(true);

  // Ticket classes state for one-off events
  const [ticketClasses, setTicketClasses] = useState([createEmptyTicketClass(true)]);
  const [expandedTickets, setExpandedTickets] = useState({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    internal_reference: "",
    program_tag: "",
    start_date: "",
    end_date: "",
    location: "",
    image_url: "",
    available_seats: "",
    zoom_webinar_id: null
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

  // Fetch roles for ticket class assignment
  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['/api/entities/Role'],
    queryFn: () => base44.entities.Role.list({ sort: { name: 'asc' } })
  });

  // Fetch speakers for event assignment
  const { data: speakers = [], isLoading: loadingSpeakers } = useQuery({
    queryKey: ['/api/entities/Speaker'],
    queryFn: () => base44.entities.Speaker.list({ filter: { is_active: true }, sort: { full_name: 'asc' } })
  });

  // Selected speakers state
  const [selectedSpeakers, setSelectedSpeakers] = useState([]);
  const [speakerModalOpen, setSpeakerModalOpen] = useState(false);

  // Speaker toggle function
  const toggleSpeaker = (speakerId) => {
    setSelectedSpeakers(prev => 
      prev.includes(speakerId)
        ? prev.filter(id => id !== speakerId)
        : [...prev, speakerId]
    );
  };

  // Get speaker names for display
  const getSpeakerNames = (speakerIds) => {
    if (!speakerIds || speakerIds.length === 0) return "No speakers selected";
    return speakerIds
      .map(id => speakers.find(s => s.id === id)?.full_name || 'Unknown')
      .join(', ');
  };

  // Ticket class management functions
  const addTicketClass = () => {
    const newTicket = createEmptyTicketClass(false);
    setTicketClasses([...ticketClasses, newTicket]);
    setExpandedTickets({ ...expandedTickets, [newTicket.id]: true });
  };

  const removeTicketClass = (ticketId) => {
    if (ticketClasses.length === 1) {
      toast.error('You must have at least one ticket class');
      return;
    }
    setTicketClasses(ticketClasses.filter(t => t.id !== ticketId));
  };

  const updateTicketClass = (ticketId, field, value) => {
    setTicketClasses(prev => prev.map(t => 
      t.id === ticketId ? { ...t, [field]: value } : t
    ));
  };

  const setTicketFree = (ticketId, isFree) => {
    setTicketClasses(prev => prev.map(t => 
      t.id === ticketId ? { ...t, is_free: isFree, price: isFree ? '0' : t.price } : t
    ));
  };

  const toggleRoleForTicket = (ticketId, roleId) => {
    setTicketClasses(ticketClasses.map(t => {
      if (t.id !== ticketId) return t;
      const currentRoles = t.role_ids || [];
      const newRoles = currentRoles.includes(roleId)
        ? currentRoles.filter(id => id !== roleId)
        : [...currentRoles, roleId];
      return { ...t, role_ids: newRoles };
    }));
  };

  const toggleExpandTicket = (ticketId) => {
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  const getRoleNames = (roleIds) => {
    if (!roleIds || roleIds.length === 0) return "All Roles";
    return roleIds
      .map(id => roles.find(r => r.id === id)?.name || 'Unknown')
      .join(', ');
  };

  // Query for webinar show join link settings (for online events)
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
    }
  });

  // Check if location has visible join link (starts with "Online - https")
  const hasVisibleJoinLink = formData.location?.startsWith('Online - ');
  
  // Extract the URL from location if it's an online event with visible join link
  const getJoinUrlFromLocation = () => {
    if (hasVisibleJoinLink) {
      return formData.location.replace('Online - ', '');
    }
    return null;
  };

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
        internal_reference: event.internal_reference || "",
        program_tag: event.program_tag || "",
        start_date: event.start_date || "",
        end_date: event.end_date || "",
        location: event.location || "",
        image_url: event.image_url || "",
        available_seats: event.available_seats !== null && event.available_seats !== undefined 
          ? String(event.available_seats) 
          : "",
        zoom_webinar_id: event.zoom_webinar_id || null
      });

      // Set isProgramEvent based on whether event has a program_tag
      const hasProgram = event.program_tag && event.program_tag !== "";
      setIsProgramEvent(hasProgram);

      // Load pricing config for one-off events
      if (event.pricing_config) {
        const config = event.pricing_config;
        
        // Check if using new ticket_classes format or legacy single-price format
        if (config.ticket_classes && Array.isArray(config.ticket_classes) && config.ticket_classes.length > 0) {
          // New ticket classes format
          const loadedTickets = config.ticket_classes.map(tc => {
            const priceValue = tc.price !== null && tc.price !== undefined ? Number(tc.price) : null;
            // Handle backwards compatibility: convert is_public to visibility_mode
            let visibilityMode = tc.visibility_mode;
            if (!visibilityMode) {
              // Legacy tickets: if is_public was true, treat as 'members_and_public', otherwise 'members_only'
              visibilityMode = tc.is_public ? 'members_and_public' : 'members_only';
            }
            return {
              id: tc.id || `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: tc.name || "Standard Ticket",
              price: priceValue !== null ? String(priceValue) : "",
              is_free: priceValue === 0,
              role_ids: tc.role_ids || [],
              is_default: tc.is_default || false,
              visibility_mode: visibilityMode,
              role_match_only: tc.role_match_only || false,
              offer_type: tc.offer_type || "none",
              bogo_logic_type: tc.bogo_logic_type || "buy_x_get_y_free",
              bogo_buy_quantity: tc.bogo_buy_quantity !== null && tc.bogo_buy_quantity !== undefined 
                ? String(tc.bogo_buy_quantity) : "",
              bogo_get_free_quantity: tc.bogo_get_free_quantity !== null && tc.bogo_get_free_quantity !== undefined 
                ? String(tc.bogo_get_free_quantity) : "",
              bulk_discount_threshold: tc.bulk_discount_threshold !== null && tc.bulk_discount_threshold !== undefined 
                ? String(tc.bulk_discount_threshold) : "",
              bulk_discount_percentage: tc.bulk_discount_percentage !== null && tc.bulk_discount_percentage !== undefined 
                ? String(tc.bulk_discount_percentage) : ""
            };
          });
          setTicketClasses(loadedTickets);
          // Expand first ticket by default
          if (loadedTickets.length > 0) {
            setExpandedTickets({ [loadedTickets[0].id]: true });
          }
        } else {
          // Legacy single-price format - convert to ticket class
          const legacyPrice = config.ticket_price !== null && config.ticket_price !== undefined 
            ? Number(config.ticket_price) : null;
          const legacyTicket = {
            id: `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: "Standard Ticket",
            price: legacyPrice !== null ? String(legacyPrice) : "",
            is_free: legacyPrice === 0,
            role_ids: [],
            is_default: true,
            visibility_mode: 'members_only',
            role_match_only: false,
            offer_type: config.offer_type || "none",
            bogo_logic_type: config.bogo_logic_type || "buy_x_get_y_free",
            bogo_buy_quantity: config.bogo_buy_quantity !== null && config.bogo_buy_quantity !== undefined 
              ? String(config.bogo_buy_quantity) : "",
            bogo_get_free_quantity: config.bogo_get_free_quantity !== null && config.bogo_get_free_quantity !== undefined 
              ? String(config.bogo_get_free_quantity) : "",
            bulk_discount_threshold: config.bulk_discount_threshold !== null && config.bulk_discount_threshold !== undefined 
              ? String(config.bulk_discount_threshold) : "",
            bulk_discount_percentage: config.bulk_discount_percentage !== null && config.bulk_discount_percentage !== undefined 
              ? String(config.bulk_discount_percentage) : ""
          };
          setTicketClasses([legacyTicket]);
          setExpandedTickets({ [legacyTicket.id]: true });
        }
      }

      // Load speaker_ids from event
      if (event.speaker_ids && Array.isArray(event.speaker_ids)) {
        setSelectedSpeakers(event.speaker_ids);
      } else {
        setSelectedSpeakers([]);
      }
    }
  }, [event]);

  const isOnlineEvent = formData.location?.toLowerCase().includes('online') || 
                        formData.location?.includes('zoom.us') ||
                        formData.location?.includes('https://');

  // One-off event is when isProgramEvent is false
  const isOneOffEvent = !isProgramEvent;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Only require program_tag for program events
    if (!isOneOffEvent && !formData.program_tag) {
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

    // Validation for one-off event ticket classes
    if (isOneOffEvent) {
      if (ticketClasses.length === 0) {
        toast.error('Please add at least one ticket class');
        return;
      }

      for (let i = 0; i < ticketClasses.length; i++) {
        const ticket = ticketClasses[i];
        const ticketLabel = ticket.name || `Ticket ${i + 1}`;

        if (!ticket.name || ticket.name.trim() === "") {
          toast.error(`Please enter a name for ${ticketLabel}`);
          return;
        }

        // Price validation: either is_free must be true, or price must be > 0
        if (!ticket.is_free) {
          if (ticket.price === "" || ticket.price === null || ticket.price === undefined) {
            toast.error(`Please enter a price for "${ticket.name}" or mark it as free`);
            return;
          }
          const price = parseFloat(ticket.price);
          if (isNaN(price) || price <= 0) {
            toast.error(`Price for "${ticket.name}" must be greater than zero, or mark the ticket as free`);
            return;
          }
        }

        if (ticket.offer_type === "bogo") {
          if (!ticket.bogo_buy_quantity || !ticket.bogo_get_free_quantity) {
            toast.error(`Please enter BOGO quantities for "${ticket.name}"`);
            return;
          }
          const buyQty = parseInt(ticket.bogo_buy_quantity);
          const freeQty = parseInt(ticket.bogo_get_free_quantity);
          if (isNaN(buyQty) || buyQty < 1 || isNaN(freeQty) || freeQty < 1) {
            toast.error(`BOGO quantities for "${ticket.name}" must be positive integers`);
            return;
          }
        }

        if (ticket.offer_type === "bulk_discount") {
          if (!ticket.bulk_discount_threshold || !ticket.bulk_discount_percentage) {
            toast.error(`Please enter bulk discount settings for "${ticket.name}"`);
            return;
          }
          const threshold = parseInt(ticket.bulk_discount_threshold);
          const percentage = parseFloat(ticket.bulk_discount_percentage);
          if (isNaN(threshold) || threshold < 2) {
            toast.error(`Bulk threshold for "${ticket.name}" must be at least 2`);
            return;
          }
          if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            toast.error(`Bulk percentage for "${ticket.name}" must be between 0 and 100`);
            return;
          }
        }
      }
    }

    const parsedSeats = formData.available_seats ? parseInt(formData.available_seats, 10) : null;
    const eventData = {
      title: formData.title,
      description: formData.description || null,
      internal_reference: formData.internal_reference || null,
      program_tag: formData.program_tag,
      start_date: formData.start_date,
      end_date: formData.end_date || formData.start_date,
      location: formData.location || null,
      image_url: formData.image_url || null,
      available_seats: isNaN(parsedSeats) ? null : parsedSeats,
      zoom_webinar_id: formData.zoom_webinar_id || null,
      speaker_ids: selectedSpeakers.length > 0 ? selectedSpeakers : []
    };

    // Add ticket classes for one-off events
    if (isOneOffEvent) {
      const formattedTicketClasses = ticketClasses.map(ticket => {
        const ticketData = {
          id: ticket.id,
          name: ticket.name,
          price: parseFloat(ticket.price),
          role_ids: ticket.role_ids || [],
          is_default: ticket.is_default || false,
          visibility_mode: ticket.visibility_mode || 'members_only',
          role_match_only: ticket.role_match_only || false,
          offer_type: ticket.offer_type
        };

        if (ticket.offer_type === "bogo") {
          ticketData.bogo_buy_quantity = parseInt(ticket.bogo_buy_quantity);
          ticketData.bogo_get_free_quantity = parseInt(ticket.bogo_get_free_quantity);
          ticketData.bogo_logic_type = ticket.bogo_logic_type;
        } else if (ticket.offer_type === "bulk_discount") {
          ticketData.bulk_discount_threshold = parseInt(ticket.bulk_discount_threshold);
          ticketData.bulk_discount_percentage = parseFloat(ticket.bulk_discount_percentage);
        }

        return ticketData;
      });

      // For backward compatibility, also set ticket_price to the first/default ticket price
      const defaultTicket = formattedTicketClasses.find(t => t.is_default) || formattedTicketClasses[0];
      
      eventData.pricing_config = {
        ticket_price: defaultTicket.price,
        offer_type: defaultTicket.offer_type,
        ticket_classes: formattedTicketClasses
      };
    }

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

              {/* Speakers Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-slate-500" />
                  Speakers
                </Label>
                <p className="text-xs text-slate-500 mb-2">
                  Select speakers for this event. Manage speakers in the Speaker Management page.
                </p>
                
                {loadingSpeakers ? (
                  <div className="text-sm text-slate-500">Loading speakers...</div>
                ) : speakers.length === 0 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                    No speakers available. <a href="/SpeakerManagement" className="text-blue-600 hover:underline" data-testid="link-add-speaker">Add speakers</a> first.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {speakers.map(speaker => {
                      const isSelected = selectedSpeakers.includes(speaker.id);
                      return (
                        <div
                          key={speaker.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-purple-100 border-purple-300 text-purple-800'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                          onClick={() => toggleSpeaker(speaker.id)}
                          data-testid={`speaker-toggle-${speaker.id}`}
                        >
                          <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          {speaker.profile_photo_url ? (
                            <img 
                              src={speaker.profile_photo_url} 
                              alt={speaker.full_name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <Mic className="h-3.5 w-3.5" />
                          )}
                          <span className="text-sm">{speaker.full_name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {selectedSpeakers.length > 0 && (
                  <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm text-purple-700">
                    {selectedSpeakers.length} speaker{selectedSpeakers.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="internal_reference">Internal Reference</Label>
                <Input
                  id="internal_reference"
                  value={formData.internal_reference}
                  onChange={(e) => handleInputChange('internal_reference', e.target.value)}
                  placeholder="e.g. PROJECT-123, Budget Code, etc."
                  data-testid="input-internal-reference"
                />
                <p className="text-xs text-slate-500">
                  For internal use only. Not shown to attendees but included on invoices.
                </p>
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

          {/* Ticket Classes - Only shown for one-off events */}
          {isOneOffEvent && (
            <Card className="border-slate-200 shadow-sm mb-6">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-blue-600" />
                      Ticket Classes
                    </CardTitle>
                    <CardDescription>Create different ticket types for different user roles</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTicketClass}
                    data-testid="button-add-ticket-class"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Ticket
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticketClasses.map((ticket, index) => (
                  <div 
                    key={ticket.id} 
                    className="border border-slate-200 rounded-lg overflow-hidden"
                  >
                    {/* Ticket Header */}
                    <div 
                      className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer"
                      onClick={() => toggleExpandTicket(ticket.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-medium text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">
                              {ticket.name || "Unnamed Ticket"}
                            </span>
                            {ticket.is_default && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                            {ticket.visibility_mode === 'members_and_public' && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                <Globe className="h-3 w-3 mr-1" />
                                Members & Public
                              </Badge>
                            )}
                            {ticket.visibility_mode === 'public_only' && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                <Globe className="h-3 w-3 mr-1" />
                                Public Only
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>£{ticket.price || "0.00"}</span>
                            <span className="text-slate-300">|</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {getRoleNames(ticket.role_ids)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ticketClasses.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); removeTicketClass(ticket.id); }}
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                            data-testid={`button-remove-ticket-${ticket.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {expandedTickets[ticket.id] ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Ticket Details - Collapsible */}
                    {expandedTickets[ticket.id] && (
                      <div className="p-4 space-y-4 border-t border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor={`ticket-name-${ticket.id}`}>Ticket Name *</Label>
                            <Input
                              id={`ticket-name-${ticket.id}`}
                              value={ticket.name}
                              onChange={(e) => updateTicketClass(ticket.id, 'name', e.target.value)}
                              placeholder="e.g. Member Ticket"
                              data-testid={`input-ticket-name-${ticket.id}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`ticket-price-${ticket.id}`}>Price (£) *</Label>
                            <div className="flex items-center gap-3">
                              <div className="relative w-28">
                                <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  id={`ticket-price-${ticket.id}`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={ticket.is_free ? "0" : ticket.price}
                                  onChange={(e) => updateTicketClass(ticket.id, 'price', e.target.value)}
                                  placeholder="0.00"
                                  className="pl-9"
                                  disabled={ticket.is_free}
                                  data-testid={`input-ticket-price-${ticket.id}`}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  id={`ticket-free-${ticket.id}`}
                                  checked={ticket.is_free || false}
                                  onCheckedChange={(checked) => setTicketFree(ticket.id, checked)}
                                  data-testid={`switch-free-${ticket.id}`}
                                />
                                <Label htmlFor={`ticket-free-${ticket.id}`} className="text-sm font-medium">
                                  Free
                                </Label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Role Assignment */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-500" />
                            Available to Roles
                          </Label>
                          <p className="text-xs text-slate-500 mb-2">
                            Select which roles can purchase this ticket. Leave empty for all roles.
                          </p>
                          
                          {loadingRoles ? (
                            <div className="text-sm text-slate-500">Loading roles...</div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {roles.map(role => {
                                const isSelected = (ticket.role_ids || []).includes(role.id);
                                return (
                                  <div
                                    key={role.id}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                    onClick={() => toggleRoleForTicket(ticket.id, role.id)}
                                    data-testid={`role-toggle-${ticket.id}-${role.id}`}
                                  >
                                    <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${
                                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                                    }`}>
                                      {isSelected && (
                                        <Check className="h-2.5 w-2.5 text-white" />
                                      )}
                                    </div>
                                    <span className="text-sm">{role.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {(ticket.role_ids || []).length === 0 && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                              This ticket is available to all roles
                            </div>
                          )}

                          {/* Role Match Only Toggle - only show if roles are selected AND visibility includes members */}
                          {(ticket.role_ids || []).length > 0 && ticket.visibility_mode !== 'public_only' && (
                            <div className="mt-3 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-amber-600" />
                                <div>
                                  <Label htmlFor={`role-match-only-${ticket.id}`} className="text-sm font-medium text-amber-800">
                                    Match only to user role
                                  </Label>
                                  <p className="text-xs text-amber-600">
                                    {ticket.role_match_only 
                                      ? "Ticket is hidden from users whose role doesn't match" 
                                      : "Ticket is visible to all users (role only affects who can register)"}
                                  </p>
                                </div>
                              </div>
                              <Switch
                                id={`role-match-only-${ticket.id}`}
                                checked={ticket.role_match_only || false}
                                onCheckedChange={(checked) => updateTicketClass(ticket.id, 'role_match_only', checked)}
                                data-testid={`switch-role-match-only-${ticket.id}`}
                              />
                            </div>
                          )}
                        </div>

                        {/* Ticket Visibility Mode */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-600" />
                            <Label className="text-base font-medium">Ticket Visibility</Label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div 
                              className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                (ticket.visibility_mode || 'members_only') === 'members_only'
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                              onClick={() => updateTicketClass(ticket.id, 'visibility_mode', 'members_only')}
                              data-testid={`visibility-members-only-${ticket.id}`}
                            >
                              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                (ticket.visibility_mode || 'members_only') === 'members_only' 
                                  ? 'border-blue-500' 
                                  : 'border-slate-300'
                              }`}>
                                {(ticket.visibility_mode || 'members_only') === 'members_only' && (
                                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">Members Only</p>
                                <p className="text-xs text-slate-500">Logged-in members only</p>
                              </div>
                            </div>
                            <div 
                              className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                ticket.visibility_mode === 'members_and_public'
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                              onClick={() => updateTicketClass(ticket.id, 'visibility_mode', 'members_and_public')}
                              data-testid={`visibility-members-and-public-${ticket.id}`}
                            >
                              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                ticket.visibility_mode === 'members_and_public' 
                                  ? 'border-blue-500' 
                                  : 'border-slate-300'
                              }`}>
                                {ticket.visibility_mode === 'members_and_public' && (
                                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">Members & Public</p>
                                <p className="text-xs text-slate-500">Both members and visitors</p>
                              </div>
                            </div>
                            <div 
                              className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                ticket.visibility_mode === 'public_only'
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                              onClick={() => updateTicketClass(ticket.id, 'visibility_mode', 'public_only')}
                              data-testid={`visibility-public-only-${ticket.id}`}
                            >
                              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                ticket.visibility_mode === 'public_only' 
                                  ? 'border-blue-500' 
                                  : 'border-slate-300'
                              }`}>
                                {ticket.visibility_mode === 'public_only' && (
                                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">Public Only</p>
                                <p className="text-xs text-slate-500">Non-logged in visitors only</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Offer Configuration */}
                        <div className="space-y-4">
                          <Label className="text-sm font-medium text-slate-700">Special Offer</Label>
                          <RadioGroup 
                            value={ticket.offer_type} 
                            onValueChange={(value) => updateTicketClass(ticket.id, 'offer_type', value)}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div 
                                className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                  ticket.offer_type === 'none' 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-slate-200 hover:bg-slate-50'
                                }`}
                                onClick={() => updateTicketClass(ticket.id, 'offer_type', 'none')}
                              >
                                <RadioGroupItem value="none" id={`edit-offer-none-${ticket.id}`} />
                                <Label htmlFor={`edit-offer-none-${ticket.id}`} className="text-sm cursor-pointer">No Offer</Label>
                              </div>
                              <div 
                                className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                  ticket.offer_type === 'bogo' 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-slate-200 hover:bg-slate-50'
                                }`}
                                onClick={() => updateTicketClass(ticket.id, 'offer_type', 'bogo')}
                              >
                                <RadioGroupItem value="bogo" id={`edit-offer-bogo-${ticket.id}`} />
                                <Label htmlFor={`edit-offer-bogo-${ticket.id}`} className="text-sm cursor-pointer">BOGO</Label>
                              </div>
                              <div 
                                className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                  ticket.offer_type === 'bulk_discount' 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-slate-200 hover:bg-slate-50'
                                }`}
                                onClick={() => updateTicketClass(ticket.id, 'offer_type', 'bulk_discount')}
                              >
                                <RadioGroupItem value="bulk_discount" id={`edit-offer-bulk-${ticket.id}`} />
                                <Label htmlFor={`edit-offer-bulk-${ticket.id}`} className="text-sm cursor-pointer">Bulk Discount</Label>
                              </div>
                            </div>
                          </RadioGroup>

                          {/* BOGO Configuration */}
                          {ticket.offer_type === 'bogo' && (
                            <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                              <RadioGroup 
                                value={ticket.bogo_logic_type} 
                                onValueChange={(value) => updateTicketClass(ticket.id, 'bogo_logic_type', value)}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <RadioGroupItem value="buy_x_get_y_free" id={`edit-bogo-logic-1-${ticket.id}`} />
                                    <Label htmlFor={`edit-bogo-logic-1-${ticket.id}`} className="text-sm cursor-pointer">
                                      Buy X, Get Y Free
                                    </Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <RadioGroupItem value="enter_total_pay_less" id={`edit-bogo-logic-2-${ticket.id}`} />
                                    <Label htmlFor={`edit-bogo-logic-2-${ticket.id}`} className="text-sm cursor-pointer">
                                      Enter Total, Pay Less
                                    </Label>
                                  </div>
                                </div>
                              </RadioGroup>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-bogo-buy-${ticket.id}`}>Buy Quantity *</Label>
                                  <Input
                                    id={`edit-bogo-buy-${ticket.id}`}
                                    type="number"
                                    min="1"
                                    value={ticket.bogo_buy_quantity}
                                    onChange={(e) => updateTicketClass(ticket.id, 'bogo_buy_quantity', e.target.value)}
                                    placeholder="e.g. 2"
                                    data-testid={`input-bogo-buy-${ticket.id}`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-bogo-free-${ticket.id}`}>Get Free Quantity *</Label>
                                  <Input
                                    id={`edit-bogo-free-${ticket.id}`}
                                    type="number"
                                    min="1"
                                    value={ticket.bogo_get_free_quantity}
                                    onChange={(e) => updateTicketClass(ticket.id, 'bogo_get_free_quantity', e.target.value)}
                                    placeholder="e.g. 1"
                                    data-testid={`input-bogo-free-${ticket.id}`}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Bulk Discount Configuration */}
                          {ticket.offer_type === 'bulk_discount' && (
                            <div className="p-4 bg-slate-50 rounded-lg">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-bulk-threshold-${ticket.id}`}>Minimum Tickets *</Label>
                                  <Input
                                    id={`edit-bulk-threshold-${ticket.id}`}
                                    type="number"
                                    min="2"
                                    value={ticket.bulk_discount_threshold}
                                    onChange={(e) => updateTicketClass(ticket.id, 'bulk_discount_threshold', e.target.value)}
                                    placeholder="e.g. 5"
                                    data-testid={`input-bulk-threshold-${ticket.id}`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-bulk-percentage-${ticket.id}`}>Discount % *</Label>
                                  <Input
                                    id={`edit-bulk-percentage-${ticket.id}`}
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={ticket.bulk_discount_percentage}
                                    onChange={(e) => updateTicketClass(ticket.id, 'bulk_discount_percentage', e.target.value)}
                                    placeholder="e.g. 10"
                                    data-testid={`input-bulk-percentage-${ticket.id}`}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {ticketClasses.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Ticket className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>No ticket classes defined</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTicketClass}
                      className="mt-3"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Your First Ticket
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                {isOnlineEvent && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-sm font-medium text-slate-700">Join Link Visibility</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {hasVisibleJoinLink ? (
                        <>
                          <span className="text-green-700">Join link is visible on this event</span>
                          {getJoinUrlFromLocation() && (
                            <span className="block text-xs text-slate-500 mt-1 break-all">
                              URL: {getJoinUrlFromLocation()}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-amber-700">Join link is hidden - members must register via ticket purchase</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      To change visibility for future events using this webinar, update the setting in Zoom Webinar Provisioning
                    </p>
                  </div>
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
