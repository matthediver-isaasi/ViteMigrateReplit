import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Plus, Pencil, Trash2, Upload, Loader2, AlertCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { useMemberAccess } from "@/hooks/useMemberAccess";

const PUBLIC_PAGES = [
  { value: "Home", label: "Home Page" },
  { value: "JobBoard", label: "Job Board" },
  { value: "JobDetails", label: "Job Details" },
  { value: "PostJob", label: "Post Job" },
  { value: "PublicEvents", label: "Public Events" },
  { value: "PublicAbout", label: "About Us" },
  { value: "PublicContact", label: "Contact Us" },
  { value: "PublicResources", label: "Public Resources" }
];

export default function PageBannerManagementPage() {
  const { isAdmin, isFeatureExcluded, isAccessReady } = useMemberAccess();
  const [accessChecked, setAccessChecked] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAccessReady) {
      if (!isAdmin || isFeatureExcluded('page_PageBannerManagement')) {
        window.location.href = createPageUrl('Events');
      } else {
        setAccessChecked(true);
      }
    }
  }, [isAdmin, isAccessReady, isFeatureExcluded]);

  const { data: banners, isLoading } = useQuery({
    queryKey: ['page-banners'],
    queryFn: () => base44.entities.PageBanner.list('-display_order'),
    initialData: []
  });

  const createBannerMutation = useMutation({
    mutationFn: (bannerData) => base44.entities.PageBanner.create(bannerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-banners'] });
      setShowDialog(false);
      setEditingBanner(null);
      toast.success('Banner created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create banner: ' + error.message);
    }
  });

  const updateBannerMutation = useMutation({
    mutationFn: ({ id, bannerData }) => base44.entities.PageBanner.update(id, bannerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-banners'] });
      setShowDialog(false);
      setEditingBanner(null);
      toast.success('Banner updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update banner: ' + error.message);
    }
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id) => base44.entities.PageBanner.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-banners'] });
      setShowDeleteConfirm(false);
      setBannerToDelete(null);
      toast.success('Banner deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete banner: ' + error.message);
    }
  });

  const handleCreateNew = () => {
    setEditingBanner({
      name: "",
      image_url: "",
      alt_text: "",
      size: "full-width",
      height: "medium",
      position: "center",
      associated_pages: [],
      display_order: 0,
      is_active: true
    });
    setShowDialog(true);
  };

  const handleEdit = (banner) => {
    setEditingBanner({ ...banner });
    setShowDialog(true);
  };

  const handleDelete = (banner) => {
    setBannerToDelete(banner);
    setShowDeleteConfirm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only image files (JPEG, PNG, GIF, WebP) are allowed');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      setEditingBanner(prev => ({
        ...prev,
        image_url: response.file_url
      }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = () => {
    if (!editingBanner.name.trim()) {
      toast.error('Banner name is required');
      return;
    }
    if (!editingBanner.image_url) {
      toast.error('Please upload an image');
      return;
    }
    if (editingBanner.associated_pages.length === 0) {
      toast.error('Please select at least one page');
      return;
    }

    if (editingBanner.id) {
      updateBannerMutation.mutate({
        id: editingBanner.id,
        bannerData: editingBanner
      });
    } else {
      createBannerMutation.mutate(editingBanner);
    }
  };

  const togglePage = (pageValue) => {
    const pages = editingBanner.associated_pages || [];
    const newPages = pages.includes(pageValue)
      ? pages.filter(p => p !== pageValue)
      : [...pages, pageValue];
    setEditingBanner({ ...editingBanner, associated_pages: newPages });
  };

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
              Page Banner Management
            </h1>
            <p className="text-slate-600">
              Create and manage hero banners for public pages
            </p>
          </div>
          <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Banner
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Loading banners...</p>
          </div>
        ) : banners.length === 0 ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-12 text-center">
              <Image className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No Banners Yet
              </h3>
              <p className="text-slate-600 mb-6">
                Create your first banner to enhance your public pages
              </p>
              <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create First Banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <Card key={banner.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="p-0">
                  <div className="relative h-40 bg-slate-100 rounded-t-lg overflow-hidden">
                    <img 
                      src={banner.image_url} 
                      alt={banner.alt_text || banner.name}
                      className="w-full h-full object-cover"
                    />
                    {!banner.is_active && (
                      <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                        <Badge className="bg-slate-700 text-white">Inactive</Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-slate-900 mb-1">{banner.name}</h3>
                    <div className="flex gap-2 flex-wrap mt-2">
                      <Badge variant="outline" className="text-xs">
                        {banner.size}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {banner.height}
                      </Badge>
                      {banner.is_active && (
                        <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-xs font-medium text-slate-500 uppercase">Appears On</div>
                    <div className="flex flex-wrap gap-1">
                      {banner.associated_pages && banner.associated_pages.length > 0 ? (
                        banner.associated_pages.slice(0, 3).map((page) => (
                          <Badge key={page} className="bg-blue-100 text-blue-700 text-xs">
                            {PUBLIC_PAGES.find(p => p.value === page)?.label || page}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No pages selected</span>
                      )}
                      {banner.associated_pages && banner.associated_pages.length > 3 && (
                        <Badge className="bg-slate-100 text-slate-700 text-xs">
                          +{banner.associated_pages.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewBanner(banner)}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(banner)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(banner)}
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBanner?.id ? 'Edit Banner' : 'Create New Banner'}
              </DialogTitle>
            </DialogHeader>

            {editingBanner && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="banner-name">Banner Name *</Label>
                  <Input
                    id="banner-name"
                    value={editingBanner.name}
                    onChange={(e) => setEditingBanner({ ...editingBanner, name: e.target.value })}
                    placeholder="e.g., Homepage Hero Banner"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alt-text">Alternative Text</Label>
                  <Input
                    id="alt-text"
                    value={editingBanner.alt_text || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, alt_text: e.target.value })}
                    placeholder="Describe the image for accessibility"
                  />
                  <p className="text-xs text-slate-500">
                    Used for screen readers and SEO
                  </p>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Banner Image *</Label>
                  {editingBanner.image_url ? (
                    <div className="space-y-3">
                      <div className="relative h-40 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <img 
                          src={editingBanner.image_url} 
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Label htmlFor="change-image" className="cursor-pointer">
                        <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-colors">
                          <Upload className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-600">Change Image</span>
                        </div>
                        <input
                          id="change-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </Label>
                    </div>
                  ) : (
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            <span className="text-sm font-medium text-slate-600">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Image className="w-8 h-8 text-slate-400" />
                            <div className="text-center">
                              <span className="text-sm font-medium text-slate-900 block">Upload Banner Image</span>
                              <span className="text-xs text-slate-500">Click to browse (max 5MB)</span>
                            </div>
                          </>
                        )}
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </Label>
                  )}
                </div>

                {/* Size & Height */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="size">Banner Width</Label>
                    <Select
                      value={editingBanner.size}
                      onValueChange={(value) => setEditingBanner({ ...editingBanner, size: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-width">Full Width</SelectItem>
                        <SelectItem value="contained">Contained</SelectItem>
                        <SelectItem value="wide">Wide</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">Banner Height</Label>
                    <Select
                      value={editingBanner.height}
                      onValueChange={(value) => setEditingBanner({ ...editingBanner, height: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <Label htmlFor="position">Image Position</Label>
                  <Select
                    value={editingBanner.position}
                    onValueChange={(value) => setEditingBanner({ ...editingBanner, position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Vertical positioning of the image within the banner container
                  </p>
                </div>

                {/* Display Order */}
                <div className="space-y-2">
                  <Label htmlFor="display-order">Display Order</Label>
                  <Input
                    id="display-order"
                    type="number"
                    value={editingBanner.display_order}
                    onChange={(e) => setEditingBanner({ ...editingBanner, display_order: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-slate-500">
                    Lower numbers appear first if multiple banners on same page
                  </p>
                </div>

                {/* Associated Pages */}
                <div className="space-y-3">
                  <Label>Show Banner On (Select Pages) *</Label>
                  <div className="border border-slate-200 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                    {PUBLIC_PAGES.map((page) => (
                      <div
                        key={page.value}
                        className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded transition-colors"
                      >
                        <Switch
                          id={`page-${page.value}`}
                          checked={(editingBanner.associated_pages || []).includes(page.value)}
                          onCheckedChange={() => togglePage(page.value)}
                        />
                        <Label htmlFor={`page-${page.value}`} className="flex-1 cursor-pointer">
                          {page.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Switch
                    id="is-active"
                    checked={editingBanner.is_active}
                    onCheckedChange={(checked) => setEditingBanner({ ...editingBanner, is_active: checked })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="is-active" className="cursor-pointer">Active</Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Inactive banners won't be displayed on any pages
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingBanner(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={createBannerMutation.isPending || updateBannerMutation.isPending || uploadingImage}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingBanner?.id ? 'Update Banner' : 'Create Banner'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={!!previewBanner} onOpenChange={() => setPreviewBanner(null)}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Banner Preview: {previewBanner?.name}</DialogTitle>
            </DialogHeader>
            {previewBanner && (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <img 
                    src={previewBanner.image_url} 
                    alt={previewBanner.alt_text || previewBanner.name}
                    className="w-full h-auto"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Width:</span>
                    <span className="ml-2 text-slate-600">{previewBanner.size}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Height:</span>
                    <span className="ml-2 text-slate-600">{previewBanner.height}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Position:</span>
                    <span className="ml-2 text-slate-600">{previewBanner.position}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Status:</span>
                    <span className="ml-2 text-slate-600">{previewBanner.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Banner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-900 font-medium">
                    Are you sure you want to delete "{bannerToDelete?.name}"?
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    This banner will be removed from all associated pages.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setBannerToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => bannerToDelete && deleteBannerMutation.mutate(bannerToDelete.id)}
                disabled={deleteBannerMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Banner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}