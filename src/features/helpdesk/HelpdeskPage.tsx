import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, HelpCircle, Book, AlertTriangle, Clock, MapPin, 
  ChevronRight, FileText, GraduationCap, Building, Users, 
  CalendarDays, Download, UserCircle, Briefcase, CreditCard, Laptop, UserCheck, MessageCircle 
} from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

import ROUTINES from '@/data/routines.json';

// --- DATA ---
const BUS_ROUTES = [
  { id: 1, name: "Bus-1", route: "Baipail > Chandra > Nobinagar > C&B > Campus", reverseRoute: "Campus > C&B > Nobinagar > Chandra > Baipail" },
  { id: 2, name: "Bus-2", route: "Savar > Akrain > Campus", reverseRoute: "Campus > Akrain > Savar" },
  { id: 3, name: "Bus-3", route: "Asuliya > Charabug > Campus", reverseRoute: "Campus > Charabug > Asuliya" },
  { id: 4, name: "Bus-4", route: "Uttara North > Uttara Center > Biruliya > Akrain > Campus", reverseRoute: "Campus > Akrain > Biruliya > Uttara Center > Uttara North" },
  { id: 5, name: "Bus-5", route: "Mirpur-10 > Mirpur-2 > Mirpur-1 > Biruliya > Campus", reverseRoute: "Campus > Biruliya > Mirpur-1 > Mirpur-2 > Mirpur-10" },
];

const BUS_TIMES = [
  { label: "Morning", time: "07:30", type: "forward" },
  { label: "Noon", time: "13:00", type: "reverse" },
  { label: "Afternoon", time: "16:30", type: "reverse" }
];

const FAQS = [
  { category: "Academic", question: "What is the course drop or retake policy?", answer: "You can drop a course within the first two weeks of the semester. The retake fee is ৳1500 per credit. You must clear this fee before the mid-term exams." },
  { category: "Academic", question: "What is the academic probation policy?", answer: "If your CGPA falls below 2.00, you will be placed on academic probation. You will be restricted to a maximum of 9 credits in the following semester until your CGPA improves." },
  { category: "Academic", question: "How can I change my department?", answer: "Department change is only allowed within the first two weeks of your first semester, subject to seat availability and approval from both Department Heads." },
  { category: "Exam", question: "When and how do I get my admit card?", answer: "Admit cards are available on the student portal 3 days before exams begin. You must ensure all semester dues are paid to download the admit card." },
  { category: "Exam", question: "What should I do if my exam hall is changed at the last minute?", answer: "Check the Urgent Notice banner on the Dashboard. Volunteers and admins will also announce hall changes via the portal notifications." },
  { category: "Library", question: "How many books can I borrow at a time?", answer: "Students can borrow up to 3 books at a time for 14 days. A late fee of ৳10 per day applies for overdue books." },
  { category: "Library", question: "What are the standard library hours?", answer: "The central library is open from 8:00 AM to 8:00 PM on weekdays, and 9:00 AM to 5:00 PM on Saturdays. It is closed on Sundays and public holidays." },
  { category: "Attendance", question: "What happens if my attendance is below 70%?", answer: "You will not be allowed to sit for the final examination without special permission from the Head of the Department and paying a non-collegiate fee." },
  { category: "Discipline", question: "What is the official dress code?", answer: "Students must wear their ID cards visibly at all times and adhere to the formal or semi-formal dress code as outlined in the student handbook." },
  { category: "Administration", question: "Where is the accounts office located?", answer: "The accounts office is located on the ground floor of Building A. It is open from 9 AM to 4 PM (Sunday-Thursday)." },
  { category: "Administration", question: "How do I pay my semester fees?", answer: "Semester fees can be paid via bKash, Nagad, or directly at the accounts office desk. Always keep your transaction ID safe." },
  { category: "Administration", question: "How do I recover my student email password?", answer: "Contact the IT Helpdesk in Room 301, Building C, or submit an email recovery request via the IT support portal." },
];

const CATEGORIES = ["All", ...new Set(FAQS.map(f => f.category))];
const CAT_ICONS: any = {
  "Academic": GraduationCap,
  "Exam": FileText,
  "Library": Book,
  "Attendance": Clock,
  "Discipline": Users,
  "Administration": Building
};

const DIRECTORY = [
  { role: "Vice Chancellor (VC)", room: "Building A, Room 401", contact: "vc@cityu.edu.bd", icon: UserCircle },
  { role: "Pro Vice Chancellor", room: "Building A, Room 402", contact: "provc@cityu.edu.bd", icon: UserCircle },
  { role: "Registrar", room: "Building A, Room 205", contact: "registrar@cityu.edu.bd", icon: Briefcase },
  { role: "Deputy Registrar", room: "Building A, Room 206", contact: "deputy.reg@cityu.edu.bd", icon: Briefcase },
  { role: "Accounts Office", room: "Building A, Ground Floor", contact: "accounts@cityu.edu.bd", icon: CreditCard },
  { role: "Exam Control Room", room: "Building B, Room 102", contact: "exam@cityu.edu.bd", icon: FileText },
  { role: "IT Helpdesk", room: "Building C, Room 301", contact: "it.support@cityu.edu.bd", icon: Laptop },
];

const DEPT_HEADS: Record<string, { head: string, room: string }> = {
  "CSE": { head: "Prof. Dr. Safiqul Islam", room: "Building B, Room 501" },
  "EEE": { head: "Dr. Md. Abdur Rahman", room: "Building B, Room 402" },
  "ME": { head: "Prof. Dr. Jamal Uddin", room: "Building C, Room 105" },
  "Civil E": { head: "Dr. Syed Ishtiaq Ahmad", room: "Building C, Room 201" },
  "Eng": { head: "Prof. Farhana Haque", room: "Building A, Room 305" },
  "Law": { head: "Dr. Barrister Shafiqur Rahman", room: "Building A, Room 408" },
  "Agri": { head: "Prof. Dr. M. A. Rahim", room: "Building D, Room 102" },
  "Textile": { head: "Engr. A.K.M. Fazlul Hoque", room: "Building D, Room 304" },
};



const ALL_TEACHERS = Array.from(new Set(
  ROUTINES.flatMap(r => Object.values(r.teachers || {}))
)).filter(Boolean).sort();

const DYNAMIC_COUNSELING = ALL_TEACHERS.map((t, i) => {
   const days = [["Sun", "Tue"], ["Mon", "Wed"], ["Tue", "Thu"], ["Sun", "Mon"], ["Wed", "Thu"]];
   const times = ["10:00 AM - 11:30 AM", "11:00 AM - 12:30 PM", "01:00 PM - 02:30 PM", "02:00 PM - 03:30 PM", "02:30 PM - 04:00 PM"];
   return {
     id: t,
     name: String(t),
     hours: `${days[i % days.length].join(" & ")}: ${times[i % times.length]}`,
     room: `Room ${201 + (i % 50)}`
   };
});


const ADVISORS_DEPT: any = {
  "CSE": {
    "62": { "A": {name: "Prof. Dr. Safiqul Islam", room: "Room 501", email: "safiqul@cityu.edu.bd"}, "B": {name: "Prof. Dr. Safiqul Islam", room: "Room 501", email: "safiqul@cityu.edu.bd"} },
    "63": { "A": {name: "Dr. Md. Abdur Rahman", room: "Room 402", email: "arahman@cityu.edu.bd"}, "B": {name: "Dr. Md. Abdur Rahman", room: "Room 402", email: "arahman@cityu.edu.bd"} },
    "64": { "A": { name: "Nazneen Islam", room: "Room 517", email: "nazneen.cse@cityu.edu.bd" }, "B": { name: "Rafia Sultana", room: "Room 225", email: "rafia.cse@cityu.edu.bd" } },
    "65": { "A": { name: "Rafia Sultana", room: "Room 225", email: "rafia.cse@cityu.edu.bd" }, "B": { name: "Rafia Sultana", room: "Room 225", email: "rafia.cse@cityu.edu.bd" } },
    "66": { "A": { name: "Sraboni Ghosh Joya", room: "Room 228", email: "sraboni.cse@cityu.edu.bd" }, "B": { name: "Sraboni Ghosh Joya", room: "Room 228", email: "sraboni.cse@cityu.edu.bd" } },
    "67": { "A": { name: "Monoara Sultana", room: "Room 226", email: "monoara.cse@cityu.edu.bd" }, "B": { name: "Monoara Sultana", room: "Room 226", email: "monoara.cse@cityu.edu.bd" } },
    "68": { "A": { name: "Md. Showrov Hossen", room: "Room 226", email: "showrov.cse@cityu.edu.bd" }, "B": { name: "Md. Showrov Hossen", room: "Room 226", email: "showrov.cse@cityu.edu.bd" } },
    "69": { "A": { name: "Syed Ishtiaq Ahmad", room: "Room 201", email: "ishtiaq@cityu.edu.bd" }, "B": { name: "Syed Ishtiaq Ahmad", room: "Room 201", email: "ishtiaq@cityu.edu.bd" } }
  },
  "EEE": {
    "20": { "A": { name: "Dr. Abdur Rahman", room: "Room 402", email: "arahman.eee@cityu.edu.bd" } }
  }
};

const ADVISORS_BATCH: any = {
  "62": { name: "Prof. Dr. Safiqul Islam", room: "Room 501", email: "safiqul@cityu.edu.bd" },
  "63": { name: "Dr. Md. Abdur Rahman", room: "Room 402", email: "arahman@cityu.edu.bd" },
  "64": { name: "Nazneen Islam", room: "Room 517", email: "nazneen.cse@cityu.edu.bd" },
  "65": { name: "Rafia Sultana", room: "Room 225", email: "rafia.cse@cityu.edu.bd" },
  "66": { name: "Sraboni Ghosh Joya", room: "Room 228", email: "sraboni.cse@cityu.edu.bd" },
  "67": { name: "Monoara Sultana", room: "Room 226", email: "monoara.cse@cityu.edu.bd" },
  "68": { name: "Md. Showrov Hossen", room: "Room 226", email: "showrov.cse@cityu.edu.bd" },
  "69": { name: "Syed Ishtiaq Ahmad", room: "Room 201", email: "ishtiaq@cityu.edu.bd" }
};

/* old advisors removed */ 
const ADVISORS_REMOVED = {
  "CSE": {
    "64": { "A": { name: "Nazneen Islam", room: "Room 517", email: "nazneen.cse@cityu.edu.bd" }, "B": { name: "Rafia Sultana", room: "Room 225", email: "rafia.cse@cityu.edu.bd" } },
    "63": { "A": { name: "Sraboni Ghosh Joya", room: "Room 228", email: "sraboni.cse@cityu.edu.bd" }, "B": { name: "Monoara Sultana", room: "Room 226", email: "monoara.cse@cityu.edu.bd" } },
    "65": { "A": { name: "Md. Showrov Hossen", room: "Room 226", email: "showrov.cse@cityu.edu.bd" } }
  },
  "EEE": {
    "20": { "A": { name: "Dr. Abdur Rahman", room: "Room 402", email: "arahman.eee@cityu.edu.bd" } }
  }
};

const COUNSELING: any = {
  "CSE": [
    { id: "t1", name: "Nazneen Islam", hours: "Sun & Tue: 10:00 AM - 11:30 AM", room: "Room 517" },
    { id: "t2", name: "Rafia Sultana", hours: "Mon & Wed: 02:00 PM - 04:00 PM", room: "Room 225" },
    { id: "t3", name: "Sraboni Ghosh Joya", hours: "Tue & Thu: 11:00 AM - 01:00 PM", room: "Room 228" },
    { id: "t4", name: "Monoara Sultana", hours: "Wed & Thu: 01:00 PM - 03:00 PM", room: "Room 226" },
    { id: "t5", name: "Md. Showrov Hossen", hours: "Sun & Mon: 09:00 AM - 10:30 AM", room: "Room 226" }
  ],
  "EEE": [
    { id: "t6", name: "Dr. Abdur Rahman", hours: "Sun & Mon: 03:00 PM - 05:00 PM", room: "Room 402" }
  ]
};

const EXAM_CALENDAR = [
  { system: "Tri-Semester", term: "Fall 2026", type: "Mid-Term", date: "Oct 20 - Oct 28, 2026", status: "Ongoing" },
  { system: "Bi-Semester", term: "Fall 2026", type: "Mid-Term", date: "Nov 15 - Nov 25, 2026", status: "Upcoming" },
  { system: "Tri-Semester", term: "Fall 2026", type: "Final Exam", date: "Dec 05 - Dec 15, 2026", status: "Scheduled" },
  { system: "Bi-Semester", term: "Fall 2026", type: "Final Exam", date: "Jan 10 - Jan 22, 2027", status: "Scheduled" },
];

const BATCHES = [...new Set(ROUTINES.map(r => r.batch))].filter(b => b && b !== 'Unknown').sort((a,b) => Number(a) - Number(b));

const cleanTime = (t: string) => {
  const m = t.match(/(\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2})/);
  if (m) return m[1].replace(/\./g, ':');
  let cln = t.replace(/Subject Code Room No/ig, '').replace(/[()]/g, '').trim();
  if (cln.length > 25) cln = cln.substring(0, 25) + '...';
  return cln;
};

export const HelpdeskPage = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('routine');
  
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  const [selectedDept, setSelectedDept] = useState('CSE');

  const [advDept, setAdvDept] = useState('');
  const [advBatch, setAdvBatch] = useState('');
  const [advSection, setAdvSection] = useState('');
  
  const [counsDept, setCounsDept] = useState('');
  const [counsBatch, setCounsBatch] = useState('');
  const [counsSection, setCounsSection] = useState('');
  
  



  const [nextBusInfo, setNextBusInfo] = useState({ label: '', time: '', type: '', countdown: '', isTomorrow: false });

  const availableSections = [...new Set(ROUTINES.filter(r => r.batch === selectedBatch).map(r => r.section))].filter(Boolean).sort();
  const currentRoutine = ROUTINES.find(r => r.batch === selectedBatch && r.section === selectedSection);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      let nextTimeObj = null;
      let isTomorrow = false;

      for (let bt of BUS_TIMES) {
        const [h, m] = bt.time.split(':').map(Number);
        const busTimeMins = h * 60 + m;
        if (busTimeMins > currentTime) {
          nextTimeObj = { ...bt, minsTotal: busTimeMins };
          break;
        }
      }

      if (!nextTimeObj) {
        const [h, m] = BUS_TIMES[0].time.split(':').map(Number);
        nextTimeObj = { ...BUS_TIMES[0], minsTotal: h * 60 + m + (24 * 60) };
        isTomorrow = true;
      }

      const diffMins = nextTimeObj.minsTotal - currentTime;
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      
      const countdownStr = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;

      setNextBusInfo({
        label: nextTimeObj.label,
        time: nextTimeObj.time,
        type: nextTimeObj.type,
        countdown: countdownStr,
        isTomorrow
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredFaqs = FAQS.filter(f => {
    const matchesSearch = f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'All' || f.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[#062B5B] to-[#041B3A] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-400" /> Smart Helpdesk
          </h1>
          <p className="text-blue-100 mt-2 max-w-xl text-lg">Your single source of truth for Campus Rules, Schedules, Directories, and FAQs.</p>
        </div>
      </div>

      {/* Quick Access & Bus Timer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Next Bus Timer & Routes (3rd box replacement) */}
        <Card className="md:col-span-1 bg-card border-border shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Campus Transport
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="bg-muted p-4 rounded-xl shadow-inner mb-4 text-center">
              <p className="text-sm text-muted-foreground font-medium mb-1">
                Next Bus: {nextBusInfo.label} {nextBusInfo.isTomorrow && '(Tomorrow)'}
              </p>
              <div className="flex justify-center items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-foreground">{nextBusInfo.countdown}</span>
              </div>
              <div className="inline-flex items-center text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md">
                Departs at {nextBusInfo.time}
              </div>
            </div>
            
            <div className="mt-auto">
              <Accordion type="single" collapsible className="w-full border border-border rounded-lg bg-card">
                <AccordionItem value="routes" className="border-b-0">
                  <AccordionTrigger className="py-3 px-4 text-sm font-semibold hover:no-underline hover:bg-muted/50 rounded-lg">View All Bus Routes</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3 pt-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                      {BUS_ROUTES.map(bus => (
                        <div key={bus.id} className="text-xs space-y-1 p-2 bg-muted/50 rounded-lg border border-border/50">
                          <strong className="text-foreground text-sm">{bus.name}</strong>
                          <div className="text-muted-foreground"><span className="font-semibold text-foreground">Morn:</span> {bus.route}</div>
                          <div className="text-muted-foreground"><span className="font-semibold text-foreground">Noon:</span> {bus.reverseRoute}</div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>
        </Card>

        
        {/* Advising & Counseling (Fully functional replacing the 4 cards) */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
          
          
          {/* Find Batch Advisor */}
          <Card className="bg-card border-border shadow-sm flex flex-col h-full">
            <CardHeader className="bg-muted/30 pb-3 pt-4 border-b border-border">
              <CardTitle className="text-sm font-bold flex items-center gap-2"><Users className="w-4 h-4 text-blue-600"/> Find Batch Advisor</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col flex-1">
              <div className="flex gap-2 mb-4">
                <Select value={advDept} onValueChange={(val) => { setAdvDept(val); setAdvBatch(''); setAdvSection(''); }}>
                  <SelectTrigger className="bg-background flex-1 h-8 text-xs"><SelectValue placeholder="Dept" /></SelectTrigger>
                  <SelectContent>{Object.keys(ADVISORS_DEPT).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={advBatch} onValueChange={(val) => { setAdvBatch(val); setAdvSection(''); }} disabled={!advDept}>
                  <SelectTrigger className="bg-background flex-1 h-8 text-xs"><SelectValue placeholder="Batch" /></SelectTrigger>
                  <SelectContent>{advDept && ADVISORS_DEPT[advDept] && Object.keys(ADVISORS_DEPT[advDept]).map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={advSection} onValueChange={setAdvSection} disabled={!advBatch}>
                  <SelectTrigger className="bg-background flex-1 h-8 text-xs"><SelectValue placeholder="Sec" /></SelectTrigger>
                  <SelectContent>{advBatch && ADVISORS_DEPT[advDept][advBatch] && Object.keys(ADVISORS_DEPT[advDept][advBatch]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              
              {advDept && advBatch && advSection && ADVISORS_DEPT[advDept][advBatch][advSection] ? (
                <div className="flex flex-col gap-2 bg-muted/20 p-3 rounded-lg border border-border shadow-sm mt-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{ADVISORS_DEPT[advDept][advBatch][advSection].name}</p>
                      <p className="text-xs text-muted-foreground">{ADVISORS_DEPT[advDept][advBatch][advSection].email}</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center text-xs font-semibold bg-primary/10 text-primary px-2 py-1.5 rounded w-fit mt-1">
                    <MapPin className="w-3 h-3 mr-1" /> {ADVISORS_DEPT[advDept][advBatch][advSection].room}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground/50 py-4 mt-auto">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Select Dept, Batch, Sec</p>
                </div>
              )}
            </CardContent>
          </Card>

          
          {/* Find Counseling Hours */}
          <Card className="bg-card border-border shadow-sm flex flex-col h-full">
            <CardHeader className="bg-primary/5 pb-3 pt-4 border-b border-border">
              <CardTitle className="text-sm font-bold flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary"/> Teachers Counseling</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col flex-1">
              <div className="flex gap-2 mb-4">
                <Select value={counsDept} onValueChange={(val) => { setCounsDept(val); setCounsBatch(''); setCounsSection(''); }}>
                  <SelectTrigger className="bg-background flex-1 h-8 text-xs"><SelectValue placeholder="Dept" /></SelectTrigger>
                  <SelectContent>{Object.keys(ADVISORS_DEPT).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={counsBatch} onValueChange={(val) => { setCounsBatch(val); setCounsSection(''); }} disabled={!counsDept}>
                  <SelectTrigger className="bg-background flex-1 h-8 text-xs"><SelectValue placeholder="Batch" /></SelectTrigger>
                  <SelectContent>{counsDept === 'CSE' ? BATCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>) : <SelectItem value="20">20</SelectItem>}</SelectContent>
                </Select>
                <Select value={counsSection} onValueChange={setCounsSection} disabled={!counsBatch}>
                  <SelectTrigger className="bg-background flex-1 h-8 text-xs"><SelectValue placeholder="Sec" /></SelectTrigger>
                  <SelectContent>{counsBatch ? ['A','B','C'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>) : []}</SelectContent>
                </Select>
              </div>
              
              {counsDept && counsBatch && counsSection ? (
                <div className="flex-1 overflow-y-auto max-h-[140px] custom-scrollbar pr-1 space-y-2 mt-auto">
                  {(() => {
                    if (counsDept !== 'CSE') return <p className="text-xs text-center text-muted-foreground py-4">No routines found for this dept.</p>;
                    const r = ROUTINES.find(rt => rt.batch === counsBatch && rt.section === counsSection);
                    if (!r) return <p className="text-xs text-center text-muted-foreground py-4">No teachers mapped for this section.</p>;
                    const techIds = Array.from(new Set(Object.values(r.teachers || {}))).filter(Boolean);
                    if (techIds.length === 0) return <p className="text-xs text-center text-muted-foreground py-4">No teachers mapped.</p>;
                    
                    return techIds.map((tName: any, idx) => {
                      const tInfo = DYNAMIC_COUNSELING.find((tc:any) => tc.name === tName);
                      if(!tInfo) return null;
                      return (
                        <div key={idx} className="flex flex-col bg-primary/5 p-2.5 rounded-lg border border-primary/20 shadow-sm">
                          <p className="font-bold text-foreground text-[13px] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" /> {tInfo.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                              {tInfo.hours}
                            </p>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                              {tInfo.room}
                            </span>
                          </div>
                        </div>
                      )
                    });
                  })()}
                </div>
              ) : (
                <div className="text-center text-muted-foreground/50 py-4 mt-auto">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Select Dept, Batch, Sec</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Main Tabs Section */}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full pt-4">
        <div className="flex justify-center mb-8 overflow-x-auto pb-2">
          <TabsList className="bg-muted p-1.5 rounded-xl h-auto flex gap-2 w-full max-w-3xl justify-between">
            <TabsTrigger value="routine" className="flex-1 rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground text-sm font-semibold transition-all">Smart Routine</TabsTrigger>
            <TabsTrigger value="directory" className="flex-1 rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground text-sm font-semibold transition-all">Campus Directory</TabsTrigger>
            <TabsTrigger value="academics" className="flex-1 rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground text-sm font-semibold transition-all">Academics & Exams</TabsTrigger>
            
            <TabsTrigger value="faq" className="flex-1 rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground text-sm font-semibold transition-all">FAQ & Rules</TabsTrigger>
          </TabsList>
        </div>

        {/* 0. SMART ROUTINE */}
        <TabsContent value="routine" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2"><CalendarDays className="w-6 h-6 text-primary" /> Smart Routine Scraper</h2>
              <p className="text-muted-foreground mt-1">Live data scraped directly from University Drive links.</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Select value={selectedBatch} onValueChange={(val) => { setSelectedBatch(val); setSelectedSection(''); }}>
                <SelectTrigger className="w-full md:w-[150px] bg-background">
                  <SelectValue placeholder="Select Batch" />
                </SelectTrigger>
                <SelectContent>
                  {BATCHES.map(b => <SelectItem key={b} value={b}>Batch {b}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedBatch}>
                <SelectTrigger className="w-full md:w-[150px] bg-background">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!currentRoutine ? (
            <Card className="rounded-2xl border-dashed border-2 border-border bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <CalendarDays className="w-16 h-16 mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-foreground">No Routine Selected</h3>
                <p className="mt-2 text-sm text-muted-foreground">Please select your Batch and Section above to view your scraped schedule.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].map(day => {
                const dayClasses = (currentRoutine.schedule as any)[day] || [];
                if (dayClasses.length === 0) return null;
                return (
                  <Card key={day} className="rounded-xl overflow-hidden shadow-sm border-border">
                    <CardHeader className="bg-muted pb-3 pt-4 border-b border-border">
                      <CardTitle className="text-lg font-bold text-foreground">{day}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 bg-card">
                      <div className="divide-y divide-border">
                        {dayClasses.map((cls: any, idx: number) => {
                          const cleanT = cleanTime(cls.time);
                          return (
                            <div key={idx} className="p-4 hover:bg-muted/50 transition-colors flex flex-col md:flex-row md:items-center gap-4">
                              <div className="w-44 flex-shrink-0">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-semibold whitespace-nowrap">
                                  <Clock className="w-4 h-4" /> {cleanT}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-base text-foreground">{cls.course || cls.raw}</h4>
                                <div className="flex flex-wrap items-center gap-4 mt-2">
                                  {cls.teacher && (
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
                                      <UserCircle className="w-4 h-4 opacity-70" /> {(currentRoutine.teachers as any)[cls.teacher] || cls.teacher}
                                    </span>
                                  )}
                                  {cls.room && (
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
                                      <MapPin className="w-4 h-4 opacity-70" /> Room: {cls.room}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 1. CAMPUS DIRECTORY */}
        <TabsContent value="directory" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h2 className="text-2xl font-bold mb-2">Important Campus Contacts</h2>
            <p className="text-muted-foreground mb-6">Find room numbers and contact emails for essential administration.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DIRECTORY.map((contact, i) => (
                <Card key={i} className="rounded-xl border-border hover:border-primary/50 transition-colors shadow-sm bg-card">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 flex-shrink-0">
                      <contact.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm leading-tight">{contact.role}</h3>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground font-medium">
                        <MapPin className="w-3.5 h-3.5" /> {contact.room}
                      </div>
                      <div className="text-xs text-primary mt-1 font-medium hover:underline cursor-pointer">
                        {contact.contact}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Department Heads</h2>
                <p className="text-muted-foreground text-sm">Select a department to view the Head's room details.</p>
              </div>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Select Dept" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(DEPT_HEADS).map(dept => (
                    <SelectItem key={dept} value={dept}>{dept} Department</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="rounded-xl border-border shadow-sm bg-card overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-6 p-6">
                  <div className="p-4 rounded-full bg-primary/10">
                    <GraduationCap className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Head of {selectedDept}
                    </h3>
                    <p className="text-xl font-bold text-foreground mb-2">{DEPT_HEADS[selectedDept].head}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" /> {DEPT_HEADS[selectedDept].room}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. ACADEMICS & EXAMS */}
        <TabsContent value="academics" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="rounded-2xl border-border shadow-sm overflow-hidden h-fit max-w-4xl mx-auto bg-card">
            <CardHeader className="bg-muted pb-4 pt-5 border-b border-border text-center">
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                <CalendarDays className="w-6 h-6 text-primary" /> Official Exam Calendar
              </CardTitle>
              <CardDescription>Upcoming Mid-Terms & Finals for all systems</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {EXAM_CALENDAR.map((exam, i) => (
                  <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-muted/30 transition-colors gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-base text-foreground">{exam.system}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded">{exam.term}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{exam.type}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3"/> {exam.date}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${exam.status === 'Ongoing' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                        {exam.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        
        {/* 3. FAQ & RULES */}
        <TabsContent value="faq" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Policy & Rulebook</h2>
              <p className="text-muted-foreground mt-1">Search through official university guidelines.</p>
            </div>
            <div className="relative w-full sm:w-72 shadow-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search rules (e.g. 'Admit card')" 
                className="pl-9 bg-background"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map(cat => (
              <Button 
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setActiveCategory(cat)}
                className="rounded-full shadow-sm"
              >
                {cat}
              </Button>
            ))}
          </div>

          <Card className="rounded-2xl border-border shadow-sm bg-card">
            <CardContent className="p-3">
              {filteredFaqs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq, idx) => {
                    const Icon = CAT_ICONS[faq.category] || HelpCircle;
                    return (
                      <AccordionItem value={`item-${idx}`} key={idx} className="border-b border-border last:border-0">
                        <AccordionTrigger className="hover:bg-muted/50 px-4 py-4 rounded-xl text-left transition-colors">
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-primary" />
                            <span className="font-semibold text-[15px] text-foreground">{faq.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-5 pt-1 text-muted-foreground leading-relaxed text-[15px]">
                          <div className="pl-8 border-l-2 border-primary/20 ml-2">
                            {faq.answer}
                            <div className="mt-3 inline-flex items-center text-[11px] uppercase tracking-wider font-bold bg-muted text-muted-foreground px-2.5 py-1 rounded-full border border-border">
                              {faq.category}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-foreground font-medium text-lg">No rules found matching "{search}"</p>
                  <p className="text-muted-foreground text-sm mt-1">Try searching with a different keyword</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};
