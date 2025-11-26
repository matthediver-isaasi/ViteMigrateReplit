
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Clock, Users, ArrowLeft, Ticket, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import AttendeeList from "../components/booking/AttendeeList";
import PaymentOptions from "../components/booking/PaymentOptions";
import RegistrationModeSelector from "../components/booking/RegistrationModeSelector";
import ColleagueSelector from "../components/booking/ColleagueSelector";
import PageTour from "../components/tour/PageTour";
import TourButton from "../components/tour/TourButton";

export default function EventDetailsPage({ memberInfo: memberInfoFromProps, organizationInfo, refreshOrganizationInfo, isFeatureExcluded, memberRole, reloadMemberInfo }) {
  const [memberInfoState, setMemberInfoState] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [tourAutoShow, setTourAutoShow] = useState(false);

  const currentMemberInfo = memberInfoFromProps || memberInfoState;

  const [attendees, setAttendees] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [registrationMode, setRegistrationMode] = useState('colleagues');
  const [memberAttending, setMemberAttending] = useState(false);
  const [showColleagueSelector, setShowColleagueSelector] = useState(false);

  // Track if initialization has completed to prevent resets on subsequent renders
  const hasInitialized = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  // Determine if tours should be shown for this user
  const shouldShowTours = memberRole?.show_tours !== false;

  // Check if user has seen this page's tour
  const hasSeenTour = currentMemberInfo?.page_tours_seen?.EventDetails === true;

  // Auto-show tour on first visit if tours are enabled
  React.useEffect(() => {
    if (shouldShowTours && !hasSeenTour && currentMemberInfo) {
      setTourAutoShow(true);
      setShowTour(true);
    }
  }, [shouldShowTours, hasSeenTour, currentMemberInfo]);

  // Calculate available registration modes
  const availableRegistrationModes = React.useMemo(() => {
    const modes = [
    {
      id: 'self',
      icon: 'User',
      title: 'Self Register',
      description: 'Register yourself only',
      featureId: 'element_SelfRegistration'
    },
    {
      id: 'colleagues',
      icon: 'Users',
      title: 'Register Attendees',
      description: 'Register your attendee(s) now'
    }];

    const filtered = modes.filter((modeOption) => {
      if (modeOption.featureId && isFeatureExcluded) {
        return !isFeatureExcluded(modeOption.featureId);
      }
      return true;
    });
    
    console.log('[EventDetails] Available registration modes:', filtered.map(m => m.id));
    return filtered;
  }, [isFeatureExcluded]);

  useEffect(() => {
    if (!memberInfoFromProps) {
      const storedMember = sessionStorage.getItem('agcas_member');
      if (storedMember) {
        setMemberInfoState(JSON.parse(storedMember));
      } else {
        setMemberInfoState(null);
      }
    }
  }, [memberInfoFromProps]);

  // Initialization useEffect - now only runs once per eventId change
  useEffect(() => {
    console.log('[EventDetails] Initialization useEffect - hasInitialized.current:', hasInitialized.current, 'eventId:', eventId);
    
    // Only run initialization logic once per eventId
    if (hasInitialized.current === eventId) {
      console.log('[EventDetails] Already initialized for this eventId, skipping initialization');
      return;
    }

    console.log('[EventDetails] Running initialization logic');
    hasInitialized.current = eventId; // Mark as initialized for this eventId

    if (currentMemberInfo) {
      if (eventId) {
        const savedRegistration = sessionStorage.getItem(`event_registration_${eventId}`);
        console.log('[EventDetails] Saved registration in sessionStorage:', savedRegistration ? 'exists' : 'not found');

        if (savedRegistration) {
          let { attendees: savedAttendees, registrationMode: savedMode, memberAttending: savedMemberAttending } = JSON.parse(savedRegistration);
          console.log('[EventDetails] Loaded saved registration - mode:', savedMode, 'attendees:', savedAttendees.length);

          // CRITICAL FIX: Check if saved mode is still available for this user
          const isSavedModeAvailable = availableRegistrationModes.some(mode => mode.id === savedMode);
          console.log('[EventDetails] Is saved mode "' + savedMode + '" still available?', isSavedModeAvailable);

          if (!isSavedModeAvailable) {
            console.log('[EventDetails] Saved mode is no longer available - resetting to defaults');
            // Clear the invalid saved registration
            sessionStorage.removeItem(`event_registration_${eventId}`);
            
            // Set up defaults as if no saved registration exists
            let initialRegistrationMode;
            let initialMemberAttending = false;
            let initialAttendees = [];
            let initialShowColleagueSelector = false;

            const colleaguesModeOption = availableRegistrationModes.find(mode => mode.id === 'colleagues');
            const selfModeOption = availableRegistrationModes.find(mode => mode.id === 'self');
            
            if (colleaguesModeOption) {
              initialRegistrationMode = 'colleagues';
              initialShowColleagueSelector = true;
            } else if (selfModeOption) {
              initialRegistrationMode = 'self';
              initialMemberAttending = true;
              initialAttendees = [{
                email: currentMemberInfo.email || "",
                first_name: currentMemberInfo.first_name || "",
                last_name: currentMemberInfo.last_name || "",
                isValid: true,
                isSelf: true
              }];
            } else {
              initialRegistrationMode = availableRegistrationModes.length > 0 ? availableRegistrationModes[0].id : 'colleagues';
              if (initialRegistrationMode === 'colleagues') {
                initialShowColleagueSelector = true;
              }
            }
            
            setRegistrationMode(initialRegistrationMode);
            setMemberAttending(initialMemberAttending);
            setAttendees(initialAttendees);
            setShowColleagueSelector(initialShowColleagueSelector);
            return;
          }

          // Saved mode is valid - use it
          if (savedMode === 'links') {
            savedMode = 'self';
            savedMemberAttending = true;
            savedAttendees = [{
              email: currentMemberInfo.email || "",
              first_name: currentMemberInfo.first_name || "",
              last_name: currentMemberInfo.last_name || "",
              isValid: true,
              isSelf: true
            }];
            console.log('[EventDetails] Converted links mode to self mode');
          }

          setAttendees(savedAttendees);
          setRegistrationMode(savedMode);
          setMemberAttending(savedMemberAttending !== undefined ? savedMemberAttending : false);
          
          // Only auto-show colleague selector if in colleagues mode with no attendees
          if (savedMode === 'colleagues' && savedAttendees.length === 0) {
            setShowColleagueSelector(true);
          } else {
            setShowColleagueSelector(false);
          }
        } else {
          // No saved registration - set defaults
          console.log('[EventDetails] No saved registration - initializing defaults');
          
          let initialRegistrationMode;
          let initialMemberAttending = false;
          let initialAttendees = [];
          let initialShowColleagueSelector = false;

          const colleaguesModeOption = availableRegistrationModes.find(mode => mode.id === 'colleagues');
          const selfModeOption = availableRegistrationModes.find(mode => mode.id === 'self');
          
          if (colleaguesModeOption) {
            initialRegistrationMode = 'colleagues';
            initialShowColleagueSelector = true;
          } else if (selfModeOption) {
            initialRegistrationMode = 'self';
            initialMemberAttending = true;
            initialAttendees = [{
              email: currentMemberInfo.email || "",
              first_name: currentMemberInfo.first_name || "",
              last_name: currentMemberInfo.last_name || "",
              isValid: true,
              isSelf: true
            }];
          } else {
            initialRegistrationMode = availableRegistrationModes.length > 0 ? availableRegistrationModes[0].id : 'colleagues';
            if (initialRegistrationMode === 'colleagues') {
              initialShowColleagueSelector = true;
            }
          }
          
          setRegistrationMode(initialRegistrationMode);
          setMemberAttending(initialMemberAttending);
          setAttendees(initialAttendees);
          setShowColleagueSelector(initialShowColleagueSelector);
        }
      }
    } else {
      // For unauthenticated users
      console.log('[EventDetails] No memberInfo - setting up for unauthenticated user');
      setAttendees([]);
      const colleaguesModeOption = availableRegistrationModes.find(mode => mode.id === 'colleagues');
      const defaultMode = colleaguesModeOption ? 'colleagues' : (availableRegistrationModes.length > 0 ? availableRegistrationModes[0].id : 'colleagues');
      setRegistrationMode(defaultMode);
      setMemberAttending(false);
      if (defaultMode === 'colleagues') {
        setShowColleagueSelector(true);
      } else {
        setShowColleagueSelector(false);
      }
    }
  }, [eventId]); // CRITICAL: Removed currentMemberInfo and availableRegistrationModes from dependencies

  // Separate useEffect to save state to sessionStorage
  useEffect(() => {
    // Only save if initialization has completed for the current eventId
    if (eventId && currentMemberInfo && hasInitialized.current === eventId) {
      const registrationData = {
        attendees,
        registrationMode,
        memberAttending
      };
      sessionStorage.setItem(`event_registration_${eventId}`, JSON.stringify(registrationData));
    }
  }, [attendees, registrationMode, memberAttending, eventId, currentMemberInfo]);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const events = await base44.entities.Event.list();
      return events.find((e) => e.id === eventId);
    },
    enabled: !!eventId
  });

  const removeAttendee = (index) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const updateAttendee = (index, field, value) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
  };

  const handleColleagueSelect = (colleagueData) => {
    setAttendees([...attendees, {
      ...colleagueData,
      isValid: true,
      isSelf: false
    }]);
    setShowColleagueSelector(false);
  };

  const handleModeChange = (mode) => {
    setRegistrationMode(mode);
    setShowColleagueSelector(false); // Reset when mode changes

    if (currentMemberInfo) {
      if (mode === 'self') {
        setAttendees([{
          email: currentMemberInfo.email || "",
          first_name: currentMemberInfo.first_name || "",
          last_name: currentMemberInfo.last_name || "",
          isValid: true,
          isSelf: true
        }]);
        setMemberAttending(true);
      } else if (mode === 'colleagues') {
        setAttendees([]);
        setMemberAttending(false);
        setShowColleagueSelector(true); // Auto-show when switching to colleagues mode
      }
    } else {
      setAttendees([]);
      setMemberAttending(false);
      if (mode === 'colleagues') {
        setShowColleagueSelector(true);
      }
    }
  };

  const toggleMemberAttendance = () => {
    if (!currentMemberInfo) return;

    const newAttendingState = !memberAttending;
    setMemberAttending(newAttendingState);

    if (newAttendingState) {
      const memberAsAttendee = {
        email: currentMemberInfo.email || "",
        first_name: currentMemberInfo.first_name || "",
        last_name: currentMemberInfo.last_name || "",
        isValid: true,
        isSelf: true
      };
      if (!attendees.some((a) => a.isSelf)) {
        setAttendees([memberAsAttendee, ...attendees]);
      } else {
        const filteredAttendees = attendees.filter((a) => !a.isSelf);
        setAttendees([memberAsAttendee, ...filteredAttendees]);
      }
    } else {
      setAttendees(attendees.filter((a) => !a.isSelf));
    }
  };

  const handleTourComplete = async () => {
    setShowTour(false);
    setTourAutoShow(false);
  };

  const handleTourDismiss = async () => {
    setShowTour(false);
    setTourAutoShow(false);
    await updateMemberTourStatus('EventDetails');
  };

  const handleStartTour = () => {
    setShowTour(false);
    setTourAutoShow(false);
    
    setTimeout(() => {
      setShowTour(true);
      setTourAutoShow(true);
    }, 10);
  };

  const updateMemberTourStatus = async (tourKey) => {
    if (currentMemberInfo && !currentMemberInfo.is_team_member) {
      try {
        const allMembers = await base44.entities.Member.list();
        const currentMember = allMembers.find(m => m.email === currentMemberInfo.email);
        
        if (currentMember) {
          const updatedTours = { ...(currentMember.page_tours_seen || {}), [tourKey]: true };
          await base44.entities.Member.update(currentMember.id, {
            page_tours_seen: updatedTours
          });
          
          const updatedMemberInfo = { ...currentMemberInfo, page_tours_seen: updatedTours };
          sessionStorage.setItem('agcas_member', JSON.stringify(updatedMemberInfo));
          
          // Notify Layout to reload memberInfo
          if (reloadMemberInfo) {
            reloadMemberInfo();
          }
        }
      } catch (error) {
        console.error('Failed to update tour status:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <div className="animate-pulse text-slate-600">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Event not found</h2>
          <Link to={createPageUrl('Events')}>
            <Button>Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  const startDate = event.start_date ? new Date(event.start_date) : null;
  const endDate = event.end_date ? new Date(event.end_date) : null;
  const hasUnlimitedCapacity = event.available_seats === 0 || event.available_seats === null;
  const totalCost = attendees.filter((a) => a.isValid).length * (event.ticket_price || 0);
  const ticketsRequired = registrationMode === 'links' ? 0 : attendees.filter((a) => a.isValid).length;
  const availableProgramTickets = event.program_tag && organizationInfo?.program_ticket_balances ?
    organizationInfo.program_ticket_balances[event.program_tag] || 0 : 0;
  const hasEnoughTickets = availableProgramTickets >= ticketsRequired;
  const canConfirmBooking = hasEnoughTickets && event.program_tag && !submitting && ticketsRequired > 0;

  // Check if available seats display is excluded
  const showAvailableSeats = !isFeatureExcluded || !isFeatureExcluded('element_AvailableSeatsDisplay');

  const handleConfirmBooking = async () => {
    // Validate attendees have all required information
    if (registrationMode === 'colleagues' || registrationMode === 'self') {
      const invalidAttendees = attendees.filter((a) => {
        const needsManualName = !a.isSelf && (
          a.validationStatus === 'unregistered_domain_match' ||
          a.validationStatus === 'external');

        if (needsManualName && (!a.first_name || !a.last_name)) {
          return true;
        }

        return false;
      });

      if (invalidAttendees.length > 0) {
        toast.error('Please provide first and last names for all attendees');
        return;
      }
    }

    if (!hasEnoughTickets) {
      toast.error("Insufficient program tickets. Please purchase more tickets first.");
      return;
    }

    if (registrationMode === 'colleagues' && attendees.some((a) => !a.isValid)) {
      toast.error("Please remove or fix invalid attendee emails");
      return;
    }

    if (ticketsRequired === 0) {
      toast.error("Please add at least one attendee or specify number of links");
      return;
    }

    setSubmitting(true);

    try {
      const response = await base44.functions.invoke('createBooking', {
        eventId: event.id,
        memberEmail: currentMemberInfo.email,
        attendees: registrationMode === 'colleagues' || registrationMode === 'self' ? attendees.filter((a) => a.isValid) : [],
        registrationMode: registrationMode,
        numberOfLinks: registrationMode === 'links' ? 0 : 0,
        ticketsRequired: ticketsRequired,
        programTag: event.program_tag
      });

      if (response.data.success) {
        sessionStorage.removeItem(`event_registration_${event.id}`);

        if (refreshOrganizationInfo) {
          refreshOrganizationInfo();
        }

        toast.success("Booking confirmed!");
        setTimeout(() => {
          window.location.href = createPageUrl('Bookings');
        }, 1500);
      } else {
        toast.error(response.data.error || "Failed to create booking");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      {showTour && shouldShowTours && (
        <PageTour
          tourGroupName="EventDetails"
          viewId={null}
          onComplete={handleTourComplete}
          onDismissPermanently={handleTourDismiss}
          autoShow={tourAutoShow}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to={createPageUrl('Events')} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
          {shouldShowTours && (
            <TourButton onClick={handleStartTour} />
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {event.image_url && (
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
                  {event.program_tag && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 shrink-0">
                      {event.program_tag}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3 pt-4">
                  {startDate && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="font-medium">{format(startDate, "EEEE, MMMM d, yyyy")}</span>
                      {endDate && startDate.getTime() !== endDate.getTime() && (
                        <span className="text-slate-500">- {format(endDate, "MMMM d, yyyy")}</span>
                      )}
                    </div>
                  )}

                  {startDate && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <span>{format(startDate, "h:mm a")}</span>
                      {endDate && (
                        <span className="text-slate-500">- {format(endDate, "h:mm a")}</span>
                      )}
                    </div>
                  )}

                  {event.location && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  {showAvailableSeats && (
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-slate-400" />
                      {hasUnlimitedCapacity ? (
                        <span className="text-green-600 font-medium">Open Registration - No Capacity Limit</span>
                      ) : event.available_seats !== undefined && event.available_seats > 0 ? (
                        <span className="text-green-600 font-medium">{event.available_seats} seats available</span>
                      ) : event.available_seats !== undefined ? (
                        <span className="text-red-600 font-medium">Sold out</span>
                      ) : null}
                    </div>
                  )}
                </div>
              </CardHeader>

              {event.description && (
                <CardContent className="pt-6 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-3">About this event</h3>
                  <p className="text-slate-600 whitespace-pre-wrap">{event.description}</p>
                </CardContent>
              )}
            </Card>

            {registrationMode === 'colleagues' && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Attendees</CardTitle>
                    <div className="flex items-center gap-4">
                      {currentMemberInfo && (
                        <div className="flex items-center gap-3" id="member-attending-toggle">
                          <Switch
                            id="member-attending"
                            checked={memberAttending}
                            onCheckedChange={toggleMemberAttendance}
                          />
                          <Label htmlFor="member-attending" className="text-sm font-medium text-slate-700 cursor-pointer">
                            I am attending
                          </Label>
                        </div>
                      )}
                      <Button
                        id="add-colleague-button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowColleagueSelector(true)}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Colleague
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {showColleagueSelector && (
                    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-slate-900">Add Colleague</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowColleagueSelector(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                      <div id="colleague-search-input">
                        <ColleagueSelector
                          organizationId={currentMemberInfo?.organization_id}
                          onSelect={handleColleagueSelect}
                          memberInfo={currentMemberInfo}
                        />
                      </div>
                    </div>
                  )}

                  {attendees.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p>No attendees added yet</p>
                      {currentMemberInfo && (
                        <p className="text-sm mt-1">Toggle "I am attending" or add colleagues to get started.</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <AttendeeList
                        attendees={attendees}
                        onUpdate={updateAttendee}
                        onRemove={removeAttendee}
                        memberInfo={currentMemberInfo}
                      />
                      
                      <div className="pt-4 border-t border-slate-200">
                        <Button
                          onClick={handleConfirmBooking}
                          disabled={!canConfirmBooking}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          size="lg"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Confirm Booking'
                          )}
                        </Button>
                        
                        {!hasEnoughTickets && event.program_tag && (
                          <p className="text-xs text-center text-amber-600 mt-2">
                            Insufficient program tickets. You need {ticketsRequired - availableProgramTickets} more ticket{ticketsRequired - availableProgramTickets > 1 ? 's' : ''}.
                          </p>
                        )}
                        
                        {ticketsRequired === 0 && (
                          <p className="text-xs text-center text-slate-500 mt-2">
                            Add attendees to proceed with booking
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <PaymentOptions
              totalCost={totalCost}
              memberInfo={currentMemberInfo}
              organizationInfo={organizationInfo}
              attendees={attendees.filter((a) => a.isValid)}
              numberOfLinks={0}
              event={event}
              submitting={submitting}
              setSubmitting={setSubmitting}
              registrationMode={registrationMode}
              refreshOrganizationInfo={refreshOrganizationInfo}
            />

            {availableRegistrationModes.length > 1 && (
              <div>
                <RegistrationModeSelector
                  mode={registrationMode}
                  onModeChange={handleModeChange}
                  isFeatureExcluded={isFeatureExcluded}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
