import { Book, Category } from './types';

// Helper to extract Drive ID
export const getDriveId = (url: string): string | null => {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/, // Standard /file/d/ID
    /id=([a-zA-Z0-9_-]+)/,          // Query param id=ID
    /\/open\?id=([a-zA-Z0-9_-]+)/   // /open?id=ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// Helper to convert various Google Drive links to an embeddable Preview link for iframes
export const getEmbedUrl = (url: string): string => {
  const id = getDriveId(url);
  if (id) {
    return `https://drive.google.com/file/d/${id}/preview`;
  }
  return url;
};

// Helper to get the standard download link
export const getGoogleDriveDownloadLink = (url: string): string | null => {
  const id = getDriveId(url);
  if (id) {
    return `https://drive.google.com/uc?export=download&id=${id}`;
  }
  return null;
};

// Helper to get a CORS-proxied URL for the PDF viewer
// Using CodeTabs proxy which is robust for PDF binary redirects
export const getProxiedPdfUrl = (url: string): string | null => {
  const downloadUrl = getGoogleDriveDownloadLink(url);
  if (!downloadUrl) return null;
  return `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(downloadUrl)}`;
};

// Updated: Removed Class 11 & 12 (length reduced to 10), Renamed Admission
export const CLASSES: Category[] = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `class-${i + 1}`,
    label: `শ্রেণী ${['১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯', '১০'][i]}`,
    value: (i + 1).toString(),
  })),
  { id: 'admission', label: 'কলেজ ও ভর্তি প্রস্তুতি', value: 'admission' }
];

export const ADMISSION_CATEGORIES = [
  { id: 'textbook', label: '📚 মূল বই' },
  { id: 'highlighted', label: '📝 দাগানো বই' },
  { id: 'concept', label: '💡 কনসেপ্ট বুক' },
  { id: 'question_bank', label: '❓ প্রশ্নব্যাংক' },
];

// Mock Database with Bangla Content
export const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: 'গণিত পার্ট ১',
    subject: 'গণিত',
    classLevel: '10',
    thumbnailUrl: 'https://picsum.photos/300/400?random=1',
    pdfUrl: 'https://drive.google.com/file/d/1XefvptuYY3rRelUfTBB73D5RByvfSBt4/view', 
    description: 'দশম শ্রেণীর শিক্ষার্থীদের জন্য বীজগণিত এবং জ্যামিতির মৌলিক ধারণা।',
  },
  {
    id: '2',
    title: 'পদার্থবিজ্ঞান: গতির সূত্র',
    subject: 'বিজ্ঞান',
    classLevel: '9',
    thumbnailUrl: 'https://picsum.photos/300/400?random=2',
    pdfUrl: 'https://drive.google.com/file/d/115s4TYw-7mzDj2A4Ml755FKH1sScG41R/view',
    description: 'নিউটনের সূত্র এবং মৌলিক বলবিদ্যা বোঝা।',
  },
  {
    id: '3',
    title: 'ইতিহাস: ভারত ও সমসাময়িক বিশ্ব',
    subject: 'সামাজিক বিজ্ঞান',
    classLevel: '10',
    thumbnailUrl: 'https://picsum.photos/300/400?random=3',
    pdfUrl: 'https://drive.google.com/file/d/13QnZ6-57mN4A1KraWzpcKyLH8pKFXoWO/view', 
    description: 'শিল্প বিপ্লব এবং ভারতের জাতীয়তাবাদের গভীর আলোচনা।',
  },
  {
    id: '4',
    title: 'ইংলিশ বিহাইভ',
    subject: 'ইংরেজি',
    classLevel: '9',
    thumbnailUrl: 'https://picsum.photos/300/400?random=4',
    pdfUrl: 'https://drive.google.com/file/d/115s4TYw-7mzDj2A4Ml755FKH1sScG41R/view', 
    description: 'ইংরেজি সাহিত্যের পাঠ্যপুস্তক।',
  },
  {
    id: '5',
    title: 'রসায়ন: আমাদের চারপাশের পদার্থ',
    subject: 'বিজ্ঞান',
    classLevel: '9',
    thumbnailUrl: 'https://picsum.photos/300/400?random=5',
    pdfUrl: 'https://drive.google.com/file/d/1XefvptuYY3rRelUfTBB73D5RByvfSBt4/view',
  },
  {
    id: '6',
    title: 'জীববিজ্ঞান: জীবন প্রক্রিয়া',
    subject: 'বিজ্ঞান',
    classLevel: '10',
    thumbnailUrl: 'https://picsum.photos/300/400?random=6',
    pdfUrl: 'https://drive.google.com/file/d/115s4TYw-7mzDj2A4Ml755FKH1sScG41R/view',
  },
  {
    id: '7',
    title: 'পৌরনীতি: গণতান্ত্রিক রাজনীতি',
    subject: 'সামাজিক বিজ্ঞান',
    classLevel: '9',
    thumbnailUrl: 'https://picsum.photos/300/400?random=7',
    pdfUrl: 'https://drive.google.com/file/d/1XefvptuYY3rRelUfTBB73D5RByvfSBt4/view',
  },
  {
    id: '8',
    title: 'প্রাথমিক ব্যষ্টিক অর্থনীতি',
    subject: 'অর্থনীতি',
    classLevel: '11',
    thumbnailUrl: 'https://picsum.photos/300/400?random=8',
    pdfUrl: 'https://drive.google.com/file/d/115s4TYw-7mzDj2A4Ml755FKH1sScG41R/view',
  },
  {
    id: '9',
    title: 'ব্যবসায় শিক্ষা পার্ট ১',
    subject: 'ব্যবসায়',
    classLevel: '12',
    thumbnailUrl: 'https://picsum.photos/300/400?random=9',
    pdfUrl: 'https://drive.google.com/file/d/1XefvptuYY3rRelUfTBB73D5RByvfSBt4/view',
  },
  {
    id: '10',
    title: 'গণিত মজা',
    subject: 'গণিত',
    classLevel: '1',
    thumbnailUrl: 'https://picsum.photos/300/400?random=10',
    pdfUrl: 'https://drive.google.com/file/d/115s4TYw-7mzDj2A4Ml755FKH1sScG41R/view',
  },
  {
    id: '11',
    title: 'পদার্থবিজ্ঞান কনসেপ্ট বুক',
    subject: 'পদার্থবিজ্ঞান',
    classLevel: 'admission',
    subCategory: 'concept',
    thumbnailUrl: 'https://picsum.photos/300/400?random=11',
    pdfUrl: 'https://drive.google.com/file/d/115s4TYw-7mzDj2A4Ml755FKH1sScG41R/view',
    description: 'বিশ্ববিদ্যালয় ভর্তির জন্য পদার্থবিজ্ঞান কনসেপ্ট বুক',
  }
];