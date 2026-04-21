import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Tabs, message, Typography, Progress } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, WalletOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import { login, register } from '../api/auth'
import useAuthStore from '../store/authStore'

const { Title, Text } = Typography

// 密码强度计算
function getPasswordStrength(password) {
  if (!password) return { score: 0, level: '', color: '' }

  let score = 0
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};:'\\:"|,<.>/?`~]/.test(password),
  }

  if (checks.length) score += 20
  if (checks.lowercase) score += 20
  if (checks.uppercase) score += 20
  if (checks.digit) score += 20
  if (checks.special) score += 20

  // 额外奖励
  if (password.length >= 12) score = Math.min(score + 10, 100)

  let level, color
  if (score < 40) { level = '弱'; color = '#ff4d4f' }
  else if (score < 70) { level = '中'; color = '#faad14' }
  else { level = '强'; color = '#52c41a' }

  return { score, level, color, checks }
}

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [passwordVal, setPasswordVal] = useState('')
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [form] = Form.useForm()

  const strength = useMemo(() => getPasswordStrength(passwordVal), [passwordVal])

  const onLogin = async (values) => {
    setLoading(true)
    try {
      const res = await login(values)
      localStorage.setItem('access_token', res.access)
      localStorage.setItem('refresh_token', res.refresh)
      message.success('登录成功')
      const { fetchUser } = useAuthStore.getState()
      await fetchUser()
      navigate('/')
    } catch {
      // error already shown by interceptor
    } finally {
      setLoading(false)
    }
  }

  const onRegister = async (values) => {
    if (strength.score < 40) {
      message.error('密码强度不足，请设置更复杂的密码')
      return
    }
    setLoading(true)
    try {
      await register(values)
      message.success('注册成功，请登录')
      setActiveTab('login')
      setPasswordVal('')
    } catch {
      // error already shown by interceptor
    } finally {
      setLoading(false)
    }
  }

  const renderStrengthBar = () => {
    if (!passwordVal) return null
    return (
      <div style={{ marginTop: -8, marginBottom: 16 }}>
        <Progress
          percent={strength.score}
          size="small"
          strokeColor={strength.color}
          showInfo={false}
          style={{ marginBottom: 6 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: strength.color }}>密码强度：{strength.level}</Text>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: '8位以上', ok: strength.checks?.length },
              { label: '小写', ok: strength.checks?.lowercase },
              { label: '大写', ok: strength.checks?.uppercase },
              { label: '数字', ok: strength.checks?.digit },
              { label: '特殊字符', ok: strength.checks?.special },
            ].map(item => (
              <Text key={item.label} style={{ fontSize: 11, color: item.ok ? '#52c41a' : '#d9d9d9' }}>
                {item.ok ? <CheckCircleFilled /> : <CloseCircleFilled />} {item.label}
              </Text>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-bg">
      <Card
        style={{ width: 480, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        styles={{ body: { padding: '40px 32px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <WalletOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>个人财务管理系统</Title>
          <Text type="secondary">轻松管理您的收入、支出和投资</Text>
        </div>

        <Tabs
          centered
          activeKey={activeTab}
          onChange={(key) => { setActiveTab(key); setPasswordVal('') }}
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form onFinish={onLogin} size="large">
                  <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input prefix={<UserOutlined />} placeholder="用户名" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, borderRadius: 8 }}>
                      登 录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form form={form} onFinish={onRegister} size="large">
                  <Form.Item name="username" rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 2, message: '用户名至少2个字符' },
                    { max: 30, message: '用户名最多30个字符' },
                    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '用户名只能包含字母、数字、下划线或中文' },
                  ]}>
                    <Input prefix={<UserOutlined />} placeholder="用户名" />
                  </Form.Item>
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
                    <Input prefix={<MailOutlined />} placeholder="邮箱" />
                  </Form.Item>
                  <Form.Item name="phone">
                    <Input prefix={<PhoneOutlined />} placeholder="手机号（选填）" />
                  </Form.Item>
                  <Form.Item name="password" rules={[
                    { required: true, message: '请输入密码' },
                    { min: 8, message: '密码长度不能少于8位' },
                  ]}>
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="密码（至少8位）"
                      onChange={(e) => setPasswordVal(e.target.value)}
                    />
                  </Form.Item>
                  {renderStrengthBar()}
                  <Form.Item
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: '请确认密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve()
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'))
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, borderRadius: 8 }}>
                      注 册
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
