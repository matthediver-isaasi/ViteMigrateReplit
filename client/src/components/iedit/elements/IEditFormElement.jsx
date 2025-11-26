import React, { useState } from "react";
import FormRenderer from "../../forms/FormRenderer";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function IEditFormElement({ element, memberInfo, organizationInfo }) {
  const formSlug = element.content?.form_slug;
  const [formValues, setFormValues] = useState({});
  const [currentStep, setCurrentStep] = useState(0);

  const { data: form, isLoading } = useQuery({
    queryKey: ['form-embed', formSlug],
    queryFn: async () => {
      if (!formSlug) return null;
      const allForms = await base44.entities.Form.list();
      return allForms.find(f => f.slug === formSlug && f.is_active);
    },
    enabled: !!formSlug
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">Form not found or inactive</p>
        </div>
      </div>
    );
  }

  // Card swipe layout
  if (form.layout_type === 'card_swipe') {
    const currentField = form.fields[currentStep];
    const isLastStep = currentStep === form.fields.length - 1;
    const canProceed = !currentField?.required || formValues[currentField?.id];

    return (
      <Card className="border-slate-200 max-w-2xl mx-auto">
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
              memberInfo={memberInfo}
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
            <Button className="bg-blue-600 hover:bg-blue-700" disabled>
              {form.submit_button_text || 'Submit'}
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
    );
  }

  // Standard layout
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle>{form.name}</CardTitle>
        {form.description && <CardDescription className="whitespace-pre-line">{form.description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {form.fields && form.fields.map(field => (
          <FormRenderer
            key={field.id}
            field={field}
            value={formValues[field.id]}
            onChange={(value) => setFormValues({ ...formValues, [field.id]: value })}
            memberInfo={memberInfo}
            organizationInfo={organizationInfo}
          />
        ))}
        <div className="flex justify-end pt-4">
          <Button className="bg-blue-600 hover:bg-blue-700" disabled>
            {form.submit_button_text || 'Submit'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}