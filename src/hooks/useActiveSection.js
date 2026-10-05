import { useEffect, useState } from 'react'

/** Scroll spy for the sidebar: reports which section is currently in view. */
export function useActiveSection(sectionIds) {
  const [active, setActive] = useState(sectionIds[0])

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element) => element !== null)

    if (!elements.length || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length) setActive(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -55% 0px', threshold: [0.12, 0.4, 0.75] },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [sectionIds])

  return [active, setActive]
}
