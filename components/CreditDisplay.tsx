import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { apiService } from '../services/apiService';
import { CreditBalance } from '../types';

interface CreditDisplayProps {
  className?: string;
  showDetails?: boolean;
  onCreditUpdate?: (balance: CreditBalance) => void;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({ 
  className = '', 
  showDetails = false,
  onCreditUpdate 
}) => {
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextRecoveryCountdown, setNextRecoveryCountdown] = useState<string>('');
  
  // 使用 ref 存储回调，避免依赖变化
  const onCreditUpdateRef = useRef(onCreditUpdate);
  onCreditUpdateRef.current = onCreditUpdate;
  
  // 防止重复请求
  const isRequestInProgress = useRef(false);
  // 组件是否已挂载
  const isMounted = useRef(true);
  // 是否已经因为恢复时间到达而刷新过
  const hasRefreshedForRecovery = useRef(false);

  // 加载积分余额 - 不使用 useCallback，直接定义
  const loadCreditBalance = async () => {
    if (isRequestInProgress.current || !isMounted.current) {
      return;
    }
    
    isRequestInProgress.current = true;
    
    try {
      setLoading(true);
      setError(null);
      const balance = await apiService.getCreditBalance();
      
      if (isMounted.current) {
        setCreditBalance(balance);
        // 只有当获取到新的恢复时间时才重置标志
        // 如果恢复时间没变，保持标志状态避免重复请求
        onCreditUpdateRef.current?.(balance);
      }
    } catch (err: any) {
      if (isMounted.current) {
        console.error('获取积分余额失败:', err);
        setError(apiService.getErrorMessage(err));
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
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

  // 倒计时逻辑 - 独立的 useEffect
  useEffect(() => {
    if (!creditBalance?.next_recovery_time) {
      return;
    }
    
    // 重置恢复标志，因为有了新的恢复时间
    hasRefreshedForRecovery.current = false;
    
    const updateCountdown = () => {
      if (!isMounted.current) return;
      
      const now = Date.now();
      // 处理时间戳：数字直接使用，字符串则解析
      const nextRecovery = typeof creditBalance.next_recovery_time === 'number' 
        ? creditBalance.next_recovery_time 
        : new Date(creditBalance.next_recovery_time).getTime();
      
      const diff = nextRecovery - now;
      
      if (diff <= 0) {
        setNextRecoveryCountdown('积分已可恢复');
        // 只在恢复时间到达时刷新一次，避免无限循环
        if (!hasRefreshedForRecovery.current && !isRequestInProgress.current) {
          hasRefreshedForRecovery.current = true;
          loadCreditBalance();
        }
        // 时间已过，停止倒计时，不再继续检查
        return 'stop';
      }
      
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (minutes > 0) {
        setNextRecoveryCountdown(`${minutes}分${seconds}秒后恢复`);
      } else {
        setNextRecoveryCountdown(`${seconds}秒后恢复`);
      }
    };
    
    // 立即更新一次
    const result = updateCountdown();
    
    // 如果时间已过，不启动定时器
    if (result === 'stop') {
      return;
    }
    
    // 每秒更新
    const interval = setInterval(() => {
      const result = updateCountdown();
      if (result === 'stop') {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [creditBalance?.next_recovery_time]); // 只依赖 next_recovery_time

  // 获取积分状态颜色
  const getCreditStatusColor = () => {
    if (!creditBalance) return 'text-slate-400';
    
    const percentage = (creditBalance.current_balance / creditBalance.daily_limit) * 100;
    
    if (percentage >= 50) return 'text-emerald-400';
    if (percentage >= 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  // 获取积分状态图标
  const getCreditStatusIcon = () => {
    if (!creditBalance) return Icons.Coins;
    
    const percentage = (creditBalance.current_balance / creditBalance.daily_limit) * 100;
    
    if (percentage >= 50) return Icons.Coins;
    if (percentage >= 20) return Icons.AlertTriangle;
    return Icons.AlertCircle;
  };

  if (loading && !creditBalance) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Icons.Refresh className="w-4 h-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-400">加载中...</span>
      </div>
    );
  }

  if (error && !creditBalance) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Icons.AlertCircle className="w-4 h-4 text-red-400" />
        <span className="text-sm text-red-400">积分加载失败</span>
        <button 
          onClick={loadCreditBalance}
          className="text-xs text-slate-400 hover:text-white underline"
        >
          重试
        </button>
      </div>
    );
  }

  if (!creditBalance) return null;

  const StatusIcon = getCreditStatusIcon();
  const statusColor = getCreditStatusColor();
  const percentage = (creditBalance.current_balance / creditBalance.daily_limit) * 100;

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between">
        {/* 左侧：积分数值 */}
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-5 h-5 ${statusColor}`} />
          <div className="flex items-baseline gap-1">
            <span className={`text-lg font-bold ${statusColor}`}>
              {creditBalance.current_balance}
            </span>
            <span className="text-sm text-slate-500">
              / {creditBalance.daily_limit}
            </span>
          </div>
        </div>
        
        {/* 右侧：积分进度条 */}
        {showDetails && (
          <div className="flex flex-col items-end gap-1">
            <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  percentage >= 50 ? 'bg-emerald-400' : 
                  percentage >= 20 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${Math.max(percentage, 3)}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
