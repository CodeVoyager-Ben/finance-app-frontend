import { Row, Col, Card, Statistic } from 'antd'
import {
  FundOutlined, DollarOutlined, RiseOutlined,
  FallOutlined, TrophyOutlined, StockOutlined,
} from '@ant-design/icons'
import { formatPct } from '../constants'

const fmt = (v) => Number(v || 0).toFixed(2)

const gradientStyle = (c1, c2) => ({
  background: `linear-gradient(135deg, ${c1}, ${c2})`,
  borderRadius: 12,
})

export default function DashboardStats({ dashboard, loading }) {
  if (!dashboard) return null

  const pl = Number(dashboard.total_profit_loss || 0)
  const dailyPl = Number(dashboard.total_daily_pl || 0)

  const stats = [
    {
      title: '总市值',
      value: fmt(dashboard.total_market_value),
      icon: <FundOutlined />,
      style: gradientStyle('#1677ff', '#4096ff'),
    },
    {
      title: '总成本',
      value: fmt(dashboard.total_cost),
      icon: <DollarOutlined />,
      style: gradientStyle('#722ed1', '#9254de'),
    },
    {
      title: '总盈亏',
      value: `${pl >= 0 ? '+' : ''}${fmt(pl)}`,
      subValue: formatPct(dashboard.total_profit_loss_pct),
      icon: pl >= 0 ? <RiseOutlined /> : <FallOutlined />,
      style: gradientStyle(pl >= 0 ? '#f5222d' : '#52c41a', pl >= 0 ? '#ff7875' : '#95de64'),
    },
    {
      title: '今日盈亏',
      value: `${dailyPl >= 0 ? '+' : ''}${fmt(dailyPl)}`,
      subValue: formatPct(dashboard.total_daily_pl_pct),
      icon: <StockOutlined />,
      style: gradientStyle(dailyPl >= 0 ? '#fa541c' : '#13c2c2', dailyPl >= 0 ? '#ff7a45' : '#36cfc9'),
    },
    {
      title: '累计分红',
      value: fmt(dashboard.total_dividend_income),
      icon: <TrophyOutlined />,
      style: gradientStyle('#faad14', '#ffc53d'),
    },
    {
      title: '持仓数',
      value: dashboard.holdings_count,
      icon: <FundOutlined />,
      style: gradientStyle('#52c41a', '#73d13d'),
    },
  ]

  return (
    <Row gutter={[16, 16]}>
      {stats.map((s, i) => (
        <Col xs={12} sm={8} md={4} key={i}>
          <Card size="small" style={s.style} styles={{ body: { padding: '12px 16px' } }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>{s.title}</span>}
              value={s.value}
              prefix={s.icon}
              suffix={s.subValue ? <span style={{ fontSize: 12 }}>({s.subValue})</span> : null}
              valueStyle={{ color: '#fff', fontSize: 18, fontWeight: 600 }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  )
}
