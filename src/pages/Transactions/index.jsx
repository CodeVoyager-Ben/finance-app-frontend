import { useState, useEffect, useCallback } from 'react'
import {
  Card, Button, Table, Modal, Form, Input, Select, DatePicker, InputNumber,
  Tag, Space, Row, Col, message, Popconfirm, Typography, Segmented,
  Drawer, Grid,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  ArrowUpOutlined, ArrowDownOutlined, SwapOutlined,
  CreditCardOutlined, ReloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getTransactions, createTransaction, updateTransaction, deleteTransaction,
  getAccounts, getCategories,
} from '../../api/finance'

const { Title, Text } = Typography
const { useBreakpoint } = Grid
const { RangePicker } = DatePicker

const TYPE_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '支出', value: 'expense', color: '#ff4d4f' },
  { label: '收入', value: 'income', color: '#52c41a' },
  { label: '转账', value: 'transfer', color: '#1677ff' },
  { label: '还信用卡', value: 'credit_card', color: '#722ed1' },
]

export default function Transactions() {
  const screens = useBreakpoint()
  const [data, setData] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  // ── Filter state ──
  const [typeFilter, setTypeFilter] = useState('all')
  const [filterAccount, setFilterAccount] = useState(undefined)
  const [filterCategory, setFilterCategory] = useState(undefined)
  const [filterDateRange, setFilterDateRange] = useState(null)
  const [filterSearch, setFilterSearch] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  // ── Summary ──
  const [summary, setSummary] = useState({ income: 0, expense: 0, count: 0 })

  // Quick entry form state
  const [entryType, setEntryType] = useState('expense')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [toAccount, setToAccount] = useState(null)
  const [entryDate, setEntryDate] = useState(dayjs())
  const [expandedParent, setExpandedParent] = useState(null)

  // Build filter params for API
  const buildFilterParams = useCallback((page = 1) => {
    const params = { page }
    if (typeFilter !== 'all') {
      if (typeFilter === 'credit_card') {
        // 还信用卡在后端是 transfer + to_account 为信用卡
        // 前端筛选不够精确，取 transfer 然后客户端再过滤
        params.transaction_type = 'transfer'
      } else {
        params.transaction_type = typeFilter
      }
    }
    if (filterAccount) params.account = filterAccount
    if (filterCategory) params.category = filterCategory
    if (filterDateRange && filterDateRange[0]) {
      params.start_date = filterDateRange[0].format('YYYY-MM-DD')
      params.end_date = filterDateRange[1].format('YYYY-MM-DD')
    }
    if (filterSearch.trim()) params.search = filterSearch.trim()
    return params
  }, [typeFilter, filterAccount, filterCategory, filterDateRange, filterSearch])

  useEffect(() => { loadData() }, [typeFilter, filterAccount, filterCategory, filterDateRange])

  const loadData = async (page = 1) => {
    setLoading(true)
    try {
      // Load accounts & categories if not yet loaded
      let accs = accounts, cats = categories
      if (accs.length === 0 || cats.length === 0) {
        const [a, c] = await Promise.all([getAccounts(), getCategories()])
        accs = a.results || a
        cats = c.results || c
        setAccounts(accs)
        setCategories(cats)
        if (!selectedAccount && accs.length > 0) {
          setSelectedAccount(accs[0].id)
        }
      }

      const params = buildFilterParams(page)
      const trans = await getTransactions(params)
      const results = trans.results || trans

      // Client-side filter for credit_card (transfer to credit card account)
      let filtered = results
      if (typeFilter === 'credit_card') {
        filtered = results.filter(t => t.transaction_type === 'transfer' && t.to_account_name)
      }

      setData(filtered)
      setPagination(p => ({
        ...p,
        current: page,
        total: trans.count || results.length,
      }))

      // Compute summary - exclude transactions from "exclude_from_reports" accounts
      const excludedAccountIds = new Set(
        accs.filter(a => a.exclude_from_reports).map(a => a.id)
      )
      const reportable = filtered.filter(t => {
        const tAccountId = typeof t.account === 'object' ? t.account?.id : t.account
        return !excludedAccountIds.has(tAccountId)
      })
      let totalIncome = 0, totalExpense = 0
      reportable.forEach(t => {
        if (t.transaction_type === 'income') totalIncome += parseFloat(t.amount)
        else if (t.transaction_type === 'expense') totalExpense += parseFloat(t.amount)
      })
      setSummary({ income: totalIncome, expense: totalExpense, count: reportable.length })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Reset filters
  const resetFilters = () => {
    setTypeFilter('all')
    setFilterAccount(undefined)
    setFilterCategory(undefined)
    setFilterDateRange(null)
    setFilterSearch('')
  }

  const topLevelCategories = categories.filter(c => ['transfer', 'credit_card'].includes(entryType) ? true : c.category_type === entryType && !c.parent)
  const childCategories = (parentId) => categories.filter(c => c.parent === parentId)

  const handleQuickSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      message.warning('请输入金额')
      return
    }
    if (!selectedAccount) {
      message.warning('请选择账户')
      return
    }
    if (['transfer', 'credit_card'].includes(entryType) && !toAccount) {
      message.warning('请选择目标账户')
      return
    }
    try {
      const isCreditCard = entryType === 'credit_card'
      const creditCardCat = categories.find(c => c.name === '还信用卡')
      const payload = {
        transaction_type: isCreditCard ? 'transfer' : entryType,
        amount: parseFloat(amount),
        account: selectedAccount,
        to_account: isCreditCard || entryType === 'transfer' ? toAccount : undefined,
        category: isCreditCard ? (creditCardCat?.id || selectedCategory) : selectedCategory,
        note: note || (isCreditCard ? '信用卡还款' : ''),
        date: entryDate.format('YYYY-MM-DD'),
      }
      await createTransaction(payload)
      message.success('记账成功!')
      setAmount('')
      setNote('')
      setSelectedCategory(null)
      setToAccount(null)
      loadData(pagination.current)
    } catch {}
  }

  const handleEdit = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    try {
      const isCreditCard = entryType === 'credit_card'
      const creditCardCat = categories.find(c => c.name === '还信用卡')
      await updateTransaction(editing.id, {
        transaction_type: isCreditCard ? 'transfer' : entryType,
        amount: parseFloat(amount),
        account: selectedAccount,
        to_account: isCreditCard || entryType === 'transfer' ? toAccount : undefined,
        category: isCreditCard ? (creditCardCat?.id || selectedCategory) : selectedCategory,
        note,
        date: entryDate.format('YYYY-MM-DD'),
      })
      message.success('修改成功')
      setDrawerOpen(false)
      setEditing(null)
      resetForm()
      loadData(pagination.current)
    } catch {}
  }

  const resetForm = () => {
    setAmount('')
    setNote('')
    setSelectedCategory(null)
    setToAccount(null)
    setEntryType('expense')
    setEntryDate(dayjs())
    setExpandedParent(null)
  }

  const openEdit = (record) => {
    setEditing(record)
    const isCreditCardRepay = record.transaction_type === 'transfer' && record.to_account && record.to_account.account_type === 'credit_card'
    setEntryType(isCreditCardRepay ? 'credit_card' : record.transaction_type)
    setAmount(record.amount)
    setNote(record.note || '')
    setSelectedCategory(typeof record.category === 'object' ? record.category?.id : record.category)
    setSelectedAccount(typeof record.account === 'object' ? record.account?.id : record.account)
    setToAccount(record.to_account ? (typeof record.to_account === 'object' ? record.to_account?.id : record.to_account) : null)
    setEntryDate(dayjs(record.date))
    setDrawerOpen(true)
  }

  const openNew = () => {
    setEditing(null)
    resetForm()
    setDrawerOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id)
      message.success('删除成功')
      loadData(pagination.current)
    } catch {
      message.error('删除失败')
    }
  }

  // Number pad
  const handleNumPad = (val) => {
    if (val === 'delete') {
      setAmount(prev => prev.slice(0, -1))
    } else if (val === '.') {
      if (!amount.includes('.')) {
        setAmount(prev => prev ? prev + '.' : '0.')
      }
    } else if (val === 'ok') {
      if (editing) handleEdit()
      else handleQuickSubmit()
    } else {
      setAmount(prev => {
        if (prev === '0' && val !== '.') return val
        if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev
        return prev + val
      })
    }
  }

  // Build category filter options (flat list with hierarchy)
  const categoryFilterOptions = categories
    .filter(c => !c.parent)
    .flatMap(parent => {
      const children = categories.filter(c => c.parent === parent.id)
      const items = [{ label: `${parent.icon} ${parent.name}`, value: parent.id }]
      children.forEach(child => {
        items.push({ label: `　${child.icon} ${child.name}`, value: child.id })
      })
      return items
    })

  const columns = [
    {
      title: '日期', dataIndex: 'date', key: 'date', width: 100,
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: '分类', key: 'cat', width: 90,
      render: (_, r) => {
        const isCCRepay = r.transaction_type === 'transfer' && r.to_account_name
        if (isCCRepay && !r.category_name) {
          return <span><span style={{ marginRight: 4 }}>💳</span>还信用卡</span>
        }
        return (
          <span>
            <span style={{ marginRight: 4 }}>{r.category_icon}</span>
            {r.category_name || '未分类'}
          </span>
        )
      },
    },
    {
      title: '类型', dataIndex: 'transaction_type', key: 'type', width: 85,
      render: (t, r) => {
        const isCCRepay = t === 'transfer' && r.to_account_name
        return <Tag color={t === 'income' ? 'green' : t === 'expense' ? 'red' : isCCRepay ? 'purple' : 'blue'}>
          {t === 'income' ? '收入' : t === 'expense' ? '支出' : isCCRepay ? '还信用卡' : '转账'}
        </Tag>
      },
    },
    {
      title: '账户', key: 'account', width: 120,
      render: (_, r) => r.transaction_type === 'transfer' && r.to_account_name
        ? <span>{r.account_name} → {r.to_account_name}</span>
        : r.account_name,
    },
    {
      title: '金额', dataIndex: 'amount', key: 'amount', width: 110, align: 'right',
      render: (v, r) => {
        const isCCRepay = r.transaction_type === 'transfer' && r.to_account_name
        return (
          <span style={{
            color: r.transaction_type === 'income' ? '#52c41a' : r.transaction_type === 'expense' ? '#ff4d4f' : isCCRepay ? '#722ed1' : '#1677ff',
            fontWeight: 700, fontSize: 15,
          }}>
            {r.transaction_type === 'income' ? '+' : r.transaction_type === 'expense' ? '-' : ''}
            ¥{parseFloat(v).toFixed(2)}
          </span>
        )
      },
    },
    { title: '备注', dataIndex: 'note', key: 'note', ellipsis: true },
    {
      title: '操作', key: 'action', width: 80,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="删除确认"
            description={`确定删除这笔 ¥${parseFloat(record.amount).toFixed(2)} 的${record.transaction_type === 'income' ? '收入' : '支出'}记录吗？删除后不可恢复。`}
            onConfirm={() => handleDelete(record.id)}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const hasFilters = typeFilter !== 'all' || filterAccount || filterCategory || filterDateRange || filterSearch

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>收支记账</Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openNew}
          style={{ borderRadius: 20, height: 44, paddingInline: 24 }}>
          记一笔
        </Button>
      </div>

      {/* ── Filter Bar ── */}
      <Card styles={{ body: { padding: '16px 20px' } }} style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <Segmented
              options={TYPE_OPTIONS.map(t => ({ label: t.label, value: t.value }))}
              value={typeFilter}
              onChange={(v) => { setTypeFilter(v); setPagination(p => ({ ...p, current: 1 })) }}
            />
          </Col>
          <Col flex="160px">
            <Select
              value={filterAccount}
              onChange={(v) => { setFilterAccount(v); setPagination(p => ({ ...p, current: 1 })) }}
              placeholder="全部账户"
              allowClear
              style={{ width: '100%' }}
              options={accounts.filter(a => a.is_active).map(a => ({
                label: <span>{a.icon || '💰'} {a.name}{a.exclude_from_reports ? ' (不计入报表)' : ''}</span>,
                value: a.id,
              }))}
            />
          </Col>
          <Col flex="160px">
            <Select
              value={filterCategory}
              onChange={(v) => { setFilterCategory(v); setPagination(p => ({ ...p, current: 1 })) }}
              placeholder="全部分类"
              allowClear
              showSearch
              style={{ width: '100%' }}
              options={categoryFilterOptions}
            />
          </Col>
          <Col flex="auto">
            <RangePicker
              value={filterDateRange}
              onChange={(dates) => { setFilterDateRange(dates); setPagination(p => ({ ...p, current: 1 })) }}
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col flex="160px">
            <Input
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="搜索备注..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              onPressEnter={() => { setPagination(p => ({ ...p, current: 1 })); loadData() }}
              allowClear
              onClear={() => { setFilterSearch(''); loadData() }}
            />
          </Col>
          {hasFilters && (
            <Col>
              <Button icon={<ReloadOutlined />} onClick={resetFilters}>重置</Button>
            </Col>
          )}
        </Row>
      </Card>

      {/* ── Summary Bar ── */}
      {summary.count > 0 && (
        <div style={{
          display: 'flex', gap: 32, padding: '12px 24px', marginBottom: 16,
          background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
          borderRadius: 12, border: '1px solid #d6e4ff',
        }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>筛选结果</Text>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1677ff' }}>
              {summary.count} 笔
            </div>
          </div>
          {summary.income > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>总收入</Text>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>
                +¥{summary.income.toFixed(2)}
              </div>
            </div>
          )}
          {summary.expense > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>总支出</Text>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#ff4d4f' }}>
                -¥{summary.expense.toFixed(2)}
              </div>
            </div>
          )}
          {summary.income > 0 && summary.expense > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>结余</Text>
              <div style={{
                fontSize: 18, fontWeight: 700,
                color: summary.income - summary.expense >= 0 ? '#52c41a' : '#ff4d4f',
              }}>
                {(summary.income - summary.expense) >= 0 ? '+' : ''}¥{(summary.income - summary.expense).toFixed(2)}
              </div>
            </div>
          )}
        </div>
      )}

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total) => `共 ${total} 笔`,
            showSizeChanger: false,
          }}
          onChange={(pag) => { setPagination(pag); loadData(pag.current) }}
          size="middle"
        />
      </Card>

      {/* Quick Entry Drawer */}
      <Drawer
        title={editing ? '编辑记录' : '记一笔'}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); resetForm() }}
        width={420}
        styles={{ body: { padding: '16px 20px' } }}
        footer={null}
      >
        {/* Type Selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {TYPE_OPTIONS.filter(t => t.value !== 'all').map(t => (
            <Button
              key={t.value}
              type={entryType === t.value ? 'primary' : 'default'}
              danger={entryType === t.value && t.value === 'expense'}
              style={{
                flex: 1, height: 40, borderRadius: 8,
                ...(entryType === t.value && t.value === 'income' ? { background: '#52c41a', borderColor: '#52c41a' } : {}),
                ...(entryType === t.value && t.value === 'transfer' ? { background: '#1677ff', borderColor: '#1677ff' } : {}),
                ...(entryType === t.value && t.value === 'credit_card' ? { background: '#722ed1', borderColor: '#722ed1' } : {}),
              }}
              onClick={() => {
                setEntryType(t.value)
                setSelectedCategory(null)
                setExpandedParent(null)
                if (t.value === 'credit_card') {
                  const cc = accounts.find(a => a.account_type === 'credit_card' && a.is_active)
                  if (cc) setToAccount(cc.id)
                } else {
                  setToAccount(null)
                }
              }}
            >
              {t.value === 'expense' && <ArrowDownOutlined />}
              {t.value === 'income' && <ArrowUpOutlined />}
              {t.value === 'transfer' && <SwapOutlined />}
              {t.value === 'credit_card' && <CreditCardOutlined />}
              {' '}{t.label}
            </Button>
          ))}
        </div>

        {/* Category Grid */}
        {entryType === 'credit_card' && (
          <div style={{
            background: '#f9f0ff', borderRadius: 10, padding: '10px 16px',
            marginBottom: 12, border: '1px solid #d3adf7',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 22 }}>💳</span>
            <span style={{ color: '#722ed1', fontWeight: 500 }}>分类：还信用卡</span>
          </div>
        )}
        {!['transfer', 'credit_card'].includes(entryType) && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>选择分类</Text>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 4,
              marginTop: 8,
              maxHeight: 280,
              overflowY: 'auto',
              padding: 4,
            }}>
              {topLevelCategories.map(cat => {
                const children = childCategories(cat.id)
                const isExpanded = expandedParent === cat.id
                const isParentSelected = selectedCategory === cat.id
                const isChildSelected = children.some(c => c.id === selectedCategory)

                return (
                  <div key={cat.id} style={{ gridColumn: isExpanded ? '1 / -1' : undefined }}>
                    <div
                      onClick={() => {
                        if (children.length > 0) {
                          setExpandedParent(isExpanded ? null : cat.id)
                          setSelectedCategory(cat.id)
                        } else {
                          setSelectedCategory(cat.id)
                        }
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '8px 4px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        border: (isParentSelected || isChildSelected) ? `2px solid ${cat.color || '#1677ff'}` : '2px solid transparent',
                        background: (isParentSelected || isChildSelected) ? (cat.color || '#1677ff') + '12' : 'transparent',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ fontSize: 26 }}>{cat.icon || '📁'}</span>
                      <span style={{ fontSize: 11, marginTop: 4, textAlign: 'center', lineHeight: 1.2, color: (isParentSelected || isChildSelected) ? (cat.color || '#1677ff') : '#666' }}>
                        {cat.name}
                      </span>
                    </div>
                    {isExpanded && children.length > 0 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: 4,
                        marginTop: 4,
                        padding: '8px 0',
                        borderTop: `1px dashed ${(cat.color || '#1677ff')}40`,
                      }}>
                        {children.map(child => (
                          <div
                            key={child.id}
                            onClick={() => setSelectedCategory(child.id)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              padding: '6px 2px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              border: selectedCategory === child.id ? `2px solid ${cat.color || '#1677ff'}` : '2px solid transparent',
                              background: selectedCategory === child.id ? (cat.color || '#1677ff') + '12' : 'transparent',
                              transition: 'all 0.2s',
                            }}
                          >
                            <span style={{ fontSize: 20 }}>{child.icon || '📁'}</span>
                            <span style={{ fontSize: 10, marginTop: 2, textAlign: 'center', lineHeight: 1.2, color: selectedCategory === child.id ? (cat.color || '#1677ff') : '#888' }}>
                              {child.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Transfer / Credit Card: destination account */}
        {['transfer', 'credit_card'].includes(entryType) && (
          <div style={{
            background: '#f9f0ff', borderRadius: 10, padding: '12px 16px',
            marginBottom: 12, border: '1px solid #d3adf7',
          }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              {entryType === 'credit_card' ? '还款到' : '转入账户'}
            </Text>
            <Select
              value={toAccount}
              onChange={setToAccount}
              style={{ width: '100%' }}
              placeholder={entryType === 'credit_card' ? '选择信用卡' : '选择目标账户'}
              options={accounts
                .filter(a => a.is_active && a.id !== selectedAccount)
                .filter(a => entryType === 'credit_card' ? a.account_type === 'credit_card' : true)
                .map(a => ({ label: <span>{a.icon || '💰'} {a.name} (¥{parseFloat(a.balance).toFixed(2)})</span>, value: a.id }))
              }
            />
          </div>
        )}

        {/* Amount Input */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 4,
        }}>
          <span style={{
            fontSize: 28, fontWeight: 700,
            color: entryType === 'expense' ? '#ff4d4f' : entryType === 'income' ? '#52c41a' : '#1677ff',
          }}>¥</span>
          <input
            value={amount}
            onChange={(e) => {
              const val = e.target.value
              if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                setAmount(val)
              }
            }}
            placeholder="0.00"
            style={{
              fontSize: 32, fontWeight: 700, width: '100%', border: 'none', outline: 'none',
              background: 'transparent', textAlign: 'right',
              color: entryType === 'expense' ? '#ff4d4f' : entryType === 'income' ? '#52c41a' : '#1677ff',
              caretColor: '#1677ff',
            }}
            autoFocus
          />
        </div>

        {/* Number Pad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          marginBottom: 16,
        }}>
          {['7','8','9','delete','4','5','6','+','1','2','3','-','0','00','.','ok'].map(key => (
            <Button
              key={key}
              onClick={() => handleNumPad(key)}
              style={{
                height: key === 'ok' ? undefined : 48,
                borderRadius: 10,
                fontSize: key === 'ok' ? 14 : 18,
                fontWeight: key === 'ok' ? 700 : 400,
                ...(key === 'ok' ? {
                  background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
                  color: '#fff',
                  border: 'none',
                } : {}),
                ...(key === 'delete' ? { color: '#ff4d4f' } : {}),
              }}
            >
              {key === 'delete' ? '⌫' : key === 'ok' ? '✓ 保存' : key}
            </Button>
          ))}
        </div>

        {/* Extra Fields */}
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              value={selectedAccount}
              onChange={setSelectedAccount}
              style={{ flex: 1 }}
              placeholder="选择账户"
              options={accounts.filter(a => a.is_active).map(a => ({
                label: <span>{a.icon || '💰'} {a.name}</span>,
                value: a.id,
              }))}
            />
            <DatePicker
              value={entryDate}
              onChange={setEntryDate}
              style={{ flex: 1 }}
            />
          </div>
          <Input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="添加备注..."
            allowClear
          />
        </Space>
      </Drawer>
    </div>
  )
}
