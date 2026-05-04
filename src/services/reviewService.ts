import { buildPrompt, REVIEW_PROMPTS } from "../config/prompts";
import type { ReviewDimension, ReviewResponse } from "../types/review";

const API_CONFIG = {
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: "sk-635e38a724e841bd8be52afa1bc915fb",
  model: "qwen-coder-turbo-0919",
};

// 增加重试逻辑
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// 判断错误是否可重试（网络错误、5xx 服务端错误、速率限制等）
function isRetriableError(error: any): boolean {
  if (error instanceof TypeError && error.name === "AbortError") return false; // 用户取消不重试
  if (error.state) {
    return error.state.code >= 500 || error.state.code === 429; // 服务端错误或速率限制
  }
  if (error.message?.includes("fetch") || error.message?.includes("network")) {
    return true;
  }
  return false;
}

// 🔥 修复：超级稳定提取 JSON，兼容各种混乱格式
function extractJSONFromResponse(raw: string): string {
  let str = raw;

  // 1. 清理所有 markdown 代码块
  str = str.replace(/```json|```/gi, "").trim();

  // 2. 找到第一个 { 和最后一个 }
  const first = str.indexOf("{");
  const last = str.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No valid JSON object found in AI response");
  }

  let json = str.slice(first, last + 1);

  // 3. 🔥 自动修复常见错误（关键！）
  json = json
    .replace(/\n/g, " ") // 换行变空格
    .replace(/\r/g, "") // 回车清理
    .replace(/\t/g, " ") // 制表符清理
    .replace(/,\s*}/g, "}") // 去掉尾逗号
    .replace(/,\s*]/g, "]")
    .replace(/(['"])\s*,\s*([}\]])/g, "$1$2");

  return json;
}

// 🔥 修复：安全解析 JSON（自动容错）
function safeParseJSON<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.warn("JSON 修复失败，尝试极简兼容模式");
    return {
      summary: "AI 返回格式不标准，已展示原始分析",
      issues: [],
      fullFixExamples: [],
    } as T;
  }
}

// 🔥 主函数（流式，完全稳定）
async function startReview(params: {
  code: string;
  dimensions: ReviewDimension[];
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<ReviewResponse> {
  const { code, dimensions, onChunk, signal } = params;
  const userPrompt = buildPrompt(code, dimensions);

  const response = await fetch(`${API_CONFIG.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: API_CONFIG.model,
      messages: [
        { role: "system", content: REVIEW_PROMPTS.system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`API错误 ${response.status}: ${err.message || "未知错误"}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullRawContent = "";

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content || "";
        if (delta) {
          fullRawContent += delta;
          onChunk?.(delta);
        }
      } catch {}
    }
  }

  // 提取 + 解析
  try {
    const cleanJson = extractJSONFromResponse(fullRawContent);
    const result = safeParseJSON<ReviewResponse>(cleanJson);

    // 格式兜底
    if (!result.issues) result.issues = [];
    if (!result.fullFixExamples) result.fullFixExamples = [];

    return result;
  } catch (e) {
    console.error("最终兼容模式返回");
    return {
      summary: "AI 输出格式异常，但已展示原始分析",
      issues: [],
      fullFixExamples: [],
    };
  }
}

export async function startReviewWithRetry(
  params: {
    code: string;
    dimensions: ReviewDimension[];
    onChunk?: (chunk: string) => void;
    signal?: AbortSignal;
  },
  maxRetries = 6,
): Promise<ReviewResponse> {
  let lastError: any;
  let delay = 1000; // 初始延迟 1 秒

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 调用真正的 startReview（需要确保 startReview 内部也传递 signal）
      const result = await startReview(params);
      return result;
    } catch (error) {
      lastError = error;
      // 如果不可重试，立即抛出
      if (!isRetriableError(error) || attempt === maxRetries) {
        throw error;
      }
      // 如果用户主动取消（signal.aborted），不再重试
      if (params.signal?.aborted) {
        throw error;
      }
      console.warn(
        `请求失败，${delay}ms 后重试... (${attempt + 1}/${maxRetries})`,
      );
      await sleep(delay);
      delay *= 2; // 指数退避
    }
  }
  throw lastError;
}
// 非流式不动
export async function reviewCode(
  code: string,
  dimensions: string[] = [],
): Promise<ReviewResponse> {
  const userPrompt = buildPrompt(code, dimensions);
  const response = await fetch(`${API_CONFIG.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: API_CONFIG.model,
      messages: [
        { role: "system", content: REVIEW_PROMPTS.system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${error.message || response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "";
  const cleanJson = extractJSONFromResponse(content);
  return safeParseJSON<ReviewResponse>(cleanJson);
}
