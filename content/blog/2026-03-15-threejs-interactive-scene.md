---
title: 用 Three.js 创建交互式 3D 场景
date: 2026-03-15
category: 前端开发
excerpt: 从场景搭建到着色器编程，完整记录如何使用 Three.js 创建引人入胜的 Web 3D 体验，包括点云、粒子与后期处理效果。
---

# 用 Three.js 创建交互式 3D 场景

从场景搭建到着色器编程，完整记录如何使用 Three.js 创建引人入胜的 Web 3D 体验。

## 场景搭建

每个 3D 场景从三个基本元素开始：场景（Scene）、相机（Camera）和渲染器（Renderer）。

```javascript
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true })
```

## 点云粒子

点云是创建有机感和科技感场景的利器。每个粒子是一个点，通过着色器可以控制其大小、颜色和运动：

- 使用 `BufferGeometry` 存储粒子位置
- 通过 `PointsMaterial` 或自定义 `ShaderMaterial` 控制外观
- 利用噪声函数在着色器中驱动粒子运动

## 后期处理

EffectComposer 是 Three.js 后期处理的核心：

- **Bloom**：发光效果
- **SSAO**：环境光遮蔽
- **自定义 Pass**：通过着色器实现个性化效果

## 交互设计

好的交互让 3D 场景从"好看"变为"好玩"：

- 鼠标交互（悬停、拖拽）
- 滚轮缩放
- 触摸手势支持

## 总结

Three.js 为 Web 端的 3D 创作提供了强大的基础，从简单的粒子效果到复杂的交互场景，都有丰富的 API 支持。
