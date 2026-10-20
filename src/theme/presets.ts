export type PresetId = 'mint' | 'mist' | 'butter' | 'blossom' | 'mono'

export interface Preset {
  id: PresetId
  /** 侧边栏 / 设置面板里显示的名字 */
  name: string
  /** 一句话气质，选中时显示 */
  hint: string
  brand: string
  brandStrong: string
  /** 重要（★）标记色，随主题微调，避免刺眼正黄 */
  important: string
  /** 紧急（！）标记色 */
  urgent: string
}

export const PRESETS: Preset[] = [
  {
    id: 'mint',
    name: '薄荷',
    hint: '清爽通透，默认主题',
    brand: '#4FC1A6',
    brandStrong: '#37AC90',
    important: '#D79B2B',
    urgent: '#E0654E',
  },
  {
    id: 'mist',
    name: '雾蓝',
    hint: '冷静克制，适合长时间专注',
    brand: '#5B8DEF',
    brandStrong: '#4376D9',
    important: '#C98F2A',
    urgent: '#E0654E',
  },
  {
    id: 'butter',
    name: '奶油',
    hint: '温柔暖调，像下午三点的阳光',
    brand: '#E3B341',
    brandStrong: '#CB9A2A',
    important: '#D97E35',
    urgent: '#D9604A',
  },
  {
    id: 'blossom',
    name: '樱粉',
    hint: '柔和轻盈，偏生活记录',
    brand: '#E58EA8',
    brandStrong: '#D0748F',
    important: '#CE8C44',
    urgent: '#DE6553',
  },
  {
    id: 'mono',
    name: '墨',
    hint: '近黑白极简，安静高级',
    brand: '#3F4845',
    brandStrong: '#2C3432',
    important: '#A8823A',
    urgent: '#C65F4C',
  },
]

export const DEFAULT_PRESET = PRESETS[0]

export function getPreset(id: string): Preset {
  return PRESETS.find((p) => p.id === id) ?? DEFAULT_PRESET
}
