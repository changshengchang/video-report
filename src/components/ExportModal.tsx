import React, { useState } from 'react';
import { VideoReport } from '../types/report';
import { exportReportToPPTX } from '../utils/pptxExport';
import {
  X,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCode,
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

  // Handle Markdown Export
  const handleExportMarkdown = () => {
    let md = `# ${report.topic}\n\n`;
    md += `> **${report.subtitle}**\n\n`;
    md += `- **報告規格**: ${report.detailLevelName}\n`;
    md += `- **影片來源**: ${report.videoName || report.videoUrl || '自訂影片'}\n`;
    md += `- **產出時間**: ${report.createdAt}\n`;
    md += `- **片段總數**: ${report.scenes.length} 頁\n\n`;
    md += `---\n\n`;
    md += `## 01. 影片整體內容摘要\n\n${report.summary}\n\n`;
    md += `### 核心價值亮點\n\n`;
    report.keyTakeaways.forEach((item) => {
      md += `- **[${item.badge}]**: ${item.point}\n`;
    });
    md += `\n---\n\n`;
    md += `## 02. 重要片段畫面截圖與說明\n\n`;

    report.scenes.forEach((scene, idx) => {
      md += `### 片段 ${idx + 1}: ${scene.title} (⏱ ${scene.timestamp})\n\n`;
      md += `**畫面說明**: ${scene.caption}\n\n`;
      md += `**深度觀點**: ${scene.analysis}\n\n`;
      if (scene.keyHighlights?.length) {
        md += `**鮮明核心標籤**: ${scene.keyHighlights.join(', ')}\n\n`;
      }
      md += `---\n\n`;
    });

    md += `## 03. 總結與應用建議\n\n${report.conclusion}\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.topic.replace(/[/\\?%*:|"<>]/g, '_')}_影片報告.md`;
    link.click();
    URL.revokeObjectURL(url);
    setExportSuccessMsg('Markdown (.md) 文件已成功下載！');
  };

  // Handle JSON Export
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.topic.replace(/[/\\?%*:|"<>]/g, '_')}_報告資料.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExportSuccessMsg('JSON 報告備份檔案已成功下載！');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-600" />
              <span>匯出與下載報告簡報（PPT 格式）</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              可直接在 PowerPoint / Keynote 開啟編輯，完整收錄各片段截圖與繁體思源排版
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {exportSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportSuccessMsg}</span>
            </div>
          )}

          {exportErrorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{exportErrorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Primary Option: PowerPoint (.pptx) */}
            <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70 transition-all flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      PowerPoint 簡報 (.pptx)
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
                      主要格式
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    16:9 寬螢幕規格，內含封面、摘要、各時序片段真實截圖、重點說明、鮮明醒目標示與文字洞察。
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isExportingPptx}
                onClick={handleExportPPTX}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingPptx ? '生成中...' : '下載 PPT'}</span>
              </button>
            </div>

            {/* Option 2: Markdown (.md) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Markdown 文件 (.md)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    適合複製至 Notion、Obsidian、HackMD 或作為文字報告備份。
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                下載 MD
              </button>
            </div>

            {/* Option 3: JSON Backup */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    JSON 報告資料檔 (.json)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    完整結構化資料，便於二次整合或資料庫備份。
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                下載 JSON
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>提示：PPT 檔案已內嵌真實畫面截圖與完整格式</span>
          <button
            type="button"
            onClick={onClose}
            className="font-semibold text-slate-600 hover:text-slate-900"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
