import {
  Accessibility as AccessibilityIcon,
  Code2,
  Copy,
  Gauge,
  Play,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { startReview } from './services/reviewService';
import { REVIEW_DIMENSIONS } from './types/review';
import type { ReviewDimension, ReviewResponse } from './types/review';


const placeholderCode = `function renderUserComment(comment) {
  const el = document.getElementById("comment");
  el.innerHTML = comment;

  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < comments.length; j++) {
      if (comments[j].userId === users[i].id) {
        // expensive nested lookup
      }
    }
  }
}`;

// 自动识别代码语言
function autoDetectLanguage(code: string): string {
  if (!code) return 'typescript';
  const c = code.toLowerCase();
  if (c.includes('def ') || c.includes('import numpy') || c.includes('print(')) return 'python';
  if (c.includes('public static void') || c.includes('class ') && c.includes('{')) return 'java';
  if (c.includes('function') || c.includes('const ') || c.includes('let ')) return 'typescript';
  if (c.includes('<div') || c.includes('</div>')) return 'html';
  if (c.includes('{') && c.includes(':')) return 'json';
  if (c.includes('SELECT ') || c.includes('FROM ')) return 'sql';
  if (c.includes('include') || c.includes('cout')) return 'cpp';
  if (c.includes('package main') || c.includes('func ')) return 'go';
  return 'typescript';
}

const dimensionIcons: Record<ReviewDimension, ReactNode> = {
  Performance: <Gauge size={16} />,
  Security: <ShieldCheck size={16} />,
  Maintainability: <Wrench size={16} />,
  'Code Quality': <Code2 size={16} />,
  Accessibility: <AccessibilityIcon size={16} />,
};

export default function App() {
  const [code, setCode] = useState(placeholderCode);
  const [selectedDimensions, setSelectedDimensions] = useState<ReviewDimension[]>([
    'Performance',
    'Security',
  ]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [reviewData, setReviewData] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const language = useMemo(() => autoDetectLanguage(code), [code]);

  const canStartReview = useMemo(
    () => code.trim().length > 0 && selectedDimensions.length > 0 && !isReviewing,
    [code, selectedDimensions, isReviewing]
  );

  const toggleDimension = (dimension: ReviewDimension) => {
    setSelectedDimensions((prev) =>
      prev.includes(dimension)
        ? prev.filter((item) => item !== dimension)
        : [...prev, dimension]
    );
  };

  const [toast, setToast] = useState<{ show: boolean; text: string }>({ show: false, text: '' });

  const showToast = (text: string) => {
    setToast({ show: true, text });
    setTimeout(() => setToast({ show: false, text: '' }), 1500);
  };
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('复制成功！');
    } catch (err) {
      showToast('复制失败，请重试');
    }
  };

  const handleStartReview = async () => {
    setIsReviewing(true);
    setError(null);
    setReviewData(null);
    setStreamedText('');

    try {
      const result = await startReview({
        code,
        dimensions: selectedDimensions,
        onChunk: (chunk) => setStreamedText((prev) => prev + chunk),
      });
      setReviewData(result);
    } catch (reviewError) {
      const message =
        reviewError instanceof Error ? reviewError.message : 'Unknown review error';
      setError(`Review failed: ${message}`);
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>CodeRev AI</h1>
        <p>Paste code, pick dimensions, and stream actionable review feedback.</p>
      </header>

      <section className="panel editor-panel">
        <div className="panel-title">Code Editor</div>
        <CodeEditor
          value={code}
          language={language}
          onChange={(e) => setCode(e.target.value)}
          padding={14}
          style={{
            fontSize: 14,
            fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
            backgroundColor: '#1e2a32',
            color: '#e0e0e0',
            borderRadius: 12,
            border: '1px solid #3a5068',
          }}
          data-color-mode="dark"
        />
      </section>
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#1a242d',
          color: '#86efac',
          padding: '10px 20px',
          borderRadius: 8,
          border: '1px solid #3a5068',
          zIndex: 9999,
          fontSize: 16
        }}>
          {toast.text}
        </div>
      )}
      <section className="panel controls-panel">
        <div className="panel-title">Review Dimensions</div>
        <div className="dimension-list">
          {REVIEW_DIMENSIONS.map((dimension) => {
            const active = selectedDimensions.includes(dimension);
            return (
              <button
                key={dimension}
                type="button"
                className={`dimension-pill ${active ? 'is-active' : ''}`}
                onClick={() => toggleDimension(dimension)}
              >
                {dimensionIcons[dimension]}
                <span>{dimension}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="start-review-btn"
          onClick={handleStartReview}
          disabled={!canStartReview}
        >
          <Play size={16} />
          {isReviewing ? 'Reviewing...' : 'Start Review'}
        </button>
      </section>

      {/* 审查结果 - 卡片UI */}
      <section className="panel result-panel">
        <div className="panel-title">审查结果</div>

        <details open={true} style={{ marginBottom: 12, borderRadius: 8, border: '1px solid #3a5068', overflow: 'hidden' }}>
          {/* 默认展开 */}
          <summary style={{ padding: '10px 14px', cursor: 'pointer', backgroundColor: '#1e2a32', color: '#e0e0e0', outline: 'none' }}>
             AI 分析思考过程（点击展开/收起）
          </summary>
          <pre style={{
            padding: '12px 14px',
            margin: 0,
            backgroundColor: '#1a242d',
            color: '#c5d1de',
            fontSize: 13,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}>
            {streamedText || '等待 AI 分析...'}
          </pre>
        </details>

        {reviewData?.issues && reviewData.issues.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reviewData.issues.map((issue, idx) => {
              let severityColor = '#3b82f6';
              let bg = 'rgba(59, 130, 246, 0.06)';
              if (issue.severity === 'critical') {
                severityColor = '#ef4444';
                bg = 'rgba(239, 68, 68, 0.06)';
              }
              if (issue.severity === 'optimization') {
                severityColor = '#f59e0b';
                bg = 'rgba(245, 158, 11, 0.06)';
              }

              return (
                <div key={idx} style={{
                  padding: '14px',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${severityColor}`,
                  backgroundColor: bg,
                  border: '1px solid #3a5068',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: severityColor, fontWeight: 600, textTransform: 'uppercase' }}>
                      {issue.severity}
                    </span>
                    <span style={{ color: '#9ca3af' }}>Line {issue.lineNumber || '?'}</span>
                  </div>
                  <div style={{ color: '#e0e0e0', marginBottom: '8px', fontSize: '14px' }}>
                    {issue.description}
                  </div>
                  <div style={{ color: '#a5b4fc', fontSize: '13px' }}>
                    💡 修复建议：{issue.fixExample}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: '#9ca3af', padding: '10px 0' }}>
            {reviewData ? '代码无明显问题' : ''}
          </div>
        )}

        {error && (
          <p className="error-message" style={{ color: '#ef4444', marginTop: 12 }}>{error}</p>
        )}

        {reviewData && (
          <div style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#86efac',
            fontSize: '13px'
          }}>
            <Sparkles size={16} />
            <span>AI 已完成结构化审查 · 共 {reviewData.issues.length} 项结果</span>
          </div>
        )}
      </section>

      {/* ✅ 完整修复方案 + 复制按钮 */}
      {reviewData?.fullFixExamples && reviewData.fullFixExamples.length > 0 && (
        <section className="panel fixes-panel">
          <div className="panel-title">完整修复方案</div>
          {reviewData.fullFixExamples.map((ex, idx) => (
            <div key={idx} style={{ marginBottom: 16, position: 'relative' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
                color: '#e0e0e0'
              }}>
                <span>{ex.description}</span>
                <button
                  onClick={() => copyToClipboard(ex.code)}
                  style={{
                    background: '#2a3a47',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 8px',
                    color: '#c5d1de',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  <Copy size={14} /> 复制
                </button>
              </div>

              <CodeEditor
                value={ex.code}
                language={language}
                readOnly
                padding={12}
                style={{
                  fontSize: 13,
                  fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
                  backgroundColor: '#1a242d',
                  color: '#cdd6e4',
                  borderRadius: 8,
                  border: '1px solid #3a5068',
                }}
                data-color-mode="dark"
              />
            </div>
          ))}
        </section>
        
      )}

    </main>
  );
}