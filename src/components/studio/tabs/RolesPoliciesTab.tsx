import React from 'react';
import { Lock } from 'lucide-react';
import { User, SystemSettings } from '../../../types';
import { supabaseService as firestoreService } from '../../../utils/supabaseService';

interface RolesPoliciesTabProps {
  currentUser: User;
  systemSettings: SystemSettings;
  setSystemSettings: (settings: SystemSettings) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  refreshDbState: () => void;
  hasPermission: (perm: string) => boolean;
}

export function RolesPoliciesTab({
  currentUser,
  systemSettings,
  setSystemSettings,
  showToast,
  refreshDbState,
  hasPermission
}: RolesPoliciesTabProps) {
  
  if (!hasPermission('manageRbac')) {
    return (
      <div className="bg-white border border-stone-200 rounded p-12 text-center shadow-sm select-none">
        <Lock className="w-12 h-12 text-adjung-maroon mx-auto mb-2 animate-pulse" />
        <span className="font-serif italic text-stone-500 block text-lg font-semibold">RBAC Management Locked</span>
        <p className="text-stone-500 text-xs font-sans leading-relaxed">
          Your administrative account (Role: <strong className="text-adjung-maroon">{currentUser.role}</strong>) does not have the necessary <strong>Manage RBAC</strong> privileges. Please contact the Chief Editor to adjust your role assignments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-200 rounded p-6 shadow-sm">
        <div className="border-b border-stone-100 pb-4 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-1.5 select-none">
              <Lock className="w-5 h-5 text-adjung-maroon" />
              Role-Based Access Control (RBAC) Matrix
            </h3>
            <p className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
              Configure administrative permissions assigned to each core system role
            </p>
          </div>
          <div className="bg-stone-50 border border-stone-200 px-3 py-1.5 rounded text-[11px] font-mono text-stone-600 max-w-xs text-left select-none">
            <strong>Safety Note:</strong> Foundation roles are permanent. They can neither be renamed nor deleted.
          </div>
        </div>

        {/* Configurable Permissions Grid */}
        <div className="overflow-x-auto border border-stone-200 rounded">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 font-mono text-[9px] uppercase tracking-wider text-stone-500 select-none">
                <th className="p-3.5 pl-4">Administrative Permission</th>
                <th className="p-3.5 text-center">Visitor</th>
                <th className="p-3.5 text-center">Writer</th>
                <th className="p-3.5 text-center">Editor</th>
                <th className="p-3.5 text-center">Chief Editor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {/* Row 1: View Directory */}
              <tr className="hover:bg-stone-50/40 transition">
                <td className="p-3.5 pl-4 text-left">
                  <span className="font-bold text-stone-800 block text-sm">View Directory</span>
                  <span className="text-stone-500 text-[11px] block mt-0.5">Allows accessing the global searchable list of platform scholars and authors.</span>
                </td>
                {(['Visitor', 'Writer', 'Editor', 'Chief Editor'] as const).map(role => {
                  const hasPerm = systemSettings.rolePermissions?.[role]?.viewDirectory ?? false;
                  const isCE = hasPermission('manageRbac');
                  return (
                    <td key={role} className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={hasPerm}
                        disabled={!isCE}
                        onChange={(e) => {
                          const updatedPermissions = {
                            ...systemSettings.rolePermissions,
                            [role]: {
                              ...(systemSettings.rolePermissions?.[role] || {}),
                              viewDirectory: e.target.checked
                            }
                          };
                          const updatedSettings = {
                            ...systemSettings,
                            rolePermissions: updatedPermissions as any
                          };
                          setSystemSettings(updatedSettings);
                          firestoreService.logAction(`Modified 'View Directory' permission for '${role}' role to ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, currentUser);
                          refreshDbState();
                          showToast(`Permission updated for ${role}`, 'success');
                        }}
                        className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Row 2: Curate Frontpage */}
              <tr className="hover:bg-stone-50/40 transition">
                <td className="p-3.5 pl-4 text-left">
                  <span className="font-bold text-stone-800 block text-sm">Curate Frontpage</span>
                  <span className="text-stone-500 text-[11px] block mt-0.5">Allows pinning featured scholars, articles, and editing main announcements.</span>
                </td>
                {(['Visitor', 'Writer', 'Editor', 'Chief Editor'] as const).map(role => {
                  const hasPerm = systemSettings.rolePermissions?.[role]?.curateFrontpage ?? false;
                  const isCE = hasPermission('manageRbac');
                  return (
                    <td key={role} className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={hasPerm}
                        disabled={!isCE}
                        onChange={(e) => {
                          const updatedPermissions = {
                            ...systemSettings.rolePermissions,
                            [role]: {
                              ...(systemSettings.rolePermissions?.[role] || {}),
                              curateFrontpage: e.target.checked
                            }
                          };
                          const updatedSettings = {
                            ...systemSettings,
                            rolePermissions: updatedPermissions as any
                          };
                          setSystemSettings(updatedSettings);
                          firestoreService.logAction(`Modified 'Curate Frontpage' permission for '${role}' role to ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, currentUser);
                          refreshDbState();
                          showToast(`Permission updated for ${role}`, 'success');
                        }}
                        className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Row 3: Invite Writers */}
              <tr className="hover:bg-stone-50/40 transition">
                <td className="p-3.5 pl-4 text-left">
                  <span className="font-bold text-stone-800 block text-sm">Invite Writers</span>
                  <span className="text-stone-500 text-[11px] block mt-0.5">Allows generating formal scholar invitation letters and secure sign-up URLs.</span>
                </td>
                {(['Visitor', 'Writer', 'Editor', 'Chief Editor'] as const).map(role => {
                  const hasPerm = systemSettings.rolePermissions?.[role]?.inviteWriters ?? false;
                  const isCE = hasPermission('manageRbac');
                  return (
                    <td key={role} className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={hasPerm}
                        disabled={!isCE}
                        onChange={(e) => {
                          const updatedPermissions = {
                            ...systemSettings.rolePermissions,
                            [role]: {
                              ...(systemSettings.rolePermissions?.[role] || {}),
                              inviteWriters: e.target.checked
                            }
                          };
                          const updatedSettings = {
                            ...systemSettings,
                            rolePermissions: updatedPermissions as any
                          };
                          setSystemSettings(updatedSettings);
                          firestoreService.logAction(`Modified 'Invite Writers' permission for '${role}' role to ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, currentUser);
                          refreshDbState();
                          showToast(`Permission updated for ${role}`, 'success');
                        }}
                        className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Row 4: Moderate Reports */}
              <tr className="hover:bg-stone-50/40 transition">
                <td className="p-3.5 pl-4 text-left">
                  <span className="font-bold text-stone-800 block text-sm">Moderate Reports</span>
                  <span className="text-stone-500 text-[11px] block mt-0.5">Allows accessing reported content logs, hiding posts, or flag management.</span>
                </td>
                {(['Visitor', 'Writer', 'Editor', 'Chief Editor'] as const).map(role => {
                  const hasPerm = systemSettings.rolePermissions?.[role]?.moderateReports ?? false;
                  const isCE = hasPermission('manageRbac');
                  return (
                    <td key={role} className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={hasPerm}
                        disabled={!isCE}
                        onChange={(e) => {
                          const updatedPermissions = {
                            ...systemSettings.rolePermissions,
                            [role]: {
                              ...(systemSettings.rolePermissions?.[role] || {}),
                              moderateReports: e.target.checked
                            }
                          };
                          const updatedSettings = {
                            ...systemSettings,
                            rolePermissions: updatedPermissions as any
                          };
                          setSystemSettings(updatedSettings);
                          firestoreService.logAction(`Modified 'Moderate Reports' permission for '${role}' role to ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, currentUser);
                          refreshDbState();
                          showToast(`Permission updated for ${role}`, 'success');
                        }}
                        className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Row 5: Manage Settings */}
              <tr className="hover:bg-stone-50/40 transition border-t border-stone-100">
                <td className="p-3.5 pl-4 text-left">
                  <span className="font-bold text-stone-800 block text-sm">Manage Settings</span>
                  <span className="text-stone-500 text-[11px] block mt-0.5">Allows modifying platform details, academic affiliation, custom styling, and editorial policies.</span>
                </td>
                {(['Visitor', 'Writer', 'Editor', 'Chief Editor'] as const).map(role => {
                  const hasPerm = systemSettings.rolePermissions?.[role]?.manageSettings ?? false;
                  const isCE = hasPermission('manageRbac');
                  const isLockedForRole = role === 'Chief Editor';
                  return (
                    <td key={role} className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isLockedForRole ? true : hasPerm}
                        disabled={!isCE || isLockedForRole}
                        onChange={(e) => {
                          const updatedPermissions = {
                            ...systemSettings.rolePermissions,
                            [role]: {
                              ...(systemSettings.rolePermissions?.[role] || {}),
                              manageSettings: e.target.checked
                            }
                          };
                          const updatedSettings = {
                            ...systemSettings,
                            rolePermissions: updatedPermissions as any
                          };
                          setSystemSettings(updatedSettings);
                          firestoreService.logAction(`Modified 'Manage Settings' permission for '${role}' role to ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, currentUser);
                          refreshDbState();
                          showToast(`Permission updated for ${role}`, 'success');
                        }}
                        className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Row 6: Manage RBAC */}
              <tr className="hover:bg-stone-50/40 transition border-t border-stone-100">
                <td className="p-3.5 pl-4 text-left">
                  <span className="font-bold text-stone-800 block text-sm">Manage RBAC</span>
                  <span className="text-stone-500 text-[11px] block mt-0.5">Allows modifying role assignments, inviting scholars, and editing system-wide permissions.</span>
                </td>
                {(['Visitor', 'Writer', 'Editor', 'Chief Editor'] as const).map(role => {
                  const hasPerm = systemSettings.rolePermissions?.[role]?.manageRbac ?? false;
                  const isCE = hasPermission('manageRbac');
                  const isLockedForRole = role === 'Chief Editor';
                  return (
                    <td key={role} className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isLockedForRole ? true : hasPerm}
                        disabled={!isCE || isLockedForRole}
                        onChange={(e) => {
                          const updatedPermissions = {
                            ...systemSettings.rolePermissions,
                            [role]: {
                              ...(systemSettings.rolePermissions?.[role] || {}),
                              manageRbac: e.target.checked
                            }
                          };
                          const updatedSettings = {
                            ...systemSettings,
                            rolePermissions: updatedPermissions as any
                          };
                          setSystemSettings(updatedSettings);
                          firestoreService.logAction(`Modified 'Manage RBAC' permission for '${role}' role to ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, currentUser);
                          refreshDbState();
                          showToast(`Permission updated for ${role}`, 'success');
                        }}
                        className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Row 7: Manage Logs */}
              <tr className="hover:bg-stone-50/40 transition border-t border-stone-100">
                <td className="p-3.5 pl-4 text-left">
                  <span className="font-bold text-stone-800 block text-sm">Manage Logs</span>
                  <span className="text-stone-500 text-[11px] block mt-0.5">Allows accessing, auditing, and managing chronological system audit log reports.</span>
                </td>
                {(['Visitor', 'Writer', 'Editor', 'Chief Editor'] as const).map(role => {
                  const hasPerm = systemSettings.rolePermissions?.[role]?.manageLogs ?? false;
                  const isCE = hasPermission('manageRbac');
                  const isLockedForRole = role === 'Chief Editor';
                  return (
                    <td key={role} className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isLockedForRole ? true : hasPerm}
                        disabled={!isCE || isLockedForRole}
                        onChange={(e) => {
                          const updatedPermissions = {
                            ...systemSettings.rolePermissions,
                            [role]: {
                              ...(systemSettings.rolePermissions?.[role] || {}),
                              manageLogs: e.target.checked
                            }
                          };
                          const updatedSettings = {
                            ...systemSettings,
                            rolePermissions: updatedPermissions as any
                          };
                          setSystemSettings(updatedSettings);
                          firestoreService.logAction(`Modified 'Manage Logs' permission for '${role}' role to ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, currentUser);
                          refreshDbState();
                          showToast(`Permission updated for ${role}`, 'success');
                        }}
                        className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Locked Core Permissions */}
      <div className="bg-white border border-stone-200 rounded p-6 shadow-sm space-y-4 text-left">
        <h4 className="font-mono text-xs uppercase tracking-widest font-semibold text-stone-700 border-b pb-2 flex items-center gap-1.5 select-none">
          <Lock className="w-4 h-4 text-stone-400" /> Locked Core Permissions (Architectural Safety)
        </h4>
        <p className="font-sans text-xs text-stone-500 leading-relaxed">
          Certain permissions are hardcoded into Adjung's system architecture and cannot be modified by any platform administrator. This enforces platform safety and ensures absolute authorship integrity:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans select-none">
          <div className="bg-stone-50 p-4 border border-stone-200/60 rounded space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-wider text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded font-bold inline-block">PERMANENT LOCK</span>
            <h5 className="font-bold text-stone-800">Intellectual Property Integrity</h5>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Writers, Editors, and Chief Editors are strictly forbidden from modifying or editing another scholar's original intellectual work (Essays, Articles, Biographies, or Folios).
            </p>
          </div>

          <div className="bg-stone-50 p-4 border border-stone-200/60 rounded space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-wider text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded font-bold inline-block">PERMANENT LOCK</span>
            <h5 className="font-bold text-stone-800">At Least One Chief Editor</h5>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              The platform requires at least one active, non-suspended Chief Editor to always exist in order to avoid administrative deadlocks or lockout states.
            </p>
          </div>

          <div className="bg-stone-50 p-4 border border-stone-200/60 rounded space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-wider text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded font-bold inline-block">PERMANENT LOCK</span>
            <h5 className="font-bold text-stone-800">Self-Administration Safeguards</h5>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              An administrator is structurally prevented from demoting, deauthorizing, or suspending their own account to guarantee self-administration safety.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
