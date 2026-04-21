import { useState, useEffect } from 'react'
import {
  Card, Tabs, Table, Button, Modal, Form, Input, Select, InputNumber,
  message, Popconfirm, Tag, Typography, Space, Divider, Avatar, Switch,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined,
  CreditCardOutlined, TagOutlined, FundOutlined,
} from '@ant-design/icons'
import {
  getAccounts, createAccount, updateAccount, deleteAccount,
  getCategories, createCategory, updateCategory, deleteCategory,
  getBudgets, createBudget, deleteBudget,
} from '../../api/finance'
import { getProfile, updateProfile } from '../../api/auth'

const { Title, Text } = Typography

const ACCOUNT_TYPES = [
  { label: '现金', value: 'cash' },
  { label: '银行卡', value: 'bank' },
  { label: '信用卡', value: 'credit_card' },
  { label: '支付宝', value: 'alipay' },
  { label: '微信', value: 'wechat' },
  { label: '其他', value: 'other' },
]

const CATEGORY_TYPES = [
  { label: '收入', value: 'income' },
  { label: '支出', value: 'expense' },
]

const ICONS = ['💰', '🏠', '🚗', '🍽️', '🎬', '🛒', '👔', '💊', '📚', '✈️', '🎮', '💻', '📱', '🎁', '❤️', '📈', '🏦', '💼', '🏋️', '🐕']

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911']

export default function Settings() {
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState([])
  const [profile, setProfile] = useState(null)
  const [accountModal, setAccountModal] = useState(false)
  const [categoryModal, setCategoryModal] = useState(false)
  const [budgetModal, setBudgetModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [profileForm] = Form.useForm()
  const [accountForm] = Form.useForm()
  const [categoryForm] = Form.useForm()
  const [budgetForm] = Form.useForm()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [accs, cats, prof, bdgs] = await Promise.all([
        getAccounts(),
        getCategories(),
        getProfile(),
        getBudgets(),
      ])
      setAccounts(accs.results || accs)
      setCategories(cats.results || cats)
      setProfile(prof)
      setBudgets(bdgs.results || bdgs)
      profileForm.setFieldsValue(prof)
    } catch (e) {
      console.error(e)
    }
  }

  // Profile
  const handleUpdateProfile = async () => {
    try {
      const values = await profileForm.validateFields()
      await updateProfile(values)
      message.success('更新成功')
      loadData()
    } catch {}
  }

  // Account CRUD
  const openAccountModal = (record = null) => {
    setEditingAccount(record)
    if (record) {
      accountForm.setFieldsValue(record)
    } else {
      accountForm.resetFields()
      accountForm.setFieldsValue({ account_type: 'cash', balance: 0 })
    }
    setAccountModal(true)
  }

  const handleAccountSubmit = async () => {
    try {
      const values = await accountForm.validateFields()
      if (editingAccount) {
        await updateAccount(editingAccount.id, values)
        message.success('修改成功')
      } else {
        await createAccount(values)
        message.success('创建成功')
      }
      setAccountModal(false)
      loadData()
    } catch {}
  }

  const handleDeleteAccount = async (id) => {
    await deleteAccount(id)
    message.success('删除成功')
    loadData()
  }

  // Category CRUD
  const openCategoryModal = (record = null) => {
    setEditingCategory(record)
    if (record) {
      categoryForm.setFieldsValue(record)
    } else {
      categoryForm.resetFields()
      categoryForm.setFieldsValue({ category_type: 'expense', sort_order: 0 })
    }
    setCategoryModal(true)
  }

  const handleCategorySubmit = async () => {
    try {
      const values = await categoryForm.validateFields()
      if (editingCategory) {
        await updateCategory(editingCategory.id, values)
        message.success('修改成功')
      } else {
        await createCategory(values)
        message.success('创建成功')
      }
      setCategoryModal(false)
      loadData()
    } catch {}
  }

  const handleDeleteCategory = async (id) => {
    await deleteCategory(id)
    message.success('删除成功')
    loadData()
  }

  const allCategories = categories.flatMap(c => [c, ...(c.children || [])])

  const accountColumns = [
    {
      title: '名称', dataIndex: 'name', key: 'name',
      render: (v, r) => (
        <span>
          <span style={{ marginRight: 8, fontSize: 16 }}>{r.icon || '💰'}</span>
          {v}
        </span>
      ),
    },
    {
      title: '类型', dataIndex: 'account_type', key: 'type',
      render: (v) => {
        const item = ACCOUNT_TYPES.find(a => a.value === v)
        return <Tag>{item?.label || v}</Tag>
      },
    },
    {
      title: '余额', dataIndex: 'balance', key: 'balance', align: 'right',
      render: (v, r) => {
        const val = parseFloat(v)
        const isDebt = val < 0
        return <Text strong style={{ color: isDebt ? '#ff4d4f' : undefined }}>
          {isDebt ? '-' : ''}¥{Math.abs(val).toFixed(2)}
          {r.account_type === 'credit_card' && !isDebt && <span style={{ color: '#999', fontSize: 11 }}> 可用</span>}
          {isDebt && <span style={{ color: '#999', fontSize: 11 }}> 欠款</span>}
        </Text>
      },
    },
    {
      title: '状态', dataIndex: 'is_active', key: 'active',
      render: v => v ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>,
    },
    {
      title: '报表', dataIndex: 'exclude_from_reports', key: 'report',
      render: v => v ? <Tag color="default">已排除</Tag> : <Tag color="blue">计入</Tag>,
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openAccountModal(record)} />
          <Popconfirm
            title="删除确认"
            description={`确定删除账户「${record.name}」吗？该账户下的所有交易记录也会被删除，此操作不可恢复。`}
            onConfirm={() => handleDeleteAccount(record.id)}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const categoryColumns = [
    {
      title: '名称', dataIndex: 'name', key: 'name',
      render: (v, r) => (
        <span>
          <span style={{ marginRight: 8, fontSize: 16 }}>{r.icon || '📁'}</span>
          {r.parent_name && <span style={{ color: '#999', marginRight: 4 }}>{r.parent_name}/</span>}
          {v}
        </span>
      ),
    },
    {
      title: '类型', dataIndex: 'category_type', key: 'type',
      render: (v) => <Tag color={v === 'income' ? 'green' : 'red'}>{v === 'income' ? '收入' : '支出'}</Tag>,
    },
    {
      title: '排序', dataIndex: 'sort_order', key: 'sort', width: 70,
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openCategoryModal(record)} />
          <Popconfirm
            title="删除确认"
            description={`确定删除分类「${record.name}」吗？子分类也会一并删除，此操作不可恢复。`}
            onConfirm={() => handleDeleteCategory(record.id)}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        <UserOutlined style={{ color: '#1677ff', marginRight: 8 }} />
        个人设置
      </Title>

      <Tabs
        items={[
          {
            key: 'profile',
            label: '个人信息',
            children: (
              <Card style={{ maxWidth: 600 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                </div>
                <Form form={profileForm} layout="vertical">
                  <Form.Item name="username" label="用户名">
                    <Input disabled />
                  </Form.Item>
                  <Form.Item name="email" label="邮箱">
                    <Input />
                  </Form.Item>
                  <Form.Item name="phone" label="手机号">
                    <Input />
                  </Form.Item>
                  <Button type="primary" onClick={handleUpdateProfile}>保存修改</Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'accounts',
            label: '账户管理',
            children: (
              <Card
                title={<span><CreditCardOutlined style={{ marginRight: 8 }} />资金账户</span>}
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openAccountModal()}>新增账户</Button>}
              >
                <Table
                  columns={accountColumns}
                  dataSource={accounts}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'categories',
            label: '分类管理',
            children: (
              <Card
                title={<span><TagOutlined style={{ marginRight: 8 }} />收支分类</span>}
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openCategoryModal()}>新增分类</Button>}
              >
                <Table
                  columns={categoryColumns}
                  dataSource={allCategories}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'budgets',
            label: '预算管理',
            children: (
              <Card
                title={<span><FundOutlined style={{ marginRight: 8 }} />月度预算</span>}
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { budgetForm.resetFields(); setBudgetModal(true) }}>新增预算</Button>}
              >
                <Table
                  columns={[
                    {
                      title: '分类', key: 'cat',
                      render: (_, r) => <span>{r.category_icon} {r.category_name}</span>,
                    },
                    { title: '预算金额', dataIndex: 'amount', key: 'amount', render: v => `¥${parseFloat(v).toFixed(2)}` },
                    { title: '已花费', dataIndex: 'spent', key: 'spent', render: v => `¥${parseFloat(v).toFixed(2)}` },
                    {
                      title: '状态', key: 'status',
                      render: (_, r) => {
                        const pct = r.percentage
                        const over = parseFloat(r.remaining) < 0
                        return <Tag color={over ? 'red' : pct >= 80 ? 'orange' : 'green'}>
                          {over ? '超支' : `${pct}%`}
                        </Tag>
                      },
                    },
                    {
                      title: '操作', key: 'action', width: 70,
                      render: (_, record) => (
                        <Popconfirm
                          title="删除确认"
                          description={`确定删除「${record.category_name}」的预算吗？`}
                          onConfirm={async () => { await deleteBudget(record.id); message.success('删除成功'); loadData() }}
                          okText="确认删除"
                          cancelText="取消"
                          okButtonProps={{ danger: true }}
                        >
                          <Button type="link" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      ),
                    },
                  ]}
                  dataSource={budgets}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Account Modal */}
      <Modal
        title={editingAccount ? '编辑账户' : '新增账户'}
        open={accountModal}
        onOk={handleAccountSubmit}
        onCancel={() => setAccountModal(false)}
        okText="保存"
      >
        <Form form={accountForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="账户名称" rules={[{ required: true }]}>
            <Input placeholder="如: 招商银行卡" />
          </Form.Item>
          <Form.Item name="account_type" label="账户类型" rules={[{ required: true }]}>
            <Select options={ACCOUNT_TYPES} />
          </Form.Item>
          <Form.Item name="balance" label="初始余额">
            <InputNumber prefix="¥" style={{ width: '100%' }} precision={2} />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Select options={ICONS.map(i => ({ label: i, value: i }))} />
          </Form.Item>
          <Form.Item name="color" label="颜色">
            <Select options={COLORS.map(c => ({ label: <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 20, height: 20, borderRadius: 4, background: c }} />{c}</div>, value: c }))} />
          </Form.Item>
          <Form.Item name="exclude_from_reports" label="排除报表统计" valuePropName="checked">
            <Switch checkedChildren="排除" unCheckedChildren="计入" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Category Modal */}
      <Modal
        title={editingCategory ? '编辑分类' : '新增分类'}
        open={categoryModal}
        onOk={handleCategorySubmit}
        onCancel={() => setCategoryModal(false)}
        okText="保存"
      >
        <Form form={categoryForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="分类名称" rules={[{ required: true }]}>
            <Input placeholder="如: 餐饮" />
          </Form.Item>
          <Form.Item name="category_type" label="分类类型" rules={[{ required: true }]}>
            <Select options={CATEGORY_TYPES} />
          </Form.Item>
          <Form.Item name="parent" label="父分类">
            <Select allowClear options={categories.filter(c => !c.parent).map(c => ({ label: c.name, value: c.id }))} placeholder="选填，留空为一级分类" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Select options={ICONS.map(i => ({ label: i, value: i }))} />
          </Form.Item>
          <Form.Item name="color" label="颜色">
            <Select options={COLORS.map(c => ({ label: <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 20, height: 20, borderRadius: 4, background: c }} />{c}</div>, value: c }))} />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Budget Modal */}
      <Modal
        title="新增预算"
        open={budgetModal}
        onOk={async () => {
          try {
            const values = await budgetForm.validateFields()
            await createBudget(values)
            message.success('预算创建成功')
            setBudgetModal(false)
            loadData()
          } catch {}
        }}
        onCancel={() => setBudgetModal(false)}
        okText="创建"
      >
        <Form form={budgetForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="category" label="分类（留空为总预算）">
            <Select allowClear placeholder="留空 = 总预算"
              options={categories.filter(c => !c.parent && c.category_type === 'expense').map(c => ({
                label: `${c.icon} ${c.name}`, value: c.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="amount" label="预算金额" rules={[{ required: true }]}>
            <InputNumber prefix="¥" style={{ width: '100%' }} min={1} precision={2} placeholder="0.00" />
          </Form.Item>
          <Form.Item name="period" label="周期" rules={[{ required: true }]} initialValue="monthly">
            <Select options={[{ label: '月度', value: 'monthly' }, { label: '年度', value: 'yearly' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
