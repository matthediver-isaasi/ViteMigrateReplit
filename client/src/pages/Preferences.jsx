import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient"; // or your actual client path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  X,
  Upload,
  User,
  Calendar,
  FileText,
  Briefcase,
  Trophy,
  Building2,
  Users,
  CalendarDays,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import ResourceFilter from "../components/resources/ResourceFilter";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

// --- Helper: upload to Supabase Storage and return public URL ---
async function uploadImageToSupabase(file, bucket, folderPrefix = "") {
  const fileExt = file.name.split(".").pop();
  const fileName = `${folderPrefix ? `${folderPrefix}/` : ""}${Date.now()}-${Math
    .random()
    .toString(36)
    .slice(2)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicData.publicUrl;
}

export default function PreferencesPage() {
  // Resource prefs
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [biography, setBiography] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [hasUnsavedProfile, setHasUnsavedProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showInDirectory, setShowInDirectory] = useState(true);

  // Organisation logo state
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState("");
  const [isUploadingOrgLogo, setIsUploadingOrgLogo] = useState(false);
  const [hasUnsavedOrgLogo, setHasUnsavedOrgLogo] = useState(false);

  const queryClient = useQueryClient();

  // --- Get current user from sessionStorage (set by TestLogin/VerifyMagicLink) ---
  const [sessionMember, setSessionMember] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const storedMember = sessionStorage.getItem('agcas_member');
    if (storedMember) {
      try {
        const parsed = JSON.parse(storedMember);
        // Check if session is still valid
        if (parsed.sessionExpiry && new Date(parsed.sessionExpiry) > new Date()) {
          setSessionMember(parsed);
        }
      } catch {
        // Ignore parse errors
      }
    }
    setSessionLoading(false);
  }, []);

  // Use session member directly as the member record (it already contains full member data)
  const currentUser = sessionMember;
  const memberRecord = sessionMember;
  const userLoading = sessionLoading;
  const memberLoading = false;
  const authError = null;
  const memberError = null;

  // --- Organization (from memberRecord.organization_id) ---
  const {
    data: organizationInfo,
    isLoading: orgLoading,
    error: orgError,
  } = useQuery({
    queryKey: ["organization", memberRecord?.organization_id],
    enabled: !!memberRecord?.organization_id,
    queryFn: async () => {
      if (!memberRecord?.organization_id) return null;
      const { data, error } = await supabase
        .from("organization")
        .select("*")
        .eq("id", memberRecord.organization_id)
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
  });

  // Helper to mimic old isFeatureExcluded prop:
  const isFeatureExcluded = (featureKey) =>
    !!memberRecord?.member_excluded_features?.includes(featureKey);

  // crude "is team member" flag – adjust if you later add a real column
  const isTeamMember =
    memberRecord?.is_team_member ?? false; // fallback to false if not present

  // --- Engagement stats (events, articles, jobs) ---
  const {
    data: engagementStats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ["engagementStats", memberRecord?.id],
    enabled: !!memberRecord?.id,
    queryFn: async () => {
      if (!memberRecord?.id) {
        return { eventsAttended: 0, articlesWritten: 0, jobsPosted: 0 };
      }
      const memberId = memberRecord.id;

      const [
        { data: bookings = [], error: bookingsError },
        { data: articles = [], error: articlesError },
        { data: jobPostings = [], error: jobsError },
      ] = await Promise.all([
        supabase
          .from("booking")
          .select("id, member_id, status")
          .eq("member_id", memberId)
          .eq("status", "confirmed"),
        supabase
          .from("blog_post")
          .select("id, author_id, status")
          .eq("author_id", memberId)
          .eq("status", "published"),
        supabase
          .from("job_posting")
          .select("id, posted_by_member_id")
          .eq("posted_by_member_id", memberId),
      ]);

      if (bookingsError) throw bookingsError;
      if (articlesError) throw articlesError;
      if (jobsError) throw jobsError;

      return {
        eventsAttended: bookings.length,
        articlesWritten: articles.length,
        jobsPosted: jobPostings.length,
      };
    },
  });

  // --- Online awards ---
  const { data: awards = [], isLoading: awardsLoading } = useQuery({
    queryKey: ["awards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("award")
        .select("*")
        .eq("is_active", true)
        .order("level", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // --- Offline award assignments ---
  const {
    data: offlineAssignments = [],
    isLoading: offlineAssignmentsLoading,
  } = useQuery({
    queryKey: ["offlineAssignments", memberRecord?.id],
    enabled: !!memberRecord?.id,
    queryFn: async () => {
      if (!memberRecord?.id) return [];
      const { data, error } = await supabase
        .from("offline_award_assignment")
        .select("*")
        .eq("member_id", memberRecord.id);
      if (error) throw error;
      return data || [];
    },
  });

  // --- Award sublevels ---
  const { data: awardSublevels = [] } = useQuery({
    queryKey: ["awardSublevels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("award_sublevel")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // --- Member group assignments ---
  const {
    data: groupAssignments = [],
    isLoading: groupAssignmentsLoading,
  } = useQuery({
    queryKey: ["groupAssignments", memberRecord?.id],
    enabled: !!memberRecord?.id,
    queryFn: async () => {
      if (!memberRecord?.id) return [];
      const { data, error } = await supabase
        .from("member_group_assignment")
        .select("*")
        .eq("member_id", memberRecord.id);
      if (error) throw error;
      return data || [];
    },
  });

  // --- Member groups ---
  const { data: memberGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["memberGroups"],
    enabled: groupAssignments.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_group")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  // --- Offline awards ---
  const { data: offlineAwards = [], isLoading: offlineAwardsLoading2 } =
    useQuery({
      queryKey: ["offlineAwards"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("offline_award")
          .select("*")
          .eq("is_active", true);
        if (error) throw error;
        return data || [];
      },
    });

  // --- Award classifications ---
  const { data: awardClassifications = [] } = useQuery({
    queryKey: ["awardClassifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("award_classification")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // --- Resource categories ---
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["resourceCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_category")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // --- Derived awards from stats ---
  const earnedOnlineAwards = useMemo(() => {
    if (!engagementStats || !awards || awards.length === 0) return [];
    return awards.filter((award) => {
      const stat =
        award.award_type === "events_attended"
          ? engagementStats.eventsAttended
          : award.award_type === "articles_published"
          ? engagementStats.articlesWritten
          : award.award_type === "jobs_posted"
          ? engagementStats.jobsPosted
          : 0;
      return stat >= award.threshold;
    });
  }, [engagementStats, awards]);

  const earnedOfflineAwards = useMemo(() => {
    if (!offlineAssignments || offlineAssignments.length === 0 || !offlineAwards)
      return [];
    return offlineAssignments
      .map((assignment) => {
        const award = offlineAwards.find(
          (a) => a.id === assignment.offline_award_id
        );
        if (!award) return null;
        const sublevel = assignment.sublevel_id
          ? awardSublevels.find((s) => s.id === assignment.sublevel_id)
          : null;
        return { ...award, sublevel };
      })
      .filter(Boolean)
      .sort((a, b) => (a.level || 0) - (b.level || 0));
  }, [offlineAssignments, offlineAwards, awardSublevels]);

  // --- Load profile state from memberRecord ---
  useEffect(() => {
    if (!memberRecord) return;

    setFirstName(memberRecord.first_name || "");
    setLastName(memberRecord.last_name || "");
    setJobTitle(memberRecord.job_title || "");
    setBiography(memberRecord.biography || "");
    setProfilePhotoUrl(memberRecord.profile_photo_url || "");
    setLinkedinUrl(memberRecord.linkedin_url || "");
    setShowInDirectory(memberRecord.show_in_directory !== false);
  }, [memberRecord]);

  // --- Load organisation logo from orgInfo ---
  useEffect(() => {
    if (organizationInfo) {
      setOrganizationLogoUrl(organizationInfo.logo_url || "");
    }
  }, [organizationInfo]);

  // --- Load preferences from localStorage ---
  useEffect(() => {
    const storedPrefs = localStorage.getItem('agcas_resource_preferences');
    if (storedPrefs) {
      try {
        const prefs = JSON.parse(storedPrefs);
        if (prefs.selectedSubcategories) {
          setSelectedSubcategories(prefs.selectedSubcategories);
        }
        if (prefs.expandedCategories) {
          setExpandedCategories(prefs.expandedCategories);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // --- Mutations ---
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences) => {
      localStorage.setItem('agcas_resource_preferences', JSON.stringify(preferences));
      return preferences;
    },
    onSuccess: () => {
      toast.success("Preferences saved successfully");
      setHasUnsavedChanges(false);
      setIsSaving(false);
    },
    onError: () => {
      toast.error("Failed to save preferences");
      setIsSaving(false);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      if (!memberRecord?.id) throw new Error("No member record");
      const { data, error } = await supabase
        .from("member")
        .update(profileData)
        .eq("id", memberRecord.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberRecord"] });
      queryClient.invalidateQueries({ queryKey: ["all-members-directory"] });
      toast.success("Profile updated successfully");
      setHasUnsavedProfile(false);
      setIsSavingProfile(false);
    },
    onError: () => {
      toast.error("Failed to update profile");
      setIsSavingProfile(false);
    },
  });

  const updateOrganizationLogoMutation = useMutation({
    mutationFn: async (logoUrl) => {
      if (!organizationInfo?.id) throw new Error("No organization");
      const { data, error } = await supabase
        .from("organization")
        .update({ logo_url: logoUrl })
        .eq("id", organizationInfo.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Organization logo updated successfully");
      setHasUnsavedOrgLogo(false);
    },
    onError: () => {
      toast.error("Failed to update organization logo");
    },
  });

  // --- Handlers ---
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const folder = currentUser?.id || "member";
      const publicUrl = await uploadImageToSupabase(
        file,
        "member-photos",
        folder
      );
      setProfilePhotoUrl(publicUrl);
      setHasUnsavedProfile(true);
      toast.success("Photo uploaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleOrgLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploadingOrgLogo(true);
    try {
      const folder = organizationInfo?.id || "organization";
      const publicUrl = await uploadImageToSupabase(
        file,
        "organization-logos",
        folder
      );
      setOrganizationLogoUrl(publicUrl);
      setHasUnsavedOrgLogo(true);
      toast.success("Logo uploaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploadingOrgLogo(false);
    }
  };

  const handleSaveOrgLogo = () => {
    updateOrganizationLogoMutation.mutate(organizationLogoUrl);
  };

  const handleSavePreferences = () => {
    setIsSaving(true);
    const preferences = {
      selectedSubcategories,
      expandedCategories,
    };
    savePreferencesMutation.mutate(preferences);
  };

  const handleSaveProfile = () => {
    const wordCount = biography
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    if (wordCount > 500) {
      toast.error("Biography must be 500 words or less");
      return;
    }

    setIsSavingProfile(true);
    updateProfileMutation.mutate({
      first_name: firstName,
      last_name: lastName,
      job_title: jobTitle,
      biography,
      profile_photo_url: profilePhotoUrl,
      linkedin_url: linkedinUrl,
      show_in_directory: showInDirectory,
    });
  };

  const handleResetFilters = () => {
    setSelectedSubcategories([]);
    setExpandedCategories({});
    setSearchQuery("");
    setHasUnsavedChanges(true);
  };

  const handleSubcategoryToggle = (subcategory) => {
    setSelectedSubcategories((prev) => {
      const newSelection = prev.includes(subcategory)
        ? prev.filter((s) => s !== subcategory)
        : [...prev, subcategory];
      setHasUnsavedChanges(true);
      return newSelection;
    });
  };

  const handleCategoryExpand = (categoryName) => {
    setExpandedCategories((prev) => {
      const next = { ...prev, [categoryName]: !prev[categoryName] };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  // --- Track profile / org changes ---
  useEffect(() => {
    if (!memberRecord) return;
    const changed =
      firstName !== (memberRecord.first_name || "") ||
      lastName !== (memberRecord.last_name || "") ||
      jobTitle !== (memberRecord.job_title || "") ||
      biography !== (memberRecord.biography || "") ||
      profilePhotoUrl !== (memberRecord.profile_photo_url || "") ||
      linkedinUrl !== (memberRecord.linkedin_url || "") ||
      showInDirectory !== (memberRecord.show_in_directory !== false);
    setHasUnsavedProfile(changed);
  }, [
    firstName,
    lastName,
    jobTitle,
    biography,
    profilePhotoUrl,
    linkedinUrl,
    showInDirectory,
    memberRecord,
  ]);

  useEffect(() => {
    if (!organizationInfo) return;
    const changed =
      organizationLogoUrl !== (organizationInfo.logo_url || "");
    setHasUnsavedOrgLogo(changed);
  }, [organizationLogoUrl, organizationInfo]);

  // --- Filters / derived values ---
  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      cat.name.toLowerCase().includes(searchLower) ||
      (cat.subcategories &&
        cat.subcategories.some((sub) =>
          sub.toLowerCase().includes(searchLower)
        ))
    );
  });

  const getBiographyWordCount = () =>
    biography
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

  const isLoading =
    userLoading ||
    categoriesLoading ||
    memberLoading ||
    orgLoading ||
    offlineAssignmentsLoading ||
    offlineAwardsLoading2 ||
    groupAssignmentsLoading ||
    awardsLoading ||
    groupsLoading;

  const canEditBiography = !isFeatureExcluded(
    "edit_professional_biography"
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // --- UI identical to previous version (just without props) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Preferences
          </h1>
          <p className="text-slate-600">
            Manage your profile and content preferences
          </p>
        </div>

        {/* Organization Logo Section - only if organizationInfo and not team member */}
        {organizationInfo && !isTeamMember && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Organization Logo</CardTitle>
              <CardDescription>
                Upload your organization's logo for the directory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                    {organizationLogoUrl ? (
                      <img
                        src={organizationLogoUrl}
                        alt="Organization Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="w-12 h-12 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="org-logo-upload"
                      accept="image/*"
                      onChange={handleOrgLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploadingOrgLogo}
                      onClick={() =>
                        document.getElementById("org-logo-upload").click()
                      }
                    >
                      {isUploadingOrgLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-slate-500 mt-1">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {hasUnsavedOrgLogo && (
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveOrgLogo}
                    disabled={updateOrganizationLogoMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updateOrganizationLogoMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Logo
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Profile Information */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              {sessionMember?.handle ? `@${sessionMember.handle}` : 'Update your personal details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-400" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploadingPhoto}
                    onClick={() =>
                      document.getElementById("photo-upload").click()
                    }
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500 mt-1">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Careers Adviser"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://www.linkedin.com/in/your-profile"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex-1">
                <Label htmlFor="show-in-directory" className="cursor-pointer">
                  Show in Member Directory
                </Label>
                <p className="text-xs text-slate-500 mt-1">
                  Allow other members to see your profile in the member
                  directory
                </p>
              </div>
              <Switch
                id="show-in-directory"
                checked={showInDirectory}
                onCheckedChange={setShowInDirectory}
              />
            </div>

            {memberRecord?.created_at && (
              <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <CalendarDays className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-600">Member since</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {format(
                      new Date(memberRecord.created_at),
                      "dd MMMM yyyy"
                    )}
                  </p>
                </div>
              </div>
            )}

            {hasUnsavedProfile && (
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engagement Section */}
        {canEditBiography && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Engagement</CardTitle>
              <CardDescription>
                Your activity and contributions to the community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-900">
                        {statsLoading
                          ? "-"
                          : engagementStats?.eventsAttended || 0}
                      </p>
                      <p className="text-xs text-blue-700">Events Attended</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-900">
                        {statsLoading
                          ? "-"
                          : engagementStats?.articlesWritten || 0}
                      </p>
                      <p className="text-xs text-purple-700">
                        Articles Published
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-900">
                        {statsLoading
                          ? "-"
                          : engagementStats?.jobsPosted || 0}
                      </p>
                      <p className="text-xs text-green-700">Jobs Posted</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Groups */}
              {groupAssignments.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Your Groups
                    </h3>
                    <Badge variant="secondary">
                      {groupAssignments.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupAssignments.map((assignment) => {
                      const group = memberGroups.find(
                        (g) => g.id === assignment.group_id
                      );
                      if (!group) return null;
                      return (
                        <div
                          key={assignment.id}
                          className="flex items-start gap-3 p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {group.name}
                            </p>
                            <p className="text-xs text-blue-700 font-medium">
                              {assignment.group_role}
                            </p>
                            {group.description && (
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {group.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Awards */}
              {(earnedOnlineAwards.length > 0 ||
                earnedOfflineAwards.length > 0) && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Your Awards
                    </h3>
                    <Badge variant="secondary">
                      {earnedOnlineAwards.length + earnedOfflineAwards.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {earnedOnlineAwards.map((award) => {
                      const classification = award.classification_id
                        ? awardClassifications.find(
                            (c) => c.id === award.classification_id
                          )
                        : null;
                      return (
                        <div
                          key={`online-${award.id}`}
                          className="flex flex-col items-center p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 hover:shadow-md transition-shadow relative"
                        >
                          {classification && (
                            <Badge
                              variant="secondary"
                              className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5"
                            >
                              {classification.name}
                            </Badge>
                          )}
                          {award.image_url ? (
                            <img
                              src={award.image_url}
                              alt={award.name}
                              className="w-12 h-12 object-contain mb-2"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-2">
                              <Trophy className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <p className="text-xs font-semibold text-center text-slate-900 line-clamp-2">
                            {award.name}
                          </p>
                          {award.description && (
                            <p className="text-xs text-slate-600 text-center mt-1 line-clamp-2">
                              {award.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {earnedOfflineAwards.map((award, idx) => {
                      const classification = award.classification_id
                        ? awardClassifications.find(
                            (c) => c.id === award.classification_id
                          )
                        : null;
                      return (
                        <div
                          key={`offline-${award.id}-${idx}`}
                          className="flex flex-col items-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:shadow-md transition-shadow relative"
                        >
                          {classification && (
                            <Badge
                              variant="secondary"
                              className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5"
                            >
                              {classification.name}
                            </Badge>
                          )}
                          {award.sublevel?.image_url ? (
                            <img
                              src={award.sublevel.image_url}
                              alt={award.sublevel.name}
                              className="w-12 h-12 object-contain mb-2"
                            />
                          ) : award.image_url ? (
                            <img
                              src={award.image_url}
                              alt={award.name}
                              className="w-12 h-12 object-contain mb-2"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mb-2">
                              <Trophy className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <p className="text-xs font-semibold text-center text-slate-900 line-clamp-2">
                            {award.name}
                          </p>
                          {award.sublevel && (
                            <Badge className="mt-1 bg-purple-600 text-white text-[10px]">
                              {award.sublevel.name}
                            </Badge>
                          )}
                          {award.period_text && (
                            <p className="text-xs text-purple-700 text-center mt-1 font-medium">
                              {award.period_text}
                            </p>
                          )}
                          {award.description && (
                            <p className="text-xs text-slate-600 text-center mt-1 line-clamp-2">
                              {award.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Biography */}
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <Label htmlFor="biography">Professional Biography</Label>
                  <span
                    className={`text-xs ${
                      getBiographyWordCount() > 500
                        ? "text-red-600 font-semibold"
                        : "text-slate-500"
                    }`}
                  >
                    {getBiographyWordCount()} / 500 words
                  </span>
                </div>
                <Textarea
                  id="biography"
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Share your professional background, expertise, and experience (max 500 words)"
                  className="min-h-[200px]"
                />
                <p className="text-xs text-slate-500">
                  This biography will be displayed on your published articles
                </p>
              </div>

              {hasUnsavedProfile && (
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={
                      isSavingProfile || getBiographyWordCount() > 500
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Biography
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resource Interests */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Resource Interests</CardTitle>
            <CardDescription>
              Select topics you're interested in to personalize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  Browse Topics
                </h3>
                <div className="border border-slate-200 rounded-lg bg-slate-50 p-4 max-h-[600px] overflow-y-auto">
                  <ResourceFilter
                    categories={filteredCategories}
                    selectedSubcategories={selectedSubcategories}
                    onSubcategoryToggle={handleSubcategoryToggle}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onClearSearch={() => setSearchQuery("")}
                    onCategoryToggle={handleCategoryExpand}
                    expandedCategories={expandedCategories}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Your Interests
                  </h3>
                  {selectedSubcategories.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {selectedSubcategories.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <p className="text-slate-500 text-sm">
                      No interests selected yet. Browse topics on the left to
                      get started.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg bg-white p-4 space-y-2 max-h-[600px] overflow-y-auto">
                    {selectedSubcategories.map((subcategory) => (
                      <div
                        key={subcategory}
                        className="flex items-center justify-between p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <span className="text-sm text-slate-900">
                          {subcategory}
                        </span>
                        <button
                          onClick={() => handleSubcategoryToggle(subcategory)}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {hasUnsavedChanges && (
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <Button
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
