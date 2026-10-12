import React, { useState } from 'react';
import { SceneSlide, ColorTheme } from '../types/report';
import {
  Clock,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Camera,
  Upload,
  Sparkles,
  Maximize2,
  Tag,
  Copy,
} from 'lucide-react';

interface SlideCardProps {
  slide: SceneSlide;
  index: number;
  totalSlides: number;
  onEdit: (slide: SceneSlide) => void;
  onDelete: (slideId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDuplicate: (slide: SceneSlide) => void;
  onQuickUpdateCaption: (slideId: string, newCaption: string) => void;
  onUpdateImage?: (slideId: string, newImageUrl: string) => void;
  onCaptureFromCurrentPlayer?: () => void;
}

export const SlideCard: React.FC<SlideCardProps> = ({
  slide,
  index,
  totalSlides,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onQuickUpdateCaption,
  onUpdateImage,
}) => {
  const [isQuickEditingCaption, setIsQuickEditingCaption] = useState(false);
  const [quickCaption, setQuickCaption] = useState(slide.caption);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Handle direct file upload for this scene card
  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateImage) {
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        if (uploadEvt.target?.result) {
          onUpdateImage(slide.id, uploadEvt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag and drop image directly onto the slide image card
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/') && onUpdateImage) {
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        if (uploadEvt.target?.result) {
          onUpdateImage(slide.id, uploadEvt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle paste from clipboard directly on the slide card
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items && onUpdateImage) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (uploadEvt) => {
              if (uploadEvt.target?.result) {
                onUpdateImage(slide.id, uploadEvt.target.result as string);
              }
            };
            reader.readAsDataURL(file);
            e.preventDefault();
            break;
          }
        }
      }
    }
  };

  // Vibrant accent styling based on colorTheme
  const themeStyles: Record<
    ColorTheme,
    {
      bar: string;
      badgeBg: string;
      badgeText: string;
      badgeBorder: string;
      titleColor: string;
      tagBg: string;
      tagText: string;
      tagBorder: string;
    }
  > = {
    indigo: {
      bar: 'bg-indigo-600',
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-700',
      badgeBorder: 'border-indigo-200',
      titleColor: 'text-indigo-950',
      tagBg: 'bg-indigo-500/10',
      tagText: 'text-indigo-800',
      tagBorder: 'border-indigo-300',
    },
    emerald: {
      bar: 'bg-emerald-600',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
      titleColor: 'text-emerald-950',
      tagBg: 'bg-emerald-500/10',
      tagText: 'text-emerald-800',
      tagBorder: 'border-emerald-300',
    },
    amber: {
      bar: 'bg-amber-500',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
      titleColor: 'text-amber-950',
      tagBg: 'bg-amber-500/10',
      tagText: 'text-amber-900',
      tagBorder: 'border-amber-300',
    },
    rose: {
      bar: 'bg-rose-600',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
      titleColor: 'text-rose-950',
      tagBg: 'bg-rose-500/10',
      tagText: 'text-rose-800',
      tagBorder: 'border-rose-300',
    },
    cyan: {
      bar: 'bg-cyan-600',
      badgeBg: 'bg-cyan-50',
      badgeText: 'text-cyan-700',
      badgeBorder: 'border-cyan-200',
      titleColor: 'text-cyan-950',
      tagBg: 'bg-cyan-500/10',
      tagText: 'text-cyan-800',
      tagBorder: 'border-cyan-300',
    },
    violet: {
      bar: 'bg-violet-600',
      badgeBg: 'bg-violet-50',
      badgeText: 'text-violet-700',
      badgeBorder: 'border-violet-200',
      titleColor: 'text-violet-950',
      tagBg: 'bg-violet-500/10',
      tagText: 'text-violet-800',
      tagBorder: 'border-violet-300',
    },
  };

  const style = themeStyles[slide.colorTheme] || themeStyles.indigo;

  const handleSaveQuickCaption = () => {
    onQuickUpdateCaption(slide.id, quickCaption);
    setIsQuickEditingCaption(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group print-avoid-break">
      {/* Top Vibrant Color Strip */}
      <div className={`h-1.5 w-full ${style.bar}`} />

      {/* Card Header Toolbar */}
      <div className="p-4 sm:p-5 pb-3 flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/40">
        <div className="flex items-center gap-2">
          {/* Slide number pill */}
          <span
            className={`px-2.5 py-0.5 rounded-md text-xs font-bold border font-mono ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}
          >
            片段 {String(index + 1).padStart(2, '0')}
          </span>

          {/* Timestamp indicator */}
          <span className="flex items-center gap-1 text-xs font-mono font-semibold text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{slide.timestamp}</span>
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity no-print">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="上移"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={index === totalSlides - 1}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="下移"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(slide)}
            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 transition-colors"
            title="複製此頁"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(slide)}
            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 transition-colors"
            title="完整編輯"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(slide.id)}
            disabled={totalSlides <= 1}
            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="刪除片段"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3.5">
          {/* Prominent Slide Title */}
          <div className="flex items-start gap-2">
            <div className={`w-1 self-stretch rounded-full ${style.bar} shrink-0 mt-1`} />
            <h3 className={`text-base sm:text-lg font-black tracking-tight ${style.titleColor}`}>
              {slide.title}
            </h3>
          </div>

          {/* Screenshot Video Frame with Direct Upload / Drag-Drop / Paste */}
          <div
            tabIndex={0}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onPaste={handlePaste}
            className={`relative rounded-xl overflow-hidden border ${
              isDragOver ? 'border-indigo-500 ring-2 ring-indigo-400' : 'border-slate-200/90'
            } aspect-video bg-slate-900 shadow-2xs group/img outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleDirectFileUpload}
            />

            {slide.imageUrl ? (
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover transition-transform group-hover/img:scale-102 duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-900 p-4 text-center">
                <Camera className="w-6 h-6 text-slate-500 mb-1" />
                <span>尚未加入影片畫面截圖</span>
                <span className="text-[10px] text-slate-500 mt-0.5">點擊下方按鈕或按 Ctrl+V 貼上</span>
              </div>
            )}

            {/* Drag overlay notice */}
            {isDragOver && (
              <div className="absolute inset-0 bg-indigo-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold gap-1 z-20">
                <Upload className="w-6 h-6 animate-bounce" />
                <span>放開滑鼠立即更換此片段畫面</span>
              </div>
            )}

            {/* Floating Timestamp Tag */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-xs text-white text-[11px] font-mono font-medium shadow-xs border border-white/10 z-10">
              ⏱ {slide.timestamp}
            </div>

            {/* Quick Action Overlay (Always accessible on hover or focus) */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover/img:opacity-100 transition-opacity no-print z-10">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-black/80 hover:bg-indigo-600 text-white text-[11px] font-bold rounded-lg backdrop-blur-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                title="選取檔案上傳此秒數之實際畫面截圖"
              >
                <Upload className="w-3 h-3 text-indigo-300" />
                <span>更換截圖</span>
              </button>
              <button
                type="button"
                onClick={() => onEdit(slide)}
                className="p-1 bg-black/80 hover:bg-black/95 text-white rounded-lg backdrop-blur-xs flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                title="完整編輯此頁次"
              >
                <Edit2 className="w-3 h-3 text-slate-300" />
              </button>
            </div>
          </div>

          {/* 畫面說明 (Caption) with editable text feature */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${style.bar}`} />
                <span>畫面核心說明</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setQuickCaption(slide.caption);
                  setIsQuickEditingCaption(!isQuickEditingCaption);
                }}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer no-print"
              >
                {isQuickEditingCaption ? '收起' : '修改說明'}
              </button>
            </div>

            {!isQuickEditingCaption ? (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {slide.caption}
              </p>
            ) : (
              <div className="space-y-2 pt-1 no-print">
                <textarea
                  rows={3}
                  value={quickCaption}
                  onChange={(e) => setQuickCaption(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsQuickEditingCaption(false)}
                    className="px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-200 rounded"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveQuickCaption}
                    className="px-3 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-2xs"
                  >
                    儲存說明
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 深度剖析 (Analysis) */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/70 space-y-1">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>深度洞察與分析</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {slide.analysis}
            </p>
          </div>
        </div>

        {/* 鮮明核心標籤 (Key Highlights in vibrant colors) */}
        {slide.keyHighlights && slide.keyHighlights.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>鮮明標記:</span>
            </span>
            {slide.keyHighlights.map((hl, hlIdx) => (
              <span
                key={hlIdx}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${style.tagBg} ${style.tagText} ${style.tagBorder} tracking-wide`}
              >
                ★ {hl}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
