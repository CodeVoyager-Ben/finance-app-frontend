import { Drawer, Descriptions, Table, Tag } from 'antd'
import { plColor, formatMoney, formatPct, TRANSACTION_TYPES } from '../constants'

export default function HoldingDetailDrawer({ holding, open, onClose, transactions }) {
  if (!holding) return null

  const relatedTx = transactions.filter(t => t.symbol === holding.symbol)

  const pl = Number(holding.profit_loss || 0)
  const dpl = Number(holding.daily_profit_loss || 0)

  return (
    <Drawer
      title={`${holding.name} (${holding.symbol})`}
      open={open}
      onClose={onClose}
      width={560}
    >
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="账户">{holding.account_name}</Descriptions.Item>
        <Descriptions.Item label="类型">
          <Tag color={holding.asset_type_color || '#1677ff'}>{holding.account_type_name}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="数量">{Number(holding.quantity).toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="成本价">{Number(holding.avg_cost).toFixed(4)}</Descriptions.Item>
        <Descriptions.Item label="现价">{Number(holding.current_price).toFixed(4)}</Descriptions.Item>
        <Descriptions.Item label="市值">{formatMoney(holding.market_value)}</Descriptions.Item>
        <Descriptions.Item label="日盈亏">
          <span style={{ color: plColor(dpl), fontWeight: 600 }}>
            {dpl >= 0 ? '+' : ''}{formatMoney(dpl)} ({formatPct(holding.daily_profit_loss_pct)})
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="总盈亏">
          <span style={{ color: plColor(pl), fontWeight: 600 }}>
            {pl >= 0 ? '+' : ''}{formatMoney(pl)} ({formatPct(holding.profit_loss_pct)})
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="总回报率">
          <span style={{ color: plColor(Number(holding.total_return_rate)), fontWeight: 600 }}>
            {formatPct(holding.total_return_rate)}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="年化收益">
          <span style={{ color: plColor(Number(holding.annualized_return)) }}>
            {formatPct(holding.annualized_return)}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="持有天数">
          {holding.holding_days > 0 ? `${holding.holding_days}天` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="日均成本">
          {holding.daily_avg_cost > 0 ? formatMoney(holding.daily_avg_cost) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="累计分红">
          {formatMoney(holding.accumulated_dividend)}
        </Descriptions.Item>
        <Descriptions.Item label="币种">
          {holding.effective_currency !== 'CNY' ? holding.effective_currency : '人民币'}
        </Descriptions.Item>
        {holding.group_tag && (
          <Descriptions.Item label="分组">
            <Tag>{holding.group_tag}</Tag>
          </Descriptions.Item>
        )}
      </Descriptions>

      <div style={{ marginTop: 24, fontWeight: 600, marginBottom: 12 }}>交易历史</div>
      <Table
        dataSource={relatedTx}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 10 }}
        columns={[
          { title: '日期', dataIndex: 'date', width: 90 },
          {
            title: '类型', dataIndex: 'transaction_type', width: 100,
            render: (v) => {
              const cfg = TRANSACTION_TYPES[v] || { label: v, color: '#999' }
              return <Tag color={cfg.color}>{cfg.label}</Tag>
            },
          },
          { title: '数量', dataIndex: 'quantity', width: 80, align: 'right', render: (v) => Number(v).toFixed(2) },
          { title: '价格', dataIndex: 'price', width: 80, align: 'right', render: (v) => Number(v).toFixed(4) },
          { title: '金额', dataIndex: 'amount', width: 90, align: 'right', render: (v) => formatMoney(v) },
          { title: '备注', dataIndex: 'note', width: 120, ellipsis: true },
        ]}
      />
    </Drawer>
  )
}
