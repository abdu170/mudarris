# AI_SESSION_REPORTS.md

## Status

This feature is Phase 2 only.

Do not build this in MVP.

---

## Purpose

After an online Merithub lesson ends, the platform may generate an AI learning report using Gemini.

The report is sent to:
- Parent
- Student
- Tutor

---

## Current Stage Rule

In the current MVP:
- Do NOT implement Gemini integration
- Do NOT implement recording analysis
- Do NOT implement AI-generated reports
- Do NOT implement automated parent reports
- Do NOT implement transcription pipelines

Only prepare architecture references if needed.

---

## Future Flow

1. Online lesson happens through Merithub.
2. Recording is created only if consent is approved.
3. Recording is retrieved after session ends.
4. Recording is uploaded to Gemini.
5. Gemini analyzes the lesson.
6. Gemini compares the lesson with uploaded curriculum references.
7. A structured Arabic report is generated.
8. Report is saved in database.
9. Report is emailed to parent, student, and tutor.

---

## Consent Rules

Recording and AI analysis require explicit consent from:
- Tutor
- Student
- Parent if student is under 18

If consent is missing:
- Do not record
- Do not upload to Gemini
- Do not generate report

---

## Report Content

The report should include:
- What the student understood well
- What the student struggled with
- Topics covered
- Topics not covered
- Missing concepts
- Recommended next steps
- Suggested homework
- Parent-friendly summary
- Tutor notes

---

## Safety Rules

Reports must:
- Use educational language only
- Avoid medical or psychological diagnosis
- Avoid labels like lazy or weak
- Be constructive and supportive
- Be in Arabic

---

## Database Tables For Phase 2

### session_recordings
- id
- booking_id
- merithub_session_id
- recording_url
- consent_status
- processing_status
- created_at

### ai_session_reports
- id
- booking_id
- student_id
- tutor_id
- curriculum_file_ids
- report_json
- report_text_ar
- gemini_file_id
- generated_at
- sent_to_parent
- sent_to_student
- sent_to_tutor
