import { onMounted, onUnmounted, type Ref } from 'vue'

const defaultOptions: IntersectionObserverInit = {
  root: null,
  rootMargin: '0px',
  threshold: 0.3
}

/**
 * 当元素进入视口时添加 class（用于滚动进入动画）
 */
export function useIntersectionObserver(
  targetRef: Ref<HTMLElement | null | undefined>,
  className = 'is-visible',
  options: Partial<IntersectionObserverInit> = {}
) {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const el = targetRef.value
    if (!el) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(className)
            observer?.unobserve(entry.target)
          }
        })
      },
      { ...defaultOptions, ...options }
    )
    observer.observe(el)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })
}

/**
 * 观察多个目标，进入视口时添加 class
 */
export function useIntersectionObserverMulti(
  targetRef: Ref<HTMLElement | null | undefined>,
  selector: string,
  className = 'is-visible',
  options: Partial<IntersectionObserverInit> = {}
) {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const root = targetRef.value
    if (!root) return

    const targets = root.querySelectorAll(selector)
    if (targets.length === 0) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(className)
            observer?.unobserve(entry.target)
          }
        })
      },
      { ...defaultOptions, ...options }
    )
    targets.forEach((el) => observer?.observe(el))
  })

  onUnmounted(() => {
    observer?.disconnect()
  })
}
