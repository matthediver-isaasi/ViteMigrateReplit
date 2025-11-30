import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isPast } from "date-fns";

export default function NextEventCountdown({ memberEmail }) {
  const [timeLeft, setTimeLeft] = useState(null);

  const { data: myBookings = [] } = useQuery({
    queryKey: ['next-event-bookings', memberEmail],
    queryFn: async () => {
      if (!memberEmail) return [];
      return base44.entities.Booking.list({
        filter: { attendee_email: memberEmail }
      });
    },
    enabled: !!memberEmail,
    staleTime: 60000,
  });

  const eventIds = [...new Set(myBookings.map(b => b.event_id).filter(Boolean))];

  const { data: events = [] } = useQuery({
    queryKey: ['next-event-details', eventIds],
    queryFn: async () => {
      if (eventIds.length === 0) return [];
      return base44.entities.Event.list({
        filter: { id: { in: eventIds } }
      });
    },
    enabled: eventIds.length > 0,
    staleTime: 60000,
  });

  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.start_date);
      return !isPast(eventDate);
    })
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const nextEvent = upcomingEvents[0];

  useEffect(() => {
    if (!nextEvent) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const eventDate = new Date(nextEvent.start_date);
      const now = new Date();

      if (isPast(eventDate)) {
        setTimeLeft(null);
        return;
      }

      const days = differenceInDays(eventDate, now);
      const hours = differenceInHours(eventDate, now) % 24;
      const minutes = differenceInMinutes(eventDate, now) % 60;
      const seconds = differenceInSeconds(eventDate, now) % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [nextEvent]);

  if (!nextEvent || !timeLeft) {
    return null;
  }

  const eventDate = new Date(nextEvent.start_date);
  const formattedDate = format(eventDate, "EEE, d MMM");
  const formattedTime = format(eventDate, "HH:mm");

  return (
    <div className="px-3 py-2">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Next Event</span>
        </div>
        
        <Link 
          to={`/EventDetails/${nextEvent.id}`}
          className="block hover:opacity-80 transition-opacity"
          data-testid="link-next-event"
        >
          <p className="text-sm font-medium text-slate-900 mb-2 line-clamp-2" data-testid="text-next-event-title">
            {nextEvent.title}
          </p>
        </Link>

        <div className="flex items-center gap-1 text-xs text-slate-600 mb-3">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate} at {formattedTime}</span>
        </div>

        <div className="grid grid-cols-4 gap-1" data-testid="countdown-timer">
          <div className="bg-white rounded-md p-1.5 text-center shadow-sm">
            <div className="text-lg font-bold text-blue-600" data-testid="countdown-days">{timeLeft.days}</div>
            <div className="text-[10px] text-slate-500 uppercase">Days</div>
          </div>
          <div className="bg-white rounded-md p-1.5 text-center shadow-sm">
            <div className="text-lg font-bold text-blue-600" data-testid="countdown-hours">{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className="text-[10px] text-slate-500 uppercase">Hrs</div>
          </div>
          <div className="bg-white rounded-md p-1.5 text-center shadow-sm">
            <div className="text-lg font-bold text-blue-600" data-testid="countdown-minutes">{String(timeLeft.minutes).padStart(2, '0')}</div>
            <div className="text-[10px] text-slate-500 uppercase">Min</div>
          </div>
          <div className="bg-white rounded-md p-1.5 text-center shadow-sm">
            <div className="text-lg font-bold text-blue-600" data-testid="countdown-seconds">{String(timeLeft.seconds).padStart(2, '0')}</div>
            <div className="text-[10px] text-slate-500 uppercase">Sec</div>
          </div>
        </div>
      </div>
    </div>
  );
}
