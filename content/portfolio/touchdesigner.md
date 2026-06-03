---
title: TouchDesigner 视觉生成器
description: 使用 TouchDesigner 构建的实时视觉生成系统，融合粒子系统、噪声算法与音频反应，打造沉浸式数字艺术体验。
date: 2025-03-15
tags:
  - TouchDesigner
  - GLSL
  - 创意编程
  - 实时渲染
color: from-purple-500/10 to-pink-500/10
---

# TouchDesigner 视觉生成器

使用 TouchDesigner 构建的实时视觉生成系统，融合粒子系统、噪声算法与音频反应。

## 特性

- **粒子系统**：基于 GPU 的百万级粒子实时模拟
- **噪声场**：多层 Perlin 噪声叠加，产生有机流动效果
- **音频反应**：FFT 频谱分析驱动视觉变化
- **MIDI 控制**：支持 MIDI 控制器实时调节参数

## 技术细节

- GLSL 着色器编写自定义粒子行为
- TOP 节点链式处理管线
- CHOP 节点处理音频和 MIDI 数据
- Python 脚本扩展功能
