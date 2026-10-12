import React, { useState } from 'react';
import { SceneSlide, ColorTheme } from '../types/report';
import {
  X,
  Check,
  Sparkles,
  Camera,
  Upload,
  Tag,
  Palette,
  RefreshCw,
  FileText,
  Clock,
} from 'lucide-react';

interface SlideEditModalProps {
  slide: SceneSlide;
  onSave: (updatedSlide: SceneSlide) => void;
  onClose: () => void;
}

export const SlideEditModal: React.FC<SlideEditModalProps> = ({
  slide,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(slide.title);
  const [timestamp, setTimestamp] = useState(slide.timestamp);
  const [caption, setCaption] = useState(slide.caption);
  const [analysis, setAnalysis] = useState(slide.analysis);
  const [colorTheme, setColorTheme] = useState<ColorTheme>(slide.colorTheme);
  const [imageUrl, setImageUrl] = useState(slide.imageUrl || '');
  const [highlights, setHighlights] = useState<string[]>([...slide.keyHighlights]);
  const [newTagInput, setNewTagInput] = useState('');

  // AI Refine state
  const [isRefining, setIsRefining] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');

  const colorThemes: { id: ColorTheme; name: string; bgClass: string; textClass: string; borderClass: string }[] = [
    { id: 'indigo', name: '經典靛藍', bgClass: 'bg-indigo-600', textClass: 'text-indigo-600', borderClass: 'border-indigo-600' },
    { id: 'emerald', name: '翡翠綠', bgClass: 'bg-emerald-600', textClass: 'text-emerald-600', borderClass: 'border-emerald-600' },
    { id: 'amber', name: '琥珀金', bgClass: 'bg-amber-600', textClass: 'text-amber-600', borderClass: 'border-amber-600' },
    { id: 'rose', name: '玫瑰紅', bgClass: 'bg-rose-600', textClass: 'text-rose-600', borderClass: 'border-rose-600' },
    { id: 'cyan', name: '科技青', bgClass: 'bg-cyan-600', textClass: 'text-cyan-600', borderClass: 'border-cyan-600' },
    { id: 'violet', name: '優雅紫', bgClass: 'bg-violet-600', textClass: 'text-violet-600', borderClass: 'border-violet-600' },
  ];

  const handleAddHighlight = () => {
    if (newTagInput.trim() && !highlights.includes(newTagInput.trim())) {
      setHighlights([...highlights, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveHighlight = (tagToRemove: string) => {
    setHighlights(highlights.filter((t) => t !== tagToRemove));
  };

  // Upload local replacement image
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setImageUrl(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Refine caption & analysis
  const handleAiRefine = async () => {
    setIsRefining(true);
    try {
      const res = await fetch('/api/refine-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTitle: title,
          currentCaption: caption,
          currentAnalysis: analysis,
          instruction: refineInstruction || '以商務嚴謹、生動且具體之繁體中文重新優化，提煉精闢亮點',
        }),
      });
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.caption) setCaption(data.caption);
      if (data.analysis) setAnalysis(data.analysis);
      if (data.keyHighlights && Array.isArray(data.keyHighlights)) {
        setHighlights(data.keyHighlights);
      }
    } catch (err) {
      console.error('AI refine error:', err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...slide,
      title: title.trim(),
      timestamp: timestamp.trim(),
      caption: caption.trim(),
      analysis: analysis.trim(),
      colorTheme,
      imageUrl,
      keyHighlights: highlights,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold font-mono">
              {String(slide.slideNumber).padStart(2, '0')}
            </span>
            <h3 className="text-base font-bold text-slate-900">
              編輯片段內容與畫面說明
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Top row: Title and Timestamp */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                片段標題（鮮明醒目）
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                placeholder="輸入此片段的重點標題..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>時間點</span>
              </label>
              <input
                type="text"
                required
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono text-center bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                placeholder="00:45"
              />
            </div>
          </div>

          {/* Image & Frame Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>影片畫面截圖</span>
              </span>
              <label className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>上傳替換圖片</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            </label>

            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-black max-h-48 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/75 text-white font-mono text-xs">
                  ⏱ {timestamp}
                </span>
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 bg-slate-50">
                尚未設定截圖畫面
              </div>
            )}
          </div>

          {/* Caption (畫面核心說明) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>畫面說明（佐以畫面之核心描述，支援修改）</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {caption.length} 字
              </span>
            </div>
            <textarea
              rows={3}
              required
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
              placeholder="請輸入畫面佐以之詳細說明文字..."
            />
          </div>

          {/* In-depth Analysis (深度觀點與洞察) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>深度觀點與商務洞察（專業分析要點）</span>
            </label>
            <textarea
              rows={3}
              required
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
              placeholder="輸入對於此片段之深度商務或專業洞察..."
            />
          </div>

          {/* AI One-Click Refinement */}
          <div className="p-3 bg-linear-to-r from-indigo-50/60 to-amber-50/60 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left w-full sm:w-auto">
              <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Gemini 智慧文字潤飾助手</span>
              </div>
              <p className="text-[11px] text-slate-500">
                依據商務水準自動重寫畫面說明、強化結論說服力
              </p>
            </div>
            <button
              type="button"
              disabled={isRefining}
              onClick={handleAiRefine}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isRefining ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AI 潤飾中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>一鍵 AI 潤飾說明</span>
                </>
              )}
            </button>
          </div>

          {/* Key Highlight Badges (鮮明顏色標記) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>重要核心亮點詞彙（鮮明醒目顏色標識）</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {highlights.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHighlight(tag)}
                    className="hover:text-rose-600 text-slate-400 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddHighlight();
                    }
                  }}
                  placeholder="+ 新增亮點關鍵詞"
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-500 w-32"
                />
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md"
                >
                  新增
                </button>
              </div>
            </div>
          </div>

          {/* Color Theme Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <span>鮮明標籤主題顏色</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {colorThemes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColorTheme(c.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    colorTheme === c.id
                      ? `${c.borderClass} bg-slate-50 ring-2 ring-indigo-500/20`
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${c.bgClass}`} />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>確認儲存變更</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
