import React, { useState } from 'react';
import { Lock, FileText, Search } from 'lucide-react';
import { User, SystemLog } from '../../../types';

interface SystemLogsTabProps {
  currentUser: User;
  logs: SystemLog[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  refreshDbState: () => void;
  hasPermission: (perm: string) => boolean;
}

export function SystemLogsTab({
  currentUser,
  logs,
  showToast,
  refreshDbState,
  hasPermission
}: SystemLogsTabProps) {
  const [logsSearchQuery, setLogsSearchQuery] = useState('');

  if (!hasPermission('manageLogs')) {
    return (
      <div className="bg-white border border-stone-200 rounded p-12 text-center shadow-sm select-none">
        <Lock className="w-12 h-12 text-[#802334] mx-auto mb-2 animate-pulse" />
        <span className="font-serif italic text-stone-500 block text-lg font-semibold">Audit Logs Locked</span>
        <p className="text-stone-500 text-xs font-sans leading-relaxed">
          Your administrative account (Role: <strong className="text-adjung-maroon">{currentUser.role}</strong>) does not have the necessary <strong>Manage Logs</strong> privileges. Please contact the Chief Editor to adjust your permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-200 rounded p-6 shadow-sm">
        <div className="border-b border-stone-100 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-1.5 select-none">
              <FileText className="w-5 h-5 text-adjung-maroon" />
              System Audit Logs
            </h3>
            <p className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
              Chronological journal of administrative actions, safety events, and curator logs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search logs..."
                value={logsSearchQuery}
                onChange={(e) => setLogsSearchQuery(e.target.value)}
                className="border border-stone-200 p-1.5 pl-7 rounded text-xs focus:outline-none focus:border-adjung-maroon font-sans bg-white text-stone-800"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-2.5" />
            </div>
            <button
              type="button"
              onClick={() => {
                refreshDbState();
                showToast('Audit trail synchronized.', 'info');
              }}
              className="bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 font-mono text-[10px] uppercase tracking-wider py-1.5 px-3 rounded shadow-sm cursor-pointer font-semibold"
            >
              Sync Trail
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto border border-stone-200 rounded">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 font-mono text-[9px] uppercase tracking-wider text-stone-500 select-none">
                <th className="p-3.5 pl-4">Timestamp</th>
                <th className="p-3.5">Operator</th>
                <th className="p-3.5">Administrative Role</th>
                <th className="p-3.5">Action Executed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-sans text-xs text-stone-700">
              {logs
                .filter(log => {
                  const query = logsSearchQuery.trim().toLowerCase();
                  return !query || 
                    log.operator.toLowerCase().includes(query) ||
                    log.role.toLowerCase().includes(query) ||
                    log.action.toLowerCase().includes(query);
                })
                .map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/40 transition">
                    <td className="p-3.5 pl-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-stone-800">
                      {log.operator}
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        log.role === 'Chief Editor'
                          ? 'bg-adjung-maroon text-[#FDFDFD] font-semibold'
                          : log.role === 'Editor'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200/50'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-serif text-sm text-stone-800 text-left">
                      {log.action}
                    </td>
                  </tr>
                ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center italic text-stone-400 font-serif">
                    No system audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
