'use client'

interface VerificationBadgeProps {
  type?: 'gold' | 'blue' | 'red' | 'none' | string | null
  className?: string
}

export default function VerificationBadge({ type, className = 'w-[22px] h-[22px]' }: VerificationBadgeProps) {
  if (!type || type === 'none') return null

  let src = ''
  let alt = ''

  if (type === 'gold') {
    src = '/gold_checkmark.png'
    alt = 'Gold Verified'
  } else if (type === 'blue') {
    src = '/blue_checkmark.png'
    alt = 'Blue Verified'
  } else if (type === 'red') {
    src = '/red_checkmark.png'
    alt = 'Red Verified'
  } else {
    return null
  }

  return (
    <img
      src={src}
      alt={alt}
      title={alt}
      className={`inline-block ml-0.5 shrink-0 align-middle select-none ${className}`}
      draggable={false}
    />
  )
}
