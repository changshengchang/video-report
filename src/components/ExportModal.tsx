import React, { useState } from 'react';
import { VideoReport } from '../types/report';
import { exportReportToPPTX } from '../utils/pptxExport';
import {
  X,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Monitor,
} from 'lucide-react';

interface ExportModalProps {
  report: VideoReport;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  report,
  onClose,
}) => {
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');
  const [exportErrorMsg, setExportErrorMsg] = useState('');

  // Handle PPTX export
  const handleExportPPTX = async () => {
    setIsExportingPptx(true);
    setExportSuccessMsg('');
    setExportErrorMsg('');

    try {
      await exportReportToPPTX(report);
      setExportSuccessMsg('PowerPoint (.pptx) 簡報檔案已成功生成並下載！');
    } catch (err: any) {
      console.error('PPTX export error:', err);
      setExportErrorMsg(err.message || 'PowerPoint 生成失敗，請再試一次');
    } finally {
      setIsExportingPptx(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-600" />
              <span>下載 PPT 簡報檔案</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              16:9 專業寬螢幕 PowerPoint 簡報，內嵌真實畫面截圖與繁體思源排版
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {exportSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportSuccessMsg}</span>
            </div>
          )}

          {exportErrorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{exportErrorMsg}</span>
            </div>
          )}

          {/* Primary PPT Presentation Card */}
          <div className="p-5 rounded-2xl border-2 border-indigo-200 bg-linear-to-b from-indigo-50/50 to-white shadow-xs space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900">
                    PowerPoint 簡報 (.pptx)
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                    PPT 格式
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  專為商務會議與正式簡報設計，內含封面頁、摘要大綱、各時序片段真實截圖、核心說明與醒目標籤。
                </p>
              </div>
            </div>

            {/* Spec Highlights */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-100/80 text-center">
              <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                <div className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-500" />
                  <span>簡報頁數</span>
                </div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {report.scenes.length + 3} 頁投影片
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                <div className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
                  <Monitor className="w-3 h-3 text-emerald-500" />
                  <span>畫面比例</span>
                </div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  16:9 寬螢幕
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                <div className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>字體排版</span>
                </div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  繁體思源黑體
                </div>
              </div>
            </div>

            {/* Main Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isExportingPptx}
                onClick={handleExportPPTX}
                className="w-full py-3.5 px-4 bg-linear-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExportingPptx ? '正在打包真實截圖並生成 PPT...' : '立即下載 PowerPoint (.pptx) 簡報'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>提示：下載後可直接以 Microsoft PowerPoint 或 Keynote 開啟</span>
          <button
            type="button"
            onClick={onClose}
            className="font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
