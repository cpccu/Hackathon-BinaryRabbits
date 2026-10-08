import { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'cr' | 'club_executive' | 'faculty' | 'admin' | 'event_manager' | 'resource_manager' | 'complaint_manager' | 'notice_manager';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  studentId?: string;
  department?: string;
  batch?: string;
  section?: string;
  role: UserRole;
  avatarUrl?: string;
  followedClubIds: string[];
  savedEventIds: string[];
  savedResourceIds: string[];
  createdAt?: Timestamp;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  logoUrl?: string;
  leadUserId?: string;
  executiveIds: string[];
  createdAt: Timestamp;
}

export type EventType = 'contest' | 'workshop' | 'seminar' | 'cultural' | 'sports' | 'other';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface CampusEvent {
  id: string;
  clubId: string;
  title: string;
  description: string;
  bannerUrl?: string;
  venue: string;
  startTime: Timestamp;
  endTime: Timestamp;
  capacity?: number;
  isPayable?: boolean;
  ticketPrice?: number;
  registrationDeadline?: Timestamp;
  eventType: EventType;
  status: EventStatus;
  tags: string[];
  createdBy: string;
  createdAt: Timestamp;
}

export type AttendanceStatus = 'registered' | 'attended' | 'cancelled';

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  qrToken: string;
  attendanceStatus: AttendanceStatus;
  checkedInAt?: Timestamp;
  registeredAt: Timestamp;
}

export type AcademicSystem = 'bi-semester' | 'tri-semester';

export interface Course {
  id: string;
  departmentId: string;
  systemType: AcademicSystem;
  levelTerm: string;
  courseCode: string;
  title: string;
}

export type ResourceCategory = 'pyq' | 'slide' | 'lab' | 'note' | 'syllabus' | 'notice' | 'question_paper';
export type SessionName = 'spring' | 'summer' | 'fall';
export type ExamType = 'midterm' | 'final';

export interface Resource {
  id: string;
  courseId: string;
  department: string;
  semester: string;
  courseCode: string;
  uploaderId: string;
  category: ResourceCategory;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  verifiedById?: string;
  isVerified: boolean;
  upvoteCount: number;
  upvotedBy: string[];
  tags: string[];
  createdAt: Timestamp;
}

export interface PYQMetadata {
  id: string;
  resourceId: string;
  courseId: string;
  sessionYear: number;
  sessionName: SessionName;
  examType: ExamType;
}

export type BusDirection = 'to_campus' | 'from_campus';

export interface BusRoute {
  id: string;
  routeName: string;
  startingPoint: string;
  destination: string;
  stops: string[];
}

export interface BusSchedule {
  id: string;
  routeId: string;
  departureTime: string;
  direction: BusDirection;
  operatingDays: string[];
}

export interface CampusPolicy {
  id: string;
  category: string;
  topicTitle: string;
  contentBody: string;
  lastUpdated: Timestamp;
}

export type NoticeSeverity = 'critical' | 'warning' | 'info';

export interface UrgentNotice {
  id: string;
  title: string;
  message: string;
  severity: NoticeSeverity;
  activeUntil: any;
  
  createdBy: string;
  createdAt: Timestamp;
}

export type LostFoundType = 'lost' | 'found';
export type LostFoundStatus = 'active' | 'claimed' | 'resolved';
export type LostFoundCategory = 'electronics' | 'id_card' | 'documents' | 'personal_accessories' | 'bags' | 'other';

export interface LostFoundItem {
  id: string;
  userId: string;
  userName?: string;
  itemType: LostFoundType;
  title: string;
  category: LostFoundCategory;
  description: string;
  privateDetails?: string;
  contactInfo?: string;
  photoUrl?: string;
  locationTag: string;
  incidentDate: Timestamp;
  status: LostFoundStatus;
  createdAt: Timestamp;
}

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface OwnershipClaim {
  id: string;
  itemId: string;
  claimantId: string;
  claimantName?: string;
  proofDescription: string;
  status: ClaimStatus;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: Timestamp;
}

export type ComplaintStatus = 'submitted' | 'under_review' | 'action_taken' | 'resolved';
export type ComplaintCategory = 'academic' | 'transport' | 'facility' | 'administration' | 'other';

export interface StatusUpdate {
  status: ComplaintStatus;
  note?: string;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface Complaint {
  id: string;
  trackingCode: string;
  studentId?: string;
  isAnonymous: boolean;
  category: ComplaintCategory;
  subject: string;
  description: string;
  location?: string;
  attachmentUrl?: string;
  status: ComplaintStatus;
  adminResponse?: string;
  statusHistory: StatusUpdate[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type NotificationType =
  | 'event_registration'
  | 'event_reminder'
  | 'event_update'
  | 'resource_verified'
  | 'complaint_update'
  | 'claim_update'
  | 'campus_notice'
  | 'general';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Timestamp;
}
