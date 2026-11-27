-- Resumes are uploaded as Word files (.docx) so they can be tailored without changing their design.
-- Existing PDFs keep working for viewing.
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
where id = 'resumes';
