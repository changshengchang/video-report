import { jsPDF } from 'jspdf';
import { VideoReport, SceneSlide } from '../types/report';
import { convertUrlToDataUrl, generatePlaceholderFrame } from './videoUtils';

/**
 * Helper to wrap and draw multi-line text onto an HTML5 Canvas 2D context
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 8
): number {
  if (!text) return y;
  const chars = Array.from(text);
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let n = 0; n < chars.length; n++) {
    const testLine = line + chars[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = chars[n];
      currentY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1 && n < chars.length - 1) {
        ctx.fillText(line + '...', x, currentY);
        return currentY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

/**
 * Color mapping helper for standard hex colors
 */
function getThemeHex(theme: string): string {
  switch (theme) {
    case 'emerald': return '#059669';
    case 'amber': return '#d97706';
    case 'rose': return '#e11d48';
    case 'cyan': return '#0891b2';
    case 'violet': return '#7c3aed';
    case 'indigo':
    default: return '#4f46e5';
  }
}

/**
 * Load image safely without CORS issues.
 * Supports Data URLs, Blob URLs, and Remote URLs with automatic proxy fallback.
 */
async function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;

  return new Promise((resolve) => {
    const img = new Image();
    // Do NOT set crossOrigin on data: or blob: schemes
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    let settled = false;
    const finish = (result: HTMLImageElement | null) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        finish(img);
      } else {
        finish(null);
      }
    };

    img.onerror = async () => {
      // If remote HTTP/HTTPS image failed due to CORS, attempt server proxy fetch
      if (src.startsWith('http://') || src.startsWith('https://')) {
        try {
          const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(src)}`);
          if (proxyRes.ok) {
            const data = await proxyRes.json();
            if (data.dataUrl) {
              const proxyImg = new Image();
              proxyImg.onload = () => finish(proxyImg.naturalWidth > 0 ? proxyImg : null);
              proxyImg.onerror = () => finish(null);
              proxyImg.src = data.dataUrl;
              return;
            }
          }
        } catch {}
      }
      finish(null);
    };

    img.src = src;

    if (img.complete && img.naturalWidth > 0) {
      finish(img);
    }

    // Safety timeout
    setTimeout(() => {
      finish(img.naturalWidth > 0 ? img : null);
    }, 4500);
  });
}

/**
 * Draws a rich, high-resolution aesthetic scene visual directly onto canvas
 * Used when a scene frame is loading or requires visual styling
 */
function drawRichSceneVisual(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  timestamp: string,
  themeHex: string,
  sceneIndex: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.clip();

  // Gradients
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Geometric waveform curves
  ctx.strokeStyle = `${themeHex}44`;
  ctx.lineWidth = 2.5;
  for (let wave = 0; wave < 4; wave++) {
    ctx.beginPath();
    for (let px = 0; px <= w; px += 20) {
      const py = y + h * 0.5 + Math.sin((px + sceneIndex * 40 + wave * 60) * 0.02) * (30 + wave * 15);
      if (px === 0) ctx.moveTo(x + px, py);
      else ctx.lineTo(x + px, py);
    }
    ctx.stroke();
  }

  // Center Content
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 26px "Noto Sans TC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(title, x + w / 2, y + h / 2 - 10);

  ctx.fillStyle = themeHex;
  ctx.font = `bold 18px monospace`;
  ctx.fillText(`⏱ 關鍵畫面時間點 ${timestamp}`, x + w / 2, y + h / 2 + 35);

  ctx.restore();
}

/**
 * Renders a high-resolution 1920x1080 slide onto Canvas 2D directly
 */
async function renderSlideToCanvas(
  type: 'cover' | 'summary' | 'scene' | 'conclusion',
  report: VideoReport,
  scene?: SceneSlide,
  sceneIndex?: number
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Ensure high quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const fontSans = '"Noto Sans TC", system-ui, -apple-system, sans-serif';

  if (type === 'cover') {
    // Background Dark Slate
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1920, 1080);

    // Decorative top accent bar
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(0, 0, 1920, 24);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1920; x += 96) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1080);
      ctx.stroke();
    }

    // Detail Level Badge
    ctx.fillStyle = 'rgba(79, 70, 229, 0.25)';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.roundRect(160, 240, 420, 52, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold 24px ${fontSans}`;
    ctx.textAlign = 'left';
    ctx.fillText(`【${report.detailLevelName}】 · 專業影片內容分析報告`, 185, 275);

    // Main Topic Title
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 56px ${fontSans}`;
    drawWrappedText(ctx, report.topic, 160, 360, 1600, 72, 3);

    // Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = `normal 32px ${fontSans}`;
    drawWrappedText(ctx, report.subtitle || '深度剖析關鍵片段、時序畫面說明與核心商業洞察', 160, 560, 1600, 48, 3);

    // Footer metadata on cover
    ctx.fillStyle = '#475569';
    ctx.fillRect(160, 880, 1600, 2);

    ctx.fillStyle = '#64748b';
    ctx.font = `normal 22px ${fontSans}`;
    ctx.fillText(
      `影片來源: ${report.videoName || report.videoUrl || '自訂影片'}   |   產生時間: ${report.createdAt}   |   分析片段總數: ${report.scenes.length} 頁`,
      160,
      930
    );

  } else if (type === 'summary') {
    // Light background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 1920, 1080);

    // Header
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold 40px ${fontSans}`;
    ctx.fillText('01. 影片整體內容摘要與核心重點', 120, 110);

    // Left Box: Executive Summary
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.roundRect(120, 160, 800, 780, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4f46e5';
    ctx.font = `bold 28px ${fontSans}`;
    ctx.fillText('【內容核心總覽】', 160, 230);

    ctx.fillStyle = '#334155';
    ctx.font = `normal 24px ${fontSans}`;
    drawWrappedText(ctx, report.summary, 160, 300, 720, 44, 11);

    // Right Box: Key Takeaways
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.roundRect(960, 160, 840, 780, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#059669';
    ctx.font = `bold 28px ${fontSans}`;
    ctx.fillText('【重要核心價值與亮點】', 1000, 230);

    let takeawayY = 300;
    report.keyTakeaways.forEach((item) => {
      // Badge
      ctx.fillStyle = '#e0e7ff';
      ctx.roundRect(1000, takeawayY - 26, 160, 40, 8);
      ctx.fill();

      ctx.fillStyle = '#4338ca';
      ctx.font = `bold 20px ${fontSans}`;
      ctx.fillText(item.badge, 1015, takeawayY + 2);

      // Text
      ctx.fillStyle = '#1e293b';
      ctx.font = `normal 22px ${fontSans}`;
      drawWrappedText(ctx, item.point, 1180, takeawayY + 2, 580, 38, 2);

      takeawayY += 120;
    });

    // Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = `normal 18px ${fontSans}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${report.topic} · 頁次 02`, 1800, 1020);

  } else if (type === 'scene' && scene) {
    const themeHex = getThemeHex(scene.colorTheme);

    // Clean white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1920, 1080);

    // Top Accent Color Bar
    ctx.fillStyle = themeHex;
    ctx.fillRect(0, 0, 1920, 16);

    // Header Toolbar inside slide
    ctx.fillStyle = themeHex;
    ctx.font = `bold 22px ${fontSans}`;
    ctx.textAlign = 'left';
    ctx.fillText(`片段 ${String(scene.slideNumber).padStart(2, '0')} · 時間點: ${scene.timestamp}`, 120, 70);

    // Slide Title
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold 36px ${fontSans}`;
    drawWrappedText(ctx, scene.title, 120, 120, 1680, 46, 1);

    // Left Column: Video Frame Screenshot Image Card
    // Scaled down to refined 16:9 proportions (780 x 439) for crisp resolution and high quality
    const frameX = 120;
    const frameY = 175;
    const frameW = 780;
    const frameH = 439;

    // Load image directly via robust loadImage (handles data:, blob:, and http: with proxy fallback)
    let loadedImg = await loadImage(scene.imageUrl || '');
    if (!loadedImg && scene.imageUrl && !scene.imageUrl.startsWith('data:image')) {
      try {
        const converted = await convertUrlToDataUrl(scene.imageUrl);
        if (converted) {
          loadedImg = await loadImage(converted);
        }
      } catch {}
    }

    // 1. Draw frame container card (Dark slate monitor background)
    ctx.fillStyle = '#0f172a';
    ctx.roundRect(frameX, frameY, frameW, frameH, 16);
    ctx.fill();

    const imgW = (loadedImg as any)?.naturalWidth || (loadedImg as any)?.width || 0;
    const imgH = (loadedImg as any)?.naturalHeight || (loadedImg as any)?.height || 0;

    // 2. Draw Image with object-fit: contain logic to prevent distortion
    if (loadedImg && imgW > 0 && imgH > 0) {
      const scale = Math.min(frameW / imgW, frameH / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const drawX = frameX + (frameW - drawW) / 2;
      const drawY = frameY + (frameH - drawH) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(frameX, frameY, frameW, frameH, 16);
      ctx.clip();
      ctx.drawImage(loadedImg as any, drawX, drawY, drawW, drawH);
      ctx.restore();
    } else {
      // Draw rich visual scene representation with gradients and wave geometry (NEVER an empty box!)
      drawRichSceneVisual(ctx, frameX, frameY, frameW, frameH, scene.title, scene.timestamp, themeHex, sceneIndex || 0);
    }

    // Frame border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.5;
    ctx.roundRect(frameX, frameY, frameW, frameH, 16);
    ctx.stroke();

    // Timestamp Tag overlay on image
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeStyle = themeHex;
    ctx.lineWidth = 1.5;
    ctx.roundRect(frameX + frameW - 190, frameY + frameH - 56, 175, 42, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 20px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`⏱ ${scene.timestamp}`, frameX + frameW - 102, frameY + frameH - 28);

    // Left Column 2: Highlights / Badges Box (Underneath image)
    const badgeBoxY = frameY + frameH + 30;
    const badgeBoxH = 260;

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.roundRect(frameX, badgeBoxY, frameW, badgeBoxH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = themeHex;
    ctx.font = `bold 22px ${fontSans}`;
    ctx.textAlign = 'left';
    ctx.fillText('【核心重點標籤與關鍵詞】', frameX + 28, badgeBoxY + 45);

    if (scene.keyHighlights && scene.keyHighlights.length > 0) {
      let tagX = frameX + 28;
      let tagY = badgeBoxY + 75;

      scene.keyHighlights.forEach((tag) => {
        const tagText = `[ ${tag} ]`;
        ctx.font = `bold 20px ${fontSans}`;
        const tagWidth = ctx.measureText(tagText).width + 36;

        if (tagX + tagWidth > frameX + frameW - 20) {
          tagX = frameX + 28;
          tagY += 60;
        }

        ctx.fillStyle = `${themeHex}18`;
        ctx.strokeStyle = `${themeHex}66`;
        ctx.lineWidth = 2;
        ctx.roundRect(tagX, tagY, tagWidth, 44, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = themeHex;
        ctx.fillText(tagText, tagX + 18, tagY + 30);
        tagX += tagWidth + 18;
      });
    }

    // Right Column: Explanatory Content & In-depth Analysis
    // 1. Caption Box (畫面核心說明)
    const rightX = 940;
    const rightW = 860;
    const captionH = 340;

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.roundRect(rightX, frameY, rightW, captionH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = themeHex;
    ctx.font = `bold 24px ${fontSans}`;
    ctx.textAlign = 'left';
    ctx.fillText('【畫面核心說明】', rightX + 32, frameY + 48);

    ctx.fillStyle = '#334155';
    ctx.font = `normal 22px ${fontSans}`;
    drawWrappedText(ctx, scene.caption, rightX + 32, frameY + 100, rightW - 64, 40, 6);

    // 2. In-depth Analysis Box (深度觀點與商務洞察)
    const analysisY = frameY + captionH + 30;
    const analysisH = 360;

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.roundRect(rightX, analysisY, rightW, analysisH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = `bold 24px ${fontSans}`;
    ctx.fillText('【深度觀點與商務洞察】', rightX + 32, analysisY + 48);

    ctx.fillStyle = '#334155';
    ctx.font = `normal 22px ${fontSans}`;
    drawWrappedText(ctx, scene.analysis, rightX + 32, analysisY + 100, rightW - 64, 40, 6);

    // Slide footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = `normal 18px ${fontSans}`;
    ctx.textAlign = 'right';
    ctx.fillText(
      `${report.topic} · 頁次 ${(sceneIndex || 0) + 3} / ${report.scenes.length + 3}`,
      1800,
      1030
    );

  } else if (type === 'conclusion') {
    // Dark Slate Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.fillStyle = '#10b981';
    ctx.font = `bold 28px ${fontSans}`;
    ctx.fillText('【總結與應用建議】', 160, 240);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 48px ${fontSans}`;
    ctx.fillText('結論與行動啟示', 160, 320);

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.roundRect(160, 400, 1600, 420, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = `normal 30px ${fontSans}`;
    drawWrappedText(ctx, report.conclusion, 220, 480, 1480, 56, 6);

    ctx.fillStyle = '#64748b';
    ctx.font = `normal 24px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText('報告製作完成 · 感謝閱覽', 960, 960);
  }

  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Robust, 100% Reliable Client-Side PDF Presentation Generator
 * Eliminates html2canvas & oklch parsing errors completely!
 */
export async function exportReportToPDF(
  report: VideoReport,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const totalSlides = report.scenes.length + 3;

  // Pre-normalize scene images into base64 Data URLs if needed
  for (let i = 0; i < report.scenes.length; i++) {
    const s = report.scenes[i];
    if (s.imageUrl && !s.imageUrl.startsWith('data:image')) {
      try {
        const converted = await convertUrlToDataUrl(s.imageUrl);
        if (converted && converted.startsWith('data:image')) {
          s.imageUrl = converted;
        }
      } catch {}
    }
  }

  // Initialize jsPDF in A4 Landscape (297mm x 210mm)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // 1. Cover Slide
  if (onProgress) onProgress(1, totalSlides);
  const coverImg = await renderSlideToCanvas('cover', report);
  pdf.addImage(coverImg, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');

  // 2. Summary Slide
  if (onProgress) onProgress(2, totalSlides);
  const summaryImg = await renderSlideToCanvas('summary', report);
  pdf.addPage('a4', 'landscape');
  pdf.addImage(summaryImg, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');

  // 3. Scene Slides (with synchronized frames)
  for (let i = 0; i < report.scenes.length; i++) {
    if (onProgress) onProgress(i + 3, totalSlides);
    const scene = report.scenes[i];
    const sceneImg = await renderSlideToCanvas('scene', report, scene, i);
    pdf.addPage('a4', 'landscape');
    pdf.addImage(sceneImg, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
  }

  // 4. Conclusion Slide
  if (onProgress) onProgress(totalSlides, totalSlides);
  const conclusionImg = await renderSlideToCanvas('conclusion', report);
  pdf.addPage('a4', 'landscape');
  pdf.addImage(conclusionImg, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');

  const filename = `${report.topic.replace(/[/\\?%*:|"<>]/g, '_')}_影片報告.pdf`;
  pdf.save(filename);
}
