export interface RoamConfig {
  apiToken: string;
  graphName: string;
  dailyNoteFormat?: string;
  defaultTimeout?: number;
}

export interface RoamBlock {
  uid: string;
  string: string;
  children?: RoamBlock[];
  order?: number;
  refs?: string[];
  heading?: number;
  'view-type'?: 'bullet' | 'numbered' | 'document';
  'text-align'?: 'left' | 'center' | 'right' | 'justify';
}

export interface RoamPage {
  uid: string;
  title: string;
  children?: RoamBlock[];
  time?: number;
  'edit-time'?: number;
  'edit-email'?: string;
}

export interface SearchResult {
  uid: string;
  string?: string;
  title?: string;
  time?: number;
  'edit-time'?: number;
  refs?: string[];
}

export interface TodoItem {
  uid: string;
  string: string;
  todo: boolean;
  done?: boolean;
  page?: string;
  parent?: string;
}