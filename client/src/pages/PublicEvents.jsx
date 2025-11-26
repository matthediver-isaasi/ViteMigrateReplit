import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";

export default function PublicEventsPage() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['public-events'],
    queryFn: () => base44.entities.Event.filter({ status: 'published' }, '-start_date', 50),
    initialData: [],
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Upcoming Events</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Discover professional development opportunities, training sessions, and networking events for careers professionals in higher education.
          </p>
        </div>
      </div>

      {/* Events Listing */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse border-slate-200">
                <div className="h-48 bg-slate-200" />
                <CardHeader>
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Upcoming Events</h3>
              <p className="text-slate-600 mb-6">
                Check back soon for new professional development opportunities
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const startDate = event.start_date ? new Date(event.start_date) : null;
              const hasUnlimitedCapacity = event.available_seats === 0 || event.available_seats === null;

              return (
                <Card key={event.id} className="border-slate-200 hover:shadow-lg transition-shadow overflow-hidden">
                  {event.image_url && (
                    <div className="h-48 overflow-hidden bg-slate-100">
                      <img 
                        src={event.image_url} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      {event.program_tag && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 shrink-0">
                          {event.program_tag}
                        </Badge>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {startDate && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{format(startDate, "MMM d, yyyy")}</span>
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

                    <div className="pt-3 border-t border-slate-100">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => window.location.href = createPageUrl('Home')}
                      >
                        Member Login to Book
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}