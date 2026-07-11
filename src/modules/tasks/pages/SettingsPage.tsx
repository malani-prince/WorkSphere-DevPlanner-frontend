import React, { useEffect, useState } from 'react';
import { Download, Settings, Loader2 } from 'lucide-react';
import { tasksApi } from '../api';
import { linksApi } from '../../links/api';
import type { DashboardStats } from '../types';

export const SettingsPage: React.FC = () => {
  const [exportingLog, setExportingLog] = useState(false);
  const [exportingLinks, setExportingLinks] = useState(false);
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

  const handleExportLinks = async () => {
    setExportingLinks(true);
    try {
      // 1. Fetch categories
      const categories = await linksApi.getCategories();
      
      // 2. Fetch links for each category in parallel
      const categoriesWithLinks = await Promise.all(
        categories.map(async (cat) => {
          const links = await linksApi.getLinks(cat._id);
          return { catName: cat.name, links };
        })
      );
      
      // 3. Generate CSV content
      let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility
      csvContent += 'Category,Title,Subtitle,URL,Notes,Created At\n';
      
      categoriesWithLinks.forEach(({ catName, links }) => {
        links.forEach((link) => {
          const row = [
            catName,
            link.title,
            link.subtitle || '',
            link.url,
            link.notes || '',
            link.created_at || ''
          ].map(val => {
            // Escape double quotes and wrap in quotes to prevent column splitting issues
            const escaped = String(val).replace(/"/g, '""');
            return `"${escaped}"`;
          }).join(',');
          csvContent += row + '\n';
        });
      });
      
      // 4. Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const linkElement = document.createElement('a');
      linkElement.href = url;
      const todayStr = new Date().toLocaleDateString('en-CA');
      linkElement.download = `DevPlanner_Links_${todayStr}.csv`;
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
    } catch (err: any) {
      alert(err.message || 'Failed to export links');
    } finally {
      setExportingLinks(false);
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
          {/* Setting 1: Export JSON */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 last:border-0">
            <div>
              <span className="text-sm font-semibold text-slate-800 font-medium">Export Developer Daily Worklogs</span>
              <p className="text-xs text-slate-500 mt-0.5">Download a detailed JSON database backup containing all of today's tasks, notes, subtask trees, and statistics.</p>
            </div>
            <button 
              onClick={handleExportWorklog}
              disabled={exportingLog}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm shrink-0 cursor-pointer"
            >
              {exportingLog ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{exportingLog ? 'Exporting...' : 'Export JSON'}</span>
            </button>
          </div>

          {/* Setting 2: Export Links to Excel/CSV */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 last:border-0 pt-1">
            <div>
              <span className="text-sm font-semibold text-slate-800 font-medium">Export Bookmarks (Excel/CSV)</span>
              <p className="text-xs text-slate-500 mt-0.5">Download all of your bookmark categories and saved reference links in an Excel-compatible format.</p>
            </div>
            <button 
              onClick={handleExportLinks}
              disabled={exportingLinks}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shrink-0 cursor-pointer"
            >
              {exportingLinks ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{exportingLinks ? 'Exporting...' : 'Download Excel/CSV'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
