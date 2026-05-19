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
  // JPY 等无小数货币
  const decimals = ['JPY', 'KRW'].includes(currency) ? 0 : 2
  if (Math.abs(num) >= 10000) {
    return `${(num / 10000).toFixed(decimals)}万`
  }
  return num.toFixed(decimals)
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

// 券商标准费率（按市场区分）
export const FEE_RATES = {
  // A股
  commission_rate: 0.00025,   // 0.025% (万2.5)
  commission_min: 5,          // 最低 5 元
  stamp_duty_rate: 0.0005,    // 0.05% 卖出印花税
  transfer_fee_rate: 0.00001, // 0.001% 过户费
}

// 港股费率
export const HK_FEE_RATES = {
  commission_rate: 0.0003,
  commission_min: 3,
  stamp_duty_rate: 0.001,     // 0.1%
  transfer_fee_rate: 0,
}

// 美股费率
export const US_FEE_RATES = {
  commission_rate: 0.005,     // 每股 $0.005
  commission_min: 1,
  stamp_duty_rate: 0,
  transfer_fee_rate: 0,
}

export function getFeeRates(currency) {
  if (currency === 'HKD') return HK_FEE_RATES
  if (currency === 'USD') return US_FEE_RATES
  return FEE_RATES
}

// 计算卖出预估费用
export function calculateSellFees(price, quantity, currency = 'CNY') {
  const rates = getFeeRates(currency)
  const amount = Number(price) * Number(quantity)
  const commission = Math.max(amount * rates.commission_rate, rates.commission_min)
  const stamp_duty = amount * rates.stamp_duty_rate
  const transfer_fee = amount * rates.transfer_fee_rate
  const total = commission + stamp_duty + transfer_fee
  return {
    trade_amount: amount,
    commission: commission.toFixed(2),
    stamp_duty: stamp_duty.toFixed(2),
    transfer_fee: transfer_fee.toFixed(2),
    total_fees: total.toFixed(2),
    net_proceeds: (amount - total).toFixed(2),
  }
}
