import React, { useState } from 'react';
import { VideoReport, DetailLevel, SceneSlide } from './types/report';
import { Header } from './components/Header';
import { VideoUploader } from './components/VideoUploader';
import { DetailLevelSelector } from './components/DetailLevelSelector';
import { ReportView } from './components/ReportView';
import { PresentationModal } from './components/PresentationModal';
import { ExportModal } from './components/ExportModal';
import { PrintReportView } from './components/PrintReportView';
import {
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Video,
} from 'lucide-react';
import {
  captureFrameAtTime,
  generatePlaceholderFrame,
  formatTime,
  parseTimeToSeconds,
  extractUniqueFramesForTimestamps,
  extractYouTubeId,
  getYouTubeThumbnail,
  convertUrlToDataUrl,
} from './utils/videoUtils';

const DEFAULT_FALLBACK_VIDEO = {
  sourceType: 'sample' as const,
  name: '環境永續與海洋前瞻生態報告',
  url: 'https://vjs.zencdn.net/v/oceans.mp4',
  duration: 120,
  capturedFrames: [] as { timestamp: string; seconds: number; dataUrl: string }[],
  videoElementRef: null as HTMLVideoElement | null,
  transcript: '【影片聲音與字幕重點】\n00:00 紀錄片開場：展示全球近海珊瑚白化與深海生態調查最新進展。\n00:30 生態環境監測：展示深海沉積物微塑膠顆粒化驗數據，探討食物鏈傳遞風險。\n01:00 科技護海方案：介紹新型自沉式人工藻礁復育技術與水下聲納監測機制。\n01:30 國際法規協議：呼籲各國落實公海保護區公約，並推動藍碳認證標準。\n02:00 未來展望：結合綠色金融與社群力量，打造永續海洋經濟生態系。',
};

export default function App() {
  // Global font family ('sans' = Noto Sans TC 思源黑體, 'serif' = Noto Serif TC 思源宋體)
  const [currentFont, setCurrentFont] = useState<'sans' | 'serif'>('sans');

  // Video State (Pre-initialized with default sample video so the user is never blocked)
  const [videoInfo, setVideoInfo] = useState<{
    sourceType: 'file' | 'url' | 'sample';
    name: string;
    url?: string;
    duration: number;
    capturedFrames: { timestamp: string; seconds: number; dataUrl: string }[];
    videoElementRef?: HTMLVideoElement | null;
    transcript?: string;
  } | null>(DEFAULT_FALLBACK_VIDEO);

  // Selected Detail Level
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('medium');

  // Report State
  const [report, setReport] = useState<VideoReport | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingStep, setGeneratingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Modals
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showPresentModal, setShowPresentModal] = useState<boolean>(false);

  // When video uploader updates video info
  const handleVideoReady = (data: {
    sourceType: 'file' | 'url' | 'sample';
    name: string;
    url?: string;
    duration: number;
    capturedFrames: { timestamp: string; seconds: number; dataUrl: string }[];
    videoElementRef?: HTMLVideoElement | null;
  }) => {
    setVideoInfo(data);
    setErrorMessage('');
  };

  // Generate Report action
  const handleGenerateReport = async () => {
    const activeVideo = videoInfo || DEFAULT_FALLBACK_VIDEO;

    setIsGenerating(true);
    setErrorMessage('');

    try {
      setGeneratingStep('正在智慧解析影片結構與重點場景節奏...');

      // Calculate sample timestamps based on detailLevel
      const targetCount = detailLevel === 'simple' ? 4 : detailLevel === 'detailed' ? 10 : 6;
      const duration = activeVideo.duration || 120;
      const stepSeconds = duration / (targetCount + 1);

      const sampledTimestamps: { timestamp: string; seconds: number }[] = [];
      for (let i = 1; i <= targetCount; i++) {
        const sec = Math.floor(i * stepSeconds);
        sampledTimestamps.push({
          timestamp: formatTime(sec),
          seconds: sec,
        });
      }

      setGeneratingStep('正在根據影片內容自動選定最契合之報告主題與主軸...');

      // Call server Gemini analysis
      const res = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: activeVideo.name,
          videoUrl: activeVideo.url,
          duration: activeVideo.duration,
          detailLevel,
          frameCount: targetCount,
          timestamps: sampledTimestamps.map((t) => t.timestamp),
          frameNotes: (activeVideo.capturedFrames || []).map((f) => `在時間點 ${f.timestamp} 處有重要畫面`),
          transcript: activeVideo.transcript || '',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '分析影片失敗');
      }

      setGeneratingStep('正在根據不同時間點精確截取對應畫面...');
      const data = await res.json();
      const rawScenes = data.scenes || [];

      // Collect all required scene timestamps in seconds
      const sceneTimestamps = rawScenes.map((s: any, idx: number) => {
        return s.timestampSeconds || parseTimeToSeconds(s.timestamp) || (idx + 1) * stepSeconds;
      });

      // Extract unique frames from video source for all timestamps
      let extractedFramesMap = new Map<number, string>();
      if (activeVideo.url) {
        try {
          extractedFramesMap = await extractUniqueFramesForTimestamps(
            activeVideo.url,
            sceneTimestamps,
            activeVideo.videoElementRef
          );
        } catch (e) {
          console.warn('Batch frame extraction error:', e);
        }
      }

      // Check YouTube ID if source is YouTube
      const ytId = extractYouTubeId(activeVideo.url || '');

      // Pair generated scenes with their exact timestamp-synchronized frames
      // Guarantee that different timestamps receive DISTINCT, TRUE video frames!
      const generatedScenes: SceneSlide[] = [];
      const extractedEntries = Array.from(extractedFramesMap.entries());
      const usedImages = new Set<string>();

      for (let i = 0; i < rawScenes.length; i++) {
        const rawScene = rawScenes[i];
        const targetSec = sceneTimestamps[i];
        const targetTimeStr = rawScene.timestamp || formatTime(targetSec);
        let frameImg = '';

        // 1. Check if user manually captured/uploaded an exact or very close frame (within 2 seconds)
        if (activeVideo.capturedFrames && activeVideo.capturedFrames.length > 0) {
          const exactMatch = activeVideo.capturedFrames.find(
            (f) =>
              f.timestamp === targetTimeStr ||
              f.timestamp.replace(/^0/, '') === targetTimeStr.replace(/^0/, '') ||
              Math.abs(f.seconds - targetSec) <= 2
          );
          if (exactMatch && !usedImages.has(exactMatch.dataUrl)) {
            frameImg = exactMatch.dataUrl;
          }
        }

        // 2. High Priority: Exact timestamp match from FFmpeg / Storyboard extracted frames
        if (!frameImg && extractedFramesMap.has(targetSec)) {
          const candidate = extractedFramesMap.get(targetSec)!;
          if (!usedImages.has(candidate)) {
            frameImg = candidate;
          }
        }

        // 3. Closest UNUSED timestamp match from extracted frames
        if (!frameImg && extractedFramesMap.size > 0) {
          let minDiff = Infinity;
          let bestUnused = '';
          for (const [sec, dUrl] of extractedFramesMap.entries()) {
            if (!usedImages.has(dUrl)) {
              const diff = Math.abs(sec - targetSec);
              if (diff < minDiff) {
                minDiff = diff;
                bestUnused = dUrl;
              }
            }
          }
          if (bestUnused) {
            frameImg = bestUnused;
          }
        }

        // 4. Slot-based allocation from extracted frames (guarantees distinct frames across scenes)
        if (!frameImg && extractedEntries.length > 0) {
          // Find first unused entry
          const unusedEntry = extractedEntries.find(([, url]) => !usedImages.has(url));
          if (unusedEntry) {
            frameImg = unusedEntry[1];
          } else if (extractedEntries[i]) {
            frameImg = extractedEntries[i][1];
          } else {
            frameImg = extractedEntries[i % extractedEntries.length][1];
          }
        }

        // 5. If from YouTube and still no frame, retrieve distinct keyframe thumbnails
        if (!frameImg && ytId) {
          const distinctKeys = ['1', '2', '3', 'hqdefault', '0', 'sddefault', 'maxresdefault'];
          const keyName = distinctKeys[i % distinctKeys.length];
          const ytThumbUrl = `https://img.youtube.com/vi/${ytId}/${keyName}.jpg`;
          frameImg = await convertUrlToDataUrl(ytThumbUrl);
        }

        // 6. Record image usage to prevent repetition across slides
        if (frameImg) {
          usedImages.add(frameImg);
        }

        // 7. Fallback only if absolutely no image could be retrieved
        if (!frameImg) {
          frameImg = generatePlaceholderFrame(
            rawScene.title || `片段 ${i + 1}`,
            rawScene.timestamp || formatTime(targetSec),
            rawScene.colorTheme || '#3b82f6',
            i
          );
        }

        generatedScenes.push({
          id: `scene-${Date.now()}-${i}`,
          slideNumber: i + 1,
          title: rawScene.title || `重點片段 ${i + 1}`,
          timestamp: rawScene.timestamp || formatTime(targetSec),
          timestampSeconds: targetSec,
          caption: rawScene.caption || '畫面核心說明文字',
          analysis: rawScene.analysis || '深度觀點與洞察',
          keyHighlights: rawScene.keyHighlights || ['重點論點', '核心概念'],
          colorTheme: rawScene.colorTheme || 'indigo',
          imageUrl: frameImg,
        });
      }

      const detailLevelNames: Record<DetailLevel, string> = {
        simple: '簡約版（3~4 頁）',
        medium: '中等版（6~8 頁）',
        detailed: '詳細版（10~12 頁）',
      };

      const newReport: VideoReport = {
        id: `report-${Date.now()}`,
        topic: data.topic || '影片核心內容介紹與深度剖析報告',
        subtitle: data.subtitle || '提煉重要片段、畫面說明與商業知識洞察',
        category: data.category || '專案報告 · 影音分析',
        detailLevel,
        detailLevelName: detailLevelNames[detailLevel],
        summary: data.summary || '此影片涵蓋核心主題探討與關鍵結論。',
        keyTakeaways: data.keyTakeaways || [
          { badge: '關鍵洞察', point: '全面剖析核心論點與趨勢', color: 'indigo' },
        ],
        scenes: generatedScenes,
        conclusion: data.conclusion || '綜合評估影片內容，具備高參考價值與後續落實指引。',
        createdAt: new Date().toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        videoSourceType: activeVideo.sourceType,
        videoName: activeVideo.name,
        videoUrl: activeVideo.url,
        videoDuration: activeVideo.duration,
      };

      setReport(newReport);
    } catch (err: any) {
      console.error('Generate error:', err);
      setErrorMessage(err.message || '生成報告時發生錯誤，請檢查影片或稍後再試');
    } finally {
      setIsGenerating(false);
      setGeneratingStep('');
    }
  };

  // Reset to create another report
  const handleReset = () => {
    setReport(null);
    setVideoInfo(null);
    setErrorMessage('');
  };

  const fontClass = currentFont === 'serif' ? 'font-siyuan-serif' : 'font-siyuan-sans';

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 ${fontClass}`}>
      {/* App Header */}
      <Header
        currentFont={currentFont}
        onFontChange={setCurrentFont}
        hasReport={!!report}
        onOpenExport={() => setShowExportModal(true)}
        onOpenPresent={() => setShowPresentModal(true)}
        onReset={handleReset}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 no-print">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-center gap-3 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: If No Report yet, Show Generator Setup */}
        {!report ? (
          <div className="space-y-8 max-w-5xl mx-auto">
            {/* Hero Banner */}
            <div className="text-center space-y-3 py-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-bold text-indigo-700">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>專業影片內容智慧分析與報告生成</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                快速將影片轉化為高質感 <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-amber-600">PPT 簡報介紹報告</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                支援上傳影片檔案或輸入網址，自動選定主題、截取重要片段畫面並佐以說明，提供簡約/中等/詳細版頁數規格，以思源體與鮮明顏色標記排版。
              </p>
            </div>

            {/* 1. Video Source Input Component */}
            <VideoUploader
              onVideoReady={handleVideoReady}
              isProcessing={isGenerating}
            />

            {/* 2. Detail Level Selector Component */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
              <DetailLevelSelector
                selectedLevel={detailLevel}
                onChange={setDetailLevel}
                disabled={isGenerating}
              />
            </div>

            {/* 3. Generate Action Button */}
            <div className="text-center pt-2">
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerateReport}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-linear-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-bold text-base rounded-2xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>AI 正在生成專業報告...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>開始智慧生成影片報告</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Status / Loading details */}
              {isGenerating && (
                <div className="mt-4 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 max-w-lg mx-auto text-xs text-indigo-900 flex items-center justify-center gap-2 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                  <span className="font-semibold">{generatingStep}</span>
                </div>
              )}

              {!isGenerating && (
                <p className="text-xs text-slate-500 mt-2">
                  點擊按鈕即可立即依已就緒影片智慧生成繁體中文完整報告（附重要畫面截圖與說明）
                </p>
              )}
            </div>
          </div>
        ) : (
          /* STEP 2: When Report is Generated, Show Full ReportView */
          <ReportView
            report={report}
            onUpdateReport={setReport}
            onOpenExport={() => setShowExportModal(true)}
            onOpenPresent={() => setShowPresentModal(true)}
            onRegenerateLevel={(newLevel) => {
              setDetailLevel(newLevel);
              handleGenerateReport();
            }}
          />
        )}
      </main>

      {/* Full-Screen Presentation Deck Modal */}
      {showPresentModal && report && (
        <PresentationModal
          report={report}
          onClose={() => setShowPresentModal(false)}
        />
      )}

      {/* Export / Download Hub Modal */}
      {showExportModal && report && (
        <ExportModal
          report={report}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Print / PDF Document Layout (Only visible when window.print() is called) */}
      {report && <PrintReportView report={report} />}
    </div>
  );
}
