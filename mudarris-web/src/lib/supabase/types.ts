// Generated manually to match supabase/migrations/
// Regenerate with: npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = "student" | "tutor" | "admin";
export type TutorStatus = "pending" | "approved" | "rejected" | "suspended";
export type BookingStatus =
  | "requested"
  | "accepted"
  | "payment_pending"
  | "paid"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected"
  | "disputed";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "refunded"
  | "partially_refunded";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "processing" | "completed";
export type TeachingMode = "online" | "in_person" | "both";
export type ReportStatus = "no_report" | "pending" | "processing" | "completed" | "failed";
export type MessageStatus = "sent" | "delivered" | "read";
export type RecordingProcessingStatus =
  | "not_started"
  | "pending"
  | "processing"
  | "completed"
  | "failed";
export type ViolationType = "phone_number" | "email" | "whatsapp" | "telegram" | "external_payment";
export type WalletTransactionType =
  | "credit_pending"
  | "credit_available"
  | "debit_withdrawal"
  | "debit_refund";
export type UserReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

// ─── Table Row Types (must be `type`, not `interface`, to satisfy Record<string, unknown>) ──

export type UserRow = {
  id: string;
  role: UserRole;
  full_name_ar: string;
  full_name_en: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentRow = {
  id: string;
  date_of_birth: string | null;
  grade_level: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  guardian_relation: string | null;
  recording_consent_given_at: string | null;
  ai_analysis_consent_given_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TutorRow = {
  id: string;
  status: TutorStatus;
  display_name_ar: string | null;
  bio_ar: string | null;
  subjects: string[];
  grade_levels: string[];
  teaching_modes: TeachingMode[];
  areas: string[];
  hourly_rate: number;
  rating: number;
  review_count: number;
  is_visible: boolean;
  years_experience: number | null;
  education: string | null;
  rejection_reason: string | null;
  rejected_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TutorDocumentRow = {
  id: string;
  tutor_id: string;
  document_type: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
};

export type CurriculumFileRow = {
  id: string;
  uploaded_by_admin_id: string;
  title: string;
  subject: string;
  grade_level: string;
  curriculum: string;
  term: string;
  unit: string;
  lesson_title: string;
  storage_path: string;
  file_type: string;
  file_size: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TutorWeeklyScheduleRow = {
  id: string;
  tutor_id: string;
  day_of_week: number; // 0=Sunday … 6=Saturday
  start_time: string;  // "HH:MM:SS"
  end_time: string;
  teaching_mode: TeachingMode;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TutorUnavailableBlockRow = {
  id: string;
  tutor_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingRow = {
  id: string;
  student_id: string;
  tutor_id: string;
  status: BookingStatus;
  teaching_mode: TeachingMode;
  scheduled_at: string;
  ends_at: string;
  notes: string | null;
  tutor_rate: number;
  platform_fee: number;
  tutor_earning: number;
  in_person_area: string | null;
  recording_consent: boolean;
  ai_analysis_consent: boolean;
  curriculum_file_id: string | null;
  lesson_unit: string | null;
  lesson_title_ref: string | null;
  accepted_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentRow = {
  id: string;
  booking_id: string;
  student_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  tap_charge_id: string | null;
  tap_checkout_url: string | null;
  webhook_received_at: string | null;
  refund_amount: number | null;
  refunded_at: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
};

export type WalletAccountRow = {
  id: string;
  tutor_id: string;
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  created_at: string;
  updated_at: string;
};

export type WalletTransactionRow = {
  id: string;
  wallet_id: string;
  booking_id: string | null;
  withdrawal_id: string | null;
  type: WalletTransactionType;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
};

export type WithdrawalRequestRow = {
  id: string;
  tutor_id: string;
  wallet_id: string;
  amount: number;
  status: WithdrawalStatus;
  bank_name: string;
  iban: string;
  account_holder_name: string;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ConversationRow = {
  id: string;
  booking_id: string | null;
  student_id: string;
  tutor_id: string;
  last_message_at: string | null;
  student_last_read_at: string | null;
  tutor_last_read_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  status: MessageStatus;
  is_flagged: boolean;
  hidden_by_admin: boolean;
  hidden_at: string | null;
  hidden_by: string | null;
  created_at: string;
};

export type UserReportRow = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  message_id: string | null;
  conversation_id: string | null;
  reason: string;
  status: UserReportStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageViolationRow = {
  id: string;
  message_id: string;
  conversation_id: string;
  sender_id: string;
  violation_type: ViolationType;
  matched_pattern: string;
  created_at: string;
};

export type ReviewRow = {
  id: string;
  booking_id: string;
  student_id: string;
  tutor_id: string;
  rating: number;
  comment_ar: string | null;
  is_visible: boolean;
  created_at: string;
};

export type MerithubSessionRow = {
  id: string;
  booking_id: string;
  merithub_session_id: string;
  student_join_url: string;
  tutor_join_url: string;
  recording_url: string | null;
  session_started_at: string | null;
  session_ended_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionRecordingRow = {
  id: string;
  booking_id: string;
  merithub_session_id: string | null;
  recording_url: string | null;
  duration_seconds: number | null;
  processing_status: RecordingProcessingStatus;
  consent_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AiSessionReportRow = {
  id: string;
  booking_id: string;
  recording_id: string | null;
  status: ReportStatus;
  report_json: Json | null;
  report_text_ar: string | null;
  generated_at: string | null;
  error_message: string | null;
  emailed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LessonCurriculumLinkRow = {
  id: string;
  booking_id: string;
  curriculum_file_id: string;
  unit: string | null;
  lesson_title: string | null;
  linked_at: string;
};

export type AdminAuditLogRow = {
  id: string;
  admin_id: string;
  action_type: string;
  target_entity: string;
  target_entity_id: string;
  metadata: Json | null;
  created_at: string;
};

export type PlatformSettingRow = {
  key: string;
  value: string;
  updated_by: string | null;
  updated_at: string;
};

// ─── Insert Types (omit server-set fields) ────────────────────────────────────

export type InsertBooking = {
  student_id: string;
  tutor_id: string;
  status: BookingStatus;
  teaching_mode: TeachingMode;
  scheduled_at: string;
  ends_at: string;
  tutor_rate: number;
  platform_fee: number;
  tutor_earning: number;
  notes?: string | null;
  in_person_area?: string | null;
  recording_consent?: boolean;
  ai_analysis_consent?: boolean;
  curriculum_file_id?: string | null;
  lesson_unit?: string | null;
  lesson_title_ref?: string | null;
  accepted_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  rejected_at?: string | null;
  rejected_reason?: string | null;
  completed_at?: string | null;
};
export type InsertWithdrawalRequest = Pick<
  WithdrawalRequestRow,
  "tutor_id" | "wallet_id" | "amount" | "bank_name" | "iban" | "account_holder_name"
>;
export type InsertConversation = Pick<ConversationRow, "student_id" | "tutor_id" | "booking_id">;
export type InsertMessage = Pick<MessageRow, "conversation_id" | "sender_id" | "content"> & {
  is_flagged?: boolean;
};
export type InsertUserReport = Pick<
  UserReportRow,
  "reporter_id" | "reported_user_id" | "message_id" | "conversation_id" | "reason"
>;
export type InsertAdminAuditLog = Pick<
  AdminAuditLogRow,
  "admin_id" | "action_type" | "target_entity" | "target_entity_id" | "metadata"
>;

// ─── Supabase Database type (for createClient generics) ───────────────────────
// Row types must be `type` (not `interface`) to satisfy Record<string, unknown> constraint.
// All tables include Relationships: [] to satisfy GenericTable.
// Immutable tables use Update: Record<string, never> (prevents updates while satisfying GenericTable).

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: Partial<UserRow>;
        Update: Partial<UserRow>;
        Relationships: [];
      };
      students: {
        Row: StudentRow;
        Insert: Partial<StudentRow>;
        Update: Partial<StudentRow>;
        Relationships: [];
      };
      tutors: {
        Row: TutorRow;
        Insert: Partial<TutorRow>;
        Update: Partial<TutorRow>;
        Relationships: [];
      };
      tutor_documents: {
        Row: TutorDocumentRow;
        Insert: Omit<TutorDocumentRow, "id" | "created_at" | "is_verified" | "verified_by" | "verified_at">;
        Update: Partial<TutorDocumentRow>;
        Relationships: [];
      };
      curriculum_files: {
        Row: CurriculumFileRow;
        Insert: Omit<CurriculumFileRow, "id" | "created_at" | "updated_at">;
        Update: Partial<CurriculumFileRow>;
        Relationships: [];
      };
      tutor_weekly_schedules: {
        Row: TutorWeeklyScheduleRow;
        Insert: Omit<TutorWeeklyScheduleRow, "id" | "created_at" | "updated_at">;
        Update: Partial<TutorWeeklyScheduleRow>;
        Relationships: [];
      };
      tutor_unavailable_blocks: {
        Row: TutorUnavailableBlockRow;
        Insert: Omit<TutorUnavailableBlockRow, "id" | "created_at" | "updated_at">;
        Update: Partial<TutorUnavailableBlockRow>;
        Relationships: [];
      };
      bookings: {
        Row: BookingRow;
        Insert: InsertBooking;
        Update: Partial<BookingRow>;
        Relationships: [];
      };
      payments: {
        Row: PaymentRow;
        Insert: Partial<PaymentRow>;
        Update: Partial<PaymentRow>;
        Relationships: [];
      };
      wallet_accounts: {
        Row: WalletAccountRow;
        Insert: Partial<WalletAccountRow>;
        Update: Partial<WalletAccountRow>;
        Relationships: [];
      };
      wallet_transactions: {
        Row: WalletTransactionRow;
        Insert: Omit<WalletTransactionRow, "id" | "created_at">;
        Update: Record<string, never>;
        Relationships: [];
      };
      withdrawal_requests: {
        Row: WithdrawalRequestRow;
        Insert: InsertWithdrawalRequest;
        Update: Partial<WithdrawalRequestRow>;
        Relationships: [];
      };
      conversations: {
        Row: ConversationRow;
        Insert: InsertConversation;
        Update: Partial<ConversationRow>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: InsertMessage;
        Update: Partial<MessageRow>;
        Relationships: [];
      };
      user_reports: {
        Row: UserReportRow;
        Insert: InsertUserReport;
        Update: Partial<UserReportRow>;
        Relationships: [];
      };
      message_violations: {
        Row: MessageViolationRow;
        Insert: Omit<MessageViolationRow, "id" | "created_at">;
        Update: Record<string, never>;
        Relationships: [];
      };
      reviews: {
        Row: ReviewRow;
        Insert: Omit<ReviewRow, "id" | "created_at">;
        Update: Record<string, never>;
        Relationships: [];
      };
      merithub_sessions: {
        Row: MerithubSessionRow;
        Insert: Partial<MerithubSessionRow>;
        Update: Partial<MerithubSessionRow>;
        Relationships: [];
      };
      session_recordings: {
        Row: SessionRecordingRow;
        Insert: Partial<SessionRecordingRow>;
        Update: Partial<SessionRecordingRow>;
        Relationships: [];
      };
      ai_session_reports: {
        Row: AiSessionReportRow;
        Insert: Partial<AiSessionReportRow>;
        Update: Partial<AiSessionReportRow>;
        Relationships: [];
      };
      lesson_curriculum_links: {
        Row: LessonCurriculumLinkRow;
        Insert: Omit<LessonCurriculumLinkRow, "id" | "linked_at">;
        Update: Record<string, never>;
        Relationships: [];
      };
      admin_audit_logs: {
        Row: AdminAuditLogRow;
        Insert: InsertAdminAuditLog;
        Update: Record<string, never>;
        Relationships: [];
      };
      platform_settings: {
        Row: PlatformSettingRow;
        Insert: Omit<PlatformSettingRow, "updated_at">;
        Update: Partial<PlatformSettingRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      check_booking_conflict: {
        Args: {
          p_tutor_id: string;
          p_scheduled_at: string;
          p_ends_at: string;
        };
        Returns: boolean;
      };
      get_tutor_available_slots: {
        Args: {
          p_tutor_id: string;
          p_week_start: string; // DATE as ISO string "YYYY-MM-DD"
        };
        Returns: {
          slot_start: string;
          slot_end: string;
          teaching_mode: TeachingMode;
        }[];
      };
      get_admin_stats: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_commission_pct: {
        Args: Record<string, never>;
        Returns: number;
      };
      ensure_wallet_exists: {
        Args: { p_tutor_id: string };
        Returns: string;
      };
      process_payment_succeeded: {
        Args: {
          p_payment_id: string;
          p_tap_charge_id: string;
          p_tap_payload: Json;
        };
        Returns: void;
      };
      complete_booking_release_earnings: {
        Args: { p_booking_id: string; p_admin_id: string };
        Returns: void;
      };
      create_withdrawal_request: {
        Args: {
          p_tutor_id: string;
          p_amount: number;
          p_bank_name: string;
          p_iban: string;
          p_account_holder_name: string;
        };
        Returns: string;
      };
      admin_approve_withdrawal: {
        Args: { p_withdrawal_id: string; p_admin_id: string };
        Returns: void;
      };
      admin_reject_withdrawal: {
        Args: { p_withdrawal_id: string; p_admin_id: string; p_note?: string };
        Returns: void;
      };
      create_merithub_session_record: {
        Args: {
          p_booking_id: string;
          p_merithub_session_id: string;
          p_student_join_url: string;
          p_tutor_join_url: string;
        };
        Returns: { session_id: string; already_existed: boolean }[];
      };
      current_user_role: { Args: Record<string, never>; Returns: string };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      tutor_status: TutorStatus;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      withdrawal_status: WithdrawalStatus;
      teaching_mode: TeachingMode;
      report_status: ReportStatus;
      message_status: MessageStatus;
      user_report_status: UserReportStatus;
    };
  };
};
