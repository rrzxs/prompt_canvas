import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { apiService } from '../services/apiService';
import { ServiceCosts } from '../types';

interface CreditGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const CreditGuide: React.FC<CreditGuideProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [serviceCosts, setServiceCosts] = useState<ServiceCosts | null>(null);

  useEffect(() => {
    if (isOpen) {
      // 加载服务费用配置
      apiService.getServiceCosts().then(setServiceCosts).catch(console.error);
    }
  }, [isOpen]);

  const steps = [
    {
      title: '欢迎使用观想阁积分系统',
      icon: Icons.Coins,
      content: (
        <div className="space-y-4 text-left">
          <p className="text-slate-300 leading-relaxed">
            为了确保AI资源的合理使用和服务的稳定性，我们引入了积分机制。
            每位用户都有专属的积分账户，用于管理AI服务的使用。
          </p>
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Gift className="w-5 h-5 text-accent" />
              <span className="font-medium text-accent">新用户福利</span>
            </div>
            <p className="text-sm text-slate-300">
              注册即获得200积分，每日凌晨自动重置为200积分，让您畅享AI创作！
            </p>
          </div>
        </div>
      )
    },
    {
      title: '积分消耗规则',
      icon: Icons.Zap,
      content: (
        <div className="space-y-4 text-left">
          <p className="text-slate-300 mb-4">
            不同的AI服务消耗不同数量的积分：
          </p>
          <div className="space-y-3">
            <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icons.Image className="w-6 h-6 text-indigo-400" />
                <div>
                  <div className="font-medium text-white">图片生成</div>
                  <div className="text-sm text-slate-400">AI绘画、图像创作</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-indigo-400">
                  {serviceCosts?.image_generation.cost || 20}积分
                </div>
                <div className="text-xs text-slate-500">每次生成</div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icons.MessageSquare className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="font-medium text-white">文字对话</div>
                  <div className="text-sm text-slate-400">AI问答、逻辑推理</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-400">
                  {serviceCosts?.text_chat.cost || 10}积分
                </div>
                <div className="text-xs text-slate-500">每次对话</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Shield className="w-5 h-5 text-yellow-400" />
              <span className="font-medium text-yellow-300">积分保护</span>
            </div>
            <p className="text-sm text-slate-300">
              如果AI服务调用失败，您的积分不会被扣除，确保公平使用。
            </p>
          </div>
        </div>
      )
    },
    {
      title: '积分恢复机制',
      icon: Icons.RotateCcw,
      content: (
        <div className="space-y-4 text-left">
          <p className="text-slate-300 mb-4">
            我们提供多种方式帮助您恢复积分：
          </p>

          <div className="space-y-3">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Icons.Clock className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-white">每小时恢复</span>
              </div>
              <p className="text-sm text-slate-300 mb-2">
                系统每小时自动为您恢复 <span className="font-bold text-blue-400">{serviceCosts?.hourly_recovery || 5}积分</span>
              </p>
              <p className="text-xs text-slate-500">
                积分上限为{serviceCosts?.daily_limit || 200}，达到上限后不再恢复
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Icons.Sun className="w-5 h-5 text-orange-400" />
                <span className="font-medium text-white">每日重置</span>
              </div>
              <p className="text-sm text-slate-300 mb-2">
                每天凌晨00:00，所有用户积分重置为 <span className="font-bold text-orange-400">{serviceCosts?.daily_limit || 200}积分</span>
              </p>
              <p className="text-xs text-slate-500">
                确保每天都有充足的积分额度
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '积分使用建议',
      icon: Icons.Lightbulb,
      content: (
        <div className="space-y-4 text-left">
          <p className="text-slate-300 mb-4">
            为了更好地使用积分系统，我们建议：
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Icons.CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-white mb-1">合理规划使用</div>
                <div className="text-sm text-slate-400">
                  根据积分余额和恢复时间，合理安排AI服务的使用
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Icons.CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-white mb-1">关注积分提醒</div>
                <div className="text-sm text-slate-400">
                  界面会显示积分余额和恢复时间，积分不足时会有明显提示
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Icons.CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-white mb-1">查看使用历史</div>
                <div className="text-sm text-slate-400">
                  可以查看积分使用历史，了解自己的使用模式
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Heart className="w-5 h-5 text-emerald-400" />
              <span className="font-medium text-emerald-300">温馨提示</span>
            </div>
            <p className="text-sm text-slate-300">
              积分系统旨在确保服务质量，让每位用户都能公平地享受AI服务。
              如有任何问题，欢迎联系我们！
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 完成引导
      localStorage.setItem('credit_guide_completed', 'true');
      onComplete?.();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('credit_guide_completed', 'true');
    onComplete?.();
    onClose();
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-panel border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{currentStepData.title}</h2>
              <p className="text-sm text-slate-400">
                第 {currentStep + 1} 步，共 {steps.length} 步
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-slate-400 hover:text-white text-sm underline"
          >
            跳过引导
          </button>
        </div>

        {/* 进度条 */}
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6 text-left">
          {currentStepData.content}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icons.ChevronLeft className="w-4 h-4" />
            上一步
          </button>

          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${index === currentStep ? 'bg-accent' :
                    index < currentStep ? 'bg-accent/50' : 'bg-slate-600'
                  }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {currentStep === steps.length - 1 ? '完成' : '下一步'}
            {currentStep < steps.length - 1 && <Icons.ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// 检查是否需要显示新手引导的Hook
export const useCreditGuide = () => {
  const [shouldShowGuide, setShouldShowGuide] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('credit_guide_completed');
    if (!completed) {
      // 延迟显示，让用户先看到主界面
      const timer = setTimeout(() => {
        setShouldShowGuide(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const hideGuide = () => {
    setShouldShowGuide(false);
  };

  const showGuide = () => {
    setShouldShowGuide(true);
  };

  return {
    shouldShowGuide,
    hideGuide,
    showGuide
  };
};