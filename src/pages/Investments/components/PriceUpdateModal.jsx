import { Modal, Table, InputNumber, Button, message } from 'antd'
import { useState } from 'react'

export default function PriceUpdateModal({ open, onCancel, onOk, holdings, loading }) {
  const [updates, setUpdates] = useState({})

  const activeHoldings = holdings.filter(h => Number(h.quantity) > 0)

  const handlePriceChange = (id, value) => {
    setUpdates(prev => ({ ...prev, [id]: value }))
  }

  const handleOk = () => {
    const updateList = Object.entries(updates)
      .filter(([, price]) => price !== undefined && price !== null)
      .map(([id, price]) => ({ holding_id: Number(id), current_price: price }))
    if (updateList.length === 0) {
      message.warning('请至少更新一个持仓价格')
      return
    }
    onOk({ updates: updateList })
    setUpdates({})
  }

  const columns = [
    { title: '代码', dataIndex: 'symbol', width: 80 },
    { title: '名称', dataIndex: 'name', width: 100 },
    {
      title: '现价', dataIndex: 'current_price', width: 100, align: 'right',
      render: (v) => Number(v).toFixed(4),
    },
    {
      title: '新价格', width: 140, align: 'center',
      render: (_, r) => (
        <InputNumber
          size="small" style={{ width: 120 }}
          min={0} precision={4}
          placeholder="输入新价格"
          value={updates[r.id]}
          onChange={(v) => handlePriceChange(r.id, v)}
        />
      ),
    },
  ]

  return (
    <Modal
      title="批量更新价格"
      open={open}
      onCancel={() => { setUpdates({}); onCancel() }}
      onOk={handleOk}
      confirmLoading={loading}
      width={500}
    >
      <Table
        dataSource={activeHoldings}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 15 }}
        scroll={{ y: 400 }}
      />
    </Modal>
  )
}
