import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { apiService } from '../services/apiService';
import { CreditBalance } from '../types';

interface CreditStatusBannerProps {
  className?: string;
}

export const CreditStatusBanner: React.FC<CreditStatusBannerProps> = ({ className = '' }) => {
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  // 防止重复请求
  const isRequestInProgress = useRef(false);
  // 组件是否已挂载
  const isMounted = useRef(true);
  // 使用 ref 存储 dismissed 状态，避免依赖变化
  const dismissedRef = useRef(dismissed);
  dismissedRef.current = dismissed;

  // 加载积分余额
  const loadCreditBalance = async () => {
    if (isRequestInProgress.current || !isMounted.current) {
      return;
    }
    
    isRequestInProgress.current = true;
    
    try {
      const balance = await apiService.getCreditBalance();
      
      if (isMounted.current) {
        setCreditBalance(balance);
        
        // 如果积分不足20且未被关闭，显示横幅
        if (balance.current_balance < 20 && !dismissedRef.current) {
          setShowBanner(true);
        } else {
          setShowBanner(false);
        }
      }
    } catch (err: any) {
      console.error('获取积分余额失败:', err);
    } finally {
      isRequestInProgress.current = false;
    }
  };

  // 组件挂载时加载数据，只执行一次
  useEffect(() => {
    isMounted.current = true;
    loadCreditBalance();
    
    // 监听积分更新事件
    const handleCreditUpdate = () => {
      if (!isRequestInProgress.current) {
        loadCreditBalance();
      }
    };
    
    window.addEventListener('creditUpdated', handleCreditUpdate);
    
    return () => {
      isMounted.current = false;
      window.removeEventListener('creditUpdated', handleCreditUpdate);
    };
  }, []); // 空依赖，只在挂载时执行一次

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
  };

  if (!showBanner || !creditBalance) return null;

  const isZero = creditBalance.current_balance === 0;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 ${className}`}>
      <div className={`rounded-lg border p-4 shadow-lg backdrop-blur-sm ${
        isZero 
          ? 'bg-red-500/10 border-red-500/30 text-red-300' 
          : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
      }`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isZero ? (
              <Icons.AlertCircle className="w-5 h-5 text-red-400" />
            ) : (
              <Icons.AlertTriangle className="w-5 h-5 text-yellow-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium">
              {isZero ? '积分已用完' : '积分不足提醒'}
            </h4>
            <p className="text-xs mt-1 opacity-90">
              {isZero 
                ? '您的积分已用完，无法使用AI服务。系统每小时自动恢复5积分。'
                : `您的积分余额为${creditBalance.current_balance}，建议合理使用剩余积分。`
              }
            </p>
            {creditBalance.next_recovery_time && (
              <p className="text-xs mt-1 opacity-75">
                下次恢复时间：{new Date(
                  typeof creditBalance.next_recovery_time === 'number' 
                    ? creditBalance.next_recovery_time 
                    : creditBalance.next_recovery_time
                ).toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
