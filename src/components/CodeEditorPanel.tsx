/**
 * 导入CodeEditor组件，这是一个用于代码编辑的文本区域组件
 */
import CodeEditor from "@uiw/react-textarea-code-editor";

interface CodeEditorPanelProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
}

const EDITOR_STYLE = {
  fontSize: 14,
  fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
  backgroundColor: "#1e2a32",
  color: "#e0e0e0",
  borderRadius: 12,
  border: "1px solid #3a5068",
} as const;

export function CodeEditorPanel({
  code,
  language,
  onChange,
}: CodeEditorPanelProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <section className="panel editor-panel">
      <div className="panel-title">Code Editor</div>
      <CodeEditor
        value={code}
        language={language}
        onChange={handleChange}
        padding={14}
        style={EDITOR_STYLE}
        data-color-mode="dark"
      />
    </section>
  );
}
