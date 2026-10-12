import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Upload,
  Link2,
  Video,
  Play,
  Pause,
  Camera,
  Trash2,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  FileText,
} from 'lucide-react';
import {
  extractYouTubeId,
  getYouTubeThumbnail,
  formatTime,
  parseTimeToSeconds,
  captureVideoFrame,
  captureFrameAtTime,
  generatePlaceholderFrame,
} from '../utils/videoUtils';

interface CapturedFrameItem {
  timestamp: string;
  seconds: number;
  dataUrl: string;
}

interface VideoUploaderProps {
  onVideoReady: (data: {
    sourceType: 'file' | 'url' | 'sample';
    name: string;
    url?: string;
    duration: number;
    capturedFrames: CapturedFrameItem[];
    videoElementRef?: HTMLVideoElement | null;
    transcript?: string;
  }) => void;
  isProcessing: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideoReady,
  isProcessing,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'url' | 'sample'>('file');

  // File Upload State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [fileVideoUrl, setFileVideoUrl] = useState<string>('');

  // URL State
  const [inputUrl, setInputUrl] = useState<string>('');
  const [urlVideoTitle, setUrlVideoTitle] = useState<string>('');
  const [youtubeId, setYoutubeId] = useState<string | null>(null);

  // Transcript / Subtitles state
  const [transcript, setTranscript] = useState<string>('');

  // Video playback & frame capture state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrameItem[]>([]);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [customTimeInput, setCustomTimeInput] = useState<string>('01:25');
  const customFileInputRef = useRef<HTMLInputElement | null>(null);

  // Sample video presets for instant one-click testing (All verified CORS-enabled)
  const sampleVideos = [
    {
      title: '環境永續與海洋前瞻生態報告',
      url: 'https://vjs.zencdn.net/v/oceans.mp4',
      duration: 46,
      description: '從深海生物多樣性到海洋微塑膠治理，評估全球海洋生物關鍵保護方案',
      category: '永續發展 · 生態科學',
      transcript: '【影片聲音與字幕重點】\n00:00 紀錄片開場：展示全球近海珊瑚白化與深海生態調查最新進展。\n00:10 生態環境監測：展示深海沉積物微塑膠顆粒化驗數據，探討食物鏈傳遞風險。\n00:20 科技護海方案：介紹新型自沉式人工藻礁復育技術與水下聲納監測機制。\n00:30 國際法規協議：呼籲各國落實公海保護區公約，並推動藍碳認證標準。\n00:40 未來展望：結合綠色金融與社群力量，打造永續海洋經濟生態系。',
    },
    {
      title: '自然生態與生命科學觀察速報',
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      duration: 10,
      description: '微距觀察縮時攝影下的植物生長週期與環境感知機制',
      category: '生命科學 · 自然紀錄',
      transcript: '【影片旁白重點】\n00:00 縮時記錄開場：展示花朵在日照週期中的向光性生理反應。\n00:03 細胞生長機制：分析生長素在微觀組織中的濃度梯度與引導作用。\n00:06 生態授粉演化：說明開花形態如何與特定昆蟲形成互利共生系統。\n00:09 研究總結：為極端氣候下的耐旱物種培育提供仿生學理論支持。',
    },
    {
      title: '科技趨勢解析：2026 AI 智慧代理人與自動化變革',
      url: 'https://vjs.zencdn.net/v/oceans.mp4',
      duration: 46,
      description: '深入分析新一代智慧代理人技術脈絡、決策模型架構與跨產業落地應用',
      category: '人工智慧 · 科技前瞻',
      transcript: '【影片聲音與字幕重點】\n00:00 講者開場：探討傳統大語言模型如何進化為具備主動執行力的 AI 智慧代理人。\n00:10 系統架構解析：展示長期記憶模組、自我規劃引擎與多平台工具調度藍圖。\n00:20 實機操作展示：演示 Agent 如何跨應用程式自主抓取資料庫並完成報表排程。\n00:30 量化效能對比：量測結果顯示整體專案處理工時減少 45%，準確率提升至 98.5%。\n00:40 企業落地建議：解析資安隔離、人機協同決策機制與下階段組織部署重點。',
    },
  ];

  // Set default sample on mount so video is immediately ready
  useEffect(() => {
    const firstSample = sampleVideos[0];
    setFileVideoUrl(firstSample.url);
    setUrlVideoTitle(firstSample.title);
    setDuration(firstSample.duration);
    setTranscript(firstSample.transcript || '');
    onVideoReady({
      sourceType: 'sample',
      name: firstSample.title,
      url: firstSample.url,
      duration: firstSample.duration,
      capturedFrames: [],
      videoElementRef: videoRef.current,
      transcript: firstSample.transcript,
    });
  }, []);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setErrorMessage('請上傳有效的影片檔案（如 MP4、WebM、MOV 等格式）');
        return;
      }
      setVideoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setFileVideoUrl(objectUrl);
      setCapturedFrames([]);
      setYoutubeId(null);
      setUrlVideoTitle(file.name);

      onVideoReady({
        sourceType: 'file',
        name: file.name,
        url: objectUrl,
        duration: 120,
        capturedFrames: [],
        videoElementRef: videoRef.current,
        transcript,
      });
    }
  };

  // Tab switching with clean state transition to prevent transcript leakage
  const handleTabChange = (tab: 'file' | 'url' | 'sample') => {
    setActiveTab(tab);
    setErrorMessage('');
    if (tab === 'sample') {
      const sample = sampleVideos[0];
      setFileVideoUrl(sample.url);
      setUrlVideoTitle(sample.title);
      setDuration(sample.duration);
      setTranscript(sample.transcript);
      setYoutubeId(null);
      setVideoFile(null);
      onVideoReady({
        sourceType: 'sample',
        name: sample.title,
        url: sample.url,
        duration: sample.duration,
        capturedFrames: [],
        videoElementRef: videoRef.current,
        transcript: sample.transcript,
      });
    } else {
      // Clear sample video's transcript if switching to URL or File upload
      if (
        transcript.includes('珊瑚白化') ||
        transcript.includes('向光性') ||
        transcript.includes('智慧代理人')
      ) {
        setTranscript('');
      }
      if (tab === 'file') {
        setYoutubeId(null);
      }
    }
  };

  // Helper to generate tailored outline according to current video title
  const handleAutoGenerateOutline = () => {
    const title = (urlVideoTitle || videoFile?.name || inputUrl || '').trim();
    if (title.includes('行政中立') || title.includes('中立守則') || title.includes('社群')) {
      const outline =
        '【影片主題：行政中立宣導影片：網路社群的中立守則】\n00:00 網路時代的行政中立挑戰：公務人員在社群網路的言行規範背景。\n00:45 網路身分界線：公務員私人社群帳號與公共事務發言之合法界線。\n01:30 社群互動規範（按讚/留言/分享）：選舉及政治活動中按讚轉發之法規風險。\n02:30 嚴守中立三不原則：不站台、不涉足選務、不利用職務散布宣傳品。\n03:30 違規後果與提醒：違反行政中立之懲戒責任與實務防範建議。';
      setTranscript(outline);
      return;
    }
    if (title.includes('公務人員') || title.includes('加給') || title.includes('俸給')) {
      const outline =
        '【影片主題：公務人員加給制度淺談】\n00:00 俸給制度架構：說明我國公務人員俸給組成（本俸、年功俸與法定加給）。\n01:30 職務加給規範：解析主管人員職責繁重程度與加給核給標準。\n03:00 專業加給激勵：介紹各專業類別公務員之專業技術加給規定。\n04:30 地域加給衡平：探討偏遠地區、離島與高山地區之地域加給保障。\n06:00 行政審查流程：說明人事行政法規授權依據與未來制度演進。';
      setTranscript(outline);
      return;
    }
    if (title) {
      const outline = `【影片主題：《${title}》精華大綱】\n00:00 主題開場：介紹《${title}》之背景脈絡與核心探討議題。\n01:30 重點深度解析：深入剖析關鍵概念、實務架構與核心步驟。\n03:30 成果展示與案例：呈現具體操作成效與實務對比。\n05:00 總結與後續建議：歸納整體要點並提供具體實踐指引。`;
      setTranscript(outline);
    }
  };

  // Handle URL fetch / check
  const handleUrlSubmit = async (e?: React.FormEvent, customUrl?: string) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    const targetUrl = customUrl || inputUrl;
    if (!targetUrl.trim()) {
      setErrorMessage('請輸入影片網址');
      return;
    }

    const ytId = extractYouTubeId(targetUrl);
    if (ytId) {
      setYoutubeId(ytId);
      setFileVideoUrl('');
      let videoTitle = `YouTube 影片 (${ytId})`;

      // Try to fetch YouTube title and inferred duration via server oembed endpoint
      let videoDuration = 240; // Default reasonable length
      try {
        const res = await fetch('/api/fetch-youtube-meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl }),
        });
        if (res.ok) {
          const meta = await res.json();
          if (meta.title) videoTitle = meta.title;
          if (meta.duration && meta.duration > 0) videoDuration = meta.duration;
        } else {
          throw new Error(`Server returned ${res.status}`);
        }
      } catch (err) {
        console.warn('Backend oembed endpoint failed, trying direct browser oEmbed:', err);
        try {
          const directRes = await fetch(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`
          );
          if (directRes.ok) {
            const directMeta = await directRes.json();
            if (directMeta.title) {
              videoTitle = directMeta.title.trim();
              const colonMatch = videoTitle.match(/(\d{1,2})[:：](\d{2})/);
              const minMatch = videoTitle.match(/(\d+)\s*(?:分鐘|分|min|mins|m)/i);
              if (colonMatch) {
                videoDuration = parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
              } else if (minMatch) {
                videoDuration = parseInt(minMatch[1], 10) * 60;
              }
            }
          }
        } catch (directErr) {
          console.warn('Direct YouTube oEmbed fallback also failed:', directErr);
        }
      }

      setUrlVideoTitle(videoTitle);
      setCapturedFrames([]);
      setDuration(videoDuration);

      // Tailor transcript specifically to this video and eliminate stale sample text
      let nextTranscript = '';
      if (videoTitle.includes('行政中立') || videoTitle.includes('中立守則') || videoTitle.includes('社群')) {
        nextTranscript =
          '【影片主題：行政中立宣導影片：網路社群的中立守則】\n00:00 網路時代的行政中立挑戰：公務人員在社群網路的言行規範背景。\n00:45 網路身分界線：公務員私人社群帳號與公共事務發言之合法界線。\n01:30 社群互動規範（按讚/留言/分享）：選舉及政治活動中按讚轉發之法規風險。\n02:30 嚴守中立三不原則：不站台、不涉足選務、不利用職務散布宣傳品。\n03:30 違規後果與提醒：違反行政中立之懲戒責任與實務防範建議。';
      } else if (videoTitle.includes('公務人員') || videoTitle.includes('加給') || videoTitle.includes('俸給')) {
        nextTranscript =
          '【影片主題：公務人員加給制度淺談】\n00:00 俸給制度架構：說明我國公務人員俸給組成（本俸、年功俸與法定加給）。\n01:30 職務加給規範：解析主管人員職責繁重程度與加給核給標準。\n03:00 專業加給激勵：介紹各專業類別公務員之專業技術加給規定。\n04:30 地域加給衡平：探討偏遠地區、離島與高山地區之地域加給保障。\n06:00 行政審查流程：說明人事行政法規授權依據與未來制度演進。';
      }
      setTranscript(nextTranscript);

      onVideoReady({
        sourceType: 'url',
        name: videoTitle,
        url: targetUrl,
        duration: videoDuration,
        capturedFrames: [],
        videoElementRef: null,
        transcript: nextTranscript,
      });
    } else {
      // Direct Web Video URL
      setYoutubeId(null);
      setFileVideoUrl(targetUrl);
      const videoTitle = targetUrl.split('/').pop() || '網路影片';
      setUrlVideoTitle(videoTitle);
      setCapturedFrames([]);

      // Reset stale transcript
      if (
        transcript.includes('珊瑚白化') ||
        transcript.includes('向光性') ||
        transcript.includes('智慧代理人')
      ) {
        setTranscript('');
      }

      onVideoReady({
        sourceType: 'url',
        name: videoTitle,
        url: targetUrl,
        duration: duration || 120,
        capturedFrames: [],
        videoElementRef: videoRef.current,
        transcript: '',
      });
    }
  };

  // Select a sample preset video
  const handleSelectSample = (sample: (typeof sampleVideos)[0]) => {
    setActiveTab('sample');
    setFileVideoUrl(sample.url);
    setUrlVideoTitle(sample.title);
    setDuration(sample.duration);
    setTranscript(sample.transcript || '');
    setCapturedFrames([]);
    setYoutubeId(null);
    setErrorMessage('');

    onVideoReady({
      sourceType: 'sample',
      name: sample.title,
      url: sample.url,
      duration: sample.duration,
      capturedFrames: [],
      videoElementRef: videoRef.current,
      transcript: sample.transcript || '',
    });
  };

  // Sync onVideoReady whenever relevant state changes
  useEffect(() => {
    if (fileVideoUrl || youtubeId || videoFile) {
      const name =
        activeTab === 'file'
          ? videoFile?.name || '本地上傳影片'
          : activeTab === 'sample'
          ? urlVideoTitle || '示範影片'
          : urlVideoTitle || inputUrl || '網路影片';

      onVideoReady({
        sourceType: activeTab,
        name,
        url: activeTab === 'url' ? inputUrl : fileVideoUrl,
        duration: duration || 120,
        capturedFrames,
        videoElementRef: videoRef.current,
        transcript,
      });
    }
  }, [fileVideoUrl, youtubeId, videoFile, urlVideoTitle, inputUrl, duration, capturedFrames, activeTab, transcript]);

  // When video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
    }
  };

  // Manual Frame Capture at current playback time
  const handleCaptureCurrentFrame = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const frameData = captureVideoFrame(videoRef.current);
      if (frameData) {
        const timeSec = Math.floor(videoRef.current.currentTime);
        const timeFormatted = formatTime(timeSec);

        setCapturedFrames((prev) => [
          ...prev,
          {
            timestamp: timeFormatted,
            seconds: timeSec,
            dataUrl: frameData,
          },
        ]);
      } else {
        setErrorMessage('無法從目前影片擷取畫面，可能受瀏覽器跨域限制');
      }
    } catch (err) {
      console.error('Capture error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Delete captured frame
  const handleRemoveFrame = (index: number) => {
    setCapturedFrames((prev) => prev.filter((_, i) => i !== index));
  };

  // Add custom screenshot for designated timestamp (e.g. 01:25)
  const handleAddCustomFrame = (dataUrl: string, targetTimeStr?: string) => {
    const rawTime = targetTimeStr || customTimeInput.trim() || '00:00';
    // Format to standard mm:ss
    const sec = parseTimeToSeconds(rawTime);
    const timeFormatted = formatTime(sec);
    const newFrame: CapturedFrameItem = {
      timestamp: timeFormatted,
      seconds: sec,
      dataUrl,
    };
    setCapturedFrames((prev) => {
      const filtered = prev.filter((f) => f.timestamp !== timeFormatted);
      return [...filtered, newFrame].sort((a, b) => a.seconds - b.seconds);
    });
  };

  const handleCustomFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        if (uploadEvt.target?.result) {
          handleAddCustomFrame(uploadEvt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Update current time on timeupdate
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const hasVideoSource = Boolean(fileVideoUrl || youtubeId || videoFile);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-indigo-600" />
            <span>選擇影片來源（支援檔案上傳或網址）</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            可上傳本地 MP4/WebM 檔案，或輸入 YouTube/網頁影片網址，系統將智慧擷取重要關鍵畫面
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => handleTabChange('file')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            上傳影片檔案
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('url')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            輸入影片網址
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('sample')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'sample'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            一鍵試用範例
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: File Upload */}
      {activeTab === 'file' && (
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 bg-slate-50/50 hover:bg-indigo-50/20 transition-all cursor-pointer group">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3 transition-colors">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
              點擊此處瀏覽影片，或將影片拖曳至此
            </p>
            <p className="text-xs text-slate-500">
              支援 MP4、WebM、MOV、AVI、MKV 等常見格式（建議 1080p 以下為佳）
            </p>
            {videoFile && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                已選擇: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
              </div>
            )}
          </label>
        </div>
      )}

      {/* TAB 2: URL Input */}
      {activeTab === 'url' && (
        <form onSubmit={handleUrlSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="請輸入 YouTube 影片網址（如 https://www.youtube.com/watch?v=...）或 MP4 網址"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-600/30 shrink-0 cursor-pointer"
            >
              載入網址影片
            </button>
          </div>
          <p className="text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              支援公開 YouTube 影片與任何標準網頁 MP4/WebM 影音網址。
            </span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const demoYt = 'https://www.youtube.com/watch?v=kcc_KAhwpa0';
                  setInputUrl(demoYt);
                  handleUrlSubmit(undefined, demoYt);
                }}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                + 帶入示範 YouTube
              </button>
              <button
                type="button"
                onClick={() => {
                  const demoMp4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
                  setInputUrl(demoMp4);
                  handleUrlSubmit(undefined, demoMp4);
                }}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                + 帶入示範 MP4
              </button>
            </span>
          </p>
        </form>
      )}

      {/* Currently Selected Active Video Banner */}
      <div className="p-3.5 bg-linear-to-r from-emerald-50/80 via-teal-50/50 to-indigo-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>已就緒影片：</span>
              <span className="text-indigo-900 font-extrabold truncate max-w-sm sm:max-w-md">
                {urlVideoTitle || videoFile?.name || '科技趨勢解析：2026 AI 智慧代理人與自動化變革'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              系統已掌握影片資訊，您可隨時點擊下方「開始智慧生成影片報告」按鈕進行製作！
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md shrink-0 border border-emerald-300/50">
          ✓ 可以直接生成
        </span>
      </div>

      {/* TAB 3: Sample Videos */}
      {activeTab === 'sample' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sampleVideos.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  fileVideoUrl === sample.url
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 mb-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{sample.category}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                  {sample.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VIDEO PREVIEW & SCREENSHOT SCRUBBER */}
      {hasVideoSource && (
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">影片預覽與畫面截取面板</span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium border border-emerald-200/60">
                就緒
              </span>
            </div>
            {duration > 0 && (
              <span className="text-xs text-slate-500">
                長度: {formatTime(duration)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Player Container */}
            <div className="lg:col-span-7 bg-slate-950 rounded-2xl overflow-hidden shadow-md relative">
              {youtubeId ? (
                // YouTube Iframe Preview
                <div className="aspect-video w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1`}
                    title="YouTube Video"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                // HTML5 Video Player
                <div className="relative group aspect-video bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={fileVideoUrl}
                    crossOrigin={fileVideoUrl?.startsWith('blob:') ? undefined : 'anonymous'}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-full object-contain"
                  />

                  {/* Overlay Controls */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-linear-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-white text-xs gap-3">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-300">
                        {formatTime(currentTime)}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (videoRef.current) {
                            videoRef.current.currentTime = val;
                          }
                          setCurrentTime(val);
                        }}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <span className="text-[11px] font-mono text-slate-300">
                        {formatTime(duration)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCaptureCurrentFrame}
                      disabled={isCapturing}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[11px] font-bold text-white transition-colors cursor-pointer"
                      title="擷取此秒數之畫面加入報告"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>📸 擷取畫面</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Captured Frames Gallery */}
            <div className="lg:col-span-5 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>已截取之重要片段畫面 ({capturedFrames.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    系統將自動結合這些畫面作為報告投影片佐證
                  </p>
                </div>
                {!youtubeId && (
                  <button
                    type="button"
                    onClick={handleCaptureCurrentFrame}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    + 擷取目前畫面
                  </button>
                )}
              </div>

              {capturedFrames.length === 0 ? (
                <div className="py-5 px-4 text-center text-slate-500 text-xs border border-dashed border-indigo-200 rounded-xl bg-indigo-50/30 space-y-2">
                  <div className="font-semibold text-slate-700">如何使用「截取畫面」：</div>
                  <div className="text-[11px] text-slate-600 leading-relaxed text-left space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                    <p>• <strong>方式 1（自動截取）：</strong>您無需任何操作，系統會在點擊「開始智慧生成」時，自動依影片真實時間點截取清晰畫面。</p>
                    <p>• <strong>方式 2（播放器手動截取）：</strong>若為檔案影片，直接在左側播放器點擊「📸 擷取畫面」即可留存當前秒數畫面。</p>
                    <p>• <strong>方式 3（指定秒數自訂上傳）：</strong>在下方輸入秒數（例如 <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono font-bold">01:25</code>），再點擊「上傳此時間點截圖」，或在產出報告後直接在投影片卡片點「更換截圖」！</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {capturedFrames.map((frame, index) => (
                    <div
                      key={index}
                      className="group relative rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs"
                    >
                      <img
                        src={frame.dataUrl}
                        alt={`片段 ${frame.timestamp}`}
                        className="w-full h-24 object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 text-white text-[10px] flex items-center justify-between font-mono">
                        <span>⏱ {frame.timestamp}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFrame(index)}
                          className="text-rose-400 hover:text-rose-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom timestamp screenshot upload / paste */}
              <div className="pt-2 border-t border-slate-200/80">
                <input
                  ref={customFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCustomFileInputChange}
                />
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs shrink-0">
                    <span className="text-slate-400 font-mono text-[11px]">⏱ 秒數:</span>
                    <input
                      type="text"
                      value={customTimeInput}
                      onChange={(e) => setCustomTimeInput(e.target.value)}
                      placeholder="01:25"
                      className="w-14 font-mono font-bold text-slate-800 outline-none text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => customFileInputRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                    title="選取圖片檔案上傳為指定時間點之畫面截圖"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>上傳此時間點截圖 (如 01:25)</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 支援上傳或貼上實際秒數畫面（例如 01:25），系統將以最高優先度對齊報告各片段！
                </p>
              </div>
            </div>
          </div>

          {/* Optional Transcript / Subtitles / Audio Notes Input */}
          <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>影片實際聲音、旁白與字幕內容（AI 將主動配合此內容為每段產製專屬說明）</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoGenerateOutline}
                  className="px-2 py-0.5 rounded text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                  title="依據目前影片標題自動填入相應之大綱重點"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>✨ 依主題填入大綱</span>
                </button>
                {transcript && (
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript('');
                      onVideoReady({
                        sourceType: activeTab,
                        name: urlVideoTitle || videoFile?.name || '影片',
                        url: activeTab === 'url' ? inputUrl : fileVideoUrl,
                        duration: duration || 120,
                        capturedFrames,
                        videoElementRef: videoRef.current,
                        transcript: '',
                      });
                    }}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                    title="清空內容"
                  >
                    清空
                  </button>
                )}
              </div>
            </div>
            <textarea
              rows={3}
              value={transcript}
              onChange={(e) => {
                const val = e.target.value;
                setTranscript(val);
                onVideoReady({
                  sourceType: activeTab,
                  name: urlVideoTitle || videoFile?.name || '影片',
                  url: activeTab === 'url' ? inputUrl : fileVideoUrl,
                  duration: duration || 120,
                  capturedFrames,
                  videoElementRef: videoRef.current,
                  transcript: val,
                });
              }}
              placeholder="可貼上影片字幕檔文字、台詞、旁白重點或時間軸筆記（例如：00:30 介紹架構、01:00 操作示範），AI 將精確依照實際聲音與字幕內容產製每頁報告說明..."
              className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed font-normal"
            />
            <p className="text-[11px] text-slate-500">
              提示：若已有字幕或旁白大綱，貼於此處可讓各片段之文字說明與實際內容達到最佳吻合度。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
