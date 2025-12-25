import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icons } from './Icons';
import { apiService } from '../services/apiService';
import { CreditCheckResult, ServiceCosts } from '../types';

interface CreditCheckProps {
  serviceType: 'image_generation' | 'text_chat';
  onCreditCheck?: (result: CreditCheckResult) => void;
  children: (props: {
    sufficient: boolean;
    cost: number;
    checking: boolean;
    error: string | null;
    checkResult: CreditCheckResult | null;
  }) => React.ReactNode;
}

export const CreditCheck: React.FC<CreditCheckProps> = ({ 
  serviceType, 
  onCreditCheck,
  children 
}) => {
  const [serviceCosts, setServiceCosts] = useState<ServiceCosts | null>(null);
  const [checkResult, setCheckResult] = useState<CreditCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 防止重复请求的标志
  const isLoadingCosts = useRef(false);
  const isCheckingCredits = useRef(false);

  // 使用 useCallback 避免函数重新创建
  const loadServiceCosts = useCallback(async () => {
    if (isLoadingCosts.current) return;
    
    isLoadingCosts.current = true;
    try {
      const costs = await apiService.getServiceCosts();
      setServiceCosts(costs);
    } catch (err: any) {
      console.error('获取服务费用失败:', err);
      setError(apiService.getErrorMessage(err));
    } finally {
      isLoadingCosts.current = false;
    }
  }, []);

  // 检查积分是否足够
  const checkCredits = useCallback(async () => {
    if (!serviceCosts || isCheckingCredits.current) return;
    
    const cost = serviceCosts[serviceType].cost;
    const serviceTypeText = serviceCosts[serviceType].service_type;
    
    isCheckingCredits.current = true;
    try {
      setChecking(true);
      setError(null);
      const result = await apiService.checkCreditAvailability(cost, serviceTypeText);
      setCheckResult(result);
      onCreditCheck?.(result);
    } catch (err: any) {
      console.error('检查积分失败:', err);
      setError(apiService.getErrorMessage(err));
    } finally {
      setChecking(false);
      isCheckingCredits.current = false;
    }
  }, [serviceCosts, serviceType, onCreditCheck]);

  useEffect(() => {
    loadServiceCosts();
  }, [loadServiceCosts]);

  useEffect(() => {
    if (serviceCosts) {
      checkCredits();
    }
  }, [serviceCosts, checkCredits]);

  // 监听积分更新事件，重新检查积分
  useEffect(() => {
    const handleCreditUpdate = () => {
      if (serviceCosts) {
        checkCredits();
      }
    };
    
    window.addEventListener('creditUpdated', handleCreditUpdate);
    
    return () => {
      window.removeEventListener('creditUpdated', handleCreditUpdate);
    };
  }, [serviceCosts, checkCredits]);

  const cost = serviceCosts?.[serviceType]?.cost || 0;
  const sufficient = checkResult?.sufficient || false;

  return (
    <>
      {children({
        sufficient,
        cost,
        checking,
        error,
        checkResult
      })}
    </>
  );
};

interface CreditInsufficientModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkResult: CreditCheckResult;
  onRetry?: () => void;
}

export const CreditInsufficientModal: React.FC<CreditInsufficientModalProps> = ({
  isOpen,
  onClose,
  checkResult,
  onRetry
}) => {
  const [countdown, setCountdown] = useState<string>('');

  // 计算下次恢复倒计时
  const updateCountdown = () => {
    if (!checkResult.next_recovery_time) return;
    
    const now = new Date().getTime();
    const nextRecovery = new Date(checkResult.next_recovery_time).getTime();
    const diff = nextRecovery - now;
    
    if (diff <= 0) {
      setCountdown('积分已恢复');
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      setCountdown(`${hours}小时${minutes}分${seconds}秒后恢复`);
    } else if (minutes > 0) {
      setCountdown(`${minutes}分${seconds}秒后恢复`);
    } else {
      setCountdown(`${seconds}秒后恢复`);
    }
  };

  useEffect(() => {
    if (!isOpen || !checkResult.next_recovery_time) return;
    
    // 立即更新一次倒计时
    updateCountdown();
    
    // 每秒更新倒计时
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen, checkResult.next_recovery_time]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-panel border border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <Icons.AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">积分不足</h3>
              <p className="text-sm text-slate-400">无法完成此操作</p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">所需积分:</span>
                <span className="text-white font-medium">{checkResult.required_credits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">当前余额:</span>
                <span className="text-white font-medium">{checkResult.current_balance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">还需要:</span>
                <span className="text-red-400 font-medium">{checkResult.shortage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">服务类型:</span>
                <span className="text-white font-medium">{checkResult.service_type}</span>
              </div>
            </div>
          </div>

          {checkResult.next_recovery_time && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Icons.Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">积分恢复提醒</span>
              </div>
              <p className="text-sm text-blue-200">
                {countdown || '计算中...'}
              </p>
              <p className="text-xs text-blue-300 mt-1">
                系统每小时自动恢复5积分，每日凌晨重置为200积分
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              我知道了
            </button>
            {onRetry && (
              <button
                onClick={() => {
                  onRetry();
                  onClose();
                }}
                className="flex-1 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Icons.Refresh className="w-4 h-4" />
                重新检查
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};