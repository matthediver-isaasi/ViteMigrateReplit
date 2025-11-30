import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Users, Clock, Ticket, AlertCircle, ShoppingCart, Pencil, Trash2, Video } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ZOHO_PUBLIC_BACKSTAGE_SUBDOMAIN = "agcasevents";

export default function EventCard({ event, organizationInfo, isFeatureExcluded, isAdmin, onEventDeleted, joinLinkSettings, webinars }) {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  const startDate = event.start_date ? new Date(event.start_date) : null;
  const endDate = event.end_date ? new Date(event.end_date) : null;

  const hasUnlimitedCapacity = event.available_seats === 0 || event.available_seats === null;

  // Determine if this is an online event and if join link should be shown
  const isOnlineEvent = event.location?.toLowerCase().startsWith('online');
  const hasUrlInLocation = event.location?.includes('https://') || event.location?.includes('http://');
  
  // Find matching webinar by URL if location contains a URL
  const getWebinarIdFromLocation = () => {
    if (!hasUrlInLocation || !webinars?.length) return null;
    // Extract URL from location (format: "Online - https://...")
    const urlMatch = event.location?.match(/https?:\/\/[^\s]+/);
    if (!urlMatch) return null;
    const url = urlMatch[0];
    const matchingWebinar = webinars.find(w => w.join_url === url);
    return matchingWebinar?.id || null;
  };

  // Check if join link should be shown based on settings
  const shouldShowJoinLink = () => {
    if (!isOnlineEvent || !hasUrlInLocation) return false;
    const webinarId = getWebinarIdFromLocation();
    if (!webinarId || !joinLinkSettings) return false;
    return joinLinkSettings[webinarId] === true;
  };

  // Get display location - show URL only if toggle is on
  const getDisplayLocation = () => {
    if (!isOnlineEvent) return event.location;
    if (shouldShowJoinLink() && hasUrlInLocation) {
      return event.location; // Show full location with URL
    }
    return null; // Will render "Online" badge instead
  };

  const availableTickets = event.program_tag && organizationInfo?.program_ticket_balances 
    ? (organizationInfo.program_ticket_balances[event.program_tag] || 0)
    : 0;
  
  const hasTickets = availableTickets > 0;
  const needsTickets = event.program_tag && !hasTickets;

  const backstageEventUrl = event.backstage_public_url || null;

  const showAvailableSeats = !isFeatureExcluded || !isFeatureExcluded('element_AvailableSeatsDisplay');

  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.Event.delete(event.id);
    },
    onSuccess: () => {
      toast.success('Event deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowDeleteDialog(false);
      setDeleteConfirmText("");
      if (onEventDeleted) {
        onEventDeleted(event.id);
      }
    },
    onError: (error) => {
      console.error('Delete event error:', error);
      toast.error('Failed to delete event: ' + (error.message || 'Unknown error'));
    }
  });

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    window.location.href = createPageUrl('EditEvent') + '?id=' + event.id;
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmText === "DELETE EVENT") {
      deleteEventMutation.mutate();
    } else {
      toast.error('Please type "DELETE EVENT" to confirm deletion');
    }
  };

  const isDeleteButtonDisabled = deleteConfirmText !== "DELETE EVENT" || deleteEventMutation.isPending;

  return (
    <>
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
              {isOnlineEvent ? (
                <>
                  <Video className="w-4 h-4 text-green-500" />
                  {shouldShowJoinLink() && hasUrlInLocation ? (
                    <span className="line-clamp-1">{event.location}</span>
                  ) : (
                    <span className="text-green-600 font-medium">Online</span>
                  )}
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="line-clamp-1">{event.location}</span>
                </>
              )}
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
            {/* Admin Controls */}
            {isAdmin && (
              <div className="flex items-center gap-2 mb-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEditClick}
                  className="flex-1"
                  data-testid={`button-edit-event-${event.id}`}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDeleteClick}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  data-testid={`button-delete-event-${event.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}

            {needsTickets ? (
              <Button 
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                onClick={() => window.location.href = createPageUrl('BuyProgramTickets')}
                data-testid={`button-buy-tickets-${event.id}`}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy Tickets
              </Button>
            ) : (
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!hasUnlimitedCapacity && event.available_seats === 0}
                onClick={() => window.location.href = createPageUrl('EventDetails') + '?id=' + event.id}
                data-testid={`button-register-event-${event.id}`}
              >
                {!hasUnlimitedCapacity && event.available_seats === 0 ? "Sold Out" : "Register"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog - Only render for admins */}
      {isAdmin && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Event</DialogTitle>
              <DialogDescription className="space-y-3">
                <p>
                  Are you sure you want to delete <strong>"{event.title}"</strong>?
                </p>
                <p className="text-red-600 font-medium">
                  This action cannot be undone. All bookings and registrations for this event will also be affected.
                </p>
                <p>
                  To confirm deletion, please type <strong>DELETE EVENT</strong> below:
                </p>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Type DELETE EVENT to confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="border-red-200 focus:border-red-400"
                data-testid="input-delete-confirmation"
              />
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText("");
                }}
                disabled={deleteEventMutation.isPending}
                data-testid="button-cancel-delete"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleteButtonDisabled}
                data-testid="button-confirm-delete"
              >
                {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
