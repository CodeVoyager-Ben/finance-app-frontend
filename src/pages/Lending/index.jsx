import { useState, useEffect } from 'react'
import {
  Card, Row, Col, Table, Button, Modal, Form, Input, InputNumber, Select,
  Tag, Space, Typography, Statistic, Tabs, Segmented, Drawer, Descriptions, message, Popconfirm,
  DatePicker,
} from 'antd'
import {
  PlusOutlined, TeamOutlined, ArrowUpOutlined, ArrowDownOutlined,
  DollarOutlined, CheckCircleOutlined, EditOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getLendingRecords, createLendingRecord, updateLendingRecord, deleteLendingRecord,
  getLendingSummary, createRepayment, getAccounts,
} from '../../api/finance'

const { Title, Text } = Typography

const STATUS_MAP = {
  outstanding: { label: '未还清', color: 'red' },
  partial: { label: '部分归还', color: 'orange' },
  settled: { label: '已结清', color: 'green' },
  written_off: { label: '已核销', color: 'default' },
}

export default function Lending() {
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('lend')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  const [recordModal, setRecordModal] = useState(false)
  const [repayModal, setRepayModal] = useState(false)
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const [recordForm] = Form.useForm()
  const [repayForm] = Form.useForm()

  useEffect(() => { loadData() }, [activeTab, statusFilter, pagination.current])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {
        record_type: activeTab,
        page: pagination.current,
      }
      if (statusFilter !== 'all') params.status = statusFilter

      const [recs, sum, accs] = await Promise.all([
        getLendingRecords(params),
        getLendingSummary(),
        getAccounts(),
      ])
      setRecords(recs.results || recs)
      if (recs.count !== undefined) {
        setPagination(prev => ({ ...prev, total: recs.count }))
      }
      setSummary(sum)
      setAccounts(accs.results || accs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRecord = async () => {
    try {
      const values = await recordForm.validateFields()
      const payload = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        expected_return_date: values.expected_return_date?.format('YYYY-MM-DD') || null,
        amount: parseFloat(values.amount),
      }
      if (selectedRecord) {
        await updateLendingRecord(selectedRecord.id, payload)
        message.success('更新成功')
      } else {
        await createLendingRecord(payload)
        message.success('创建成功')
      }
      setRecordModal(false)
      recordForm.resetFields()
      setSelectedRecord(null)
      loadData()
    } catch {}
  }

  const handleRepay = async () => {
    try {
      const values = await repayForm.validateFields()
      const payload = {
        ...values,
        lending_record: selectedRecord.id,
        date: values.date.format('YYYY-MM-DD'),
        amount: parseFloat(values.amount),
        interest: parseFloat(values.interest || 0),
      }
      await createRepayment(payload)
      message.success('还款记录已保存')
      setRepayModal(false)
      repayForm.resetFields()
      loadData()
    } catch {}
  }

  const handleWriteOff = async (record) => {
    try {
      await updateLendingRecord(record.id, { status: 'written_off' })
      message.success('已核销')
      loadData()
    } catch {}
  }

  const handleDelete = async (id) => {
    try {
      await deleteLendingRecord(id)
      message.success('已删除')
      loadData()
    } catch {}
  }

  const openRecordModal = (record = null) => {
    setSelectedRecord(record)
    if (record) {
      recordForm.setFieldsValue({
        ...record,
        date: dayjs(record.date),
        expected_return_date: record.expected_return_date ? dayjs(record.expected_return_date) : null,
      })
    } else {
      recordForm.resetFields()
      recordForm.setFieldsValue({ record_type: activeTab, date: dayjs() })
    }
    setRecordModal(true)
  }

  const openRepayModal = (record) => {
    setSelectedRecord(record)
    repayForm.resetFields()
    repayForm.setFieldsValue({
      repay_type: record.record_type === 'lend' ? 'collect' : 'repay',
      date: dayjs(),
      interest: 0,
    })
    setRepayModal(true)
  }

  const openDetail = (record) => {
    setSelectedRecord(record)
    setDetailDrawer(true)
  }

  const columns = [
    {
      title: '对方', dataIndex: 'counterparty', key: 'counterparty', width: 100,
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: '金额', dataIndex: 'amount', key: 'amount', width: 110, align: 'right',
      render: (v) => <Text strong>¥{parseFloat(v).toFixed(2)}</Text>,
    },
    {
      title: '已还', dataIndex: 'repaid_amount', key: 'repaid_amount', width: 110, align: 'right',
      render: (v, r) => <span style={{ color: parseFloat(v) >= parseFloat(r.amount) ? '#52c41a' : '#666' }}>
        ¥{parseFloat(v).toFixed(2)}
      </span>,
    },
    {
      title: '剩余', dataIndex: 'remaining_amount', key: 'remaining_amount', width: 110, align: 'right',
      render: (v) => <Text type="danger" strong>¥{parseFloat(v).toFixed(2)}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v) => <Tag color={STATUS_MAP[v]?.color}>{STATUS_MAP[v]?.label}</Tag>,
    },
    { title: '日期', dataIndex: 'date', key: 'date', width: 100, sorter: true },
    {
      title: '预计归还', dataIndex: 'expected_return_date', key: 'expected_return_date', width: 100,
      render: (v) => v || '-',
    },
    {
      title: '事由', dataIndex: 'reason', key: 'reason', width: 140, ellipsis: true,
      render: (v) => v || '-',
    },
    {
      title: '操作', key: 'actions', width: 180, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {!['settled', 'written_off'].includes(record.status) && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openRecordModal(record)}>编辑</Button>
          )}
          {['outstanding', 'partial'].includes(record.status) && (
            <Button type="link" size="small" onClick={() => openRepayModal(record)}>还款</Button>
          )}
          <Button type="link" size="small" onClick={() => openDetail(record)}>详情</Button>
          {['outstanding', 'partial'].includes(record.status) && (
            <Popconfirm title="确认核销此记录？" onConfirm={() => handleWriteOff(record)} okText="确认" cancelText="取消">
              <Button type="link" size="small" danger>核销</Button>
            </Popconfirm>
          )}
          {!['settled', 'written_off'].includes(record.status) && (
            <Popconfirm title="确认删除此记录？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const repaymentColumns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 100 },
    {
      title: '类型', dataIndex: 'repay_type_display', key: 'type', width: 80,
      render: (v, r) => <Tag color={r.repay_type === 'collect' ? 'green' : 'blue'}>{v}</Tag>,
    },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 100, align: 'right', render: v => `¥${parseFloat(v).toFixed(2)}` },
    { title: '利息', dataIndex: 'interest', key: 'interest', width: 80, align: 'right', render: v => v ? `¥${parseFloat(v).toFixed(2)}` : '-' },
    { title: '账户', dataIndex: 'account_name', key: 'account', width: 100, render: v => v || '-' },
    { title: '备注', dataIndex: 'note', key: 'note', ellipsis: true, render: v => v || '-' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <TeamOutlined style={{ color: '#722ed1', marginRight: 8 }} />
          借贷管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openRecordModal()}>
          新增借贷
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card style={{ background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)' }} bodyStyle={{ padding: '20px 24px' }}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>总借出</span>}
                value={summary.total_lent}
                prefix="¥"
                valueStyle={{ color: '#fff', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)' }} bodyStyle={{ padding: '20px 24px' }}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>总借入</span>}
                value={summary.total_borrowed}
                prefix="¥"
                valueStyle={{ color: '#fff', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)' }} bodyStyle={{ padding: '20px 24px' }}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>待收回</span>}
                value={summary.total_lent_remaining}
                prefix="¥"
                valueStyle={{ color: '#fff', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ background: 'linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%)' }} bodyStyle={{ padding: '20px 24px' }}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>待归还</span>}
                value={summary.total_borrowed_remaining}
                prefix="¥"
                valueStyle={{ color: '#fff', fontWeight: 700 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabs + Filter + Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => { setActiveTab(key); setPagination(prev => ({ ...prev, current: 1 })) }}
            items={[
              { key: 'lend', label: <span><ArrowUpOutlined /> 借出</span> },
              { key: 'borrow', label: <span><ArrowDownOutlined /> 借入</span> },
            ]}
            style={{ marginBottom: 0 }}
          />
          <Segmented
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPagination(prev => ({ ...prev, current: 1 })) }}
            options={[
              { label: '全部', value: 'all' },
              { label: '未还清', value: 'outstanding' },
              { label: '部分归还', value: 'partial' },
              { label: '已结清', value: 'settled' },
              { label: '已核销', value: 'written_off' },
            ]}
          />
        </div>

        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          size="middle"
          scroll={{ x: 1000 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            onChange: (page) => setPagination(prev => ({ ...prev, current: page })),
          }}
          locale={{ emptyText: activeTab === 'lend' ? '暂无借出记录' : '暂无借入记录' }}
        />
      </Card>

      {/* Create/Edit Record Modal */}
      <Modal
        title={selectedRecord ? '编辑借贷' : '新增借贷'}
        open={recordModal}
        onOk={handleCreateRecord}
        onCancel={() => { setRecordModal(false); setSelectedRecord(null) }}
        okText="保存"
        width={520}
      >
        <Form form={recordForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="record_type" label="类型" rules={[{ required: true }]}>
                <Select options={[{ label: '借出', value: 'lend' }, { label: '借入', value: 'borrow' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="counterparty" label="对方姓名" rules={[{ required: true, message: '请输入对方姓名' }]}>
                <Input placeholder="如: 张三" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
                <InputNumber prefix="¥" style={{ width: '100%' }} min={0.01} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="account" label="关联账户">
                <Select allowClear placeholder="可选" options={accounts.filter(a => a.is_active).map(a => ({ label: a.name, value: a.id }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expected_return_date" label="预计归还日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reason" label="事由">
            <Input placeholder="如: 周转" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Repayment Modal */}
      <Modal
        title="录入还款"
        open={repayModal}
        onOk={handleRepay}
        onCancel={() => { setRepayModal(false); setSelectedRecord(null) }}
        okText="保存"
        width={480}
      >
        {selectedRecord && (
          <>
            <Card size="small" style={{ marginBottom: 16, background: '#f6f6f6' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="对方">{selectedRecord.counterparty}</Descriptions.Item>
                <Descriptions.Item label="总额">¥{parseFloat(selectedRecord.amount).toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="已还">¥{parseFloat(selectedRecord.repaid_amount).toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="剩余">
                  <Text type="danger">¥{parseFloat(selectedRecord.remaining_amount).toFixed(2)}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <Form form={repayForm} layout="vertical">
              <Form.Item name="repay_type" label="还款类型" rules={[{ required: true }]}>
                <Select options={[
                  { label: '收款', value: 'collect' },
                  { label: '还款', value: 'repay' },
                ]} />
              </Form.Item>
              <Form.Item name="amount" label="还款金额" rules={[{ required: true, message: '请输入还款金额' }]}>
                <InputNumber
                  prefix="¥" style={{ width: '100%' }} min={0.01}
                  max={parseFloat(selectedRecord.remaining_amount)}
                  precision={2}
                />
              </Form.Item>
              <Form.Item name="interest" label="其中利息">
                <InputNumber prefix="¥" style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
              <Form.Item name="account" label="关联账户">
                <Select allowClear placeholder="可选" options={accounts.filter(a => a.is_active).map(a => ({ label: a.name, value: a.id }))} />
              </Form.Item>
              <Form.Item name="date" label="还款日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="note" label="备注">
                <Input placeholder="备注信息" />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title="借贷详情"
        open={detailDrawer}
        onClose={() => { setDetailDrawer(false); setSelectedRecord(null) }}
        width={480}
        extra={
          selectedRecord && !['settled', 'written_off'].includes(selectedRecord.status) ? (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => { setDetailDrawer(false); openRecordModal(selectedRecord) }}
            >
              编辑
            </Button>
          ) : null
        }
      >
        {selectedRecord && (
          <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="类型">
                <Tag color={selectedRecord.record_type === 'lend' ? 'purple' : 'blue'}>
                  {selectedRecord.record_type_display}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="对方">{selectedRecord.counterparty}</Descriptions.Item>
              <Descriptions.Item label="金额">¥{parseFloat(selectedRecord.amount).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="已还金额">¥{parseFloat(selectedRecord.repaid_amount).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="剩余金额">
                <Text type="danger">¥{parseFloat(selectedRecord.remaining_amount).toFixed(2)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="利息">¥{parseFloat(selectedRecord.interest_amount).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_MAP[selectedRecord.status]?.color}>
                  {STATUS_MAP[selectedRecord.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="日期">{selectedRecord.date}</Descriptions.Item>
              <Descriptions.Item label="预计归还">{selectedRecord.expected_return_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="事由">{selectedRecord.reason || '-'}</Descriptions.Item>
              <Descriptions.Item label="备注">{selectedRecord.note || '-'}</Descriptions.Item>
              <Descriptions.Item label="关联账户">{selectedRecord.account_name || '-'}</Descriptions.Item>
            </Descriptions>

            <Title level={5}>还款历史</Title>
            <Table
              columns={repaymentColumns}
              dataSource={selectedRecord.repayments || []}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: '暂无还款记录' }}
            />
          </div>
        )}
      </Drawer>
    </div>
  )
}
