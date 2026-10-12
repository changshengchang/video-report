import React, { useState } from 'react';
import { TopicSuggestion } from '../types/report';
import {
  Sparkles,
  Edit3,
  Check,
  X,
  RefreshCw,
  Lightbulb,
  BookmarkCheck,
  ArrowRight,
} from 'lucide-react';

interface ThemeEditorProps {
  topic: string;
  subtitle: string;
  category: string;
  onUpdateTopic: (newTopic: string, newSubtitle: string) => void;
  videoTitle?: string;
  detailLevel: string;
}

export const ThemeEditor: React.FC<ThemeEditorProps> = ({
  topic,
  subtitle,
  category,
  onUpdateTopic,
  videoTitle,
  detailLevel,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTopic, setEditedTopic] = useState(topic);
  const [editedSubtitle, setEditedSubtitle] = useState(subtitle);

  // Suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);

  const handleSave = () => {
    if (editedTopic.trim()) {
      onUpdateTopic(editedTopic.trim(), editedSubtitle.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedTopic(topic);
    setEditedSubtitle(subtitle);
    setIsEditing(false);
  };

  // Fetch AI topic suggestions
  const handleFetchSuggestions = async () => {
    setShowSuggestions(true);
    if (suggestions.length > 0) return; // already loaded

    setIsLoadingSuggestions(true);
    try {
      const res = await fetch('/api/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle,
          currentTopic: topic,
          detailLevel,
        }),
      });
      const data = await res.json();
      if (data.topics && Array.isArray(data.topics)) {
        setSuggestions(data.topics);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (item: TopicSuggestion) => {
    setEditedTopic(item.title);
    setEditedSubtitle(item.subtitle);
    onUpdateTopic(item.title, item.subtitle);
    setShowSuggestions(false);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 relative overflow-hidden space-y-4">
      {/* Decorative top vibrant bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-indigo-600 via-sky-500 to-amber-500" />

      {/* Header with edit toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-md">
            報告主題選定與自訂
          </span>
          {category && (
            <span className="text-xs text-slate-500 hidden sm:inline">
              領域分類: <strong className="text-slate-700 font-semibold">{category}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFetchSuggestions}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/70 rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI 推薦備選主題</span>
          </button>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => {
                setEditedTopic(topic);
                setEditedSubtitle(subtitle);
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span>修改主題</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>儲存</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>取消</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Title & Subtitle Display or Form */}
      {!isEditing ? (
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            {topic}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {subtitle}
          </p>
        </div>
      ) : (
        <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              報告主題名稱（主標題）
            </label>
            <input
              type="text"
              value={editedTopic}
              onChange={(e) => setEditedTopic(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-bold bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              placeholder="請輸入欲呈現之報告主題..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              報告副標題（補充切入點或核心洞察）
            </label>
            <input
              type="text"
              value={editedSubtitle}
              onChange={(e) => setEditedSubtitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
              placeholder="請輸入副標題說明..."
            />
          </div>
        </div>
      )}

      {/* AI Suggestions Drawer */}
      {showSuggestions && (
        <div className="pt-4 border-t border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>AI 根據影片內容推薦之其他報告主題切角</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowSuggestions(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              收起
            </button>
          </div>

          {isLoadingSuggestions ? (
            <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-500">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Gemini 正在為您構思不同角度之專業報告主題...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="text-left p-3 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-100/60 transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.5 rounded">
                        {item.angle}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-900 leading-snug">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                      {item.subtitle}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-amber-200/40 flex items-center justify-end text-[11px] font-semibold text-indigo-600 group-hover:text-indigo-800">
                    <span>採用此主題</span>
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
