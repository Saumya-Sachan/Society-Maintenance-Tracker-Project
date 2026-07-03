DROP POLICY IF EXISTS "History: authenticated inserts" ON public.complaint_history;

CREATE POLICY "History: authenticated inserts"
ON public.complaint_history
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = actor_id
  AND (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_id AND c.resident_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  )
);