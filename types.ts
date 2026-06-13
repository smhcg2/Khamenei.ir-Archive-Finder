
export interface ArchiveRecord {
  id: string;
  title: string;
  date: string;
  keySentence: string;
  mediaStatus: string;
  searchLink: string;
  timestamp?: string;
}

export interface SearchResult {
  records: ArchiveRecord[];
  summary?: {
    narrative: string;
    keyPoints: string[];
  };
  groundingLinks?: Array<{
    title: string;
    uri: string;
  }>;
}
