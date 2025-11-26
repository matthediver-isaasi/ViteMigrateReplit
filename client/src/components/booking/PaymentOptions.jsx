
import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Ticket, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function PaymentOptions({ totalCost, memberInfo, organizationInfo, attendees, numberOfLinks, event, submitting, setSubmitting, registrationMode, refreshOrganizationInfo }) {
  // Calculate tickets required based on registration mode
  const ticketsRequired = registrationMode === 'links' ? numberOfLinks : attendees.filter(a => a.isValid).length;

  // Get available program tickets for this specific event's program
  const availableProgramTickets = event.program_tag && organizationInfo?.program_ticket_balances 
    ? (organizationInfo.program_ticket_balances[event.program_tag] || 0)
    : 0;

  // Check if we have enough tickets
  const hasEnoughTickets = availableProgramTickets >= ticketsRequired;

  const handleSubmit = async () => {
    // Validate attendees have all required information
    if (registrationMode === 'colleagues' || registrationMode === 'self') {
      const invalidAttendees = attendees.filter(a => {
        // Check if attendee needs manual name entry and doesn't have it
        const needsManualName = !a.isSelf && 
                               (a.validationStatus === 'unregistered_domain_match' || 
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

    if (registrationMode === 'colleagues' && attendees.some(a => !a.isValid)) {
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
        memberEmail: memberInfo.email,
        attendees: (registrationMode === 'colleagues' || registrationMode === 'self') ? attendees.filter(a => a.isValid) : [],
        registrationMode: registrationMode,
        numberOfLinks: registrationMode === 'links' ? numberOfLinks : 0,
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
          window.location.href = createPageUrl('MyBookings');
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
    <Card className="border-slate-200 shadow-lg sticky top-8">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-xl">Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Program Tickets Display */}
        {event.program_tag ? (
          <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50" id="booking-summary-tickets">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-purple-600" />
                
                {/*
                  <h3 className="font-semibold text-purple-900">{event.program_tag} Tickets</h3>
              
                */}


                <h3 className="font-semibold text-purple-900">unpacked tickets</h3>
              
              </div>
              <span className="text-xs text-purple-600">
                Available: {availableProgramTickets}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-700">Tickets Required:</span>
                <span className="font-bold text-purple-900">{ticketsRequired}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-700">Tickets Available:</span>
                <span className="font-bold text-purple-900">{availableProgramTickets}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-purple-200">
                <span className="text-purple-700">Remaining After Booking:</span>
                <span className={`font-bold ${hasEnoughTickets ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.max(0, availableProgramTickets - ticketsRequired)}
                </span>
              </div>
            </div>

            {!hasEnoughTickets && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-800">
                    <p className="font-medium mb-1">Insufficient tickets</p>
                    <p>You need {ticketsRequired - availableProgramTickets} more {event.program_tag} ticket{ticketsRequired - availableProgramTickets > 1 ? 's' : ''} to complete this booking.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">No Program Required</p>
                <p>This event is not associated with a program and cannot be booked through this system.</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!hasEnoughTickets && event.program_tag && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = createPageUrl('BuyProgramTickets')}
          >
            <Ticket className="w-4 h-4 mr-2" />
            Buy {event.program_tag} Tickets
          </Button>
        )}

        <Button
          id="confirm-booking-button"
          onClick={handleSubmit}
          disabled={!hasEnoughTickets || !event.program_tag || submitting || ticketsRequired === 0}
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

        {ticketsRequired === 0 && registrationMode === 'colleagues' && (
          <p className="text-xs text-center text-slate-500">
            Add attendees to proceed with booking
          </p>
        )}
      </CardContent>
    </Card>
  );
}
