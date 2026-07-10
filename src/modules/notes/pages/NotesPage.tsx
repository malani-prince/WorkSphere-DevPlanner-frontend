import React, { useEffect, useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Edit2, 
  Eye, 
  BookOpen, 
  Folder, 
  FolderOpen, 
  Edit3,
  Search,
  ArrowUpDown,
  ChevronDown,
  Loader2,
  Copy
} from 'lucide-react';
import { notesApi } from '../api';
import type { NoteCategory, Note } from '../types';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

export const NotesPage: React.FC = () => {
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<NoteCategory | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Loading & error states
  const [catLoading, setCatLoading] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'recently_added' | 'recently_updated'>('recently_added');
  const [activeSubTab, setActiveSubTab] = useState<'edit' | 'preview'>('edit');

  // Sidebar Toggles
  const [isFoldersSidebarOpen, setIsFoldersSidebarOpen] = useState(true);
  const [isNotesSidebarOpen, setIsNotesSidebarOpen] = useState(true);

  // Modals state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catModalMode, setCatModalMode] = useState<'create' | 'rename'>('create');
  const [catFormName, setCatFormName] = useState('');

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

  // Load categories on mount
  const loadCategories = async () => {
    setCatLoading(true);
    try {
      const cats = await notesApi.getCategories();
      setCategories(cats);
      if (cats.length > 0 && !selectedCat) {
        setSelectedCat(cats[0]);
      }
    } catch (err: any) {
      console.error(err);
      showErrorAlert(err.message || 'Failed to load folders');
    } finally {
      setCatLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Load notes when selected category changes or sort/search changes
  const loadNotes = async (silent = false) => {
    if (!selectedCat) return;
    if (!silent) setNoteLoading(true);
    try {
      const params: any = { sort_by: sortBy };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const data = await notesApi.getNotes(selectedCat._id, params);
      setNotes(data);
      
      // Auto-select first note if none selected or if selected note is not in new folder
      if (data.length > 0) {
        const found = data.find(n => n._id === selectedNote?._id);
        if (!found) {
          setSelectedNote(data[0]);
        } else {
          // Sync selected note content
          setSelectedNote(found);
        }
      } else {
        setSelectedNote(null);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setNoteLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [selectedCat, sortBy, searchQuery]);

  // Category Folder Actions
  const handleOpenCreateCat = () => {
    setCatModalMode('create');
    setCatFormName('');
    setIsCatModalOpen(true);
  };

  const handleOpenRenameCat = (cat: NoteCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setCatModalMode('rename');
    setSelectedCat(cat);
    setCatFormName(cat.name);
    setIsCatModalOpen(true);
  };

  const handleDeleteCat = async (cat: NoteCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Folder',
      message: `Are you sure you want to delete folder "${cat.name}" and all notes stored inside?`,
      type: 'confirm',
      confirmText: 'Delete Folder',
      onConfirm: async () => {
        try {
          await notesApi.deleteCategory(cat._id);
          setSelectedCat(null);
          setSelectedNote(null);
          await loadCategories();
        } catch (err: any) {
          showErrorAlert(err.message || 'Failed to delete folder');
        }
      }
    });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormName.trim()) return;

    try {
      if (catModalMode === 'create') {
        const newCat = await notesApi.createCategory({ name: catFormName.trim() });
        setSelectedCat(newCat);
      } else if (catModalMode === 'rename' && selectedCat) {
        await notesApi.renameCategory(selectedCat._id, { name: catFormName.trim() });
      }
      setIsCatModalOpen(false);
      await loadCategories();
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to save category folder');
    }
  };

  // Note Actions
  const handleCreateNote = async () => {
    if (!selectedCat) return;
    try {
      const newNote = await notesApi.createNote(selectedCat._id, {
        title: `Untitled Note ${notes.length + 1}`,
        content: '# Untitled Note\n\nStart writing in markdown here...'
      });
      await loadNotes(true);
      setSelectedNote(newNote);
      setActiveSubTab('edit');
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to create note');
    }
  };

  const handleDeleteNote = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Note',
      message: `Are you sure you want to delete note "${note.title}"?`,
      type: 'confirm',
      confirmText: 'Delete Note',
      onConfirm: async () => {
        try {
          await notesApi.deleteNote(note._id);
          if (selectedNote?._id === note._id) {
            setSelectedNote(null);
          }
          await loadNotes(true);
        } catch (err: any) {
          showErrorAlert(err.message || 'Failed to delete note');
        }
      }
    });
  };

  // Debounced auto-save or simple saving on blur/change
  const saveTimeoutRef = useRef<any>(null);

  const handleUpdateNote = (fields: Partial<Note>) => {
    if (!selectedNote) return;

    // Optimistically update selectedNote state locally
    const updatedNote = { ...selectedNote, ...fields };
    setSelectedNote(updatedNote);

    // Update notes array locally to prevent list flicker
    setNotes(prev => prev.map(n => n._id === selectedNote._id ? { ...n, ...fields } : n));

    // Debounce API save call by 500ms
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await notesApi.updateNote(selectedNote._id, {
          title: updatedNote.title,
          content: updatedNote.content,
          category_id: updatedNote.category_id
        });
      } catch (err: any) {
        console.error('Failed to auto-save note details:', err);
      }
    }, 500);
  };

  const handleCopyNoteContent = () => {
    if (!selectedNote) return;
    navigator.clipboard.writeText(selectedNote.content);
    showInfoAlert('Markdown text successfully copied to clipboard!');
  };

  // A premium regex markdown parser
  const renderMarkdown = (text: string) => {
    if (!text) return '<p class="text-sm italic text-slate-400">No content provided.</p>';
    
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs my-4 overflow-x-auto border border-slate-800"><code>$1</code></pre>');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-slate-800 mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-slate-800 mt-5 mb-2.5 pb-1 border-b border-slate-100">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');

    // Inline code
    html = html.replace(/`(.*?)`/g, '<code class="bg-slate-100 text-slate-850 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>');

    // Lists
    html = html.replace(/^\s*-\s+\[\s*\]\s+(.*$)/gim, '<div class="flex items-center gap-2 my-1.5"><input type="checkbox" disabled class="rounded border-slate-300" /> <span class="text-sm text-slate-650">$1</span></div>');
    html = html.replace(/^\s*-\s+\[\s*[xX]\s*\]\s+(.*$)/gim, '<div class="flex items-center gap-2 my-1.5"><input type="checkbox" checked disabled class="rounded border-slate-300" /> <span class="text-sm text-slate-400 line-through">$1</span></div>');
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="list-disc ml-5 text-sm text-slate-650 my-1">$1</li>');

    // Line breaks
    const lines = html.split('\n');
    const formatted = lines.map(line => {
      const trimmed = line.trim();
      if (
        trimmed.startsWith('<h') || 
        trimmed.startsWith('<pre') || 
        trimmed.startsWith('<code') || 
        trimmed.startsWith('<li') || 
        trimmed.startsWith('<div') || 
        trimmed === ''
      ) {
        return line;
      }
      return `<p class="text-sm text-slate-650 leading-relaxed my-2.5">${line}</p>`;
    });

    return formatted.join('\n');
  };

  return (
    <div className="flex gap-6 h-full min-h-0 animate-fade-in w-full">
      
      {/* 1. Left Sidebar: Category Folders */}
      <div className={`flex flex-col bg-white border border-slate-200 rounded-2xl p-4 shadow-sm h-full min-h-0 transition-all duration-300 overflow-hidden shrink-0 ${isFoldersSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 p-0 border-transparent border-0'}`}>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 shrink-0">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pl-1">Folders</h3>
          <button
            onClick={handleOpenCreateCat}
            className="p-1 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors cursor-pointer"
            title="Create New Folder"
          >
            <Plus size={18} />
          </button>
        </div>

        {catLoading ? (
          <div className="flex justify-center items-center py-12 flex-1">
            <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-slate-400 italic flex-1 flex items-center justify-center text-xs">
            Create folder to organize notes.
          </div>
        ) : (
          <div className="space-y-1 overflow-y-auto flex-1 pr-1">
            {categories.map((cat) => (
              <div
                key={cat._id}
                onClick={() => {
                  setSelectedCat(cat);
                  setSearchQuery('');
                }}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 select-none ${
                  selectedCat?._id === cat._id
                    ? 'bg-slate-50 border border-slate-200 font-semibold text-slate-800'
                    : 'text-slate-600 hover:bg-slate-50/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {selectedCat?._id === cat._id ? (
                    <FolderOpen size={16} className="text-primary-500 shrink-0" />
                  ) : (
                    <Folder size={16} className="text-slate-450 shrink-0" />
                  )}
                  <span className="truncate text-sm">{cat.name}</span>
                </div>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity shrink-0 ml-1">
                  <button
                    onClick={(e) => handleOpenRenameCat(cat, e)}
                    className="p-1 hover:bg-slate-200/50 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Rename Category"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteCat(cat, e)}
                    className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-650 cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Middle Panel: Note Titles & Search */}
      <div className={`flex flex-col bg-white border border-slate-200 rounded-2xl p-4 shadow-sm h-full min-h-0 transition-all duration-300 overflow-hidden shrink-0 ${isNotesSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 p-0 border-transparent border-0'}`}>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 shrink-0">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pl-1">Notes</h3>
          {selectedCat && (
            <button
              onClick={handleCreateNote}
              className="p-1 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors cursor-pointer"
              title="Add Markdown Note"
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        {selectedCat ? (
          <>
            {/* Search and Sort Toolbar */}
            <div className="space-y-2 mb-3 shrink-0">
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Search size={13} />
                </span>
                <input
                  type="text"
                  placeholder="Search note body..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-450">
                  <ArrowUpDown size={11} />
                </span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white appearance-none cursor-pointer font-medium text-slate-700"
                >
                  <option value="recently_added">Recently Added</option>
                  <option value="recently_updated">Recently Updated</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Note items list */}
            {noteLoading ? (
              <div className="flex justify-center items-center py-12 flex-1">
                <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic flex-1 flex items-center justify-center text-xs">
                No notes found.
              </div>
            ) : (
              <div className="space-y-1 overflow-y-auto flex-1 pr-1">
                {notes.map((note) => (
                  <div
                    key={note._id}
                    onClick={() => {
                      setSelectedNote(note);
                      setActiveSubTab('edit');
                    }}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 select-none ${
                      selectedNote?._id === note._id
                        ? 'bg-slate-50 border border-slate-200 font-semibold text-slate-800'
                        : 'text-slate-600 hover:bg-slate-50/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen size={14} className={selectedNote?._id === note._id ? 'text-primary-500' : 'text-slate-400'} />
                      <span className="truncate text-xs">{note.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteNote(e, note)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-slate-400 italic flex-1 flex items-center justify-center text-xs">
            Select folder to view notes.
          </div>
        )}
      </div>

      {/* 3. Right Workspace Panel: Editor / Previewer */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-w-0 h-full">
        {/* Toolbar Panel (Rendered Unconditionally) */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-slate-50/30">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Sidebar Toggle Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-150 select-none shrink-0">
              <button
                type="button"
                onClick={() => setIsFoldersSidebarOpen(!isFoldersSidebarOpen)}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  isFoldersSidebarOpen 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title={isFoldersSidebarOpen ? "Collapse Folders Sidebar" : "Expand Folders Sidebar"}
              >
                <Folder size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsNotesSidebarOpen(!isNotesSidebarOpen)}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  isNotesSidebarOpen 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title={isNotesSidebarOpen ? "Collapse Notes Sidebar" : "Expand Notes Sidebar"}
              >
                <BookOpen size={14} />
              </button>
            </div>

            {selectedNote ? (
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => handleUpdateNote({ title: e.target.value })}
                placeholder="Note Title..."
                className="flex-1 font-bold text-slate-800 bg-transparent border-0 outline-none text-sm focus:ring-0 placeholder-slate-400 p-0 truncate"
              />
            ) : (
              <span className="font-bold text-slate-400 text-sm">Notes Workspace</span>
            )}
          </div>

          {selectedNote && (
            /* Action buttons & selectors */
            <div className="flex items-center gap-2 select-none shrink-0">
              {/* Copy Markdown button */}
              <button
                type="button"
                onClick={handleCopyNoteContent}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                title="Copy markdown text"
              >
                <Copy size={12} />
                <span>Copy</span>
              </button>

              {/* Subtab Selectors */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-150">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('edit')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeSubTab === 'edit'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-750'
                  }`}
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('preview')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeSubTab === 'preview'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-750'
                  }`}
                >
                  <Eye size={12} />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Body Content (Conditional on selectedNote) */}
        {!selectedNote ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 p-8 bg-transparent">
            <FileText size={36} className="text-slate-350 stroke-[1.5]" />
            <span className="text-sm font-semibold">No Note Selected</span>
            <p className="text-xs text-slate-450 max-w-xs text-center leading-relaxed">
              Select or create a markdown note on the left toolbar column to begin writing.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Editing Textarea Workspace */}
            {activeSubTab === 'edit' ? (
              <div className="flex-1 p-4 min-h-0">
                <textarea
                  value={selectedNote.content}
                  onChange={(e) => handleUpdateNote({ content: e.target.value })}
                  placeholder="# Enter your markdown text here..."
                  className="w-full h-full border-0 outline-none resize-none focus:ring-0 text-sm font-mono text-slate-800 placeholder-slate-400 bg-transparent p-0 leading-relaxed overflow-y-auto"
                />
              </div>
            ) : (
              /* Preview markdown container */
              <div className="flex-1 p-6 overflow-y-auto markdown-preview-body min-h-0 bg-transparent">
                <div 
                  className="prose prose-slate max-w-none text-slate-850"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedNote.content) }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={catModalMode === 'create' ? 'Create Folder' : 'Rename Folder'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Folder Name</label>
            <input
              type="text"
              placeholder="e.g. Project Architecture Guidelines"
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
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              {catModalMode === 'create' ? 'Create Folder' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
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
