import React from 'react';
import { DetailLevel } from '../types/report';
import { Sparkles, Layers, BookOpen, Compass } from 'lucide-react';

interface DetailLevelSelectorProps {
  selectedLevel: DetailLevel;
  onChange: (level: DetailLevel) => void;
  disabled?: boolean;
}

interface LevelOption {
  id: DetailLevel;
  name: string;
  badge: string;
  pageCount: string;
  targetCount: number;
  description: string;
  suitability: string;
  accentColor: string;
  icon: React.ElementType;
}

export const DetailLevelSelector: React.FC<DetailLevelSelectorProps> = ({
  selectedLevel,
  onChange,
  disabled = false,
}) => {
  const options: LevelOption[] = [
    {
      id: 'simple',
      name: '簡約版',
      badge: '精準速覽',
      pageCount: '3 ~ 4 頁',
      targetCount: 4,
      description: '濃縮精選最核心之關鍵片段與論點，快速掌握精華',
      suitability: '高階決策會議、快速匯報、社群短文懶人包',
      accentColor: 'indigo',
      icon: Sparkles,
    },
    {
      id: 'medium',
      name: '中等版',
      badge: '標準分析 · 推薦',
      pageCount: '6 ~ 8 頁',
      targetCount: 6,
      description: '完整涵蓋開頭背景、關鍵轉折、核心重點與綜合剖析',
      suitability: '部門常態會議、專案進度分享、知識分享簡報',
      accentColor: 'emerald',
      icon: Layers,
    },
    {
      id: 'detailed',
      name: '詳細版',
      badge: '全景深度解析',
      pageCount: '10 ~ 12 頁',
      targetCount: 10,
      description: '全時序細部切片，剖析每個步驟技術、數據細節與深度觀點',
      suitability: '完整教育訓練講義、技術研討會、專案完整歸檔',
      accentColor: 'amber',
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-600" />
          <span>報告規格與頁數選擇（依需求決定頁數多寡）</span>
        </label>
        <span className="text-xs text-slate-500">
          目前預估頁數: {options.find((o) => o.id === selectedLevel)?.pageCount}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {options.map((option) => {
          const isSelected = selectedLevel === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all relative cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Header inside card */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                      {option.name}
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {option.pageCount}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
                {option.description}
              </p>

              {/* Suitability */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>適用場景:</span>
                <span className="font-medium text-slate-700 text-right truncate max-w-[170px]">
                  {option.suitability}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
