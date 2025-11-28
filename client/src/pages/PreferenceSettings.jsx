import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Settings, Loader2, User, Mail, Clock, ToggleLeft, Calendar, FileText, Trophy, Shield, Briefcase, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useMemberAccess } from "@/hooks/useMemberAccess";
import { createPageUrl } from "@/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const DEFAULT_SECTION_ORDER = [
  { id: 'profile_photo', label: 'Profile Photo', icon: User, description: 'Member profile picture or avatar' },
  { id: 'name_role', label: 'Name & Role', icon: Shield, description: 'Member name, role badge, and job title' },
  { id: 'email', label: 'Email Address', icon: Mail, description: 'Member email contact' },
  { id: 'last_activity', label: 'Last Activity', icon: Clock, description: 'When the member was last active' },
  { id: 'login_toggle', label: 'Login Access', icon: ToggleLeft, description: 'Toggle to enable/disable member login (admin only)' },
  { id: 'events_count', label: 'Events Attended', icon: Calendar, description: 'Number of events the member has attended' },
  { id: 'articles_count', label: 'Articles Published', icon: FileText, description: 'Number of articles the member has written' },
  { id: 'awards', label: 'Awards', icon: Trophy, description: 'Awards and achievements earned by the member' }
];

export default function PreferenceSettingsPage() {
  const { isAdmin, isFeatureExcluded, isAccessReady } = useMemberAccess();
  const [accessChecked, setAccessChecked] = useState(false);
  const [sections, setSections] = useState(DEFAULT_SECTION_ORDER);
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAccessReady) {
      if (!isAdmin || isFeatureExcluded('page_PreferenceSettings')) {
        window.location.href = createPageUrl('Events');
      } else {
        setAccessChecked(true);
      }
    }
  }, [isAdmin, isAccessReady]);

  const { data: savedOrder, isLoading } = useQuery({
    queryKey: ['team-card-section-order'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      const setting = allSettings.find(s => s.setting_key === 'team_card_section_order');
      if (setting?.setting_value) {
        try {
          return JSON.parse(setting.setting_value);
        } catch {
          return null;
        }
      }
      return null;
    },
    staleTime: 0
  });

  const { data: existingSetting } = useQuery({
    queryKey: ['team-card-section-order-record'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      const found = allSettings.find(s => s.setting_key === 'team_card_section_order');
      return found || null;
    },
    staleTime: 0
  });

  useEffect(() => {
    if (savedOrder && Array.isArray(savedOrder)) {
      const orderedSections = savedOrder
        .map(id => DEFAULT_SECTION_ORDER.find(s => s.id === id))
        .filter(Boolean);
      
      const missingSections = DEFAULT_SECTION_ORDER.filter(
        s => !savedOrder.includes(s.id)
      );
      
      setSections([...orderedSections, ...missingSections]);
    }
  }, [savedOrder]);

  const updateOrderMutation = useMutation({
    mutationFn: async (newOrder) => {
      const orderValue = JSON.stringify(newOrder);
      if (existingSetting) {
        return await base44.entities.SystemSettings.update(existingSetting.id, {
          setting_value: orderValue
        });
      } else {
        return await base44.entities.SystemSettings.create({
          setting_key: 'team_card_section_order',
          setting_value: orderValue,
          description: 'Order of sections displayed on team member cards'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-card-section-order'] });
      queryClient.invalidateQueries({ queryKey: ['team-card-section-order-record'] });
      setHasChanges(false);
      toast.success('Section order saved successfully');
    },
    onError: (error) => {
      console.error('Failed to save section order:', error);
      toast.error('Failed to save section order: ' + error.message);
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSections(items);
    setHasChanges(true);
  };

  const handleSave = () => {
    const orderIds = sections.map(s => s.id);
    updateOrderMutation.mutate(orderIds);
  };

  const handleReset = () => {
    setSections(DEFAULT_SECTION_ORDER);
    setHasChanges(true);
  };

  if (!accessChecked || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              Card Section Order
            </h1>
            <p className="text-slate-600">
              Drag and drop to reorder how sections appear on team member cards
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Team Card Sections</CardTitle>
            <CardDescription>
              Drag sections to change their display order on team member cards. Changes will apply to all team cards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {sections.map((section, index) => {
                      const IconComponent = section.icon;
                      return (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-3 p-4 bg-white border rounded-lg transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg border-blue-300' : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded"
                                data-testid={`drag-handle-${section.id}`}
                              >
                                <GripVertical className="w-5 h-5 text-slate-400" />
                              </div>
                              
                              <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg">
                                <IconComponent className="w-5 h-5 text-blue-600" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-900">{section.label}</span>
                                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                    #{index + 1}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-500 truncate">{section.description}</p>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
            data-testid="button-reset-order"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateOrderMutation.isPending}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            data-testid="button-save-order"
          >
            {updateOrderMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Order
          </Button>
        </div>

        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> This controls the order in which sections appear on team member cards. 
              To show/hide specific sections, use the Team Settings page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
