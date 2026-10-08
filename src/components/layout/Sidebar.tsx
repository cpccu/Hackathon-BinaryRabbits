import { useSidebar } from '@/hooks/useSidebar';
import { useAuth } from '@/hooks/useAuth';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, BookOpen, Bell, 
  Search, MessageSquare, User, Settings, LogOut,
  ChevronLeft, ChevronRight, Compass, HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: BookOpen, label: 'Resource Hub', path: '/resources' },
  { icon: HelpCircle, label: 'Helpdesk', path: '/helpdesk' },
  { icon: Search, label: 'Lost & Found', path: '/lost-found' },
  { icon: MessageSquare, label: 'Complaint Center', path: '/complaints' },
  { icon: User, label: 'My Profile', path: '/my-campus' },
];

export const Sidebar = () => {
  const { isCollapsed, toggle } = useSidebar();
  const { user, logout } = useAuth();

  const isEventManager = user?.role === 'event_manager' || user?.role === 'admin';

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      className="hidden md:flex flex-col bg-[#081225] h-full relative z-20 text-white border-r border-[#081225]"
    >
      <div className="flex items-center h-16 px-4 border-b border-white/5">
        <Link to="/dashboard" className="flex items-center">
          <div className="bg-white p-1 rounded-md flex-shrink-0 flex items-center justify-center"><img src="/cu-logo.png" alt="City Uni Logo" className="w-7 h-7 object-contain" /></div>
          {!isCollapsed && (
            <div className="ml-3 font-bold text-xl tracking-tight text-white flex items-center">
              <span className="font-bold text-xl tracking-wide text-white">CampusOS</span>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isEventManager = user?.role === 'event_manager';
          const isResourceManager = user?.role === 'resource_manager';
          const isComplaintManager = user?.role === 'complaint_manager';
          const isNoticeManager = user?.role === 'notice_manager';
          let isDisabled = false;
          if (isEventManager) isDisabled = true;
          else if (isResourceManager) isDisabled = item.path !== '/resources';
          else if (isComplaintManager) isDisabled = item.path !== '/complaints';
          else if (isNoticeManager) isDisabled = true;
          return (
            <div
              key={item.path}
              onClick={(e) => {
                if (isDisabled) e.preventDefault();
              }}
              className={cn(
                "relative group w-full",
                isDisabled ? "opacity-30 pointer-events-none grayscale" : ""
              )}
            >
              {isDisabled && (
                <div className="absolute inset-0 backdrop-blur-[1px] z-10 rounded-lg"></div>
              )}
              <NavLink
                to={isDisabled ? '#' : item.path}
                className={({ isActive }) => cn(
                  "flex items-center w-full",
                  !isDisabled && isActive 
                    ? "bg-[#1769E0] text-white shadow-sm font-medium px-3 h-11 rounded-lg" 
                    : "text-blue-100 hover:bg-white/10 hover:text-white font-medium px-3 h-11 rounded-lg"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isCollapsed ? "mx-auto" : "")} />
                {!isCollapsed && <span className="ml-3 whitespace-nowrap">{item.label}</span>}
              </NavLink>
            </div>
          );
        })}

        <div className="pt-6 mt-6 border-t border-white/5 space-y-1">
          <div className={cn("px-3 mb-2 text-xs font-semibold text-blue-200 uppercase tracking-wider", isCollapsed && "hidden")}>
            Quick Links
          </div>
          
          {isEventManager && (
            <NavLink
              to="/admin/events"
              className={({ isActive }) => cn(
                "flex items-center h-10 px-3 rounded-lg transition-colors group",
                isActive 
                  ? "bg-[#1769E0] text-white shadow-sm" 
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              )}
              title={isCollapsed ? "Manage Events" : undefined}
            >
              <Calendar className={cn("w-4 h-4 flex-shrink-0", isCollapsed ? "mx-auto" : "")} />
              {!isCollapsed && <span className="ml-3 text-sm whitespace-nowrap">Manage Events</span>}
            </NavLink>
          )}
          {user?.role === 'notice_manager' && (
            <NavLink
              to="/admin/notices"
              className={({ isActive }) => cn(
                "flex items-center h-10 px-3 rounded-lg transition-colors group",
                isActive 
                  ? "bg-[#1769E0] text-white shadow-sm" 
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              )}
              title={isCollapsed ? "Manage Notices" : undefined}
            >
              <Bell className={cn("w-4 h-4 flex-shrink-0", isCollapsed ? "mx-auto" : "")} />
              {!isCollapsed && <span className="ml-3 text-sm whitespace-nowrap">Manage Notices</span>}
            </NavLink>
          )}


          <NavLink
            to="/settings"
            className={({ isActive }) => cn(
              "flex items-center h-10 px-3 rounded-lg transition-colors group",
              isActive 
                ? "bg-[#1769E0] text-white shadow-sm" 
                : "text-blue-100 hover:bg-white/10 hover:text-white"
            )}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings className={cn("w-4 h-4 flex-shrink-0", isCollapsed ? "mx-auto" : "")} />
            {!isCollapsed && <span className="ml-3 text-sm whitespace-nowrap">Settings</span>}
          </NavLink>
          <button
            onClick={logout}
            className="w-full flex items-center h-10 px-3 rounded-lg transition-colors text-blue-100 hover:bg-white/10 hover:text-white"
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className={cn("w-4 h-4 flex-shrink-0", isCollapsed ? "mx-auto" : "")} />
            {!isCollapsed && <span className="ml-3 text-sm whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </nav>

      <button
        onClick={toggle}
        className="absolute -right-3 top-[54px] bg-[#081225] border border-white/10 rounded-full p-1 shadow-md hover:bg-[#112240] text-white"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
};
