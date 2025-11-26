import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import FormRenderer from "../components/forms/FormRenderer";
import { toast } from "sonner";
import { useMemberAccess } from "@/hooks/useMemberAccess";

export default function FormViewPage() {
  const { memberInfo, organizationInfo } = useMemberAccess();

  const [currentStep, setCurrentStep] = useState(0);
  const [formValues, setFormValues] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const formSlug = urlParams.get('slug');

  // Fetch full member record to get job_title
  const { data: memberRecord } = useQuery({
    queryKey: ['member-record', memberInfo?.email],
    queryFn: async () => {
      const allMembers = await base44.entities.Member.list();
      return allMembers.find(m => m.email === memberInfo?.email);
    },
    enabled: !!memberInfo?.email
  });

  const { data: form, isLoading } = useQuery({
    queryKey: ['form-by-slug', formSlug],
    queryFn: async () => {
      const allForms = await base44.entities.Form.list();
      return allForms.find(f => f.slug === formSlug && f.is_active);
    },
    enabled: !!formSlug
  });

  const submitFormMutation = useMutation({
    mutationFn: async (submissionData) => {
      return await base44.entities.FormSubmission.create(submissionData);
    },
    onSuccess: async () => {
      // Increment form submission count
      if (form) {
        await base44.entities.Form.update(form.id, {
          submission_count: (form.submission_count || 0) + 1
        });
      }
      queryClient.invalidateQueries({ queryKey: ['form-by-slug'] });
      setSubmitted(true);
      
      if (form?.redirect_url) {
        setTimeout(() => {
          window.location.href = form.redirect_url;
        }, 2000);
      }
    },
    onError: (error) => {
      toast.error('Failed to submit form');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-slate-600">Form not found or is not active.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (form.require_authentication && !memberInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-slate-600">Please log in to access this form.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async () => {
    // Validate required fields
    const missingFields = form.fields.filter(field => 
      field.required && (!formValues[field.id] || formValues[field.id].length === 0)
    );

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    const submissionData = {
      form_id: form.id,
      form_name: form.name,
      submitted_by_email: memberInfo?.email || null,
      submitted_by_name: memberInfo ? `${memberInfo.first_name} ${memberInfo.last_name}` : null,
      submission_data: formValues
    };

    submitFormMutation.mutate(submissionData);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md border-green-200">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Success!</h3>
            <p className="text-slate-600">{form.success_message}</p>
            {form.redirect_url && (
              <p className="text-sm text-slate-500 mt-4">Redirecting...</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use memberRecord (full data) if available, otherwise fallback to memberInfo
  const memberData = memberRecord || memberInfo;

  if (form.layout_type === 'card_swipe') {
    const currentField = form.fields[currentStep];
    const isLastStep = currentStep === form.fields.length - 1;
    const canProceed = !currentField?.required || formValues[currentField?.id];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-2xl w-full border-slate-200">
          <CardHeader>
            <CardTitle>{form.name}</CardTitle>
            {form.description && <CardDescription className="whitespace-pre-line">{form.description}</CardDescription>}
            <div className="flex gap-1 mt-4">
              {form.fields.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded ${
                    index <= currentStep ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            {currentField && (
              <FormRenderer
                field={currentField}
                value={formValues[currentField.id]}
                onChange={(value) => setFormValues({ ...formValues, [currentField.id]: value })}
                memberInfo={memberData}
                organizationInfo={organizationInfo}
              />
            )}
          </CardContent>
          <div className="p-6 pt-0 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed || submitFormMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitFormMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  form.submit_button_text
                )}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Standard layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>{form.name}</CardTitle>
            {form.description && <CardDescription className="whitespace-pre-line">{form.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-6">
            {form.fields.map(field => (
              <FormRenderer
                key={field.id}
                field={field}
                value={formValues[field.id]}
                onChange={(value) => setFormValues({ ...formValues, [field.id]: value })}
                memberInfo={memberData}
                organizationInfo={organizationInfo}
              />
            ))}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSubmit}
                disabled={submitFormMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitFormMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  form.submit_button_text
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}