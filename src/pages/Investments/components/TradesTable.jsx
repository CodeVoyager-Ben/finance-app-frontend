import { Table, Tag } from 'antd'
import { TRANSACTION_TYPES } from '../constants'

const fmt = (v) => Number(v || 0).toFixed(2)

export default function TradesTable({ transactions, loading }) {
  const columns = [
    { title: '日期', dataIndex: 'date', width: 100 },
    {
      title: '类型', dataIndex: 'transaction_type', width: 100,
      render: (v) => {
        const cfg = TRANSACTION_TYPES[v] || { label: v, color: '#999' }
        return <Tag color={cfg.color}>{cfg.icon} {cfg.label}</Tag>
      },
    },
    { title: '代码', dataIndex: 'symbol', width: 80 },
    { title: '名称', dataIndex: 'name', width: 100 },
    {
      title: '数量', dataIndex: 'quantity', width: 90, align: 'right',
      render: (v) => Number(v).toFixed(2),
    },
    {
      title: '价格', dataIndex: 'price', width: 90, align: 'right',
      render: (v) => Number(v).toFixed(4),
    },
    {
      title: '金额', dataIndex: 'amount', width: 110, align: 'right',
      render: (v) => fmt(v),
    },
    {
      title: '手续费', dataIndex: 'fee', width: 90, align: 'right',
      render: (v) => fmt(v),
    },
    {
      title: '盈亏', dataIndex: 'profit_loss', width: 110, align: 'right',
      render: (v) => {
        const n = Number(v || 0)
        if (n === 0) return '-'
        const color = n > 0 ? '#f5222d' : '#52c41a'
        return <span style={{ color, fontWeight: 600 }}>{n >= 0 ? '+' : ''}{fmt(n)}</span>
      },
    },
    { title: '账户', dataIndex: 'account_name', width: 100 },
    { title: '备注', dataIndex: 'note', width: 120, ellipsis: true },
  ]

  return (
    <Table
      dataSource={transactions}
      columns={columns}
      rowKey="id"
      loading={loading}
      size="small"
      scroll={{ x: 1100 }}
      pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
    />
  )
}
