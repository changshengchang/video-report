import pptxgen from 'pptxgenjs';
import { VideoReport } from '../types/report';
import { convertUrlToDataUrl, generatePlaceholderFrame } from './videoUtils';

/**
 * Dynamically calculate optimal font size to prevent any text from ever
 * overflowing its container or the slide boundary
 */
function getOptimalFontSize(text: string, baseSize = 11, minSize = 9.5): number {
  if (!text) return baseSize;
  const len = text.length;
  if (len > 180) return minSize;
  if (len > 130) return minSize + 0.5;
  if (len > 90) return baseSize - 0.5;
  return baseSize;
}

export async function exportReportToPPTX(report: VideoReport): Promise<void> {
  const pres = new pptxgen();

  // Define standard widescreen layout (13.333 in x 7.5 in)
  pres.defineLayout({ name: 'WIDE_16_9', width: 13.333, height: 7.5 });
  pres.layout = 'WIDE_16_9';
  pres.author = '影片內容介紹報告生成器';
  pres.company = 'AI Studio';
  pres.title = report.topic;
  pres.subject = report.subtitle;

  // Color mapping helper
  const getColorHex = (theme: string): string => {
    switch (theme) {
      case 'emerald': return '059669';
      case 'amber': return 'D97706';
      case 'rose': return 'E11D48';
      case 'cyan': return '0891B2';
      case 'violet': return '7C3AED';
      case 'indigo':
      default: return '4F46E5';
    }
  };

  // ==========================================
  // Slide 1: Cover Slide
  // ==========================================
  const slideCover = pres.addSlide();
  slideCover.background = { color: '0F172A' };

  // Decorative top accent line
  slideCover.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.15,
    fill: { color: '4F46E5' },
    line: { color: '4F46E5' },
  });

  // Report Category / Level badge
  slideCover.addText(`【${report.detailLevelName}】 · 專業影片內容分析報告`, {
    x: 1.0,
    y: 1.6,
    w: 9.0,
    h: 0.45,
    fontSize: 14,
    bold: true,
    color: '38BDF8',
    fontFace: 'Microsoft JhengHei',
  });

  // Main Topic Title
  slideCover.addText(report.topic, {
    x: 1.0,
    y: 2.2,
    w: 11.3,
    h: 1.6,
    fontSize: 32,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Microsoft JhengHei',
    wrap: true,
    fit: 'shrink',
  });

  // Subtitle
  slideCover.addText(report.subtitle || '深入解析關鍵片段、場景鏡頭與核心商務洞察', {
    x: 1.0,
    y: 3.9,
    w: 11.3,
    h: 1.0,
    fontSize: 18,
    color: '94A3B8',
    fontFace: 'Microsoft JhengHei',
    wrap: true,
    fit: 'shrink',
  });

  // Footer metadata on cover
  slideCover.addText(
    `影片來源: ${report.videoName || report.videoUrl || '上傳影片'}   |   產生時間: ${report.createdAt}   |   片段總數: ${report.scenes.length} 頁`,
    {
      x: 1.0,
      y: 6.4,
      w: 11.3,
      h: 0.4,
      fontSize: 11,
      color: '64748B',
      fontFace: 'Microsoft JhengHei',
    }
  );

  // ==========================================
  // Slide 2: Executive Summary & Key Highlights
  // ==========================================
  const slideSummary = pres.addSlide();
  slideSummary.background = { color: 'F8FAFC' };

  // Header Title
  slideSummary.addText('01. 影片整體內容摘要與核心重點', {
    x: 0.8,
    y: 0.55,
    w: 10.0,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: '0F172A',
    fontFace: 'Microsoft JhengHei',
  });

  // Left Box: Executive Summary
  slideSummary.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 1.3,
    w: 5.7,
    h: 5.3,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.08,
  });

  slideSummary.addText('【內容核心總覽】', {
    x: 1.1,
    y: 1.55,
    w: 5.1,
    h: 0.35,
    fontSize: 15,
    bold: true,
    color: '4F46E5',
    fontFace: 'Microsoft JhengHei',
  });

  slideSummary.addText(report.summary, {
    x: 1.1,
    y: 2.0,
    w: 5.1,
    h: 4.3,
    fontSize: getOptimalFontSize(report.summary, 12, 10),
    color: '334155',
    fontFace: 'Microsoft JhengHei',
    lineSpacing: 20,
    wrap: true,
    fit: 'shrink',
  });

  // Right Box: Key Takeaways
  slideSummary.addShape(pres.ShapeType.roundRect, {
    x: 6.8,
    y: 1.3,
    w: 5.7,
    h: 5.3,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.08,
  });

  slideSummary.addText('【重要核心價值與亮點】', {
    x: 7.1,
    y: 1.55,
    w: 5.1,
    h: 0.35,
    fontSize: 15,
    bold: true,
    color: '059669',
    fontFace: 'Microsoft JhengHei',
  });

  let takeawayY = 2.1;
  const takeawayH = Math.min(0.95, 4.2 / Math.max(1, report.keyTakeaways.length));

  report.keyTakeaways.forEach((item, idx) => {
    slideSummary.addText(`★ [${item.badge}] ${item.point}`, {
      x: 7.1,
      y: takeawayY,
      w: 5.1,
      h: takeawayH - 0.1,
      fontSize: 11.5,
      color: '1E293B',
      bold: idx === 0,
      fontFace: 'Microsoft JhengHei',
      lineSpacing: 18,
      wrap: true,
      fit: 'shrink',
    });
    takeawayY += takeawayH;
  });

  // ==========================================
  // Slides 3+: Individual Scenes / Keyframes
  // ==========================================
  for (let index = 0; index < report.scenes.length; index++) {
    const scene = report.scenes[index];
    const slide = pres.addSlide();
    slide.background = { color: 'FFFFFF' };

    const colorHex = getColorHex(scene.colorTheme);

    // Accent top banner
    slide.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.1,
      fill: { color: colorHex },
      line: { color: colorHex },
    });

    // Scene number and timestamp
    slide.addText(`片段 ${String(index + 1).padStart(2, '0')} · 時間點: ${scene.timestamp}`, {
      x: 0.8,
      y: 0.35,
      w: 7.0,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: colorHex,
      fontFace: 'Microsoft JhengHei',
    });

    // Scene Title
    slide.addText(scene.title, {
      x: 0.8,
      y: 0.7,
      w: 11.7,
      h: 0.55,
      fontSize: 20,
      bold: true,
      color: '0F172A',
      fontFace: 'Microsoft JhengHei',
      wrap: true,
      fit: 'shrink',
    });

    // Ensure image is valid base64 data for PowerPoint
    let imageToEmbed = scene.imageUrl;
    if (imageToEmbed && !imageToEmbed.startsWith('data:image')) {
      imageToEmbed = await convertUrlToDataUrl(imageToEmbed);
    }
    if (!imageToEmbed || !imageToEmbed.startsWith('data:image')) {
      imageToEmbed = generatePlaceholderFrame(scene.title, scene.timestamp, `#${colorHex}`, index);
    }

    // Left Column 1: Video Screenshot Frame Container Card (Exact 16:9 ratio, no distortion!)
    // Dimensions: w: 5.4, h: 3.0375 (16:9)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 1.45,
      w: 5.4,
      h: 3.05,
      fill: { color: '0F172A' },
      line: { color: 'CBD5E1', width: 1.5 },
      rectRadius: 0.06,
    });

    // Embed Screenshot Frame into PowerPoint cleanly
    slide.addImage({
      data: imageToEmbed,
      x: 0.82,
      y: 1.47,
      w: 5.36,
      h: 3.01,
      sizing: { type: 'contain', w: 5.36, h: 3.01 },
    });

    // Left Column 2: Highlights / Tag Badges (Underneath Image)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 4.7,
      w: 5.4,
      h: 1.95,
      fill: { color: 'F8FAFC' },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.08,
    });

    slide.addText('【重要核心標記與專有名詞】', {
      x: 1.0,
      y: 4.85,
      w: 5.0,
      h: 0.3,
      fontSize: 11.5,
      bold: true,
      color: colorHex,
      fontFace: 'Microsoft JhengHei',
    });

    const highlightText =
      scene.keyHighlights && scene.keyHighlights.length > 0
        ? scene.keyHighlights.map((k) => `◆ [ ${k} ]`).join('\n')
        : '◆ [ 重點核心論點 ]\n◆ [ 專案成果展示 ]';

    slide.addText(highlightText, {
      x: 1.0,
      y: 5.25,
      w: 5.0,
      h: 1.25,
      fontSize: 11,
      color: '334155',
      bold: true,
      fontFace: 'Microsoft JhengHei',
      lineSpacing: 20,
      wrap: true,
      fit: 'shrink',
    });

    // Right Column: Explanatory Content & In-depth Analysis
    // 1. Caption Box (畫面核心說明)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 6.6,
      y: 1.45,
      w: 5.9,
      h: 2.5,
      fill: { color: 'F8FAFC' },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.08,
    });

    slide.addText('【畫面核心說明】', {
      x: 6.85,
      y: 1.6,
      w: 5.4,
      h: 0.3,
      fontSize: 12.5,
      bold: true,
      color: colorHex,
      fontFace: 'Microsoft JhengHei',
    });

    slide.addText(scene.caption, {
      x: 6.85,
      y: 2.0,
      w: 5.4,
      h: 1.8,
      fontSize: getOptimalFontSize(scene.caption, 11, 9.5),
      color: '334155',
      fontFace: 'Microsoft JhengHei',
      lineSpacing: 18,
      wrap: true,
      fit: 'shrink',
    });

    // 2. In-depth Analysis Box (深度觀點與商務洞察)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 6.6,
      y: 4.15,
      w: 5.9,
      h: 2.5,
      fill: { color: 'F8FAFC' },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.08,
    });

    slide.addText('【深度觀點與商務洞察】', {
      x: 6.85,
      y: 4.3,
      w: 5.4,
      h: 0.3,
      fontSize: 12.5,
      bold: true,
      color: '0F172A',
      fontFace: 'Microsoft JhengHei',
    });

    slide.addText(scene.analysis, {
      x: 6.85,
      y: 4.7,
      w: 5.4,
      h: 1.8,
      fontSize: getOptimalFontSize(scene.analysis, 11, 9.5),
      color: '334155',
      fontFace: 'Microsoft JhengHei',
      lineSpacing: 18,
      wrap: true,
      fit: 'shrink',
    });

    // Slide footer (Safely inside slide height: 6.85 + 0.3 = 7.15 < 7.5)
    slide.addText(`${report.topic}  |  頁次 ${index + 3} / ${report.scenes.length + 3}`, {
      x: 0.8,
      y: 6.85,
      w: 11.7,
      h: 0.3,
      fontSize: 9.5,
      color: '94A3B8',
      fontFace: 'Microsoft JhengHei',
    });
  }

  // ==========================================
  // Final Slide: Conclusion & Takeaways
  // ==========================================
  const slideEnd = pres.addSlide();
  slideEnd.background = { color: '0F172A' };

  slideEnd.addText('總結與建議應用方向', {
    x: 1.0,
    y: 1.0,
    w: 11.0,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Microsoft JhengHei',
  });

  slideEnd.addShape(pres.ShapeType.roundRect, {
    x: 1.0,
    y: 1.8,
    w: 11.3,
    h: 4.6,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 },
    rectRadius: 0.08,
  });

  slideEnd.addText(report.conclusion, {
    x: 1.4,
    y: 2.2,
    w: 10.5,
    h: 3.8,
    fontSize: getOptimalFontSize(report.conclusion, 14, 11),
    color: 'E2E8F0',
    fontFace: 'Microsoft JhengHei',
    lineSpacing: 24,
    wrap: true,
    fit: 'shrink',
  });

  slideEnd.addText('報告製作完成 · 感謝閱覽', {
    x: 1.0,
    y: 6.65,
    w: 11.3,
    h: 0.35,
    fontSize: 13,
    color: '64748B',
    align: 'center',
    fontFace: 'Microsoft JhengHei',
  });

  // Save the PPTX file to browser
  const filename = `${report.topic.replace(/[/\\?%*:|"<>]/g, '_')}_影片報告.pptx`;
  await pres.writeFile({ fileName: filename });
}
