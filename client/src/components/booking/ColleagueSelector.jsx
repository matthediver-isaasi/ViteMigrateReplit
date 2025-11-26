
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInMinutes } from "date-fns";

export default function ColleagueSelector({ organizationId, onSelect, memberInfo }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [validating, setValidating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [organizationSynced, setOrganizationSynced] = useState(false);
  const [base44OrgId, setBase44OrgId] = useState(null);

  // Check if organization needs syncing (never synced or older than 15 minutes)
  useEffect(() => {
    const checkAndSyncIfNeeded = async () => {
      try {
        const allOrgs = await base44.entities.Organization.list();
        // organizationId might be Zoho Account ID, so we need to find by either ID or zoho_account_id
        const org = allOrgs.find(o => o.id === organizationId || o.zoho_account_id === organizationId);
        
        console.log('Looking for organization with ID:', organizationId);
        console.log('Found organization:', org);
        console.log('Base44 Org ID:', org?.id);
        console.log('Contacts synced at:', org?.contacts_synced_at);
        
        if (!org) {
          console.error('Organization not found');
          return;
        }

        setBase44OrgId(org.id);
        
        // Check if sync is needed
        const needsSync = !org.contacts_synced_at || 
                         differenceInMinutes(new Date(), new Date(org.contacts_synced_at)) > 15;
        
        if (needsSync) {
          console.log('Contacts need syncing (never synced or older than 15 minutes)');
          // Trigger sync (pass the Zoho Account ID to the sync function)
          await triggerSync(organizationId);
        } else {
          console.log('Contacts are up to date, loading from database');
          setOrganizationSynced(true);
          // Load contacts directly from database
          loadContacts(org.id);
        }
      } catch (error) {
        console.error('Failed to check org sync status:', error);
      }
    };

    if (organizationId) {
      checkAndSyncIfNeeded();
    }
  }, [organizationId]);

  const triggerSync = async (zohoAccountId) => {
    setSyncing(true);
    try {
      console.log('Triggering sync for organization:', zohoAccountId);
      const response = await base44.functions.invoke('syncOrganizationContacts', {
        organizationId: zohoAccountId
      });
      
      console.log('Sync response:', response.data);
      
      if (response.data.success) {
        setOrganizationSynced(true);
        // After sync, get the Base44 org ID and load contacts
        const allOrgs = await base44.entities.Organization.list();
        const org = allOrgs.find(o => o.zoho_account_id === zohoAccountId);
        if (org) {
          setBase44OrgId(org.id);
          await loadContacts(org.id);
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const loadContacts = async (orgId) => {
    setLoading(true);
    try {
      console.log('Loading contacts for Base44 organization ID:', orgId);
      const allContacts = await base44.entities.OrganizationContact.filter({
        organization_id: orgId,
        is_active: true
      });
      console.log('Loaded contacts:', allContacts.length);
      console.log('Sample contact:', allContacts[0]);
      setContacts(allContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    if (!searchTerm) return false;
    const search = searchTerm.toLowerCase();
    const firstNameMatch = contact.first_name?.toLowerCase().includes(search);
    const lastNameMatch = contact.last_name?.toLowerCase().includes(search);
    const emailMatch = contact.email?.toLowerCase().includes(search);
    
    return firstNameMatch || lastNameMatch || emailMatch;
  });

  const handleContactSelect = (contact) => {
    onSelect({
      email: contact.email,
      first_name: contact.first_name,
      last_name: contact.last_name,
      zoho_contact_id: contact.zoho_contact_id,
      isValid: true,
      validationStatus: 'registered'
    });
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleManualSubmit = async () => {
    if (!manualEmail || !manualEmail.includes('@')) return;

    setValidating(true);
    
    try {
      // Validate the manually entered email
      const response = await base44.functions.invoke('validateColleague', {
        email: manualEmail,
        memberEmail: memberInfo.email,
        organizationId: organizationId
      });

      if (response.data.valid) {
        onSelect({
          email: manualEmail,
          first_name: response.data.first_name || "",
          last_name: response.data.last_name || "",
          zoho_contact_id: response.data.zoho_contact_id,
          isValid: true,
          validationStatus: response.data.status,
          validationMessage: response.data.message
        });
      } else {
        onSelect({
          email: manualEmail,
          first_name: "",
          last_name: "",
          isValid: false,
          validationStatus: response.data.status,
          validationMessage: response.data.error
        });
      }
      
      setManualEmail("");
      setShowManualEntry(false);
    } catch (error) {
      onSelect({
        email: manualEmail,
        first_name: "",
        last_name: "",
        isValid: false,
        validationStatus: 'error',
        validationMessage: 'Validation failed'
      });
      setManualEmail("");
      setShowManualEntry(false);
    } finally {
      setValidating(false);
    }
  };

  if (syncing) {
    return (
      <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-sm text-slate-600">Syncing organization contacts...</p>
        <p className="text-xs text-slate-500 mt-1">This may take a moment</p>
      </div>
    );
  }

  if (showManualEntry) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Enter email address"
            type="email"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
            disabled={validating}
            autoFocus
          />
          <Button onClick={handleManualSubmit} size="sm" disabled={validating}>
            {validating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Add'
            )}
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowManualEntry(false)}
          className="text-xs"
          disabled={validating}
        >
          ← Back to search
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(e.target.value.length > 0);
          }}
          onFocus={() => searchTerm && setShowDropdown(true)}
          className="pl-10"
          disabled={loading}
        />
      </div>

      {showDropdown && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : filteredContacts.length > 0 ? (
            <>
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleContactSelect(contact)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                >
                  <div className="font-medium text-slate-900">
                    {contact.first_name} {contact.last_name}
                  </div>
                  <div className="text-sm text-slate-500">{contact.email}</div>
                </button>
              ))}
              <button
                onClick={() => {
                  setShowManualEntry(true);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-t border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2 text-blue-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Can't find them? Enter email manually</span>
                </div>
              </button>
            </>
          ) : (
            <div className="p-4">
              <p className="text-sm text-slate-500 mb-3">No matches found</p>
              <button
                onClick={() => {
                  setShowManualEntry(true);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2 text-blue-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Enter email manually</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
