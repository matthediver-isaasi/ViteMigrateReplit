// src/api/functions.js

// TEMPORARY MIGRATION FILE
// Base44 functions have been disabled.
// Any code that tries to call these should be migrated to Supabase or Vercel functions.

const notImplemented = (name) => () => {
    throw new Error(`Base44 function "${name}" is not implemented. Migrate this feature to Supabase/Vercel.`);
  };
  
  export const zohoOAuthCallback = async (params) => {
    // This is called via browser redirect, not directly from client
    throw new Error("zohoOAuthCallback is handled via browser redirect to /api/functions/zohoOAuthCallback");
  };
  
  export const syncMemberFromCRM = async (params) => {
    const response = await fetch('/api/functions/syncMemberFromCRM', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  };
  
  export const syncEventsFromBackstage = async (params) => {
    const response = await fetch('/api/functions/syncEventsFromBackstage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  };
  
  export const getZohoAuthUrl = async (params) => {
    const response = await fetch('/api/functions/getZohoAuthUrl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {})
    });
    return response.json();
  };
  export const validateMember = async (params) => {
    const response = await fetch('/api/functions/validateMember', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  };
  export const refreshMemberBalance = async (params) => {
    const response = await fetch('/api/functions/refreshMemberBalance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  };
  export const syncBackstageEvents = async (params) => {
    const response = await fetch('/api/functions/syncBackstageEvents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  };
  export const testFunction = notImplemented("testFunction");
  export const validateColleague = async (params) => {
    const response = await fetch('/api/functions/validateColleague', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  };
  export const createBooking = async (params) => {
    const response = await fetch('/api/functions/createBooking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  };
  export const processProgramTicketPurchase = async (params) => {
    const response = await fetch('/api/functions/processProgramTicketPurchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  };
  export const sendMagicLink = async (params) => {
    const response = await fetch('/api/functions/sendMagicLink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  };
  export const verifyMagicLink = async (params) => {
    const response = await fetch('/api/functions/verifyMagicLink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  };
  export const syncOrganizationContacts = async (params) => {
    const response = await fetch('/api/functions/syncOrganizationContacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  };
  export const zohoContactWebhook = async (params) => {
    const response = await fetch('/api/functions/zohoContactWebhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  };
  export const updateExpiredVouchers = async (params) => {
    const response = await fetch('/api/functions/updateExpiredVouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {})
    });
    return response.json();
  };
  export const createStripePaymentIntent = async (params) => {
    const response = await fetch('/api/functions/createStripePaymentIntent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  };
  export const getStripePublishableKey = async () => {
    const response = await fetch('/api/functions/getStripePublishableKey');
    return response.json();
  };
  export const getXeroAuthUrl = async () => {
    const response = await fetch('/api/functions/getXeroAuthUrl');
    return response.json();
  };
  export const xeroOAuthCallback = notImplemented("xeroOAuthCallback");
  export const refreshXeroToken = notImplemented("refreshXeroToken");
  export const createXeroInvoice = notImplemented("createXeroInvoice");
  export const validateUser = notImplemented("validateUser");
  export const applyDiscountCode = notImplemented("applyDiscountCode");
  export const debugBackstageEvent = notImplemented("debugBackstageEvent");
  export const processBackstageCancellation = notImplemented("processBackstageCancellation");
  export const cancelBackstageOrder = notImplemented("cancelBackstageOrder");
  export const cancelTicketViaFlow = notImplemented("cancelTicketViaFlow");
  export const updateEventImage = notImplemented("updateEventImage");
  export const updateProgramDetails = notImplemented("updateProgramDetails");
  export const testEmailAddressInBackstage = notImplemented("testEmailAddressInBackstage");
  export const clearBookings = notImplemented("clearBookings");
  export const clearProgramTicketTransactions = notImplemented("clearProgramTicketTransactions");
  export const cancelProgramTicketTransaction = notImplemented("cancelProgramTicketTransaction");
  export const reinstateProgramTicketTransaction = notImplemented("reinstateProgramTicketTransaction");
  export const checkMemberStatusByEmail = notImplemented("checkMemberStatusByEmail");
  export const createJobPostingMember = notImplemented("createJobPostingMember");
  export const createJobPostingNonMember = notImplemented("createJobPostingNonMember");
  export const handleJobPostingPaymentWebhook = notImplemented("handleJobPostingPaymentWebhook");
  export const createJobPostingPaymentIntent = notImplemented("createJobPostingPaymentIntent");
  export const renameResourceSubcategory = notImplemented("renameResourceSubcategory");
  export const generateMemberHandles = notImplemented("generateMemberHandles");
  export const extractAndUploadFont = notImplemented("extractAndUploadFont");
  export const enableLoginForAllMembers = notImplemented("enableLoginForAllMembers");
  export const sendTeamMemberInvite = notImplemented("sendTeamMemberInvite");
  export const exportAllData = notImplemented("exportAllData");
  export const generateSitemap = notImplemented("generateSitemap");
  