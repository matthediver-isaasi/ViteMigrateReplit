// Base44 SDK Replacement for Replit
// This adapter provides the same interface as the Base44 SDK but uses
// our Express backend which communicates with Supabase directly

class EntityProxy {
  constructor(entityName, apiRequest) {
    this.entityName = entityName;
    this.apiRequest = apiRequest;
  }

  async list(options = {}) {
    const params = new URLSearchParams();
    if (options.filter) params.set('filter', JSON.stringify(options.filter));
    if (options.sort) params.set('sort', JSON.stringify(options.sort));
    if (options.limit) params.set('limit', options.limit);
    if (options.offset) params.set('offset', options.offset);
    if (options.expand) params.set('expand', options.expand);
    
    const queryString = params.toString();
    const url = `/api/entities/${this.entityName}${queryString ? `?${queryString}` : ''}`;
    const response = await this.apiRequest(url);
    return response;
  }

  async get(id, options = {}) {
    const params = new URLSearchParams();
    if (options.expand) params.set('expand', options.expand);
    
    const queryString = params.toString();
    const url = `/api/entities/${this.entityName}/${id}${queryString ? `?${queryString}` : ''}`;
    const response = await this.apiRequest(url);
    return response;
  }

  async create(data) {
    const response = await this.apiRequest(`/api/entities/${this.entityName}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    return response;
  }

  async update(id, data) {
    const response = await this.apiRequest(`/api/entities/${this.entityName}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    return response;
  }

  async delete(id) {
    const response = await this.apiRequest(`/api/entities/${this.entityName}/${id}`, {
      method: 'DELETE'
    });
    return response;
  }

  async filter(filterObj) {
    return this.list({ filter: filterObj });
  }
}

class FunctionsProxy {
  constructor(apiRequest) {
    this.apiRequest = apiRequest;
  }

  async invoke(functionName, params = {}) {
    const response = await this.apiRequest(`/api/functions/${functionName}`, {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' }
    });
    return { data: response };
  }
}

class AuthProxy {
  constructor(apiRequest) {
    this.apiRequest = apiRequest;
    this._currentUser = null;
    this._listeners = [];
  }

  async me() {
    try {
      const response = await this.apiRequest('/api/auth/me');
      this._currentUser = response;
      return response;
    } catch (error) {
      this._currentUser = null;
      return null;
    }
  }

  async isLoggedIn() {
    try {
      const user = await this.me();
      return !!user;
    } catch {
      return false;
    }
  }

  async logout() {
    await this.apiRequest('/api/auth/logout', { method: 'POST' });
    this._currentUser = null;
    this._notifyListeners(null);
  }

  onAuthStateChange(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(l => l !== callback);
    };
  }

  _notifyListeners(user) {
    this._listeners.forEach(callback => callback(user));
  }
}

class EntitiesProxy {
  constructor(apiRequest) {
    this.apiRequest = apiRequest;
    this._cache = {};
  }

  _getEntity(name) {
    if (!this._cache[name]) {
      this._cache[name] = new EntityProxy(name, this.apiRequest);
    }
    return this._cache[name];
  }

  // Define all entity accessors
  get Member() { return this._getEntity('Member'); }
  get Organization() { return this._getEntity('Organization'); }
  get Event() { return this._getEntity('Event'); }
  get ZohoToken() { return this._getEntity('ZohoToken'); }
  get Booking() { return this._getEntity('Booking'); }
  get ProgramTicketTransaction() { return this._getEntity('ProgramTicketTransaction'); }
  get MagicLink() { return this._getEntity('MagicLink'); }
  get OrganizationContact() { return this._getEntity('OrganizationContact'); }
  get Program() { return this._getEntity('Program'); }
  get Voucher() { return this._getEntity('Voucher'); }
  get XeroToken() { return this._getEntity('XeroToken'); }
  get BlogPost() { return this._getEntity('BlogPost'); }
  get Role() { return this._getEntity('Role'); }
  get TeamMember() { return this._getEntity('TeamMember'); }
  get DiscountCode() { return this._getEntity('DiscountCode'); }
  get DiscountCodeUsage() { return this._getEntity('DiscountCodeUsage'); }
  get SystemSettings() { return this._getEntity('SystemSettings'); }
  get TourGroup() { return this._getEntity('TourGroup'); }
  get TourStep() { return this._getEntity('TourStep'); }
  get Resource() { return this._getEntity('Resource'); }
  get ResourceCategory() { return this._getEntity('ResourceCategory'); }
  get FileRepository() { return this._getEntity('FileRepository'); }
  get ResourceAuthorSettings() { return this._getEntity('ResourceAuthorSettings'); }
  get JobPosting() { return this._getEntity('JobPosting'); }
  get PageBanner() { return this._getEntity('PageBanner'); }
  get IEditPage() { return this._getEntity('IEditPage'); }
  get IEditPageElement() { return this._getEntity('IEditPageElement'); }
  get IEditElementTemplate() { return this._getEntity('IEditElementTemplate'); }
  get ResourceFolder() { return this._getEntity('ResourceFolder'); }
  get FileRepositoryFolder() { return this._getEntity('FileRepositoryFolder'); }
  get NavigationItem() { return this._getEntity('NavigationItem'); }
  get ArticleCategory() { return this._getEntity('ArticleCategory'); }
  get ArticleComment() { return this._getEntity('ArticleComment'); }
  get CommentReaction() { return this._getEntity('CommentReaction'); }
  get ArticleReaction() { return this._getEntity('ArticleReaction'); }
  get ArticleView() { return this._getEntity('ArticleView'); }
  get ButtonStyle() { return this._getEntity('ButtonStyle'); }
  get Award() { return this._getEntity('Award'); }
  get OfflineAward() { return this._getEntity('OfflineAward'); }
  get OfflineAwardAssignment() { return this._getEntity('OfflineAwardAssignment'); }
  get WallOfFameSection() { return this._getEntity('WallOfFameSection'); }
  get WallOfFameCategory() { return this._getEntity('WallOfFameCategory'); }
  get WallOfFamePerson() { return this._getEntity('WallOfFamePerson'); }
  get Floater() { return this._getEntity('Floater'); }
  get Form() { return this._getEntity('Form'); }
  get FormSubmission() { return this._getEntity('FormSubmission'); }
  get NewsPost() { return this._getEntity('NewsPost'); }
  get SupportTicket() { return this._getEntity('SupportTicket'); }
  get SupportTicketResponse() { return this._getEntity('SupportTicketResponse'); }
  get PortalNavigationItem() { return this._getEntity('PortalNavigationItem'); }
  get MemberGroup() { return this._getEntity('MemberGroup'); }
  get MemberGroupAssignment() { return this._getEntity('MemberGroupAssignment'); }
  get GuestWriter() { return this._getEntity('GuestWriter'); }
  get PortalMenu() { return this._getEntity('PortalMenu'); }
  get AwardClassification() { return this._getEntity('AwardClassification'); }
  get AwardSublevel() { return this._getEntity('AwardSublevel'); }
  get MemberGroupGuest() { return this._getEntity('MemberGroupGuest'); }
}

class Base44Client {
  constructor(options = {}) {
    this.options = options;
    this._apiRequest = this._apiRequest.bind(this);
    this.entities = new EntitiesProxy(this._apiRequest);
    this.functions = new FunctionsProxy(this._apiRequest);
    this.auth = new AuthProxy(this._apiRequest);
  }

  async _apiRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || error.error || 'Request failed');
    }

    return response.json();
  }
}

export const base44 = new Base44Client({
  appId: "iconnect-agcas",
  requiresAuth: false
});

// For compatibility with existing code that imports createClient
export function createClient(options) {
  return new Base44Client(options);
}
