import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle, Video, Plus, Trash2, Calendar, Clock, Users, Link as LinkIcon, ExternalLink, Copy, Check, RefreshCw, AlertCircle, Edit, Save } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { useMemberAccess } from "@/hooks/useMemberAccess";

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers
    }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || errorData.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

export default function ZoomWebinarProvisioning() {
  const { isAdmin, isFeatureExcluded, isAccessReady } = useMemberAccess();
  const [accessChecked, setAccessChecked] = useState(false);
  const queryClient = useQueryClient();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [editingWebinar, setEditingWebinar] = useState(null);
  const [webinarToDelete, setWebinarToDelete] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  
  const [formData, setFormData] = useState({
    topic: "",
    agenda: "",
    start_date: "",
    start_time: "",
    duration_minutes: 60,
    timezone: "Europe/London",
    registration_required: false,
    host_id: "",
    panelists: []
  });
  
  const timezoneOptions = [
    { value: "Europe/London", label: "London (GMT/BST)" },
    { value: "Europe/Dublin", label: "Dublin (GMT/IST)" },
    { value: "Europe/Paris", label: "Paris (CET/CEST)" },
    { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
    { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
    { value: "Europe/Brussels", label: "Brussels (CET/CEST)" },
    { value: "Europe/Madrid", label: "Madrid (CET/CEST)" },
    { value: "Europe/Rome", label: "Rome (CET/CEST)" },
    { value: "Europe/Lisbon", label: "Lisbon (WET/WEST)" },
    { value: "Europe/Athens", label: "Athens (EET/EEST)" },
    { value: "America/New_York", label: "New York (EST/EDT)" },
    { value: "America/Chicago", label: "Chicago (CST/CDT)" },
    { value: "America/Denver", label: "Denver (MST/MDT)" },
    { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
    { value: "America/Toronto", label: "Toronto (EST/EDT)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Asia/Singapore", label: "Singapore (SGT)" },
    { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
    { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)" },
    { value: "UTC", label: "UTC (Coordinated Universal Time)" }
  ];
  
  const [newPanelist, setNewPanelist] = useState({ name: "", email: "" });
  const [conflicts, setConflicts] = useState([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  useEffect(() => {
    if (isAccessReady) {
      if (!isAdmin || isFeatureExcluded('page_ZoomWebinarProvisioning')) {
        window.location.href = createPageUrl('Events');
      } else {
        setAccessChecked(true);
      }
    }
  }, [isAdmin, isAccessReady, isFeatureExcluded]);

  const { data: webinars = [], isLoading: loadingWebinars, refetch: refetchWebinars } = useQuery({
    queryKey: ['/api/zoom/webinars'],
    queryFn: () => apiRequest('/api/zoom/webinars'),
    enabled: accessChecked,
    staleTime: 0,
    refetchOnMount: true
  });

  const { data: zoomUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/zoom/users'],
    queryFn: () => apiRequest('/api/zoom/users'),
    enabled: accessChecked,
    staleTime: 60000
  });

  const createWebinarMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest('/api/zoom/webinars', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/zoom/webinars'] });
      toast.success('Webinar created successfully');
      setShowCreateDialog(false);
      resetForm();
      if (data.webinar) {
        setSelectedWebinar(data.webinar);
        setShowDetailsDialog(true);
      }
    },
    onError: (error) => {
      toast.error('Failed to create webinar: ' + (error.message || 'Unknown error'));
    }
  });

  const deleteWebinarMutation = useMutation({
    mutationFn: async (id) => {
      return apiRequest(`/api/zoom/webinars/${id}?deleteFromZoom=true`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/zoom/webinars'] });
      toast.success('Webinar cancelled successfully');
      setShowDetailsDialog(false);
      setSelectedWebinar(null);
    },
    onError: (error) => {
      toast.error('Failed to cancel webinar: ' + (error.message || 'Unknown error'));
    }
  });

  const updateWebinarMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return apiRequest(`/api/zoom/webinars/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/zoom/webinars'] });
      toast.success('Webinar updated successfully');
      setShowEditDialog(false);
      setEditingWebinar(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update webinar: ' + (error.message || 'Unknown error'));
    }
  });

  const resetForm = () => {
    setFormData({
      topic: "",
      agenda: "",
      start_date: "",
      start_time: "",
      duration_minutes: 60,
      timezone: "Europe/London",
      registration_required: false,
      host_id: "",
      panelists: []
    });
    setNewPanelist({ name: "", email: "" });
    setConflicts([]);
  };

  const openEditDialog = (webinar) => {
    setEditingWebinar(webinar);
    const startDate = parseISO(webinar.start_time);
    setFormData({
      topic: webinar.topic || "",
      agenda: webinar.agenda || "",
      start_date: format(startDate, "yyyy-MM-dd"),
      start_time: format(startDate, "HH:mm"),
      duration_minutes: webinar.duration_minutes || 60,
      timezone: webinar.timezone || "Europe/London",
      registration_required: webinar.registration_required || false,
      host_id: webinar.zoom_host_id || "",
      panelists: webinar.panelists || []
    });
    setShowDetailsDialog(false);
    setShowEditDialog(true);
  };

  const handleEditSubmit = () => {
    if (!formData.topic) {
      toast.error('Please enter a webinar topic');
      return;
    }
    if (!formData.start_date || !formData.start_time) {
      toast.error('Please select date and time');
      return;
    }
    
    const startTime = new Date(`${formData.start_date}T${formData.start_time}`);
    
    if (startTime < new Date()) {
      toast.error('Start time must be in the future');
      return;
    }
    
    const startTimeLocal = `${formData.start_date}T${formData.start_time}:00`;
    
    updateWebinarMutation.mutate({
      id: editingWebinar.id,
      data: {
        topic: formData.topic,
        agenda: formData.agenda,
        start_time: startTimeLocal,
        duration_minutes: formData.duration_minutes,
        timezone: formData.timezone
      }
    });
  };

  const checkForConflicts = async () => {
    if (!formData.start_date || !formData.start_time) return;
    
    setCheckingConflicts(true);
    try {
      // Send time as local time (without UTC conversion) with the selected timezone
      const startTimeLocal = `${formData.start_date}T${formData.start_time}:00`;
      console.log('[ModalConflictCheck] Checking:', {
        startTimeLocal,
        duration_minutes: formData.duration_minutes,
        timezone: formData.timezone,
        exclude_webinar_id: editingWebinar?.id
      });
      const response = await apiRequest('/api/zoom/check-conflicts', {
        method: 'POST',
        body: JSON.stringify({
          start_time: startTimeLocal,
          duration_minutes: formData.duration_minutes,
          host_id: formData.host_id || undefined,
          timezone: formData.timezone,
          exclude_webinar_id: editingWebinar?.id
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('[ModalConflictCheck] Response:', response);
      setConflicts(response.conflicts || []);
    } catch (error) {
      console.error('Conflict check failed:', error);
    } finally {
      setCheckingConflicts(false);
    }
  };

  useEffect(() => {
    if (formData.start_date && formData.start_time) {
      const timer = setTimeout(checkForConflicts, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.start_date, formData.start_time, formData.duration_minutes, formData.host_id, formData.timezone, editingWebinar?.id]);

  const addPanelist = () => {
    if (!newPanelist.name || !newPanelist.email) {
      toast.error('Please enter panelist name and email');
      return;
    }
    if (!newPanelist.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setFormData(prev => ({
      ...prev,
      panelists: [...prev.panelists, { ...newPanelist }]
    }));
    setNewPanelist({ name: "", email: "" });
  };

  const removePanelist = (index) => {
    setFormData(prev => ({
      ...prev,
      panelists: prev.panelists.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (!formData.topic) {
      toast.error('Please enter a webinar topic');
      return;
    }
    if (!formData.start_date || !formData.start_time) {
      toast.error('Please select date and time');
      return;
    }
    
    // Create Date for validation only
    const startTime = new Date(`${formData.start_date}T${formData.start_time}`);
    
    if (startTime < new Date()) {
      toast.error('Start time must be in the future');
      return;
    }
    
    // Send time as local time (without UTC conversion)
    // Zoom will apply the selected timezone
    const startTimeLocal = `${formData.start_date}T${formData.start_time}:00`;
    
    createWebinarMutation.mutate({
      topic: formData.topic,
      agenda: formData.agenda,
      start_time: startTimeLocal,
      duration_minutes: formData.duration_minutes,
      timezone: formData.timezone,
      registration_required: formData.registration_required,
      host_id: formData.host_id || undefined,
      panelists: formData.panelists
    });
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>;
      case 'started':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">In Progress</Badge>;
      case 'ended':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Ended</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatWebinarDate = (dateStr) => {
    try {
      return format(parseISO(dateStr), "EEE, d MMM yyyy 'at' HH:mm");
    } catch {
      return dateStr;
    }
  };

  const upcomingWebinars = webinars.filter(w => 
    w.status !== 'cancelled' && new Date(w.start_time) > new Date()
  );
  const pastWebinars = webinars.filter(w => 
    w.status !== 'cancelled' && new Date(w.start_time) <= new Date()
  );
  const cancelledWebinars = webinars.filter(w => w.status === 'cancelled');

  // Check if a webinar has conflicts with other upcoming webinars
  const getWebinarConflicts = (webinar) => {
    const webinarStart = new Date(webinar.start_time);
    const webinarEnd = new Date(webinarStart.getTime() + webinar.duration_minutes * 60 * 1000);
    
    console.log('[ConflictCheck]', webinar.topic, {
      start: webinarStart.toISOString(),
      end: webinarEnd.toISOString(),
      upcomingCount: upcomingWebinars.length
    });
    
    const conflicting = upcomingWebinars.filter(other => {
      if (other.id === webinar.id) return false;
      
      const otherStart = new Date(other.start_time);
      const otherEnd = new Date(otherStart.getTime() + other.duration_minutes * 60 * 1000);
      
      // Check for overlap: webinar starts before other ends AND webinar ends after other starts
      const overlaps = webinarStart < otherEnd && webinarEnd > otherStart;
      
      if (overlaps) {
        console.log('[ConflictCheck] OVERLAP:', webinar.topic, 'with', other.topic, {
          webinarRange: `${webinarStart.toISOString()} - ${webinarEnd.toISOString()}`,
          otherRange: `${otherStart.toISOString()} - ${otherEnd.toISOString()}`
        });
      }
      
      return overlaps;
    });
    
    return conflicting;
  };

  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <div className="animate-pulse text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto" data-testid="zoom-webinar-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Zoom Webinar Provisioning</h1>
          <p className="text-slate-600 mt-1">Create and manage Zoom webinars for events</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetchWebinars()}
            data-testid="button-refresh-webinars"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}
            className="bg-amber-600 hover:bg-amber-700"
            data-testid="button-create-webinar"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Webinar
          </Button>
        </div>
      </div>

      {upcomingWebinars.length > 0 && (
        <Card className="mb-6" data-testid="card-upcoming-webinars">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Upcoming Webinars ({upcomingWebinars.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingWebinars.map(webinar => {
                const webinarConflicts = getWebinarConflicts(webinar);
                const hasConflict = webinarConflicts.length > 0;
                
                return (
                  <div 
                    key={webinar.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors ${hasConflict ? 'border-amber-300 bg-amber-50/30' : ''}`}
                    onClick={() => {
                      setSelectedWebinar(webinar);
                      setShowDetailsDialog(true);
                    }}
                    data-testid={`webinar-row-${webinar.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${hasConflict ? 'bg-amber-100' : 'bg-blue-50'}`}>
                        <Video className={`w-5 h-5 ${hasConflict ? 'text-amber-600' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{webinar.topic}</p>
                          {hasConflict && (
                            <div className="group relative">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                  <p className="font-medium mb-1">Scheduling overlap with:</p>
                                  {webinarConflicts.map(c => (
                                    <p key={c.id} className="text-slate-300">• {c.topic}</p>
                                  ))}
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{formatWebinarDate(webinar.start_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">{webinar.duration_minutes} min</span>
                      {hasConflict && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Overlap
                        </Badge>
                      )}
                      {getStatusBadge(webinar.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {pastWebinars.length > 0 && (
        <Card className="mb-6" data-testid="card-past-webinars">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-600">
              <Clock className="w-5 h-5" />
              Past Webinars ({pastWebinars.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastWebinars.slice(0, 5).map(webinar => (
                <div 
                  key={webinar.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors opacity-75"
                  onClick={() => {
                    setSelectedWebinar(webinar);
                    setShowDetailsDialog(true);
                  }}
                  data-testid={`webinar-past-row-${webinar.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Video className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">{webinar.topic}</p>
                      <p className="text-sm text-slate-500">{formatWebinarDate(webinar.start_time)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">{webinar.duration_minutes} min</span>
                    {getStatusBadge(webinar.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loadingWebinars && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      )}

      {!loadingWebinars && webinars.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No webinars yet</h3>
            <p className="text-slate-500 mb-4">Create your first Zoom webinar to get started</p>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
              className="bg-amber-600 hover:bg-amber-700"
              data-testid="button-create-first-webinar"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Webinar
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Create Zoom Webinar
            </DialogTitle>
            <DialogDescription>
              Schedule a new Zoom webinar with panelists
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Webinar Topic *</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="Enter webinar topic"
                data-testid="input-topic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda">Description</Label>
              <Textarea
                id="agenda"
                value={formData.agenda}
                onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
                placeholder="Enter webinar description (optional)"
                rows={3}
                data-testid="input-agenda"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Time *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  data-testid="input-start-time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger data-testid="select-timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select
                  value={String(formData.duration_minutes)}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
                >
                  <SelectTrigger data-testid="select-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Select
                  value={formData.host_id || "default"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, host_id: value === "default" ? "" : value }))}
                >
                  <SelectTrigger data-testid="select-host">
                    <SelectValue placeholder="Select host (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default (account owner)</SelectItem>
                    {zoomUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {conflicts.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg" data-testid="conflict-warning">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800">Scheduling Conflict Detected</p>
                    <p className="text-sm text-amber-700 mt-1">
                      The following {conflicts.length === 1 ? 'webinar overlaps' : 'webinars overlap'} with your selected time slot:
                    </p>
                    <div className="mt-3 space-y-2">
                      {conflicts.map(c => {
                        const startTime = parseISO(c.start_time);
                        const endTime = new Date(startTime.getTime() + c.duration_minutes * 60 * 1000);
                        return (
                          <div key={c.id} className="p-3 bg-white/60 border border-amber-200 rounded-md">
                            <p className="font-medium text-amber-900">{c.topic}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-amber-700">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(startTime, "EEE, d MMM yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                              </span>
                              <span>({c.duration_minutes} min)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-amber-600 mt-3">
                      You can still create this webinar despite the overlap. Zoom allows multiple webinars at the same time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label htmlFor="registration" className="font-medium">Require Registration</Label>
                <p className="text-sm text-slate-500">Attendees must register before joining</p>
              </div>
              <Switch
                id="registration"
                checked={formData.registration_required}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, registration_required: checked }))}
                data-testid="switch-registration"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Panelists</Label>
                <span className="text-sm text-slate-500">{formData.panelists.length} added</span>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Name"
                  value={newPanelist.name}
                  onChange={(e) => setNewPanelist(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1"
                  data-testid="input-panelist-name"
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newPanelist.email}
                  onChange={(e) => setNewPanelist(prev => ({ ...prev, email: e.target.value }))}
                  className="flex-1"
                  data-testid="input-panelist-email"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addPanelist}
                  data-testid="button-add-panelist"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {formData.panelists.length > 0 && (
                <div className="space-y-2">
                  {formData.panelists.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePanelist(idx)}
                        data-testid={`button-remove-panelist-${idx}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {conflicts.length > 0 && !createWebinarMutation.isPending && (
              <p className="text-xs text-amber-600 sm:mr-auto flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Overlaps with {conflicts.length} existing {conflicts.length === 1 ? 'webinar' : 'webinars'}
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createWebinarMutation.isPending || !formData.topic || !formData.start_date || !formData.start_time}
              className={conflicts.length > 0 ? "bg-amber-600 hover:bg-amber-700" : "bg-amber-600 hover:bg-amber-700"}
              data-testid="button-submit-webinar"
            >
              {createWebinarMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : conflicts.length > 0 ? (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Create Anyway
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Create Webinar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Webinar Details
            </DialogTitle>
          </DialogHeader>

          {selectedWebinar && (
            <div className="space-y-6 py-4">
              <div>
                <h3 className="font-semibold text-lg text-slate-900" data-testid="text-webinar-topic">
                  {selectedWebinar.topic}
                </h3>
                {selectedWebinar.agenda && (
                  <p className="text-slate-600 mt-1">{selectedWebinar.agenda}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Date & Time</p>
                  <p className="font-medium">{formatWebinarDate(selectedWebinar.start_time)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Duration</p>
                  <p className="font-medium">{selectedWebinar.duration_minutes} minutes</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Status</p>
                {getStatusBadge(selectedWebinar.status)}
              </div>

              {selectedWebinar.join_url && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Join URL</p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={selectedWebinar.join_url}
                      readOnly
                      className="text-sm"
                      data-testid="input-join-url"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedWebinar.join_url, 'join')}
                      data-testid="button-copy-join-url"
                    >
                      {copiedField === 'join' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedWebinar.join_url, '_blank')}
                      data-testid="button-open-join-url"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {selectedWebinar.registration_url && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Registration URL</p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={selectedWebinar.registration_url}
                      readOnly
                      className="text-sm"
                      data-testid="input-registration-url"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedWebinar.registration_url, 'reg')}
                      data-testid="button-copy-registration-url"
                    >
                      {copiedField === 'reg' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {selectedWebinar.password && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Passcode</p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={selectedWebinar.password}
                      readOnly
                      className="text-sm font-mono"
                      data-testid="input-password"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedWebinar.password, 'pass')}
                      data-testid="button-copy-password"
                    >
                      {copiedField === 'pass' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {selectedWebinar.zoom_webinar_id && (
                <div>
                  <p className="text-sm text-slate-500">Zoom Webinar ID</p>
                  <p className="font-mono text-sm">{selectedWebinar.zoom_webinar_id}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedWebinar?.status === 'scheduled' && new Date(selectedWebinar.start_time) > new Date() && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setWebinarToDelete(selectedWebinar);
                    setShowDeleteConfirm(true);
                  }}
                  disabled={deleteWebinarMutation.isPending}
                  data-testid="button-cancel-webinar"
                >
                  {deleteWebinarMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openEditDialog(selectedWebinar)}
                  data-testid="button-edit-webinar"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
              data-testid="button-close-details"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Webinar Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          setEditingWebinar(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Webinar
            </DialogTitle>
            <DialogDescription>
              Update the webinar details. Changes will be synced with Zoom.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-topic">Webinar Title *</Label>
              <Input
                id="edit-topic"
                placeholder="e.g., Monthly Member Webinar"
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                data-testid="input-edit-topic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-agenda">Description</Label>
              <Textarea
                id="edit-agenda"
                placeholder="Brief description of the webinar"
                value={formData.agenda}
                onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
                rows={3}
                data-testid="input-edit-agenda"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  min={format(new Date(), "yyyy-MM-dd")}
                  data-testid="input-edit-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time *</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  data-testid="input-edit-time"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger data-testid="select-edit-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration</Label>
                <Select
                  value={formData.duration_minutes.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
                >
                  <SelectTrigger data-testid="select-edit-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {conflicts.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg" data-testid="edit-conflict-warning">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800">Scheduling Conflict Detected</p>
                    <p className="text-sm text-amber-700 mt-1">
                      The following {conflicts.length === 1 ? 'webinar overlaps' : 'webinars overlap'} with your selected time slot:
                    </p>
                    <div className="mt-3 space-y-2">
                      {conflicts.filter(c => c.id !== editingWebinar?.id).map(c => {
                        const startTime = parseISO(c.start_time);
                        const endTime = new Date(startTime.getTime() + c.duration_minutes * 60 * 1000);
                        return (
                          <div key={c.id} className="p-3 bg-white/60 border border-amber-200 rounded-md">
                            <p className="font-medium text-amber-900">{c.topic}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-amber-700">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(startTime, "EEE, d MMM yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingWebinar(null);
                resetForm();
              }}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updateWebinarMutation.isPending || !formData.topic || !formData.start_date || !formData.start_time}
              className="bg-amber-600 hover:bg-amber-700"
              data-testid="button-save-webinar"
            >
              {updateWebinarMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Webinar
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete this webinar?</p>
              {webinarToDelete && (
                <div className="p-3 bg-slate-50 rounded-md mt-2">
                  <p className="font-medium text-slate-900">{webinarToDelete.topic}</p>
                  <p className="text-sm text-slate-500">{formatWebinarDate(webinarToDelete.start_time)}</p>
                </div>
              )}
              <p className="text-sm text-red-600 mt-2">
                This will permanently remove the webinar from Zoom and cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteConfirm(false);
                setWebinarToDelete(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (webinarToDelete) {
                  deleteWebinarMutation.mutate(webinarToDelete.id);
                  setShowDeleteConfirm(false);
                  setWebinarToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-delete"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Webinar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
