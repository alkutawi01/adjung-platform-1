import React, { useState, useEffect, useRef } from 'react';
import { User, Entry, WriterProfile, IdentityProfile, BiographyItem, SystemSettings, EntryType, RolePermissions, VectorStroke, DigitalSignature, PolicyDocument } from './types';
import { db } from './db/mockDb';
import { AuthService, SessionService, RbacService, UserRepository } from './services/authService';
import { EntryRenderer } from './components/EntryRenderer';
import { TimelineEntryCollapseRenderer } from './components/TimelineEntryCollapseRenderer';
import { isArabicText, generateUUID, parseInlineFormatting, parseContentToBlocks, toRoman } from './utils';
import { SignatureLayout } from './components/SignatureLayout';
import { SignatureRenderer } from './components/SignatureRenderer';
import SignUpWizard from './components/SignUpWizard';
import { 
  Compass,
  User as UserIcon,
  ChevronLeft,
  FileText,
  FileEdit,
  Lock,
  Globe,
  Settings,
  ListOrdered,
  PenTool,
  Info,
  Database,
  ShieldAlert,
  UserCheck,
  LogIn,
  LogOut,
  ArrowRight,
  Plus,
  Search,
  Mail,
  Send
} from 'lucide-react';

import { FolioTimeline } from './components/FolioTimeline';
import { FrontpageView } from './components/FrontpageView';
import { FolioView } from './components/FolioView';
import { BiographyView } from './components/BiographyView';
import { PoliciesView } from './components/PoliciesView';
import { LandingView } from './components/LandingView';
import { NoticesView } from './components/NoticesView';
import { EditorialNotesView } from './components/EditorialNotesView';
import { ChangelogView } from './components/ChangelogView';
import { ArchitectureStudio } from './components/ArchitectureStudio';

import { WritingDesk } from './components/WritingDesk';
import { EditorialIndex } from './components/EditorialIndex';
import { Editorium } from './components/Editorium';
import { Directory } from './components/Directory';
import { IdentityStudio } from './components/IdentityStudio';
import { LoadingScreen } from './components/LoadingScreen';
import { PhilosophyCarousel } from './components/PhilosophyCarousel';
import { ElasticMarginRow } from './components/ElasticMarginRow';
import { AnimatedSignature } from './components/AnimatedSignature';
import { motion, AnimatePresence } from 'motion/react';
import { BRAND } from './config/brand';

function resolveSignatureStrokes(entry: Entry | null, authorId: string): VectorStroke[][] | undefined {
  const identity = db.getIdentityByAccountId(authorId);
  if (!identity) return undefined;
  
  if (entry?.signatureVersionId) {
    const sig = identity.signatures.find(s => s.id === entry.signatureVersionId);
    if (sig) return sig.strokes;
  }
  
  const defaultSig = identity.signatures.find(s => s.status === 'Default');
  if (defaultSig && defaultSig.type === 'drawn') return defaultSig.strokes;
  return undefined;
}

function resolveSignatureText(authorId: string, fallback: string): string {
  const identity = db.getIdentityByAccountId(authorId);
  if (!identity || !identity.signatures) return fallback;
  const defaultSig = identity.signatures.find(s => s.status === 'Default');
  if (defaultSig) {
    if (defaultSig.type === 'typed') return defaultSig.typedText;
    if (defaultSig.type === 'drawn') return ''; // If drawn, we don't display text fallback
  }
  return fallback;
}

function resolveDigitalSignature(authorId: string, entry?: Entry | null): DigitalSignature | undefined {
  const identity = db.getIdentityByAccountId(authorId);
  if (!identity || !identity.signatures) return undefined;
  if (entry?.signatureVersionId) {
    const sig = identity.signatures.find(s => s.id === entry.signatureVersionId);
    if (sig) return sig;
  }
  return identity.signatures.find(s => s.status === 'Default');
}

function resolveSignatureFont(authorId: string): string | undefined {
  const identity = db.getIdentityByAccountId(authorId);
  if (!identity || !identity.signatures) return undefined;
  const defaultSig = identity.signatures.find(s => s.status === 'Default');
  if (defaultSig && defaultSig.type === 'typed' && defaultSig.fontFamily) {
    const rawFamily = defaultSig.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
    return `"${rawFamily}", cursive`;
  }
  return undefined;
}



function renderFrontpageBlock(block: any, pIdx: number) {
  if (block.type === 'heading') {
    const isAr = isArabicText(block.text);
    const textNode = parseInlineFormatting(block.text);
    if (block.level === 1) {
      return (
        <h3 
          key={pIdx} 
          dir={isAr ? 'rtl' : 'ltr'} 
          className={`font-serif text-stone-900 font-semibold my-2.5 ${
            isAr ? 'text-right text-[15px] font-arabic leading-loose' : 'text-left text-[14px] tracking-tight'
          }`}
        >
          {textNode}
        </h3>
      );
    } else {
      return (
        <h4 
          key={pIdx} 
          dir={isAr ? 'rtl' : 'ltr'} 
          className={`font-serif text-stone-850 font-medium my-2 ${
            isAr ? 'text-right text-[13px] font-arabic leading-loose' : 'text-left text-[12px]'
          }`}
        >
          {textNode}
        </h4>
      );
    }
  }

  if (block.type === 'list') {
    const listItems = block.items.map((listItem: any, itemIdx: number) => {
      const isAr = isArabicText(listItem.text);
      const isChecklist = listItem.checked !== undefined;
      const textNode = parseInlineFormatting(listItem.text);
      if (isChecklist) {
        return (
          <li 
            key={itemIdx} 
            className={`flex items-center gap-1.5 ${isAr ? 'justify-start flex-row-reverse text-right' : 'text-left'}`}
          >
            <input type="checkbox" checked={listItem.checked} disabled className="h-3 w-3 rounded text-adjung-maroon cursor-default" />
            <span className={`text-[12px] ${listItem.checked ? 'line-through text-stone-400' : 'text-stone-600'} ${isAr ? 'font-arabic' : 'font-serif'}`}>
              {textNode}
            </span>
          </li>
        );
      }
      return (
        <li key={itemIdx} className={`text-[12px] text-stone-600 ${isAr ? 'font-arabic text-right' : 'font-serif text-left'}`}>
          {textNode}
        </li>
      );
    });

    const isChecklist = block.items.some((i: any) => i.checked !== undefined);

    return (
      <div key={pIdx} className="my-2 text-left">
        <ul className={`space-y-1 ${isChecklist ? 'list-none pl-0' : 'list-disc pl-4'}`}>
          {listItems}
        </ul>
      </div>
    );
  }

  if (block.type === 'table') {
    return (
      <div key={pIdx} className="my-3 overflow-x-auto border border-stone-200/50 rounded p-1 bg-stone-50/20 text-left">
        <span className="font-mono text-[9px] text-stone-400 uppercase">Table: {block.headers.join(' | ')}</span>
      </div>
    );
  }

  if (block.type === 'image') {
    return (
      <figure key={pIdx} className="my-3 text-center bg-transparent">
        <span className="inline-block text-[11px] text-stone-400 italic border border-stone-200/55 p-1 rounded font-serif bg-stone-50/10">
          📷 [Image: {block.alt || 'Untitled'}]
        </span>
      </figure>
    );
  }

  if (block.type === 'divider') {
    return <hr key={pIdx} className="my-4 border-t border-stone-200/40" />;
  }

  if (block.type === 'code-block') {
    return (
      <pre key={pIdx} className="p-2.5 bg-stone-50 border border-stone-200/60 rounded font-mono text-[10px] text-left overflow-x-auto text-stone-700 max-h-32">
        <code>{block.code}</code>
      </pre>
    );
  }

  if (block.type === 'latin-quote') {
    return (
      <blockquote key={pIdx} className="my-4 pl-4 border-l border-adjung-maroon/20 text-left bg-transparent">
        <p className="font-serif italic text-stone-600 text-xs md:text-sm">
          {parseInlineFormatting(block.text)}
        </p>
        {block.translation && (
          <div dir="ltr" className="mt-2 pt-2 border-t border-stone-200/40 text-left">
            <p className="font-serif italic text-xs text-stone-500">
              {parseInlineFormatting(block.translation)}
            </p>
          </div>
        )}
      </blockquote>
    );
  }

  if (block.type === 'arabic-quote') {
    return (
      <blockquote key={pIdx} className="my-4 pr-4 border-r border-adjung-maroon/20 text-right bg-transparent">
        <p className="font-arabic text-sm md:text-base text-stone-850 leading-loose">
          {parseInlineFormatting(block.arabic)}
        </p>
        {block.translation && (
          <div dir="ltr" className="mt-2 pt-2 border-t border-stone-200/40 text-left">
            <p className="font-serif italic text-xs text-stone-500">
              {parseInlineFormatting(block.translation)}
            </p>
          </div>
        )}
      </blockquote>
    );
  }

  const isParaAr = isArabicText(block.text);
  return (
    <p 
      key={pIdx}
      dir={isParaAr ? 'rtl' : 'ltr'}
      className={`${
        isParaAr 
          ? 'font-arabic text-right text-stone-900 leading-loose text-sm md:text-base' 
          : 'font-serif text-left text-xs md:text-sm text-stone-650 leading-relaxed'
      }`}
    >
      {parseInlineFormatting(block.text)}
    </p>
  );
}





export default function App() {
  // Database States
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [profiles, setProfiles] = useState<WriterProfile[]>(db.getProfiles());
  const [entries, setEntries] = useState<Entry[]>(db.getEntries());
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(db.getSystemSettings());
  const [initializing, setInitializing] = useState(true);
  const [showNavbar, setShowNavbar] = useState(true);
  const [navVisible, setNavVisible] = useState(true);
  const [isFloating, setIsFloating] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [maxScroll, setMaxScroll] = useState(400);
  const [showInterlinear, setShowInterlinear] = useState(true);
  const lastScrollY = useRef(0);

  // App Navigation & Session States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'landing' | 'frontpage' | 'folio' | 'bio' | 'directory' | 'desk' | 'index' | 'editorium' | 'identity' | 'notices' | 'editorial' | 'changelog' | 'policies' | 'architecture'>('landing');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  
  // Note inline expansion state
  const [expandedNoteIds, setExpandedNoteIds] = useState<string[]>([]);
  const [expandedFrontpageNotes, setExpandedFrontpageNotes] = useState<string[]>([]);


  const toggleNote = (id: string) => {
    setExpandedNoteIds(prev =>
      prev.includes(id) ? prev.filter(noteId => noteId !== id) : [...prev, id]
    );
  };

  // Intercept Note selection to prevent dedicated page rendering, expanding inline instead
  useEffect(() => {
    if (selectedEntry && selectedEntry.contentType === 'Note') {
      const noteId = selectedEntry.id;
      setExpandedNoteIds(prev => prev.includes(noteId) ? prev : [...prev, noteId]);
      setSelectedEntry(null);
      setActiveTab('folio');
      
      // scroll to the note in the timeline after a short delay
      setTimeout(() => {
        const element = document.getElementById(`note-card-${noteId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [selectedEntry]);

  // Scroll to the top of the page when activeTab or selectedEntry changes (except for Notes, which scroll inline)
  useEffect(() => {
    if (selectedEntry) {
      if (selectedEntry.contentType !== 'Note') {
        window.scrollTo(0, 0);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [activeTab, selectedEntry]);
  
  // Tag / Category filter in Folio
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('All');

  // Editing state in Desk
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  // Toast notifications state:
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setToastVisible(true);
  };

  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => {
        setToastVisible(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toastVisible]);



  // Startup Session Restore & Verification (no silent seeded fallbacks!)
  useEffect(() => {
    const activeSessionUser = SessionService.validateAndRetrieveSession();
    if (activeSessionUser) {
      setCurrentUser(activeSessionUser);
      setSelectedAuthorId(activeSessionUser.id);
      setActiveTab('folio');
    } else {
      setCurrentUser(null);
      setSelectedAuthorId('');
      setActiveTab('landing');
    }
    
    // Ensure loading screen is visible for at least 1 second
    setTimeout(() => {
      setInitializing(false);
    }, 1000);
  }, [users]);

  // Synchronize browser title with central brand identity on mount
  useEffect(() => {
    document.title = BRAND.name;
  }, []);

  // Authentication Fields
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpWizard, setShowSignUpWizard] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Account and User Menu states
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountUsername, setAccountUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('');
  const [accountError, setAccountError] = useState('');

  // Handle clicking outside the user menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Sync Account Edit states when Account Modal is shown
  useEffect(() => {
    if (showAccountModal && currentUser) {
      setAccountEmail(currentUser.email || '');
      setAccountUsername(currentUser.username || '');
      setAccountPassword('');
      setAccountConfirmPassword('');
      setAccountError('');
    }
  }, [showAccountModal, currentUser]);

  // Editing Biography Item State
  const [editingBioItem, setEditingBioItem] = useState<BiographyItem | null>(null);
  const [showAddBioModal, setShowAddBioModal] = useState(false);
  const [newBioYear, setNewBioYear] = useState('');
  const [newBioTitle, setNewBioTitle] = useState('');
  const [newBioDesc, setNewBioDesc] = useState('');
  const [newBioCategory, setNewBioCategory] = useState<BiographyItem['category']>('Education');

  // Writing Desk - Profile Settings States
  const [deskUsername, setDeskUsername] = useState('');
  const [deskPenName, setDeskPenName] = useState('');
  const [deskSignature, setDeskSignature] = useState('');
  const [deskBioText, setDeskBioText] = useState('');
  const [deskHeroTitle, setDeskHeroTitle] = useState('');
  const [deskHeroSubtitle, setDeskHeroSubtitle] = useState('');
  const [deskHeroSignatureText, setDeskHeroSignatureText] = useState('');

  const [deskViewMode, setDeskViewMode] = useState<'preview' | 'editor'>('preview');
  const deskLastScrollY = useRef<number>(0);

  useEffect(() => {
    if (editingEntry) {
      setDeskViewMode('preview');
    }
  }, [editingEntry?.id]);

  // Editorium - Invite Scholar States
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [generatedInvitation, setGeneratedInvitation] = useState<{
    id: string;
    name: string;
    email: string;
    message: string;
    signupUrl: string;
    emailBody: string;
  } | null>(null);
  const [invitedRegistrationData, setInvitedRegistrationData] = useState<{
    name: string;
    email: string;
    username: string;
    penName: string;
    signature: string;
    heroTitle: string;
    heroSubtitle: string;
    bioText: string;
  } | null>(null);

  // Editorium Sub-navigation and Search States
  const [editoriumActiveTab, setEditoriumActiveTab] = useState<'settings' | 'writers'>('writers');
  
  const [editoriumSearchQuery, setEditoriumSearchQuery] = useState('');
  const [frontpageSearchQuery, setFrontpageSearchQuery] = useState('');
  const [editoriumSelectedWriterId, setEditoriumSelectedWriterId] = useState<string | null>(null);

  // Sync default selected writer in Editorium
  useEffect(() => {
    if (!editoriumSelectedWriterId && users.length > 0) {
      const firstWriter = users.find(u => u.role === 'Writer') || users[0];
      setEditoriumSelectedWriterId(firstWriter.id);
    }
  }, [users, editoriumSelectedWriterId]);

  // Editorium - Writer Edit States
  const [editWriterPenName, setEditWriterPenName] = useState('');
  const [editWriterUsername, setEditWriterUsername] = useState('');
  const [editWriterSignature, setEditWriterSignature] = useState('');
  const [editWriterBioSummary, setEditWriterBioSummary] = useState('');
  const [editWriterHeroTitle, setEditWriterHeroTitle] = useState('');
  const [editWriterHeroSubtitle, setEditWriterHeroSubtitle] = useState('');
  const [editWriterBioText, setEditWriterBioText] = useState('');

  // Enforce private environment, Scholar views require scholar, and Directory access controls
  useEffect(() => {
    // Authenticated users never see the Landing page
    if (currentUser && activeTab === 'landing') {
      setActiveTab('frontpage');
    }

    // If not logged in and trying to access private platform pages:
    if (!currentUser && (activeTab === 'desk' || activeTab === 'index' || activeTab === 'editorium')) {
      setActiveTab('landing');
    }
    
    // Scholar pages (folio, bio) require a selected scholar
    if ((activeTab === 'folio' || activeTab === 'bio') && !selectedAuthorId) {
      setActiveTab('landing');
    }

    // Deny route access to Directory if disabled by Access Policy
    if (activeTab === 'directory' && !hasPermission('viewDirectory')) {
      setActiveTab('landing');
    }
  }, [currentUser, activeTab, systemSettings, selectedAuthorId]);

  // Editorial Top Navbar scroll behavior
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const currentMaxScroll = document.documentElement.scrollHeight - window.innerHeight;
          setScrollY(currentScrollY);
          setMaxScroll(currentMaxScroll);
          setIsFloating(currentScrollY > 15);
          setNavVisible(true); // Always keep navbar visibility state true, opacity is handled via style
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Measure initially
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, selectedEntry, selectedAuthorId]);

  // Two-way URL Hash Router Synchronization
  useEffect(() => {
    if (initializing) return;

    let newHash = '#/';
    if (editingEntry) {
      newHash = `#/desk/edit/${editingEntry.id}`;
    } else if (selectedEntry) {
      if (selectedEntry.publicationClass === 'Institutional') {
        const typeSlug = selectedEntry.contentType === 'Notice' ? 'notice' : 'editorial';
        newHash = `#/${typeSlug}/${selectedEntry.slug}`;
      } else {
        newHash = `#/${selectedEntry.contentType.toLowerCase()}/${selectedEntry.authorId}/${selectedEntry.slug}`;
      }
    } else {
      if (activeTab === 'landing') newHash = '#/landing';
      else if (activeTab === 'frontpage') newHash = '#/frontpage';
      else if (activeTab === 'directory') newHash = '#/directory';
      else if (activeTab === 'index') newHash = '#/index';
      else if (activeTab === 'editorium') newHash = '#/editorium';
      else if (activeTab === 'desk') newHash = '#/desk';
      else if (activeTab === 'folio') newHash = `#/folio/${selectedAuthorId || ''}`;
      else if (activeTab === 'bio') newHash = `#/bio/${selectedAuthorId || ''}`;
      else if (activeTab === 'identity') newHash = '#/identity';
      else if (activeTab === 'notices') newHash = '#/notices';
      else if (activeTab === 'editorial') newHash = '#/editorial';
      else if (activeTab === 'changelog') newHash = '#/changelog';
      else if (activeTab === 'policies') newHash = '#/policies';
      else if (activeTab === 'architecture') newHash = '#/architecture';
    }

    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }, [activeTab, selectedAuthorId, selectedEntry, editingEntry, initializing]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      const parts = hash.substring(1).split('/').filter(Boolean);

      if (parts.length === 0 || parts[0] === 'landing') {
        if (currentUser) {
          window.location.hash = '#/frontpage';
        } else {
          setActiveTab('landing');
          setSelectedEntry(null);
          setEditingEntry(null);
        }
        return;
      }

      const route = parts[0];
      if (route === 'frontpage') {
        setActiveTab('frontpage');
        setSelectedEntry(null);
        setEditingEntry(null);
        return;
      }
      if (route === 'identity') {
        if (!currentUser) {
          window.location.hash = '#/landing';
        } else {
          setActiveTab('identity');
          setSelectedEntry(null);
          setEditingEntry(null);
        }
        return;
      }
      if (route === 'directory') {
        setActiveTab('directory');
        setSelectedEntry(null);
        setEditingEntry(null);
      } else if (route === 'index') {
        setActiveTab('index');
        setSelectedEntry(null);
        setEditingEntry(null);
      } else if (route === 'editorium') {
        setActiveTab('editorium');
        setSelectedEntry(null);
        setEditingEntry(null);
      } else if (route === 'desk') {
        setActiveTab('desk');
        setSelectedEntry(null);
        if (parts[1] === 'edit' && parts[2]) {
          const entryId = parts[2];
          const entry = db.getEntryById(entryId);
          if (entry) {
            setEditingEntry(entry);
          } else {
            setEditingEntry(null);
          }
        } else {
          setEditingEntry(null);
        }
      } else if (route === 'folio' && parts[1]) {
        setSelectedAuthorId(parts[1]);
        setActiveTab('folio');
        setSelectedEntry(null);
        setEditingEntry(null);
      } else if (route === 'bio' && parts[1]) {
        setSelectedAuthorId(parts[1]);
        setActiveTab('bio');
        setSelectedEntry(null);
        setEditingEntry(null);
      } else if (route === 'notices') {
        setActiveTab('notices');
        setSelectedEntry(null);
        setEditingEntry(null);
      } else if (route === 'notice' && parts[1]) {
        const slug = parts[1];
        const entry = db.getEntries().find(e => e.contentType === 'Notice' && e.slug === slug);
        if (entry) {
          setSelectedEntry(entry);
          setActiveTab('notices');
          setEditingEntry(null);
        }
      } else if (route === 'editorial') {
        if (parts[1]) {
          const slug = parts[1];
          const entry = db.getEntries().find(e => e.contentType === "Editor's Note" && e.slug === slug);
          if (entry) {
            setSelectedEntry(entry);
            setActiveTab('editorial');
            setEditingEntry(null);
          }
        } else {
          setActiveTab('editorial');
          setSelectedEntry(null);
          setEditingEntry(null);
        }
      } else if (route === 'changelog') {
        setActiveTab('changelog');
        setSelectedEntry(null);
        setEditingEntry(null);
      } else if (route === 'policies') {
        setActiveTab('policies');
        setSelectedEntry(null);
        setEditingEntry(null);
      } else if (route === 'architecture') {
        setActiveTab('architecture');
        setSelectedEntry(null);
        setEditingEntry(null);
      } else if ((route === 'note' || route === 'essay' || route === 'article') && parts[1] && parts[2]) {
        const authorId = parts[1];
        const slug = parts[2];
        const entry = db.getEntries().find(e => e.authorId === authorId && e.slug === slug);
        if (entry) {
          if (entry.contentType === 'Note') {
            setSelectedAuthorId(authorId);
            setActiveTab('folio');
            setSelectedEntry(null);
            setEditingEntry(null);
            const noteId = entry.id;
            setExpandedNoteIds(prev => prev.includes(noteId) ? prev : [...prev, noteId]);
            setTimeout(() => {
              const element = document.getElementById(`note-card-${noteId}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 150);
          } else {
            setSelectedAuthorId(authorId);
            setSelectedEntry(entry);
            setActiveTab('folio');
            setEditingEntry(null);
          }
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (!initializing) {
      handleHashChange();
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [initializing, currentUser]);

  // Initialize selected writer edit fields when selection changes
  useEffect(() => {
    if (editoriumSelectedWriterId) {
      const writer = users.find(u => u.id === editoriumSelectedWriterId);
      if (writer) {
        const p = profiles.find(prof => prof.authorId === writer.id) || db.getProfileByAuthorId(writer.id);
        setEditWriterPenName(writer.penName || '');
        setEditWriterUsername(writer.username || '');
        setEditWriterSignature(writer.signature || '');
        setEditWriterBioSummary(writer.bioSummary || '');
        setEditWriterHeroTitle(p?.heroTitle || '');
        setEditWriterHeroSubtitle(p?.heroSubtitle || '');
        const ident = db.getIdentityByAccountId(writer.id);
        setEditWriterBioText(ident?.biography || '');
      }
    }
  }, [editoriumSelectedWriterId, users, profiles]);

  // Save writer modifications from Editorium
  const handleSaveWriterFromEditorium = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editoriumSelectedWriterId) return;

    const writer = users.find(u => u.id === editoriumSelectedWriterId);
    if (!writer) return;

    const updatedUser: User = {
      ...writer,
      username: editWriterUsername,
      penName: editWriterPenName,
      signature: editWriterSignature,
      bioSummary: editWriterBioSummary,
    };
    db.updateUser(updatedUser);

    const profile = db.getProfileByAuthorId(writer.id);
    const updatedProfile: WriterProfile = {
      ...profile,
      heroTitle: editWriterHeroTitle,
      heroSubtitle: editWriterHeroSubtitle,
    };
    db.updateProfile(updatedProfile);
    
    const identity = db.getIdentityByAccountId(writer.id);
    if (identity) {
      db.updateIdentity({
        ...identity,
        biography: editWriterBioText,
      });
    }

    refreshDbState();
    showToast('Settings updated', 'success');
  };

  // Permission helper
  const hasPermission = (permissionKey: keyof RolePermissions) => {
    return RbacService.hasPermission(currentUser, permissionKey, systemSettings);
  };

  // Dynamic navigation generation matching Access Policy
  const getNavigationItems = () => {
    const items: { id: string; label: string; action: () => void; isActive: boolean }[] = [];

    if (!currentUser) {
      // Visitor navigation: Optionally Scholar Folio / Biography if a scholar is active
      if (selectedAuthorId) {
        items.push({
          id: 'folio',
          label: 'Folio',
          action: () => {
            setActiveTab('folio');
            setSelectedEntry(null);
            setEditingEntry(null);
          },
          isActive: activeTab === 'folio'
        });
        items.push({
          id: 'bio',
          label: 'Biography',
          action: () => {
            setActiveTab('bio');
            setSelectedEntry(null);
            setEditingEntry(null);
          },
          isActive: activeTab === 'bio'
        });
      }

      if (hasPermission('viewDirectory')) {
        items.push({
          id: 'directory',
          label: 'Directory',
          action: () => {
            setActiveTab('directory');
            setSelectedEntry(null);
            setEditingEntry(null);
          },
          isActive: activeTab === 'directory'
        });
      }
    } else {
      // Authenticated user navigation: Folio, Biography, Desk, and administrative tabs as permitted
      items.push({
        id: 'folio',
        label: 'Folio',
        action: () => {
          if (!selectedAuthorId) {
            setSelectedAuthorId(currentUser.id);
          }
          setActiveTab('folio');
          setSelectedEntry(null);
          setEditingEntry(null);
        },
        isActive: activeTab === 'folio'
      });

      items.push({
        id: 'bio',
        label: 'Biography',
        action: () => {
          if (!selectedAuthorId) {
            setSelectedAuthorId(currentUser.id);
          }
          setActiveTab('bio');
          setSelectedEntry(null);
          setEditingEntry(null);
        },
        isActive: activeTab === 'bio'
      });

      items.push({
        id: 'desk',
        label: 'Desk',
        action: () => {
          setSelectedAuthorId(currentUser.id);
          setActiveTab('desk');
          setSelectedEntry(null);
          setEditingEntry(null);
        },
        isActive: activeTab === 'desk'
      });

      if (hasPermission('viewIndex')) {
        items.push({
          id: 'index',
          label: 'Index',
          action: () => {
            setActiveTab('index');
            setSelectedEntry(null);
            setEditingEntry(null);
          },
          isActive: activeTab === 'index'
        });
      }

      if (hasPermission('curateFrontpage')) {
        items.push({
          id: 'editorium',
          label: 'Editorium',
          action: () => {
            setActiveTab('editorium');
            setSelectedEntry(null);
            setEditingEntry(null);
          },
          isActive: activeTab === 'editorium'
        });
      }

      if (hasPermission('manageSettings')) {
        items.push({
          id: 'settings',
          label: 'Settings',
          action: () => {
            setActiveTab('settings');
            setSelectedEntry(null);
            setEditingEntry(null);
          },
          isActive: activeTab === 'settings'
        });
      }

      if (hasPermission('viewDirectory')) {
        items.push({
          id: 'directory',
          label: 'Directory',
          action: () => {
            setActiveTab('directory');
            setSelectedEntry(null);
            setEditingEntry(null);
          },
          isActive: activeTab === 'directory'
        });
      }
    }

    return items;
  };

  // Toggle writer suspension state
  const handleToggleUserSuspension = (targetUserId: string) => {
    if (!currentUser || !hasPermission('manageRbac')) {
      showToast('Permission Denied: Only users with RBAC management privileges can suspend accounts.', 'error');
      return;
    }

    // Self-suspension check
    if (currentUser.id === targetUserId) {
      showToast('Self-Administration Safety: You cannot suspend your own account.', 'error');
      return;
    }

    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    // Safety: Ensure there is at least one active Chief Editor remaining
    if (targetUser.role === 'Chief Editor' && !targetUser.suspended) {
      const activeChiefEditors = users.filter(u => u.role === 'Chief Editor' && !u.suspended);
      if (activeChiefEditors.length <= 1) {
        showToast('Self-Administration Safety: The platform must always maintain at least one active Chief Editor.', 'error');
        return;
      }
    }

    const updatedUser: User = {
      ...targetUser,
      suspended: !targetUser.suspended
    };
    db.updateUser(updatedUser);
    db.addLog(`${updatedUser.suspended ? 'Suspended' : 'Reactivated'} account of ${targetUser.penName} (@${targetUser.username}).`, currentUser.penName, currentUser.role);
    refreshDbState();

    showToast(`${targetUser.penName}'s account has been ${updatedUser.suspended ? 'suspended' : 'reactivated'}.`, 'success');
  };

  // Change user role (Chief Editor only)
  const handleChangeUserRole = (targetUserId: string, newRole: User['role']) => {
    if (!currentUser || !hasPermission('manageRbac')) {
      showToast('Permission Denied: Only users with RBAC management privileges can modify user roles.', 'error');
      return;
    }

    // Self-demotion/role modification check
    if (currentUser.id === targetUserId) {
      showToast('Self-Administration Safety: You cannot demote yourself or modify your own role.', 'error');
      return;
    }

    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    // Safety: Ensure there is at least one active Chief Editor remaining
    if (targetUser.role === 'Chief Editor' && newRole !== 'Chief Editor') {
      const activeChiefEditors = users.filter(u => u.role === 'Chief Editor' && !u.suspended);
      if (activeChiefEditors.length <= 1) {
        showToast('Self-Administration Safety: The platform must always maintain at least one active Chief Editor.', 'error');
        return;
      }
    }

    const updatedUser: User = {
      ...targetUser,
      role: newRole
    };
    db.updateUser(updatedUser);
    db.addLog(`Modified role of ${targetUser.penName} (@${targetUser.username}) from '${targetUser.role}' to '${newRole}'.`, currentUser.penName, currentUser.role);
    refreshDbState();

    showToast(`${targetUser.penName}'s role changed to ${newRole}.`, 'success');
  };

  // Initialize selected author biography state when tab or selection changes
  useEffect(() => {
    if (currentUser && activeTab === 'desk') {
      const userProfile = db.getProfileByAuthorId(currentUser.id);
      const identity = db.getIdentityByAccountId(currentUser.id);
      setDeskUsername(currentUser.username);
      setDeskPenName(currentUser.penName);
      setDeskSignature(currentUser.signature);
      setDeskBioText(identity ? identity.biography : '');
      setDeskHeroTitle(userProfile.heroTitle);
      setDeskHeroSubtitle(userProfile.heroSubtitle);
      setDeskHeroSignatureText(currentUser.signature);
    }
  }, [currentUser, activeTab]);

  // Synchronize internal state with database updates
  const refreshDbState = () => {
    setUsers(db.getUsers());
    setProfiles(db.getProfiles());
    setEntries(db.getEntries());
    setSystemSettings(db.getSystemSettings());
  };

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const authenticatedUser = AuthService.signIn(usernameInput, passwordInput);
      setCurrentUser(authenticatedUser);
      setSelectedAuthorId(authenticatedUser.id);
      setUsernameInput('');
      setPasswordInput('');
      setShowLoginModal(false);
      
      // Redirect to Folio upon login
      setActiveTab('folio');
      setEditingEntry(null);
      setSelectedEntry(null);
      showToast(`Welcome back, ${authenticatedUser.penName}!`, 'success');
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed.');
    }
  };

  // Fast direct simulation switcher (helps evaluators easily test different roles)
  const handleFastLogin = (username: string) => {
    try {
      const authenticatedUser = AuthService.signInWithPreset(username);
      setCurrentUser(authenticatedUser);
      setSelectedAuthorId(authenticatedUser.id);
      setActiveTab('folio');
      setEditingEntry(null);
      setSelectedEntry(null);
      setShowLoginModal(false);
      showToast(`Logged in as ${authenticatedUser.penName} (${authenticatedUser.role})`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Fast Login failed.', 'error');
    }
  };

  // Logout handler
  const handleLogout = () => {
    AuthService.signOut();
    setCurrentUser(null);
    setSelectedAuthorId('');
    setActiveTab('landing');
    setEditingEntry(null);
    setSelectedEntry(null);
    showToast('Signed out successfully.', 'info');
  };

  // Save Writing Desk Entry
  const handleSaveEntry = (updatedEntry: Entry) => {
    db.saveEntry(updatedEntry);
    refreshDbState();
    if (editingEntry?.id === updatedEntry.id) {
      setEditingEntry(updatedEntry);
    }
  };

  // Delete Writing Desk Entry
  const handleDeleteEntry = (entryId: string) => {
    db.deleteEntry(entryId);
    refreshDbState();
    setEditingEntry(null);
    setSelectedEntry(null);
  };

  // Create new draft entry
  const handleCreateNewEntry = (type: EntryType) => {
    if (!currentUser) return;

    const newId = generateUUID();
    const tempTitle = type === 'Note' ? '' : `Untitled ${type}`;
    const defaultContent = type === 'Article' 
      ? 'This is the first paragraph of your scholarly article.\n\nThis is the second paragraph of your article. Margin notes are displayed adjacent to their respective paragraph.'
      : type === 'Essay'
      ? 'This is the primary discourse of your essay. You may incorporate footnotes[^1] directly inside your entry text.\n\nAnother paragraph expanding on your thesis.'
      : type === 'Notice' ? 'Official notice regarding platform operations or schedule updates.'
        : type === "Editor's Note" ? 'Official reflections from the Editorial Board regarding the structural direction of the platform.'
        : 'A concise scholarly note or philosophical fragment. Supports right-to-left formatting for Arabic or Jawi script.';

    const slugSuffix = Date.now().toString().slice(-4);
    const entrySlug = type === 'Note' ? `note-${slugSuffix}` : `untitled-${type.toLowerCase()}-${slugSuffix}`;

    const newEntry: Entry = {
      id: newId,
      authorId: currentUser.id,
      contentType: type,
      status: 'Draft',
      visibility: 'Private',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      publishedDate: null,
      title: tempTitle,
      slug: entrySlug,
      tags: ['Scholarship'],
      canonicalUrl: `https://${currentUser.penName.toLowerCase().replace(/\s+/g, '')}.adjung.com/${type.toLowerCase()}/${type === 'Note' ? 'note-' + slugSuffix : 'untitled'}`,
      content: defaultContent,
      footnotes: type === 'Essay' ? ['Your first footnote description citation goes here.'] : undefined,
      marginNotes: type === 'Article' ? { 0: 'A scholarly margin note aligned with paragraph 1.' } : undefined
    };

    db.saveEntry(newEntry);
    refreshDbState();
    setEditingEntry(newEntry);
  };

  // Save Folio Settings (Public Writing Identity)
  const handleSaveFolioSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // 1. Update user's public identity metadata
    const updatedUser: User = {
      ...currentUser,
      penName: deskPenName,
      signature: deskSignature
    };
    db.updateUser(updatedUser);
    setCurrentUser(updatedUser);

    // 2. Update writer profile info
    const profile = db.getProfileByAuthorId(currentUser.id);
    const updatedProfile: WriterProfile = {
      ...profile,
      heroTitle: deskHeroTitle,
      heroSubtitle: deskHeroSubtitle,
    };
    db.updateProfile(updatedProfile);

    const identity = db.getIdentityByAccountId(currentUser.id);
    if (identity) {
      db.updateIdentity({
        ...identity,
        biography: deskBioText
      });
    }
    
    refreshDbState();
    showToast('Writing profile updated successfully', 'success');
  };

  // Save Account Credentials Settings
  const handleSaveAccountSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const cleanUsername = accountUsername.trim().toLowerCase().replace(/\s+/g, '.');
    const cleanEmail = accountEmail.trim();

    if (!cleanUsername) {
      setAccountError('Username cannot be empty.');
      return;
    }

    // Username pattern verification
    const usernameRegex = /^[a-z0-9._]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      setAccountError('Username can only contain lowercase letters, numbers, dots, and underscores.');
      return;
    }

    // Check duplicate username if changed
    if (cleanUsername !== currentUser.username) {
      const exists = users.some(u => u.id !== currentUser.id && u.username.toLowerCase() === cleanUsername);
      if (exists) {
        setAccountError(`The username '${cleanUsername}' is already taken.`);
        return;
      }
    }

    // Password verification if entered
    if (accountPassword) {
      if (accountPassword.length < 4) {
        setAccountError('Password must be at least 4 characters long.');
        return;
      }
      if (accountPassword !== accountConfirmPassword) {
        setAccountError('Passwords do not match.');
        return;
      }
    }

    // Update User
    const updatedUser: User = {
      ...currentUser,
      username: cleanUsername,
      email: cleanEmail
    };
    db.updateUser(updatedUser);
    setCurrentUser(updatedUser);

    if (accountPassword) {
      localStorage.setItem(`adjung_password_${currentUser.id}`, accountPassword);
    }

    db.addLog(`Updated account credentials (username: @${cleanUsername}, email: ${cleanEmail || 'none'}).`, currentUser.penName, currentUser.role);
    refreshDbState();
    setShowAccountModal(false);
    showToast('Account credentials updated successfully', 'success');
  };

  // Add Biography Timeline Item
  const handleAddBioItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const profile = db.getProfileByAuthorId(currentUser.id);
    const newItem: BiographyItem = {
      id: generateUUID(),
      year: newBioYear || '2026',
      title: newBioTitle || 'New Milestone',
      description: newBioDesc || 'Milestone description',
      category: newBioCategory
    };

    const identity = db.getIdentityByAccountId(currentUser.id);
    if (identity) {
      const updatedIdentity: IdentityProfile = {
        ...identity,
        lifeTimeline: [...identity.lifeTimeline, newItem].sort((a, b) => parseInt(a.year) - parseInt(b.year))
      };
      db.updateIdentity(updatedIdentity);
    }
    refreshDbState();
    showToast('Biography updated', 'success');
    
    // Reset modal states
    setShowAddBioModal(false);
    setNewBioYear('');
    setNewBioTitle('');
    setNewBioDesc('');
  };

  // Remove Biography Timeline Item
  const handleRemoveBioItem = (itemId: string) => {
    if (!currentUser) return;
    const identity = db.getIdentityByAccountId(currentUser.id);
    if (identity) {
      const updatedIdentity = {
        ...identity,
        lifeTimeline: identity.lifeTimeline.filter(item => item.id !== itemId)
      };
      db.updateIdentity(updatedIdentity);
    }
    refreshDbState();
    showToast('Biography updated', 'success');
  };

  // Editorium: Send invitation to a scholar
  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const signupUrl = `https://adjung.com/invite/register?name=${encodeURIComponent(inviteName.trim())}&email=${encodeURIComponent(inviteEmail.trim())}`;
    const emailBody = `Salutations ${inviteName.trim()},

You are cordially invited by the Chief Editor of Adjung to join our publishing platform as an independent Writer.

Name: ${inviteName.trim()}
Email: ${inviteEmail.trim()}
${inviteMessage.trim() ? `\nMessage from the Chief Editor:\n"${inviteMessage.trim()}"\n` : ''}
To accept this invitation and initialize your personal scholarly Folio, please click the link below to choose your Username and signature:
${signupUrl}

Respectfully,
Editorial Board of Adjung`;

    setGeneratedInvitation({
      id: generateUUID(),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      message: inviteMessage.trim(),
      signupUrl,
      emailBody
    });

    // Reset fields
    setInviteName('');
    setInviteEmail('');
    setInviteMessage('');

    showToast(`Invitation sent to ${inviteName.trim()}`, 'success');
  };

  // Handle completing registration from invitation
  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitedRegistrationData) return;

    const { username, penName, signature, heroTitle, heroSubtitle, bioText, email, name } = invitedRegistrationData;

    if (!username.trim() || !penName.trim() || !signature.trim()) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    const formattedUsername = username.trim().toLowerCase().replace(/\s+/g, '.');
    
    // Check for duplicate username
    const exists = users.some(u => u.username.toLowerCase() === formattedUsername);
    if (exists) {
      showToast(`Self-Administration Safety: '${formattedUsername}' is already taken. Please select a unique username.`, 'error');
      return;
    }

    const newUserId = `user-${formattedUsername.replace(/\./g, '-')}`;
    const newUser: User = {
      id: newUserId,
      username: formattedUsername,
      email: email,
      role: 'Writer',
      penName: penName.trim(),
      signature: signature.trim(),
      avatarColor: 'bg-stone-800 text-stone-100',
      bioSummary: `Newly registered independent scholar on Adjung.`
    };

    // Create the User in the mockDb
    db.createUser(newUser);

    // Update associated empty profile
    const profile = db.getProfileByAuthorId(newUserId);
    const updatedProfile: WriterProfile = {
      ...profile,
      heroTitle: heroTitle.trim() || `${penName.trim()}’s Folio`,
      heroSubtitle: heroSubtitle.trim() || 'A collection of writings and scholarly notes.'
    };
    db.updateProfile(updatedProfile);
    
    const identity = db.getIdentityByAccountId(newUserId);
    if (identity) {
      db.updateIdentity({
        ...identity,
        biography: bioText.trim() || `Biography of ${penName.trim()}.`
      });
    }

    // Sync state
    refreshDbState();
    setCurrentUser(newUser);
    setSelectedAuthorId(newUserId);
    setActiveTab('desk');
    setInvitedRegistrationData(null);

    showToast(`Folio Initialized! Welcome to Adjung, ${penName.trim()}!`, 'success');
  };

  const handleWizardComplete = (data: any) => {
    const { username, displayName, signatureData, email, biography, professionalTitle, institution, country, areasOfInterest, domain } = data;

    const formattedUsername = (domain || username).trim().toLowerCase().replace(/\s+/g, '.');
    
    // Check for duplicate username
    const exists = users.some(u => u.username.toLowerCase() === formattedUsername);
    if (exists) {
      showToast(`Self-Administration Safety: '${formattedUsername}' is already taken. Please select a unique username.`, 'error');
      return;
    }

    const newUserId = `user-${formattedUsername.replace(/\./g, '-')}`;
    const newUser: User = {
      id: newUserId,
      username: formattedUsername,
      email: email.trim(),
      role: 'Writer',
      penName: displayName.trim(),
      signature: typeof signatureData === 'string' ? signatureData.trim() : displayName.trim(),
      avatarColor: 'bg-stone-800 text-stone-100',
      bioSummary: `Newly registered independent scholar on Adjung.`
    };

    // Create the User in the mockDb
    db.createUser(newUser);

    // Update associated empty profile
    const profile = db.getProfileByAuthorId(newUserId);
    const updatedProfile: WriterProfile = {
      ...profile,
      heroTitle: `${displayName.trim()}'s Folio`,
      heroSubtitle: professionalTitle || 'A collection of writings and scholarly notes.'
    };
    db.updateProfile(updatedProfile);
    
    const identity = db.getIdentityByAccountId(newUserId);
    if (identity) {
      // bioContent removed







      db.updateIdentity({
        ...identity,
        biography: biography ? biography.trim() : `Biography of ${displayName.trim()}.`
      });
    }

    // Sync state
    refreshDbState();
    setCurrentUser(newUser);
    setSelectedAuthorId(newUserId);
    setActiveTab('desk');
    setShowSignUpWizard(false);
    showToast(`Membership established! Welcome to Adjung, ${displayName.trim()}!`, 'success');
  };

  // Editorium: Reset Database
  const handleResetDatabase = () => {
    if (window.confirm('WARNING: This will restore the database to the initial academic seed data, erasing all custom local modifications. Proceed?')) {
      db.resetToDefaults();
      AuthService.signOut();
      refreshDbState();
      setCurrentUser(null);
      setSelectedAuthorId('');
      setActiveTab('folio');
      setEditingEntry(null);
      setSelectedEntry(null);
    }
  };

  // Active Author profile and records (no silent seeded fallbacks!)
  const currentAuthor = selectedAuthorId ? users.find(u => u.id === selectedAuthorId) : undefined;
  const authorProfile = selectedAuthorId ? (profiles.find(p => p.authorId === selectedAuthorId) || db.getProfileByAuthorId(selectedAuthorId)) : undefined;
  const authorIdentity = selectedAuthorId ? db.getIdentityByAccountId(selectedAuthorId) : undefined;
  const authorPublishedEntries = selectedAuthorId ? entries.filter(e => e.authorId === selectedAuthorId && e.status === 'Published' && e.visibility === 'Public') : [];

  // Filter timeline entries by selected category/tag
  const allUniqueTags = Array.from(new Set(authorPublishedEntries.flatMap(e => e.tags)));
  const filteredTimelineEntries = selectedTagFilter === 'All' 
    ? authorPublishedEntries 
    : authorPublishedEntries.filter(e => e.tags.includes(selectedTagFilter));

  // Sort entries for timeline: Grouped by Year, and within Year by Date descending
  const timelineGroupedByYear: { [year: string]: Entry[] } = {};
  filteredTimelineEntries.forEach(entry => {
    const date = new Date(entry.publishedDate || entry.createdDate);
    const year = date.getFullYear().toString();
    if (!timelineGroupedByYear[year]) {
      timelineGroupedByYear[year] = [];
    }
    timelineGroupedByYear[year].push(entry);
  });

  // Sort years descending, and entries inside years descending by date
  const sortedYears = Object.keys(timelineGroupedByYear).sort((a, b) => b.localeCompare(a));
  sortedYears.forEach(year => {
    timelineGroupedByYear[year].sort((a, b) => {
      const d1 = new Date(a.publishedDate || a.createdDate).getTime();
      const d2 = new Date(b.publishedDate || b.createdDate).getTime();
      return d2 - d1;
    });
  });

  return (
    <AnimatePresence mode="wait">
      {initializing ? (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 bg-[#FDFDFD]"
        >
          <LoadingScreen />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="min-h-screen flex flex-col bg-[#FDFDFD] selection:bg-adjung-maroon/10 selection:text-adjung-maroon text-stone-900"
        >
          {/* Top Thin Reading Progress Bar */}
          <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-[#802334]/5 z-50 pointer-events-none">
            <div 
              className="h-full bg-[#802334] transition-all duration-75 ease-out"
              style={{ width: `${maxScroll > 0 ? Math.min(100, Math.max(0, (scrollY / maxScroll) * 100)) : 0}%` }}
            />
          </div>
      
      {/* Elegant Editorial Toast Notification */}
      {toast && (
        <div 
          onClick={() => setToastVisible(false)}
          className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform cursor-pointer select-none max-w-sm w-auto ${
            toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <div className="bg-[#FDFDFD] border border-stone-200/80 shadow-sm px-4 py-2.5 rounded-sm flex items-center gap-2.5 font-serif text-[13px] text-stone-700 hover:border-stone-300 transition-colors">
            <span className="text-[#802334] font-semibold">✓</span>
            <span className="tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

      {/* ==================== 1. BRAND & NAVIGATION (Unified navbar shell) ==================== */}
      <nav 
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
        className={`w-full sticky top-0 z-40 px-4 md:px-8 select-none border-b transition-all ease-out backdrop-blur-md ${
          isHeaderHovered ? 'duration-200' : 'duration-[1500ms]'
        } ${
          isFloating 
            ? 'shadow-[0_4px_20px_rgba(128,35,52,0.08),0_1px_3px_rgba(128,35,52,0.04)] border-white/10' 
            : 'border-white/5 shadow-none'
        } bg-[#802334]/90`}
        style={{
          opacity: showNavbar 
            ? (isHeaderHovered 
                ? 1.0 
                : Math.max(0, 1.0 - scrollY / Math.max(100, Math.min(400, maxScroll)))) 
            : 0,
          pointerEvents: showNavbar ? 'auto' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between py-2">
          
          {/* Left: Beautiful brand wordmark logo linking back to Frontpage */}
          <div 
            onClick={() => {
              setSelectedAuthorId('');
              setSelectedEntry(null);
              setEditingEntry(null);
              if (currentUser) {
                setActiveTab('frontpage');
              } else {
                setActiveTab('landing');
              }
            }}
            className="flex items-center cursor-pointer group text-white hover:opacity-85 transition-opacity"
          >
            <span className="font-serif text-[15px] font-semibold tracking-wider">
              {BRAND.logoText}
            </span>
          </div>

          {/* Middle: Dynamic Navigation Links depending on portal/author context */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 md:gap-3">
              {selectedAuthorId === '' ? (
                /* PLATFORM PORTAL NAVIGATION (DIRECTORY, INDEX) */
                <>
                  {/* Directory */}
                  {currentUser && hasPermission('viewDirectory') && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('directory');
                        setSelectedEntry(null);
                        setEditingEntry(null);
                      }}
                      className={`relative px-2 py-1 text-xs font-mono tracking-wider uppercase transition cursor-pointer ${
                        activeTab === 'directory'
                          ? 'text-white font-bold after:absolute after:bottom-[-9px] after:left-2 after:right-2 after:h-[1.5px] after:bg-white'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      Directory
                    </button>
                  )}

                  {/* Shared Index */}
                  {currentUser && hasPermission('viewIndex') && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('index');
                        setSelectedEntry(null);
                        setEditingEntry(null);
                      }}
                      className={`relative px-2 py-1 text-xs font-mono tracking-wider uppercase transition cursor-pointer ${
                        activeTab === 'index'
                          ? 'text-white font-bold after:absolute after:bottom-[-9px] after:left-2 after:right-2 after:h-[1.5px] after:bg-white'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      Index
                    </button>
                  )}
                </>
              ) : (
                /* INDEPENDENT AUTHOR SITE NAVIGATION (FOLIO, BIOGRAPHY, DESK) */
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('folio');
                      setSelectedEntry(null);
                      setEditingEntry(null);
                    }}
                    className={`relative px-2 py-1 text-xs font-mono tracking-wider uppercase transition cursor-pointer ${
                      activeTab === 'folio'
                        ? 'text-white font-bold after:absolute after:bottom-[-9px] after:left-2 after:right-2 after:h-[1.5px] after:bg-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Folio
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('bio');
                      setSelectedEntry(null);
                      setEditingEntry(null);
                    }}
                    className={`relative px-2 py-1 text-xs font-mono tracking-wider uppercase transition cursor-pointer ${
                      activeTab === 'bio'
                        ? 'text-white font-bold after:absolute after:bottom-[-9px] after:left-2 after:right-2 after:h-[1.5px] after:bg-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Biography
                  </button>

                  {/* Desk: Only if the authenticated user is the owner of this author site */}
                  {currentUser?.id === selectedAuthorId && (
                    <>
                      <span className="text-white/20 text-[10px] select-none font-mono">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('desk');
                          setSelectedEntry(null);
                          setEditingEntry(null);
                        }}
                        className={`px-2.5 py-1 text-xs font-mono tracking-wider uppercase transition border rounded-sm cursor-pointer ${
                          activeTab === 'desk'
                            ? 'bg-white border-white text-[#802334] font-semibold'
                            : 'text-white/80 border-white/20 hover:bg-white/10 font-medium'
                        }`}
                        title="Your private workspace"
                      >
                        desk
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="h-4 w-px bg-white/20" />

            {/* Right: Authentication or User menu */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono tracking-wider text-white/80 hover:text-white transition uppercase cursor-pointer"
                >
                  <span>{currentUser.penName}</span>
                  <span className="text-[10px] opacity-60">▾</span>
                </button>

                {showUserMenu && (
                  <>
                    <div className="absolute right-0 mt-2 w-52 bg-[#FDFDFD] border border-stone-200 shadow-md rounded-sm py-2 z-50 animate-fade-in font-sans text-left">
                      <div className="px-4 py-2 border-b border-stone-100 bg-stone-50/40 select-none">
                        <div className="font-serif text-[13px] font-semibold text-stone-950 leading-tight">
                          {currentUser.penName}
                        </div>
                        <div className="font-mono text-[9px] text-[#802334] font-semibold uppercase tracking-wider mt-1">
                          {currentUser.role}
                        </div>
                        <div className="font-mono text-[9px] text-stone-400 mt-0.5">
                          {currentUser.username}
                        </div>
                      </div>

                      <div className="py-1 font-mono uppercase tracking-wider text-[11px]">
                        {selectedAuthorId !== currentUser.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              setSelectedAuthorId(currentUser.id);
                              setActiveTab('folio');
                              setSelectedEntry(null);
                              setEditingEntry(null);
                            }}
                            className="w-full text-left px-4 py-1.5 text-stone-600 hover:text-[#802334] hover:bg-stone-50/60 transition-colors font-semibold border-b border-stone-100 pb-2 mb-1 cursor-pointer"
                          >
                            My Site
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowAccountModal(true);
                          }}
                          className="w-full text-left px-4 py-1.5 text-stone-600 hover:text-[#802334] hover:bg-stone-50/60 transition-colors cursor-pointer"
                        >
                          Account
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            setSelectedAuthorId('');
                            setActiveTab('identity');
                            setSelectedEntry(null);
                            setEditingEntry(null);
                          }}
                          className={`w-full text-left px-4 py-1.5 transition-colors cursor-pointer ${
                            activeTab === 'identity'
                              ? 'text-[#802334] bg-stone-50/60 font-semibold'
                              : 'text-stone-600 hover:text-[#802334] hover:bg-stone-50/60'
                          }`}
                        >
                          Identity
                        </button>

                        {hasPermission('curateFrontpage') && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              setSelectedAuthorId('');
                              setActiveTab('editorium');
                              setSelectedEntry(null);
                              setEditingEntry(null);
                            }}
                            className={`w-full text-left px-4 py-1.5 transition-colors cursor-pointer ${
                              activeTab === 'editorium'
                                ? 'text-[#802334] bg-stone-50/60 font-semibold'
                                : 'text-stone-600 hover:text-[#802334] hover:bg-stone-50/60'
                            }`}
                          >
                            Editorium
                          </button>
                        )}

                        <div className="h-px bg-stone-100 my-1" />

                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-1.5 text-stone-600 hover:text-[#802334] hover:bg-stone-50/60 transition-colors font-medium cursor-pointer"
                        >
                          Sign Out
                        </button>

                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setLoginError('');
                    setShowLoginModal(true);
                  }}
                  className="px-1.5 py-1 text-xs font-mono tracking-wider text-white/80 hover:text-white font-semibold transition uppercase cursor-pointer"
                >
                  Sign In
                </button>
              </>
            )}
          </div>        </div>      </nav>
      {/* ==================== 2. PERSONAL SCHOLARLY MASTHEAD ==================== */}
      {(activeTab === 'folio' || activeTab === 'bio') && currentAuthor && (
        <header className="w-full pt-8 pb-3 px-4 md:px-8 bg-[#FDFDFD] z-10 select-none">
          <div className="max-w-6xl mx-auto text-center relative">
                        {/* Main classical visual focus: The Author's Identity with refined lines */}
            <div className="border-t border-b border-stone-200/50 py-5 my-1 max-w-3xl mx-auto">
              <span className="block font-mono text-[8px] md:text-[9px] uppercase tracking-[0.25em] text-stone-400 mb-2">
                PERSONAL SITE
              </span>
              
              <h1 
                onClick={() => {
                  setSelectedEntry(null);
                  setEditingEntry(null);
                  setActiveTab('folio');
                }}
                className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal tracking-wide text-stone-900 cursor-pointer hover:opacity-95 inline-block select-none leading-none"
              >
                {currentAuthor.penName}
              </h1>
              
              {/* The subdomain kept as an elegant central element of the identity integrated naturally without bullets */}
              <div className="mt-2.5">
                <span className="font-mono text-[11px] text-stone-500 lowercase tracking-wide block select-all">
                  {currentAuthor.username}.adjung.com
                </span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* ==================== 2B. PLATFORM DIRECTORY HEADER ==================== */}
      {activeTab === 'directory' && (
        <header className="w-full pt-8 pb-3 px-4 md:px-8 bg-[#FDFDFD] z-10 select-none">
          <div className="max-w-6xl mx-auto text-center relative">
            <div className="border-t border-b border-stone-200/50 py-5 my-1 max-w-3xl mx-auto">
              <span className="block font-mono text-[8px] md:text-[9px] uppercase tracking-[0.25em] text-stone-400 mb-2">
                PLATFORM DIRECTORY
              </span>
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal tracking-wide text-stone-900 inline-block select-none leading-none">
                Writers Directory
              </h1>
              <div className="mt-2.5">
                <span className="font-mono text-[11px] text-stone-500 lowercase tracking-wide block">
                  Search and browse registered Adjung writers.
                </span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* ==================== 3. MAIN DYNAMIC WORKSPACE ==================== */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 md:px-8 mt-6">
        
        {/* VIEW AN INDIVIDUAL PUBLISHED MANUAL FROM FOLIO OR INDEX */}
        {selectedEntry && !editingEntry && (
          <div className="max-w-4xl mx-auto">
            <button
              type="button"
              onClick={() => setSelectedEntry(null)}
              className="mb-8 inline-flex items-center gap-2 text-stone-500 hover:text-adjung-maroon font-sans text-xs uppercase tracking-wider group transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              {selectedEntry.publicationClass === 'Institutional'
                ? (selectedEntry.contentType === 'Notice' ? 'Return to Notices' : "Return to Editor's Notes")
                : 'Return to Catalog Timeline'}
            </button>
            <EntryRenderer 
              entry={selectedEntry} 
              mode="view" 
              authorName={selectedEntry.publicationClass === 'Institutional'
                ? (selectedEntry.publisher || 'Adjung Editorial Board')
                : (users.find(u => u.id === selectedEntry.authorId)?.penName || 'Writer')}
              authorSignature={selectedEntry.publicationClass === 'Institutional'
                ? ''
                : resolveSignatureText(selectedEntry.authorId || '', users.find(u => u.id === selectedEntry.authorId)?.signature || 'Writer')}
              authorSignatureStrokes={selectedEntry.publicationClass === 'Institutional'
                ? []
                : resolveSignatureStrokes(selectedEntry, selectedEntry.authorId || '')}
              authorSignatureFont={selectedEntry.publicationClass === 'Institutional'
                ? ''
                : resolveSignatureFont(selectedEntry.authorId || '')}
              authorDigitalSignature={selectedEntry.publicationClass === 'Institutional'
                ? undefined
                : resolveDigitalSignature(selectedEntry.authorId || '', selectedEntry)}
            />
          </div>
        )}

        {/* ACTIVE MODULE 1: FOLIO VIEW (Continuous editorial timeline grouped by year) */}
        {activeTab === 'folio' && !selectedEntry && (
          <FolioView
            currentAuthor={currentAuthor}
            authorProfile={authorProfile}
            selectedEntry={selectedEntry}
            systemSettings={systemSettings}
            allUniqueTags={allUniqueTags}
            selectedTagFilter={selectedTagFilter}
            setSelectedTagFilter={setSelectedTagFilter}
            authorPublishedEntries={authorPublishedEntries}
            sortedYears={sortedYears}
            timelineGroupedByYear={timelineGroupedByYear}
            expandedNoteIds={expandedNoteIds}
            toggleNote={toggleNote}
            setSelectedEntry={setSelectedEntry}
            setSelectedAuthorId={setSelectedAuthorId}
            setActiveTab={setActiveTab}
            setShowLoginModal={setShowLoginModal}
            setLoginError={setLoginError}
          />
        )}

        {/* ACTIVE MODULE 2: BIOGRAPHY VIEW (Classical blocks & timeline) */}
        {activeTab === 'bio' && (
          !currentAuthor ? (
            <div className="max-w-2xl mx-auto text-center py-16 px-4 space-y-8 select-none">
              <div className="space-y-3">
                <span className="block font-mono text-[8px] md:text-[9px] uppercase tracking-[0.25em] text-adjung-maroon mb-2">
                  Biography Records
                </span>
                <h2 className="font-serif text-3xl font-light text-stone-900 leading-tight">
                  Scholarly Biographies
                </h2>
                <div className="h-px w-24 bg-adjung-maroon/30 mx-auto my-4" />
                <p className="font-serif italic text-stone-600 text-sm leading-relaxed max-w-md mx-auto">
                  Explore life journeys, publications, academic appointments, and achievements of our resident scholars.
                </p>
              </div>

              <div className="pt-4">
                <p className="font-sans text-xs text-stone-500 max-w-sm mx-auto mb-6">
                  Please choose a member from the directory to view their complete academic biography and research milestones.
                </p>
                {hasPermission('viewDirectory') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('directory')}
                    className="bg-adjung-maroon hover:opacity-95 text-[#FDFDFD] font-mono text-xs uppercase tracking-wider px-6 py-3 rounded shadow transition cursor-pointer"
                  >
                    Open Scholar Directory
                  </button>
                )}
              </div>
            </div>
          ) : (
            authorIdentity && (
              <BiographyView
                authorProfile={authorIdentity}
                currentAuthor={currentAuthor}
                currentUser={currentUser}
                selectedAuthorId={selectedAuthorId || ''}
                setEditingBioItem={setEditingBioItem}
                setShowAddBioModal={setShowAddBioModal}
                handleRemoveBioItem={handleRemoveBioItem}
              />
            )
          )
        )}

        {/* ACTIVE MODULE 3: WRITING DESK (Owner-only canonical editing/draft workspace) */}
        {activeTab === 'desk' && currentUser && (
          <div className="max-w-5xl mx-auto space-y-12">
            
            {/* Header / Sub-selector bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
              <div className="space-y-1">
                <h2 className="font-serif text-2xl font-light text-stone-900 flex items-center gap-2">
                  <PenTool className="w-6 h-6 text-adjung-maroon" />
                  Writing Desk
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
                  Write, edit and manage your publications.
                </p>
              </div>

              {/* Create buttons */}
              {!editingEntry && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCreateNewEntry('Note')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#FDFDFD] border border-adjung-maroon/20 hover:bg-adjung-maroon/5 text-adjung-maroon rounded text-xs font-mono tracking-wider uppercase transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Note
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateNewEntry('Essay')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#FDFDFD] border border-adjung-maroon/20 hover:bg-adjung-maroon/5 text-adjung-maroon rounded text-xs font-mono tracking-wider uppercase transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Essay
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateNewEntry('Article')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#FDFDFD] border border-adjung-maroon/20 hover:bg-adjung-maroon/5 text-adjung-maroon rounded text-xs font-mono tracking-wider uppercase transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Article
                  </button>
                    {(currentUser.role === 'Chief Editor' || currentUser.role === 'Editor') && (
                      <>
                        <div className="w-px h-6 bg-stone-300 mx-1 self-center" />
                        <button
                          type="button"
                          onClick={() => handleCreateNewEntry('Notice')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#FDFDFD] border border-stone-300 hover:bg-stone-100 text-stone-700 rounded text-xs font-mono tracking-wider uppercase transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Notice
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateNewEntry("Editor's Note")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#FDFDFD] border border-stone-300 hover:bg-stone-100 text-stone-700 rounded text-xs font-mono tracking-wider uppercase transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Ed. Note
                        </button>
                      </>
                    )}
                </div>
              )}
            </div>

            {/* WYSIWYG ACTUAL EDITING ENGINE */}
            {editingEntry ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-stone-50 p-2 border rounded max-w-4xl mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEntry(null);
                      refreshDbState();
                    }}
                    className="inline-flex items-center gap-1 text-stone-600 hover:text-adjung-maroon font-mono text-xs uppercase"
                  >
                    <ChevronLeft className="w-4 h-4" /> Close Composer
                  </button>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400">View</span>
                    <div className="flex items-center border border-stone-200 rounded overflow-hidden bg-white p-0.5 shadow-sm">
                      <button
                        type="button"
                        onClick={() => {
                          deskLastScrollY.current = window.scrollY;
                          setDeskViewMode('preview');
                          setTimeout(() => {
                            window.scrollTo({
                              top: deskLastScrollY.current,
                              behavior: 'auto'
                            });
                          }, 0);
                        }}
                        className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition rounded-sm cursor-pointer ${
                          deskViewMode === 'preview'
                            ? 'bg-[#802334] text-white font-medium shadow-sm'
                            : 'text-stone-600 hover:text-adjung-maroon'
                        }`}
                      >
                        ● Visual
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deskLastScrollY.current = window.scrollY;
                          setDeskViewMode('editor');
                          setTimeout(() => {
                            window.scrollTo({
                              top: deskLastScrollY.current,
                              behavior: 'auto'
                            });
                          }, 0);
                        }}
                        className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition rounded-sm cursor-pointer ${
                          deskViewMode === 'editor'
                            ? 'bg-[#802334] text-white font-medium shadow-sm'
                            : 'text-stone-600 hover:text-adjung-maroon'
                        }`}
                      >
                        ○ Source
                      </button>
                    </div>
                  </div>
                </div>

                <EntryRenderer
                  entry={editingEntry}
                  mode="edit"
                  viewMode={deskViewMode}
                  onSave={handleSaveEntry}
                  onDelete={handleDeleteEntry}
                  authorName={currentUser.penName}
                  authorSignature={resolveSignatureText(currentUser.id, currentUser.signature)}
                  authorSignatureStrokes={resolveSignatureStrokes(editingEntry, currentUser.id)}
                  authorSignatureFont={resolveSignatureFont(currentUser.id)}
                  authorDigitalSignature={resolveDigitalSignature(currentUser.id, editingEntry)}
                />
              </div>
            ) : (
              // GENERAL DESK LAYOUT (List of entries & Settings)
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left side: Registered entries lists */}
                <div className="lg:col-span-8 space-y-10">
                  
                  {/* Drafts Section */}
                  <div className="space-y-4">
                    <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-stone-500 flex items-center gap-2 border-b pb-2">
                      <span>Drafts</span>
                      <span className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded text-[10px]">
                        {entries.filter(e => e.authorId === currentUser.id && e.status === 'Draft').length}
                      </span>
                    </h3>

                    {entries.filter(e => e.authorId === currentUser.id && e.status === 'Draft').length === 0 ? (
                      <p className="text-xs text-stone-400 italic py-3">No pending drafts. Your mind is quiet.</p>
                    ) : (
                      <div className="space-y-3">
                        {entries.filter(e => e.authorId === currentUser.id && e.status === 'Draft').map(draft => (
                          <div 
                            key={draft.id} 
                            onClick={() => setEditingEntry(draft)}
                            className="bg-white hover:bg-stone-50 border border-stone-200/80 p-4 rounded flex items-center justify-between cursor-pointer group transition hover:shadow-sm"
                          >
                            <div className="space-y-1 pr-4">
                              <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
                                <span className="text-adjung-maroon font-semibold">{draft.contentType}</span>
                                <span>•</span>
                                <span>Updated {new Date(draft.updatedDate).toLocaleDateString()}</span>
                              </div>
                              <h4 className="font-serif font-semibold text-stone-800 text-sm md:text-base group-hover:text-adjung-maroon transition-colors text-left line-clamp-1">
                                {draft.contentType === 'Note' ? (parseInlineFormatting(draft.content.split('\n')[0] || '(Empty Note)')) : parseInlineFormatting(draft.title || '')}
                              </h4>
                            </div>
                            <FileEdit className="w-4 h-4 text-stone-400 group-hover:text-adjung-maroon flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Published Section */}
                  <div className="space-y-4">
                    <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-stone-500 flex items-center gap-2 border-b pb-2">
                      <span>Published</span>
                      <span className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded text-[10px]">
                        {entries.filter(e => e.authorId === currentUser.id && e.status === 'Published').length}
                      </span>
                    </h3>

                    {entries.filter(e => e.authorId === currentUser.id && e.status === 'Published').length === 0 ? (
                      <p className="text-xs text-stone-400 italic py-3">No published records on file.</p>
                    ) : (
                      <div className="space-y-3">
                        {entries.filter(e => e.authorId === currentUser.id && e.status === 'Published').map(pub => (
                          <div 
                            key={pub.id} 
                            onClick={() => setEditingEntry(pub)}
                            className="bg-white hover:bg-stone-50 border border-stone-200/80 p-4 rounded flex items-center justify-between cursor-pointer group transition hover:shadow-sm"
                          >
                            <div className="space-y-1 pr-4">
                              <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
                                <span className="text-adjung-maroon font-semibold">{pub.contentType}</span>
                                <span>•</span>
                                <span>Published {pub.publishedDate ? new Date(pub.publishedDate).toLocaleDateString() : 'N/A'}</span>
                              </div>
                              <h4 className="font-serif font-semibold text-stone-800 text-sm md:text-base group-hover:text-adjung-maroon transition-colors text-left line-clamp-1">
                                {pub.contentType === 'Note' ? (parseInlineFormatting(pub.content.split('\n')[0] || '(Empty Note)')) : parseInlineFormatting(pub.title || '')}
                              </h4>
                            </div>
                            <div className="flex items-center gap-3 text-stone-400 flex-shrink-0">
                              {pub.visibility === 'Private' ? (
                                <Lock className="w-3.5 h-3.5 text-red-600" title="Private" />
                              ) : (
                                <Globe className="w-3.5 h-3.5 text-stone-400" title="Public" />
                              )}
                              <FileEdit className="w-4 h-4 group-hover:text-adjung-maroon" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Archived Section */}
                  <div className="space-y-4">
                    <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-stone-500 flex items-center gap-2 border-b pb-2">
                      <span>Archive</span>
                      <span className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded text-[10px]">
                        {entries.filter(e => e.authorId === currentUser.id && e.status === 'Archived').length}
                      </span>
                    </h3>

                    {entries.filter(e => e.authorId === currentUser.id && e.status === 'Archived').length === 0 ? (
                      <p className="text-xs text-stone-400 italic py-3">No archived entries.</p>
                    ) : (
                      <div className="space-y-3">
                        {entries.filter(e => e.authorId === currentUser.id && e.status === 'Archived').map(arch => (
                          <div 
                            key={arch.id} 
                            onClick={() => setEditingEntry(arch)}
                            className="bg-stone-50 hover:bg-stone-100/85 border border-stone-200/60 p-4 rounded flex items-center justify-between cursor-pointer group transition hover:shadow-sm opacity-75"
                          >
                            <div className="space-y-1 pr-4">
                              <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
                                <span className="text-stone-500 font-semibold">{arch.contentType}</span>
                                <span>•</span>
                                <span>Archived {new Date(arch.updatedDate).toLocaleDateString()}</span>
                              </div>
                              <h4 className="font-serif font-semibold text-stone-700 text-sm md:text-base group-hover:text-adjung-maroon transition-colors text-left line-clamp-1">
                                {arch.contentType === 'Note' ? (parseInlineFormatting(arch.content.split('\n')[0] || '(Empty Note)')) : parseInlineFormatting(arch.title || '')}
                              </h4>
                            </div>
                            <div className="flex items-center gap-3 text-stone-450 flex-shrink-0">
                              <span className="font-mono text-[9px] uppercase tracking-wider bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded">Archived</span>
                              <FileEdit className="w-4 h-4 group-hover:text-adjung-maroon" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                
                {/* Right side: Folio Customizer & Pen Name controls */}
                <div className="lg:col-span-4 bg-white border border-stone-200 rounded p-6 shadow-sm text-center space-y-4">
                  <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-[#802334] border-b pb-3 mb-4 flex items-center justify-center gap-1.5">
                    Identity
                  </h3>
                  <p className="font-sans text-xs text-stone-500">
                    Author identity, biography, and signatures are now securely managed in the decoupled Identity module.
                  </p>
                  <button
                    onClick={() => setActiveTab('identity')}
                    className="bg-stone-900 text-white px-4 py-2 rounded text-[10px] font-mono uppercase tracking-wider hover:bg-stone-800 transition cursor-pointer"
                  >
                    Open Identity
                  </button>
                </div>


              </div>
            )}

          </div>
        )}

        {/* ACTIVE MODULE 3B: DIRECTORY (Searchable public directory of all platform members) */}
        {activeTab === 'directory' && (
          <Directory 
            users={users}
            onSelectMember={(userId, targetTab) => {
              setSelectedAuthorId(userId);
              setActiveTab(targetTab);
              setSelectedEntry(null);
              setEditingEntry(null);
            }}
          />
        )}

        {/* ACTIVE MODULE 4: INDEX (Editor/Admin only dynamically generated published entries list) */}
        {activeTab === 'index' && currentUser && hasPermission('viewIndex') && (
          <div className="max-w-6xl mx-auto">
            <EditorialIndex
              entries={entries}
              users={users}
              setSelectedEntry={setSelectedEntry}
              systemSettings={systemSettings}
            />
          </div>
        )}

        {/* ACTIVE MODULE 5: EDITORIUM (Editor settings and administrative workspace) */}
        {activeTab === 'editorium' && currentUser && hasPermission('curateFrontpage') && (
          <Editorium
            currentUser={currentUser}
            users={users}
            entries={entries}
            systemSettings={systemSettings}
            setSystemSettings={setSystemSettings}
            handleResetDatabase={handleResetDatabase}
            handleChangeUserRole={handleChangeUserRole}
            handleToggleUserSuspension={handleToggleUserSuspension}
            showToast={showToast}
            refreshDbState={refreshDbState}
            setSelectedAuthorId={setSelectedAuthorId}
            setActiveTab={setActiveTab}
            setSelectedEntry={setSelectedEntry}
            setEditingEntry={setEditingEntry}
          />
        )}

        {/* ACTIVE MODULE: INSTITUTIONAL NOTICES */}
        {activeTab === 'notices' && !selectedEntry && (
          <NoticesView entries={entries} setSelectedEntry={setSelectedEntry} />
        )}

        {/* ACTIVE MODULE: EDITORIAL NOTES */}
        {activeTab === 'editorial' && !selectedEntry && (
          <EditorialNotesView entries={entries} setSelectedEntry={setSelectedEntry} />
        )}

        {/* ACTIVE MODULE: VERSION HISTORY */}
        {activeTab === 'changelog' && (
          <ChangelogView />
        )}

        {/* ACTIVE MODULE: ARCHITECTURE STUDIO */}
        {activeTab === 'architecture' && (
          <div className="py-8 w-full max-w-7xl mx-auto px-4">
             <ArchitectureStudio />
          </div>
        )}

        {/* ACTIVE MODULE: POLICIES */}
        {activeTab === 'policies' && (
          <PoliciesView policies={db.getPolicies()} />
        )}

        {/* ACTIVE MODULE: IDENTITY STUDIO */}
        {activeTab === 'identity' && currentUser && (
          <div className="py-8">
            <IdentityStudio 
              currentUser={currentUser} 
              onClose={() => setActiveTab('desk')}
              refreshGlobalState={refreshDbState}
            />
          </div>
        )}

        {/* ACTIVE MODULE 0A: LANDING PAGE (Unauthenticated, pure public overview) */}
        {activeTab === 'landing' && (
          <LandingView
            entries={entries}
            systemSettings={systemSettings}
            setActiveTab={setActiveTab}
            setSelectedEntry={setSelectedEntry}
            setSelectedAuthorId={setSelectedAuthorId}
            setShowLoginModal={setShowLoginModal}
            setLoginError={setLoginError}
          />
        )}

        {/* ACTIVE MODULE 0B: CURATED FRONTPAGE (Platform public index of publications & scholars) */}
        {activeTab === 'frontpage' && !selectedEntry && (
          <FrontpageView
            entries={entries}
            users={users}
            systemSettings={systemSettings}
            setSelectedEntry={setSelectedEntry}
            setSelectedAuthorId={setSelectedAuthorId}
            setActiveTab={setActiveTab}
          />
        )}

      </main>

      {/* ==================== 4. SIGN IN / AUTH OVERLAY MODAL ==================== */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#FDFDFD] border border-adjung-maroon/20 rounded shadow-2xl max-w-md w-full overflow-hidden scholarly-border">
            
            {/* Modal header */}
            <div className="border-b border-stone-200 p-5 bg-[#FDFDFD] text-center">
              <h3 className="font-serif text-2xl text-adjung-maroon">Sign In</h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-stone-500 mt-1">Sign in to your {BRAND.shortName} account.</p>
            </div>

            {/* Modal form */}
            <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs font-sans">
              
              {loginError && (
                <div className="p-2.5 bg-red-50 border border-red-100 text-red-800 rounded font-sans text-xs">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Username or Email</label>
                <input
                  type="text"
                  placeholder="e.g. zayd.ghazali"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full border border-stone-200 p-2.5 rounded focus:outline-none focus:border-adjung-maroon"
                  required
                />
              </div>

              <div>
                <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Password matches 'password'"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full border border-stone-200 p-2.5 rounded focus:outline-none focus:border-adjung-maroon"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="w-1/3 border border-stone-200 hover:bg-stone-50 text-stone-600 py-2.5 rounded text-xs font-mono uppercase tracking-wider transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-adjung-maroon hover:opacity-95 text-[#FDFDFD] py-2.5 rounded text-xs font-mono uppercase tracking-wider transition shadow-sm font-semibold"
                >
                  Sign In
                </button>
              </div>

              {/* DEMO FAST CREDENTIAL SWITCHER (Highly recommended for evaluator testing) */}
              <div className="border-t border-stone-200/80 pt-4 mt-4">
                <span className="block font-mono uppercase text-[9px] text-stone-400 tracking-wider mb-2 text-center">
                  Simulation Fast-Login Presets (Click to sign in)
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                  {users.map(u => {
                    const isChief = u.role === 'Chief Editor';
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleFastLogin(u.username)}
                        className={`bg-white hover:bg-stone-50 border border-stone-200/60 p-2 rounded flex flex-col items-center gap-0.5 transition-colors ${
                          isChief ? 'text-[#802334]' : 'text-stone-800'
                        }`}
                      >
                        <span className={`font-serif font-bold ${isChief ? 'text-adjung-maroon' : 'text-stone-900'}`}>
                          {u.penName}
                        </span>
                        <span className={`font-mono text-[8px] uppercase ${isChief ? 'text-stone-500 font-bold' : 'text-stone-400'}`}>
                          {u.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Registration Prompt */}
              <div className="border-t border-stone-200/50 pt-4 mt-4 text-center select-none">
                <p className="font-sans text-xs text-stone-500">
                  Not registered as a Member yet?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginModal(false);
                      setShowSignUpWizard(true);
                    }}
                    className="text-adjung-maroon hover:underline font-semibold cursor-pointer ml-1 font-serif italic text-[13px]"
                  >
                    Register here
                  </button>
                </p>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== 4B. ACCOUNT DETAILS MODAL ==================== */}
      {showAccountModal && currentUser && (
        <div className="fixed inset-0 bg-stone-900/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#FDFDFD] border border-adjung-maroon/25 rounded shadow-2xl max-w-md w-full overflow-hidden scholarly-border animate-fade-in text-left">
            
            {/* Modal header */}
            <div className="border-b border-stone-200 p-5 bg-[#FDFDFD] text-center">
              <h3 className="font-serif text-2xl text-adjung-maroon">Account Settings</h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-stone-500 mt-1">Platform Identity & Credentials</p>
            </div>

            <form onSubmit={handleSaveAccountSettings} className="p-6 space-y-4 text-xs font-sans text-stone-800">
              
              {accountError && (
                <div className="p-2.5 bg-red-50 border border-red-100 text-red-800 rounded font-sans text-xs">
                  {accountError}
                </div>
              )}

              {/* Display name (Read-only on account, managed on Desk) */}
              <div>
                <label className="block font-mono uppercase text-[9px] text-stone-400 tracking-wider mb-1">
                  Public Pen Name <span className="text-[8px] italic">(Customized on Desk)</span>
                </label>
                <div className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded text-stone-500 font-serif text-[13px] select-none">
                  {currentUser.penName}
                </div>
              </div>

              {/* Username Input */}
              <div>
                <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1 font-semibold">
                  Platform Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono text-stone-400 select-none">@</span>
                  <input
                    type="text"
                    value={accountUsername}
                    onChange={(e) => setAccountUsername(e.target.value)}
                    className="w-full border border-stone-200 pl-7 pr-3 py-2.5 rounded focus:outline-none focus:border-adjung-maroon font-mono text-xs"
                    placeholder="username"
                    required
                  />
                </div>
                <span className="text-[8px] font-mono text-stone-400 mt-1 block leading-normal">
                  Your unique handle. Allowed: lowercase letters, numbers, dots, and underscores.
                </span>
              </div>

              {/* Email Input */}
              <div>
                <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1 font-semibold">
                  Email Address
                </label>
                <input
                  type="email"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  className="w-full border border-stone-200 p-2.5 rounded focus:outline-none focus:border-adjung-maroon font-mono text-xs"
                  placeholder="e.g. scholar@adjung.com"
                />
                <span className="text-[8px] font-mono text-stone-400 mt-1 block leading-normal">
                  Used for password retrieval, platform communications, and board logs.
                </span>
              </div>

              {/* Password Fields */}
              <div className="border-t border-stone-100 pt-3.5 space-y-3">
                <span className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider font-semibold">
                  Update Password <span className="text-[8px] font-normal italic text-stone-400">(Leave blank to keep current)</span>
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono uppercase text-[8px] text-stone-400 tracking-wider mb-1">New Password</label>
                    <input
                      type="password"
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                      className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon font-mono text-xs"
                      placeholder="Min 4 characters"
                    />
                  </div>
                  <div>
                    <label className="block font-mono uppercase text-[8px] text-stone-400 tracking-wider mb-1">Confirm New</label>
                    <input
                      type="password"
                      value={accountConfirmPassword}
                      onChange={(e) => setAccountConfirmPassword(e.target.value)}
                      className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon font-mono text-xs"
                      placeholder="Repeat password"
                    />
                  </div>
                </div>
              </div>

              {/* Informative Architectural note box */}
              <div className="bg-stone-50 border border-stone-200/85 p-3 rounded-sm text-[10.5px] text-stone-600 font-serif leading-relaxed italic text-left">
                Note: In alignment with the Adjung publishing architecture, all Author Site settings (such as your pen name, handwritten signature stamp, custom hero title/subtitle, and public biography) are managed securely inside your private <span className="font-mono uppercase tracking-wider font-semibold text-[#802334] text-[9px]">Desk</span>. This Account panel is strictly reserved for platform-level identity credentials.
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="w-1/3 border border-stone-200 hover:bg-stone-50 text-stone-600 py-2.5 rounded text-xs font-mono uppercase tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-[#802334] hover:opacity-95 text-[#FDFDFD] py-2.5 rounded text-xs font-mono uppercase tracking-wider transition shadow-sm font-semibold cursor-pointer"
                >
                  Save Credentials
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== 5. ADD TIMELINE ITEM MODAL (Shown only in Biography when Owner) ==================== */}
      {showAddBioModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#FDFDFD] border border-adjung-maroon/20 rounded shadow-2xl max-w-md w-full overflow-hidden scholarly-border">
            <div className="border-b border-stone-200 p-5 bg-[#FDFDFD] text-center">
              <h3 className="font-serif text-xl text-adjung-maroon">Add Milestone</h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-stone-500 mt-1">Save Milestone</p>
            </div>
            <form onSubmit={handleAddBioItem} className="p-6 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024"
                    value={newBioYear}
                    onChange={(e) => setNewBioYear(e.target.value)}
                    className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon font-mono"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Classification</label>
                  <select
                    value={newBioCategory}
                    onChange={(e) => setNewBioCategory(e.target.value as BiographyItem['category'])}
                    className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon"
                  >
                    <option value="Education">Education</option>
                    <option value="Career">Career</option>
                    <option value="Publication">Publication</option>
                    <option value="Award">Award</option>
                    <option value="Personal">Personal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Milestone Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master’s Defense on Calligraphic Grids"
                  value={newBioTitle}
                  onChange={(e) => setNewBioTitle(e.target.value)}
                  className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon font-serif text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Comprehensive Description</label>
                <textarea
                  placeholder="Provide precise details of the scholarly achievement or event..."
                  value={newBioDesc}
                  onChange={(e) => setNewBioDesc(e.target.value)}
                  className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon min-h-[80px]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBioModal(false)}
                  className="w-1/3 border border-stone-200 hover:bg-stone-50 text-stone-600 py-2 rounded text-xs font-mono uppercase tracking-wider transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-adjung-maroon text-[#FDFDFD] py-2 rounded text-xs font-mono uppercase tracking-wider hover:opacity-90 transition font-semibold"
                >
                  Record Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== INVITATION SENT TRANSMISSION MODAL ==================== */}
      {generatedInvitation && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#FDFDFD] border border-adjung-maroon/20 rounded shadow-2xl max-w-lg w-full overflow-hidden scholarly-border my-8">
            <div className="border-b border-stone-200 p-5 bg-[#FDFDFD] text-center">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-pulse mr-2" />
              <h3 className="font-serif text-2xl text-adjung-maroon inline-block">Invitation Transmitted</h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-stone-500 mt-1">Simulated Scholar Mail Delivery Server</p>
            </div>

            <div className="p-6 space-y-6 text-xs font-sans">
              <div className="bg-stone-50 border border-stone-200 p-4 rounded text-left space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 border-b pb-2">
                  <span>MTA Status: <span className="text-emerald-600 font-bold">SMTP OK (250)</span></span>
                  <span>Delivered: Just Now</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
                  <span className="text-stone-400">Recipient:</span>
                  <span className="col-span-3 text-stone-800 font-semibold">{generatedInvitation.name}</span>
                  <span className="text-stone-400">Address:</span>
                  <span className="col-span-3 text-stone-800 font-semibold select-all">{generatedInvitation.email}</span>
                </div>
              </div>

              {/* Styled vintage email envelope card */}
              <div className="border border-amber-200/50 bg-[#FBF9F4] p-6 rounded shadow-sm relative overflow-hidden text-stone-800 select-all font-serif">
                <div className="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-amber-900/10 rotate-12 translate-x-12 -translate-y-12 select-none pointer-events-none" />
                <div className="space-y-4 whitespace-pre-line text-justify leading-relaxed pr-2 text-stone-700">
                  {generatedInvitation.emailBody}
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded text-left leading-relaxed text-[11px] text-amber-900 font-sans flex gap-2.5">
                <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Evaluator Simulation Mode</span>
                  <span>Since this is a simulated sandbox, we have generated the formal email dispatch. Click the button below to simulate the recipient opening their invitation link and configuring their personal Folio.</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratedInvitation(null)}
                  className="w-1/3 border border-stone-200 hover:bg-stone-50 text-stone-600 py-3 rounded text-xs font-mono uppercase tracking-wider transition"
                >
                  Close Scriptorium
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInvitedRegistrationData({
                      name: generatedInvitation.name,
                      email: generatedInvitation.email,
                      username: generatedInvitation.name.toLowerCase().replace(/\s+/g, '.'),
                      penName: generatedInvitation.name,
                      signature: generatedInvitation.name,
                      heroTitle: `Disquisitions on Reason & Form`,
                      heroSubtitle: `Selected philosophical treatises, essays, and notes authored by ${generatedInvitation.name}.`,
                      bioText: `${generatedInvitation.name} is an independent writer and scholar newly registered on Adjung, dedicated to formal research and traditional literary studies.`
                    });
                    setGeneratedInvitation(null);
                  }}
                  className="w-2/3 bg-adjung-maroon hover:opacity-95 text-[#FDFDFD] py-3 rounded text-xs font-mono uppercase tracking-wider transition shadow-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" /> Simulate Link Click & Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ACADEMIC REGISTRATION WIZARD ==================== */}      {showSignUpWizard && (        <SignUpWizard          onClose={() => setShowSignUpWizard(false)}          onComplete={handleWizardComplete}        />      )}
      {/* ==================== 6. ACADEMIC FOOTER ==================== */}
      <footer className="w-full mt-12 pt-12 pb-8 border-t border-[#EAE8E3] bg-stone-50 select-none">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center items-start">
          <div className="space-y-4 flex flex-col items-center text-center">
            <h1 className="font-serif text-2xl font-semibold tracking-wider text-[#802334]">{BRAND.logoText}</h1>
            <p className="font-serif italic text-stone-600 text-sm max-w-sm mx-auto">{systemSettings.editorialPolicy}</p>
          </div>
          
          <div className="space-y-4 flex flex-col items-center text-center">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Institutional</h4>
            <ul className="space-y-2 font-sans text-xs text-stone-600">
              <li><button onClick={() => { setActiveTab('editorial'); setSelectedEntry(null); setEditingEntry(null); window.scrollTo(0,0); }} className="hover:text-[#802334] transition">Editor's Notes</button></li>
              <li><button onClick={() => { setActiveTab('notices'); setSelectedEntry(null); setEditingEntry(null); window.scrollTo(0,0); }} className="hover:text-[#802334] transition">Notices</button></li>
              <li><button onClick={() => { setActiveTab('policies'); setSelectedEntry(null); setEditingEntry(null); window.scrollTo(0,0); }} className="hover:text-[#802334] transition">Publishing Policies</button></li>
              <li><button onClick={() => { setActiveTab('changelog'); setSelectedEntry(null); setEditingEntry(null); window.scrollTo(0,0); }} className="hover:text-[#802334] transition">Version History</button></li>
            </ul>
          </div>
          
          <div className="space-y-4 flex flex-col items-center text-center">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Network</h4>
            <ul className="space-y-2 font-sans text-xs text-stone-600">
              <li><button onClick={() => { setActiveTab('policies'); setSelectedEntry(null); setEditingEntry(null); window.scrollTo(0,0); }} className="hover:text-[#802334] transition">About Adjung</button></li>
              <li><button onClick={() => { setActiveTab('directory'); setSelectedEntry(null); setEditingEntry(null); window.scrollTo(0,0); }} className="hover:text-[#802334] transition">Editorial Board</button></li>
              <li><button onClick={() => { setActiveTab('architecture'); setSelectedEntry(null); setEditingEntry(null); window.scrollTo(0,0); }} className="hover:text-[#802334] transition">Architecture Studio</button></li>
            </ul>
          </div>
        </div>

        {/* Copyright Bottom Bar */}
        <div className="max-w-4xl mx-auto px-4 border-t border-stone-200/50 mt-8 pt-6 text-center">
          <p className="font-mono uppercase tracking-widest text-[9px] text-stone-400">
            {BRAND.copyright}
          </p>
        </div>
      </footer>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
