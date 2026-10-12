/**
 * Video Utilities for High-Resolution Frame Capture, Time formatting,
 * YouTube URL handling, and Multi-Timestamp Frame Extraction
 */

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Returns high-definition YouTube thumbnail URLs
 * Prioritizes 1080p (maxresdefault) and 480p (hqdefault/sddefault) over low-res previews
 */
export function getYouTubeThumbnail(videoId: string, index = 0): string {
  // Try high definition options first
  if (index === 0) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  if (index === 1) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  if (index === 2) return `https://img.youtube.com/vi/${videoId}/sddefault.jpg`;
  if (index === 3) return `https://img.youtube.com/vi/${videoId}/hq720.jpg`;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hrs = Math.floor(mins / 60);

  if (hrs > 0) {
    const remMins = mins % 60;
    return `${hrs.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  } else if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  return 0;
}

/**
 * Capture current frame from an HTML5 Video element in high resolution (up to 1920x1080)
 */
export function captureVideoFrame(
  videoElement: HTMLVideoElement,
  preferredWidth = 1920,
  preferredHeight = 1080
): string | null {
  try {
    const nativeWidth = videoElement.videoWidth || preferredWidth;
    const nativeHeight = videoElement.videoHeight || preferredHeight;

    // Use native resolution or high-res target, maintaining aspect ratio
    const width = Math.min(1920, Math.max(1280, nativeWidth));
    const height = Math.min(1080, Math.max(720, nativeHeight));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(videoElement, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (err) {
    console.warn('Canvas frame capture error (possibly CORS):', err);
    return null;
  }
}

/**
 * Capture frame at a specific timestamp by seeking the video
 */
export async function captureFrameAtTime(
  videoElement: HTMLVideoElement,
  targetTime: number
): Promise<string | null> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      videoElement.removeEventListener('seeked', onSeeked);
      const dataUrl = captureVideoFrame(videoElement);
      resolve(dataUrl);
    };

    videoElement.addEventListener('seeked', onSeeked, { once: true });
    videoElement.currentTime = targetTime;

    // Timeout safety
    setTimeout(() => {
      videoElement.removeEventListener('seeked', onSeeked);
      resolve(captureVideoFrame(videoElement));
    }, 1500);
  });
}

/**
 * Sequentially seek and extract distinct real video frames for a list of timestamps
 * in full 1080p high resolution.
 * Supports:
 * 1. Server-side YouTube storyboard & keyframe extraction via ffmpeg
 * 2. On-screen mounted HTMLVideoElement frame seeking
 * 3. Off-screen DOM-attached video decoding with CORS video proxy
 */
export async function extractUniqueFramesForTimestamps(
  videoSourceUrl: string,
  timestamps: number[],
  videoElement?: HTMLVideoElement | null,
  width = 1920,
  height = 1080
): Promise<Map<number, string>> {
  const results = new Map<number, string>();
  if (!videoSourceUrl || timestamps.length === 0) return results;

  // 1. If YouTube URL, extract real frames from storyboards on the backend
  const ytId = extractYouTubeId(videoSourceUrl);
  if (ytId) {
    try {
      const res = await fetch('/api/extract-youtube-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoSourceUrl, timestamps }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.frames && Array.isArray(json.frames) && json.frames.length > 0) {
          const map = new Map<number, string>();
          json.frames.forEach((f: any) => {
            map.set(Number(f.timestamp), f.dataUrl);
          });
          return map;
        }
      }
    } catch (e) {
      console.warn('Backend YouTube frame extraction failed, falling back:', e);
    }
  } else if (
    videoSourceUrl.startsWith('http://') ||
    videoSourceUrl.startsWith('https://')
  ) {
    // 1b. Remote HTTP(S) video (MP4/WebM/Stream): Use high-precision FFmpeg extraction on backend
    try {
      const res = await fetch('/api/extract-remote-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoSourceUrl, timestamps }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.frames && Array.isArray(json.frames) && json.frames.length > 0) {
          const map = new Map<number, string>();
          json.frames.forEach((f: any) => {
            map.set(Number(f.timestamp), f.dataUrl);
          });
          if (map.size > 0) return map;
        }
      }
    } catch (e) {
      console.warn('Backend remote FFmpeg frame extraction failed, trying client side:', e);
    }
  }

  // 2. If mounted videoElement is provided and ready, seek and capture directly
  if (videoElement && (videoElement.readyState >= 1 || videoElement.videoWidth > 0)) {
    try {
      const origTime = videoElement.currentTime;
      const wasPlaying = !videoElement.paused;
      if (wasPlaying) videoElement.pause();

      const map = new Map<number, string>();
      let previousFrameData = '';

      for (const targetSec of timestamps) {
        const maxDur = videoElement.duration || 300;
        const safeTime = Math.max(0.1, Math.min(targetSec, maxDur - 0.2));

        await new Promise<void>((resSeek) => {
          let resolved = false;
          const finish = () => {
            if (resolved) return;
            resolved = true;
            videoElement.removeEventListener('seeked', onSeeked);

            // Double requestAnimationFrame ensures browser compositing has flushed new decoded frame to the video surface
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const frame = captureVideoFrame(videoElement, width, height);
                if (frame) {
                  previousFrameData = frame;
                  map.set(targetSec, frame);
                }
                resSeek();
              });
            });
          };

          const onSeeked = () => finish();
          videoElement.addEventListener('seeked', onSeeked, { once: true });
          videoElement.currentTime = safeTime;
          setTimeout(finish, 1400); // 1400ms safety timeout per frame
        });
      }

      // Restore playback state
      videoElement.currentTime = origTime;
      if (wasPlaying) {
        try {
          videoElement.play();
        } catch {}
      }

      if (map.size > 0) {
        return map;
      }
    } catch (err) {
      console.warn('Mounted video element seek capture failed, trying offscreen:', err);
    }
  }

  // 3. Fallback: Create off-screen video element attached to DOM
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.style.cssText =
      'position:fixed;left:-9999px;top:-9999px;width:640px;height:360px;opacity:0.01;pointer-events:none;';
    document.body.appendChild(video);

    const isBlobOrData =
      videoSourceUrl.startsWith('blob:') || videoSourceUrl.startsWith('data:');
    if (!isBlobOrData) {
      video.crossOrigin = 'anonymous';
    }
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    let isCleanedUp = false;
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      } catch {}
    };

    let currentIndex = 0;

    const captureCurrent = () => {
      try {
        const frame = captureVideoFrame(video, width, height);
        if (frame) {
          results.set(timestamps[currentIndex], frame);
        }
      } catch (err) {
        console.warn('Frame capture error at sec', timestamps[currentIndex], err);
      }

      currentIndex++;
      if (currentIndex < timestamps.length) {
        seekToNext();
      } else {
        cleanup();
        resolve(results);
      }
    };

    const seekToNext = () => {
      if (currentIndex >= timestamps.length) {
        cleanup();
        resolve(results);
        return;
      }

      const targetSec = timestamps[currentIndex];
      const maxDuration = video.duration || 300;
      const safeTime = Math.min(Math.max(0.2, targetSec), Math.max(0.5, maxDuration - 0.2));

      let seekFinished = false;
      const onSeeked = () => {
        if (seekFinished) return;
        seekFinished = true;
        video.removeEventListener('seeked', onSeeked);

        if ('requestVideoFrameCallback' in video) {
          (video as any).requestVideoFrameCallback(() => {
            setTimeout(captureCurrent, 30);
          });
          setTimeout(captureCurrent, 180);
        } else {
          requestAnimationFrame(() => {
            setTimeout(captureCurrent, 80);
          });
        }
      };

      video.addEventListener('seeked', onSeeked, { once: true });
      video.currentTime = safeTime;

      setTimeout(() => {
        if (!seekFinished) {
          seekFinished = true;
          video.removeEventListener('seeked', onSeeked);
          captureCurrent();
        }
      }, 1500);
    };

    let hasStarted = false;
    const startSeeking = () => {
      if (hasStarted) return;
      hasStarted = true;
      seekToNext();
    };

    video.oncanplay = startSeeking;
    video.onloadeddata = startSeeking;
    video.onloadedmetadata = () => {
      setTimeout(startSeeking, 300);
    };

    video.onerror = () => {
      console.warn('Offscreen video failed to load for frame extraction');
      cleanup();
      resolve(results);
    };

    // Overall timeout safety (max 10 seconds)
    setTimeout(() => {
      if (!isCleanedUp) {
        cleanup();
        resolve(results);
      }
    }, 10000);

    // If remote URL and not blob/data, proxy it through /api/proxy-video for guaranteed CORS
    if (
      !isBlobOrData &&
      (videoSourceUrl.startsWith('http://') || videoSourceUrl.startsWith('https://'))
    ) {
      video.src = `/api/proxy-video?url=${encodeURIComponent(videoSourceUrl)}`;
    } else {
      video.src = videoSourceUrl;
    }
    video.load();
  });
}

/**
 * Convert any image URL (HTTP/HTTPS/Blob) to high-resolution base64 Data URL
 * Uses server-side proxy for remote URLs to avoid CORS tainting
 */
export async function convertUrlToDataUrl(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:image')) return url;

  // 1. If Blob URL, convert directly via FileReader
  if (url.startsWith('blob:')) {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || url);
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Blob to dataUrl failed:', e);
      return url;
    }
  }

  // 2. If Remote HTTP/HTTPS, fetch via backend proxy to eliminate CORS & canvas tainting
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (json.dataUrl) {
          return json.dataUrl;
        }
      }
    } catch (e) {
      console.warn('Proxy image fetch failed, trying direct load:', e);
    }
  }

  // 3. Fallback to client-side canvas extraction
  return new Promise((resolve) => {
    const img = new Image();
    if (!url.startsWith('data:') && !url.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1280;
        canvas.height = img.naturalHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.95));
          return;
        }
      } catch (err) {
        console.warn('Canvas conversion error:', err);
      }
      resolve(url);
    };
    img.onerror = () => resolve(url);
    img.src = url;
    setTimeout(() => resolve(url), 3000);
  });
}

/**
 * Generate a dynamic, unique, high-resolution 1920x1080 aesthetic scene frame
 * with vivid gradients, technical grid, waveform geometry, and timestamp tags.
 */
export function generatePlaceholderFrame(
  title: string,
  timestamp: string,
  colorHex = '#3b82f6',
  sceneIndex = 0
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Palette schemes for unique scene backgrounds
  const palettes = [
    { start: '#0b1120', mid: '#1e1b4b', end: '#312e81', accent: '#6366f1' }, // Indigo
    { start: '#022c22', mid: '#064e3b', end: '#065f46', accent: '#10b981' }, // Emerald
    { start: '#451a03', mid: '#78350f', end: '#92400e', accent: '#f59e0b' }, // Amber
    { start: '#4c0519', mid: '#881337', end: '#9f1239', accent: '#f43f5e' }, // Rose
    { start: '#083344', mid: '#164e63', end: '#155e75', accent: '#06b6d4' }, // Cyan
    { start: '#2e1065', mid: '#4c1d95', end: '#5b21b6', accent: '#8b5cf6' }, // Violet
    { start: '#0f172a', mid: '#1e293b', end: '#334155', accent: '#38bdf8' }, // Slate
  ];

  const palette = palettes[sceneIndex % palettes.length];

  // 1. Dynamic linear gradient background
  const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
  gradient.addColorStop(0, palette.start);
  gradient.addColorStop(0.5, palette.mid);
  gradient.addColorStop(1, palette.end);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1920, 1080);

  // 2. Geometric waveform / audio curve tailored to scene index
  ctx.strokeStyle = `${palette.accent}33`;
  ctx.lineWidth = 3;
  const waveOffset = (sceneIndex * 45) % 180;
  for (let wave = 0; wave < 6; wave++) {
    ctx.beginPath();
    for (let x = 0; x <= 1920; x += 40) {
      const y = 540 + Math.sin((x + waveOffset + wave * 90) * 0.006) * (120 + wave * 30);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // 3. Grid dots
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let x = 60; x < 1920; x += 100) {
    for (let y = 60; y < 1080; y += 100) {
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Center Video Monitor Screen Card
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.strokeStyle = `${palette.accent}aa`;
  ctx.lineWidth = 4;
  ctx.roundRect(400, 160, 1120, 680, 28);
  ctx.fill();
  ctx.stroke();

  // Glow halo inside
  const glow = ctx.createRadialGradient(960, 500, 40, 960, 500, 500);
  glow.addColorStop(0, `${palette.accent}44`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fill();

  // 5. Scene Number & Play Indicator
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(960, 480, 64, 0, Math.PI * 2);
  ctx.fill();

  // Play triangle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(948, 458);
  ctx.lineTo(984, 480);
  ctx.lineTo(948, 502);
  ctx.closePath();
  ctx.fill();

  // 6. Top Scene Tag inside frame
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.roundRect(460, 210, 280, 56, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Noto Sans TC", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`片段 0${sceneIndex + 1} 重點畫面截取`, 600, 248);

  // 7. Prominent Timestamp Badge
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2.5;
  ctx.roundRect(1440, 930, 380, 85, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`⏱ 時間點 ${timestamp}`, 1630, 985);

  // 8. Lower Third Title Banner
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = `${palette.accent}88`;
  ctx.lineWidth = 2;
  ctx.roundRect(100, 890, 1260, 125, 20);
  ctx.fill();
  ctx.stroke();

  // Color Accent bar
  ctx.fillStyle = palette.accent;
  ctx.fillRect(120, 915, 10, 75);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px "Noto Sans TC", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, 150, 968);

  return canvas.toDataURL('image/jpeg', 0.95);
}
