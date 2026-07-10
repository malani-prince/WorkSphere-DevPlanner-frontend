import React, { useEffect, useState } from 'react';
import { Download, Settings, Loader2 } from 'lucide-react';
import { tasksApi } from '../api';
import type { DashboardStats } from '../types';

export const SettingsPage: React.FC = () => {
  const [autoMigrationEnabled, setAutoMigrationEnabled] = useState(() => {
    const saved = localStorage.getItem('devplanner_auto_migration');
    return saved !== 'false';
  });
  const [exportingLog, setExportingLog] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const dashboardStats = await tasksApi.getDashboardStats(todayStr);
        setStats(dashboardStats);
      } catch (err) {
        console.error('Failed to load stats for export', err);
      }
    };
    loadStats();
  }, []);

  const handleToggleMigration = () => {
    const newValue = !autoMigrationEnabled;
    setAutoMigrationEnabled(newValue);
    localStorage.setItem('devplanner_auto_migration', String(newValue));
  };

  const handleExportWorklog = async () => {
    setExportingLog(true);
    try {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const allTasks = await tasksApi.getTasks({ date: todayStr });
      
      const fileData = JSON.stringify({
        exportedAt: new Date().toISOString(),
        date: todayStr,
        tasks: allTasks,
        stats: stats
      }, null, 2);

      const blob = new Blob([fileData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DevPlanner_Backup_${todayStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'Failed to export logs');
    } finally {
      setExportingLog(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl">
            <Settings size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Planner Settings</h2>
            <p className="text-xs text-slate-500">Configure task behavior and export backups.</p>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 font-medium">Planner Controls & Settings</h3>
        
        <div className="space-y-4">
          {/* Setting 1: Migration */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 last:border-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 font-medium">Automatic Task Migration Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  autoMigrationEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {autoMigrationEnabled ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Toggle whether pending developer tasks automatically roll over to the next day's backlog.</p>
            </div>
            <button 
              onClick={handleToggleMigration}
              className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all shrink-0 ${
                autoMigrationEnabled 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {autoMigrationEnabled ? 'Disable Migration' : 'Activate Migration'}
            </button>
          </div>

          {/* Setting 2: Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 last:border-0 pt-1">
            <div>
              <span className="text-sm font-semibold text-slate-800 font-medium">Export Developer Daily Worklogs</span>
              <p className="text-xs text-slate-500 mt-0.5">Download a detailed JSON database backup containing all of today's tasks, notes, subtask trees, and statistics.</p>
            </div>
            <button 
              onClick={handleExportWorklog}
              disabled={exportingLog}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm shrink-0"
            >
              {exportingLog ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{exportingLog ? 'Exporting...' : 'Export JSON'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
