import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Ticket } from "lucide-react";
import EventCard from "../components/events/EventCard";
import ProgramFilter from "../components/events/ProgramFilter";
import PageTour from "../components/tour/PageTour";
import TourButton from "../components/tour/TourButton";
import { base44 } from "@/api/base44Client";
import { useLayoutContext } from "@/contexts/LayoutContext";

export default function EventsPage({
  organizationInfo: propsOrganizationInfo,
  isFeatureExcluded,
  memberInfo,
  memberRole,
  reloadMemberInfo,
}) {
  // Get hasBanner, refreshOrganizationInfo, and organizationInfo from layout context
  const { 
    hasBanner, 
    refreshOrganizationInfo,
    organizationInfo: contextOrganizationInfo 
  } = useLayoutContext();
  
  // Use context organizationInfo if available, otherwise fall back to props
  const organizationInfo = contextOrganizationInfo || propsOrganizationInfo;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [showTour, setShowTour] = useState(false);
  const [tourAutoShow, setTourAutoShow] = useState(false);

  console.log(
    "[Events] Render - showTour:",
    showTour,
    "tourAutoShow:",
    tourAutoShow,
    "shouldShowTours (from memberRole):",
    memberRole?.show_tours
  );

  // Determine if tours should be shown for this user
  const shouldShowTours = memberRole?.show_tours !== false;

  // Check if user has seen this page's tour
  const hasSeenTour = memberInfo?.page_tours_seen?.Events === true;

  console.log("[Events] shouldShowTours:", shouldShowTours, "hasSeenTour:", hasSeenTour);

  // Refresh organization info on mount to get latest ticket balances
  useEffect(() => {
    if (refreshOrganizationInfo) {
      console.log('[Events] Refreshing organization info on mount');
      refreshOrganizationInfo();
    }
  }, []); // Only run on mount

  // Auto-show tour on first visit if tours are enabled
  useEffect(() => {
    console.log(
      "[Events] Auto-show useEffect - shouldShowTours:",
      shouldShowTours,
      "hasSeenTour:",
      hasSeenTour,
      "memberInfo:",
      !!memberInfo
    );
    if (shouldShowTours && !hasSeenTour && memberInfo) {
      console.log("[Events] Auto-showing tour");
      setTourAutoShow(true);
      setShowTour(true);
    }
  }, [shouldShowTours, hasSeenTour, memberInfo]);

  // Load events using base44 client proxy
  const {
    data: events = [],
    isLoading,
    error: eventsError,
  } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      console.log("[Events] Fetching events via base44 client");
      try {
        const data = await base44.entities.Event.list({ sort: { start_date: 'asc' } });
        return data || [];
      } catch (error) {
        console.error("[Events] Error loading events:", error);
        throw error;
      }
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  if (eventsError) {
    console.error("[Events] eventsError:", eventsError);
  }

  const programs = ["all", ...new Set(events.map((e) => e.program_tag).filter(Boolean))];

  const getTicketBalance = (programTag) => {
    if (!organizationInfo?.program_ticket_balances) return 0;
    return organizationInfo.program_ticket_balances[programTag] || 0;
  };

  let filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProgram = selectedProgram === "all" || event.program_tag === selectedProgram;
    return matchesSearch && matchesProgram;
  });

  filteredEvents.sort((a, b) => {
    const dateA = new Date(a.start_date);
    const dateB = new Date(b.start_date);
    return dateA.getTime() - dateB.getTime();
  });

  // Update member tour status via base44 client
  const updateMemberTourStatus = async (tourKey) => {
    console.log("[Events] updateMemberTourStatus called for:", tourKey);

    if (!memberInfo || memberInfo.is_team_member) {
      return;
    }

    if (!memberInfo.id) {
      console.warn(
        "[Events] memberInfo.id is missing; cannot update tour status.",
        memberInfo
      );
      return;
    }

    try {
      const updatedTours = {
        ...(memberInfo.page_tours_seen || {}),
        [tourKey]: true,
      };

      await base44.entities.Member.update(memberInfo.id, { page_tours_seen: updatedTours });

      const updatedMemberInfo = { ...memberInfo, page_tours_seen: updatedTours };
      sessionStorage.setItem("agcas_member", JSON.stringify(updatedMemberInfo));
      console.log("[Events] Tour status updated successfully");

      // Notify Layout to reload memberInfo
      if (typeof reloadMemberInfo === "function") {
        reloadMemberInfo();
      }
    } catch (error) {
      console.error("[Events] Exception updating tour status:", error);
    }
  };

  const handleTourComplete = async () => {
    console.log("[Events] handleTourComplete called");
    setShowTour(false);
    setTourAutoShow(false);
  };

  const handleTourDismiss = async () => {
    console.log("[Events] handleTourDismiss called");
    setShowTour(false);
    setTourAutoShow(false);
    await updateMemberTourStatus("Events");
  };

  const handleStartTour = () => {
    console.log("[Events] handleStartTour called - resetting then showing tour");
    // First reset the states
    setShowTour(false);
    setTourAutoShow(false);

    // Then set them to true after a brief delay to ensure PageTour remounts
    setTimeout(() => {
      console.log("[Events] Now setting showTour and tourAutoShow to true");
      setShowTour(true);
      setTourAutoShow(true);
    }, 10);
  };

  console.log("[Events] Rendering PageTour?", showTour && shouldShowTours);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      {showTour && shouldShowTours && (
        <PageTour
          tourGroupName="Events"
          viewId={null}
          onComplete={handleTourComplete}
          onDismissPermanently={handleTourDismiss}
          autoShow={tourAutoShow}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header - hidden when custom banner is present */}
        {!hasBanner && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                Register your tickets
              </h1>
              {shouldShowTours && typeof handleStartTour === "function" && (
                <TourButton onClick={handleStartTour} />
              )}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {!isFeatureExcluded?.("element_EventsSearch") && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search events by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <ProgramFilter
                programs={programs}
                selectedProgram={selectedProgram}
                onProgramChange={setSelectedProgram}
              />
            </div>
          </div>
        )}

        {/* Events Display */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-slate-200" />
                  <CardContent className="p-6">
                    <div className="h-4 bg-slate-200 rounded mb-2" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : eventsError ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-700 mb-2">
              Error loading events
            </h3>
            <p className="text-slate-600">
              Please check your Supabase connection and event table.
            </p>
          </div>
        ) : (
          <>
            {organizationInfo && selectedProgram !== "all" && (
              <div className="flex items-center gap-3 mb-6 p-4 bg-white rounded-lg border border-slate-200">
                <Ticket className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-slate-700">
                  You have {getTicketBalance(selectedProgram)}{" "}
                  {getTicketBalance(selectedProgram) === 1 ? "ticket" : "tickets"}{" "}
                  available for {selectedProgram}
                </span>
              </div>
            )}

            {filteredEvents.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No events found
                </h3>
                <p className="text-slate-600">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    organizationInfo={organizationInfo}
                    isFeatureExcluded={isFeatureExcluded}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
