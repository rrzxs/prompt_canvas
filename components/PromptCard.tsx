import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PromptItem, PromptType } from '../types';
import { Icons } from './Icons';

interface PromptCardProps {
  prompt: PromptItem;
  isPersonal: boolean;
  onDelete?: (e: React.MouseEvent, id: string) => void;
  onTogglePublic?: (e: React.MouseEvent, prompt: PromptItem) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, isPersonal, onDelete, onTogglePublic }) => {
  const navigate = useNavigate();
  // Find background image from the first version that has one
  const bgImage = prompt.versions?.find(v => v.imageUrl)?.imageUrl;

  return (
    <div 
      onClick={() => navigate(`/prompt/${prompt.id}`)}
      className="bg-panel border border-slate-700 rounded-xl p-4 hover:border-slate-500 transition-all cursor-pointer group relative flex flex-col h-48 overflow-hidden shadow-lg hover:shadow-xl"
    >
      {/* Background Image with Overlay */}
      {bgImage && (
          <>
            <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80"
                style={{ backgroundImage: `url(${bgImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-900/40" />
          </>
      )}

      {/* Content relative z-10 */}
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm ${
            prompt.type === PromptType.IMAGE || prompt.type === PromptType.VIDEO_PLAN 
              ? 'bg-indigo-900/80 text-indigo-300 border border-indigo-500/30' 
              : 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/30'
          }`}>
            {prompt.type === PromptType.VIDEO_PLAN ? '视频' : prompt.type === PromptType.IMAGE ? '绘画' : '文本'}
          </div>
          
          {isPersonal && onDelete && (
              <button 
                type="button"
                onClick={(e) => onDelete(e, prompt.id)}
                onMouseDown={(e) => e.stopPropagation()} 
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/20 p-1.5 rounded transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm bg-slate-900/50"
                title="删除提示词"
              >
                <Icons.Trash className="w-4 h-4" />
              </button>
          )}
        </div>
        
        <h3 className="font-bold text-white mb-2 line-clamp-2 drop-shadow-md text-lg">{prompt.title}</h3>
        
        <div className="flex flex-wrap gap-1 mb-auto">
          {prompt.tags.slice(0, 3).map(t => (
            <span key={t} className="text-[10px] bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{t}</span>
          ))}
        </div>
        
        <div className="pt-3 border-t border-white/10 text-[10px] text-slate-400 flex justify-between items-center mt-2">
           <span>{new Date(prompt.updatedAt).toLocaleDateString()}</span>
           
           <div className="flex items-center gap-2">
               {isPersonal && onTogglePublic && (
                 <div 
                    onClick={(e) => onTogglePublic(e, prompt)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full cursor-pointer transition-colors backdrop-blur-sm ${prompt.isPublic ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-slate-700/50 text-slate-400 border border-slate-600'}`}
                    title={prompt.isPublic ? "已公开" : "私有"}
                 >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    <span className="text-[10px]">{prompt.isPublic ? '公开' : '私有'}</span>
                 </div>
               )}
               <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-accent">
                  <Icons.ChevronRight className="w-3 h-3" />
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};
