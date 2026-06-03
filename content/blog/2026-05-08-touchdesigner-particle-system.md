---
title: 从零构建 TouchDesigner 粒子系统
date: 2026-05-08
category: 创意编程
excerpt: 探索如何使用 GLSL 和 TOP 节点在 TouchDesigner 中创建令人惊叹的实时粒子效果。从基础粒子运动到复杂力场模拟，一步步揭开创意编程的面纱。
---

# 从零构建 TouchDesigner 粒子系统

探索如何使用 GLSL 和 TOP 节点在 TouchDesigner 中创建令人惊叹的实时粒子效果。

## 基础粒子运动

在 TouchDesigner 中，粒子系统通常通过 TOP 节点链来实现。最基础的方法是利用 Noise TOP 和 Feedback TOP 来模拟粒子的运动轨迹。

每个粒子本质上是一个像素，其颜色值编码了位置和速度信息。通过 GLSL TOP，我们可以在 GPU 上并行计算每个粒子的运动：

```glsl
vec2 position = texture(sTD2DInputs[0], uv).rg;
vec2 velocity = texture(sTD2DInputs[1], uv).ba;
position += velocity * uTime;
```

## 力场模拟

引入噪声场可以为粒子添加有机的运动感。Perlin 噪声和 Simplex 噪声都是不错的选择：

- **Perlin 噪声**：产生平滑、自然的流动效果
- **Curl 噪声**：基于 Perlin 噪声的旋度场，适合模拟流体
- **距离场**：根据粒子到吸引器/排斥器的距离计算力的大小

## 渲染优化

对于百万级粒子，关键在于批量处理和数据压缩。使用 RGBA 纹理来存储粒子状态，每帧通过 ping-pong 技术在两个纹理之间切换。

## 总结

TouchDesigner 的粒子系统是一个深度课题，从基础运动到复杂力场，每一步都充满创意空间。
