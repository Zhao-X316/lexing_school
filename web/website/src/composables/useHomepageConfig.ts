/**
 * 首页配置 composable - 拉取、解析、提供默认值
 */

import { ref, readonly } from 'vue'
import { getHomepageConfig } from '@/api/homepage'
import type {
  ParsedHomepageConfig,
  HeroConfig,
  PhilosophyConfig,
  FacilitiesConfig,
  WhyChooseUsConfig,
  ContactConfig
} from '@/types/homepage'

const defaultHero: HeroConfig = {
  title: '用心呵护，\n每个孩子的星光',
  subtitle: '',
  background_image: '',
  cta_text: '',
  cta_link: ''
}

const defaultPhilosophy: PhilosophyConfig = {
  title: '在这里，你们不再是孤军奋战',
  items: [
    {
      title: '',
      description:
        '我们深知，自闭症谱系家庭的旅程充满了未知与挑战。在乐星，我们不视差异为缺陷，而是将其视为每个孩子独特的宇宙。',
      icon: ''
    },
    {
      title: '',
      description:
        '我们的康复体系建立在极度同理心、坚定的决心与科学的干预之上。在这里，每一丝微小的进步都会被看见，每一次情绪的起伏都能被接纳。我们不仅是教育者，更是您最坚实的后盾。',
      icon: ''
    }
  ]
}

const defaultFacilities: FacilitiesConfig = {
  title: '参观我们专业的康复室和功能丰富的活动室',
  items: [
    {
      name: '安全、纯净的成长庇护所',
      description:
        '每一间康复室都经过精心的声学与光影设计，确保为孩子们提供低刺激、高包容的感官环境。从专业的感统训练中心到个别化干预 (IEP) 教室，我们用医疗级的严谨与教育者的温情，构筑孩子们探索世界的安全基石。',
      image: ''
    }
  ]
}

const defaultWhyChooseUs: WhyChooseUsConfig = {
  title: '为什么选择我们',
  items: [
    { title: '我们的价值观', description: '在乐星，我们相信每个孩子都是宇宙中独一无二的星体。我们不强求整齐划一的轨道，而是致力于发现并点亮他们原有的运行轨迹。', icon: '' },
    { title: '校长致辞', description: '"真正的融合，不是让孩子们努力伪装成普通人的样子，而是教导整个世界去拥抱神经多样性。这是乐星建立的初衷，也是我们每日践行的使命。"', icon: '' },
    { title: '师资力量支撑', description: '我们汇聚了BCBA认证行为分析师、资深言语治疗师(ST)及作业治疗师(OT)。以1:1或1:2的极致师生比，确保护理的极度专业与专注。', icon: '' },
    { title: '完整的教学规划', description: '从科学全面的入校评估，到定制化IEP个别教育计划；从密集的早期干预，到学龄期的融合过渡。我们为您规划一条清晰可见的成长路径。', icon: '' }
  ]
}

const defaultContact: ContactConfig = {
  address: '北京市朝阳区\n某某路123号',
  phone: '010-1234-5678',
  email: 'contact@lexing-school.com',
  wechat: '',
  working_hours: ''
}

function parseConfigValue<T>(raw: string | undefined, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback
  try {
    const parsed = JSON.parse(raw) as T
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}

function deepMerge<T extends object>(defaults: T, overrides: Partial<T>): T {
  const result = { ...defaults }
  for (const k of Object.keys(overrides) as (keyof T)[]) {
    const v = overrides[k]
    if (v === undefined) continue
    if (Array.isArray(v) && Array.isArray((result as Record<string, unknown>)[k as string])) {
      ;(result as Record<string, unknown>)[k as string] = v.length ? v : (result as Record<string, unknown>)[k as string]
    } else if (v && typeof v === 'object' && !Array.isArray(v) && typeof (result as Record<string, unknown>)[k as string] === 'object') {
      ;(result as Record<string, unknown>)[k as string] = deepMerge(
        (result as Record<string, unknown>)[k as string] as object,
        v as object
      )
    } else {
      ;(result as Record<string, unknown>)[k as string] = v
    }
  }
  return result
}

const config = ref<ParsedHomepageConfig>({
  hero: defaultHero,
  philosophy: defaultPhilosophy,
  facilities: defaultFacilities,
  why_choose_us: defaultWhyChooseUs,
  contact: defaultContact
})

export const homepageConfig = readonly(config)

export async function loadHomepageConfig(): Promise<void> {
  const raw = await getHomepageConfig()
  config.value = {
    hero: deepMerge(defaultHero, parseConfigValue<HeroConfig>(raw.hero, {})),
    philosophy: deepMerge(defaultPhilosophy, parseConfigValue<PhilosophyConfig>(raw.philosophy, {})),
    facilities: deepMerge(defaultFacilities, parseConfigValue<FacilitiesConfig>(raw.facilities, {})),
    why_choose_us: deepMerge(defaultWhyChooseUs, parseConfigValue<WhyChooseUsConfig>(raw.why_choose_us, {})),
    contact: deepMerge(defaultContact, parseConfigValue<ContactConfig>(raw.contact, {}))
  }
}
