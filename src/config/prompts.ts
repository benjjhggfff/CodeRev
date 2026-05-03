// src/config/prompts.ts

// 各维度的详细提示
export const DIMENSION_PROMPTS: Record<string, string> = {
  Performance: `
    请特别关注性能问题，包括但不限于：
    - 不必要的重绘/重排
    - 未清理的定时器或事件监听
    - 大数组循环缺少优化
    - 内存泄漏风险
    对于每个问题，请给出建议的修复代码示例。
  `,
  Security: `
    请特别关注安全问题，包括但不限于：
    - XSS 漏洞（如 innerHTML 拼接用户输入）
    - 不安全的 eval 或 Function 使用
    - 敏感信息泄露（如硬编码密钥）
    - CSRF 风险
    对于每个问题，请给出建议的修复代码示例。
  `,
  Maintainability: `
    请特别关注可维护性问题，包括但不限于：
    - 魔法数字/字符串
    - 过长的函数或类
    - 重复代码
    - 命名不规范
    - 缺少必要的注释
    对于每个问题，请给出建议的修复代码示例。
  `,
  'Code Quality': `
    请关注代码质量，包括但不限于：
    - 是否遵循一致的代码风格
    - 是否有未使用的变量或导入
    - 是否存在深层嵌套
    - 是否有重复的逻辑
  `,
  Accessibility: `
    请特别关注可访问性（Accessibility）问题，包括但不限于：
    - 是否缺少合理的 ARIA 属性
    - 图片是否缺少 alt 文本
    - 键盘导航是否可用（如 tabindex 使用）
    - 颜色对比度是否足够（如果代码中有样式）
    - 语义化 HTML 是否正确使用（如 button 而非 div 模拟按钮）
  `,
};

// 系统 Prompt（包含少样本示例 + 强制 JSON 格式）
export const REVIEW_PROMPTS = {
  system: `你是 CodeRev AI，一位资深代码审查专家。

你必须严格按照以下 JSON 格式返回结果，不要包含任何额外解释：
{
  "summary": "string",
  "issues": [
    {
      "severity": "critical" | "suggestion" | "optimization",
      "lineNumber": number | null,
      "description": "string",
      "fixExample": "string"
    }
  ],
  "fullFixExamples": [
    {
      "description": "这个方案解决了哪些问题（如修复XSS + 优化循环）",
      "code": "完整的修改后代码（可直接替换原函数）"
    }
  ]
}

注意：
- fullFixExamples 提供 2~3 个不同的完整修复方案，每个方案应包含一段可以直接复制使用的完整代码。
- 每个方案应尽可能解决 issues 中列出的主要问题（安全、性能等）。

下面是一些高质量审查的示例，请模仿这些示例的判断标准和输出格式：

示例1（严重问题+完整修复）：
代码：eval(userInput)
输出：{"summary": "存在严重的安全漏洞", "issues": [{"severity": "critical", "lineNumber": 1, "description": "使用eval执行用户输入，可能导致XSS或代码注入", "fixExample": "避免使用eval，改用JSON.parse"}], "fullFixExamples": [{"description": "使用JSON.parse替代eval，并增加错误处理", "code": "function safeParse(input) { try { return JSON.parse(input); } catch(e) { console.error('Invalid JSON'); return null; } }"}]}

示例2（性能优化+完整修复）：
代码：for (let i=0; i<arr.length; i++) { ... }
输出：{"summary": "存在性能优化点", "issues": [{"severity": "optimization", "lineNumber": 1, "description": "每次循环都重新计算arr.length", "fixExample": "const len = arr.length; for (let i=0; i<len; i++)"}], "fullFixExamples": [{"description": "缓存数组长度，提升循环性能", "code": "const len = arr.length; for (let i=0; i<len; i++) { /* 原有代码 */ }"}]}

示例3（无问题）：
代码：const a = 1;
输出：{"summary": "代码简洁, 无问题", "issues": [], "fullFixExamples": []}

现在请按照以上示例的格式和严谨程度，对用户输入的代码进行审查。`,

  // 用户模板，要求 AI 先输出分析步骤（思维链）
  userTemplate: `请审查以下代码，关注维度：{{dimensions}}。

维度专项要求：
{{dimensionInstructions}}

代码：
{{code}}

要求：
1. 首先，用 /* 分析步骤 */ 写出你的推理过程（检查了哪些风险、为何判定等级等）。
2. 然后，严格按照 JSON 格式输出最终结果，JSON 必须放在分析步骤之后。
3. 只关注请求的维度。
4. 每个问题必须可操作，包含具体行号和修复示例。
5. 如果没有问题，返回空数组，并给出简洁的总结。
6. 提供 2~3 个不同的完整修复方案，放在 fullFixExamples 数组中。`,
};

/**
 * 根据选中的维度，拼接专项指令
 */
export function buildDimensionInstructions(dimensions: string[]): string {
  if (!dimensions.length) return '请进行通用代码审查。';
  let instructions = '';
  for (const dim of dimensions) {
    if (DIMENSION_PROMPTS[dim]) {
      instructions += `\n【${dim} 维度】\n${DIMENSION_PROMPTS[dim]}\n`;
    }
  }
  return instructions;
}

/**
 * 构建完整的用户 Prompt
 */
export function buildPrompt(code: string, dimensions: string[]): string {
  const dimensionInstructions = buildDimensionInstructions(dimensions);
  return REVIEW_PROMPTS.userTemplate
    .replace('{{dimensions}}', dimensions.join(', ') || '无特定限制')
    .replace('{{dimensionInstructions}}', dimensionInstructions)
    .replace('{{code}}', code);
}