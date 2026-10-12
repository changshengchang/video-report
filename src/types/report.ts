export type DetailLevel = 'simple' | 'medium' | 'detailed';

export type ColorTheme = 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'violet';

export interface KeyTakeaway {
  badge: string;
  point: string;
  color: string;
}

export interface SceneSlide {
  id: string;
  slideNumber: number;
  title: string;
  timestamp: string;
  timestampSeconds?: number;
  caption: string;
  analysis: string;
  keyHighlights: string[];
  colorTheme: ColorTheme;
  imageUrl?: string; // Data URL or external image URL
}

export interface VideoReport {
  id: string;
  topic: string;
  subtitle: string;
  category: string;
  detailLevel: DetailLevel;
  detailLevelName: string;
  summary: string;
  keyTakeaways: KeyTakeaway[];
  scenes: SceneSlide[];
  conclusion: string;
  createdAt: string;
  videoSourceType: 'file' | 'url' | 'sample';
  videoName?: string;
  videoUrl?: string;
  videoDuration?: number;
}

export interface TopicSuggestion {
  title: string;
  subtitle: string;
  angle: string;
  recommendedColors: string;
}
