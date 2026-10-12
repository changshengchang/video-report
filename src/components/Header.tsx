import React from 'react';
import { FileText, Play, Download, Sparkles, Type } from 'lucide-react';

interface HeaderProps {
  currentFont: 'sans' | 'serif';
  onFontChange: (font: 'sans' | 'serif') => void;
  hasReport: boolean;
  onOpenExport: () => void;
  onOpenPresent: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentFont,
  onFontChange,
  hasReport,
  onOpenExport,
  onOpenPresent,
  onReset,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-700 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                影片內容介紹報告生成器
              </h1>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                繁體中文 · 思源體
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              智慧分析重要片段 · 截圖說明編輯 · 簡約/中等/詳細版 · PPT 簡報匯出
            </p>
          </div>
        </div>

        {/* Controls and Actions */}
        <div className="flex items-center gap-2.5">
          {/* Font Selection (思源黑體 vs 思源宋體) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/60 text-xs">
            <button
              type="button"
              onClick={() => onFontChange('sans')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                currentFont === 'sans'
                  ? 'bg-white text-indigo-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="切換為思源黑體 (現代俐落風格)"
            >
              <Type className="w-3.5 h-3.5 text-indigo-600" />
              <span>思源黑體</span>
            </button>
            <button
              type="button"
              onClick={() => onFontChange('serif')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-serif ${
                currentFont === 'serif'
                  ? 'bg-white text-indigo-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="切換為思源宋體 (經典典雅風格)"
            >
              <Type className="w-3.5 h-3.5 text-amber-600" />
              <span>思源宋體</span>
            </button>
          </div>

          {hasReport && (
            <>
              {/* Present button */}
              <button
                type="button"
                onClick={onOpenPresent}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-indigo-600" />
                全螢幕簡報
              </button>

              {/* Export button */}
              <button
                type="button"
                onClick={onOpenExport}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                下載 PPT 簡報
              </button>

              {/* Reset button */}
              <button
                type="button"
                onClick={onReset}
                className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="重新上傳與分析"
              >
                重新製作
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
