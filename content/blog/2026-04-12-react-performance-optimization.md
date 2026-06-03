---
title: React 性能优化实战指南
date: 2026-04-12
category: 前端开发
excerpt: 从虚拟列表到懒加载，从 memo 优化到状态管理策略，总结在实际项目中验证过的 React 性能优化技巧与最佳实践。
---

# React 性能优化实战指南

从虚拟列表到懒加载，分享在实际项目中验证过的 React 性能优化技巧。

## 渲染优化

### React.memo 的正确使用

`React.memo` 通过浅比较 props 来避免不必要的重渲染。但要注意：

- props 中的回调函数需要用 `useCallback` 包裹
- props 中的对象需要用 `useMemo` 包裹
- 不要对频繁变化的组件使用 memo（比较成本 > 渲染节省）

### 虚拟列表

对于长列表，使用虚拟化技术只渲染可视区域内的元素：

- `react-window`：轻量级，适合简单列表
- `react-virtuoso`：功能更丰富，支持动态高度

## 状态管理

### 状态拆分

将一个大状态拆分为多个小状态，减少相互影响：

```typescript
// ❌ 避免
const [state, setState] = useState({ a: 1, b: 2, c: 3 })

// ✅ 推荐
const [a, setA] = useState(1)
const [b, setB] = useState(2)
```

### Context 优化

Context 的 value 变化会导致所有消费者重渲染。解决方案：

- 拆分 Context
- 使用 `useMemo` 稳定 value 引用

## 总结

性能优化不是一次性的工作，而是需要持续关注和实践的过程。关键是在正确的时间点，针对正确的瓶颈采取正确的措施。
