/**
 * 代码审查应用主组件
 * 提供代码编辑、维度选择、结果展示等功能
 */
import { useMemo, useState } from "react";
import { startReviewWithRetry } from "./services/reviewService"; // 导入代码审查服务
import { autoDetectLanguage } from "./utils/codeUtils"; // 导入语言自动检测工具
import type { ReviewDimension, ReviewResponse } from "./types/review"; // 导入审查相关的类型定义
import { useRef } from "react"; // 导入 useRef 用于创建可变引用
import {
  AppHeader,
  Toast,
  CodeEditorPanel,
  DimensionSelector,
  ReviewResult,
  FixExamples,
} from "./components"; // 导入所有组件

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

/**
 * 应用主组件
 * @returns {JSX.Element} 渲染的应用界面
 */
export default function App() {
  // 状态管理
  const [code, setCode] = useState(placeholderCode); // 当前编辑的代码
  const [selectedDimensions, setSelectedDimensions] = useState<
    ReviewDimension[]
  >(["Performance", "Security"]); // 选中的审查维度
  const [isReviewing, setIsReviewing] = useState(false); // 是否正在审查中
  const [streamedText, setStreamedText] = useState(""); // 流式审查结果文本
  const [reviewData, setReviewData] = useState<ReviewResponse | null>(null); // 审查结果数据
  const [error, setError] = useState<string | null>(null); // 错误信息
  const [toastMessage, setToastMessage] = useState<string | null>(null); // Toast提示信息
  // 用户暂停审查
  const abortControllerRef = useRef<AbortController | null>(null);

  // 自动检测代码语言
  const language = useMemo(() => autoDetectLanguage(code), [code]);

  // 判断是否可以开始审查
  const canStartReview = useMemo(
    () =>
      code.trim().length > 0 && selectedDimensions.length > 0 && !isReviewing,
    [code, selectedDimensions, isReviewing],
  );

  // 切换审查维度
  const toggleDimension = (dimension: ReviewDimension) => {
    setSelectedDimensions(
      (prev) =>
        prev.includes(dimension)
          ? prev.filter((item) => item !== dimension) // 如果已选中，则移除
          : [...prev, dimension], // 如果未选中，则添加
    );
  };

  // 显示Toast提示
  const showToast = (message: string) => {
    setToastMessage(message);
  };

  // 关闭Toast提示
  const closeToast = () => {
    setToastMessage(null);
  };

  // 复制文本到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("复制成功！");
    } catch {
      showToast("复制失败，请重试");
    }
  };

  // 处理开始审查
  const handleStartReview = async () => {
    // 如果有正在进行的审查，先取消它
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // 创建新的 AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 开始审查
    setIsReviewing(true);
    setError(null);
    setReviewData(null);
    setStreamedText("");

    try {
      const result = await startReviewWithRetry({
        code,
        dimensions: selectedDimensions,
        onChunk: (chunk) => setStreamedText((prev) => prev + chunk), // 处理流式数据
        signal: controller.signal, // 传递 AbortController 信号
      });
      setReviewData(result);
    } catch (reviewError) {
      // 检查是否是用户取消审查
      if (
        reviewError instanceof DOMException &&
        reviewError.name === "AbortError"
      ) {
        showToast("审查已取消");
        setStreamedText((prev) => prev + "\n[已取消]");
        return;
      }
      const message =
        reviewError instanceof Error
          ? reviewError.message
          : "Unknown review error";
      setError(`Review failed: ${message}`);
    } finally {
      setIsReviewing(false);
      // 重置 AbortController 引用
      abortControllerRef.current = null;
    }
  };
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
  // 渲染应用界面
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
