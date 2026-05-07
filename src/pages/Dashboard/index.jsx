import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Spin, Typography, Progress, Button, InputNumber, Modal, Form, message, Space, Select } from 'antd'
import {
  ArrowUpOutlined, ArrowDownOutlined, WalletOutlined, RiseOutlined,
  FundOutlined, PlusOutlined, SettingOutlined, EditOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { getDashboard, getCategorySummary, getMonthlySummary, getCategories, createBudget, updateBudget } from '../../api/finance'
import PrivacyToggle from '../../components/PrivacyToggle'
import usePrivacyStore from '../../store/privacyStore'

const { Title, Text } = Typography

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [budgetForm] = Form.useForm()
  const navigate = useNavigate()
  const hidden = usePrivacyStore((s) => s.hiddenPages)['dashboard']

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [dash, cat, monthly, cats] = await Promise.all([
        getDashboard(),
        getCategorySummary({ month: dayjs().month() + 1, year: dayjs().year() }),
        getMonthlySummary({ year: dayjs().year() }),
        getCategories({ category_type: 'expense' }),
      ])
      setData(dash)
      setCategoryData(cat)
      setMonthlyData(monthly)
      setAllCategories((cats.results || cats).filter(c => !c.parent))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const statCards = [
    {
      title: '本月收入', value: data?.month_income || 0,
      icon: <ArrowUpOutlined />, bg: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
    },
    {
      title: '本月支出', value: data?.month_expense || 0,
      icon: <ArrowDownOutlined />, bg: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
    },
    {
      title: '本月结余', value: data?.month_balance || 0,
      icon: <RiseOutlined />, bg: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
    },
    {
      title: '账户总余额', value: data?.total_balance || 0,
      icon: <WalletOutlined />, bg: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
    },
  ]

  const pieOption = {
    tooltip: { trigger: 'item', formatter: hidden ? '{b}: **** ({d}%)' : '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: categoryData.map(c => ({ value: parseFloat(c.total), name: c.category_icon + ' ' + c.category_name })),
    }],
    color: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911'],
  }

  const barOption = {
    tooltip: { trigger: 'axis', formatter: hidden ? (params) => params.map(p => `${p.seriesName}: ****`).join('<br/>') : undefined },
    legend: { data: ['收入', '支出', '结余'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: monthlyData.map(m => m.month) },
    yAxis: { type: 'value' },
    series: [
      { name: '收入', type: 'bar', data: monthlyData.map(m => parseFloat(m.income)), itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] } },
      { name: '支出', type: 'bar', data: monthlyData.map(m => parseFloat(m.expense)), itemStyle: { color: '#ff4d4f', borderRadius: [4, 4, 0, 0] } },
      { name: '结余', type: 'line', data: monthlyData.map(m => parseFloat(m.balance)), smooth: true, itemStyle: { color: '#1677ff' } },
    ],
  }

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 100 },
    {
      title: '类型', dataIndex: 'transaction_type', key: 'type', width: 60,
      render: (t) => <Tag color={t === 'income' ? 'green' : t === 'expense' ? 'red' : 'blue'}>
        {t === 'income' ? '收入' : t === 'expense' ? '支出' : '转账'}
      </Tag>,
    },
    {
      title: '分类', key: 'cat', width: 90,
      render: (_, r) => <span>{r.category_icon} {r.category_name || '未分类'}</span>,
    },
    { title: '账户', dataIndex: 'account_name', key: 'account', width: 80 },
    {
      title: '金额', dataIndex: 'amount', key: 'amount', width: 100, align: 'right',
      render: (v, r) => <span style={{ color: r.transaction_type === 'income' ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
        {hidden ? '****' : `${r.transaction_type === 'income' ? '+' : '-'}¥${parseFloat(v).toFixed(2)}`}
      </span>,
    },
    { title: '备注', dataIndex: 'note', key: 'note', ellipsis: true },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <FundOutlined style={{ marginRight: 8, color: '#1677ff' }} />财务概览
        </Title>
        <PrivacyToggle pageKey="dashboard" />
      </div>

      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card className="stat-card" styles={{ body: { padding: '20px 24px' } }}
              style={{ background: card.bg, border: 'none' }}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>{card.title}</span>}
                value={hidden ? '****' : card.value} prefix={hidden ? '' : '¥'} precision={hidden ? undefined : 2}
                valueStyle={{ color: '#fff', fontSize: 26, fontWeight: 700 }}
                suffix={card.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Budget Section */}
      <Card
        title={<span><SettingOutlined style={{ marginRight: 8 }} />本月预算</span>}
        style={{ marginBottom: 16 }}
      >
        {(!data?.budgets || data.budgets.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              还没有设置月度预算，设置后可以更好地控制支出
            </Text>
            <Button type="primary" size="large" icon={<PlusOutlined />}
              onClick={() => { setEditingBudget(null); budgetForm.resetFields(); setBudgetModalOpen(true) }}
              style={{ borderRadius: 8 }}>
              设置月度预算
            </Button>
          </div>
        ) : (
          <>
            <Row gutter={[12, 12]}>
              {data.budgets.map(b => {
                const pct = b.percentage
                const isOver = parseFloat(b.remaining) < 0
                return (
                  <Col xs={24} sm={12} lg={8} key={b.id}>
                    <Card size="small" style={{ borderRadius: 10 }}
                      styles={{ body: { padding: 12 } }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text strong>{b.category_icon} {b.category_name}</Text>
                        <Space size={4}>
                          <Tag color={isOver ? 'red' : pct >= 80 ? 'orange' : 'green'}>
                            {isOver ? '超支' : pct >= 80 ? '注意' : '正常'}
                          </Tag>
                          <Button type="text" size="small" icon={<EditOutlined />}
                            onClick={() => {
                              setEditingBudget(b)
                              budgetForm.setFieldsValue({ amount: parseFloat(b.amount) })
                              setBudgetModalOpen(true)
                            }}
                          />
                        </Space>
                      </div>
                      <Progress
                        percent={Math.min(pct, 100)}
                        strokeColor={isOver ? '#ff4d4f' : pct >= 80 ? '#faad14' : '#52c41a'}
                        size="small"
                        format={() => `${pct}%`}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          已花 {hidden ? '****' : `¥${parseFloat(b.spent).toFixed(0)}`}
                        </Text>
                        <Text style={{ fontSize: 12, color: isOver ? '#ff4d4f' : '#52c41a' }}>
                          {hidden ? '****' : isOver ? `超支 ¥${Math.abs(parseFloat(b.remaining)).toFixed(0)}` : `剩余 ¥${parseFloat(b.remaining).toFixed(0)}`}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          预算 {hidden ? '****' : `¥${parseFloat(b.amount).toFixed(0)}`}
                        </Text>
                      </div>
                    </Card>
                  </Col>
                )
              })}
            </Row>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <Button type="dashed" icon={<PlusOutlined />}
                onClick={() => { setEditingBudget(null); budgetForm.resetFields(); setBudgetModalOpen(true) }}>
                添加分类预算
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Budget Setting Modal */}
      <Modal
        title={editingBudget ? '修改预算' : '设置月度预算'}
        open={budgetModalOpen}
        onOk={async () => {
          try {
            const values = await budgetForm.validateFields()
            if (editingBudget) {
              await updateBudget(editingBudget.id, { amount: values.amount })
              message.success('预算已更新')
            } else {
              await createBudget({ ...values, period: 'monthly' })
              message.success('预算设置成功')
            }
            setBudgetModalOpen(false)
            loadData()
          } catch {}
        }}
        onCancel={() => setBudgetModalOpen(false)}
        okText={editingBudget ? '保存' : '创建'}
      >
        <Form form={budgetForm} layout="vertical" style={{ marginTop: 16 }}>
          {editingBudget ? (
            <Form.Item label="修改预算金额">
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <Text type="secondary">{editingBudget.category_icon} {editingBudget.category_name}</Text>
              </div>
              <Form.Item name="amount" noStyle rules={[{ required: true, message: '请输入金额' }]}>
                <InputNumber prefix="¥" style={{ width: '100%' }} min={1} precision={2} size="large" />
              </Form.Item>
            </Form.Item>
          ) : (
            <>
              <Form.Item name="category" label="预算范围（留空为总预算）">
                <Select allowClear placeholder="留空 = 总预算"
                  options={allCategories.filter(c => c.category_type === 'expense').map(c => ({
                    label: `${c.icon} ${c.name}`, value: c.id,
                  }))}
                />
              </Form.Item>
              <Form.Item name="amount" label="预算金额" rules={[{ required: true, message: '请输入金额' }]}>
                <InputNumber prefix="¥" style={{ width: '100%' }} min={1} precision={2} size="large" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="本月支出分类" styles={{ body: { height: 320 } }}>
            {categoryData.length > 0
              ? <ReactECharts option={pieOption} style={{ height: 280 }} />
              : <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>暂无数据</div>
            }
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="月度趋势" styles={{ body: { height: 320 } }}>
            {monthlyData.length > 0
              ? <ReactECharts option={barOption} style={{ height: 280 }} />
              : <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>暂无数据</div>
            }
          </Card>
        </Col>
      </Row>

      {/* Recent Transactions */}
      <Card title="最近交易" extra={<Button type="link" onClick={() => navigate('/transactions')}>查看全部</Button>}>
        <Table columns={columns} dataSource={data?.recent_transactions || []} rowKey="id" pagination={false} size="small" />
      </Card>
    </div>
  )
}
