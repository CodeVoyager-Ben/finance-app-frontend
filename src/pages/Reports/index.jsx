import { useState, useEffect } from 'react'
import {
  Card, Row, Col, Button, DatePicker, Typography, Spin,
  Statistic, Space, message,
} from 'antd'
import {
  DownloadOutlined, BarChartOutlined, WalletOutlined,
  ArrowUpOutlined, ArrowDownOutlined, BankOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { getBalanceSheet, getNetWorthHistory, getExportUrl } from '../../api/finance'
import NetWorthTrend from './NetWorthTrend'
import AssetAllocation from './AssetAllocation'
import HealthRatios from './HealthRatios'
import BalanceSheetTable from './BalanceSheetTable'
import PrivacyToggle from '../../components/PrivacyToggle'
import usePrivacyStore from '../../store/privacyStore'

const { Title, Text } = Typography

export default function Reports() {
  const [balanceSheet, setBalanceSheet] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [exportDateRange, setExportDateRange] = useState(null)
  const hidden = usePrivacyStore((s) => s.hiddenPages)['reports']

  useEffect(() => { loadData() }, [])

  const loadData = async (date) => {
    setLoading(true)
    try {
      const params = {}
      if (date) params.date = date
      const [bs, hist] = await Promise.all([
        getBalanceSheet(params),
        getNetWorthHistory({ months: 12 }),
      ])
      setBalanceSheet(bs)
      setHistoryData(hist.history || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    if (date) {
      loadData(date.format('YYYY-MM-DD'))
    } else {
      loadData()
    }
  }

  const handleExport = (type) => {
    const params = {}
    if (exportDateRange && exportDateRange[0]) {
      params.start_date = exportDateRange[0].format('YYYY-MM-DD')
      params.end_date = exportDateRange[1].format('YYYY-MM-DD')
    }
    const url = getExportUrl(type, params)
    const token = localStorage.getItem('access_token')

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`导出失败 (${res.status})`)
        return res.blob()
      })
      .then(blob => {
        const a = document.createElement('a')
        a.href = window.URL.createObjectURL(blob)
        a.download = type === 'transactions' ? '收支明细.xlsx' : '资产负债表.xlsx'
        a.click()
        window.URL.revokeObjectURL(a.href)
        message.success('导出成功')
      })
      .catch(() => message.error('导出失败'))
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const fmt = (v) => parseFloat(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <Title level={4} style={{ margin: 0 }}>
          <BarChartOutlined style={{ color: '#1677ff', marginRight: 8 }} />
          报表中心
        </Title>
        <Space>
          <PrivacyToggle pageKey="reports" />
          <Text type="secondary">查看日期:</Text>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            placeholder="默认今天"
            allowClear
          />
        </Space>
      </div>

      {balanceSheet && (
        <>
          {/* Summary Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card styles={{ body: { padding: '16px 20px' } }}
                style={{ background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)', border: 'none', borderRadius: 10 }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>总资产</span>}
                  value={hidden ? '****' : balanceSheet.assets.total}
                  prefix={hidden ? '' : '¥'}
                  precision={hidden ? undefined : 2}
                  valueStyle={{ color: '#fff', fontSize: 22, fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card styles={{ body: { padding: '16px 20px' } }}
                style={{ background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)', border: 'none', borderRadius: 10 }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>总负债</span>}
                  value={hidden ? '****' : balanceSheet.liabilities.total}
                  prefix={hidden ? '' : '¥'}
                  precision={hidden ? undefined : 2}
                  valueStyle={{ color: '#fff', fontSize: 22, fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card styles={{ body: { padding: '16px 20px' } }}
                style={{
                  background: parseFloat(balanceSheet.net_worth) >= 0
                    ? 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)'
                    : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                  border: 'none', borderRadius: 10,
                }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>净资产</span>}
                  value={hidden ? '****' : balanceSheet.net_worth}
                  prefix={hidden ? '' : '¥'}
                  precision={hidden ? undefined : 2}
                  suffix={<WalletOutlined />}
                  valueStyle={{ color: '#fff', fontSize: 24, fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card styles={{ body: { padding: '16px 20px' } }}
                style={{
                  background: balanceSheet.net_worth_change?.change >= 0
                    ? 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)'
                    : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                  border: 'none', borderRadius: 10,
                }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>环比变化</span>}
                  value={hidden ? '****' : (balanceSheet.net_worth_change?.change || 0)}
                  precision={hidden ? undefined : 2}
                  suffix={
                    hidden ? null : (
                      <span style={{ fontSize: 13 }}>
                        ({balanceSheet.net_worth_change?.change_pct > 0 ? '+' : ''}{balanceSheet.net_worth_change?.change_pct || 0}%)
                      </span>
                    )
                  }
                  valueStyle={{ color: '#fff', fontSize: 20, fontWeight: 700 }}
                  prefix={hidden ? null : <span style={{ fontSize: 16 }}>
                    {balanceSheet.net_worth_change?.change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  </span>}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts Row */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={14}>
              <Card title="净资产趋势" styles={{ body: { height: 340 } }}>
                <NetWorthTrend history={historyData} hidden={hidden} />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="资产配置" styles={{ body: { height: 340 } }}>
                <AssetAllocation
                  allocation={balanceSheet.assets.allocation}
                  totalAssets={balanceSheet.assets.total}
                  hidden={hidden}
                />
              </Card>
            </Col>
          </Row>

          {/* Health Ratios */}
          <HealthRatios
            ratios={balanceSheet.ratios}
            netWorthChange={balanceSheet.net_worth_change}
            hidden={hidden}
          />

          {/* Balance Sheet Detail */}
          <BalanceSheetTable
            assets={balanceSheet.assets}
            liabilities={balanceSheet.liabilities}
            netWorth={balanceSheet.net_worth}
            hidden={hidden}
          />
        </>
      )}

      {/* Export Section */}
      <Card title="导出报表" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col><Text type="secondary">日期范围:</Text></Col>
          <Col>
            <DatePicker.RangePicker onChange={setExportDateRange} />
          </Col>
          <Col>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={() => handleExport('transactions')}>
                导出收支明细
              </Button>
              <Button type="primary" icon={<DownloadOutlined />} onClick={() => handleExport('balance_sheet')}>
                导出资产负债表
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
