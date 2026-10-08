import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Film,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Plus,
  Play,
  X,
  ExternalLink,
  Layers,
  Save,
  RotateCcw
} from 'lucide-react';
import { MediaSlot, MediaSlotItem, MediaSlotType } from '../../types/command';
import {
  fetchCommandMediaSlots,
  fetchCommandMediaSlotDetail,
  uploadMediaItem,
  createUrlMediaItem,
  updateMediaItem,
  reorderMediaItems,
  deleteMediaItem,
} from '../../services/mediaSlots';
import {
  MEDIA_PLACEMENTS,
  getPlacementForSlot,
  CAROUSEL_LIMITS,
  SlotPlacement,
} from '../../config/mediaPlacements';

const AVAILABLE_PAGES = [
  { id: 'home', label: 'Home Page' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'apps', label: 'Apps & Websites' },
  { id: 'learn', label: 'Learn & Education' },
  { id: 'tools', label: 'Tools' },
  { id: 'about', label: 'About' },
  { id: 'news', label: 'News' },
  { id: 'site', label: 'Site (Global Background)' },
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
}

export function getSlotEffectiveConfig(slot: MediaSlot) {
  const placement = getPlacementForSlot(slot.slot_key);
  const isCarousel = slot.slot_key.endsWith('.showcase') || placement?.component === 'CoreIQSentinel';
  const allowedTypes = isCarousel
    ? (['image', 'video'] as MediaSlotType[])
    : ((placement?.allowedTypes as MediaSlotType[]) || slot.allowed_types || ['image']);
  const maxItems = placement?.capacity ?? (isCarousel ? 6 : slot.max_items);

  const hasImage = allowedTypes.includes('image');
  const hasVideo = allowedTypes.includes('video');
  const hasUrl = allowedTypes.includes('url');

  let allowedLabel = '';
  if (hasImage && hasVideo) {
    allowedLabel = 'IMAGE + VIDEO';
  } else if (hasVideo && hasUrl) {
    allowedLabel = 'VIDEO + URL';
  } else if (hasVideo) {
    allowedLabel = 'VIDEO';
  } else if (hasImage) {
    allowedLabel = 'IMAGE';
  } else {
    allowedLabel = allowedTypes.join(' + ').toUpperCase();
  }

  const imageMaxBytes = placement?.imageMaxBytes ?? (isCarousel ? CAROUSEL_LIMITS.imageMaxBytes : slot.max_bytes);
  const videoMaxBytes = placement?.videoMaxBytes ?? (isCarousel ? CAROUSEL_LIMITS.videoMaxBytes : 52428800);

  let limitsLabel = '';
  if (isCarousel || (hasImage && hasVideo)) {
    limitsLabel = `Img: ${formatFileSize(imageMaxBytes)} · Vid: ${formatFileSize(videoMaxBytes)}`;
  } else if (hasVideo) {
    limitsLabel = `Max: ${formatFileSize(videoMaxBytes)}`;
  } else {
    limitsLabel = `Max: ${formatFileSize(imageMaxBytes)}`;
  }

  return {
    placement,
    allowedTypes,
    allowedLabel,
    limitsLabel,
    maxItems,
    aspect: placement?.aspectRatio || slot.aspect || '16:9',
    imageMaxBytes,
    videoMaxBytes,
    isCarousel,
    allowsBoth: hasImage && hasVideo,
  };
}

export const CommandUploadTab: React.FC = () => {
  const [selectedPage, setSelectedPage] = useState<string>('home');
  const [slots, setSlots] = useState<MediaSlot[]>([]);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>('home.showcase');
  const [selectedSlotDetail, setSelectedSlotDetail] = useState<{ slot: MediaSlot; items: MediaSlotItem[] } | null>(null);

  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New Upload / URL Form State
  const [uploadType, setUploadType] = useState<MediaSlotType>('image');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [altInput, setAltInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [captionInput, setCaptionInput] = useState('');
  const [ctaLabelInput, setCtaLabelInput] = useState('');
  const [ctaUrlInput, setCtaUrlInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Optional poster image for video uploads
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [posterUrlInput, setPosterUrlInput] = useState('');
  const posterFileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Per-item inline edit states
  const [editingItemMap, setEditingItemMap] = useState<Record<string, Partial<MediaSlotItem>>>({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load slot summary list
  const loadSlots = useCallback(async () => {
    try {
      setIsLoadingSlots(true);
      setErrorMessage(null);
      const fetchedSlots = await fetchCommandMediaSlots(selectedPage);

      // Merge and enforce shared placement config from MEDIA_PLACEMENTS
      const mergedSlots = fetchedSlots.map((slot) => {
        const placement = getPlacementForSlot(slot.slot_key);
        if (!placement) return slot;
        return {
          ...slot,
          label: placement.label || slot.label,
          allowed_types: (placement.allowedTypes as MediaSlotType[]) || slot.allowed_types,
          max_items: placement.capacity ?? slot.max_items,
          max_bytes: placement.maxSize ?? slot.max_bytes,
          aspect: placement.aspectRatio ?? slot.aspect,
        };
      });

      // Ensure all slots defined in MEDIA_PLACEMENTS for selectedPage are included
      Object.values(MEDIA_PLACEMENTS)
        .filter((p, idx, arr) => p.page === selectedPage && arr.findIndex((x) => x.slotKey === p.slotKey) === idx)
        .forEach((placement) => {
          if (!mergedSlots.some((s) => s.slot_key === placement.slotKey)) {
            mergedSlots.push({
              slot_key: placement.slotKey,
              page: placement.page,
              label: placement.label || placement.slotKey,
              allowed_types: (placement.allowedTypes as MediaSlotType[]) || ['image', 'video'],
              max_items: placement.capacity ?? 6,
              max_bytes: placement.maxSize ?? 52428800,
              aspect: placement.aspectRatio ?? '16:9',
              item_count: 0,
              status: 'empty',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        });

      setSlots(mergedSlots);
      if (mergedSlots.length > 0) {
        // Keep current selected slot if exists on page, else default to first
        if (!mergedSlots.some((s) => s.slot_key === selectedSlotKey)) {
          setSelectedSlotKey(mergedSlots[0].slot_key);
        }
      } else {
        setSelectedSlotDetail(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load media slots.');
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedPage, selectedSlotKey]);

  // Load active slot detail
  const loadSlotDetail = useCallback(async (slotKey: string) => {
    try {
      setIsLoadingDetail(true);
      setErrorMessage(null);
      const detail = await fetchCommandMediaSlotDetail(slotKey);

      const placement = getPlacementForSlot(slotKey);
      if (placement && detail?.slot) {
        detail.slot = {
          ...detail.slot,
          label: placement.label || detail.slot.label,
          allowed_types: (placement.allowedTypes as MediaSlotType[]) || detail.slot.allowed_types,
          max_items: placement.capacity ?? detail.slot.max_items,
          max_bytes: placement.maxSize ?? detail.slot.max_bytes,
          aspect: placement.aspectRatio ?? detail.slot.aspect,
        };
      }
      setSelectedSlotDetail(detail);

      // Default upload type to first allowed type
      if (detail.slot?.allowed_types?.length) {
        setUploadType(detail.slot.allowed_types[0]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to load details for slot ${slotKey}`);
      setSelectedSlotDetail((prev) => {
        // If we already have loaded items for this slot, preserve them so they don't vanish
        if (prev && prev.slot.slot_key === slotKey && prev.items.length > 0) {
          return prev;
        }
        const placement = getPlacementForSlot(slotKey);
        if (placement) {
          const fallbackSlot: MediaSlot = {
            slot_key: placement.slotKey,
            page: placement.page,
            label: placement.label || placement.slotKey,
            allowed_types: (placement.allowedTypes as MediaSlotType[]) || ['image', 'video'],
            max_items: placement.capacity ?? 6,
            max_bytes: placement.maxSize ?? 52428800,
            aspect: placement.aspectRatio ?? '16:9',
            item_count: 0,
            status: 'empty',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return { slot: fallbackSlot, items: [] };
        }
        return null;
      });
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    if (selectedSlotKey) {
      loadSlotDetail(selectedSlotKey);
    }
  }, [selectedSlotKey, loadSlotDetail]);

  const resetForm = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (posterPreviewUrl) {
      URL.revokeObjectURL(posterPreviewUrl);
    }
    setPreviewUrl(null);
    setUploadFile(null);
    setPosterPreviewUrl(null);
    setPosterFile(null);
    setPosterUrlInput('');
    setUrlInput('');
    setAltInput('');
    setTitleInput('');
    setCaptionInput('');
    setCtaLabelInput('');
    setCtaUrlInput('');
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (posterFileInputRef.current) posterFileInputRef.current.value = '';
  };

  const handlePosterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5242880) {
      setFormError(`Poster file too large: ${formatFileSize(file.size)} exceeds limit of 5 MB`);
      if (posterFileInputRef.current) posterFileInputRef.current.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFormError('Poster file must be an image (JPEG, PNG, WebP).');
      if (posterFileInputRef.current) posterFileInputRef.current.value = '';
      return;
    }

    if (posterPreviewUrl) {
      URL.revokeObjectURL(posterPreviewUrl);
    }
    setPosterPreviewUrl(URL.createObjectURL(file));
    setPosterFile(file);
  };

  const clearPoster = () => {
    if (posterPreviewUrl) {
      URL.revokeObjectURL(posterPreviewUrl);
    }
    setPosterPreviewUrl(null);
    setPosterFile(null);
    setPosterUrlInput('');
    if (posterFileInputRef.current) posterFileInputRef.current.value = '';
  };

  // Client-side file selection with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const currentSlot = selectedSlotDetail?.slot;
    if (!currentSlot) return;

    const effective = getSlotEffectiveConfig(currentSlot);
    const maxBytes = uploadType === 'video' ? effective.videoMaxBytes : effective.imageMaxBytes;

    if (file.size > maxBytes) {
      setFormError(
        `File too large: ${formatFileSize(file.size)} exceeds limit of ${formatFileSize(maxBytes)}`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type === 'video/mp4' || file.type === 'video/webm' || file.type.startsWith('video/');

    if (uploadType === 'image' && !isImage) {
      setFormError('Selected file is not an image. Please choose a JPEG, PNG, or WebP file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (uploadType === 'video' && !isVideo) {
      setFormError('Selected file is not a supported video. Please choose an MP4 or WebM video file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
    setUploadFile(file);
  };

  // Submit new item (File upload or URL item)
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setActionSuccess(null);

    const slot = selectedSlotDetail?.slot;
    if (!slot) return;

    // Validation
    if (uploadType === 'image' && (!altInput || !altInput.trim())) {
      setFormError('Alt text is required for image items (accessibility).');
      return;
    }

    if (uploadType === 'url') {
      const trimmed = urlInput.trim();
      if (!trimmed.startsWith('https://')) {
        setFormError('URL must start with https:// and use an approved provider (YouTube, Vimeo).');
        return;
      }
      try {
        const parsed = new URL(trimmed);
        const host = parsed.hostname.toLowerCase();
        const allowedHosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'vimeo.com', 'player.vimeo.com'];
        if (!allowedHosts.some((h) => host === h || host.endsWith('.' + h))) {
          setFormError(`Host '${parsed.hostname}' is not supported. Use youtube.com, youtu.be, or vimeo.com.`);
          return;
        }
      } catch {
        setFormError('Invalid URL format.');
        return;
      }
    } else {
      if (!uploadFile) {
        setFormError('Please select a file to upload.');
        return;
      }
    }

    if (ctaUrlInput.trim()) {
      const cta = ctaUrlInput.trim();
      if (!cta.startsWith('/') && !cta.startsWith('https://')) {
        setFormError('CTA URL must be an internal route starting with "/" or an https:// URL.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let createdItem: MediaSlotItem | null = null;
      if (uploadType === 'url') {
        createdItem = await createUrlMediaItem(slot.slot_key, {
          type: 'url',
          url: urlInput.trim(),
          alt: altInput.trim() || undefined,
          title: titleInput.trim() || undefined,
          caption: captionInput.trim() || undefined,
          cta_label: ctaLabelInput.trim() || undefined,
          cta_url: ctaUrlInput.trim() || undefined,
        });
      } else {
        const formData = new FormData();
        formData.append('type', uploadType);
        formData.append('file', uploadFile as File);
        formData.append('alt', altInput.trim() || titleInput.trim() || 'Media asset');
        if (titleInput.trim()) formData.append('title', titleInput.trim());
        if (captionInput.trim()) formData.append('caption', captionInput.trim());
        if (ctaLabelInput.trim()) formData.append('cta_label', ctaLabelInput.trim());
        if (ctaUrlInput.trim()) formData.append('cta_url', ctaUrlInput.trim());

        if (uploadType === 'video') {
          if (posterUrlInput.trim()) {
            formData.append('poster_url', posterUrlInput.trim());
          } else if (posterFile) {
            const reader = new FileReader();
            const dataUrlPromise = new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(posterFile);
            });
            const posterDataUrl = await dataUrlPromise;
            formData.append('poster_url', posterDataUrl);
          }
        }

        createdItem = await uploadMediaItem(slot.slot_key, formData);
      }

      // Immediately render new item in Current Slot Items state so the Publish button is instantly accessible
      if (createdItem) {
        setSelectedSlotDetail((prev) => {
          if (!prev) return prev;
          const placement = getPlacementForSlot(slot.slot_key);
          const isSingle = (placement?.capacity ?? slot.max_items) === 1;
          const remaining = prev.items.filter((i) => i.id !== createdItem!.id);
          const nextItems = isSingle ? [createdItem!] : [...remaining, createdItem!];
          return {
            ...prev,
            items: nextItems,
            slot: {
              ...prev.slot,
              item_count: nextItems.length,
            },
          };
        });
      }

      setActionSuccess(`New item successfully created in ${slot.label}. Remember to click "Publish Item" to activate it on the site!`);
      resetForm();

      // Immediately re-fetch slot items list from server to guarantee sync across all pages/slots
      await loadSlotDetail(slot.slot_key);
      await loadSlots();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add item to slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle item publish status
  const handleTogglePublish = async (item: MediaSlotItem) => {
    try {
      const nextPublished = !item.published;
      await updateMediaItem(item.slot_key, item.id, { published: nextPublished });
      setActionSuccess(`Item ${nextPublished ? 'published to live site' : 'unpublished (hidden from site)'}.`);
      await loadSlotDetail(item.slot_key);
      await loadSlots();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update publish state.');
    }
  };

  // Save inline edits
  const handleSaveItemEdits = async (item: MediaSlotItem) => {
    const changes = editingItemMap[item.id];
    if (!changes) return;

    if (item.type === 'image' && changes.alt !== undefined && !changes.alt.trim()) {
      alert('Alt text cannot be empty for an image item.');
      return;
    }

    if (changes.cta_url !== undefined && changes.cta_url.trim()) {
      const c = changes.cta_url.trim();
      if (!c.startsWith('/') && !c.startsWith('https://')) {
        alert('CTA Destination must be an internal route starting with "/" or an https:// URL.');
        return;
      }
    }

    setSavingItemId(item.id);
    try {
      await updateMediaItem(item.slot_key, item.id, changes);
      // Clear from editing map
      setEditingItemMap((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setActionSuccess(`Item "${item.title || item.alt || item.id}" updated.`);
      await loadSlotDetail(item.slot_key);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save changes.');
    } finally {
      setSavingItemId(null);
    }
  };

  // Reorder items
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (!selectedSlotDetail) return;
    const items = [...selectedSlotDetail.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);

    const itemIds = items.map((i) => i.id);
    try {
      await reorderMediaItems(selectedSlotDetail.slot.slot_key, itemIds);
      await loadSlotDetail(selectedSlotDetail.slot.slot_key);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reorder items.');
    }
  };

  // Delete item with confirm
  const handleDeleteItem = async (item: MediaSlotItem) => {
    try {
      await deleteMediaItem(item.slot_key, item.id);
      setConfirmDeleteId(null);
      setActionSuccess('Item removed and storage object purged.');
      await loadSlotDetail(item.slot_key);
      await loadSlots();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete item.');
    }
  };

  // Clear all items in single-item slot
  const handleClearSlot = async (slot: MediaSlot) => {
    if (!selectedSlotDetail || selectedSlotDetail.items.length === 0) return;
    if (!window.confirm(`Are you sure you want to clear the asset in ${slot.label}?`)) return;

    try {
      for (const item of selectedSlotDetail.items) {
        await deleteMediaItem(slot.slot_key, item.id);
      }
      setActionSuccess(`Slot ${slot.label} cleared.`);
      await loadSlotDetail(slot.slot_key);
      await loadSlots();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to clear slot.');
    }
  };

  const currentSlot = selectedSlotDetail?.slot;
  const currentItems = selectedSlotDetail?.items || [];
  const currentEffective = currentSlot ? getSlotEffectiveConfig(currentSlot) : null;
  const isSlotFull = currentEffective ? currentItems.length >= currentEffective.maxItems : false;
  const isSingleItemSlot = currentEffective ? currentEffective.maxItems === 1 : false;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Tab Header Banner */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#071330] to-slate-900 border border-cyan-500/20 shadow-[0_0_30px_rgba(25,217,255,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#19d9ff] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-cyan-300 font-bold uppercase">
              OPERATIONAL MEDIA SLOTS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display">
            Dynamic Asset & Video Upload Gateway
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Manage live images, videos, and carousel assets on public pages without redeploying code.
            Published items stream immediately to visitor clients via RLS.
          </p>
        </div>

        <button
          onClick={() => {
            loadSlots();
            if (selectedSlotKey) loadSlotDetail(selectedSlotKey);
          }}
          disabled={isLoadingSlots || isLoadingDetail}
          className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-2 border border-slate-700 transition-colors min-h-[44px] min-w-[44px]"
          title="Refresh slot data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingSlots || isLoadingDetail ? 'animate-spin' : ''}`} />
          <span>Sync Slots</span>
        </button>
      </div>

      {/* Global Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Page Filter Selector */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
          Filter Page:
        </span>
        {AVAILABLE_PAGES.map((page) => {
          const isActive = selectedPage === page.id;
          return (
            <button
              key={page.id}
              onClick={() => setSelectedPage(page.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all min-h-[44px] shrink-0 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(25,217,255,0.15)] font-semibold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {page.label}
            </button>
          );
        })}
      </div>

      {/* Main Split Layout: Slot List & Slot Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Slots List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
              Available Slots ({slots.length})
            </h3>
            <span className="text-[11px] font-mono text-cyan-400">Page: {selectedPage}</span>
          </div>

          {isLoadingSlots ? (
            <div className="p-8 rounded-2xl bg-[#040817]/80 border border-slate-800 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-300 font-medium">No media slots configured yet</p>
              <p className="text-xs text-slate-500">
                Page '{selectedPage}' does not have any active media slots registered in database.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {slots.map((slot) => {
                const isSelected = slot.slot_key === selectedSlotKey;
                const effective = getSlotEffectiveConfig(slot);
                const count = slot.item_count ?? 0;
                const isFull = count >= effective.maxItems;

                return (
                  <div
                    key={slot.slot_key}
                    onClick={() => setSelectedSlotKey(slot.slot_key)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer min-h-[44px] ${
                      isSelected
                        ? 'bg-gradient-to-br from-cyan-950/60 to-slate-900/90 border-cyan-400/50 shadow-[0_0_20px_rgba(25,217,255,0.12)]'
                        : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-white leading-tight">
                        {slot.label}
                      </span>
                      {/* Status chip */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                          count === 0
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : isFull
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {count === 0 ? 'Empty' : isFull ? 'Filled' : 'Active'}
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-cyan-400/80 mb-2 truncate">
                      {slot.slot_key}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                      <span>
                        Items:{' '}
                        <strong className="text-white font-mono">
                          {count} / {effective.maxItems}
                        </strong>
                      </span>
                      <span className="text-cyan-300 font-mono text-[10px] font-bold tracking-wide">
                        ALLOWED: {effective.allowedLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1">
                      <span>{effective.limitsLabel}</span>
                      <span>{effective.aspect}</span>
                    </div>

                    {/* Placement mapping info */}
                    {(() => {
                      const placement = getPlacementForSlot(slot.slot_key);
                      if (!placement) return null;
                      return (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-400 truncate max-w-[190px]" title={placement.position}>
                            {placement.route} · &lt;{placement.component} /&gt;
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0 ${
                              placement.wired
                                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {placement.wired ? 'Wired' : 'Pending'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Slot Detail & Asset Manager (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {!currentSlot ? (
            <div className="p-12 rounded-2xl bg-slate-900/30 border border-slate-800 text-center">
              <p className="text-slate-400 text-sm">Select a slot to view and upload assets.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Slot Config Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#040817] border border-cyan-500/30 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white font-display">
                      {currentSlot.label}
                    </h3>
                    <p className="text-xs font-mono text-cyan-400">{currentSlot.slot_key}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSingleItemSlot && currentItems.length > 0 && (
                      <button
                        onClick={() => handleClearSlot(currentSlot)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors min-h-[44px]"
                      >
                        Clear Slot
                      </button>
                    )}
                  </div>
                </div>

                {/* Placement information */}
                {(() => {
                  const placement = getPlacementForSlot(currentSlot.slot_key);
                  if (!placement) return null;
                  return (
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                          Site Placement Map
                        </span>
                        <span
                          className={`self-start sm:self-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider ${
                            placement.wired
                              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {placement.wired ? 'Wired (Active on Page)' : 'Pending Wiring'}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {placement.position}
                      </p>
                      <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                        <span>Route: <strong className="text-slate-200">{placement.route}</strong></span>
                        <span>Component: <strong className="text-slate-200">&lt;{placement.component} /&gt;</strong></span>
                      </div>
                    </div>
                  );
                })()}

                {/* Slot limits and specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Capacity</span>
                    <span className="font-semibold text-slate-200">
                      {currentItems.length} / {currentEffective?.maxItems ?? currentSlot.max_items} item(s)
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Limits</span>
                    <span className="font-semibold text-slate-200">
                      {currentEffective?.limitsLabel ?? `${(currentSlot.max_bytes / 1024).toFixed(0)} KB`}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Allowed</span>
                    <span className="font-semibold text-cyan-300 uppercase font-mono text-[11px]">
                      ALLOWED: {currentEffective?.allowedLabel ?? currentSlot.allowed_types.join(', ')}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Aspect Ratio</span>
                    <span className="font-semibold text-purple-300 font-mono text-[11px]">
                      {currentEffective?.aspect ?? currentSlot.aspect ?? '16:9'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. New Asset Upload / Addition Form */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#050b1e] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-cyan-400" />
                    <span>
                      {isSingleItemSlot && currentItems.length > 0 ? 'Replace Current Asset' : 'Add New Asset'}
                    </span>
                  </h4>
                  {isSingleItemSlot && currentItems.length > 0 && (
                    <span className="text-[11px] font-mono text-amber-400">
                      Single-item slot: uploading replaces the existing file
                    </span>
                  )}
                </div>

                {isSlotFull && !isSingleItemSlot ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    Slot is at maximum capacity ({currentEffective?.maxItems ?? currentSlot.max_items} items). Delete or unpublish an item to add new ones.
                  </div>
                ) : (
                  <form onSubmit={handleCreateItem} className="space-y-4">
                    {/* Media Type Tabs / Toggle */}
                    {currentEffective?.allowsBoth ? (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
                          Media Type *
                        </label>
                        <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setUploadType('image');
                              resetForm();
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all min-h-[44px] ${
                              uploadType === 'image'
                                ? 'bg-cyan-500 text-slate-950 shadow-md'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                            }`}
                          >
                            <ImageIcon className="w-4 h-4" />
                            Image (Max 5 MB)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadType('video');
                              resetForm();
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all min-h-[44px] ${
                              uploadType === 'video'
                                ? 'bg-cyan-500 text-slate-950 shadow-md'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                            }`}
                          >
                            <Film className="w-4 h-4" />
                            Video (Max 50 MB)
                          </button>
                          {currentEffective.allowedTypes.includes('url') && (
                            <button
                              type="button"
                              onClick={() => {
                                setUploadType('url');
                                resetForm();
                              }}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all min-h-[44px] ${
                                uploadType === 'url'
                                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
                              }`}
                            >
                              <LinkIcon className="w-4 h-4" />
                              External URL
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      currentSlot.allowed_types.length > 1 && (
                        <div className="flex items-center gap-2">
                          {currentSlot.allowed_types.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setUploadType(type);
                                resetForm();
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase font-mono transition-colors min-h-[44px] ${
                                uploadType === type
                                  ? 'bg-cyan-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      )
                    )}

                    {/* File Picker or URL Input */}
                    {uploadType === 'url' ? (
                      <div>
                        <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                          External Video URL (YouTube or Vimeo) *
                        </label>
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 min-h-[44px]"
                          required
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Must be HTTPS and from youtube.com, youtu.be, or vimeo.com.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">
                            {uploadType === 'video'
                              ? `CHOOSE VIDEO FILE (Max ${formatFileSize(currentEffective?.videoMaxBytes ?? 52428800)} — MP4, WebM) *`
                              : `CHOOSE IMAGE FILE (Max ${formatFileSize(currentEffective?.imageMaxBytes ?? 5242880)} — WebP, PNG, JPEG) *`}
                          </label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={
                              uploadType === 'video'
                                ? 'video/mp4,video/webm'
                                : 'image/jpeg,image/png,image/webp'
                            }
                            onChange={handleFileChange}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-300 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer min-h-[44px]"
                            required
                          />

                          {/* Video / Image selected preview thumbnail */}
                          {previewUrl && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex flex-col sm:flex-row items-center gap-3">
                              <div className="relative w-full sm:w-44 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-slate-700">
                                {uploadType === 'video' ? (
                                  <video
                                    src={previewUrl}
                                    controls
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={previewUrl}
                                    alt="Upload preview"
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 space-y-1 text-xs">
                                <p className="font-semibold text-white truncate">
                                  {uploadFile?.name}
                                </p>
                                <p className="text-slate-400 font-mono text-[11px]">
                                  {uploadFile ? `${formatFileSize(uploadFile.size)} · ${uploadFile.type}` : ''}
                                </p>
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  {uploadType === 'video' ? 'Video Ready for Upload' : 'Image Ready'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Optional Poster Image Field for Video */}
                        {uploadType === 'video' && (
                          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-2">
                            <label className="block text-xs font-mono text-cyan-300 uppercase tracking-wider font-semibold">
                              Poster Frame Image (Optional — Fallback / Initial Frame, Max 5 MB)
                            </label>
                            <p className="text-[11px] text-slate-400">
                              Displayed as the preview frame before playback begins or when reduced motion is preferred.
                            </p>
                            <div className="space-y-3 pt-1">
                              <div>
                                <label className="block text-[11px] font-mono text-slate-400 mb-1 uppercase">
                                  CHOOSE POSTER IMAGE FILE (JPEG, PNG, WebP)
                                </label>
                                <input
                                  ref={posterFileInputRef}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={handlePosterFileChange}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer min-h-[44px]"
                                />
                              </div>

                              {posterPreviewUrl && (
                                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/90 border border-cyan-500/30">
                                  <img
                                    src={posterPreviewUrl}
                                    alt="Poster preview"
                                    className="w-20 aspect-video object-cover rounded border border-slate-700"
                                  />
                                  <div className="flex-1 min-w-0 text-xs">
                                    <p className="font-semibold text-white truncate">{posterFile?.name}</p>
                                    <p className="text-[11px] text-slate-400 font-mono">
                                      {posterFile ? formatFileSize(posterFile.size) : ''}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={clearPoster}
                                    className="px-2.5 py-1 text-xs text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}

                              <div>
                                <label className="block text-[11px] font-mono text-slate-400 mb-1 uppercase">
                                  Or specify Poster URL:
                                </label>
                                <input
                                  type="text"
                                  value={posterUrlInput}
                                  onChange={(e) => setPosterUrlInput(e.target.value)}
                                  placeholder="https://... or /assets/..."
                                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 min-h-[44px]"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Alt Text (Required for image) */}
                    {uploadType === 'image' && (
                      <div>
                        <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                          Alt Text (Required for screen-readers & SEO) *
                        </label>
                        <input
                          type="text"
                          value={altInput}
                          onChange={(e) => setAltInput(e.target.value)}
                          placeholder="Describe the image content accurately..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 min-h-[44px]"
                          required
                        />
                      </div>
                    )}

                    {/* Metadata fields: Title, Caption, CTA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                          Slide Title (Optional)
                        </label>
                        <input
                          type="text"
                          value={titleInput}
                          onChange={(e) => setTitleInput(e.target.value)}
                          placeholder="e.g. Sovereign Intelligence"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                          Caption / Subtitle (Optional)
                        </label>
                        <input
                          type="text"
                          value={captionInput}
                          onChange={(e) => setCaptionInput(e.target.value)}
                          placeholder="Brief supporting copy..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                          CTA Button Label (Optional)
                        </label>
                        <input
                          type="text"
                          value={ctaLabelInput}
                          onChange={(e) => setCtaLabelInput(e.target.value)}
                          placeholder="e.g. Explore Apps"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                          CTA Destination (e.g. /apps or https://...)
                        </label>
                        <input
                          type="text"
                          value={ctaUrlInput}
                          onChange={(e) => setCtaUrlInput(e.target.value)}
                          placeholder="/apps or https://..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 min-h-[44px]"
                        />
                      </div>
                    </div>

                    {formError && (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                        {formError}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(25,217,255,0.4)] flex items-center justify-center gap-2 transition-all min-h-[44px]"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing & Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            <span>
                              {isSingleItemSlot && currentItems.length > 0
                                ? 'Upload & Replace Asset'
                                : 'Upload to Slot'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 3. Existing Items in Slot */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white font-display">
                    Current Slot Items ({currentItems.length})
                  </h4>
                  <span className="text-xs text-slate-400">
                    {currentItems.filter((i) => i.published).length} published on live site
                  </span>
                </div>

                {isLoadingDetail ? (
                  <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                  </div>
                ) : currentItems.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center space-y-2">
                    <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-300">No items in this slot</p>
                    <p className="text-xs text-slate-500">
                      Upload an asset using the form above to display it on the Home page.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentItems.map((item, index) => {
                      const isPublished = item.published;
                      const isEditing = editingItemMap[item.id] !== undefined;
                      const editValues = editingItemMap[item.id] || {};
                      const isConfirmingDelete = confirmDeleteId === item.id;

                      return (
                        <div
                          key={item.id}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                            isPublished
                              ? 'bg-[#040818]/90 border-cyan-500/30'
                              : 'bg-slate-900/40 border-slate-800'
                          }`}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            
                            {/* Visual Asset Preview (4 cols) */}
                            <div className="md:col-span-4 space-y-2">
                              <div
                                className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center"
                                style={{ aspectRatio: currentEffective?.aspect ? currentEffective.aspect.replace(':', '/') : (currentSlot?.aspect ? currentSlot.aspect.replace(':', '/') : '16/9') }}
                              >
                                {item.type === 'video' ? (
                                  item.url ? (
                                    <video
                                      src={item.url}
                                      poster={item.poster_url || undefined}
                                      controls
                                      muted
                                      playsInline
                                      className="w-full h-full object-cover"
                                      preload="none"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center gap-1 text-slate-500 text-xs">
                                      <Film className="w-6 h-6" />
                                      <span>Video item</span>
                                    </div>
                                  )
                                ) : item.type === 'url' ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-900">
                                    <LinkIcon className="w-6 h-6 text-purple-400 mb-1" />
                                    <span className="text-[11px] text-slate-300 font-mono break-all line-clamp-2">
                                      {item.url}
                                    </span>
                                    <a
                                      href={item.url || '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                                    >
                                      <span>Open Link</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                ) : (
                                  <img
                                    src={item.url || ''}
                                    alt={item.alt || 'Media item'}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                )}

                                {/* Status Tag */}
                                <div className="absolute top-2 left-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                      isPublished
                                        ? 'bg-emerald-500 text-slate-950 shadow'
                                        : 'bg-slate-800/90 text-slate-400 border border-slate-700'
                                    }`}
                                  >
                                    {isPublished ? 'Published' : 'Draft'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-[10px] font-mono text-slate-500 truncate">
                                ID: {item.id}
                              </div>
                            </div>

                            {/* Details & Inline Edit Controls (8 cols) */}
                            <div className="md:col-span-8 space-y-3">
                              
                              {/* Top Bar of item: Order buttons & Publish Toggle */}
                              <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-800/60">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleMoveOrder(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    title="Move item up"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveOrder(index, 'down')}
                                    disabled={index === currentItems.length - 1}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    title="Move item down"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                  <span className="text-[11px] font-mono text-slate-400 ml-2">
                                    Slide #{index + 1}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Publish toggle */}
                                  <button
                                    onClick={() => handleTogglePublish(item)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all min-h-[44px] cursor-pointer ${
                                      isPublished
                                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                        : 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 hover:from-cyan-500/35 hover:to-blue-500/35 text-cyan-200 border border-cyan-400/60 shadow-[0_0_15px_rgba(25,217,255,0.25)] font-bold'
                                    }`}
                                    title={isPublished ? 'Live on public site - click to unpublish' : 'Click to publish this item live to the site'}
                                  >
                                    {isPublished ? (
                                      <>
                                        <Eye className="w-4 h-4 text-emerald-400" />
                                        <span>Published</span>
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="w-4 h-4 text-cyan-300 animate-pulse" />
                                        <span className="text-white font-bold tracking-wide">Publish Item</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Delete button */}
                                  {isConfirmingDelete ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleDeleteItem(item)}
                                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 min-h-[44px]"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs min-h-[44px]"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteId(item.id)}
                                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/40 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                      title="Delete item"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Form fields for inline edits */}
                              <div className="space-y-2 text-xs">
                                <div>
                                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
                                    Alt Text {item.type === 'image' && '*'}
                                  </label>
                                  <input
                                    type="text"
                                    value={editValues.alt !== undefined ? editValues.alt : item.alt || ''}
                                    onChange={(e) =>
                                      setEditingItemMap((prev) => ({
                                        ...prev,
                                        [item.id]: { ...(prev[item.id] || {}), alt: e.target.value },
                                      }))
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 min-h-[44px]"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
                                      Title
                                    </label>
                                    <input
                                      type="text"
                                      value={editValues.title !== undefined ? editValues.title : item.title || ''}
                                      onChange={(e) =>
                                        setEditingItemMap((prev) => ({
                                          ...prev,
                                          [item.id]: { ...(prev[item.id] || {}), title: e.target.value },
                                        }))
                                      }
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 min-h-[44px]"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
                                      Caption
                                    </label>
                                    <input
                                      type="text"
                                      value={editValues.caption !== undefined ? editValues.caption : item.caption || ''}
                                      onChange={(e) =>
                                        setEditingItemMap((prev) => ({
                                          ...prev,
                                          [item.id]: { ...(prev[item.id] || {}), caption: e.target.value },
                                        }))
                                      }
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 min-h-[44px]"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
                                      CTA Label
                                    </label>
                                    <input
                                      type="text"
                                      value={editValues.cta_label !== undefined ? editValues.cta_label : item.cta_label || ''}
                                      onChange={(e) =>
                                        setEditingItemMap((prev) => ({
                                          ...prev,
                                          [item.id]: { ...(prev[item.id] || {}), cta_label: e.target.value },
                                        }))
                                      }
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 min-h-[44px]"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
                                      CTA Destination URL
                                    </label>
                                    <input
                                      type="text"
                                      value={editValues.cta_url !== undefined ? editValues.cta_url : item.cta_url || ''}
                                      onChange={(e) =>
                                        setEditingItemMap((prev) => ({
                                          ...prev,
                                          [item.id]: { ...(prev[item.id] || {}), cta_url: e.target.value },
                                        }))
                                      }
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 min-h-[44px]"
                                    />
                                  </div>
                                </div>

                                {/* Save Button if modified */}
                                {isEditing && (
                                  <div className="flex items-center gap-2 pt-2">
                                    <button
                                      onClick={() => handleSaveItemEdits(item)}
                                      disabled={savingItemId === item.id}
                                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors min-h-[44px]"
                                    >
                                      {savingItemId === item.id ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Save className="w-3.5 h-3.5" />
                                      )}
                                      <span>Save Changes</span>
                                    </button>
                                    <button
                                      onClick={() =>
                                        setEditingItemMap((prev) => {
                                          const next = { ...prev };
                                          delete next[item.id];
                                          return next;
                                        })
                                      }
                                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs min-h-[44px]"
                                    >
                                      Discard
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
