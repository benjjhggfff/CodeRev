/**
 * FixExamples 组件用于展示代码修复方案
 * 它接收一组修复示例，并以只读代码编辑器的形式展示，同时提供复制功能
 */
import { Copy } from "lucide-react"; // 导入复制图标组件
import CodeEditor from "@uiw/react-textarea-code-editor"; // 导入代码编辑器组件
import type { FullFixExample } from "../types/review"; // 导入修复示例的类型定义

// 定义组件的属性接口
interface FixExamplesProps {
  examples: FullFixExample[];
  language: string;
  onCopy: (text: string) => void;
}

const READ_ONLY_EDITOR_STYLE = {
  fontSize: 13,
  fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
  backgroundColor: "#1a242d",
  color: "#cdd6e4",
  borderRadius: 8,
  border: "1px solid #3a5068",
} as const;

export function FixExamples({ examples, language, onCopy }: FixExamplesProps) {
  if (examples.length === 0) return null;

  return (
    <section className="panel fixes-panel">
      <div className="panel-title">完整修复方案</div>
      {examples.map((ex, idx) => (
        <div key={idx} style={{ marginBottom: 16, position: "relative" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
              color: "#e0e0e0",
            }}
          >
            <span>{ex.description}</span>
            <button
              onClick={() => onCopy(ex.code)}
              style={{
                background: "#2a3a47",
                border: "none",
                borderRadius: 4,
                padding: "4px 8px",
                color: "#c5d1de",
                cursor: "pointer",
                fontSize: 12,
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
            style={READ_ONLY_EDITOR_STYLE}
            data-color-mode="dark"
          />
        </div>
      ))}
    </section>
  );
}
