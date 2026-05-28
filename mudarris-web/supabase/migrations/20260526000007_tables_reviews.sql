-- ============================================================
-- Migration: 007_tables_reviews
-- Description: Tutor reviews (one per completed, paid booking)
--
-- Rules:
--   - Only students with completed paid lessons can review
--   - Exactly one review per booking (UNIQUE on booking_id)
--   - No anonymous reviews
--   - Tutor rating recalculated by trigger on INSERT/DELETE
--   - Immutable once submitted (no UPDATE from client)
-- Reversible: YES
-- ============================================================

CREATE TABLE reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  student_id UUID NOT NULL REFERENCES students(id),
  tutor_id   UUID NOT NULL REFERENCES tutors(id),
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment_ar TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  reviews IS 'One review per completed booking. Server action validates booking is completed+paid before allowing insert.';
COMMENT ON COLUMN reviews.rating IS '1–5 stars. Tutor rating average recalculated by trigger on INSERT/DELETE.';
COMMENT ON COLUMN reviews.is_visible IS 'Admin can hide a review (is_visible=false). Hidden reviews excluded from rating average.';

CREATE INDEX idx_reviews_tutor_id   ON reviews(tutor_id);
CREATE INDEX idx_reviews_student_id ON reviews(student_id);
CREATE INDEX idx_reviews_visible    ON reviews(tutor_id) WHERE is_visible = true;

-- ============================================================
-- ROLLBACK:
-- DROP INDEX IF EXISTS idx_reviews_visible;
-- DROP INDEX IF EXISTS idx_reviews_student_id;
-- DROP INDEX IF EXISTS idx_reviews_tutor_id;
-- DROP TABLE IF EXISTS reviews;
-- ============================================================
