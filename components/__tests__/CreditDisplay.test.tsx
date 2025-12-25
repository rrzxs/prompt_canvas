import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CreditDisplay } from '../CreditDisplay';
import { apiService } from '../../services/apiService';

// Mock apiService
jest.mock('../../services/apiService', () => ({
  apiService: {
    getCreditBalance: jest.fn()
  }
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('CreditDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('显示加载状态', () => {
    mockApiService.getCreditBalance.mockImplementation(() => new Promise(() => {}));
    
    render(<CreditDisplay />);
    
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('显示积分余额', async () => {
    const mockBalance = {
      current_balance: 150,
      daily_limit: 200,
      last_recovery_time: '2024-01-01T10:00:00Z',
      last_reset_date: '2024-01-01',
      next_recovery_time: '2024-01-01T11:00:00Z',
      next_reset_time: '2024-01-02T00:00:00Z'
    };

    mockApiService.getCreditBalance.mockResolvedValue(mockBalance);
    
    render(<CreditDisplay />);
    
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('/ 200')).toBeInTheDocument();
    });
  });

  it('显示错误状态', async () => {
    mockApiService.getCreditBalance.mockRejectedValue(new Error('网络错误'));
    
    render(<CreditDisplay />);
    
    await waitFor(() => {
      expect(screen.getByText('积分加载失败')).toBeInTheDocument();
      expect(screen.getByText('重试')).toBeInTheDocument();
    });
  });

  it('显示详细信息', async () => {
    const mockBalance = {
      current_balance: 50,
      daily_limit: 200,
      last_recovery_time: '2024-01-01T10:00:00Z',
      last_reset_date: '2024-01-01',
      next_recovery_time: '2024-01-01T11:00:00Z',
      next_reset_time: '2024-01-02T00:00:00Z'
    };

    mockApiService.getCreditBalance.mockResolvedValue(mockBalance);
    
    render(<CreditDisplay showDetails={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('积分不足，请合理使用')).toBeInTheDocument();
    });
  });
});