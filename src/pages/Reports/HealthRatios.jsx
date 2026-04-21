import { Row, Col, Card, Progress, Tag, Statistic, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, HeartFilled } from '@ant-design/icons'

const { Text } = Typography

function RatioCard({ label, value, max, format, thresholds }) {
  const pct = Math.min((value / max) * 100, 100)
  let color = '#52c41a'
  let status = '健康'
  if (value >= thresholds.danger) {
    color = '#ff4d4f'
    status = '危险'
  } else if (value >= thresholds.warning) {
    color = '#faad14'
    status = '注意'
  }

  return (
    <Card size="small" style={{ borderRadius: 8, height: '100%' }}
      styles={{ body: { padding: '12px 16px' } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text strong style={{ fontSize: 13 }}>{label}</Text>
        <Tag color={color === '#52c41a' ? 'green' : color === '#faad14' ? 'orange' : 'red'}
          style={{ margin: 0, fontSize: 11 }}>
          {status}
        </Tag>
      </div>
      <Progress percent={pct} showInfo={false} strokeColor={color} size="small" />
      <div style={{ marginTop: 4 }}>
        <Text strong style={{ color, fontSize: 16 }}>{format(value)}</Text>
      </div>
    </Card>
  )
}

export default function HealthRatios({ ratios, netWorthChange }) {
  if (!ratios) return null

  const isPositive = netWorthChange?.change >= 0

  return (
    <Card title={
      <span><HeartFilled style={{ color: '#eb2f96', marginRight: 8 }} />财务健康指标</span>
    } style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <RatioCard
            label="资产负债率"
            value={ratios.debt_ratio}
            max={0.8}
            format={v => `${(v * 100).toFixed(1)}%`}
            thresholds={{ warning: 0.3, danger: 0.5 }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <RatioCard
            label="流动性比率"
            value={Math.min(ratios.current_ratio, 20)}
            max={10}
            format={v => ratios.current_ratio >= 999 ? '无负债' : v.toFixed(2)}
            thresholds={{ warning: 10, danger: 20 }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <RatioCard
            label="月储蓄率"
            value={ratios.savings_ratio}
            max={1}
            format={v => `${(v * 100).toFixed(1)}%`}
            thresholds={{ warning: 0.1, danger: 0 }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{
            borderRadius: 8, height: '100%',
            background: isPositive
              ? 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)'
              : 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
          }} styles={{ body: { padding: '12px 16px' } }}>
            <Text strong style={{ fontSize: 13 }}>净资产环比</Text>
            <div style={{ marginTop: 8 }}>
              <Statistic
                value={netWorthChange?.change || 0}
                prefix={isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                suffix={`(${netWorthChange?.change_pct > 0 ? '+' : ''}${netWorthChange?.change_pct || 0}%)`}
                valueStyle={{
                  color: isPositive ? '#52c41a' : '#ff4d4f',
                  fontSize: 18, fontWeight: 700,
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </Card>
  )
}
