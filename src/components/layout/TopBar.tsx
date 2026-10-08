import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, Calendar, BookOpen, MessageSquare, HelpCircle, Search as SearchIcon, Check, CheckCircle2 } from 'lucide-react';
import { MobileDrawer } from './MobileDrawer';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';


const SEARCH_DATA = [
  // Pages
  { type: 'page', title: "Dashboard", desc: "Overview of your campus", path: "/dashboard", icon: Menu },
  { type: 'page', title: "Events", desc: "Browse upcoming events", path: "/events", icon: Calendar },
  { type: 'page', title: "Resource Hub", desc: "Academic resources & links", path: "/resources", icon: BookOpen },
  { type: 'page', title: "Helpdesk", path: "/helpdesk", desc: "Routines, Directory, Rules", icon: HelpCircle },
  { type: 'page', title: "Lost & Found", path: "/lost-found", desc: "Report or find items", icon: SearchIcon },
  { type: 'page', title: "Complaint Center", path: "/complaints", desc: "Submit or view complaints", icon: MessageSquare },
  
  // Events
  { type: 'event', title: "National Hackathon 2026", desc: "Participate in the biggest tech event", path: "/events", icon: Calendar },
  { type: 'event', title: "AI & Robotics Workshop", desc: "Building intelligent robots", path: "/events", icon: Calendar },
  { type: 'event', title: "Inter-department Cricket", desc: "Annual sports competition", path: "/events", icon: Calendar },

  // Lost & Found
  { type: 'lost', title: "Found: Black Leather Wallet", desc: "Found near Building C cafeteria", path: "/lost-found", icon: SearchIcon },
  { type: 'lost', title: "Lost: Student ID Card (Batch 64)", desc: "Lost around the library", path: "/lost-found", icon: SearchIcon },
  { type: 'lost', title: "Found: Casio Scientific Calculator", desc: "Found in Room 501", path: "/lost-found", icon: SearchIcon },

  // FAQs & Info
  { type: 'faq', title: "Course Drop or Retake Policy", desc: "Retake fee is ৳1500 per credit", path: "/helpdesk", icon: HelpCircle },
  { type: 'faq', title: "Academic Probation Policy", desc: "Rules for CGPA below 2.00", path: "/helpdesk", icon: HelpCircle },
  { type: 'faq', title: "Library Operating Hours", desc: "8:00 AM to 8:00 PM (Weekdays)", path: "/helpdesk", icon: BookOpen },
  { type: 'faq', title: "Exam Admit Card Details", desc: "How to download admit card", path: "/helpdesk", icon: CheckCircle2 }
];


const INITIAL_NOTIFICATIONS = [
  { id: 1, title: "Exam Routine Published", desc: "Fall 2026 Mid-term routine is now available.", time: "10 min ago", read: false },
  { id: 2, title: "Bus Schedule Change", desc: "Bus-2 afternoon departure changed to 4:30 PM.", time: "1 hour ago", read: false },
  { id: 3, title: "Complaint Under Review", desc: "Your recent cafeteria complaint is being reviewed.", time: "2 days ago", read: true }
];

export const TopBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Search State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;


  useEffect(() => {
    const q = query(collection(db, 'notices'), where('activeUntil', '>', new Date().toISOString()));
    const unsub = onSnapshot(q, (snapshot: any) => {
      const fetched = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          desc: data.message,
          time: new Date(data.createdAt || Date.now()).toLocaleDateString(),
          // Default all to unread unless stored locally, but for demo we can just check if it's new
          // A robust way requires saving read status per user, but let's mock the read state locally
          read: false
        };
      });
      // Sort newest first
      fetched.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
      
      // Preserve read state from existing notifications state if we wanted, 
      // but for simplicity let's just use localStorage for read notice IDs
      const readNoticeIds = JSON.parse(localStorage.getItem('cu_read_notices') || '[]');
      const finalNotices = fetched.map((n: any) => ({
        ...n,
        read: readNoticeIds.includes(n.id)
      }));
      
      setNotifications(finalNotices);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredSearch = SEARCH_DATA.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.desc.toLowerCase().includes(searchQuery.toLowerCase()));
  const searchGroups = { 'Pages': filteredSearch.filter(i=>i.type==='page'), 'Events': filteredSearch.filter(i=>i.type==='event'), 'Lost & Found': filteredSearch.filter(i=>i.type==='lost'), 'FAQ & Rules': filteredSearch.filter(i=>i.type==='faq') };

  const handleNavigate = (path: string) => {
    setSearchOpen(false);
    navigate(path);
    setSearchQuery("");
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const existing = JSON.parse(localStorage.getItem('cu_read_notices') || '[]');
    localStorage.setItem('cu_read_notices', JSON.stringify([...new Set([...existing, ...allIds])]));
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string | number) => {
    const existing = JSON.parse(localStorage.getItem('cu_read_notices') || '[]');
    if (!existing.includes(id)) {
      existing.push(id);
      localStorage.setItem('cu_read_notices', JSON.stringify(existing));
    }
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <>
      <header className="h-16 border-b border-border bg-white dark:bg-[#0B1729] flex items-center justify-between px-4 lg:px-6 shrink-0 z-10 relative">
        
        <div className="flex items-center w-[20%] lg:w-1/4">
          <button 
            className="md:hidden mr-4 p-2 -ml-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        
        {/* Universal Search Trigger - CENTERED */}
        <div className="flex-1 flex justify-center px-2">
          <div className="max-w-xl w-full relative hidden sm:block group" onClick={() => setSearchOpen(true)}>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="w-full h-10 pl-9 pr-4 rounded-full border border-border bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/80 dark:hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors shadow-sm hover:shadow-md text-sm text-gray-600 dark:text-muted-foreground">
              <span className="truncate">Search events, items, rules, or pages...</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground shadow-sm">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end w-auto sm:w-[30%] lg:w-1/4 space-x-4">

          
          {/* Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 shadow-lg border-border">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-xs text-primary hover:text-primary/80 hover:bg-transparent">
                    Mark all as read
                  </Button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No notifications.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3 ${!n.read ? 'bg-primary/5' : ''}`}
                        onClick={() => markAsRead(n.id)}
                      >
                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                        <div className="flex-1 space-y-1">
                          <p className={`text-sm leading-none ${!n.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.desc}</p>
                          <p className="text-[10px] text-muted-foreground/70 font-medium">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="flex items-center space-x-3 pl-4 border-l border-border">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-none">{user?.name || 'Student'}</p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{user?.role || 'User'}</p>
            </div>
            
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden cursor-pointer border border-border shadow-sm" onClick={logout}>
              {(() => {
                try {
                  const saved = localStorage.getItem(`cu-profile-${user?.uid}`);
                  if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.avatarUrl) {
                      return <img src={parsed.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />;
                    }
                  }
                } catch(e) {}
                return user?.name?.charAt(0) || 'U';
              })()}
            </div>
          </div>
        </div>
      </header>
      
      <MobileDrawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      {/* Universal Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-background border-border shadow-2xl">
          <div className="flex items-center px-4 py-3 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground mr-3" />
            <input 
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground h-8"
              placeholder="Type a command or search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
          
          <div className="max-h-[350px] overflow-y-auto p-2 custom-scrollbar">
            {filteredSearch.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Search className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">No results found for "{searchQuery}"</p>
                <p className="text-xs mt-1 opacity-70">Try searching for events, lost items, or FAQs</p>
              </div>
            ) : (
              <div className="space-y-4 pb-2">
                {Object.entries(searchGroups).map(([groupName, items]) => {
                  if (items.length === 0) return null;
                  return (
                    <div key={groupName} className="space-y-1">
                      <p className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30 rounded-md mx-2">{groupName}</p>
                      {items.map((item, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleNavigate(item.path)}
                          className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors group"
                        >
                          <div className="p-2 rounded-md bg-muted group-hover:bg-primary/20 transition-colors">
                            <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1 flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{item.title}</span>
                            <span className="text-xs text-muted-foreground truncate">{item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>

      </Dialog>
    </>
  );
};
