import { Sparkles } from 'lucide-react';
import type { ReviewResponse } from '../types/review';

interface ReviewResultProps {
  streamedText: string;
  reviewData: ReviewResponse | null;
  error: string | null;
}

const SEVERITY_STYLES: Record<string, { color: string; bg: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.06)' },
  optimization: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.06)' },
  default: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.06)' },
};

function getSeverityStyle(severity: string) {
  return SEVERITY_STYLES[severity] || SEVERITY_STYLES.default;
}

export function ReviewResult({ streamedText, reviewData, error }: ReviewResultProps) {
  const hasIssues = reviewData?.issues && reviewData.issues.length > 0;

  return (
    <section className="panel result-panel">
      <div className="panel-title">审查结果</div>

      <details
        open
        style={{
          marginBottom: 12,
          borderRadius: 8,
          border: '1px solid #3a5068',
          overflow: 'hidden',
        }}
      >
        <summary
          style={{
            padding: '10px 14px',
            cursor: 'pointer',
            backgroundColor: '#1e2a32',
            color: '#e0e0e0',
            outline: 'none',
          }}
        >
          AI 分析思考过程（点击展开/收起）
        </summary>
        <pre
          style={{
            padding: '12px 14px',
            margin: 0,
            backgroundColor: '#1a242d',
            color: '#c5d1de',
            fontSize: 13,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        >
          {streamedText || '等待 AI 分析...'}
        </pre>
      </details>

      {hasIssues ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {reviewData!.issues.map((issue, idx) => {
            const style = getSeverityStyle(issue.severity);
            return (
              <div
                key={idx}
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${style.color}`,
                  backgroundColor: style.bg,
                  border: '1px solid #3a5068',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    style={{
                      color: style.color,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    {issue.severity}
                  </span>
                  <span style={{ color: '#9ca3af' }}>
                    Line {issue.lineNumber || '?'}
                  </span>
                </div>
                <div
                  style={{
                    color: '#e0e0e0',
                    marginBottom: '8px',
                    fontSize: '14px',
                  }}
                >
                  {issue.description}
                </div>
                <div style={{ color: '#a5b4fc', fontSize: '13px' }}>
                  💡 修复建议：{issue.fixExample}
                </div>
              </div>
            );
          })}
        </div>
      ) : reviewData ? (
        <div style={{ color: '#9ca3af', padding: '10px 0' }}>代码无明显问题</div>
      ) : null}

      {error && (
        <p className="error-message" style={{ color: '#ef4444', marginTop: 12 }}>
          {error}
        </p>
      )}

      {reviewData && (
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#86efac',
            fontSize: '13px',
          }}
        >
          <Sparkles size={16} />
          <span>AI 已完成结构化审查 · 共 {reviewData.issues.length} 项结果</span>
        </div>
      )}
    </section>
  );
}