
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Ticket, AlertCircle, PoundSterling, Wallet, CreditCard, Tag, Gift, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import VoucherSelector from "./VoucherSelector";

// Stripe promise will be initialized dynamically
let stripePromise = null;

// Stripe Payment Form Component
function StripePaymentForm({ clientSecret, onSuccess, onCancel, amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href
        },
        redirect: 'if_required'
      });

      if (submitError) {
        setError(submitError.message);
        setProcessing(false);
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error("Stripe confirmPayment error:", err);
      setError(err.message);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Amount to charge:</strong> £{amount.toFixed(2)}
        </p>
      </div>

      <div>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 mr-0.5 mt-0.5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={processing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay £${amount.toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}

export default function PaymentOptions({ 
  totalCost, 
  memberInfo, 
  organizationInfo, 
  attendees, 
  numberOfLinks, 
  event, 
  submitting, 
  setSubmitting, 
  registrationMode, 
  refreshOrganizationInfo,
  isOneOffEvent = false,
  oneOffCostDetails = null,
  ticketPrice = 0,
  isFeatureExcluded = () => false,
  selectedTicketClass = null,
  onCanProceedChange = null
}) {
  // Payment state for one-off events
  const [selectedVouchers, setSelectedVouchers] = useState([]);
  const [trainingFundAmount, setTrainingFundAmount] = useState(0);
  const [remainingBalancePaymentMethod, setRemainingBalancePaymentMethod] = useState('account');
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState(null);
  const [stripeAvailable, setStripeAvailable] = useState(false);
  const [poSupplyLater, setPoSupplyLater] = useState(false);

  // Initialize Stripe by fetching the publishable key from the backend
  useEffect(() => {
    const initStripe = async () => {
      if (stripePromise) {
        setStripeAvailable(true);
        return;
      }
      try {
        const response = await base44.functions.invoke('getStripePublishableKey');
        if (response.data.publishableKey) {
          stripePromise = loadStripe(response.data.publishableKey);
          setStripeAvailable(true);
        }
      } catch (error) {
        console.error('Failed to load Stripe publishable key:', error);
      }
    };
    initStripe();
  }, []);

  // Fetch vouchers for one-off events
  const { data: vouchers = [] } = useQuery({
    queryKey: ['vouchers', organizationInfo?.id],
    queryFn: async () => {
      if (!organizationInfo?.id) return [];
      const allVouchers = await base44.entities.ProgramTicketTransaction.list();
      return allVouchers.filter(v => 
        v.organization_id === organizationInfo.id && 
        v.transaction_type === 'voucher' && 
        v.status === 'active' &&
        (v.value || 0) > 0
      );
    },
    enabled: isOneOffEvent && !!organizationInfo?.id
  });

  // Calculate tickets required based on registration mode
  const ticketsRequired = registrationMode === 'links' ? numberOfLinks : attendees.filter(a => a.isValid).length;

  // Get available program tickets for this specific event's program
  const availableProgramTickets = event.program_tag && organizationInfo?.program_ticket_balances 
    ? (organizationInfo.program_ticket_balances[event.program_tag] || 0)
    : 0;

  // Check if we have enough tickets (for program events)
  const hasEnoughTickets = isOneOffEvent ? true : availableProgramTickets >= ticketsRequired;

  // Calculate voucher amount from selected vouchers - capped at totalCost
  const voucherAmountRaw = selectedVouchers.reduce((sum, voucherId) => {
    const voucher = vouchers.find((v) => v.id === voucherId);
    return sum + (voucher?.value || 0);
  }, 0);
  const voucherAmount = isFeatureExcluded('payment_training_vouchers') ? 0 : Math.min(voucherAmountRaw, totalCost);

  // Max available for training fund
  const maxTrainingFund = isFeatureExcluded('payment_training_fund') ? 0 : Math.min(
    organizationInfo?.training_fund_balance || 0,
    totalCost - voucherAmount
  );

  // Calculate remaining balance automatically
  const remainingBalance = Math.max(0, totalCost - voucherAmount - trainingFundAmount);

  // Handle payment allocation changes
  const handleTrainingFundChange = (value) => {
    const numValue = Math.max(0, Math.min(maxTrainingFund, parseFloat(value) || 0));
    setTrainingFundAmount(numValue);
  };

  // Check if fully paid for one-off events
  const isFullyPaid = Math.abs(remainingBalance) < 0.01 || 
    (remainingBalance > 0 && (remainingBalancePaymentMethod === 'card' || 
      (remainingBalancePaymentMethod === 'account' && (purchaseOrderNumber.trim() || poSupplyLater))));

  // Handle program event booking (existing logic)
  const handleProgramBooking = async () => {
    // Validate attendees have all required information
    if (registrationMode === 'colleagues' || registrationMode === 'self') {
      const invalidAttendees = attendees.filter(a => {
        const needsManualName = !a.isSelf && 
                               (a.validationStatus === 'unregistered_domain_match' || 
                                a.validationStatus === 'external');
        
        if (needsManualName && (!a.first_name || !a.last_name)) {
          return true;
        }
        
        return false;
      });

      if (invalidAttendees.length > 0) {
        toast.error('Please provide first and last names for all attendees');
        return;
      }
    }

    if (!hasEnoughTickets) {
      toast.error("Insufficient program tickets. Please purchase more tickets first.");
      return;
    }

    if (registrationMode === 'colleagues' && attendees.some(a => !a.isValid)) {
      toast.error("Please remove or fix invalid attendee emails");
      return;
    }

    if (ticketsRequired === 0) {
      toast.error("Please add at least one attendee or specify number of links");
      return;
    }

    setSubmitting(true);

    try {
      const response = await base44.functions.invoke('createBooking', {
        eventId: event.id,
        memberEmail: memberInfo.email,
        attendees: (registrationMode === 'colleagues' || registrationMode === 'self') ? attendees.filter(a => a.isValid) : [],
        registrationMode: registrationMode,
        numberOfLinks: registrationMode === 'links' ? numberOfLinks : 0,
        ticketsRequired: ticketsRequired,
        programTag: event.program_tag
      });

      if (response.data.success) {
        sessionStorage.removeItem(`event_registration_${event.id}`);
        
        if (refreshOrganizationInfo) {
          refreshOrganizationInfo();
        }
        
        toast.success("Booking confirmed!");
        setTimeout(() => {
          window.location.href = createPageUrl('Bookings');
        }, 1500);
      } else {
        toast.error(response.data.error || "Failed to create booking");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle one-off event booking with payment
  const handleOneOffBooking = async () => {
    // Validate attendees
    if (registrationMode === 'colleagues' || registrationMode === 'self') {
      const invalidAttendees = attendees.filter(a => {
        const needsManualName = !a.isSelf && 
                               (a.validationStatus === 'unregistered_domain_match' || 
                                a.validationStatus === 'external');
        
        if (needsManualName && (!a.first_name || !a.last_name)) {
          return true;
        }
        
        return false;
      });

      if (invalidAttendees.length > 0) {
        toast.error('Please provide first and last names for all attendees');
        return;
      }
    }

    if (registrationMode === 'colleagues' && attendees.some(a => !a.isValid)) {
      toast.error("Please remove or fix invalid attendee emails");
      return;
    }

    if (ticketsRequired === 0) {
      toast.error("Please add at least one attendee");
      return;
    }

    // If paying by card and there's a remaining balance, create Stripe payment intent
    if (remainingBalance > 0 && remainingBalancePaymentMethod === 'card') {
      setSubmitting(true);
      try {
        const response = await base44.functions.invoke('createStripePaymentIntent', {
          amount: remainingBalance,
          currency: 'gbp',
          memberEmail: memberInfo.email,
          metadata: {
            event_id: event.id,
            event_title: event.title,
            organization_id: organizationInfo?.id,
            booking_type: 'one_off_event'
          }
        });

        if (response.data.success) {
          setStripeClientSecret(response.data.clientSecret);
          setStripePaymentIntentId(response.data.paymentIntentId);
          setShowStripeModal(true);
        } else {
          toast.error("Failed to initialize payment: " + (response.data.error || "Unknown error"));
        }
      } catch (error) {
        console.error("Error creating Stripe Payment Intent:", error);
        toast.error("Failed to initialize payment");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // If paying by account, require PO number or "supply later" toggle
    if (remainingBalance > 0 && remainingBalancePaymentMethod === 'account' && !purchaseOrderNumber.trim() && !poSupplyLater) {
      toast.error("Please enter a purchase order number or select 'Supply later'");
      return;
    }

    // Process the booking
    await processOneOffBooking();
  };

  // Process one-off booking (after payment if needed)
  const processOneOffBooking = async (stripePaymentId = null) => {
    setSubmitting(true);

    try {
      const response = await base44.functions.invoke('createOneOffEventBooking', {
        eventId: event.id,
        memberEmail: memberInfo.email,
        attendees: attendees.filter(a => a.isValid),
        registrationMode: registrationMode,
        ticketsRequired: ticketsRequired,
        totalCost: totalCost,
        pricingDetails: oneOffCostDetails,
        selectedVoucherIds: isFeatureExcluded('payment_training_vouchers') ? [] : selectedVouchers,
        trainingFundAmount: isFeatureExcluded('payment_training_fund') ? 0 : trainingFundAmount,
        accountAmount: remainingBalancePaymentMethod === 'account' ? remainingBalance : 0,
        purchaseOrderNumber: remainingBalancePaymentMethod === 'account' ? purchaseOrderNumber.trim() : null,
        poToFollow: remainingBalancePaymentMethod === 'account' ? poSupplyLater : false,
        paymentMethod: remainingBalance > 0 ? remainingBalancePaymentMethod : 'fully_covered',
        stripePaymentIntentId: stripePaymentId,
        ticketClassId: selectedTicketClass?.id || null,
        ticketClassName: selectedTicketClass?.name || null,
        ticketClassPrice: selectedTicketClass?.price || ticketPrice
      });

      if (response.data.success) {
        sessionStorage.removeItem(`event_registration_${event.id}`);
        
        if (refreshOrganizationInfo) {
          refreshOrganizationInfo();
        }
        
        toast.success("Booking confirmed!");
        setTimeout(() => {
          window.location.href = createPageUrl('Bookings');
        }, 1500);
      } else {
        toast.error(response.data.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Stripe payment success
  const handleStripePaymentSuccess = async () => {
    setShowStripeModal(false);
    await processOneOffBooking(stripePaymentIntentId);
  };

  // Main submit handler
  const handleSubmit = () => {
    if (isOneOffEvent) {
      handleOneOffBooking();
    } else {
      handleProgramBooking();
    }
  };

  // Render one-off event pricing summary
  const renderOneOffPricing = () => {
    if (!isOneOffEvent || !oneOffCostDetails) return null;

    return (
      <div className="space-y-4">
        {/* Ticket Pricing Card */}
        <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50" id="booking-summary-pricing">
          <div className="flex items-center gap-2 mb-3">
            <PoundSterling className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Ticket Pricing</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">Ticket Price:</span>
              <span className="font-bold text-blue-900">£{ticketPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">Attendees:</span>
              <span className="font-bold text-blue-900">{ticketsRequired}</span>
            </div>
            
            {oneOffCostDetails.freeTickets > 0 && (
              <div className="flex items-center justify-between text-sm text-green-700">
                <span className="flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  Free Tickets:
                </span>
                <span className="font-bold">-{oneOffCostDetails.freeTickets}</span>
              </div>
            )}
            
            {oneOffCostDetails.discount > 0 && (
              <div className="flex items-center justify-between text-sm text-green-700">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Discount:
                </span>
                <span className="font-bold">-£{oneOffCostDetails.discount.toFixed(2)}</span>
              </div>
            )}
            
            {oneOffCostDetails.discountDescription && (
              <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded text-xs text-green-800">
                {oneOffCostDetails.discountDescription}
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm pt-2 border-t border-blue-200">
              <span className="text-blue-700 font-medium">Total Cost:</span>
              <span className="font-bold text-lg text-blue-900">£{totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        {totalCost > 0 && ticketsRequired > 0 && (
          <div className="space-y-4">
            {/* Vouchers */}
            {!isFeatureExcluded('payment_training_vouchers') && (
              <div className="p-4 rounded-lg border border-slate-200 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-blue-600" />
                    <Label className="text-sm font-medium">Training Vouchers</Label>
                  </div>
                  {vouchers.length > 0 && (
                    <span className="text-xs text-slate-500">
                      {vouchers.length} voucher{vouchers.length !== 1 ? 's' : ''} available
                    </span>
                  )}
                </div>
                {vouchers.length > 0 ? (
                  <>
                    <VoucherSelector
                      organizationId={organizationInfo?.id}
                      selectedVouchers={selectedVouchers}
                      onVoucherToggle={setSelectedVouchers}
                      maxAmount={totalCost}
                    />
                    {voucherAmount > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-700">Voucher Value Applied:</span>
                          <span className="font-bold text-blue-900">£{voucherAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-500">No training vouchers available for your organisation</p>
                )}
              </div>
            )}

            {/* Training Fund */}
            {!isFeatureExcluded('payment_training_fund') && (
              <div className="p-4 rounded-lg border border-slate-200 bg-green-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <Label className="text-sm font-medium">Training Fund</Label>
                  </div>
                  <span className="text-xs text-slate-500">Available: £{(organizationInfo?.training_fund_balance || 0).toFixed(2)}</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={maxTrainingFund}
                  step="0.01"
                  placeholder="Amount in £"
                  value={trainingFundAmount || ''}
                  onChange={(e) => handleTrainingFundChange(e.target.value)}
                  disabled={maxTrainingFund === 0}
                />
              </div>
            )}

            {/* Remaining Balance Payment */}
            {remainingBalance > 0 && (
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <Label className="text-sm font-medium">Pay Balance</Label>
                </div>
                
                <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Amount Due:</span>
                    <span className="text-lg font-bold text-slate-900">£{remainingBalance.toFixed(2)}</span>
                  </div>
                </div>

                <RadioGroup value={remainingBalancePaymentMethod} onValueChange={setRemainingBalancePaymentMethod}>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div
                        className="flex items-start space-x-3 p-3 rounded-lg border-2 transition-colors cursor-pointer hover:bg-slate-100"
                        style={{ borderColor: remainingBalancePaymentMethod === 'account' ? '#6366f1' : '#e2e8f0' }}
                        onClick={() => setRemainingBalancePaymentMethod('account')}
                      >
                        <RadioGroupItem value="account" id="account" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="account" className="text-sm font-medium cursor-pointer">Charge to Organisation Account</Label>
                          <p className="text-xs text-slate-500 mt-1">Requires purchase order number</p>
                        </div>
                      </div>

                      {remainingBalancePaymentMethod === 'account' && (
                        <div className="ml-6 space-y-3">
                          {!poSupplyLater && (
                            <Input
                              placeholder="Purchase Order Number *"
                              value={purchaseOrderNumber}
                              onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                              className="mt-2"
                              data-testid="input-purchase-order"
                            />
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <Switch
                              id="po-supply-later"
                              checked={poSupplyLater}
                              onCheckedChange={(checked) => {
                                setPoSupplyLater(checked);
                                if (checked) {
                                  setPurchaseOrderNumber('');
                                }
                              }}
                              data-testid="switch-po-supply-later"
                            />
                            <Label htmlFor="po-supply-later" className="text-sm cursor-pointer">
                              Supply later
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-colors ${stripeAvailable ? 'cursor-pointer hover:bg-slate-100' : 'opacity-60 cursor-not-allowed'}`}
                      style={{ borderColor: remainingBalancePaymentMethod === 'card' ? '#6366f1' : '#e2e8f0' }}
                      onClick={() => stripeAvailable && setRemainingBalancePaymentMethod('card')}
                    >
                      <RadioGroupItem value="card" id="card" className="mt-1" disabled={!stripeAvailable} />
                      <div className="flex-1">
                        <Label htmlFor="card" className={`text-sm font-medium ${stripeAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}`}>Pay by Credit/Debit Card</Label>
                        {stripeAvailable ? (
                          <p className="text-xs text-slate-500 mt-1">Secure payment via Stripe</p>
                        ) : (
                          <p className="text-xs text-amber-600 mt-1">Card payments not currently available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Payment Summary */}
            {(voucherAmount > 0 || trainingFundAmount > 0) && (
              <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
                <h4 className="text-sm font-medium text-green-900 mb-2">Payment Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-green-700">
                    <span>Total Cost:</span>
                    <span>£{totalCost.toFixed(2)}</span>
                  </div>
                  {voucherAmount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Vouchers:</span>
                      <span>-£{voucherAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {trainingFundAmount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Training Fund:</span>
                      <span>-£{trainingFundAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-green-200 font-bold text-green-900">
                    <span>Balance to Pay:</span>
                    <span>£{remainingBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render program event display (existing logic)
  const renderProgramEventDisplay = () => {
    if (isOneOffEvent) return null;

    return (
      <>
        {event.program_tag ? (
          <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50" id="booking-summary-tickets">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Program Tickets</h3>
              </div>
              <span className="text-xs text-purple-600">
                Available: {availableProgramTickets}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-700">Tickets Required:</span>
                <span className="font-bold text-purple-900">{ticketsRequired}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-700">Tickets Available:</span>
                <span className="font-bold text-purple-900">{availableProgramTickets}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-purple-200">
                <span className="text-purple-700">Remaining After Booking:</span>
                <span className={`font-bold ${hasEnoughTickets ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.max(0, availableProgramTickets - ticketsRequired)}
                </span>
              </div>
            </div>

            {!hasEnoughTickets && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-800">
                    <p className="font-medium mb-1">Insufficient tickets</p>
                    <p>You need {ticketsRequired - availableProgramTickets} more {event.program_tag} ticket{ticketsRequired - availableProgramTickets > 1 ? 's' : ''} to complete this booking.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">No Program Required</p>
                <p>This event is not associated with a program and cannot be booked through this system.</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Determine if booking can proceed
  const canProceed = isOneOffEvent 
    ? (ticketsRequired > 0 && !submitting && (totalCost === 0 || isFullyPaid))
    : (hasEnoughTickets && event.program_tag && !submitting && ticketsRequired > 0);

  // Notify parent component of canProceed state changes
  useEffect(() => {
    if (onCanProceedChange) {
      onCanProceedChange(canProceed);
    }
  }, [canProceed, onCanProceedChange]);

  return (
    <>
      <Card className="border-slate-200 shadow-lg sticky top-8">
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="text-xl">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {isOneOffEvent ? renderOneOffPricing() : renderProgramEventDisplay()}

          {/* Action Buttons */}
          {!isOneOffEvent && !hasEnoughTickets && event.program_tag && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = createPageUrl('BuyProgramTickets')}
            >
              <Ticket className="w-4 h-4 mr-2" />
              Buy {event.program_tag} Tickets
            </Button>
          )}

          <Button
            id="confirm-booking-button"
            onClick={handleSubmit}
            disabled={!canProceed}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : isOneOffEvent ? (
              totalCost > 0 ? `Book & Pay £${remainingBalance.toFixed(2)}` : 'Confirm Free Booking'
            ) : (
              'Confirm Booking'
            )}
          </Button>

          {ticketsRequired === 0 && registrationMode === 'colleagues' && (
            <p className="text-xs text-center text-slate-500">
              Add attendees to proceed with booking
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stripe Payment Modal */}
      <Dialog open={showStripeModal} onOpenChange={setShowStripeModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enter Payment Details</DialogTitle>
            <DialogDescription>
              Complete your booking by entering your card information below.
            </DialogDescription>
          </DialogHeader>
          
          {stripeClientSecret && stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
              <StripePaymentForm
                clientSecret={stripeClientSecret}
                onSuccess={handleStripePaymentSuccess}
                onCancel={() => {
                  setShowStripeModal(false);
                  setStripeClientSecret(null);
                  setStripePaymentIntentId(null);
                  setSubmitting(false);
                }}
                amount={remainingBalance}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
