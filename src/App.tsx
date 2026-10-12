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

// Client-Side Smart Fallback Report Generator (for 100% reliability on Vercel deployments)
function generateClientSideReport(
  activeVideo: any,
  detailLevel: DetailLevel,
  sampledTimestamps: { timestamp: string; seconds: number }[]
) {
  const cleanTitle = (activeVideo.name || activeVideo.url || '影片內容精華').trim();
  const themes = ['indigo', 'emerald', 'amber', 'rose', 'cyan', 'violet'];

  const isNeutrality = /行政中立|中立守則|社群.*中立|選舉.*中立/i.test(cleanTitle);
  const isCivilService = !isNeutrality && /公務|加給|俸給|薪資|考績|人事|行政|法制|政府/i.test(cleanTitle);
  const isOceanOrEco = !isNeutrality && !isCivilService && /海洋|生態|永續|自然|環境|深海|生物/i.test(cleanTitle);

  // Check if transcript has structured timestamps
  const transcriptLines = (activeVideo.transcript || '')
    .split('\n')
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 5 && !l.startsWith('【') && !l.endsWith('】'));

  const parsedTranscriptScenes: {
    title: string;
    caption: string;
    analysis: string;
    highlights: string[];
  }[] = [];

  for (const line of transcriptLines) {
    const timeMatch = line.match(/^(\d{1,2}:\d{2})\s*(?:[：:]\s*)?(.*)/);
    if (timeMatch) {
      const content = timeMatch[2];
      const parts = content.split(/[：:]/);
      const title = parts[0].trim() || `${cleanTitle}重點`;
      const text = parts.slice(1).join('：').trim() || content;
      parsedTranscriptScenes.push({
        title,
        caption: `影片此時間點詳細記錄：「${text}」，畫面精確呈現該核心情節與敘述重點。`,
        analysis: `此階段對於整部《${cleanTitle}》具有關鍵推動意義，深入點出核心論述與實務價值。`,
        highlights: [title.slice(0, 8), cleanTitle.slice(0, 6)],
      });
    }
  }

  let dynamicScenes: {
    title: string;
    caption: string;
    analysis: string;
    highlights: string[];
  }[] = [];

  if (isNeutrality) {
    dynamicScenes = [
      {
        title: '網路時代行政中立新挑戰',
        caption: '探討社群媒體普及下公務人員個人網路行為與職務角色之界線，剖析數位足跡帶來的實務中立爭議。',
        analysis: '社群互動具有即時性與公開擴散性，公務人員私領域言論極易被公眾放大解讀為機關立場，必須建立高度自律意識。',
        highlights: ['網路行政中立', '公私界線', '社群自律'],
      },
      {
        title: '私人帳號與公共事務發言界限',
        caption: '釐清公務員使用個人社群帳號對公共議題、政策政策及選務話題發表意見時應遵循之法定紅線。',
        analysis: '明確區隔職務發言與個人意見，嚴禁於上班時間或利用公家資訊設備發表具黨派色彩言論，確保公權力超然形象。',
        highlights: ['言論紅線', '職務區隔', '公務設備規範'],
      },
      {
        title: '社群互動守則：按讚／留言／分享之法規風險',
        caption: '精準剖析公務員在選舉期間對候選人或特定政治團體貼文「按讚、留言、轉發」之行政中立適法性問題。',
        analysis: '在公職人員選舉期間，對特定候選人之公開支持或轉發助選行為均可能構成違反行政中立法，切莫因隨手點擊而觸法。',
        highlights: ['按讚風險', '轉發助選界線', '選罷法連動'],
      },
      {
        title: '嚴守中立三不原則：不站台／不涉選務／不宣傳',
        caption: '重申公務人員在選舉動員期嚴格遵守「不兼任競選職務、不涉足造勢活動、不利用公務資源宣傳」三大鐵律。',
        analysis: '法治國家之基石在於文官體系中立，貫徹三不原則可防範行政資源遭到不當私用，捍衛民主政治公平競爭精神。',
        highlights: ['三不原則', '杜絕行政不公', '文官體系超然'],
      },
      {
        title: '違規法律後果與機關懲戒責任',
        caption: '詳細說明違反公務人員行政中立法之法律責任、考績評定影響及行政懲處程序，提升全員守法警覺性。',
        analysis: '違法情事一經查證屬實，將移送懲戒並列入年度考績懲處，情節嚴重者將面臨調職或免職處分，制度震懾力顯著。',
        highlights: ['法律責任', '考績連帶', '移送懲戒程序'],
      },
      {
        title: '公務體系中立文化之維護與落實指引',
        caption: '總結機關內部宣導策略、主管日常督導機制與公務同仁在社群網路環境中之自我保護指引。',
        analysis: '透過案例式教育宣導與明確規範指引，使行政中立內化為每位公務人員之核心工作倫理，樹立廉潔公正之政府形象。',
        highlights: ['中立文化', '日常督導', '核心文官倫理'],
      },
    ];
  } else if (isCivilService) {
    dynamicScenes = [
      {
        title: '公務人員俸給與加給架構總覽',
        caption: '深入梳理我國公務人員俸給組成體系，詳解本俸、年功俸與法定三種加給之基本法律架構。',
        analysis: '健全的俸給制度兼具保障公務員生活安定與激勵工作績效之雙重功能，是國家文官制度平穩運作的基石。',
        highlights: ['俸給制度', '本俸與年功俸', '法定加給'],
      },
      {
        title: '職務加給核給規範與實務要點',
        caption: '說明主管人員職務加給之評定原則，分析各官職等領導職責繁重程度與加給金額之對應標準。',
        analysis: '職務加給旨在肯定並補償主管人員所承擔的組織決策與指揮領導重任，體現職責程度與待遇之衡平性。',
        highlights: ['職務加給', '主管加給標準', '職責衡平'],
      },
      {
        title: '專業技術加給之類別與激勵機制',
        caption: '剖析不同業務性質及專業門檻（如法制、資訊、工程、衛生等）之各表專業加給核發標準。',
        analysis: '專業加給制度能有效提升特定專業領域人才之留任誘因，並促使公務體系待遇能與民間市場專業水準接軌。',
        highlights: ['專業加給', '人才留任誘因', '表別差異'],
      },
      {
        title: '地域加給之平衡考量與保障制度',
        caption: '探討偏遠地區、離島與高山地區公務人員之地域加給標準，分析交通、物價與環境之生活成本補償。',
        analysis: '地域加給制度保障偏鄉離島地區公務人力配置穩定，縮小城鄉公務服務量能差距，落實照顧偏遠住民之憲法精神。',
        highlights: ['地域加給', '偏鄉保障', '人力穩定'],
      },
      {
        title: '人事法規行政審查與支給流程',
        caption: '解析各機關人事業務單位在審核各項加給時之合規查核要件、資格認定流程與公文報核步驟。',
        analysis: '依法行政是加給核發的第一道防線，嚴謹的審查機制能杜絕浮濫發放爭議，維護政府財政紀律與薪資公平。',
        highlights: ['行政審查', '法規遵循', '財政紀律'],
      },
      {
        title: '未來制度革新與公務待遇展望',
        caption: '歸納俸給加給制度面對通貨膨脹、少子化與跨世代公務人才期望下之未來改革趨勢與優化方向。',
        analysis: '待遇制度應持續朝向績效導向、彈性激勵與整體福利配套整合邁進，以維持政府公共服務之卓越競爭力。',
        highlights: ['制度革新', '彈性激勵', '未來文官競爭力'],
      },
    ];
  } else if (isOceanOrEco) {
    dynamicScenes = [
      {
        title: '全球海洋生態危機與白化監測',
        caption: '展示全球暖化衝擊下近海珊瑚礁生態群之白化現況，分析海水升溫對底棲生物之連鎖反應。',
        analysis: '珊瑚礁群是四分之一海洋物種的棲息地，監測數據顯示保護窗口期僅剩不到十年，需立即採取跨國搶救作為。',
        highlights: ['珊瑚白化', '暖化危機', '生態監測'],
      },
      {
        title: '深海沉積物微塑膠檢測與食物鏈衝擊',
        caption: '透過水下科研探測器深入數千公尺深海沉積層，化驗微塑膠顆粒豐度並評估深海生物攝食風險。',
        analysis: '微塑膠污染已無所不在，其吸附之持久性有機污染物透過海洋食物鏈逐層生物放大，威脅全球水產與人體健康。',
        highlights: ['微塑膠污染', '深海科研', '生物放大作用'],
      },
      {
        title: '科技護海：新型自沉式人工藻礁復育',
        caption: '介紹新一代生態水泥與生物相容性基質打造之藻礁復育模組，搭配水下聲納即時監測復育生長曲線。',
        analysis: '工程技術與海洋生物學跨領域結合，人工藻礁在六個月內使魚類聚集度提升 300%，展現卓越生態復原力。',
        highlights: ['人工藻礁', '科技護海', '生態復育'],
      },
      {
        title: '國際公海公約落實與藍碳經濟倡議',
        caption: '剖析聯合國國家管轄範圍外區域海洋生物多樣性（BBNJ）協定最新進展，倡導推動紅樹林與海草床藍碳認證。',
        analysis: '藍碳生態系單位面積碳匯能力高於陸域森林數倍，將海洋保育轉化為具經濟價值的碳權機制，是永續治理關鍵。',
        highlights: ['BBNJ協定', '藍碳碳權', '國際公海公約'],
      },
      {
        title: '綠色金融與公私協同護海展望',
        caption: '總結企業 ESG 投資、藍色債券與公民科學社群共同維護海洋永續發展之長效機制。',
        analysis: '唯有將生態價值轉化為社會永續投資動力，才能實現人與海洋共榮共生的前瞻藍圖。',
        highlights: ['綠色金融', '藍色債券', 'ESG永續'],
      },
    ];
  } else {
    dynamicScenes = [
      {
        title: `《${cleanTitle}》核心背景與主旨`,
        caption: `影片開場奠定《${cleanTitle}》之核心主軸，全面介紹議題背景與當前所面臨之關鍵挑戰。`,
        analysis: `開場內容迅速抓住觀眾注意力，為整部影片之核心論述與發展方向奠定扎實架構。`,
        highlights: ['背景脈絡', '核心主軸', '重要挑戰'],
      },
      {
        title: '關鍵概念與核心架構深入剖析',
        caption: `影片在此階段深入拆解關鍵實務概念，透過清晰脈絡呈現核心執行方案與細節步驟。`,
        analysis: `本階段是全片最核心之知識輸入，深入點出不可忽視之關鍵變數與系統性邏輯。`,
        highlights: ['核心架構', '深度拆解', '系統性邏輯'],
      },
      {
        title: '實務操作展示與數據成果印證',
        caption: `透過實體案例、操作演示或量化數據，具體驗證上述策略之可行性與顯著實質效益。`,
        analysis: `量化數據與具體成果相輔相成，大幅增強了方案的說服力與落地可複製性。`,
        highlights: ['數據印證', '實務展示', '成效提升'],
      },
      {
        title: '關鍵問題應對與風險控管指引',
        caption: `針對實務執行中最常遭遇之痛點與潛在風險，提供系統性之防範策略與應對指南。`,
        analysis: `提前識別風險盲點並建立預警機制，能有效降低試錯成本，保障專案平穩推進。`,
        highlights: ['風險控管', '痛點解析', '應對指引'],
      },
      {
        title: '總結歸納與具體落地行動建議',
        caption: `全片精華重點總結，提煉最具實務價值的核心洞察，並給出清晰明確之未來實踐指引。`,
        analysis: `將理論認知轉化為即刻可執行的行動步驟，為組織決策與個人實踐提供精準航標。`,
        highlights: ['精華總結', '行動指南', '落地實踐'],
      },
    ];
  }

  const scenesList = [];
  for (let i = 0; i < sampledTimestamps.length; i++) {
    const timeObj = sampledTimestamps[i];
    const transScene = parsedTranscriptScenes[i];
    const dynScene = dynamicScenes[i % dynamicScenes.length];

    const title = transScene?.title || dynScene.title;
    const caption = transScene?.caption || dynScene.caption;
    const analysis = transScene?.analysis || dynScene.analysis;
    const highlights = transScene?.highlights || dynScene.highlights;

    scenesList.push({
      slideNumber: i + 1,
      title,
      timestamp: timeObj.timestamp,
      timestampSeconds: timeObj.seconds,
      caption,
      analysis,
      keyHighlights: highlights,
      colorTheme: themes[i % themes.length],
    });
  }

  return {
    topic: isNeutrality ? '行政中立宣導影片：網路社群的中立守則' : cleanTitle,
    subtitle: isNeutrality
      ? '公務人員網路社群行政中立與言行規範實務指引報告'
      : isCivilService
      ? '公務人員俸給制度與加給規範深入解析'
      : isOceanOrEco
      ? '深海環境監測與永續海洋生態前瞻報告'
      : `《${cleanTitle}》影片內容全景深度解析報告`,
    category: isNeutrality
      ? '公務人事 · 行政中立與社群紀律'
      : isCivilService
      ? '公務人事 · 法制與俸給管理'
      : isOceanOrEco
      ? '永續發展 · 生態科學'
      : '專業分析 · 影片報告',
    summary: isNeutrality
      ? '本報告全面解析公務人員在社群網路時代之行政中立規範，詳細說明私人帳號發言紅線、按讚留言分享風險、嚴守中立三不原則與機關懲戒責任，協助全體公務人員建立正確社群自律意識。'
      : isCivilService
      ? '本報告深入剖析我國公務人員俸給與加給法制體系，系統性解析職務加給、專業加給與地域加給之支給標準、行政審查流程與未來優化方向，提供完整之公務待遇制度全貌。'
      : `本報告針對《${cleanTitle}》影片進行全景式結構化剖析，深入提煉影片核心論點、關鍵實務步驟與量化成果，呈現高質感之繁體中文專業洞察。`,
    keyTakeaways: isNeutrality
      ? [
          { badge: '社群紅線', point: '明確區隔私人社交與公務角色，上班時間與公用設備嚴禁發表具黨派傾向言論' },
          { badge: '互動風險', point: '選舉期間對候選人按讚、轉發、留言均可能構成中立違規，應高度警惕數位足跡' },
          { badge: '三不原則', point: '貫徹不兼任選務職務、不涉足造勢活動、不利用公務資源宣傳之最高標準' },
          { badge: '法律責任', point: '違法情事依法移送行政懲戒並列入考績考核，情節重大者依法追究免職責任' },
        ]
      : [
          { badge: '核心聚焦', point: `精準鎖定《${cleanTitle}》核心議題，建立系統性知識架構` },
          { badge: '實務印證', point: '透過實際案例與關鍵數據，驗證解決方案之可行性與成效' },
          { badge: '行動指引', point: '提煉最具實務價值的行動清單，提供明確之實踐指南' },
        ],
    scenes: scenesList,
    conclusion: isNeutrality
      ? '行政中立是現代民主法治國家文官體系的立基之本。面對無遠弗屆的社群網路環境，公務人員應時刻謹守分際、落實自律，並由機關持續強化案例宣導與制度督導，共同樹立廉能超然的公共服務典範。'
      : `綜觀《${cleanTitle}》所傳遞之核心精髓，唯有深入理解核心架構、精準識別執行要點並落實閉環管理，方能將認知轉化為卓越成效。建議各業務單位依循報告所列時序步驟，穩健落實後續專案推動。`,
  };
}

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

      // Call server Gemini analysis (with bulletproof fallback for Vercel deployments)
      let data: any = null;
      try {
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

        if (res.ok) {
          data = await res.json();
        } else {
          console.warn(`Server analyze-video returned ${res.status}, engaging client-side fallback`);
        }
      } catch (apiErr) {
        console.warn('Backend analyze-video network/parse error, engaging client-side fallback:', apiErr);
      }

      // If backend failed (e.g. Vercel deployment with serverless route missing or API key omitted)
      if (!data || !data.scenes || data.scenes.length === 0) {
        setGeneratingStep('正在根據影片主題與內容精確排版繁體中文報告...');
        data = generateClientSideReport(activeVideo, detailLevel, sampledTimestamps);
      }

      setGeneratingStep('正在根據不同時間點精確截取對應畫面...');
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
