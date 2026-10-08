import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LogOut, User as UserIcon, Mail, IdCard, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout, resetPassword } = useAuth();
  
  // Notification States
  const [urgentNotices, setUrgentNotices] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [complaintUpdates, setComplaintUpdates] = useState(true);
  
  // Data Saver State (New operational function)
  const [dataSaver, setDataSaver] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const prefs = localStorage.getItem('cu-compass-prefs');
    if (prefs) {
      try {
        const parsed = JSON.parse(prefs);
        setUrgentNotices(parsed.urgentNotices ?? true);
        setEventReminders(parsed.eventReminders ?? true);
        setComplaintUpdates(parsed.complaintUpdates ?? true);
        setDataSaver(parsed.dataSaver ?? false);
      } catch(e) {}
    }
  }, []);

  const handleSave = () => {
    // Save to localStorage
    const prefs = {
      urgentNotices,
      eventReminders,
      complaintUpdates,
      dataSaver
    };
    localStorage.setItem('cu-compass-prefs', JSON.stringify(prefs));
    toast.success('Settings saved successfully');
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast.error('No email associated with this account.');
      return;
    }
    try {
      await resetPassword(user.email);
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (error: any) {
      toast.error('Failed to send reset email. ' + (error.message || ''));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your app preferences and account settings.</p>
      </div>

      <div className="space-y-6">
        
        {/* Profile Details (New operational function) */}
        {user && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Your personal information associated with CU Compass.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5 p-3 bg-muted/30 rounded-md border border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><UserIcon className="w-3 h-3"/> Full Name</span>
                <span className="font-semibold">{user.name}</span>
              </div>
              <div className="flex flex-col space-y-1.5 p-3 bg-muted/30 rounded-md border border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3"/> Email Address</span>
                <span className="font-semibold">{user.email}</span>
              </div>
              <div className="flex flex-col space-y-1.5 p-3 bg-muted/30 rounded-md border border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><IdCard className="w-3 h-3"/> Student/ID No</span>
                <span className="font-semibold">{user.studentId || 'N/A'}</span>
              </div>
              <div className="flex flex-col space-y-1.5 p-3 bg-muted/30 rounded-md border border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Role</span>
                <span className="font-semibold capitalize">{user.role}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how CU Compass looks on your device.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={theme} 
              onValueChange={(val: any) => setTheme(val)} 
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label htmlFor="light" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  Light
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label htmlFor="dark" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  Dark
                </Label>
              </div>
              <div>
                <RadioGroupItem value="system" id="system" className="peer sr-only" />
                <Label htmlFor="system" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  System
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Notifications & Preferences</CardTitle>
            <CardDescription>Choose what you want to be notified about.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="urgent-notices" className="flex flex-col space-y-1">
                <span>Urgent Campus Notices</span>
                <span className="font-normal text-sm text-muted-foreground">Receive alerts for critical university announcements.</span>
              </Label>
              <Switch id="urgent-notices" checked={urgentNotices} onCheckedChange={setUrgentNotices} />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="event-reminders" className="flex flex-col space-y-1">
                <span>Event Reminders</span>
                <span className="font-normal text-sm text-muted-foreground">Get reminded before your registered events start.</span>
              </Label>
              <Switch id="event-reminders" checked={eventReminders} onCheckedChange={setEventReminders} />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="complaint-updates" className="flex flex-col space-y-1">
                <span>Complaint Status Updates</span>
                <span className="font-normal text-sm text-muted-foreground">Know when action is taken on your complaints.</span>
              </Label>
              <Switch id="complaint-updates" checked={complaintUpdates} onCheckedChange={setComplaintUpdates} />
            </div>
            <div className="flex items-center justify-between space-x-2 pt-4 border-t border-border">
              <Label htmlFor="data-saver" className="flex flex-col space-y-1">
                <span>Data Saver Mode</span>
                <span className="font-normal text-sm text-muted-foreground">Compress images to save mobile data usage on campus.</span>
              </Label>
              <Switch id="data-saver" checked={dataSaver} onCheckedChange={setDataSaver} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full sm:w-auto border-border" onClick={handlePasswordReset}>
              Change Password
            </Button>
            <div className="pt-4 border-t border-border">
              <Button variant="destructive" className="w-full sm:w-auto" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave}>Save Preferences</Button>
        </div>
      </div>
    </div>
  );
}
