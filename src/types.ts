export interface SlideContent {
  title: string;
  points: string[];
  imagePrompt?: string;
  imageUrl?: string;
}

export interface PresentationData {
  userName: string;
  rollNumber: string;
  collegeName: string;
  topic: string;
  slides: SlideContent[];
  customLogoUrl?: string;
}

export interface GeneratorSettings {
  userName: string;
  rollNumber: string;
  collegeName: string;
  topic: string;
  slideLimit: number;
  customPrompt: string;
  showLogo: boolean;
  customLogoUrl?: string;
  autoGenerateImages: boolean;
  preUploadedImages?: string[];
}
