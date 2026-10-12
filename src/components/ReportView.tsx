import React, { useState } from 'react';
import { VideoReport, SceneSlide, ColorTheme } from '../types/report';
import { ThemeEditor } from './ThemeEditor';
import { SlideCard } from './SlideCard';
import { SlideEditModal } from './SlideEditModal';
import {
  Plus,
  Layers,
  Sparkles,
  Download,
  Play,
  FileText,
  Clock,
  Printer,
  Compass,
  ArrowRight,
  Bookmark,
} from 'lucide-react';
import { formatTime, generatePlaceholderFrame } from '../utils/videoUtils';

interface ReportViewProps {
  report: VideoReport;
  onUpdateReport: (updated: VideoReport) => void;
  onOpenExport: () => void;
  onOpenPresent: () => void;
  onRegenerateLevel: (level: 'simple' | 'medium' | 'detailed') => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  report,
  onUpdateReport,
  onOpenExport,
  onOpenPresent,
  onRegenerateLevel,
}) => {
  const [editingSlide, setEditingSlide] = useState<SceneSlide | null>(null);

  // Update Topic
  const handleUpdateTopic = (newTopic: string, newSubtitle: string) => {
    onUpdateReport({
      ...report,
      topic: newTopic,
      subtitle: newSubtitle,
    });
  };

  // Update Slide
  const handleSaveSlide = (updatedSlide: SceneSlide) => {
    const updatedScenes = report.scenes.map((s) =>
      s.id === updatedSlide.id ? updatedSlide : s
    );
    onUpdateReport({
      ...report,
      scenes: updatedScenes,
    });
  };

  // Quick Caption Update
  const handleQuickUpdateCaption = (slideId: string, newCaption: string) => {
    const updatedScenes = report.scenes.map((s) =>
      s.id === slideId ? { ...s, caption: newCaption } : s
    );
    onUpdateReport({
      ...report,
      scenes: updatedScenes,
    });
  };

  // Direct Image Update
  const handleUpdateSlideImage = (slideId: string, newImageUrl: string) => {
    const updatedScenes = report.scenes.map((s) =>
      s.id === slideId ? { ...s, imageUrl: newImageUrl } : s
    );
    onUpdateReport({
      ...report,
      scenes: updatedScenes,
    });
  };

  // Delete Slide
  const handleDeleteSlide = (slideId: string) => {
    const filtered = report.scenes.filter((s) => s.id !== slideId);
    // Renumber
    const renumbered = filtered.map((s, idx) => ({
      ...s,
      slideNumber: idx + 1,
    }));
    onUpdateReport({
      ...report,
      scenes: renumbered,
    });
  };

  // Move Slide Up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newScenes = [...report.scenes];
    const temp = newScenes[index];
    newScenes[index] = newScenes[index - 1];
    newScenes[index - 1] = temp;
    // Renumber
    const renumbered = newScenes.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    onUpdateReport({ ...report, scenes: renumbered });
  };

  // Move Slide Down
  const handleMoveDown = (index: number) => {
    if (index >= report.scenes.length - 1) return;
    const newScenes = [...report.scenes];
    const temp = newScenes[index];
    newScenes[index] = newScenes[index + 1];
    newScenes[index + 1] = temp;
    // Renumber
    const renumbered = newScenes.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    onUpdateReport({ ...report, scenes: renumbered });
  };

  // Duplicate Slide
  const handleDuplicateSlide = (slide: SceneSlide) => {
    const newSlide: SceneSlide = {
      ...slide,
      id: `scene-${Date.now()}`,
      title: `${slide.title} (複本)`,
      slideNumber: report.scenes.length + 1,
    };
    onUpdateReport({
      ...report,
      scenes: [...report.scenes, newSlide],
    });
  };

  // Add New Custom Slide
  const handleAddNewSlide = () => {
    const newNum = report.scenes.length + 1;
    const placeholderImg = generatePlaceholderFrame(`新增片段 ${newNum}`, '00:00');
    const newSlide: SceneSlide = {
      id: `scene-${Date.now()}`,
      slideNumber: newNum,
      title: `片段 ${newNum}：自訂重點議題`,
      timestamp: '00:00',
      caption: '請在此輸入該畫面之主要說明文字與內容概述。',
      analysis: '請補充深入洞察與建議。',
      keyHighlights: ['重點聚焦', '關鍵指標'],
      colorTheme: 'indigo',
      imageUrl: placeholderImg,
    };
    onUpdateReport({
      ...report,
      scenes: [...report.scenes, newSlide],
    });
    setEditingSlide(newSlide);
  };

  return (
    <div className="space-y-8">
      {/* 1. Theme Editor Component */}
      <ThemeEditor
        topic={report.topic}
        subtitle={report.subtitle}
        category={report.category}
        onUpdateTopic={handleUpdateTopic}
        videoTitle={report.videoName}
        detailLevel={report.detailLevel}
      />

      {/* 2. Executive Summary & Highlights */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              影片總體摘要與核心重點（繁體中文 · 思源體排版）
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {report.detailLevelName} · 共 {report.scenes.length} 個分析片段
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Executive Summary */}
          <div className="lg:col-span-7 bg-slate-50/80 rounded-xl p-5 border border-slate-200/70 space-y-2">
            <h4 className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>執行摘要總覽</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {report.summary}
            </p>
          </div>

          {/* Key Takeaways */}
          <div className="lg:col-span-5 bg-slate-50/80 rounded-xl p-5 border border-slate-200/70 space-y-3">
            <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>核心價值亮點（鮮明醒目標示）</span>
            </h4>
            <div className="space-y-2.5">
              {report.keyTakeaways.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className="font-bold text-indigo-700 bg-indigo-100/90 border border-indigo-200 px-2 py-0.5 rounded-md shrink-0">
                    {item.badge}
                  </span>
                  <span className="text-slate-700 leading-relaxed font-medium">
                    {item.point}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Scenes / Slides Section */}
      <div className="space-y-4">
        {/* Section Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>重要片段畫面截圖與說明（{report.scenes.length} 頁）</span>
            </h3>
            <p className="text-xs text-slate-500">
              每頁均附畫面截圖與可修改之說明文字，核心關鍵字均以鮮明醒目顏色標記
            </p>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleAddNewSlide}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>新增片段頁次</span>
            </button>

            <button
              type="button"
              onClick={onOpenPresent}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <Play className="w-3.5 h-3.5 text-indigo-600" />
              <span>全螢幕簡報播放</span>
            </button>

            <button
              type="button"
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-sm shadow-indigo-600/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下載 PPT 簡報</span>
            </button>
          </div>
        </div>

        {/* Sync & Replacement Guidance Banner */}
        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3 text-xs text-indigo-900 no-print">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>畫面精準對齊提示：</strong>每個片段均可點擊「更換截圖」直接上傳實際畫面，或將截圖直接拖入卡片 / 按 Ctrl+V 貼上，匯出 PPT 簡報均完整收錄！
            </span>
          </div>
        </div>

        {/* Scene Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {report.scenes.map((scene, index) => (
            <SlideCard
              key={scene.id}
              slide={scene}
              index={index}
              totalSlides={report.scenes.length}
              onEdit={(s) => setEditingSlide(s)}
              onDelete={handleDeleteSlide}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onDuplicate={handleDuplicateSlide}
              onQuickUpdateCaption={handleQuickUpdateCaption}
              onUpdateImage={handleUpdateSlideImage}
            />
          ))}
        </div>
      </div>

      {/* 4. Conclusion & Recommendations */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Bookmark className="w-4 h-4 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">
            報告總結與建議應用方向
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
          {report.conclusion}
        </p>
      </div>

      {/* Edit Modal */}
      {editingSlide && (
        <SlideEditModal
          slide={editingSlide}
          onSave={handleSaveSlide}
          onClose={() => setEditingSlide(null)}
        />
      )}
    </div>
  );
};
