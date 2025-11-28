import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Settings, Loader2, Building2, User, BarChart3, FolderHeart, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useMemberAccess } from "@/hooks/useMemberAccess";
import { createPageUrl } from "@/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const DEFAULT_SECTION_ORDER = [
  { id: 'organization_logo', label: 'Organization Logo', icon: Building2, description: 'Organization branding and logo upload (shown to org members only)' },
  { id: 'profile_information', label: 'Profile Information', icon: User, description: 'Personal details, photo, biography and contact information' },
  { id: 'engagement', label: 'Engagement', icon: BarChart3, description: 'Activity statistics, awards, and group memberships' },
  { id: 'resource_interests', label: 'Resource Interests', icon: FolderHeart, description: 'Content category preferences and subscriptions' }
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
    queryKey: ['preferences-section-order'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      const setting = allSettings.find(s => s.setting_key === 'preferences_section_order');
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
    queryKey: ['preferences-section-order-record'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      const found = allSettings.find(s => s.setting_key === 'preferences_section_order');
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
          setting_key: 'preferences_section_order',
          setting_value: orderValue,
          description: 'Order of main card sections on the Preferences page'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences-section-order'] });
      queryClient.invalidateQueries({ queryKey: ['preferences-section-order-record'] });
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
              Preferences Page Layout
            </h1>
            <p className="text-slate-600">
              Drag and drop to reorder the main card sections on the member Preferences page
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Main Card Sections</CardTitle>
            <CardDescription>
              Drag sections to change their display order. Changes will apply to all members viewing the Preferences page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {sections.map((section, index) => {
                      const IconComponent = section.icon;
                      return (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-4 p-5 bg-white border rounded-lg transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg border-blue-300' : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-2 hover:bg-slate-100 rounded"
                                data-testid={`drag-handle-${section.id}`}
                              >
                                <GripVertical className="w-5 h-5 text-slate-400" />
                              </div>
                              
                              <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg flex-shrink-0">
                                <IconComponent className="w-6 h-6 text-blue-600" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-slate-900 text-lg">{section.label}</span>
                                  <span className="text-sm text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                    Position {index + 1}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">{section.description}</p>
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

        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The Organization Logo section is only visible to organization members (not team members). 
              All other sections are visible to everyone. The content within each card remains fixed.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
