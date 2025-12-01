import React from 'react';
import { DiffResult } from '../types';

interface DiffViewerProps {
  oldText: string;
  newText: string;
}

// LCS (Longest Common Subsequence) based diff to accurately track word changes
const computeDiff = (text1: string, text2: string): DiffResult[] => {
  const oldWords = text1.trim() === '' ? [] : text1.trim().split(/\s+/);
  const newWords = text2.trim() === '' ? [] : text2.trim().split(/\s+/);

  const m = oldWords.length;
  const n = newWords.length;

  // Initialize DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const results: DiffResult[] = [];
  let i = m;
  let j = n;

  // Backtrack to find the diff path
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      results.unshift({ type: 'same', value: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      results.unshift({ type: 'added', value: newWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      results.unshift({ type: 'removed', value: oldWords[i - 1] });
      i--;
    }
  }

  return results;
};

export const DiffViewer: React.FC<DiffViewerProps> = ({ oldText, newText }) => {
  const diffs = React.useMemo(() => computeDiff(oldText, newText), [oldText, newText]);

  return (
    <div className="text-sm leading-relaxed break-words bg-slate-900/50 p-3 rounded-lg border border-slate-700">
      {diffs.map((diff, idx) => (
        <span key={idx} className={`inline-block mr-1 ${
          diff.type === 'added' ? 'bg-emerald-900/60 text-emerald-200 px-1 rounded' :
          diff.type === 'removed' ? 'bg-red-900/60 text-red-300 line-through px-1 rounded opacity-70' :
          'text-slate-300'
        }`}>
          {diff.value}
        </span>
      ))}
    </div>
  );
};
