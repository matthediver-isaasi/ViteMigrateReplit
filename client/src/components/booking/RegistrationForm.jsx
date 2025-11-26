import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AttendeeList from "./AttendeeList";
import PaymentOptions from "./PaymentOptions";

export default function RegistrationForm({ event, memberInfo }) {
  const [attendees, setAttendees] = useState([
    {
      email: memberInfo?.email || "",
      first_name: memberInfo?.first_name || "",
      last_name: memberInfo?.last_name || "",
      isValid: true,
      isSelf: true,
    }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addAttendee = () => {
    setAttendees([...attendees, {
      email: "",
      first_name: "",
      last_name: "",
      isValid: null,
      isSelf: false,
    }]);
  };

  const removeAttendee = (index) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const updateAttendee = (index, field, value) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
  };

  const totalCost = attendees.length * (event.ticket_price || 0);
  const validAttendees = attendees.filter(a => a.isValid);

  return (
    <Card className="border-slate-200 shadow-lg sticky top-8">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-xl">Register for Event</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Attendees</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={addAttendee}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Colleague
            </Button>
          </div>

          <AttendeeList
            attendees={attendees}
            onUpdate={updateAttendee}
            onRemove={removeAttendee}
            memberInfo={memberInfo}
          />
        </div>

        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600">Subtotal ({validAttendees.length} ticket{validAttendees.length !== 1 ? 's' : ''})</span>
            <span className="font-semibold text-slate-900">£{totalCost.toFixed(2)}</span>
          </div>
        </div>

        <PaymentOptions
          totalCost={totalCost}
          memberInfo={memberInfo}
          attendees={validAttendees}
          event={event}
          submitting={submitting}
          setSubmitting={setSubmitting}
        />
      </CardContent>
    </Card>
  );
}