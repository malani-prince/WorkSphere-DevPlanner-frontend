import React, { useEffect, useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Search, 
  ArrowUpDown, 
  Loader2, 
  AlertCircle,
  FileText,
  ChevronDown,
  Globe,
  Copy,
  LayoutGrid,
  Table2
} from 'lucide-react';
import { linksApi } from '../api';
import type { LinkCategory, LinkItem } from '../types';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

export const LinkManagerPage: React.FC = () => {
  const getFaviconUrl = (urlStr: string) => {
    try {
      const url = new URL(urlStr);
      return `https://www.google.com/s2/favicons?sz=64&domain=${url.hostname}`;
    } catch (e) {
      return null;
    }
  };

  const handleCopyLink = (urlStr: string) => {
    navigator.clipboard.writeText(urlStr);
    showInfoAlert('Link URL successfully copied to clipboard!');
  };
  const [categories, setCategories] = useState<LinkCategory[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<LinkCategory | null>(null);
  
  // Loading & error state
  const [catLoading, setCatLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recently_added' | 'recently_updated' | 'alphabetical'>('recently_added');

  // Category Modals / Actions State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catModalMode, setCatModalMode] = useState<'create' | 'rename'>('create');
  const [catFormName, setCatFormName] = useState('');

  // Link Modals / Actions State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalMode, setLinkModalMode] = useState<'create' | 'edit'>('create');
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [linkForm, setLinkForm] = useState({
    title: '',
    subtitle: '',
    url: '',
    notes: '',
    category_id: ''
  });

  // View Mode Toggle
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'confirm' | 'alert' | 'error';
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showErrorAlert = (message: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Action Error',
      message: message,
      type: 'error',
      onConfirm: () => {},
    });
  };

  const showInfoAlert = (message: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Information',
      message: message,
      type: 'alert',
      onConfirm: () => {},
    });
  };

  const loadCategories = async () => {
    setCatLoading(true);
    setError(null);
    try {
      const cats = await linksApi.getCategories();
      setCategories(cats);
      if (cats.length > 0 && !selectedCat) {
        // Default select first category
        setSelectedCat(cats[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load link folders');
    } finally {
      setCatLoading(false);
    }
  };

  const loadLinks = async () => {
    if (!selectedCat) return;
    setLinkLoading(true);
    try {
      const params = {
        search: searchQuery.trim() || undefined,
        sort_by: sortBy
      };
      const items = await linksApi.getLinks(selectedCat._id, params);
      setLinks(items);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load links');
    } finally {
      setLinkLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadLinks();
  }, [selectedCat, searchQuery, sortBy]);

  // Category Handlers
  const handleOpenCreateCat = () => {
    setCatModalMode('create');
    setCatFormName('');
    setIsCatModalOpen(true);
  };

  const handleOpenRenameCat = (cat: LinkCategory, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting category
    setCatModalMode('rename');
    setSelectedCat(cat);
    setCatFormName(cat.name);
    setIsCatModalOpen(true);
  };

  const handleDeleteCat = async (cat: LinkCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete folder "${cat.name}" and all bookmarks stored inside?`,
      type: 'confirm',
      confirmText: 'Delete Folder',
      onConfirm: async () => {
        try {
          await linksApi.deleteCategory(cat._id);
          setSelectedCat(null);
          await loadCategories();
        } catch (err: any) {
          showErrorAlert(err.message || 'Error deleting category');
        }
      }
    });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormName.trim()) return;

    try {
      if (catModalMode === 'create') {
        const newCat = await linksApi.createCategory(catFormName.trim());
        setSelectedCat(newCat);
      } else if (catModalMode === 'rename' && selectedCat) {
        await linksApi.renameCategory(selectedCat._id, catFormName.trim());
      }
      setIsCatModalOpen(false);
      await loadCategories();
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to save folder');
    }
  };

  // Link Handlers
  const handleOpenCreateLink = () => {
    if (!selectedCat) return;
    setLinkModalMode('create');
    setEditingLink(null);
    setLinkForm({
      title: '',
      subtitle: '',
      url: '',
      notes: '',
      category_id: selectedCat._id
    });
    setIsLinkModalOpen(true);
  };

  const handleOpenEditLink = (link: LinkItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setLinkModalMode('edit');
    setEditingLink(link);
    setLinkForm({
      title: link.title,
      subtitle: link.subtitle,
      url: link.url,
      notes: link.notes || '',
      category_id: link.category_id
    });
    setIsLinkModalOpen(true);
  };

  const handleDeleteLink = async (link: LinkItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Bookmark',
      message: `Are you sure you want to delete "${link.title}" bookmark?`,
      type: 'confirm',
      confirmText: 'Delete Link',
      onConfirm: async () => {
        try {
          await linksApi.deleteLink(link._id);
          loadLinks();
        } catch (err: any) {
          showErrorAlert(err.message || 'Error deleting link');
        }
      }
    });
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.title.trim() || !linkForm.url.trim()) return;

    if (!linkForm.url.startsWith('http://') && !linkForm.url.startsWith('https://')) {
      showErrorAlert('Please enter a valid URL including http:// or https://');
      return;
    }

    try {
      if (linkModalMode === 'create' && selectedCat) {
        await linksApi.addLink(selectedCat._id, {
          title: linkForm.title.trim(),
          subtitle: linkForm.subtitle.trim(),
          url: linkForm.url.trim(),
          notes: linkForm.notes.trim() || undefined
        });
      } else if (linkModalMode === 'edit' && editingLink) {
        await linksApi.editLink(editingLink._id, {
          title: linkForm.title.trim(),
          subtitle: linkForm.subtitle.trim(),
          url: linkForm.url.trim(),
          notes: linkForm.notes.trim() || undefined,
          category_id: linkForm.category_id !== editingLink.category_id ? linkForm.category_id : undefined
        });
      }
      setIsLinkModalOpen(false);
      loadLinks();
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to save bookmark link');
    }
  };

  return (
    <div className="flex gap-6 h-full min-h-0 w-full">
      {/* 1. Left Sidebar: Categories Folders */}
      <div className="w-64 shrink-0 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-full min-h-0">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pl-1">Link Categories</h3>
          <button
            onClick={handleOpenCreateCat}
            className="p-1 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"
            title="Create New Folder Category"
          >
            <Plus size={18} />
          </button>
        </div>

        {catLoading ? (
          <div className="flex justify-center items-center py-12 flex-1">
            <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-slate-450 italic flex-1 flex items-center justify-center">
            No folders created.
          </div>
        ) : (
          <div className="space-y-1 overflow-y-auto flex-1 pr-1">
            {categories.map((cat) => {
              const isSelected = selectedCat?._id === cat._id;
              return (
                <div
                  key={cat._id}
                  onClick={() => setSelectedCat(cat)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 relative group ${
                    isSelected 
                      ? 'bg-primary-50/55 text-primary-700 font-semibold border-l-4 border-primary-500 pl-2' 
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {isSelected ? (
                      <FolderOpen size={16} className="text-primary-550 shrink-0" />
                    ) : (
                      <Folder size={16} className="text-slate-400 shrink-0" />
                    )}
                    <span className="truncate text-sm">{cat.name}</span>
                  </div>

                  {/* Options bar, appears on hover */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity shrink-0 ml-1">
                    <button
                      onClick={(e) => handleOpenRenameCat(cat, e)}
                      className="p-1 hover:bg-slate-200/50 rounded text-slate-450 hover:text-slate-700"
                      title="Rename Category"
                    >
                      <Edit3 size={12} />
                    </button>
                    {/* Don't allow deletion if only 1 remains, or verify */}
                    <button
                      onClick={(e) => handleDeleteCat(cat, e)}
                      className="p-1 hover:bg-red-50 rounded text-slate-455 hover:text-red-650"
                      title="Delete Category"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Right Workspace: Links Panel */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-w-0 h-full min-h-0">
        {selectedCat ? (
          <>
            {/* Folder Header Toolbar */}
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800 truncate">{selectedCat.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{links.length} bookmark{links.length !== 1 ? 's' : ''}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Search size={13} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search links..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white w-48"
                  />
                </div>

                {/* Sort Selector */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400">
                    <ArrowUpDown size={11} />
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="pl-7 pr-7 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white appearance-none cursor-pointer font-medium text-slate-700"
                  >
                    <option value="recently_added">Recent</option>
                    <option value="recently_updated">Updated</option>
                    <option value="alphabetical">A–Z</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                    <ChevronDown size={13} />
                  </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 select-none">
                  <button
                    type="button"
                    onClick={() => setViewMode('card')}
                    title="Card View"
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'card' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    title="Table View"
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'table' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Table2 size={14} />
                  </button>
                </div>

                {/* Add Link Button */}
                <button
                  onClick={handleOpenCreateLink}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  <span>Add Link</span>
                </button>
              </div>
            </div>

            {/* Content Area — scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 p-5">
              {linkLoading ? (
                <div className="flex flex-col justify-center items-center gap-2 text-slate-450 py-20">
                  <Loader2 className="w-7 h-7 animate-spin text-primary-500" />
                  <span className="text-xs">Loading bookmarks...</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl text-xs">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              ) : links.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl p-6">
                  <FileText className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-500 mb-1">No bookmark links found</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                    Add docs, GitHub repos, references, or stack links inside this folder.
                  </p>
                  <button
                    onClick={handleOpenCreateLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Add Bookmark Link</span>
                  </button>
                </div>
              ) : viewMode === 'card' ? (
                /* ── CARD VIEW ── */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {links.map((link) => {
                    const favicon = getFaviconUrl(link.url);
                    return (
                      <div
                        key={link._id}
                        className="p-5 rounded-2xl bg-white border border-slate-175 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 flex flex-col animate-fade-in group"
                      >
                        {/* Top Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                              {favicon ? (
                                <img
                                  src={favicon}
                                  alt=""
                                  className="w-5 h-5 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400 w-4 h-4" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>';
                                    }
                                  }}
                                />
                              ) : (
                                <Globe size={15} className="text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-bold text-slate-850 hover:text-primary-600 hover:underline flex items-center gap-1 truncate"
                              >
                                <span className="truncate">{link.title}</span>
                                <ExternalLink size={11} className="shrink-0 text-slate-400" />
                              </a>
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-150 px-2 py-0.5 rounded-md mt-1 inline-block select-none">
                                {link.subtitle || 'General'}
                              </span>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                            <button onClick={(e) => handleOpenEditLink(link, e)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer" title="Edit">
                              <Edit3 size={12} />
                            </button>
                            <button onClick={(e) => handleDeleteLink(link, e)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer" title="Delete">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* URL Tag */}
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-slate-400 hover:text-primary-600 truncate mt-3 block font-mono bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100"
                        >
                          {link.url}
                        </a>

                        {link.notes && (
                          <p className="mt-2.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">{link.notes}</p>
                        )}

                        {/* Bottom Actions */}
                        <div className="mt-auto pt-3.5 flex items-center gap-2 select-none">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-xl text-xs font-bold transition-colors border border-primary-100/50"
                          >
                            <ExternalLink size={12} />
                            <span>Visit Link</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(link.url)}
                            className="flex items-center justify-center p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer"
                            title="Copy URL"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ── TABLE VIEW ── */
                <div className="overflow-x-auto rounded-xl border border-slate-150">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150">
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-8"></th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Tag</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">URL</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Notes</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {links.map((link) => {
                        const favicon = getFaviconUrl(link.url);
                        return (
                          <tr key={link._id} className="group hover:bg-slate-50/80 transition-colors">
                            {/* Favicon */}
                            <td className="px-4 py-3">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-150 flex items-center justify-center overflow-hidden">
                                {favicon ? (
                                  <img
                                    src={favicon}
                                    alt=""
                                    className="w-4 h-4 object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        parent.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400 w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>';
                                      }
                                    }}
                                  />
                                ) : (
                                  <Globe size={13} className="text-slate-400" />
                                )}
                              </div>
                            </td>
                            {/* Title */}
                            <td className="px-4 py-3 max-w-[180px]">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-slate-800 hover:text-primary-600 hover:underline flex items-center gap-1.5 truncate text-xs"
                              >
                                <span className="truncate">{link.title}</span>
                                <ExternalLink size={10} className="shrink-0 text-slate-400" />
                              </a>
                            </td>
                            {/* Tag */}
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md select-none">
                                {link.subtitle || 'General'}
                              </span>
                            </td>
                            {/* URL */}
                            <td className="px-4 py-3 max-w-[200px] hidden md:table-cell">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-slate-400 hover:text-primary-600 font-mono truncate block"
                              >
                                {link.url}
                              </a>
                            </td>
                            {/* Notes */}
                            <td className="px-4 py-3 max-w-[200px] hidden lg:table-cell">
                              <p className="text-xs text-slate-500 truncate">{link.notes || '—'}</p>
                            </td>
                            {/* Actions */}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-lg cursor-pointer transition-colors"
                                  title="Visit Link"
                                >
                                  <ExternalLink size={13} />
                                </a>
                                <button
                                  onClick={() => handleCopyLink(link.url)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
                                  title="Copy URL"
                                >
                                  <Copy size={13} />
                                </button>
                                <button
                                  onClick={(e) => handleOpenEditLink(link, e)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
                                  title="Edit"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteLink(link, e)}
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2 p-8">
            <Folder size={36} className="text-slate-300 stroke-[1.5]" />
            <span className="text-sm font-semibold">No Folder Selected</span>
            <p className="text-xs text-slate-400 max-w-xs text-center leading-relaxed">
              Please select or create a category folder from the left sidebar to begin managing your bookmarks.
            </p>
          </div>
        )}
      </div>

      {/* Category Creation / Rename Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={catModalMode === 'create' ? 'Create Category Folder' : 'Rename Folder Category'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Folder Name</label>
            <input
              type="text"
              placeholder="e.g. Docker, CSS Tricks, Machine Learning"
              value={catFormName}
              onChange={(e) => setCatFormName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              {catModalMode === 'create' ? 'Create Folder' : 'Rename Folder'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bookmark Link Creation / Edit Modal */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title={linkModalMode === 'create' ? 'Add Bookmark Link' : 'Edit Bookmark Details'}
      >
        <form onSubmit={handleSaveLink} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bookmark Title</label>
            <input
              type="text"
              placeholder="e.g. React hooks docs"
              value={linkForm.title}
              onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subtitle / Tag</label>
            <input
              type="text"
              placeholder="e.g. State Management, SDK Reference"
              value={linkForm.subtitle}
              onChange={(e) => setLinkForm({ ...linkForm, subtitle: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Destination URL</label>
            <input
              type="url"
              placeholder="e.g. https://react.dev/reference/react"
              value={linkForm.url}
              onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
            <textarea
              placeholder="Enter helpful developer notes, tips, or shortcuts for this bookmark..."
              value={linkForm.notes}
              onChange={(e) => setLinkForm({ ...linkForm, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            />
          </div>

          {/* Folder Category selector (for editing / moving) */}
          {linkModalMode === 'edit' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Move to Folder</label>
              <div className="relative">
                <select
                  value={linkForm.category_id}
                  onChange={(e) => setLinkForm({ ...linkForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white cursor-pointer appearance-none text-slate-700"
                >
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-400">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              {linkModalMode === 'create' ? 'Add Bookmark' : 'Save Details'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
