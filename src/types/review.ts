// src/types/review.ts
export type ReviewDimension =
  | 'Performance'
  | 'Security'
  | 'Maintainability'
  | 'Code Quality'
  | 'Accessibility';

export const REVIEW_DIMENSIONS: ReviewDimension[] = [
  'Performance',
  'Security',
  'Maintainability',
  'Code Quality',
  'Accessibility',
];

export interface ReviewIssue {
  severity: 'critical' | 'suggestion' | 'optimization';
  lineNumber: number | null;
  description: string;
  fixExample: string; // 小片段修复示例
}

export interface FullFixExample {
  description: string;      // 说明这个方案解决了哪些问题
  code: string;             // 完整的修改后代码（可直接替换原函数/文件）
}

export interface ReviewResponse {
  summary: string;
  issues: ReviewIssue[];
  fullFixExamples?: FullFixExample[]; // 新增：完整的修复方案（2~3个）
}