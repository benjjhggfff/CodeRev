/**
 * 代码审查应用主组件
 * 提供代码编辑、维度选择、结果展示等功能
 */
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { startReviewWithRetry } from "./services/reviewService";
import { autoDetectLanguage } from "./utils/codeUtils";
import type { ReviewDimension, ReviewResponse } from "./types/review";
import {
  AppHeader,
  Toast,
  CodeEditorPanel,
  DimensionSelector,
  ReviewResult,
  FixExamples,
} from "./components";

// 初始示例代码
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

export default function App() {
  // ========== 状态管理 ==========
  const [code, setCode] = useState(placeholderCode);
  const [selectedDimensions, setSelectedDimensions] = useState<ReviewDimension[]>([
    "Performance",
    "Security",
  ]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [reviewData, setReviewData] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ========== Ref 管理 ==========
  const abortControllerRef = useRef<AbortController | null>(null);

  // requestAnimationFrame 批量更新相关
  const pendingChunksRef = useRef<string>("");
  const rafIdRef = useRef<number | null>(null);

  // ========== 辅助函数 ==========
  const showToast = (message: string) => {
    setToastMessage(message);
  };
  const closeToast = () => {
    setToastMessage(null);
  };
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("复制成功！");
    } catch {
      showToast("复制失败，请重试");
    }
  };

  // 自动检测代码语言
  const language = useMemo(() => autoDetectLanguage(code), [code]);

  // 判断是否可以开始审查
  const canStartReview = useMemo(
    () => code.trim().length > 0 && selectedDimensions.length > 0 && !isReviewing,
    [code, selectedDimensions, isReviewing]
  );

  // ========== requestAnimationFrame 批量更新调度 ==========
  const scheduleUpdate = useCallback(() => {
    if (rafIdRef.current !== null) return; // 已有待处理任务
    rafIdRef.current = requestAnimationFrame(() => {
      setStreamedText((prev) => {
        const newText = prev + pendingChunksRef.current;
        pendingChunksRef.current = ""; // 清空缓冲区
        return newText;
      });
      rafIdRef.current = null;
    });
  }, []);

  // 组件卸载时取消未执行的 raf
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // ========== 核心操作 ==========
  const toggleDimension = (dimension: ReviewDimension) => {
    setSelectedDimensions((prev) =>
      prev.includes(dimension)
        ? prev.filter((item) => item !== dimension)
        : [...prev, dimension]
    );
  };

  const handleStartReview = async () => {
    // 取消之前的审查请求（如果有）
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // 清空之前的动画帧任务
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    pendingChunksRef.current = "";
    // 重置状态
    setIsReviewing(true);
    setError(null);
    setReviewData(null);
    setStreamedText("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await startReviewWithRetry({
        code,
        dimensions: selectedDimensions,
        onChunk: (chunk: string) => {
          // 将新到达的字符放入缓冲区，并调度一次批量更新
          pendingChunksRef.current += chunk;
          scheduleUpdate();
        },
        signal: controller.signal,
      });
      // 审查成功完成后，强制提交最后可能残留的缓冲区内容
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
        setStreamedText((prev) => prev + pendingChunksRef.current);
        pendingChunksRef.current = "";
      }
      setReviewData(result);
    } catch (reviewError) {
      // 处理用户主动取消
      if (reviewError instanceof DOMException && reviewError.name === "AbortError") {
        showToast("审查已取消");
        setStreamedText((prev) => prev + "\n[已取消]");
      } else {
        const message =
          reviewError instanceof Error ? reviewError.message : "Unknown review error";
        setError(`审查失败: ${message}`);
      }
    } finally {
      setIsReviewing(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // ========== 渲染 ==========
  return (
    <main className="app-shell">
      <AppHeader />

      <CodeEditorPanel code={code} language={language} onChange={setCode} />

      {toastMessage && <Toast message={toastMessage} onClose={closeToast} />}

      <DimensionSelector
        selectedDimensions={selectedDimensions}
        isReviewing={isReviewing}
        canStartReview={canStartReview}
        onToggleDimension={toggleDimension}
        onStartReview={handleStartReview}
        onCancelReview={handleCancel}
      />

      <ReviewResult
        streamedText={streamedText}
        reviewData={reviewData}
        error={error}
      />

      {reviewData?.fullFixExamples && (
        <FixExamples
          examples={reviewData.fullFixExamples}
          language={language}
          onCopy={copyToClipboard}
        />
      )}
    </main>
  );
}