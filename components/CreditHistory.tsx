import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { apiService } from '../services/apiService';
import { CreditHistory as CreditHistoryType, CreditLog } from '../types';

interface CreditHistoryProps {
  onClose: () => void;
}

export const CreditHistory: React.FC<CreditHistoryProps> = ({ onClose }) => {
  const [history, setHistory] = useState<CreditHistoryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [operationType, setOperationType] = useState<string>('');

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCreditHistory(days, operationType || undefined);
      setHistory(data);
    } catch (err: any) {
      console.error('获取积分历史失败:', err);
      setError(apiService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [days, operationType]);

  const getOperationIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case 'consume':
        return Icons.Minus;
      case 'recover':
        return Icons.Plus;
      case 'reset':
        return Icons.RotateCcw;
      default:
        return Icons.Circle;
    }
  };

  const getOperationColor = (type: string) => {
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case 'consume':
        return 'text-red-400';
      case 'recover':
        return 'text-emerald-400';
      case 'reset':
        return 'text-blue-400';
      default:
        return 'text-slate-400';
    }
  };

  const getOperationText = (type: string) => {
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case 'consume':
        return '消耗';
      case 'recover':
        return '恢复';
      case 'reset':
        return '重置';
      default:
        return '未知';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays}天前 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-panel border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Icons.History className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-bold text-white">积分使用历史</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* 筛选器 */}
        <div className="p-6 border-b border-slate-700 bg-slate-800/30">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300">查询天数:</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1 text-sm text-white focus:border-accent outline-none"
              >
                <option value={7}>最近7天</option>
                <option value={30}>最近30天</option>
                <option value={90}>最近90天</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300">操作类型:</label>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value)}
                className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1 text-sm text-white focus:border-accent outline-none"
              >
                <option value="">全部</option>
                <option value="consume">消耗</option>
                <option value="recover">恢复</option>
                <option value="reset">重置</option>
              </select>
            </div>

            <button
              onClick={loadHistory}
              className="bg-accent hover:bg-accent-hover text-white px-4 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Icons.Refresh className="w-4 h-4" />
              刷新
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        {history && (
          <div className="p-6 border-b border-slate-700 bg-slate-900/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {history.today_statistics.total_consumed_today}
                </div>
                <div className="text-sm text-slate-400">今日消耗</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {history.today_statistics.total_recovered_today}
                </div>
                <div className="text-sm text-slate-400">今日恢复</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-300">
                  {history.total_records}
                </div>
                <div className="text-sm text-slate-400">总记录数</div>
              </div>
            </div>
          </div>
        )}

        {/* 历史记录列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Icons.Refresh className="w-8 h-8 animate-spin text-slate-400 mr-3" />
              <span className="text-slate-400">加载历史记录中...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <Icons.AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-300 mb-4">{error}</p>
              <button
                onClick={loadHistory}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                重试
              </button>
            </div>
          ) : !history || history.logs.length === 0 ? (
            <div className="text-center py-20">
              <Icons.History className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-500">暂无积分使用记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.logs.map((log) => {
                const OperationIcon = getOperationIcon(log.operation_type);
                const operationColor = getOperationColor(log.operation_type);
                const operationText = getOperationText(log.operation_type);
                
                return (
                  <div
                    key={log.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center ${operationColor}`}>
                          <OperationIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{operationText}</span>
                            <span className={`font-bold ${operationColor}`}>
                              {log.operation_type.toLowerCase() === 'consume' ? '-' : '+'}
                              {log.amount}
                            </span>
                            <span className="text-slate-400">积分</span>
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            {log.service_type && (
                              <span className="mr-3">服务: {log.service_type}</span>
                            )}
                            {log.description && (
                              <span>{log.description}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-slate-300">
                          余额: {log.balance_before} → {log.balance_after}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {formatDate(log.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};