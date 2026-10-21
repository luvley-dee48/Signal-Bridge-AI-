import type { CSSProperties, ElementType, ReactNode } from 'react'
import { useInView } from '../lib/motion'

interface Props {
  as?: ElementType
  delay?: number
  className?: string
  children: ReactNode
  id?: string
}

/** Scroll-reveal wrapper. Content is visible by default without the `js` class. */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, id }: Props) {
  const [ref, inView] = useInView<HTMLElement>()
  return (
    <Tag
      ref={ref}
      id={id}
      className={`reveal ${inView ? 'in' : ''} ${className}`}
      style={{ '--d': `${delay}s` } as CSSProperties}
    >
      {children}
    </Tag>
  )
}
