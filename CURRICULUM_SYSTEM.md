# CURRICULUM_SYSTEM.md

## Purpose

This file defines the curriculum upload system.

The curriculum system prepares the platform for future Gemini AI reports.

---

## Final Decision

In MVP:
- Only admin can upload curriculum files.

Users who can upload:
- Admin only

Users who can view:
- Admin
- Related tutor/student only when assigned

---

## MVP Scope

Build only:
- Admin upload UI
- File storage
- Subject selection
- Grade selection
- Curriculum title
- File management list
- Ability to link curriculum to subject and grade

Do not build AI analysis in MVP.

---

## Supported Files

Allowed:
- PDF
- DOCX
- Images if needed

Recommended primary format:
- PDF

---

## Required Table

### curriculum_files

Fields:
- id
- uploaded_by_admin_id
- title
- subject
- grade_level
- curriculum
- file_url
- file_type
- file_size
- is_active
- created_at
- updated_at

---

## Future Phase 2 Usage

Gemini may use uploaded curriculum files to:
- Compare lesson coverage
- Identify completed topics
- Identify missing concepts
- Evaluate student understanding
- Recommend homework
- Generate parent reports

This is not part of MVP.

---

## Admin Page

Add to admin area:

Route:
- /admin/curriculum

Actions:
- Upload curriculum file
- Edit title/subject/grade
- Deactivate file
- View uploaded files

---

## Security

- Only admins can upload.
- Files are not public.
- Access must be permission-controlled.
- Do not expose storage secrets to frontend.
