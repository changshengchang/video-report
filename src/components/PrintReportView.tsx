import React from 'react';
import { VideoReport } from '../types/report';

interface PrintReportViewProps {
  report: VideoReport;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({ report }) => {
  return (
    <div
      id="print-report-container"
      className="hidden print:block print:w-full text-slate-900 font-siyuan-sans bg-white"
    >
      {/* =========================================
          PRINT PAGE 1: COVER SLIDE
          ========================================= */}
      <div className="print-slide-page w-full min-h-[640px] p-10 flex flex-col justify-between print-page-break border-b border-slate-200 bg-white">
        <div className="space-y-4">
          <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 rounded text-xs font-bold text-indigo-700">
            【{report.detailLevelName}】 · 專業影片內容分析報告
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mt-6">
            {report.topic}
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed font-normal max-w-3xl">
            {report.subtitle}
          </p>
        </div>

        <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-xs text-slate-500">
          <div>
            <div className="font-bold text-slate-700">影片來源</div>
            <div className="mt-0.5">{report.videoName || report.videoUrl || '自訂影片'}</div>
          </div>
          <div>
            <div className="font-bold text-slate-700">分析規格與片段數</div>
            <div className="mt-0.5">{report.detailLevelName} · 共 {report.scenes.length} 頁</div>
          </div>
          <div>
            <div className="font-bold text-slate-700">報告生成日期</div>
            <div className="mt-0.5">{report.createdAt}</div>
          </div>
        </div>
      </div>

      {/* =========================================
          PRINT PAGE 2: SUMMARY & HIGHLIGHTS
          ========================================= */}
      <div className="print-slide-page w-full min-h-[640px] p-10 flex flex-col justify-between print-page-break border-b border-slate-200 bg-white">
        <div className="space-y-8">
          <div>
            <span className="text-xs font-bold text-indigo-600 tracking-wider">01 // 執行總覽</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">影片整體內容摘要與核心重點</h2>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-indigo-900">【內容核心總覽】</h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {report.summary}
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-emerald-900">【核心價值亮點】</h3>
              <div className="space-y-3">
                {report.keyTakeaways.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span className="font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 shrink-0">
                      {item.badge}
                    </span>
                    <span className="text-slate-800 leading-relaxed font-medium">
                      {item.point}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 text-right">
          {report.topic} · 頁次 02
        </div>
      </div>

      {/* =========================================
          PRINT PAGES 3+: SCENES
          ========================================= */}
      {report.scenes.map((scene, index) => (
        <div
          key={scene.id}
          className="print-slide-page w-full min-h-[640px] p-10 flex flex-col justify-between print-page-break border-b border-slate-200 bg-white"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-200 rounded text-xs font-bold font-mono">
                  片段 {String(scene.slideNumber).padStart(2, '0')}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  時間點: {scene.timestamp}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                頁次 {index + 3} / {report.scenes.length + 3}
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900">
              {scene.title}
            </h2>

            <div className="grid grid-cols-2 gap-8 items-start">
              {/* Left: Frame image */}
              <div className="rounded-xl overflow-hidden border border-slate-300 bg-slate-950 aspect-video relative h-[340px] flex items-center justify-center">
                {scene.imageUrl ? (
                  <img
                    src={scene.imageUrl}
                    alt={scene.title}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    影片片段截圖
                  </div>
                )}
                <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/85 text-white font-mono text-xs rounded-md shadow-xs border border-white/10">
                  ⏱ {scene.timestamp}
                </div>
              </div>

              {/* Right: Caption and Analysis */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-xs font-bold text-indigo-700">【畫面核心說明】</div>
                  <p className="text-xs text-slate-800 leading-relaxed font-normal">
                    {scene.caption}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-xs font-bold text-amber-700">【深度觀點與商務洞察】</div>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {scene.analysis}
                  </p>
                </div>

                {scene.keyHighlights && scene.keyHighlights.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">鮮明核心標記:</span>
                    {scene.keyHighlights.map((hl, hlIdx) => (
                      <span
                        key={hlIdx}
                        className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200"
                      >
                        ★ {hl}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-right pt-4 border-t border-slate-100">
            {report.topic} · 片段 {scene.slideNumber}
          </div>
        </div>
      ))}

      {/* =========================================
          PRINT FINAL PAGE: CONCLUSION
          ========================================= */}
      <div className="print-slide-page w-full min-h-[640px] p-10 flex flex-col justify-between bg-white">
        <div className="space-y-6">
          <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs font-bold text-emerald-700">
            報告結論與後續啟示
          </div>
          <h2 className="text-3xl font-black text-slate-900">總結與建議應用方向</h2>
          <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-800 leading-relaxed">
              {report.conclusion}
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 pt-8 border-t border-slate-200">
          報告製作完成 · 感謝閱覽
        </div>
      </div>
    </div>
  );
};
