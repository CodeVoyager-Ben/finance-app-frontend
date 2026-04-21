import { Table, Tag, Button } from 'antd'
import { plColor, formatMoney, formatPct } from '../constants'

export default function HoldingsTable({ holdings, loading, onViewDetail }) {
  const columns = [
    {
      title: '代码', dataIndex: 'symbol', width: 90, fixed: 'left',
      render: (v) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>,
    },
    { title: '名称', dataIndex: 'name', width: 100, fixed: 'left' },
    {
      title: '类型', dataIndex: 'account_type_name', width: 80,
      render: (v, r) => <Tag color={r.asset_type_color || '#1677ff'} style={{ fontSize: 11 }}>{v}</Tag>,
    },
    {
      title: '分组', dataIndex: 'group_tag', width: 80,
      render: (v) => v ? <Tag color="default">{v}</Tag> : '-',
    },
    {
      title: '数量', dataIndex: 'quantity', width: 90, align: 'right',
      render: (v) => Number(v).toFixed(2),
    },
    {
      title: '成本价', dataIndex: 'avg_cost', width: 90, align: 'right',
      render: (v) => Number(v).toFixed(4),
    },
    {
      title: '现价', dataIndex: 'current_price', width: 90, align: 'right',
      render: (v) => Number(v).toFixed(4),
    },
    {
      title: '市值', dataIndex: 'market_value', width: 110, align: 'right',
      render: (v) => formatMoney(v),
    },
    {
      title: '日盈亏', width: 110, align: 'right',
      render: (_, r) => {
        const v = Number(r.daily_profit_loss || 0)
        return (
          <span style={{ color: plColor(v), fontWeight: 600 }}>
            {v >= 0 ? '+' : ''}{formatMoney(v)}
          </span>
        )
      },
    },
    {
      title: '总盈亏', width: 130, align: 'right',
      render: (_, r) => {
        const v = Number(r.profit_loss || 0)
        return (
          <span style={{ color: plColor(v), fontWeight: 600 }}>
            {v >= 0 ? '+' : ''}{formatMoney(v)}
            <span style={{ fontSize: 11, marginLeft: 4 }}>({formatPct(r.profit_loss_pct)})</span>
          </span>
        )
      },
    },
    {
      title: '总回报率', dataIndex: 'total_return_rate', width: 90, align: 'right',
      render: (v) => <span style={{ color: plColor(Number(v)), fontWeight: 600 }}>{formatPct(v)}</span>,
    },
    {
      title: '年化', dataIndex: 'annualized_return', width: 80, align: 'right',
      render: (v) => <span style={{ color: plColor(Number(v)) }}>{formatPct(v)}</span>,
    },
    {
      title: '天数', dataIndex: 'holding_days', width: 65, align: 'right',
      render: (v) => v > 0 ? `${v}天` : '-',
    },
    {
      title: '币种', dataIndex: 'effective_currency', width: 55, align: 'center',
      render: (v) => v !== 'CNY' ? <Tag color="default">{v}</Tag> : '',
    },
    {
      title: '操作', width: 60, fixed: 'right', align: 'center',
      render: (_, r) => <Button type="link" size="small" onClick={() => onViewDetail?.(r)}>详情</Button>,
    },
  ]

  return (
    <Table
      dataSource={holdings}
      columns={columns}
      rowKey="id"
      loading={loading}
      scroll={{ x: 1400 }}
      size="small"
      pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
    />
  )
}
