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
import { toast } from "sonner";
import { 
  Calendar, 
  MapPin, 
  ArrowLeft,
  Save,
  Loader2,
  Video,
  Globe,
  PoundSterling
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import EventImageUpload from "@/components/events/EventImageUpload";

export default function EditEvent() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  // Program vs One-off toggle
  const [isProgramEvent, setIsProgramEvent] = useState(true);

  // Pricing & Offers state for one-off events
  const [ticketPrice, setTicketPrice] = useState("");
  const [offerType, setOfferType] = useState("none");
  const [bogoLogicType, setBogoLogicType] = useState("buy_x_get_y_free");
  const [bogoBuyQty, setBogoBuyQty] = useState("");
  const [bogoGetFreeQty, setBogoGetFreeQty] = useState("");
  const [bulkThreshold, setBulkThreshold] = useState("");
  const [bulkPercentage, setBulkPercentage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
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
        setTicketPrice(config.ticket_price !== null && config.ticket_price !== undefined 
          ? String(config.ticket_price) 
          : "");
        setOfferType(config.offer_type || "none");
        setBogoLogicType(config.bogo_logic_type || "buy_x_get_y_free");
        setBogoBuyQty(config.bogo_buy_quantity !== null && config.bogo_buy_quantity !== undefined 
          ? String(config.bogo_buy_quantity) 
          : "");
        setBogoGetFreeQty(config.bogo_get_free_quantity !== null && config.bogo_get_free_quantity !== undefined 
          ? String(config.bogo_get_free_quantity) 
          : "");
        setBulkThreshold(config.bulk_discount_threshold !== null && config.bulk_discount_threshold !== undefined 
          ? String(config.bulk_discount_threshold) 
          : "");
        setBulkPercentage(config.bulk_discount_percentage !== null && config.bulk_discount_percentage !== undefined 
          ? String(config.bulk_discount_percentage) 
          : "");
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

    // Validation for one-off event pricing and offers
    if (isOneOffEvent) {
      if (!ticketPrice || ticketPrice === "") {
        toast.error('Please enter a ticket price for this one-off event');
        return;
      }
      const price = parseFloat(ticketPrice);
      if (isNaN(price) || price < 0) {
        toast.error('Ticket price must be a valid positive number');
        return;
      }

      if (offerType === "bogo") {
        if (!bogoBuyQty || !bogoGetFreeQty) {
          toast.error('Please enter both BOGO buy and free quantities');
          return;
        }
        const buyQty = parseInt(bogoBuyQty);
        const freeQty = parseInt(bogoGetFreeQty);
        if (isNaN(buyQty) || buyQty < 1 || isNaN(freeQty) || freeQty < 1) {
          toast.error('BOGO quantities must be positive integers');
          return;
        }
      }

      if (offerType === "bulk_discount") {
        if (!bulkThreshold || !bulkPercentage) {
          toast.error('Please enter both bulk discount threshold and percentage');
          return;
        }
        const threshold = parseInt(bulkThreshold);
        const percentage = parseFloat(bulkPercentage);
        if (isNaN(threshold) || threshold < 2) {
          toast.error('Bulk discount threshold must be an integer of at least 2');
          return;
        }
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
          toast.error('Bulk discount percentage must be a number between 0 and 100');
          return;
        }
      }
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
      available_seats: isNaN(parsedSeats) ? null : parsedSeats,
      zoom_webinar_id: formData.zoom_webinar_id || null
    };

    // Add pricing config for one-off events
    if (isOneOffEvent) {
      const pricingConfig = {
        ticket_price: parseFloat(ticketPrice),
        offer_type: offerType
      };
      
      if (offerType === "bogo") {
        pricingConfig.bogo_buy_quantity = parseInt(bogoBuyQty);
        pricingConfig.bogo_get_free_quantity = parseInt(bogoGetFreeQty);
        pricingConfig.bogo_logic_type = bogoLogicType;
      } else if (offerType === "bulk_discount") {
        pricingConfig.bulk_discount_threshold = parseInt(bulkThreshold);
        pricingConfig.bulk_discount_percentage = parseFloat(bulkPercentage);
      }
      
      eventData.pricing_config = pricingConfig;
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

          {/* Pricing & Offers - Only shown for one-off events */}
          {isOneOffEvent && (
            <Card className="border-slate-200 shadow-sm mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PoundSterling className="h-5 w-5 text-blue-600" />
                  Pricing & Offers
                </CardTitle>
                <CardDescription>Set the ticket price and any special offers for this one-off event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Ticket Price */}
                <div className="space-y-2">
                  <Label htmlFor="ticket_price">Ticket Price (£) *</Label>
                  <div className="relative">
                    <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="ticket_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(e.target.value)}
                      placeholder="0.00"
                      className="pl-9"
                      data-testid="input-ticket-price"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Enter 0 for free events
                  </p>
                </div>

                {/* Offer Configuration */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-3 block">
                      Offer Type
                    </Label>
                    <RadioGroup value={offerType} onValueChange={setOfferType}>
                      <div className="space-y-3">
                        <div 
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            offerType === 'none' 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-slate-200 hover:bg-slate-100'
                          }`}
                          onClick={() => setOfferType('none')}
                        >
                          <RadioGroupItem value="none" id="edit-offer-none" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="edit-offer-none" className="font-medium cursor-pointer">No Offer</Label>
                            <p className="text-xs text-slate-600 mt-1">
                              Standard pricing with no discounts
                            </p>
                          </div>
                        </div>

                        <div 
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            offerType === 'bogo' 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-slate-200 hover:bg-slate-100'
                          }`}
                          onClick={() => setOfferType('bogo')}
                        >
                          <RadioGroupItem value="bogo" id="edit-offer-bogo" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="edit-offer-bogo" className="font-medium cursor-pointer">BOGO (Buy X Get Y Free)</Label>
                            <p className="text-xs text-slate-600 mt-1">
                              Customers receive free tickets with their purchase
                            </p>
                          </div>
                        </div>

                        <div 
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            offerType === 'bulk_discount' 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-slate-200 hover:bg-slate-100'
                          }`}
                          onClick={() => setOfferType('bulk_discount')}
                        >
                          <RadioGroupItem value="bulk_discount" id="edit-offer-bulk" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="edit-offer-bulk" className="font-medium cursor-pointer">Bulk Discount</Label>
                            <p className="text-xs text-slate-600 mt-1">
                              Percentage discount when purchasing multiple tickets
                            </p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* BOGO Configuration */}
                  {offerType === 'bogo' && (
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-3 block">
                          BOGO Logic Type
                        </Label>
                        <RadioGroup value={bogoLogicType} onValueChange={setBogoLogicType}>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="buy_x_get_y_free" id="edit-bogo-logic-1" />
                              <Label htmlFor="edit-bogo-logic-1" className="text-sm cursor-pointer">
                                Buy X, Get Y Free (Legacy)
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="enter_total_pay_less" id="edit-bogo-logic-2" />
                              <Label htmlFor="edit-bogo-logic-2" className="text-sm cursor-pointer">
                                Enter Total, Pay Less
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bogo_buy">Buy Quantity *</Label>
                          <Input
                            id="bogo_buy"
                            type="number"
                            min="1"
                            value={bogoBuyQty}
                            onChange={(e) => setBogoBuyQty(e.target.value)}
                            placeholder="e.g. 2"
                            data-testid="input-bogo-buy"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bogo_free">Get Free Quantity *</Label>
                          <Input
                            id="bogo_free"
                            type="number"
                            min="1"
                            value={bogoGetFreeQty}
                            onChange={(e) => setBogoGetFreeQty(e.target.value)}
                            placeholder="e.g. 1"
                            data-testid="input-bogo-free"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                        Example: Buy 2, Get 1 Free means customers pay for 2 tickets and receive 3
                      </p>
                    </div>
                  )}

                  {/* Bulk Discount Configuration */}
                  {offerType === 'bulk_discount' && (
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bulk_threshold">Minimum Tickets *</Label>
                          <Input
                            id="bulk_threshold"
                            type="number"
                            min="2"
                            value={bulkThreshold}
                            onChange={(e) => setBulkThreshold(e.target.value)}
                            placeholder="e.g. 5"
                            data-testid="input-bulk-threshold"
                          />
                          <p className="text-xs text-slate-500">
                            Minimum tickets to qualify for discount
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bulk_percentage">Discount % *</Label>
                          <Input
                            id="bulk_percentage"
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={bulkPercentage}
                            onChange={(e) => setBulkPercentage(e.target.value)}
                            placeholder="e.g. 10"
                            data-testid="input-bulk-percentage"
                          />
                          <p className="text-xs text-slate-500">
                            Percentage off total price
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                        Example: 10% off when purchasing 5 or more tickets
                      </p>
                    </div>
                  )}
                </div>
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
