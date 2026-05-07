import { useState, useEffect } from 'react'
import { Card, Button, Tabs, Space, Table, Tag, message } from 'antd'
import { FundOutlined, PlusOutlined, DollarOutlined, EditOutlined, SyncOutlined } from '@ant-design/icons'
import useInvestmentData from './hooks/useInvestmentData'
import DashboardStats from './components/DashboardStats'
import AccountCards from './components/AccountCards'
import HoldingsTable from './components/HoldingsTable'
import TradesTable from './components/TradesTable'
import AssetAllocationChart from './components/AssetAllocationChart'
import HoldingDetailDrawer from './components/HoldingDetailDrawer'
import AccountModal from './components/AccountModal'
import TradeModal from './components/TradeModal'
import DividendModal from './components/DividendModal'
import PriceUpdateModal from './components/PriceUpdateModal'
import SellModal from './components/SellModal'
import InvestmentCalendar from './components/InvestmentCalendar'
import { DIVIDEND_TYPES } from './constants'
import PrivacyToggle from '../../components/PrivacyToggle'
import usePrivacyStore from '../../store/privacyStore'
import {
  createInvestmentAccount, updateInvestmentAccount, deleteInvestmentAccount,
  createInvestTransaction, batchUpdatePrices, autoUpdatePrices, createDividendRecord,
  getAccounts,
} from '../../api/finance'

const fmt = (v) => Number(v || 0).toFixed(2)

function AnalysisTabContent({ dashboard, hidden }) {
  if (!dashboard) return null
  const { by_asset_type = [], by_currency = [] } = dashboard

  return (
    <div>
      <Card title="按资产类型分布" size="small" style={{ marginBottom: 16 }}>
        <Table
          dataSource={by_asset_type}
          rowKey="asset_type_name"
          size="small"
          pagination={false}
          columns={[
            { title: '类型', dataIndex: 'asset_type_name', render: (v, r) => <Tag color={r.asset_type_color}>{v}</Tag> },
            { title: '市值', dataIndex: 'market_value', align: 'right', render: (v) => hidden ? '****' : fmt(v) },
            { title: '成本', dataIndex: 'cost_value', align: 'right', render: (v) => hidden ? '****' : fmt(v) },
            { title: '盈亏', dataIndex: 'profit_loss', align: 'right', render: (v) => <span style={{ color: v > 0 ? '#f5222d' : '#52c41a' }}>{hidden ? '****' : fmt(v)}</span> },
            { title: '占比', dataIndex: 'weight_pct', align: 'right', render: (v) => hidden ? '****' : `${Number(v).toFixed(1)}%` },
          ]}
        />
      </Card>
      <Card title="按币种分布" size="small">
        <Table
          dataSource={by_currency}
          rowKey="currency"
          size="small"
          pagination={false}
          columns={[
            { title: '币种', dataIndex: 'currency' },
            { title: '原币市值', dataIndex: 'market_value', align: 'right', render: (v) => hidden ? '****' : Number(v).toFixed(2) },
            { title: '人民币市值', dataIndex: 'market_value_cny', align: 'right', render: (v) => hidden ? '****' : fmt(v) },
            { title: '汇率', dataIndex: 'exchange_rate', align: 'right', render: (v) => hidden ? '****' : Number(v).toFixed(4) },
          ]}
        />
      </Card>
    </div>
  )
}

export default function Investments() {
  const {
    accounts, holdings, transactions, dividends, dashboard, assetTypes,
    loading, loadData,
  } = useInvestmentData()

  const [accountModal, setAccountModal] = useState(false)
  const [tradeModal, setTradeModal] = useState(false)
  const [dividendModal, setDividendModal] = useState(false)
  const [priceModal, setPriceModal] = useState(false)
  const [detailHolding, setDetailHolding] = useState(null)
  const [sellHolding, setSellHolding] = useState(null)
  const [saving, setSaving] = useState(false)
  const [autoUpdating, setAutoUpdating] = useState(false)
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0)
  const [editingAccount, setEditingAccount] = useState(null)
  const [fundAccounts, setFundAccounts] = useState([])
  const hidden = usePrivacyStore((s) => s.hiddenPages)['investments']

  useEffect(() => {
    getAccounts().then(res => setFundAccounts(res.results || res)).catch(() => {})
  }, [])

  // ── 创建/编辑账户 ──
  const handleSaveAccount = async (values) => {
    setSaving(true)
    try {
      if (editingAccount) {
        await updateInvestmentAccount(editingAccount.id, values)
        message.success('账户更新成功')
      } else {
        await createInvestmentAccount(values)
        message.success('账户创建成功')
      }
      setAccountModal(false)
      setEditingAccount(null)
      loadData()
    } catch (err) {
      message.error(err.response?.data?.detail || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  // ── 删除账户 ──
  const handleDeleteAccount = async (account) => {
    try {
      await deleteInvestmentAccount(account.id)
      message.success('账户已删除')
      loadData()
    } catch (err) {
      message.error(err.response?.data?.detail || '删除失败')
    }
  }

  // ── 记录交易 ──
  const handleCreateTrade = async (values) => {
    setSaving(true)
    try {
      await createInvestTransaction(values)
      message.success('交易记录成功')
      setTradeModal(false)
      loadData()
    } catch (err) {
      message.error(err.response?.data?.detail || '记录失败')
    } finally {
      setSaving(false)
    }
  }

  // ── 卖出持仓 ──
  const handleSell = async (values) => {
    setSaving(true)
    try {
      await createInvestTransaction(values)
      message.success('卖出成功')
      setSellHolding(null)
      loadData()
    } catch (err) {
      message.error(err.response?.data?.detail || '卖出失败')
    } finally {
      setSaving(false)
    }
  }

  // ── 自动更新价格 ──
  const handleAutoUpdatePrices = async () => {
    setAutoUpdating(true)
    try {
      const res = await autoUpdatePrices()
      message.success(res.detail || '价格更新成功')
      if (res.failed_symbols?.length > 0) {
        message.warning(`${res.failed_symbols.length} 个持仓价格获取失败: ${res.failed_symbols.join(', ')}`)
      }
      loadData()
      setCalendarRefreshKey(k => k + 1)
    } catch (err) {
      message.error(err.response?.data?.detail || '自动更新失败')
    } finally {
      setAutoUpdating(false)
    }
  }

  // ── 批量更新价格 ──
  const handleBatchPrices = async (data) => {
    setSaving(true)
    try {
      await batchUpdatePrices(data)
      message.success('价格更新成功')
      setPriceModal(false)
      loadData()
    } catch (err) {
      message.error('更新失败')
    } finally {
      setSaving(false)
    }
  }

  // ── 记录分红 ──
  const handleCreateDividend = async (values) => {
    setSaving(true)
    try {
      await createDividendRecord(values)
      message.success('分红记录成功')
      setDividendModal(false)
      loadData()
    } catch (err) {
      message.error(err.response?.data?.detail || '记录失败')
    } finally {
      setSaving(false)
    }
  }

  // ── 分红 Tab 表格列 ──
  const dividendColumns = [
    { title: '除权日', dataIndex: 'ex_date', width: 100 },
    {
      title: '类型', dataIndex: 'dividend_type', width: 100,
      render: (v) => {
        const cfg = DIVIDEND_TYPES[v] || { label: v, color: '#999' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    { title: '代码', dataIndex: 'symbol', width: 80 },
    { title: '名称', dataIndex: 'name', width: 100 },
    {
      title: '每单位', dataIndex: 'dividend_per_unit', width: 90, align: 'right',
      render: (v) => hidden ? '****' : Number(v).toFixed(4),
    },
    {
      title: '数量', dataIndex: 'quantity', width: 90, align: 'right',
      render: (v) => hidden ? '****' : Number(v).toFixed(2),
    },
    {
      title: '总金额', dataIndex: 'total_amount', width: 100, align: 'right',
      render: (v) => hidden ? '****' : fmt(v),
    },
    {
      title: '扣税', dataIndex: 'tax', width: 80, align: 'right',
      render: (v) => hidden ? '****' : Number(v || 0).toFixed(2),
    },
    {
      title: '税后净额', dataIndex: 'net_amount', width: 100, align: 'right',
      render: (v) => <span style={{ fontWeight: 600 }}>{hidden ? '****' : fmt(v)}</span>,
    },
    { title: '账户', dataIndex: 'account_name', width: 100 },
    { title: '备注', dataIndex: 'note', width: 120, ellipsis: true },
  ]

  // ── 分析 Tab ──

  const tabItems = [
    {
      key: 'overview',
      label: '概览',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <DashboardStats dashboard={dashboard} loading={loading} hidden={hidden} />
          <AccountCards
            accounts={accounts}
            onAddAccount={() => { setEditingAccount(null); setAccountModal(true) }}
            onEditAccount={(acc) => { setEditingAccount(acc); setAccountModal(true) }}
            onDeleteAccount={handleDeleteAccount}
            hidden={hidden}
          />
          <Card title="资产配置" size="small">
            <AssetAllocationChart
              byAssetType={dashboard?.by_asset_type || []}
              totalMarketValue={dashboard?.total_market_value || 0}
              hidden={hidden}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'holdings',
      label: '持仓',
      children: (
        <HoldingsTable
          holdings={holdings}
          loading={loading}
          onViewDetail={(h) => setDetailHolding(h)}
          onSell={(h) => setSellHolding(h)}
          hidden={hidden}
        />
      ),
    },
    {
      key: 'trades',
      label: '交易',
      children: <TradesTable transactions={transactions} loading={loading} hidden={hidden} />,
    },
    {
      key: 'dividends',
      label: '分红/利息',
      children: (
        <Table
          dataSource={dividends}
          columns={dividendColumns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        />
      ),
    },
    {
      key: 'analysis',
      label: '分析',
      children: <AnalysisTabContent dashboard={dashboard} hidden={hidden} />,
    },
    {
      key: 'calendar',
      label: '日历',
      children: <InvestmentCalendar refreshKey={calendarRefreshKey} hidden={hidden} />,
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 20, fontWeight: 600 }}>
          <FundOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          投资管理
        </span>
        <Space>
          <PrivacyToggle pageKey="investments" />
          <Button icon={<DollarOutlined />} onClick={() => setDividendModal(true)}>记录分红</Button>
          <Button icon={<SyncOutlined />} onClick={handleAutoUpdatePrices} loading={autoUpdating}>自动更新价格</Button>
          <Button icon={<EditOutlined />} onClick={() => setPriceModal(true)}>手动更新价格</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setTradeModal(true)}>记录交易</Button>
        </Space>
      </div>

      <Tabs defaultActiveKey="overview" items={tabItems} />

      <AccountModal
        open={accountModal}
        onCancel={() => { setAccountModal(false); setEditingAccount(null) }}
        onOk={handleSaveAccount}
        assetTypes={assetTypes}
        fundAccounts={fundAccounts}
        loading={saving}
        initialValues={editingAccount}
      />
      <TradeModal
        open={tradeModal}
        onCancel={() => setTradeModal(false)}
        onOk={handleCreateTrade}
        accounts={accounts}
        holdings={holdings}
        loading={saving}
      />
      <DividendModal
        open={dividendModal}
        onCancel={() => setDividendModal(false)}
        onOk={handleCreateDividend}
        accounts={accounts}
        holdings={holdings}
        loading={saving}
      />
      <PriceUpdateModal
        open={priceModal}
        onCancel={() => setPriceModal(false)}
        onOk={handleBatchPrices}
        holdings={holdings}
        loading={saving}
      />
      <HoldingDetailDrawer
        holding={detailHolding}
        open={!!detailHolding}
        onClose={() => setDetailHolding(null)}
        transactions={transactions}
        hidden={hidden}
      />
      <SellModal
        open={!!sellHolding}
        holding={sellHolding}
        onCancel={() => setSellHolding(null)}
        onOk={handleSell}
        loading={saving}
        hidden={hidden}
      />
    </div>
  )
}
