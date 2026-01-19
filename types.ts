
export interface UploadedImage {
  id: string;
  url: string;
  file: File;
  aspectRatio: number;
}

export type AppStep = 'UPLOAD' | 'SUBSCRIBE' | 'ARRANGE' | 'DOWNLOAD';

export type LayoutMode = 'HORIZONTAL' | 'VERTICAL' | 'GRID';

export type LanguageCode = 'ar' | 'en' | 'fr' | 'zh' | 'ru' | 'ko' | 'ja' | 'es' | 'de' | 'pt';
