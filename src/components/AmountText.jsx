import usePrivacyStore from '../store/privacyStore'

export default function AmountText({ value, pageKey, prefix = '¥', precision = 2, style, className }) {
  const hiddenPages = usePrivacyStore((s) => s.hiddenPages)

  if (hiddenPages[pageKey]) {
    return <span style={{ ...style, letterSpacing: 2 }}>{prefix ? `${prefix} ` : ''}****</span>
  }

  const num = parseFloat(value || 0)
  const abs = Math.abs(num)
  const formatted = abs.toLocaleString('zh-CN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
  const sign = num < 0 ? '-' : ''

  return <span style={style} className={className}>{prefix}{sign}{formatted}</span>
}
