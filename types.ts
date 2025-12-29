export interface Book {
  id: string;
  title: string;
  subject: string;
  classLevel: string; // e.g., "9", "10", "12", "admission"
  subCategory?: string; // 'textbook', 'highlighted', 'concept', 'question_bank'
  thumbnailUrl: string;
  pdfUrl: string; // The raw Google Drive link
  description?: string;
  publishYear?: string;
}

export interface Category {
  id: string;
  label: string;
  value: string; // The filter value for classLevel
}