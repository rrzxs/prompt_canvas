import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, PromptItem } from '../types';
import { apiService } from '../services/apiService';
import { Icons } from './Icons';
import { PromptCard } from './PromptCard';

interface LandingPageProps {
  user: User | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadPrompts = async () => {
      setLoading(true);
      try {
        const data = await apiService.getPublicPrompts();
        setPrompts(data);
      } catch (err: any) {
        console.error('Failed to load public prompts', err);
        // Don't show auth error on landing page, just show empty or specific message
        if (err.response?.status === 401) {
            // If 401, maybe api is not public? But we want to show landing page anyway.
            // Ideally backend should allow public access.
            // If it fails, we just show empty list or error.
            setError("无法加载公开灵感库 (需要登录或API未开放)");
        } else {
            setError(apiService.getErrorMessage(err));
        }
      } finally {
        setLoading(false);
      }
    };
    loadPrompts();
  }, []);

  const filteredPrompts = prompts.filter(p => {
    const term = search.toLowerCase();
    return p.title.toLowerCase().includes(term) || p.tags.some(t => t.toLowerCase().includes(term));
  });

  return (
    <div className="min-h-screen bg-canvas text-slate-200 flex flex-col">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Layers className="w-8 h-8 text-accent" />
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400">
              观想阁
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="hidden md:flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <Icons.LayoutGrid className="w-4 h-4" />
                  工作台
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center font-bold text-xs text-white">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/login')}
                  className="text-slate-300 hover:text-white font-medium transition-colors"
                >
                  登录
                </button>
                <button 
                  onClick={() => navigate('/login?mode=register')} 
                  className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  注册
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 md:pt-32 md:pb-12 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            发现无限<span className="text-accent">灵感</span>
          </h2>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            探索社区精选的 AI 提示词，一键克隆，激发您的创作潜能。
          </p>
        </div>
      </div>

      {/* Search Bar - Sticky */}
      <div className="sticky top-16 z-40 px-4 sm:px-6 lg:px-8 pb-8 pt-2 backdrop-blur-sm bg-canvas/50 transition-all duration-300">
          <div className="max-w-2xl mx-auto relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
             <div className="relative flex items-center bg-slate-900 rounded-xl p-2 border border-slate-700">
               <Icons.Search className="w-6 h-6 text-slate-500 ml-3" />
               <input 
                 type="text" 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 placeholder="搜索提示词、标签..." 
                 className="w-full bg-transparent border-none outline-none text-lg px-4 py-3 text-white placeholder-slate-500"
               />
             </div>
          </div>
      </div>

      {/* Public Library Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex items-center gap-2 mb-8">
            <Icons.Globe className="w-6 h-6 text-blue-400" />
            <h3 className="text-2xl font-bold text-white">灵感广场</h3>
        </div>

        {loading ? (
           <div className="text-center py-20 text-slate-500 flex flex-col items-center">
             <Icons.Refresh className="w-8 h-8 animate-spin mb-4 opacity-50" />
             正在加载精彩内容...
           </div>
        ) : error ? (
           <div className="text-center py-20 bg-red-500/10 rounded-xl border border-red-500/50">
             <p className="text-red-300 mb-4">{error}</p>
             <button 
               onClick={() => window.location.reload()}
               className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
             >
               刷新重试
             </button>
           </div>
        ) : filteredPrompts.length === 0 ? (
           <div className="text-center py-20 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
             <p className="text-slate-500">暂无公开提示词，或者没有找到匹配的结果。</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredPrompts.map(prompt => (
               <PromptCard 
                 key={prompt.id} 
                 prompt={prompt} 
                 isPersonal={false}
               />
             ))}
           </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
             {/* <div className="flex items-center gap-3 text-slate-400 mb-2">
               <span>出品方：</span>
               <a 
                 href="https://www.rrzxs.com" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-accent hover:text-accent-hover font-medium transition-colors flex items-center gap-1"
               >
                 人人智学社
                 <Icons.ExternalLink className="w-3 h-3" />
               </a>
               <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-800 text-xs text-slate-400 border border-slate-700 select-none">
                 内部试玩版
               </span>
             </div> */}
             <p className="text-slate-500 text-sm" onClick={() => window.open('https://www.rrzxs.com', '_blank')}>© 2025 观想阁·人人智学社. All rights reserved.</p>
          </div>
          
          <div className="max-w-3xl text-center border-t border-slate-800/50 pt-6 mt-2">
             <p className="text-xs text-slate-600 leading-relaxed">
               <strong>免责声明：</strong>本服务生成的任何内容（包括但不限于文本、图像、代码）均由人工智能模型自动生成，仅供参考、学习和娱乐使用。
               生成内容不代表平台立场，不构成任何专业建议（如法律、医疗、金融等）。
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
