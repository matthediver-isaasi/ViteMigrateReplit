import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

// List of all available feature IDs in the system
// Note: Feature IDs now include section prefixes (page_user_* or page_admin_*) to match PortalMenu structure
const AVAILABLE_FEATURES = [
  // User Navigation Items
  { id: "page_user_BuyProgramTickets", label: "Buy Tickets", category: "User Navigation" },
  { id: "page_user_Events", label: "Browse Events", category: "User Navigation" },
  { id: "page_user_Bookings", label: "Bookings", category: "User Navigation" },
  { id: "page_user_MyTickets", label: "My Tickets", category: "User Navigation" },
  { id: "page_user_Balances", label: "Balances", category: "User Navigation" },
  { id: "page_user_History", label: "History", category: "User Navigation" },
  { id: "page_user_Team", label: "Team", category: "User Navigation" },
  { id: "page_user_MemberDirectory", label: "Member Directory", category: "User Navigation" },
  { id: "page_user_OrganisationDirectory", label: "Organisation Directory", category: "User Navigation" },
  { id: "page_user_Resources", label: "Resources", category: "User Navigation" },
  { id: "page_user_ArticlesSection", label: "Articles Section (Parent)", category: "User Navigation" },
  { id: "page_user_MyArticles", label: "My Articles", category: "User Navigation" },
  { id: "page_user_Articles", label: "Articles", category: "User Navigation" },
  { id: "page_user_News", label: "News", category: "User Navigation" },
  { id: "page_user_MyJobPostings", label: "My Job Postings", category: "User Navigation" },
  { id: "page_user_Preferences", label: "Preferences", category: "User Navigation" },
  { id: "page_user_Support", label: "Support", category: "User Navigation" },
  
  // Admin Navigation Items
  { id: "page_admin_NewsSection", label: "News Section (Parent)", category: "Admin Navigation" },
  { id: "page_admin_MyNews", label: "News Management", category: "Admin Navigation" },
  { id: "page_admin_NewsSettings", label: "News Settings", category: "Admin Navigation" },
  { id: "page_admin_ArticlesSection", label: "Articles Section (Parent)", category: "Admin Navigation" },
  { id: "page_admin_ArticleManagement", label: "All Articles", category: "Admin Navigation" },
  { id: "page_admin_ArticlesSettings", label: "Articles Settings", category: "Admin Navigation" },
  { id: "page_admin_RoleManagement", label: "Role Management", category: "Admin Navigation" },
  { id: "page_admin_MemberRoleAssignment", label: "Assign Member Roles", category: "Admin Navigation" },
  { id: "page_admin_TeamMemberManagement", label: "Team Members", category: "Admin Navigation" },
  { id: "page_admin_MemberHandleManagement", label: "Member Handle Management", category: "Admin Navigation" },
  { id: "page_admin_MemberDirectorySettings", label: "Member Directory Settings", category: "Admin Navigation" },
  { id: "page_admin_DiscountCodeManagement", label: "Discount Codes", category: "Admin Navigation" },
  { id: "page_admin_EventSettings", label: "Event Settings", category: "Admin Navigation" },
  { id: "page_admin_TicketSalesAnalytics", label: "Ticket Sales Analytics", category: "Admin Navigation" },
  { id: "page_admin_AwardManagement", label: "Award Management", category: "Admin Navigation" },
  { id: "page_admin_CategoryManagement", label: "Category Management", category: "Admin Navigation" },
  { id: "page_admin_ResourceSettings", label: "Category Setup", category: "Admin Navigation" },
  { id: "page_admin_ResourcesSection", label: "Resource Management Section (Parent)", category: "Admin Navigation" },
  { id: "page_admin_ResourceManagement", label: "Resources", category: "Admin Navigation" },
  { id: "page_admin_TagManagement", label: "Tags", category: "Admin Navigation" },
  { id: "page_admin_FileManagement", label: "File Repository", category: "Admin Navigation" },
  { id: "page_admin_JobBoardSection", label: "Job Board Section (Parent)", category: "Admin Navigation" },
  { id: "page_admin_JobPostingManagement", label: "Job Postings", category: "Admin Navigation" },
  { id: "page_admin_JobBoardSettings", label: "Job Board Settings", category: "Admin Navigation" },
  { id: "page_admin_PageBuilder", label: "Page Builder Section (Parent)", category: "Admin Navigation" },
  { id: "page_admin_IEditPageManagement", label: "Pages", category: "Admin Navigation" },
  { id: "page_admin_IEditTemplateManagement", label: "Element Templates", category: "Admin Navigation" },
  { id: "page_admin_PageBannerManagement", label: "Page Banners", category: "Admin Navigation" },
  { id: "page_admin_NavigationManagement", label: "Navigation Items", category: "Admin Navigation" },
  { id: "page_admin_ButtonElements", label: "Buttons", category: "Admin Navigation" },
  { id: "page_admin_ButtonStyleManagement", label: "Button Styles", category: "Admin Navigation" },
  { id: "page_admin_WallOfFameManagement", label: "Wall of Fame", category: "Admin Navigation" },
  { id: "page_admin_InstalledFonts", label: "Installed Fonts", category: "Admin Navigation" },
  { id: "page_admin_FormsSection", label: "Forms Section (Parent)", category: "Admin Navigation" },
  { id: "page_admin_FormManagement", label: "Form Management", category: "Admin Navigation" },
  { id: "page_admin_FormSubmissions", label: "View Submissions", category: "Admin Navigation" },
  { id: "page_admin_FloaterManagement", label: "Floater Management", category: "Admin Navigation" },
  { id: "page_admin_TeamInviteSettings", label: "Team Invite Settings", category: "Admin Navigation" },
  { id: "page_admin_DataExport", label: "Data Export", category: "Admin Navigation" },
  { id: "page_admin_SiteMap", label: "Site Map", category: "Admin Navigation" },
  { id: "page_admin_SupportManagement", label: "Support Management", category: "Admin Navigation" },
  { id: "page_admin_PortalNavigationManagement", label: "Portal Navigation (Legacy)", category: "Admin Navigation" },
  { id: "page_admin_PortalMenuManagement", label: "Portal Menu Management", category: "Admin Navigation" },
  { id: "page_admin_TourManagement", label: "Tour Management", category: "Admin Navigation" },
  { id: "page_admin_MemberGroupManagement", label: "Member Groups", category: "Admin Navigation" },
  
  // Standalone Pages (not in navigation menus)
  { id: "page_Dashboard", label: "Dashboard Page", category: "Standalone Pages" },
  { id: "page_EventDetails", label: "Event Details Page", category: "Standalone Pages" },
  { id: "page_ArticleEditor", label: "Article Editor Page", category: "Standalone Pages" },
  { id: "page_ArticleView", label: "Article View Page", category: "Standalone Pages" },
  { id: "page_NewsEditor", label: "News Editor Page", category: "Standalone Pages" },
  { id: "page_NewsView", label: "News View Page", category: "Standalone Pages" },
  { id: "page_IEditPageEditor", label: "Page Builder Editor", category: "Standalone Pages" },
  { id: "page_GuestWriterManagement", label: "Guest Writer Management", category: "Standalone Pages" },
  { id: "page_OrganisationDirectorySettings", label: "Organisation Directory Settings", category: "Standalone Pages" },
  
  // UI Elements
  { id: "element_EventDescription", label: "Event Description Element", category: "UI Elements" },
  { id: "element_EventsPageDescription", label: "Events Page Description", category: "UI Elements" },
  { id: "element_EventsSearch", label: "Events Page Search & Filters", category: "UI Elements" },
  { id: "element_SelfRegistration", label: "Self Registration for Events", category: "UI Elements" },
  { id: "element_PurchaseButton", label: "Purchase Button", category: "UI Elements" },
  { id: "element_AvailableSeatsDisplay", label: "Event Available Seats Display", category: "UI Elements" },
  { id: "element_FloatersDisplay", label: "Floater Elements Display", category: "UI Elements" },
  { id: "element_NewsTickerBar", label: "News Ticker Bar", category: "UI Elements" },
  
  // Payment Options
  { id: "payment_training_vouchers", label: "Use Training Vouchers for Purchases", category: "Payment Options" },
  { id: "payment_training_fund", label: "Use Training Fund for Purchases", category: "Payment Options" }
  ];

export default function RoleManagementPage() {
  const [editingRole, setEditingRole] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [accessChecked, setAccessChecked] = useState(false);

  const queryClient = useQueryClient();

  // Get member info from sessionStorage (same source as Layout)
  const memberInfo = React.useMemo(() => {
    const stored = sessionStorage.getItem('agcas_member');
    return stored ? JSON.parse(stored) : null;
  }, []);

  // Fetch member role if member has a role_id
  const { data: memberRole } = useQuery({
    queryKey: ['memberRole', memberInfo?.role_id],
    enabled: !!(memberInfo && memberInfo.role_id),
    staleTime: Infinity,
    queryFn: async () => {
      if (!memberInfo || !memberInfo.role_id) return null;
      try {
        const data = await base44.entities.Role.get(memberInfo.role_id);
        return data || null;
      } catch (error) {
        console.error('Error loading memberRole:', error);
        return null;
      }
    },
  });

  // Determine if user is admin
  const isAdmin = memberRole?.is_admin === true;

  // Check if feature is excluded for the user's role
  const isFeatureExcluded = (featureId) => {
    if (!memberInfo || !featureId) return false;
    const roleExclusions = memberRole?.excluded_features || [];
    const memberExclusions = memberInfo.member_excluded_features || [];
    return roleExclusions.includes(featureId) || memberExclusions.includes(featureId);
  };

  // Redirect non-super-admins (check both isAdmin and feature exclusion)
  useEffect(() => {
    // Wait for memberInfo to be loaded before checking access
    if (memberInfo !== null && memberInfo !== undefined) {
      // If member has a role_id, wait for memberRole to load
      if (memberInfo.role_id && (memberRole === null || memberRole === undefined)) {
        return; // Still waiting for role to load
      }
      
      // Now we can check access - either role is loaded or member has no role
      if (!isAdmin || isFeatureExcluded('page_RoleManagement')) {
        window.location.href = createPageUrl('Events');
      } else {
        setAccessChecked(true);
      }
    }
  }, [isAdmin, memberRole, memberInfo]);

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list(),
    initialData: [],
  });

  const createRoleMutation = useMutation({
    mutationFn: (roleData) => base44.entities.Role.create(roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowDialog(false);
      setEditingRole(null);
      toast.success('Role created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create role: ' + error.message);
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, roleData }) => base44.entities.Role.update(id, roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowDialog(false);
      setEditingRole(null);
      toast.success('Role updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update role: ' + error.message);
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowDeleteConfirm(false);
      setRoleToDelete(null);
      toast.success('Role deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete role: ' + error.message);
    }
  });

  const handleCreateNew = () => {
    setEditingRole({
      name: "",
      description: "",
      excluded_features: [],
      is_default: false,
      is_admin: false,
      show_tours: true,
      default_landing_page: "Events",
      layout_theme: "default"
    });
    setShowDialog(true);
  };

  const handleEdit = (role) => {
    setEditingRole({ ...role });
    setShowDialog(true);
  };

  const handleDelete = (role) => {
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  const handleSave = () => {
    if (!editingRole.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    if (editingRole.id) {
      updateRoleMutation.mutate({
        id: editingRole.id,
        roleData: {
          name: editingRole.name,
          description: editingRole.description,
          excluded_features: editingRole.excluded_features,
          is_default: editingRole.is_default,
          is_admin: editingRole.is_admin,
          show_tours: editingRole.show_tours,
          default_landing_page: editingRole.default_landing_page || "Events",
          layout_theme: editingRole.layout_theme || "default",
          requires_effective_from_date: editingRole.requires_effective_from_date || false
        }
      });
    } else {
      createRoleMutation.mutate({
        name: editingRole.name,
        description: editingRole.description,
        excluded_features: editingRole.excluded_features,
        is_default: editingRole.is_default,
        is_admin: editingRole.is_admin,
        show_tours: editingRole.show_tours,
        default_landing_page: editingRole.default_landing_page || "Events",
        layout_theme: editingRole.layout_theme || "default",
        requires_effective_from_date: editingRole.requires_effective_from_date || false
      });
    }
  };

  const toggleFeature = (featureId) => {
    const excluded = editingRole.excluded_features || [];
    const newExcluded = excluded.includes(featureId)
      ? excluded.filter(id => id !== featureId)
      : [...excluded, featureId];

    setEditingRole({ ...editingRole, excluded_features: newExcluded });
  };

  // Group features by category
  const featuresByCategory = AVAILABLE_FEATURES.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {});

  // Show loading state while determining access
  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <div className="animate-pulse text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Role Management
            </h1>
            <p className="text-slate-600">
              Define roles and control what features members can access
            </p>
          </div>
          <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading roles...</div>
        ) : roles.length === 0 ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No Roles Yet
              </h3>
              <p className="text-slate-600 mb-6">
                Create your first role to start managing member access
              </p>
              <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create First Role
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {role.is_default && (
                          <Badge className="bg-green-100 text-green-700">Default Role</Badge>
                        )}
                        {role.is_admin && (
                          <Badge className="bg-amber-100 text-amber-700">Administrator</Badge>
                        )}
                        {role.show_tours && (
                          <Badge className="bg-purple-100 text-purple-700">Tours Enabled</Badge>
                        )}
                        {role.requires_effective_from_date && (
                          <Badge className="bg-blue-100 text-blue-700">Effective From Required</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {role.description && (
                    <p className="text-sm text-slate-600 mb-4">{role.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="text-xs font-medium text-slate-500 uppercase">Restrictions</div>
                    {role.excluded_features && role.excluded_features.length > 0 ? (
                      <div className="text-sm text-slate-700">
                        {role.excluded_features.length} feature{role.excluded_features.length > 1 ? 's' : ''} restricted
                      </div>
                    ) : (
                      <div className="text-sm text-green-600">Full access</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(role)}
                      className="flex-1"
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(role)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit/Create Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole?.id ? 'Edit Role' : 'Create New Role'}
              </DialogTitle>
            </DialogHeader>

            {editingRole && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="role-name">Role Name *</Label>
                  <Input
                    id="role-name"
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                    placeholder="e.g., Standard Member"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role-description">Description</Label>
                  <Textarea
                    id="role-description"
                    value={editingRole.description || ''}
                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                    placeholder="Describe what this role includes..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landing-page">Default Landing Page</Label>
                  <Select
                    value={editingRole.default_landing_page || "Events"}
                    onValueChange={(value) => setEditingRole({ ...editingRole, default_landing_page: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select landing page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Events">Browse Events</SelectItem>
                      <SelectItem value="Dashboard">Dashboard</SelectItem>
                      <SelectItem value="Bookings">Bookings</SelectItem>
                      <SelectItem value="Balances">Balances</SelectItem>
                      <SelectItem value="BuyProgramTickets">Buy Program Tickets</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                      <SelectItem value="Resources">Resources</SelectItem>
                      <SelectItem value="Articles">Articles</SelectItem>
                      <SelectItem value="MyArticles">My Articles</SelectItem>
                      <SelectItem value="MyJobPostings">My Job Postings</SelectItem>
                      <SelectItem value="Team">Team</SelectItem>
                      <SelectItem value="MemberDirectory">Member Directory</SelectItem>
                      <SelectItem value="OrganisationDirectory">Organisation Directory</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    The page users with this role will see after logging in
                  </p>
                </div>

                {/* New Layout Theme Selection */}
                <div className="space-y-2">
                  <Label htmlFor="layout-theme">Layout Theme</Label>
                  <Select
                    value={editingRole.layout_theme || "default"}
                    onValueChange={(value) => setEditingRole({ ...editingRole, layout_theme: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Theme</SelectItem>
                      <SelectItem value="new_header">New Header Theme</SelectItem>
                      <SelectItem value="bare_home">Bare Home Page Layout</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Visual theme/layout to apply for users with this role
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <Switch
                      id="is-default"
                      checked={editingRole.is_default || false}
                      onCheckedChange={(checked) => setEditingRole({ ...editingRole, is_default: checked })}
                    />
                    <div className="flex-1">
                      <Label htmlFor="is-default" className="cursor-pointer">Default Role</Label>
                      <p className="text-xs text-slate-500 mt-1">
                        Automatically assign this role to new members
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <Switch
                      id="is-admin"
                      checked={editingRole.is_admin || false}
                      onCheckedChange={(checked) => setEditingRole({ ...editingRole, is_admin: checked })}
                    />
                    <div className="flex-1">
                      <Label htmlFor="is-admin" className="cursor-pointer font-medium text-amber-900">Administrator Role</Label>
                      <p className="text-xs text-amber-700 mt-1">
                        Grant full admin access to manage roles and members
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <Switch
                      id="show-tours"
                      checked={editingRole.show_tours !== false} // Ensure it's true if undefined/null, false only if explicitly false
                      onCheckedChange={(checked) => setEditingRole({ ...editingRole, show_tours: checked })}
                    />
                    <div className="flex-1">
                      <Label htmlFor="show-tours" className="cursor-pointer font-medium text-purple-900">Enable Page Tours</Label>
                      <p className="text-xs text-purple-700 mt-1">
                        Show guided tours to users with this role
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Switch
                      id="requires-effective-from"
                      checked={editingRole.requires_effective_from_date || false}
                      onCheckedChange={(checked) => setEditingRole({ ...editingRole, requires_effective_from_date: checked })}
                    />
                    <div className="flex-1">
                      <Label htmlFor="requires-effective-from" className="cursor-pointer font-medium text-blue-900">Requires Effective From Date</Label>
                      <p className="text-xs text-blue-700 mt-1">
                        Require an "Effective From" date when assigning this role (e.g., for Alumni)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base">Feature Restrictions</Label>
                    <p className="text-sm text-slate-500 mt-1 mb-4">
                      Select features that members with this role should NOT have access to
                    </p>
                  </div>

                  {Object.entries(featuresByCategory).map(([category, features]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-700">{category}</h4>
                      <div className="space-y-2 pl-4">
                        {features.map((feature) => (
                          <div
                            key={feature.id}
                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <Switch
                              id={feature.id}
                              checked={(editingRole.excluded_features || []).includes(feature.id)}
                              onCheckedChange={() => toggleFeature(feature.id)}
                            />
                            <Label htmlFor={feature.id} className="flex-1 cursor-pointer">
                              {feature.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingRole(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingRole?.id ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-900 font-medium">
                    Are you sure you want to delete "{roleToDelete?.name}"?
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Members assigned to this role will lose their role assignment.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRoleToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => roleToDelete && deleteRoleMutation.mutate(roleToDelete.id)}
                disabled={deleteRoleMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}