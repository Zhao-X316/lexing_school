/**
 * 首页配置类型 - 与 admin 端 config 结构一致
 */

export interface HeroConfig {
  title?: string
  subtitle?: string
  background_image?: string
  cta_text?: string
  cta_link?: string
}

export interface PhilosophyItem {
  title: string
  description: string
  icon: string
}

export interface PhilosophyConfig {
  title?: string
  items?: PhilosophyItem[]
}

export interface FacilityItem {
  name: string
  description: string
  image: string
}

export interface FacilitiesConfig {
  title?: string
  items?: FacilityItem[]
}

export interface WhyChooseUsItem {
  title: string
  description: string
  icon: string
}

export interface WhyChooseUsConfig {
  title?: string
  items?: WhyChooseUsItem[]
}

export interface ContactConfig {
  address?: string
  phone?: string
  email?: string
  wechat?: string
  working_hours?: string
  latitude?: string
  longitude?: string
}

export interface HomepageConfigMap {
  hero?: string
  philosophy?: string
  facilities?: string
  why_choose_us?: string
  contact?: string
}

export interface ParsedHomepageConfig {
  hero: HeroConfig
  philosophy: PhilosophyConfig
  facilities: FacilitiesConfig
  why_choose_us: WhyChooseUsConfig
  contact: ContactConfig
}
