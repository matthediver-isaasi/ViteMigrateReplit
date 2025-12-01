import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { GripVertical, Settings, Loader2, Building2, User, BarChart3, FolderHeart, Save, RotateCcw, Eye, EyeOff, Shield, Mail, ClipboardList, Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useMemberAccess } from "@/hooks/useMemberAccess";
import { createPageUrl } from "@/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const DEFAULT_SECTION_ORDER = [
  { id: 'organization_logo', label: 'Organisation Logo', icon: Building2, description: 'Organisation branding and logo upload (shown to org members only)', visible: true },
  { id: 'profile_information', label: 'Profile Information', icon: User, description: 'Personal details, photo, biography and contact information', visible: true },
  { id: 'password_security', label: 'Password & Security', icon: Shield, description: 'Change password and account security settings', visible: true },
  { id: 'communications', label: 'Communication Preferences', icon: Mail, description: 'Marketing communication opt-in/opt-out settings based on role', visible: true },
  { id: 'additional_info', label: 'Additional Info', icon: ClipboardList, description: 'Custom preference fields defined by administrators', visible: true },
  { id: 'engagement', label: 'Engagement', icon: BarChart3, description: 'Activity statistics, awards, and group memberships', visible: true },
  { id: 'resource_interests', label: 'Resource Interests', icon: FolderHeart, description: 'Content category preferences and subscriptions', visible: true }
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
      // Handle both old format (array of strings) and new format (array of objects)
      const isNewFormat = savedOrder.length > 0 && typeof savedOrder[0] === 'object';
      
      if (isNewFormat) {
        // New format: [{ id: 'section_id', visible: true }, ...]
        const orderedSections = savedOrder
          .map(item => {
            const defaultSection = DEFAULT_SECTION_ORDER.find(s => s.id === item.id);
            if (defaultSection) {
              return { ...defaultSection, visible: item.visible !== false };
            }
            return null;
          })
          .filter(Boolean);
        
        const missingSections = DEFAULT_SECTION_ORDER.filter(
          s => !savedOrder.some(item => item.id === s.id)
        );
        
        setSections([...orderedSections, ...missingSections]);
      } else {
        // Old format: ['section_id', ...]
        const orderedSections = savedOrder
          .map(id => DEFAULT_SECTION_ORDER.find(s => s.id === id))
          .filter(Boolean);
        
        const missingSections = DEFAULT_SECTION_ORDER.filter(
          s => !savedOrder.includes(s.id)
        );
        
        setSections([...orderedSections, ...missingSections]);
      }
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
    // Save in new format with visibility
    const orderData = sections.map(s => ({ id: s.id, visible: s.visible !== false }));
    updateOrderMutation.mutate(orderData);
  };

  const handleReset = () => {
    setSections(DEFAULT_SECTION_ORDER);
    setHasChanges(true);
  };

  const handleToggleVisibility = (sectionId) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    ));
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
                      const isVisible = section.visible !== false;
                      return (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-4 p-5 bg-white border rounded-lg transition-all ${
                                snapshot.isDragging ? 'shadow-lg border-blue-300' : 'border-slate-200 hover:border-slate-300'
                              } ${!isVisible ? 'opacity-60' : ''}`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-2 hover:bg-slate-100 rounded"
                                data-testid={`drag-handle-${section.id}`}
                              >
                                <GripVertical className="w-5 h-5 text-slate-400" />
                              </div>
                              
                              <div className={`flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0 ${isVisible ? 'bg-blue-50' : 'bg-slate-100'}`}>
                                <IconComponent className={`w-6 h-6 ${isVisible ? 'text-blue-600' : 'text-slate-400'}`} />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                  <span className={`font-semibold text-lg ${isVisible ? 'text-slate-900' : 'text-slate-500'}`}>{section.label}</span>
                                  <span className="text-sm text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                    Position {index + 1}
                                  </span>
                                  {!isVisible && (
                                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded flex items-center gap-1">
                                      <EyeOff className="w-3 h-3" />
                                      Hidden
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-500 mt-1">{section.description}</p>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Label htmlFor={`visibility-${section.id}`} className="text-sm text-slate-600 cursor-pointer">
                                  {isVisible ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                                </Label>
                                <Switch
                                  id={`visibility-${section.id}`}
                                  checked={isVisible}
                                  onCheckedChange={() => handleToggleVisibility(section.id)}
                                  data-testid={`switch-visibility-${section.id}`}
                                />
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

        <CustomFieldsManager queryClient={queryClient} />
      </div>
    </div>
  );
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number (Integer)' },
  { value: 'decimal', label: 'Decimal Number' },
  { value: 'picklist', label: 'Picklist (Multiple Selection)' },
  { value: 'dropdown', label: 'Dropdown (Single Selection)' }
];

function CustomFieldsManager({ queryClient }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOptions, setFieldOptions] = useState([]);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [newOptionLabel, setNewOptionLabel] = useState('');

  const { data: preferenceFields = [], isLoading } = useQuery({
    queryKey: ['/api/entities/PreferenceField'],
    queryFn: async () => {
      const fields = await base44.entities.PreferenceField.list({
        sort: { display_order: 'asc' }
      });
      return fields || [];
    }
  });

  const createFieldMutation = useMutation({
    mutationFn: async (fieldData) => {
      return await base44.entities.PreferenceField.create(fieldData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entities/PreferenceField'] });
      toast.success('Custom field created successfully');
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create field: ' + error.message);
    }
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.PreferenceField.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entities/PreferenceField'] });
      toast.success('Custom field updated successfully');
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update field: ' + error.message);
    }
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.PreferenceField.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entities/PreferenceField'] });
      toast.success('Custom field deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete field: ' + error.message);
    }
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingField(null);
    setFieldName('');
    setFieldLabel('');
    setFieldType('text');
    setFieldRequired(false);
    setFieldOptions([]);
    setNewOptionValue('');
    setNewOptionLabel('');
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (field) => {
    setEditingField(field);
    setFieldName(field.name || '');
    setFieldLabel(field.label || '');
    setFieldType(field.field_type || 'text');
    setFieldRequired(field.is_required || false);
    setFieldOptions(field.options || []);
    setIsDialogOpen(true);
  };

  const handleAddOption = () => {
    if (!newOptionValue.trim()) return;
    const option = {
      value: newOptionValue.trim(),
      label: newOptionLabel.trim() || newOptionValue.trim()
    };
    setFieldOptions([...fieldOptions, option]);
    setNewOptionValue('');
    setNewOptionLabel('');
  };

  const handleRemoveOption = (index) => {
    setFieldOptions(fieldOptions.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!fieldName.trim() || !fieldLabel.trim()) {
      toast.error('Please provide both field name and label');
      return;
    }

    if ((fieldType === 'picklist' || fieldType === 'dropdown') && fieldOptions.length === 0) {
      toast.error('Please add at least one option for picklist/dropdown fields');
      return;
    }

    const fieldData = {
      name: fieldName.trim().toLowerCase().replace(/\s+/g, '_'),
      label: fieldLabel.trim(),
      field_type: fieldType,
      is_required: fieldRequired,
      options: (fieldType === 'picklist' || fieldType === 'dropdown') ? fieldOptions : null,
      display_order: editingField ? editingField.display_order : preferenceFields.length,
      is_active: true
    };

    if (editingField) {
      updateFieldMutation.mutate({ id: editingField.id, data: fieldData });
    } else {
      createFieldMutation.mutate(fieldData);
    }
  };

  const handleToggleActive = (field) => {
    updateFieldMutation.mutate({
      id: field.id,
      data: { is_active: !field.is_active }
    });
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Custom Preference Fields
            </CardTitle>
            <CardDescription>
              Define custom fields that appear in the "Additional Info" section on members' Preferences page
            </CardDescription>
          </div>
          <Button 
            onClick={handleOpenCreateDialog}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            data-testid="button-add-field"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : preferenceFields.length === 0 ? (
          <div className="text-center py-8 text-slate-500 border border-dashed border-slate-200 rounded-lg">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No custom fields defined yet.</p>
            <p className="text-sm mt-1">Click "Add Field" to create your first custom preference field.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {preferenceFields.map((field) => (
              <div 
                key={field.id} 
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  field.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
                data-testid={`field-item-${field.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{field.label}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                    </span>
                    {field.is_required && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Required</span>
                    )}
                    {!field.is_active && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Field name: {field.name}</p>
                  {field.options && field.options.length > 0 && (
                    <p className="text-sm text-slate-400 mt-1">
                      Options: {field.options.map(o => o.label).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={field.is_active}
                    onCheckedChange={() => handleToggleActive(field)}
                    data-testid={`switch-field-active-${field.id}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEditDialog(field)}
                    data-testid={`button-edit-field-${field.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this field? All member values for this field will also be deleted.')) {
                        deleteFieldMutation.mutate(field.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`button-delete-field-${field.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'Edit Custom Field' : 'Create Custom Field'}
            </DialogTitle>
            <DialogDescription>
              {editingField 
                ? 'Update the settings for this custom preference field.'
                : 'Add a new custom field that members can fill in on their Preferences page.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fieldLabel">Field Label *</Label>
              <Input
                id="fieldLabel"
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
                placeholder="e.g., Department, Specialization"
                data-testid="input-field-label"
              />
              <p className="text-xs text-slate-500">This is what members will see</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fieldName">Field Name *</Label>
              <Input
                id="fieldName"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g., department, specialization"
                data-testid="input-field-name"
              />
              <p className="text-xs text-slate-500">Internal identifier (lowercase, no spaces)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fieldType">Field Type *</Label>
              <Select value={fieldType} onValueChange={setFieldType}>
                <SelectTrigger data-testid="select-field-type">
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(fieldType === 'picklist' || fieldType === 'dropdown') && (
              <div className="space-y-3">
                <Label>Options</Label>
                
                {fieldOptions.length > 0 && (
                  <div className="space-y-2">
                    {fieldOptions.map((option, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 p-2 bg-slate-50 rounded border"
                      >
                        <span className="flex-1 text-sm">{option.label}</span>
                        <span className="text-xs text-slate-400">({option.value})</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(index)}
                          className="h-6 w-6"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={newOptionValue}
                    onChange={(e) => setNewOptionValue(e.target.value)}
                    placeholder="Value"
                    className="flex-1"
                    data-testid="input-option-value"
                  />
                  <Input
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                    placeholder="Label (optional)"
                    className="flex-1"
                    data-testid="input-option-label"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddOption}
                    data-testid="button-add-option"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
              <div>
                <Label htmlFor="fieldRequired" className="cursor-pointer">Required Field</Label>
                <p className="text-xs text-slate-500 mt-0.5">Members must fill in this field</p>
              </div>
              <Switch
                id="fieldRequired"
                checked={fieldRequired}
                onCheckedChange={setFieldRequired}
                data-testid="switch-field-required"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm} data-testid="button-cancel-field">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-save-field"
            >
              {(createFieldMutation.isPending || updateFieldMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editingField ? 'Update Field' : 'Create Field'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
