// src/api/functions.js

// TEMPORARY MIGRATION FILE
// Base44 functions have been disabled.
// Any code that tries to call these should be migrated to Supabase or Vercel functions.

const notImplemented = (name) => () => {
    throw new Error(`Base44 function "${name}" is not implemented. Migrate this feature to Supabase/Vercel.`);
  };
  
  export const zohoOAuthCallback = notImplemented("zohoOAuthCallback");
  export const syncMemberFromCRM = notImplemented("syncMemberFromCRM");
  export const syncEventsFromBackstage = notImplemented("syncEventsFromBackstage");
  export const getZohoAuthUrl = notImplemented("getZohoAuthUrl");
  export const validateMember = notImplemented("validateMember");
  export const refreshMemberBalance = notImplemented("refreshMemberBalance");
  export const syncBackstageEvents = notImplemented("syncBackstageEvents");
  export const testFunction = notImplemented("testFunction");
  export const validateColleague = notImplemented("validateColleague");
  export const createBooking = notImplemented("createBooking");
  export const processProgramTicketPurchase = notImplemented("processProgramTicketPurchase");
  export const sendMagicLink = notImplemented("sendMagicLink");
  export const verifyMagicLink = notImplemented("verifyMagicLink");
  export const syncOrganizationContacts = notImplemented("syncOrganizationContacts");
  export const zohoContactWebhook = notImplemented("zohoContactWebhook");
  export const updateExpiredVouchers = notImplemented("updateExpiredVouchers");
  export const createStripePaymentIntent = notImplemented("createStripePaymentIntent");
  export const getStripePublishableKey = notImplemented("getStripePublishableKey");
  export const getXeroAuthUrl = notImplemented("getXeroAuthUrl");
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
  