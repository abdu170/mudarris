/* ============================================================
   MOCK DATA — Bookings, Wallet, Messages, Admin
   Replace with Supabase queries in Claude Code stage
   ============================================================ */

/* ── Bookings ─────────────────────────────────────────── */
export type BookingStatus =
  | "requested" | "accepted" | "payment_pending"
  | "paid" | "confirmed" | "completed"
  | "cancelled" | "rejected" | "disputed";

export type TeachingMode = "online" | "in-person" | "both";

export interface MockBooking {
  id: string;
  tutorName: string;
  tutorAvatar: string | null;
  studentName: string;
  studentAvatar: string | null;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  teachingMode: TeachingMode;
  status: BookingStatus;
  price: number;
  area?: string;
  merithubLink?: string;
  aiReportStatus?: "pending" | "processing" | "completed" | "failed" | null;
}

export const MOCK_BOOKINGS_STUDENT: MockBooking[] = [
  {
    id: "b1",
    tutorName: "د. طارق محمود",
    tutorAvatar: null,
    studentName: "أحمد الكعبي",
    studentAvatar: null,
    subject: "رياضيات",
    date: "2026-06-01",
    startTime: "16:00",
    endTime: "17:00",
    teachingMode: "online",
    status: "confirmed",
    price: 250,
    merithubLink: "https://merithub.com/session/abc123",
    aiReportStatus: null,
  },
  {
    id: "b2",
    tutorName: "أ. سارة الخالد",
    tutorAvatar: null,
    studentName: "أحمد الكعبي",
    studentAvatar: null,
    subject: "لغة إنجليزية",
    date: "2026-06-03",
    startTime: "18:00",
    endTime: "19:00",
    teachingMode: "online",
    status: "payment_pending",
    price: 200,
    aiReportStatus: null,
  },
  {
    id: "b3",
    tutorName: "أ. نورة السليم",
    tutorAvatar: null,
    studentName: "أحمد الكعبي",
    studentAvatar: null,
    subject: "رياضيات",
    date: "2026-05-20",
    startTime: "15:00",
    endTime: "16:00",
    teachingMode: "in-person",
    status: "completed",
    price: 150,
    area: "الدوحة",
    aiReportStatus: "completed",
  },
  {
    id: "b4",
    tutorName: "أ. محمد العلي",
    tutorAvatar: null,
    studentName: "أحمد الكعبي",
    studentAvatar: null,
    subject: "كيمياء",
    date: "2026-05-15",
    startTime: "17:00",
    endTime: "18:00",
    teachingMode: "in-person",
    status: "cancelled",
    price: 180,
    area: "الريان",
  },
];

export const MOCK_BOOKINGS_TUTOR: MockBooking[] = [
  {
    id: "bt1",
    tutorName: "د. طارق محمود",
    tutorAvatar: null,
    studentName: "سلمى الجبر",
    studentAvatar: null,
    subject: "رياضيات",
    date: "2026-06-01",
    startTime: "14:00",
    endTime: "15:00",
    teachingMode: "online",
    status: "requested",
    price: 250,
  },
  {
    id: "bt2",
    tutorName: "د. طارق محمود",
    tutorAvatar: null,
    studentName: "عمر الشمري",
    studentAvatar: null,
    subject: "فيزياء",
    date: "2026-06-02",
    startTime: "16:00",
    endTime: "17:00",
    teachingMode: "in-person",
    status: "accepted",
    price: 250,
    area: "الدوحة",
  },
  {
    id: "bt3",
    tutorName: "د. طارق محمود",
    tutorAvatar: null,
    studentName: "ليلى المنصور",
    studentAvatar: null,
    subject: "رياضيات",
    date: "2026-05-25",
    startTime: "15:00",
    endTime: "16:00",
    teachingMode: "online",
    status: "completed",
    price: 250,
    aiReportStatus: "processing",
  },
];

/* ── Wallet ──────────────────────────────────────────── */
export interface MockTransaction {
  id: string;
  type: "payment" | "refund" | "withdrawal" | "credit";
  description: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
}

export const MOCK_STUDENT_WALLET = {
  balance: 320,
  credits: 50,
  transactions: [
    { id: "tx1", type: "payment" as const, description: "حجز درس رياضيات", amount: -250, date: "2026-05-20", status: "completed" as const },
    { id: "tx2", type: "refund"  as const, description: "استرداد درس ملغي",  amount: 180,  date: "2026-05-15", status: "completed" as const },
    { id: "tx3", type: "credit"  as const, description: "رصيد ترحيبي",       amount: 50,   date: "2026-05-01", status: "completed" as const },
  ] satisfies MockTransaction[],
};

export const MOCK_TUTOR_WALLET = {
  availableBalance: 1840,
  pendingBalance: 250,
  transactions: [
    { id: "tx1", type: "payment"    as const, description: "حصة رياضيات — سلمى الجبر",  amount: 212,  date: "2026-05-25", status: "completed" as const },
    { id: "tx2", type: "payment"    as const, description: "حصة فيزياء — عمر الشمري",    amount: 212,  date: "2026-05-20", status: "completed" as const },
    { id: "tx3", type: "withdrawal" as const, description: "طلب سحب",                     amount: -500, date: "2026-05-10", status: "completed" as const },
  ] satisfies MockTransaction[],
};

/* ── Messages ────────────────────────────────────────── */
export interface MockConversation {
  id: string;
  participantName: string;
  participantAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface MockMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
  type: "sent" | "received" | "system";
}

export const MOCK_CONVERSATIONS: MockConversation[] = [
  { id: "c1", participantName: "د. طارق محمود", participantAvatar: null, lastMessage: "هل موعد غد مناسب؟", lastMessageTime: "10:30 ص", unreadCount: 2 },
  { id: "c2", participantName: "أ. سارة الخالد", participantAvatar: null, lastMessage: "شكراً على الحصة الممتازة", lastMessageTime: "أمس", unreadCount: 0 },
];

export const MOCK_MESSAGES: MockMessage[] = [
  { id: "m1", conversationId: "c1", senderId: "tutor", text: "مرحباً، أنا مدرس الرياضيات. هل تريد حجز موعد؟", timestamp: "09:00 ص", type: "received" },
  { id: "m2", conversationId: "c1", senderId: "student", text: "نعم، أريد درساً في التفاضل والتكامل.", timestamp: "09:15 ص", type: "sent" },
  { id: "m3", conversationId: "c1", senderId: "tutor", text: "ممتاز! هل موعد غد الساعة 4 مناسب؟", timestamp: "10:30 ص", type: "received" },
];

/* ── Admin Data ──────────────────────────────────────── */
export const MOCK_ADMIN_STATS = {
  totalTutors: 48,
  pendingApprovals: 7,
  totalStudents: 312,
  totalBookings: 891,
  totalPayments: 223750,
  pendingWithdrawals: 3,
};

export interface MockPendingTutor {
  id: string;
  displayName: string;
  subjects: string[];
  submittedAt: string;
  documents: string[];
  status: "pending" | "approved" | "rejected";
}

export const MOCK_PENDING_TUTORS: MockPendingTutor[] = [
  { id: "pt1", displayName: "أ. ماجد الحربي",   subjects: ["رياضيات"], submittedAt: "2026-05-25", documents: ["هوية", "شهادة"], status: "pending" },
  { id: "pt2", displayName: "أ. هيفاء السبيعي", subjects: ["علوم"],    submittedAt: "2026-05-24", documents: ["هوية", "شهادة"], status: "pending" },
  { id: "pt3", displayName: "أ. بدر العتيبي",   subjects: ["إنجليزي"], submittedAt: "2026-05-23", documents: ["هوية"],          status: "pending" },
];

export interface MockWithdrawal {
  id: string;
  tutorName: string;
  amount: number;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  bankInfo: string;
}

export const MOCK_WITHDRAWALS: MockWithdrawal[] = [
  { id: "w1", tutorName: "د. طارق محمود", amount: 500,  requestedAt: "2026-05-25", status: "pending", bankInfo: "HSBC **** 4521" },
  { id: "w2", tutorName: "أ. سارة الخالد", amount: 300, requestedAt: "2026-05-24", status: "pending", bankInfo: "QNB **** 8833" },
];
