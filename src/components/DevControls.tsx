import { useState, useCallback } from 'react'
import { Settings, X, Save, RotateCcw, ChevronRight } from 'lucide-react'
import type { HeroParams } from './HeroIllustration'

interface Props {
  params: HeroParams
  onChange: (params: HeroParams) => void
  onReset: () => void
}

const GROUPS: {
  id: string
  label: string
  icon: string
  fields: {
    key: keyof HeroParams
    label: string
    min: number
    max: number
    step: number
  }[]
}[] = [
  {
    id: 'shape',
    label: 'S 型弧线',
    icon: '〰️',
    fields: [
      { key: 'trailMidX', label: '拐点 X', min: 0.2, max: 0.8, step: 0.01 },
      { key: 'trailMidY', label: '拐点 Y', min: 0.05, max: 0.6, step: 0.01 },
      { key: 'trailCp1X', label: '上段控制 X', min: 0, max: 1, step: 0.01 },
      { key: 'trailCp1Y', label: '上段控制 Y', min: 0, max: 1, step: 0.01 },
      { key: 'trailCp2X', label: '下段控制 X', min: 0, max: 1, step: 0.01 },
      { key: 'trailCp2Y', label: '下段控制 Y', min: 0, max: 1, step: 0.01 },
      { key: 'trailEndX', label: '末端 X', min: 0, max: 0.3, step: 0.01 },
      { key: 'trailEndY', label: '末端 Y', min: 0.5, max: 1, step: 0.01 },
      { key: 'trailStartWidth', label: '起始宽度', min: 1, max: 30, step: 1 },
      { key: 'trailEndWidth', label: '末端宽度', min: 50, max: 500, step: 10 },
    ],
  },
  {
    id: 'ink',
    label: '水墨边缘',
    icon: '🖌️',
    fields: [
      { key: 'edgeWobbleAmp', label: '波动幅度', min: 0, max: 60, step: 1 },
      { key: 'trailLayers', label: '叠加层数', min: 1, max: 5, step: 1 },
    ],
  },
  {
    id: 'color',
    label: '颜色分段',
    icon: '🎨',
    fields: [
      { key: 'purpleZoneStart', label: '紫色起始位置', min: 0.4, max: 0.85, step: 0.01 },
      { key: 'blendWidth', label: '交接渗透宽度', min: 0, max: 0.3, step: 0.01 },
      { key: 'warmBlobCount', label: '暖色色团数', min: 2, max: 8, step: 1 },
      { key: 'coolBlobCount', label: '紫色色团数', min: 2, max: 8, step: 1 },
      { key: 'blobSize', label: '色团大小', min: 40, max: 300, step: 5 },
      { key: 'blobDriftSpeed', label: '漂移速度', min: 0.1, max: 2, step: 0.05 },
    ],
  },
  {
    id: 'effects',
    label: '全局效果',
    icon: '✨',
    fields: [
      { key: 'trailOpacity', label: '透明度', min: 0.05, max: 0.8, step: 0.01 },
      { key: 'trailGlow', label: '发光', min: 0, max: 30, step: 1 },
      { key: 'blurAmount', label: '晕染模糊', min: 0, max: 25, step: 1 },
    ],
  },
  {
    id: 'plane',
    label: '飞机',
    icon: '✈️',
    fields: [
      { key: 'planeX', label: 'X 位置', min: 0, max: 1, step: 0.01 },
      { key: 'planeY', label: 'Y 位置', min: 0, max: 1, step: 0.01 },
      { key: 'planeScale', label: '缩放', min: 0.3, max: 2.5, step: 0.05 },
      { key: 'planeRotation', label: '倾斜角度', min: -60, max: 60, step: 1 },
      { key: 'floatAmplitude', label: '浮动幅度', min: 0, max: 50, step: 1 },
      { key: 'floatSpeed', label: '浮动周期(s)', min: 2, max: 12, step: 0.5 },
    ],
  },
]

export function DevControls({ params, onChange, onReset }: Props) {
  const [open, setOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(GROUPS.map((g) => g.id)),
  )

  const toggleGroup = useCallback((id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleChange = useCallback(
    (key: keyof HeroParams, value: number) => {
      const newParams = { ...params, [key]: value }
      onChange(newParams)
      try {
        localStorage.setItem('hero-illustration-params', JSON.stringify(newParams))
      } catch { /* */ }
    },
    [params, onChange],
  )

  const handleExport = useCallback(() => {
    const json = JSON.stringify(params, null, 2)
    console.log('🎨 Params:\n', json)
    navigator.clipboard.writeText(json).then(
      () => console.log('✅ 已复制'),
      () => console.log('⚠️ 请手动复制'),
    )
  }, [params])

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[200] w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-border shadow-elevated flex items-center justify-center hover:bg-white transition-all duration-200"
        title={open ? '关闭' : '打开'}
      >
        <Settings size={18} className="text-muted-foreground" />
      </button>

      <div
        className={`fixed top-0 right-0 z-[199] h-full w-80 bg-white/95 backdrop-blur-md border-l border-border shadow-elevated transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold text-foreground">🎛️ 参数调节</h3>
          <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-whisper-gray transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {GROUPS.map((group) => {
            const expanded = expandedGroups.has(group.id)
            return (
              <div key={group.id} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-whisper-gray hover:bg-taupe-light transition-colors"
                >
                  <span className="text-xs font-medium text-foreground">{group.icon} {group.label}</span>
                  <ChevronRight size={14} className={`text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
                </button>
                {expanded && (
                  <div className="px-3 py-2 space-y-3">
                    {group.fields.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-muted-foreground">{field.label}</label>
                          <span className="text-[11px] font-mono text-foreground tabular-nums">
                            {typeof params[field.key] === 'number'
                              ? (params[field.key] as number).toFixed(field.step < 1 ? 2 : 0)
                              : String(params[field.key])}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          value={params[field.key] as number}
                          onChange={(e) => handleChange(field.key, parseFloat(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none bg-taupe-light cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground
                            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-border shrink-0">
          <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md bg-foreground text-white hover:opacity-90 transition-opacity">
            <Save size={12} />导出参数
          </button>
          <button onClick={onReset} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md bg-whisper-gray text-foreground hover:bg-taupe-light transition-colors">
            <RotateCcw size={12} />重置
          </button>
        </div>
      </div>
    </>
  )
}
