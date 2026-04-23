import { useState, useEffect } from 'react'
import { Drawer, Descriptions, Table, Tag } from 'antd'
import { plColor, formatMoney, formatPct, TRANSACTION_TYPES, calculateSellFees } from '../constants'
import { getDailySnapshots } from '../../../api/finance'

export default function HoldingDetailDrawer({ holding, open, onClose, transactions }) {
  const [snapshots, setSnapshots] = useState([])

  useEffect(() => {
    if (open && holding?.symbol) {
      getDailySnapshots({ symbol: holding.symbol, start_date: getDateNDaysAgo(30) })
        .then(res => setSnapshots(res.snapshots || []))
        .catch(() => setSnapshots([]))
    }
  }, [open, holding?.symbol])

  if (!holding) return null

  const relatedTx = transactions.filter(t => t.symbol === holding.symbol)
  const pl = Number(holding.profit_loss || 0)
  const dpl = Number(holding.daily_profit_loss || 0)

  return (
    <Drawer
      title={`${holding.name} (${holding.symbol})`}
      open={open}
      onClose={onClose}
      width={600}
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

      {Number(holding.quantity) > 0 && Number(holding.current_price) > 0 && (() => {
        const fees = calculateSellFees(holding.current_price, holding.quantity)
        const sellPl = Number(fees.net_proceeds) - Number(holding.cost_value)
        return (
          <>
            <div style={{ marginTop: 24, fontWeight: 600, marginBottom: 12 }}>卖出费用预估</div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="卖出金额">{formatMoney(fees.trade_amount)}</Descriptions.Item>
              <Descriptions.Item label="佣金 (万2.5)">{fees.commission}</Descriptions.Item>
              <Descriptions.Item label="印花税 (0.05%)">{fees.stamp_duty}</Descriptions.Item>
              <Descriptions.Item label="过户费 (0.001%)">{fees.transfer_fee}</Descriptions.Item>
              <Descriptions.Item label="总费用">
                <span style={{ color: '#ff4d4f' }}>{fees.total_fees}</span>
              </Descriptions.Item>
              <Descriptions.Item label="净到账">{formatMoney(fees.net_proceeds)}</Descriptions.Item>
              <Descriptions.Item label="卖出净盈亏" span={2}>
                <span style={{ color: plColor(sellPl), fontWeight: 600 }}>
                  {sellPl >= 0 ? '+' : ''}{formatMoney(sellPl)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </>
        )
      })()}

      {snapshots.length > 0 && (
        <>
          <div style={{ marginTop: 24, fontWeight: 600, marginBottom: 12 }}>每日盈亏（近30天）</div>
          <Table
            dataSource={snapshots}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            columns={[
              { title: '日期', dataIndex: 'date', width: 100 },
              { title: '收盘价', dataIndex: 'close_price', width: 90, align: 'right', render: (v) => Number(v).toFixed(2) },
              { title: '数量', dataIndex: 'quantity', width: 80, align: 'right', render: (v) => Number(v).toFixed(2) },
              { title: '市值', dataIndex: 'market_value', width: 100, align: 'right', render: (v) => formatMoney(v) },
              {
                title: '当日盈亏', dataIndex: 'daily_pl', width: 110, align: 'right',
                render: (v, r) => (
                  <span style={{ color: plColor(Number(v)), fontWeight: 600 }}>
                    {Number(v) >= 0 ? '+' : ''}{formatMoney(v)} <span style={{ fontSize: 11 }}>({formatPct(r.daily_pl_pct)})</span>
                  </span>
                ),
              },
              {
                title: '累计盈亏', dataIndex: 'total_pl', width: 110, align: 'right',
                render: (v, r) => (
                  <span style={{ color: plColor(Number(v)) }}>
                    {Number(v) >= 0 ? '+' : ''}{formatMoney(v)}
                  </span>
                ),
              },
            ]}
          />
        </>
      )}

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
          { title: '手续费', dataIndex: 'fee', width: 80, align: 'right', render: (v) => Number(v || 0).toFixed(2) },
          {
            title: '盈亏', dataIndex: 'profit_loss', width: 100, align: 'right',
            render: (v) => {
              const n = Number(v || 0)
              return n !== 0 ? <span style={{ color: plColor(n), fontWeight: 600 }}>{n >= 0 ? '+' : ''}{formatMoney(n)}</span> : '-'
            },
          },
          { title: '备注', dataIndex: 'note', width: 100, ellipsis: true },
        ]}
      />
    </Drawer>
  )
}

function getDateNDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
