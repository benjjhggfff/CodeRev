/**
 * DimensionSelector 组件用于选择代码审查的维度并启动审查过程
 * 它允许用户选择不同的审查维度，并在满足条件时启动审查
 */
import {
  Accessibility as AccessibilityIcon, // 可访问性图标，重命名为 AccessibilityIcon 以避免命名冲突
  Code2, // 代码质量图标
  Gauge, // 性能图标
  Play, // 播放/开始图标
  ShieldCheck, // 安全图标
  Wrench, // 可维护性图标
} from "lucide-react"; // 从 lucide-react 图标库导入图标
import type { ReactNode } from "react"; // 导入 ReactNode 类型
import { REVIEW_DIMENSIONS } from "../types/review"; // 导入审查维度常量
import type { ReviewDimension } from "../types/review"; // 导入审查维度类型

/**
 * DimensionSelector 组件的属性接口
 * 定义了组件所需的 props 及其类型
 */
interface DimensionSelectorProps {
  selectedDimensions: ReviewDimension[]; // 当前选中的审查维度数组
  isReviewing: boolean; // 是否正在审查中
  canStartReview: boolean; // 是否可以开始审查
  onToggleDimension: (dimension: ReviewDimension) => void; // 切换维度选中状态的回调函数
  onStartReview: () => void; // 开始审查的回调函数
}

/**
 * 维度到对应图标的映射对象
 * 每个审查维度关联一个 ReactNode 类型的图标组件
 */
const dimensionIcons: Record<ReviewDimension, ReactNode> = {
  Performance: <Gauge size={16} />, // 性能维度使用仪表盘图标
  Security: <ShieldCheck size={16} />, // 安全维度使用盾牌图标
  Maintainability: <Wrench size={16} />, // 可维护性维度使用扳手图标
  "Code Quality": <Code2 size={16} />, // 代码质量维度使用代码图标
  Accessibility: <AccessibilityIcon size={16} />, // 可访问性维度使用无障碍图标
};

/**
 * DimensionSelector 组件
 * 提供用户界面来选择审查维度并启动审查
 */
export function DimensionSelector({
  selectedDimensions, // 当前选中的维度数组
  isReviewing, // 审查状态标志
  canStartReview, // 是否可以开始审查
  onToggleDimension, // 切换维度的处理函数
  onStartReview, // 开始审查的处理函数
}: DimensionSelectorProps) {
  return (
    <section className="panel controls-panel">
      <div className="panel-title">Review Dimensions</div>
      <div className="dimension-list">
        {/* 遍历所有审查维度，为每个维度创建一个按钮 */}
        {REVIEW_DIMENSIONS.map((dimension) => {
          const isActive = selectedDimensions.includes(dimension); // 检查当前维度是否被选中
          return (
            <button
              key={dimension} // 使用维度作为 key
              type="button"
              className={`dimension-pill ${isActive ? "is-active" : ""}`} // 根据选中状态添加样式类
              onClick={() => onToggleDimension(dimension)} // 点击时切换维度选中状态
              disabled={isReviewing} // 审查中时禁用维度选择
            >
              {dimensionIcons[dimension]} {/* 显示对应维度的图标 */}
              <span>{dimension}</span> {/* 显示维度名称 */}
            </button>
          );
        })}
      </div>

      {/* 开始审查按钮 */}
      <button
        type="button"
        className="start-review-btn"
        onClick={onStartReview} // 点击时触发开始审查
        disabled={!canStartReview} // 当不满足开始审查条件时禁用
      >
        <Play size={16} />
        {isReviewing ? "Reviewing..." : "Start Review"}{" "}
        {/* 根据审查状态显示不同文本 */}
      </button>
    </section>
  );
}
