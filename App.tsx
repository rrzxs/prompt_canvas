import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icons } from './components/Icons';
import { User, PromptItem, PromptType } from './types';
import { ImageCanvas } from './components/ImageCanvas';
import { ChatInterface } from './components/ChatInterface';
import { LandingPage } from './components/LandingPage';
import { PromptCard } from './components/PromptCard';
import { CreditDisplay } from './components/CreditDisplay';
import { CreditHistory } from './components/CreditHistory';
import { CreditGuide, useCreditGuide } from './components/CreditGuide';
import { CreditStatusBanner } from './components/CreditStatusBanner';
import { apiService } from './services/apiService';

// ... (Sidebar, SettingsPage, LoginPage, Dashboard components remain unchanged)
const Sidebar = ({ user, onLogout, onCloseMobile }: { user: User, onLogout: () => void, onCloseMobile?: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const version = "v1.2"; // Version indicator for caching checks
  const [showCreditHistory, setShowCreditHistory] = useState(false);

  const NavItem = ({ path, icon: Icon, label }: any) => (
    <button
      onClick={() => {
        navigate(path);
        onCloseMobile && onCloseMobile();
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${location.pathname === path && !location.search ? 'bg-accent/10 text-accent' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  return (
    <div className="w-full h-full flex flex-col bg-panel">
      {showCreditHistory && (
        <CreditHistory onClose={() => setShowCreditHistory(false)} />
      )}

      <div className="p-6 border-b border-slate-700 shrink-0 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400 flex items-center gap-2">
          <Icons.Layers className="w-8 h-8 text-accent" />
          观想阁
        </h1>
        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-white">
            <Icons.X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-6">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">菜单</p>
          <NavItem path="/dashboard" icon={Icons.LayoutGrid} label="仪表盘" />
          <NavItem path="/library" icon={Icons.History} label="灵感库" />
          {/* <NavItem path="/settings" icon={Icons.Settings} label="设置 & 数据" /> */}
        </div>
      </div>

      {/* 简化的用户信息卡片 */}
      <div className="p-4 border-t border-slate-700 bg-gradient-to-br from-slate-800/30 to-slate-900/30 shrink-0">
        {/* 用户信息行 - 简化版 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-lg">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-white truncate">{user.username}</span>
          </div>
          <button
            onClick={() => setShowCreditHistory(true)}
            className="p-1.5 text-slate-400 hover:text-accent hover:bg-slate-700/50 rounded-lg transition-all duration-200 group"
            title="积分历史"
          >
            <Icons.History className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* 积分信息区域 - 简化版 */}
        <div className="bg-slate-900/30 rounded-lg p-2.5 mb-3 border border-slate-700/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Icons.Coins className="w-3 h-3" />
              积分
            </span>
          </div>
          <CreditDisplay showDetails={true} className="w-full" />
        </div>

        {/* 退出登录按钮 - 简化版 */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-red-400 hover:bg-red-500/5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
        >
          <Icons.LogOut className="w-3 h-3" />
          退出登录
        </button>
      </div>
    </div>
  );
};

const SettingsPage = ({ user }: { user: User }) => {
  const [jsonOutput, setJsonOutput] = useState('');
  const [importStatus, setImportStatus] = useState('');

  const handleExport = async () => {
    try {
      // 使用 apiService 导出数据
      const blob = await apiService.exportData();
      setJsonOutput('导出成功');

      // Auto download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptcanvas_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(apiService.getErrorMessage(e));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('导入中...');
      // 使用 apiService 导入数据
      const result = await apiService.importData(file);
      setImportStatus(`导入成功！已导入 ${result.imported_count} 条记录。请刷新页面。`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setImportStatus(`错误: ${apiService.getErrorMessage(err)}`);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-8">设置 & 数据管理</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        <div className="bg-panel border border-slate-700 rounded-xl p-6">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 mb-4">
            <Icons.Download className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">导出数据 (备份)</h3>
          <p className="text-slate-400 text-sm mb-6">
            将您的所有提示词、生成的图片和对话记录打包下载为 JSON 文件。您可以在其他设备上导入此文件以实现数据同步。
          </p>
          <button
            onClick={handleExport}
            className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Icons.Download className="w-4 h-4" />
            导出并下载
          </button>
        </div>

        <div className="bg-panel border border-slate-700 rounded-xl p-6">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 mb-4">
            <Icons.Upload className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">导入数据 (恢复)</h3>
          <p className="text-slate-400 text-sm mb-6">
            上传之前备份的 JSON 文件。注意：这将合并数据到当前设备，如果 ID 冲突会覆盖旧数据。
          </p>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer w-fit"
            >
              <Icons.Upload className="w-4 h-4" />
              选择文件上传
            </label>
          </div>
          {importStatus && (
            <p className={`mt-4 text-sm ${importStatus.includes('错误') ? 'text-red-400' : 'text-emerald-400'}`}>
              {importStatus}
            </p>
          )}
        </div>
      </div>

      {/* <div className="mt-12 p-6 bg-slate-900/50 rounded-xl border border-slate-800">
         <h4 className="text-white font-bold mb-2 flex items-center gap-2">
            <Icons.Activity className="w-4 h-4 text-slate-500" />
            关于跨平台同步
         </h4>
         <p className="text-slate-400 text-sm leading-relaxed">
            当前为“离线优先”模式，数据存储在您设备的浏览器数据库中 (IndexedDB)，因此不同设备间数据默认不互通。
            使用上方的<b>导出</b>和<b>导入</b>功能，您可以手动将数据从电脑迁移到手机，或在不同浏览器间同步。
         </p>
      </div> */}
    </div>
  );
};

const LoginPage = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('mode') === 'register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError("请输入用户名和密码");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        // 注册用户
        const newUser = await apiService.register(username, password);
        // 注册成功后自动登录
        const authResponse = await apiService.login(username, password);
        // 存储令牌和用户信息
        localStorage.setItem('promptcanvas_token', authResponse.accessToken);
        localStorage.setItem('promptcanvas_session', JSON.stringify(newUser));
        onLogin(newUser);
      } else {
        // 登录用户
        const authResponse = await apiService.login(username, password);
        // 获取用户信息
        const user = await apiService.getCurrentUser();
        // 存储令牌和用户信息
        localStorage.setItem('promptcanvas_token', authResponse.accessToken);
        localStorage.setItem('promptcanvas_session', JSON.stringify(user));
        onLogin(user);
      }
    } catch (err: any) {
      setError(apiService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-canvas relative overflow-hidden">
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800"
        >
          <Icons.ChevronLeft className="w-5 h-5" />
          返回首页
        </button>
      </div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
      <div className="w-full max-w-md bg-panel border border-slate-700 p-8 rounded-2xl shadow-2xl relative z-10 mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/20 rounded-2xl mx-auto flex items-center justify-center mb-4 text-accent">
            <Icons.Layers className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRegister ? '创建账号' : '欢迎回来'}
          </h1>
          <p className="text-slate-400">
            {isRegister ? '加入观想阁，开启您的创意之旅。' : '登录以访问您的专属提示词库。'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-accent outline-none transition-all"
              placeholder="请输入您的用户名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-accent outline-none transition-all"
              placeholder="请输入密码"
            />
          </div>

          {isRegister && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-medium text-slate-300 mb-1">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-accent outline-none transition-all"
                placeholder="再次输入密码"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-2 text-red-300 text-sm">
              <Icons.X className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Icons.Refresh className="w-4 h-4 animate-spin" />}
            {loading ? '处理中...' : (isRegister ? '立即注册' : '登录')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            {isRegister ? '已有账号？' : '还没有账号？'}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setUsername('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-accent hover:underline ml-1 font-medium"
            >
              {isRegister ? '去登录' : '免费注册'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ user }: { user: User }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'auto' | 'visual' | 'reasoning'>('auto');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();
  const { shouldShowGuide, hideGuide } = useCreditGuide();

  // 自动检测意图 (Plan A 的触感反馈)
  const getDetectedType = () => {
    if (!input.trim()) return 'none';
    const visualKeywords = ['画', '图', '视觉', '渲染', '设计', '风格', '打光', '镜头', '比例', 'draw', 'paint', 'image', 'picture', 'photo', 'art', 'sketch'];
    const reasoningKeywords = ['问', '讲', '解', '代码', '逻辑', '分析', '写作', '写段', '告诉我', '如何', 'why', 'how', 'chat', 'ask', 'explain', 'code', 'write'];

    const isVisual = visualKeywords.some(kw => input.toLowerCase().includes(kw));
    const isReasoning = reasoningKeywords.some(kw => input.toLowerCase().includes(kw));

    if (isVisual && !isReasoning) return 'visual';
    if (isReasoning && !isVisual) return 'reasoning';
    return isVisual ? 'visual' : 'none'; // 模糊时偏向视觉或保持 none
  };

  const detected = getDetectedType();
  const activeMode = mode === 'auto' ? (detected === 'none' ? 'auto' : detected) : mode;

  // 根据当前模式决定流光颜色
  const getGlowClass = () => {
    switch (activeMode) {
      case 'visual': return 'from-indigo-600 via-purple-500 to-pink-500';
      case 'reasoning': return 'from-emerald-500 via-teal-400 to-blue-500';
      case 'auto': return 'from-slate-500 via-slate-400 to-slate-500';
      default: return 'from-accent to-purple-600';
    }
  };

  const handleQuickAdd = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    try {
      let classification;
      // 如果是自动模式，调用 AI 分类
      if (mode === 'auto') {
        classification = await apiService.classifyPrompt(input);
      } else {
        // 手动模式，直接确定
        classification = {
          type: mode === 'visual' ? PromptType.IMAGE : PromptType.TEXT,
          title: input.split('\n')[0].substring(0, 30) || '新创作',
          tags: mode === 'visual' ? ['绘画'] : ['对话']
        };
      }

      const newPrompt: Partial<PromptItem> = {
        title: classification.title,
        type: classification.type as PromptType,
        tags: classification.tags,
        draftText: input,
      };

      // 使用 apiService 创建提示词
      const createdPrompt = await apiService.createPrompt(newPrompt);

      // 如果是文本类型且有输入，后端创建时会自动处理或我们需要手动补充
      // 这里的逻辑保持与原代码一致

      navigate(`/prompt/${createdPrompt.id}`);
    } catch (e: any) {
      console.error(e);
      alert(`创建提示词出错: ${apiService.getErrorMessage(e)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const ModeTab = ({ id, icon: Icon, label, colorClass }: any) => (
    <button
      onClick={() => setMode(id)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${mode === id
        ? `${colorClass} shadow-lg scale-105`
        : 'bg-slate-800/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800'
        }`}
    >
      <Icon className={`w-3.5 h-3.5 ${mode === id ? 'animate-pulse' : ''}`} />
      {label}
    </button>
  );

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-3xl mx-auto">
      {shouldShowGuide && (
        <CreditGuide
          isOpen={shouldShowGuide}
          onClose={hideGuide}
          onComplete={hideGuide}
        />
      )}

      <div className="mb-10 text-center space-y-2">
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          今天想创作什么？
        </h2>
        <p className="text-slate-500 text-lg">开启您的 AI 灵感之旅</p>
      </div>

      <div className="w-full space-y-4">
        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-center gap-3 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <ModeTab
            id="auto"
            icon={Icons.Wand}
            label="智能判定"
            colorClass="bg-slate-700 text-white border border-slate-600"
          />
          <ModeTab
            id="visual"
            icon={Icons.Image}
            label="视觉画廊"
            colorClass="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
          />
          <ModeTab
            id="reasoning"
            icon={Icons.MessageSquare}
            label="思维实验室"
            colorClass="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
          />
        </div>

        <div className="w-full relative group">
          {/* Dynamic Glow Background */}
          <div className={`absolute -inset-1 bg-gradient-to-r ${getGlowClass()} rounded-2xl blur opacity-25 group-hover:opacity-40 transition-all duration-700`}></div>

          <div className="relative flex flex-col bg-slate-900 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl backdrop-blur-xl">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuickAdd();
                }
              }}
              placeholder={
                activeMode === 'visual' ? "描述你想要的画面，例如：赛博朋克风格的猫..." :
                  activeMode === 'reasoning' ? "提出您的问题或需求，例如：写一段 React 代码..." :
                    "描述一个画面或提出一个问题..."
              }
              rows={3}
              className="w-full bg-transparent border-none outline-none text-lg px-6 pt-6 pb-4 text-white placeholder-slate-600 resize-none min-h-[120px] transition-all duration-300"
              autoFocus
            />

            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium ml-2">
                {activeMode === 'visual' && <span className="flex items-center gap-1 text-indigo-400/80 animate-in fade-in"><Icons.Check className="w-3 h-3" /> 已准备好构图</span>}
                {activeMode === 'reasoning' && <span className="flex items-center gap-1 text-emerald-400/80 animate-in fade-in"><Icons.Check className="w-3 h-3" /> 已准备好思考</span>}
                {activeMode === 'auto' && input.length > 0 && <span className="animate-pulse">正在解析意图...</span>}
              </div>

              <button
                onClick={handleQuickAdd}
                disabled={isAnalyzing || !input.trim()}
                className={`
                   relative flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300
                   ${isAnalyzing || !input.trim()
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-lg shadow-accent/20 hover:scale-105 active:scale-95'}
                 `}
              >
                {isAnalyzing ? (
                  <>
                    <Icons.Refresh className="w-4 h-4 animate-spin" />
                    <span>处理中</span>
                  </>
                ) : (
                  <>
                    <span>立即创作</span>
                    <Icons.Plus className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-in fade-in slide-in-from-top-4 duration-1000 delay-200">
        <div
          className="bg-panel border border-slate-700/50 p-6 rounded-2xl text-left hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer group"
          onClick={() => navigate('/library?category=visual')}
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
            <Icons.Image className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">视觉画廊</h3>
          <p className="text-slate-500 text-sm leading-relaxed">管理绘画提示词，从分镜构图到后期渲染，全方位释放视觉想象力。</p>
        </div>
        <div
          className="bg-panel border border-slate-700/50 p-6 rounded-2xl text-left hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer group"
          onClick={() => navigate('/library?category=text')}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
            <Icons.MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">思维实验室</h3>
          <p className="text-slate-500 text-sm leading-relaxed">深层逻辑分析、创意撰写或代码开发，与 AI 共同攻克复杂课题。</p>
        </div>
      </div>
    </div>
  );
};


const Library = ({ user }: { user: User }) => {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [publicPrompts, setPublicPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');

  const loadPrompts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [personalData, publicData] = await Promise.all([
        apiService.getPrompts(category || undefined),
        apiService.getPublicPrompts(category || undefined)
      ]);
      setPrompts(personalData);
      setPublicPrompts(publicData);
    } catch (err: any) {
      console.error('获取提示词列表失败', err);
      setError(apiService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, [category]);

  const filterPrompts = (list: PromptItem[]) => list.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (category === 'visual') {
      return p.type === PromptType.IMAGE || p.type === PromptType.VIDEO_PLAN;
    }
    if (category === 'text') {
      return p.type === PromptType.TEXT;
    }

    return true;
  });

  const filteredPersonal = filterPrompts(prompts);
  const filteredPublic = filterPrompts(publicPrompts);

  const handleTogglePublic = async (e: React.MouseEvent, prompt: PromptItem) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const updated = await apiService.updatePrompt(prompt.id, { isPublic: !prompt.isPublic });
      // Update local state
      setPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, isPublic: updated.isPublic } : p));
      // Also refresh public list
      const publicData = await apiService.getPublicPrompts(category || undefined);
      setPublicPrompts(publicData);
    } catch (err: any) {
      alert(apiService.getErrorMessage(err));
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm('确定要删除此提示词吗？操作不可恢复。')) {
      try {
        // Optimistic update
        setPrompts(prev => prev.filter(p => p.id !== id));
        // 使用 apiService 删除提示词
        await apiService.deletePrompt(id);
      } catch (err: any) {
        console.error('删除提示词失败', err);
        // 如果删除失败，重新加载列表
        try {
          const data = await apiService.getPrompts(category || undefined);
          setPrompts(data);
        } catch (ignored) { }
        alert(apiService.getErrorMessage(err));
      }
    }
  }

  const getTitle = () => {
    if (category === 'visual') return '视觉画廊';
    if (category === 'text') return '思维实验室';
    return '您的灵感库';
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          {category && (
            <button onClick={() => navigate('/library')} className="text-slate-400 hover:text-white mr-2" title="查看全部">
              <Icons.ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h2 className="text-2xl font-bold text-white">{getTitle()}</h2>
        </div>
        <div className="relative">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索提示词..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-accent outline-none w-full md:w-64"
          />
        </div>
      </div>

      {error ? (
        <div className="text-center py-20 bg-red-500/10 rounded-xl border border-red-500/50">
          <Icons.X className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadPrompts}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            重试
          </button>
        </div>
      ) : loading ? (
        <div className="text-center py-20 text-slate-500 flex flex-col items-center">
          <Icons.Refresh className="w-8 h-8 animate-spin mb-4 opacity-50" />
          正在加载灵感库...
        </div>
      ) : (
        <div className="space-y-12">
          {/* Personal Library */}
          <div>
            <h3 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Icons.User className="w-5 h-5 text-accent" />
              个人灵感库
            </h3>
            {filteredPersonal.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
                <p className="text-slate-500 text-sm">暂无个人提示词。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPersonal.map(prompt => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    isPersonal={true}
                    onDelete={handleDelete}
                    onTogglePublic={handleTogglePublic}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Public Library */}
          <div className="pt-8 border-t border-slate-700/50">
            <h3 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Icons.Globe className="w-5 h-5 text-blue-400" />
              灵感广场
            </h3>
            {filteredPublic.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
                <p className="text-slate-500 text-sm">暂无公开提示词。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPublic.map(prompt => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    isPersonal={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PromptDetail = ({ user }: { user: User | null }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState<PromptItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneName, setCloneName] = useState('');

  useEffect(() => {
    if (id) {
      setLoading(true);
      // 使用 apiService 获取单个提示词详情
      apiService.getPrompt(id).then(prompt => {
        setPrompt(prompt);
        setLoading(false);
      }).catch(err => {
        console.error('获取提示词详情失败', err);
        setPrompt(null);
        setLoading(false);
      });
    }
  }, [id]);

  const handleUpdate = (updated: PromptItem) => {
    setPrompt(updated);
  };

  const handleClone = () => {
    if (!prompt) return;
    if (!user) {
      if (window.confirm('您需要登录才能克隆提示词。是否前往登录？')) {
        navigate('/login');
      }
      return;
    }
    setCloneName(`${prompt.title} (副本)`);
    setIsCloneModalOpen(true);
  };

  const confirmClone = async () => {
    if (!prompt) return;

    try {
      setIsCloneModalOpen(false);
      const cloned = await apiService.clonePrompt(prompt.id, cloneName);
      navigate(`/prompt/${cloned.id}`);
    } catch (err: any) {
      alert(apiService.getErrorMessage(err));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full text-slate-500">加载提示词中...</div>;
  if (!prompt) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500">
      <p className="mb-4">未找到提示词。</p>
      <button onClick={() => user ? navigate('/library') : navigate('/')} className="text-accent hover:underline">返回{user ? '灵感库' : '首页'}</button>
    </div>
  );

  const isReasoning = prompt.type === PromptType.TEXT;
  const isOwner = user ? prompt.userId === user.id : false;

  return (
    <div className="flex flex-col h-full bg-canvas text-slate-200">
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-panel border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">克隆提示词</h3>
            <div className="mb-6">
              <label className="block text-slate-400 text-sm mb-2">
                副本名称
              </label>
              <input
                type="text"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmClone();
                  if (e.key === 'Escape') setIsCloneModalOpen(false);
                }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsCloneModalOpen(false)}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmClone}
                disabled={!cloneName.trim()}
                className="bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                确认克隆
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-slate-700 bg-panel shrink-0 justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <button onClick={() => user ? navigate('/library') : navigate('/')} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors shrink-0">
            <Icons.ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-white truncate max-w-xs md:max-w-xl">{prompt.title}</h1>
          {!isOwner && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] shrink-0">
              公开预览
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!user && (
            <button
              onClick={() => navigate('/login')}
              className="text-slate-400 hover:text-white text-sm mr-2 hidden md:block"
            >
              登录
            </button>
          )}
          {!isOwner && (
            <button
              onClick={handleClone}
              className="bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shrink-0"
            >
              <Icons.Copy className="w-4 h-4" />
              <span className="hidden md:inline">克隆{user ? '到我的灵感库' : ''}</span>
              <span className="md:hidden">克隆</span>
            </button>
          )}
        </div>
      </div>

      <div className={`flex-1 relative ${isReasoning ? 'overflow-hidden p-4 md:p-6' : 'overflow-hidden'}`}>
        {isReasoning ? (
          <ChatInterface promptItem={prompt} onUpdate={handleUpdate} readOnly={!isOwner} />
        ) : (
          <ImageCanvas promptItem={prompt} onUpdate={handleUpdate} readOnly={!isOwner} />
        )}
      </div>
    </div>
  )
};

// ... (AuthenticatedLayout and App components remain unchanged)
const AuthenticatedLayout = ({ user, onLogout, children }: { user: User, onLogout: () => void, children: React.ReactNode }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isWorkspace = location.pathname.startsWith('/prompt/');

  return (
    <div className="flex h-screen bg-canvas text-slate-200 overflow-hidden relative">

      {/* 积分状态横幅 */}
      <CreditStatusBanner />

      {/* Mobile Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 z-30 flex items-center px-4 justify-between pointer-events-none">
        {!isMobileMenuOpen && !isWorkspace && (
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-panel/80 backdrop-blur border border-slate-700 rounded-lg text-white pointer-events-auto shadow-lg"
          >
            <Icons.Menu className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 bg-panel border-r border-slate-700 w-64 transform transition-transform duration-300 ease-in-out
          md:relative md:transform-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isWorkspace ? 'md:w-0 md:border-r-0 md:opacity-0 md:overflow-hidden' : 'md:w-64 md:opacity-100'}
        `}
      >
        <div className="w-64 h-full">
          <Sidebar user={user} onLogout={onLogout} onCloseMobile={() => setIsMobileMenuOpen(false)} />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative h-full transition-all duration-500 w-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          {children}
        </div>

        {/* Footer - 品牌信息 */}
        {!isWorkspace && (
          <footer className="px-6 py-3 border-t border-slate-700/30 bg-slate-900/20 backdrop-blur-sm">
            <div className="flex items-center justify-center">
              <a
                href="https://www.rrzxs.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-1"
              >
                <Icons.ExternalLink className="w-3 h-3" />
                人人智学社出品
              </a>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [init, setInit] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      // 检查是否有存储的令牌
      const token = localStorage.getItem('promptcanvas_token');
      if (token) {
        try {
          // 尝试获取当前用户信息
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
        } catch (err) {
          // 如果获取失败（401），清除令牌
          console.error('认证失败，清除令牌', err);
          localStorage.removeItem('promptcanvas_token');
          localStorage.removeItem('promptcanvas_session');
        }
      }
      setInit(true);
    };

    initAuth();
  }, []);

  const handleLogout = () => {
    // 调用 apiService 清除令牌
    apiService.logout();
    // 清除本地存储
    localStorage.removeItem('promptcanvas_token');
    localStorage.removeItem('promptcanvas_session');
    setUser(null);
  };

  if (!init) return null;

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage user={user} />} />
        <Route path="/login" element={!user ? <LoginPage onLogin={setUser} /> : <Navigate to="/dashboard" />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          user ? (
            <AuthenticatedLayout user={user} onLogout={handleLogout}>
              <Dashboard user={user} />
            </AuthenticatedLayout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/library" element={
          user ? (
            <AuthenticatedLayout user={user} onLogout={handleLogout}>
              <Library user={user} />
            </AuthenticatedLayout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/settings" element={
          user ? (
            <AuthenticatedLayout user={user} onLogout={handleLogout}>
              <SettingsPage user={user} />
            </AuthenticatedLayout>
          ) : <Navigate to="/login" />
        } />

        {/* Prompt Detail - Public or Private */}
        <Route path="/prompt/:id" element={
          user ? (
            <AuthenticatedLayout user={user} onLogout={handleLogout}>
              <PromptDetail user={user} />
            </AuthenticatedLayout>
          ) : (
            <div className="h-screen w-full bg-canvas">
              <PromptDetail user={null} />
            </div>
          )
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
      </Routes>
    </HashRouter>
  );
};

export default App;