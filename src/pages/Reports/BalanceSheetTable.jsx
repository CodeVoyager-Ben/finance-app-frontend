import { useState } from 'react'
import { Card, Table, Divider, Row, Col, Statistic, Typography, Tag, Modal, Descriptions, Empty, Timeline } from 'antd'
import { WalletOutlined } from '@ant-design/icons'
import { getLendingRecords } from '../../api/finance'

const { Text } = Typography

const STATUS_MAP = {
  outstanding: { color: 'red', label: '未还清' },
  partial: { color: 'orange', label: '部分归还' },
  settled: { color: 'green', label: '已结清' },
  written_off: { color: 'default', label: '已核销' },
}

export default function BalanceSheetTable({ assets, liabilities, netWorth, hidden }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [detailRecords, setDetailRecords] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailMeta, setDetailMeta] = useState({ counterparty: '', recordType: '' })

  if (!assets || !liabilities) return null

  const receivables = assets.receivables || { items: [], total: 0 }
  const payables = liabilities.payables || { items: [], total: 0 }
  const fmt = (v) => parseFloat(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const m = (v) => hidden ? '****' : v

  const openDetail = async (record) => {
    const recordType = receivables.items.includes(record) ? 'lend' : 'borrow'
    setDetailMeta({
      counterparty: record.name,
      recordType,
      total: record.amount,
      count: record.count,
    })
    setDetailLoading(true)
    setModalOpen(true)
    try {
      const data = await getLendingRecords({
        counterparty: record.name,
        record_type: recordType,
      })
      setDetailRecords(data.results || data)
    } catch (e) {
      console.error(e)
    } finally {
      setDetailLoading(false)
    }
  }

  const statusTag = (s) => {
    const info = STATUS_MAP[s] || { color: 'default', label: s }
    return <Tag color={info.color}>{info.label}</Tag>
  }

  return (
    <Card title={
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>资产负债明细</span>
      </div>
    }>
      <Row gutter={[24, 24]}>
        {/* 资产明细 */}
        <Col xs={24} lg={16}>
          <Text strong style={{ color: '#52c41a', fontSize: 14, display: 'block', marginBottom: 8 }}>
            资产
          </Text>

          {/* 现金及银行 */}
          <Card size="small" title="现金及银行" style={{ marginBottom: 12 }}
            styles={{ body: { padding: 12 } }}>
            <Table
              dataSource={assets.cash.items}
              rowKey="name"
              pagination={false}
              size="small"
              columns={[
                { title: '名称', dataIndex: 'name', key: 'name' },
                { title: '类型', dataIndex: 'type', key: 'type' },
                {
                  title: '金额', dataIndex: 'amount', key: 'amount', align: 'right',
                  render: v => <Text strong style={{ color: '#52c41a' }}>{m(`¥${parseFloat(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`)}</Text>,
                },
              ]}
            />
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ textAlign: 'right' }}>
              <Text>小计: </Text>
              <Text strong style={{ fontSize: 15, color: '#52c41a' }}>
                {m(`¥${parseFloat(assets.cash.total).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`)}
              </Text>
            </div>
          </Card>

          {/* 投资账户余额 */}
          {assets.invest_balance > 0 && (
            <Card size="small" title="证券账户余额" style={{ marginBottom: 12 }}
              styles={{ body: { padding: 12 } }}>
              <div style={{ textAlign: 'right' }}>
                <Text>小计: </Text>
                <Text strong style={{ fontSize: 15, color: '#1677ff' }}>
                  {m(`¥${parseFloat(assets.invest_balance).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`)}
                </Text>
              </div>
            </Card>
          )}

          {/* 投资持仓 */}
          {assets.investments.items.length > 0 && (
            <Card size="small" title="投资持仓" styles={{ body: { padding: 12 } }}>
              <Table
                dataSource={assets.investments.items}
                rowKey="name"
                pagination={false}
                size="small"
                columns={[
                  { title: '名称', dataIndex: 'name', key: 'name' },
                  { title: '类型', dataIndex: 'type', key: 'type' },
                  {
                    title: '市值', dataIndex: 'market_value', key: 'mv', align: 'right',
                    render: v => <Text strong>{m(`¥${parseFloat(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`)}</Text>,
                  },
                  {
                    title: '盈亏', dataIndex: 'profit_loss', key: 'pl', align: 'right',
                    render: v => {
                      if (hidden) return <Text>****</Text>
                      const val = parseFloat(v)
                      return <Text style={{ color: val >= 0 ? '#52c41a' : '#ff4d4f' }}>
                        {val >= 0 ? '+' : ''}¥{val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </Text>
                    },
                  },
                ]}
              />
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ textAlign: 'right' }}>
                <Text>小计: </Text>
                <Text strong style={{ fontSize: 15 }}>
                  {m(`¥${parseFloat(assets.investments.total).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`)}
                </Text>
              </div>
            </Card>
          )}

          {/* 应收款项（借出未收回）*/}
          {receivables.items.length > 0 && (
            <Card size="small" title="应收款项（借出未收回）" style={{ marginTop: 12 }}
              styles={{ body: { padding: 12 } }}>
              <Table
                dataSource={receivables.items}
                rowKey="name"
                pagination={false}
                size="small"
                onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })}
                columns={[
                  { title: '对方', dataIndex: 'name', key: 'name' },
                  { title: '笔数', dataIndex: 'count', key: 'count', align: 'center',
                    render: v => v > 1 ? <Tag color="orange">{v}笔</Tag> : '1笔' },
                  {
                    title: '金额', dataIndex: 'amount', key: 'amount', align: 'right',
                    render: v => <Text strong style={{ color: '#1677ff' }}>{m('¥' + fmt(v))}</Text>,
                  },
                ]}
              />
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ textAlign: 'right' }}>
                <Text>小计: </Text>
                <Text strong style={{ fontSize: 15, color: '#1677ff' }}>{m('¥' + fmt(receivables.total))}</Text>
              </div>
            </Card>
          )}

          {/* 负债明细 */}
          {liabilities.items.length > 0 && (
            <>
              <Divider />
              <Text strong style={{ color: '#ff4d4f', fontSize: 14, display: 'block', marginBottom: 8 }}>
                负债
              </Text>
              <Card size="small" title="透支账户" style={{ marginBottom: 12 }}
                styles={{ body: { padding: 12 } }}>
                <Table
                  dataSource={liabilities.items}
                  rowKey="name"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: '名称', dataIndex: 'name', key: 'name' },
                    { title: '类型', dataIndex: 'type', key: 'type', render: v => v || '-' },
                    {
                      title: '金额', dataIndex: 'amount', key: 'amount', align: 'right',
                      render: v => <Text strong style={{ color: '#ff4d4f' }}>
                        {m('¥' + parseFloat(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 }))}
                      </Text>,
                    },
                  ]}
                />
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ textAlign: 'right' }}>
                  <Text>小计: </Text>
                  <Text strong style={{ fontSize: 15, color: '#ff4d4f' }}>
                    {m('¥' + parseFloat(liabilities.total - payables.total).toLocaleString('zh-CN', { minimumFractionDigits: 2 }))}
                  </Text>
                </div>
              </Card>

              {/* 应付款项（借入未归还）*/}
              {payables.items.length > 0 && (
                <Card size="small" title="应付款项（借入未归还）" style={{ marginBottom: 12 }}
                  styles={{ body: { padding: 12 } }}>
                  <Table
                    dataSource={payables.items}
                    rowKey="name"
                    pagination={false}
                    size="small"
                    onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })}
                    columns={[
                      { title: '对方', dataIndex: 'name', key: 'name' },
                      { title: '笔数', dataIndex: 'count', key: 'count', align: 'center',
                        render: v => v > 1 ? <Tag color="volcano">{v}笔</Tag> : '1笔' },
                      {
                        title: '金额', dataIndex: 'amount', key: 'amount', align: 'right',
                        render: v => <Text strong style={{ color: '#ff4d4f' }}>{m('¥' + fmt(v))}</Text>,
                      },
                    ]}
                  />
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ textAlign: 'right' }}>
                    <Text>小计: </Text>
                    <Text strong style={{ fontSize: 15, color: '#ff4d4f' }}>{m('¥' + fmt(payables.total))}</Text>
                  </div>
                </Card>
              )}
            </>
          )}
        </Col>

        {/* 净资产汇总 */}
        <Col xs={24} lg={8}>
          <Card style={{
            background: 'linear-gradient(180deg, #f0f5ff 0%, #e6f7ff 100%)',
            border: '1px solid #91caff',
          }}>
            <Statistic
              title={<span style={{ fontSize: 14 }}>总资产</span>}
              value={hidden ? '****' : assets.total}
              prefix={hidden ? '' : '¥'}
              precision={hidden ? undefined : 2}
              valueStyle={{ color: '#52c41a', fontSize: 22, fontWeight: 700 }}
            />
            <Divider />
            <Statistic
              title={<span style={{ fontSize: 14 }}>总负债</span>}
              value={hidden ? '****' : liabilities.total}
              prefix={hidden ? '' : '¥'}
              precision={hidden ? undefined : 2}
              valueStyle={{ color: '#ff4d4f', fontSize: 18 }}
            />
            <Divider />
            <Statistic
              title={<span style={{ fontSize: 16, fontWeight: 600 }}>个人净资产</span>}
              value={hidden ? '****' : netWorth}
              prefix={hidden ? '' : '¥'}
              precision={hidden ? undefined : 2}
              valueStyle={{
                color: parseFloat(netWorth) >= 0 ? '#1677ff' : '#ff4d4f',
                fontSize: 28,
                fontWeight: 700,
              }}
              suffix={<WalletOutlined />}
            />
            <Divider />
            <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 12 }}>
              资产 - 负债 = 净资产
            </div>
          </Card>
        </Col>
      </Row>

      {/* 借贷明细弹窗 */}
      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={720}
        closable
        styles={{ body: { padding: 0 } }}
      >
        {/* 弹窗头部 */}
        <div style={{
          background: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
          padding: '20px 24px', color: '#fff',
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            {detailMeta.counterparty} - {detailMeta.recordType === 'lend' ? '借出明细' : '借入明细'}
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>合计金额</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#69db7c' }}>{m('¥' + fmt(detailMeta.total))}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>共{detailMeta.count}笔</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{detailMeta.count}</div>
            </div>
          </div>
        </div>

        {/* 明细列表 */}
        <div style={{ maxHeight: 480, overflowY: 'auto', padding: '16px 24px' }}>
          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>加载中...</div>
          ) : detailRecords.length === 0 ? (
            <Empty description="暂无记录" style={{ padding: 40 }} />
          ) : (
            detailRecords.map(record => (
              <Card key={record.id} size="small" style={{ marginBottom: 12 }}
                styles={{ body: { padding: 16 } }}>
                <Descriptions size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 0 }}>
                  <Descriptions.Item label="金额">
                    <Text strong style={{ fontSize: 15 }}>{m('¥' + fmt(record.amount))}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="已还">
                    <Text style={{ color: '#52c41a' }}>{m('¥' + fmt(record.repaid_amount))}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="剩余">
                    <Text strong style={{ color: record.remaining_amount > 0 ? '#ff4d4f' : '#52c41a' }}>
                      {m('¥' + fmt(record.remaining_amount))}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">{statusTag(record.status)}</Descriptions.Item>
                  <Descriptions.Item label="日期">{record.date}</Descriptions.Item>
                  <Descriptions.Item label="预计归还">
                    {record.expected_return_date || '-'}
                  </Descriptions.Item>
                  {record.reason && (
                    <Descriptions.Item label="事由" span={2}>{record.reason}</Descriptions.Item>
                  )}
                  {record.note && (
                    <Descriptions.Item label="备注" span={2}>{record.note}</Descriptions.Item>
                  )}
                </Descriptions>

                {/* 还款历史 */}
                {record.repayments && record.repayments.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f5f5f5' }}>
                    <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                      还款记录（{record.repayments.length}笔）
                    </Text>
                    <Timeline
                      items={record.repayments.map(rp => ({
                        children: (
                          <div style={{ fontSize: 13 }}>
                            <Text strong>{rp.date}</Text>
                            <Tag color={rp.repay_type === 'collect' ? 'green' : 'blue'}
                              style={{ marginLeft: 8, fontSize: 11 }}>
                              {rp.repay_type_display}
                            </Tag>
                            <Text strong style={{ color: '#52c41a', marginLeft: 8 }}>
                              {m('¥' + fmt(rp.amount))}
                            </Text>
                            {rp.interest > 0 && (
                              <Text type="secondary" style={{ marginLeft: 8 }}>
                                {'含利息 ' + m('¥' + fmt(rp.interest))}
                              </Text>
                            )}
                            {rp.note && (
                              <Text type="secondary" style={{ marginLeft: 8 }}>{rp.note}</Text>
                            )}
                          </div>
                        ),
                      }))}
                    />
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </Modal>
    </Card>
  )
}
