import React, { useState, useEffect } from 'react';
import { VideoReport, ColorTheme } from '../types/report';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

interface PresentationModalProps {
  report: VideoReport;
  onClose: () => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  report,
  onClose,
}) => {
  // Slides breakdown:
  // Slide 0: Cover
  // Slide 1: Summary & Takeaways
  // Slide 2 ... N+1: Scenes
  // Slide N+2: Conclusion
  const totalSlides = report.scenes.length + 3;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides, onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Color mapping helper
  const getColorClasses = (colorTheme: ColorTheme) => {
    switch (colorTheme) {
      case 'emerald':
        return { text: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-500/20' };
      case 'amber':
        return { text: 'text-amber-400', border: 'border-amber-500', bg: 'bg-amber-500/20' };
      case 'rose':
        return { text: 'text-rose-400', border: 'border-rose-500', bg: 'bg-rose-500/20' };
      case 'cyan':
        return { text: 'text-cyan-400', border: 'border-cyan-500', bg: 'bg-cyan-500/20' };
      case 'violet':
        return { text: 'text-violet-400', border: 'border-violet-500', bg: 'bg-violet-500/20' };
      case 'indigo':
      default:
        return { text: 'text-indigo-400', border: 'border-indigo-500', bg: 'bg-indigo-500/20' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none no-print">
      {/* Top Floating Controls */}
      <div className="p-4 sm:p-6 flex items-center justify-between z-10 bg-linear-to-b from-slate-950/80 to-transparent">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-indigo-400 bg-indigo-950/70 border border-indigo-800/80 px-2.5 py-1 rounded-md">
            全螢幕簡報模式
          </span>
          <span className="text-sm font-semibold text-slate-300 truncate max-w-xs sm:max-w-md">
            {report.topic}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="切換全螢幕"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="關閉簡報"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Stage */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 max-w-6xl mx-auto w-full">
        {/* SLIDE 0: Cover */}
        {currentSlideIndex === 0 && (
          <div className="text-center space-y-6 max-w-3xl animate-in fade-in duration-300">
            <span className="inline-block px-3.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-sm font-bold tracking-wider">
              【{report.detailLevelName}】 · 影片內容介紹報告
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {report.topic}
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
              {report.subtitle}
            </p>
            <div className="pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
              <span>影片: {report.videoName || '自訂影片'}</span>
              <span>·</span>
              <span>報告片段: {report.scenes.length} 頁</span>
              <span>·</span>
              <span>製作日期: {report.createdAt}</span>
            </div>
          </div>
        )}

        {/* SLIDE 1: Executive Summary */}
        {currentSlideIndex === 1 && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-400 tracking-wider">01 // 總體概覽</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">影片整體內容摘要與核心重點</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-indigo-400">【執行摘要】</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {report.summary}
                </p>
              </div>

              <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-emerald-400">【核心價值亮點】</h3>
                <div className="space-y-3">
                  {report.keyTakeaways.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <span className="font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800 shrink-0">
                        {item.badge}
                      </span>
                      <span className="leading-relaxed">{item.point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDES 2 ... N+1: Scene Slides */}
        {currentSlideIndex >= 2 && currentSlideIndex <= report.scenes.length + 1 && (
          (() => {
            const scene = report.scenes[currentSlideIndex - 2];
            const colors = getColorClasses(scene.colorTheme);

            return (
              <div className="w-full space-y-5 animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                      片段 {String(scene.slideNumber).padStart(2, '0')}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{scene.timestamp}</span>
                    </span>
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {scene.title}
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Frame Image */}
                  <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video relative shadow-xl">
                    {scene.imageUrl ? (
                      <img
                        src={scene.imageUrl}
                        alt={scene.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                        截取畫面
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-black/80 font-mono text-xs text-white">
                      ⏱ {scene.timestamp}
                    </div>
                  </div>

                  {/* Right: Caption & Analysis */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-2">
                      <div className={`text-xs font-bold ${colors.text}`}>
                        【畫面核心說明】
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed font-normal">
                        {scene.caption}
                      </p>
                    </div>

                    <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>【深度觀點與洞察】</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {scene.analysis}
                      </p>
                    </div>

                    {/* Highlights */}
                    {scene.keyHighlights && scene.keyHighlights.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {scene.keyHighlights.map((hl, hlIdx) => (
                          <span
                            key={hlIdx}
                            className={`text-xs font-bold px-2.5 py-1 rounded-md border ${colors.bg} ${colors.text} ${colors.border}`}
                          >
                            ★ {hl}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* FINAL SLIDE: Conclusion */}
        {currentSlideIndex === totalSlides - 1 && (
          <div className="text-center space-y-6 max-w-3xl animate-in fade-in duration-300">
            <span className="inline-block px-3.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-sm font-bold tracking-wider">
              總結與應用建議
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              結論與行動啟示
            </h2>
            <div className="bg-slate-900/90 rounded-2xl p-8 border border-slate-800 text-left">
              <p className="text-base sm:text-lg text-slate-200 leading-relaxed">
                {report.conclusion}
              </p>
            </div>
            <p className="text-sm text-slate-500 font-mono">
              報告展示結束 · 可按鍵盤 Esc 鍵返回
            </p>
          </div>
        )}
      </div>

      {/* Bottom Floating Navigation Bar */}
      <div className="p-4 sm:p-6 flex items-center justify-between z-10 bg-linear-to-t from-slate-950/80 to-transparent">
        <button
          type="button"
          onClick={() => setCurrentSlideIndex((prev) => Math.max(prev - 1, 0))}
          disabled={currentSlideIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>上一頁</span>
        </button>

        {/* Page progress indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-400">
            {currentSlideIndex + 1} / {totalSlides}
          </span>
          <div className="w-32 sm:w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-200"
              style={{ width: `${((currentSlideIndex + 1) / totalSlides) * 100}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCurrentSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1))}
          disabled={currentSlideIndex === totalSlides - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-lg shadow-indigo-600/30"
        >
          <span>下一頁</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
