import { Row, Col, Card, Tag, Button, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { CURRENCIES } from '../constants'

const currencyLabel = (c) => {
  const found = CURRENCIES.find(x => x.value === c)
  return found ? found.label : c
}

export default function AccountCards({ accounts, onAddAccount, onEditAccount, onDeleteAccount, hidden }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>投资账户</span>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onAddAccount}>
          新增账户
        </Button>
      </div>
      <Row gutter={[12, 12]}>
        {accounts.filter(a => a.is_active).map(acc => (
          <Col xs={12} sm={8} md={6} key={acc.id}>
            <Card size="small" hoverable>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Tag color={acc.asset_type_detail?.color || '#1677ff'}>
                  {acc.asset_type_detail?.icon} {acc.asset_type_detail?.name}
                </Tag>
                <Space size={4}>
                  {acc.currency !== 'CNY' && (
                    <Tag color="default" style={{ fontSize: 11 }}>{acc.currency}</Tag>
                  )}
                  <EditOutlined
                    style={{ color: '#8c8c8c', cursor: 'pointer' }}
                    onClick={() => onEditAccount?.(acc)}
                  />
                  <Popconfirm
                    title="删除确认"
                    description={`确定删除投资账户「${acc.name}」吗？相关持仓和交易记录也会被删除。`}
                    onConfirm={() => onDeleteAccount?.(acc)}
                    okText="确认删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                  >
                    <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer' }} />
                  </Popconfirm>
                </Space>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{acc.name}</div>
              {acc.broker && <div style={{ color: '#8c8c8c', fontSize: 12 }}>{acc.broker}</div>}
              {acc.fund_account_detail && (
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                  资金账户: {acc.fund_account_detail.icon} {acc.fund_account_detail.name}
                </div>
              )}
              <div style={{ marginTop: 8, color: '#1677ff', fontWeight: 600 }}>
                总资产: {hidden ? '****' : Number(acc.total_assets).toFixed(2)}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
                <span>余额: {hidden ? '****' : Number(acc.balance).toFixed(2)}</span>
                {Number(acc.total_market_value) > 0 && (
                  <span>市值: {hidden ? '****' : Number(acc.total_market_value).toFixed(2)}</span>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
