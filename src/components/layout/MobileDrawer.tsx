import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, Calendar, BookOpen, HelpCircle, 
  Search, MessageSquare, User, Settings, LogOut, Compass
} from 'lucide-react';
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

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileDrawer = ({ open, onOpenChange }: MobileDrawerProps) => {
  const { logout } = useAuth();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col bg-background">
        <SheetHeader className="p-4 border-b border-border text-left">
          <div className="flex items-center space-x-2">
            <div className="bg-white p-1 rounded-md flex-shrink-0 flex items-center justify-center"><img src="/cu-logo.png" alt="City Uni Logo" className="w-6 h-6 object-contain" /></div>
            <SheetTitle className="text-xl font-bold">CampusOS</SheetTitle>
          </div>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onOpenChange(false)}
              className={({ isActive }) => cn(
                "flex items-center h-10 px-3 rounded-md transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
          <div className="pt-4 mt-4 border-t border-border space-y-1">
            <NavLink
              to="/settings"
              onClick={() => onOpenChange(false)}
              className={({ isActive }) => cn(
                "flex items-center h-10 px-3 rounded-md transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Settings className="w-5 h-5 mr-3" />
              <span className="font-medium">Settings</span>
            </NavLink>
            <button
              onClick={() => { logout(); onOpenChange(false); }}
              className="w-full flex items-center h-10 px-3 rounded-md transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
