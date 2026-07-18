import React, { useEffect, useState } from 'react';
import { 
  Briefcase, 
  Calendar as CalendarIcon, 
  Bookmark, 
  Clock, 
  Settings as SettingsIcon,
  FileText
} from 'lucide-react';
import { DashboardPage } from './modules/tasks/pages/DashboardPage';
import { CalendarPage } from './modules/calendar/pages/CalendarPage';
import { LinkManagerPage } from './modules/links/pages/LinkManagerPage';
import { SettingsPage } from './modules/tasks/pages/SettingsPage';
import { NotesPage } from './modules/notes/pages/NotesPage';

type TabType = 'tasks' | 'calendar' | 'links' | 'notes' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    const saved = localStorage.getItem('devplanner_active_tab');
    if (saved && ['tasks', 'calendar', 'links', 'notes', 'settings'].includes(saved)) {
      return saved as TabType;
    }
    return 'tasks';
  });

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    localStorage.setItem('devplanner_active_tab', tab);
  };
  


  const [localTime, setLocalTime] = useState(new Date());

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setLocalTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);





  // Render current tab component
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return <DashboardPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'links':
        return <LinkManagerPage />;
      case 'notes':
        return <NotesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  // Current Date display string
  const currentDateDisplay = localTime.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const currentTimeDisplay = localTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 overflow-hidden">
      {/* 1. Header Toolbar Banner */}
      <header className="bg-white border-b border-slate-200 relative z-40 shadow-sm shrink-0">
        <div className="w-full px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 select-none">
            <img 
              src="/web_app_logo.png" 
              alt="WorkSphere Logo" 
              className="w-10 h-10 object-contain rounded-xl shadow-sm" 
            />
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">WorkSphere DevPlanner</h1>
              <p className="text-[11px] font-semibold text-slate-400 mt-1 tracking-wide uppercase">Developer Workspace</p>
            </div>
          </div>

          {/* Local Status Clock */}
          <div className="flex items-center gap-4 bg-slate-55/60 border border-slate-150 rounded-xl px-4 py-1.5 text-xs text-slate-500 shadow-inner">
            <div className="flex items-center gap-1.5 font-medium border-r border-slate-200 pr-4">
              <Clock size={13} className="text-primary-500" />
              <span>{currentTimeDisplay}</span>
            </div>
            <div className="font-semibold text-slate-600 select-none">
              <span>{currentDateDisplay}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Container (Exactly matching the style layout from the reference image) */}
        <div className="w-full px-8 border-t border-slate-100">
          <nav className="flex items-center gap-8 -mb-[1px]">
            {/* Tab: Dashboard */}
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-3.5 px-1 border-b-2 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === 'tasks'
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-450 hover:text-slate-700'
              }`}
            >
              <Briefcase size={14} />
              <span>Dashboard Stats</span>
            </button>

            {/* Tab: Calendar */}
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-3.5 px-1 border-b-2 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === 'calendar'
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-450 hover:text-slate-700'
              }`}
            >
              <CalendarIcon size={14} />
              <span>Calendar Planner</span>
            </button>

            {/* Tab: Link Manager */}
            <button
              onClick={() => setActiveTab('links')}
              className={`py-3.5 px-1 border-b-2 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === 'links'
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-450 hover:text-slate-700'
              }`}
            >
              <Bookmark size={14} />
              <span>Link Manager</span>
            </button>

            {/* Tab: Notes */}
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-3.5 px-1 border-b-2 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === 'notes'
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-450 hover:text-slate-700'
              }`}
            >
              <FileText size={14} />
              <span>Notes</span>
            </button>

            {/* Tab: Settings */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3.5 px-1 border-b-2 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-450 hover:text-slate-700'
              }`}
            >
              <SettingsIcon size={14} />
              <span>Settings</span>
            </button>
          </nav>
        </div>
      </header>



      {/* 3. Main Dashboard Body Workspace */}
      <main className={`flex-1 w-full px-8 py-6 min-h-0 flex flex-col ${activeTab === 'notes' || activeTab === 'links' || activeTab === 'calendar' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {renderTabContent()}
      </main>

      {/* 4. Footer */}
      <footer className="bg-white border-t border-slate-205 py-4 px-6 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest shrink-0 select-none">
        <span>WorkSphere DevPlanner © {new Date().getFullYear()} — Premium Workspace</span>
      </footer>
    </div>
  );
};

export default App;
