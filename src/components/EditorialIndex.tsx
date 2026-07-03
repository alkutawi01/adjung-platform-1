import React from 'react';
import { ListOrdered, Info } from 'lucide-react';
import { Entry, User, SystemSettings } from '../types';
import { isArabicText } from '../utils';

interface EditorialIndexProps {
  entries: Entry[];
  users: User[];
  setSelectedEntry: (entry: Entry) => void;
  systemSettings: SystemSettings;
}

export function EditorialIndex({
  entries,
  users,
  setSelectedEntry,
  systemSettings,
}: EditorialIndexProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-1 border-b border-[#111111]/10 pb-5">
        <h2 className="font-serif text-2xl font-light text-[#111111] flex items-center gap-2 text-left">
          <ListOrdered className="w-6 h-6 text-[#802334]" />
          Index
        </h2>
        <p className="font-sans text-[10px] uppercase tracking-widest text-[#111111]/40 text-left">
          Live dynamic catalog of all published entries in the shared index database
        </p>
      </div>

      <div className="p-4 bg-[#802334]/5 border border-[#802334]/20 rounded flex gap-3 text-xs text-[#111111]/70 leading-relaxed font-sans select-none text-left">
        <Info className="w-4 h-4 text-[#802334] flex-shrink-0 mt-0.5" />
        <div>
          <strong>Shared Database Index:</strong> every Note, Essay, and Article resides inside a single storage and indexing engine. No content is duplicated or moved. This panel allows users to review the public global directory.
        </div>
      </div>

      <div className="bg-white border border-[#111111]/10 rounded overflow-hidden shadow-sm font-sans text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#111111]/5 border-b border-[#111111]/10 font-sans text-[9px] uppercase tracking-widest text-[#111111]/50 font-semibold">
                <th className="p-3 pl-4">UUID</th>
                <th className="p-3">Author</th>
                <th className="p-3">Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Published</th>
                <th className="p-3">Slug</th>
                <th className="p-3 text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111111]/5 font-serif text-sm">
              {entries.filter(e => e.status === 'Published').map((item) => {
                const author = users.find(u => u.id === item.authorId);
                const isAr = isArabicText(item.title);
                return (
                  <tr key={item.id} className="hover:bg-[#FDFDFD] transition-colors">
                    <td className="p-3 pl-4 font-mono text-[9px] text-[#111111]/40 select-all">{item.id.slice(0, 13)}...</td>
                    <td className="p-3 font-sans font-medium text-[#111111]">{author?.penName || 'Anonymous'}</td>
                    <td className="p-3 text-[#111111] font-medium text-left">
                      {item.title}
                      {isAr && (
                        <span className="ml-2 font-mono text-[9px] text-[#802334] uppercase tracking-wide bg-[#802334]/5 px-1 rounded">AR</span>
                      )}
                    </td>
                    <td className="p-3 font-sans"><span className="text-[#802334] font-semibold">{item.contentType}</span></td>
                    <td className="p-3 font-mono text-[#111111]/50 text-[10px]">{item.publishedDate ? new Date(item.publishedDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-3 font-mono text-[#111111]/40 text-[10px]">{item.slug}</td>
                    <td className="p-3 text-right pr-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEntry(item);
                        }}
                        className="text-[#802334] hover:underline font-mono text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        Open Publication
                      </button>
                    </td>
                  </tr>
                );
              })}
              {entries.filter(e => e.status === 'Published').length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center italic text-stone-400 font-sans">
                    No published articles are indexed in the shared database yet.
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
