
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, GripVertical, Save, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'tel', label: 'Phone' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'file', label: 'File Upload' },
  { value: 'user_name', label: 'User Name (Auto)' },
  { value: 'user_email', label: 'User Email (Auto)' },
  { value: 'user_organization', label: 'User Organization (Auto)' },
  { value: 'user_job_title', label: 'User Job Title (Auto)' },
];

export default function FormBuilderPage({ isAdmin, isFeatureExcluded }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
    layout_type: "standard",
    fields: [],
    submit_button_text: "Submit",
    success_message: "Thank you for your submission!",
    redirect_url: "",
    require_authentication: false,
    is_active: true
  });

  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const formId = urlParams.get('formId');

  const { data: existingForm, isLoading: formLoading } = useQuery({
    queryKey: ['form', formId],
    queryFn: async () => {
      if (!formId) return null;
      const allForms = await base44.entities.Form.list();
      return allForms.find(f => f.id === formId);
    },
    enabled: !!formId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (existingForm) {
      setFormData({
        name: existingForm.name || "",
        description: existingForm.description || "",
        slug: existingForm.slug || "",
        layout_type: existingForm.layout_type || "standard",
        fields: existingForm.fields ? existingForm.fields.map(field => ({
          ...field,
          allow_other: field.allow_other ?? false // Ensure allow_other is initialized, default to false
        })) : [],
        submit_button_text: existingForm.submit_button_text || "Submit",
        success_message: existingForm.success_message || "Thank you for your submission!",
        redirect_url: existingForm.redirect_url || "",
        require_authentication: existingForm.require_authentication || false,
        is_active: existingForm.is_active ?? true
      });
    }
  }, [existingForm]);

  const createFormMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Form.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form created successfully');
      window.location.href = createPageUrl('FormManagement');
    },
    onError: (error) => {
      toast.error('Failed to create form');
    }
  });

  const updateFormMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.Form.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update form');
    }
  });

  if (!isAdmin || isFeatureExcluded('page_FormBuilder')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-slate-600">Access denied. Administrator privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      placeholder: '',
      required: false,
      options: [], // For select, radio, checkbox
      allow_other: false // For select fields
    };
    setFormData({ ...formData, fields: [...formData.fields, newField] });
  };

  const updateField = (index, updates) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFormData({ ...formData, fields: newFields });
  };

  const removeField = (index) => {
    const newFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: newFields });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(formData.fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFormData({ ...formData, fields: items });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.slug) {
      toast.error('Please fill in name and slug');
      return;
    }

    if (formData.fields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }

    if (formId) {
      updateFormMutation.mutate({ id: formId, data: formData });
    } else {
      createFormMutation.mutate(formData);
    }
  };

  if (formLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to={createPageUrl('FormManagement')}>
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Forms
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              {formId ? 'Edit Form' : 'Create Form'}
            </h1>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={createFormMutation.isPending || updateFormMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {(createFormMutation.isPending || updateFormMutation.isPending) ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Form
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Settings */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200 sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Form Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Form Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contact Form"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    placeholder="contact-form"
                  />
                  <p className="text-xs text-slate-500">URL: /FormView?slug={formData.slug || 'your-slug'}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Form description..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="layout_type">Layout Type *</Label>
                  <Select
                    value={formData.layout_type}
                    onValueChange={(value) => setFormData({ ...formData, layout_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (All Fields)</SelectItem>
                      <SelectItem value="card_swipe">Card Swipe (One at a Time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submit_button_text">Submit Button Text</Label>
                  <Input
                    id="submit_button_text"
                    value={formData.submit_button_text}
                    onChange={(e) => setFormData({ ...formData, submit_button_text: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="success_message">Success Message</Label>
                  <Textarea
                    id="success_message"
                    value={formData.success_message}
                    onChange={(e) => setFormData({ ...formData, success_message: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="redirect_url">Redirect URL (Optional)</Label>
                  <Input
                    id="redirect_url"
                    type="url"
                    value={formData.redirect_url}
                    onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                    placeholder="https://example.com/thanks"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="require_authentication">Require Login</Label>
                  <Switch
                    id="require_authentication"
                    checked={formData.require_authentication}
                    onCheckedChange={(checked) => setFormData({ ...formData, require_authentication: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Fields */}
          <div className="lg:col-span-2">
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Form Fields</CardTitle>
                  <Button onClick={addField} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {formData.fields.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p className="mb-4">No fields added yet</p>
                    <Button onClick={addField} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Field
                    </Button>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="fields">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                          {formData.fields.map((field, index) => (
                            <Draggable key={field.id} draggableId={field.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                                >
                                  <div className="flex items-start gap-3">
                                    <div {...provided.dragHandleProps} className="mt-2 cursor-move">
                                      <GripVertical className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                          <Label className="text-xs">Field Type</Label>
                                          <Select
                                            value={field.type}
                                            onValueChange={(value) => updateField(index, { type: value })}
                                          >
                                            <SelectTrigger className="h-9">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {FIELD_TYPES.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                  {type.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Label</Label>
                                          <Input
                                            value={field.label}
                                            onChange={(e) => updateField(index, { label: e.target.value })}
                                            className="h-9"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-1">
                                        <Label className="text-xs">Placeholder</Label>
                                        <Input
                                          value={field.placeholder}
                                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                          className="h-9"
                                        />
                                      </div>

                                      {['select', 'radio', 'checkbox'].includes(field.type) && (
                                        <div className="space-y-1">
                                          <Label className="text-xs">Options (one per line)</Label>
                                          <Textarea
                                            value={(field.options || []).join('\n')}
                                            onChange={(e) => updateField(index, {
                                              options: e.target.value.split('\n').filter(o => o.trim())
                                            })}
                                            className="h-20 text-sm"
                                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                                          />
                                        </div>
                                      )}

                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              id={`required-${field.id}`}
                                              checked={field.required}
                                              onCheckedChange={(checked) => updateField(index, { required: checked })}
                                            />
                                            <Label htmlFor={`required-${field.id}`} className="text-xs">Required</Label>
                                          </div>
                                          {field.type === 'select' && (
                                            <div className="flex items-center gap-2">
                                              <Switch
                                                id={`allow-other-${field.id}`}
                                                checked={field.allow_other || false}
                                                onCheckedChange={(checked) => updateField(index, { allow_other: checked })}
                                              />
                                              <Label htmlFor={`allow-other-${field.id}`} className="text-xs">Allow "Other"</Label>
                                            </div>
                                          )}
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeField(index)}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
