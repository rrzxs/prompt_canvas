import React, { useState } from 'react';
import { Icons } from './Icons';
import { VideoSettings } from '../types';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (settings: VideoSettings) => void;
  isGenerating: boolean;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, onGenerate, isGenerating }) => {
  const [settings, setSettings] = useState<VideoSettings>({
    style: '电影写实',
    cameraMovement: '向右平移',
    lighting: '黄金时刻',
    action: '静止/待机',
    expression: '中性',
    duration: '5s',
    aspectRatio: '16:9'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-panel border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Icons.Video className="w-6 h-6 text-accent" />
            转换为视频提示词
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">风格 (Style)</label>
            <select 
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-accent outline-none"
              value={settings.style}
              onChange={e => setSettings({...settings, style: e.target.value})}
            >
              <option>电影写实 (Cinematic Realistic)</option>
              <option>3D动画 (Pixar Style)</option>
              <option>动漫 (Grok Anime)</option>
              <option>赛博朋克 (Cyberpunk)</option>
              <option>无人机航拍 (Drone Footage)</option>
              <option>复古胶片 (Vintage Film)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">动作 (Action)</label>
              <select 
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-accent outline-none"
                value={settings.action}
                onChange={e => setSettings({...settings, action: e.target.value})}
              >
                <option>静止/待机 (Static)</option>
                <option>自信行走 (Walking confidently)</option>
                <option>快速奔跑 (Running fast)</option>
                <option>环顾四周 (Looking around)</option>
                <option>挥手示意 (Waving hand)</option>
                <option>跳舞 (Dancing)</option>
                <option>工作/打字 (Typing/Working)</option>
                <option>战斗/格斗 (Fighting)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">表情 (Expression)</label>
              <select 
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-accent outline-none"
                value={settings.expression}
                onChange={e => setSettings({...settings, expression: e.target.value})}
              >
                <option>中性 (Neutral)</option>
                <option>开心/微笑 (Happy)</option>
                <option>悲伤/哭泣 (Sad)</option>
                <option>愤怒 (Angry)</option>
                <option>惊讶 (Surprised)</option>
                <option>恐惧 (Scared)</option>
                <option>坚毅 (Determined)</option>
                <option>神秘 (Mysterious)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">镜头 (Camera)</label>
              <select 
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-accent outline-none"
                value={settings.cameraMovement}
                onChange={e => setSettings({...settings, cameraMovement: e.target.value})}
              >
                <option>固定 (Static)</option>
                <option>向左平移 (Pan Left)</option>
                <option>向右平移 (Pan Right)</option>
                <option>推近 (Zoom In)</option>
                <option>拉远 (Zoom Out)</option>
                <option>环绕 (Orbit)</option>
                <option>第一人称无人机 (FPV Drone)</option>
                <option>手持晃动 (Handheld Shake)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">光线 (Lighting)</label>
              <select 
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-accent outline-none"
                value={settings.lighting}
                onChange={e => setSettings({...settings, lighting: e.target.value})}
              >
                <option>自然光 (Natural)</option>
                <option>黄金时刻 (Golden Hour)</option>
                <option>影棚光 (Studio)</option>
                <option>霓虹灯 (Neon)</option>
                <option>阴郁/暗调 (Moody)</option>
                <option>电影蓝调 (Cinematic Blue)</option>
                <option>火光/暖调 (Fire/Warm)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
             <button 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              取消
            </button>
            <button 
              onClick={() => onGenerate(settings)}
              disabled={isGenerating}
              className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <Icons.Refresh className="w-4 h-4 animate-spin" /> : <Icons.Wand className="w-4 h-4" />}
              生成视频提示词
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};