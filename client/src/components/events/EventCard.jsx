import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, Ticket, AlertCircle, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";

const ZOHO_PUBLIC_BACKSTAGE_SUBDOMAIN = "agcasevents";

export default function EventCard({ event, organizationInfo, isFeatureExcluded }) {
  const startDate = event.start_date ? new Date(event.start_date) : null;
  const endDate = event.end_date ? new Date(event.end_date) : null;

  // Check if event has unlimited capacity (online events)
  const hasUnlimitedCapacity = event.available_seats === 0 || event.available_seats === null;

  // Check if user has tickets for this program
  const availableTickets = event.program_tag && organizationInfo?.program_ticket_balances 
    ? (organizationInfo.program_ticket_balances[event.program_tag] || 0)
    : 0;
  
  const hasTickets = availableTickets > 0;
  const needsTickets = event.program_tag && !hasTickets;

  // Use the manually configured public URL if available
  const backstageEventUrl = event.backstage_public_url || null;

  // Check if available seats display is excluded
  const showAvailableSeats = !isFeatureExcluded || !isFeatureExcluded('element_AvailableSeatsDisplay');

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-slate-200 bg-white">
      {/* Program and Ticket Info - Above Image */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
        <div className="flex items-start justify-between gap-2 mb-2">
          {event.program_tag && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
               {event.program_tag}
            </Badge>
          )}
          {organizationInfo && event.program_tag && (
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Ticket className="w-3 h-3 text-purple-600" />
              <span className="font-medium">{availableTickets}</span>
            </div>
          )}
        </div>
        
        {/* Purchase Tickets Banner */}
        {needsTickets && (
          <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-900">Purchase tickets to attend</p>
            </div>
          </div>
        )}
      </div>

      {/* Event Image */}
      {event.image_url && (
        <div className="h-48 overflow-hidden bg-slate-100">
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <h3 className="font-bold text-lg text-slate-900 line-clamp-2">
          {event.title}
        </h3>
        
        {event.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mt-2">
            {event.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {startDate && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{format(startDate, "MMM d, yyyy")}</span>
            {endDate && startDate.getTime() !== endDate.getTime() && (
              <span className="text-slate-400">- {format(endDate, "MMM d, yyyy")}</span>
            )}
          </div>
        )}

        {startDate && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{format(startDate, "h:mm a")}</span>
          </div>
        )}

        {event.location && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}

        {showAvailableSeats && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-slate-400" />
            {hasUnlimitedCapacity ? (
              <span className="text-green-600 font-medium">Open Registration</span>
            ) : event.available_seats > 0 ? (
              <span className="text-green-600 font-medium">
                {event.available_seats} seats available
              </span>
            ) : (
              <span className="text-red-600 font-medium">Sold out</span>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100">
          {needsTickets ? (
            <Button 
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              onClick={() => window.location.href = createPageUrl('BuyProgramTickets')}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy Tickets
            </Button>
          ) : (
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!hasUnlimitedCapacity && event.available_seats === 0}
              onClick={() => window.location.href = createPageUrl('EventDetails') + '?id=' + event.id}
            >
              {!hasUnlimitedCapacity && event.available_seats === 0 ? "Sold Out" : "Register"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}