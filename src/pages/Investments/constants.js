// 资产大类颜色
export const CATEGORY_COLORS = {
  security: '#1677ff',
  commodity: '#ffc53d',
  fixed_income: '#13c2c2',
  real_estate: '#eb2f96',
  insurance: '#95de64',
  other: '#999',
}

// 支持的币种列表
export const CURRENCIES = [
  { value: 'CNY', label: '人民币 (CNY)' },
  { value: 'USD', label: '美元 (USD)' },
  { value: 'HKD', label: '港币 (HKD)' },
  { value: 'EUR', label: '欧元 (EUR)' },
  { value: 'GBP', label: '英镑 (GBP)' },
  { value: 'JPY', label: '日元 (JPY)' },
  { value: 'AUD', label: '澳元 (AUD)' },
  { value: 'CAD', label: '加元 (CAD)' },
  { value: 'SGD', label: '新加坡元 (SGD)' },
]

// 交易类型配置
export const TRANSACTION_TYPES = {
  buy: { label: '买入', color: '#f5222d', icon: '↑' },
  sell: { label: '卖出', color: '#52c41a', icon: '↓' },
  dividend: { label: '分红', color: '#faad14', icon: '💰' },
  interest: { label: '利息', color: '#13c2c2', icon: '🏦' },
  dividend_reinvest: { label: '分红再投资', color: '#722ed1', icon: '🔄' },
  deposit: { label: '入金', color: '#1677ff', icon: '➕' },
  withdraw: { label: '出金', color: '#ff4d4f', icon: '➖' },
  fee: { label: '费用', color: '#8c8c8c', icon: '📄' },
  split: { label: '拆股/合股', color: '#eb2f96', icon: '✂️' },
}

// 分红类型配置
export const DIVIDEND_TYPES = {
  cash: { label: '现金分红', color: '#faad14' },
  reinvest: { label: '分红再投资', color: '#722ed1' },
  interest: { label: '利息收入', color: '#13c2c2' },
}

// 金额格式化
export function formatMoney(value, currency = 'CNY') {
  if (value === null || value === undefined) return '0.00'
  const num = Number(value)
  if (Math.abs(num) >= 10000) {
    return `${(num / 10000).toFixed(2)}万`
  }
  return num.toFixed(2)
}

// 盈亏颜色
export function plColor(value) {
  if (value > 0) return '#f5222d'
  if (value < 0) return '#52c41a'
  return '#8c8c8c'
}

// 百分比格式化
export function formatPct(value) {
  if (value === null || value === undefined) return '0.00%'
  return `${Number(value).toFixed(2)}%`
}
