import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, theme, Modal, Form, Input, Select, InputNumber, Button, Result, message } from 'antd'
import {
  DashboardOutlined, AccountBookOutlined, CalendarOutlined, FundOutlined,
  BarChartOutlined, SettingOutlined, LogoutOutlined, UserOutlined, WalletOutlined,
  PlusOutlined, BankOutlined, TeamOutlined,
} from '@ant-design/icons'
import useAuthStore from '../store/authStore'
import { getAccounts, createAccount } from '../api/finance'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/transactions', icon: <AccountBookOutlined />, label: '收支记账' },
  { key: '/calendar', icon: <CalendarOutlined />, label: '日历视图' },
  { key: '/investments', icon: <FundOutlined />, label: '投资管理' },
  { key: '/lending', icon: <TeamOutlined />, label: '借贷管理' },
  { key: '/reports', icon: <BarChartOutlined />, label: '报表中心' },
  { key: '/settings', icon: <SettingOutlined />, label: '个人设置' },
]

const ACCOUNT_PRESETS = [
  { name: '现金', account_type: 'cash', icon: '💵', color: '#52c41a' },
  { name: '微信钱包', account_type: 'wechat', icon: '💚', color: '#07c160' },
  { name: '支付宝', account_type: 'alipay', icon: '💙', color: '#1677ff' },
  { name: '银行卡', account_type: 'bank', icon: '🏦', color: '#722ed1' },
  { name: '信用卡', account_type: 'credit_card', icon: '💳', color: '#ff4d4f' },
]

const ACCOUNT_TYPES = [
  { label: '现金', value: 'cash' },
  { label: '银行卡', value: 'bank' },
  { label: '信用卡', value: 'credit_card' },
  { label: '支付宝', value: 'alipay' },
  { label: '微信', value: 'wechat' },
  { label: '其他', value: 'other' },
]

const ICONS = ['💵', '💚', '💙', '🏦', '💰', '🤑', '💳', '🏦', '📱', '🖱️']

const COLORS = ['#52c41a', '#07c160', '#1677ff', '#722ed1', '#ff4d4f', '#faad14', '#13c2c2', '#eb2f96']

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [noAccounts, setNoAccounts] = useState(false)
  const [setupStep, setSetupStep] = useState(0) // 0=loading, 1=quick setup, 2=custom
  const [setupForm] = Form.useForm()
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, fetchUser, logout } = useAuthStore()
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()

  useEffect(() => {
    if (!user) fetchUser()
    checkAccounts()
  }, [])

  const checkAccounts = async () => {
    try {
      const data = await getAccounts()
      const accounts = data.results || data
      if (accounts.length === 0) {
        setNoAccounts(true)
        setSetupStep(1)
      }
    } catch {}
  }

  const handleQuickSetup = async () => {
    setCreating(true)
    try {
      // Create the 4 preset accounts
      await Promise.all(ACCOUNT_PRESETS.map(a => createAccount({ ...a, balance: 0 })))
      message.success('账户创建成功！开始记账吧')
      setNoAccounts(false)
    } catch {
      message.error('创建失败，请重试')
    } finally {
      setCreating(false)
    }
  }

  const handleCustomCreate = async () => {
    try {
      const values = await setupForm.validateFields()
      setCreating(true)
      await createAccount(values)
      message.success('账户创建成功')
      // Check if user wants more accounts or is done
      const data = await getAccounts()
      const accounts = data.results || data
      if (accounts.length > 0) {
        setNoAccounts(false)
      }
    } catch {} finally {
      setCreating(false)
    }
  }

  const userMenu = {
    items: [
      { key: 'settings', icon: <SettingOutlined />, label: '个人设置', onClick: () => navigate('/settings') },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: () => { logout(); navigate('/login') } },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible collapsed={collapsed} onCollapse={setCollapsed}
        style={{
          overflow: 'auto', height: '100vh', position: 'fixed',
          left: 0, top: 0, bottom: 0,
          background: 'linear-gradient(180deg, #001529 0%, #002140 100%)',
        }}
      >
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <WalletOutlined style={{ fontSize: 28, color: '#1677ff' }} />
          {!collapsed && <span style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginLeft: 10 }}>财务管理</span>}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]}
          items={menuItems} onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{
          padding: '0 24px', background: colorBgContainer,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
              <span>{user?.username || '用户'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16 }}>
          <div style={{
            padding: 24, minHeight: 360, background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }} className="page-container">
            <Outlet />
          </div>
        </Content>
      </Layout>

      {/* No Account Setup Modal */}
      <Modal
        open={noAccounts}
        closable={false}
        footer={null}
        width={480}
        centered
        maskStyle={{ background: 'rgba(0,0,0,0.6)' }}
      >
        {setupStep === 1 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <BankOutlined style={{ fontSize: 56, color: '#1677ff', marginBottom: 16 }} />
            <h2 style={{ marginBottom: 8 }}>欢迎使用财务管理系统</h2>
            <p style={{ color: '#666', marginBottom: 24 }}>
              开始记账前，请先创建您的资金账户
            </p>

            {/* Quick setup */}
            <div style={{
              background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 12,
              padding: 20, marginBottom: 20,
            }}>
              <p style={{ fontWeight: 600, marginBottom: 12 }}>快速创建常用账户</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
                {ACCOUNT_PRESETS.map(a => (
                  <div key={a.name} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 12, background: a.color + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28, margin: '0 auto 6px',
                    }}>
                      {a.icon}
                    </div>
                    <span style={{ fontSize: 12, color: '#666' }}>{a.name}</span>
                  </div>
                ))}
              </div>
              <Button type="primary" size="large" block loading={creating}
                onClick={handleQuickSetup}
                style={{ borderRadius: 8, height: 44 }}>
                一键创建以上账户
              </Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
              <span style={{ color: '#999', fontSize: 12 }}>或者</span>
              <div style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
            </div>

            <Button size="large" block onClick={() => { setSetupStep(2); setupForm.resetFields() }}
              style={{ borderRadius: 8, height: 44 }}>
              <PlusOutlined /> 自定义创建账户
            </Button>
          </div>
        ) : (
          <div style={{ padding: '20px 0' }}>
            <h3 style={{ textAlign: 'center', marginBottom: 24 }}>创建资金账户</h3>
            <Form form={setupForm} layout="vertical" onFinish={handleCustomCreate}
              initialValues={{ account_type: 'cash', balance: 0, icon: '💰', color: '#1677ff' }}>
              <Form.Item name="name" label="账户名称" rules={[{ required: true, message: '请输入账户名称' }]}>
                <Input placeholder="如: 招商银行卡" size="large" />
              </Form.Item>
              <div style={{ display: 'flex', gap: 12 }}>
                <Form.Item name="account_type" label="账户类型" rules={[{ required: true }]} style={{ flex: 1 }}>
                  <Select options={ACCOUNT_TYPES} size="large" />
                </Form.Item>
                <Form.Item name="balance" label="初始余额" style={{ flex: 1 }}>
                  <InputNumber prefix="¥" style={{ width: '100%' }} precision={2} size="large" />
                </Form.Item>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Form.Item name="icon" label="图标">
                  <Select options={ICONS.map(i => ({ label: i, value: i }))} style={{ width: 80 }} size="large" />
                </Form.Item>
                <Form.Item name="color" label="颜色" style={{ flex: 1 }}>
                  <Select options={COLORS.map(c => ({
                    label: <div style={{ width: 24, height: 24, borderRadius: 4, background: c }} />,
                    value: c,
                  }))} />
                </Form.Item>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Button size="large" style={{ flex: 1, borderRadius: 8 }}
                  onClick={() => setSetupStep(1)}>
                  返回
                </Button>
                <Button type="primary" htmlType="submit" size="large" loading={creating}
                  style={{ flex: 2, borderRadius: 8 }}>
                  创建并开始使用
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
