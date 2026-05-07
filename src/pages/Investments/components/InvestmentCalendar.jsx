import { useState, useEffect } from 'react'
import { Card, Modal, Empty, Button, Table, Tag, message } from 'antd'
import { LeftOutlined, RightOutlined, SyncOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getDailySnapshots, autoUpdatePrices } from '../../../api/finance'
import { formatMoney, plColor, formatPct } from '../constants'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function InvestmentCalendar({ refreshKey, hidden }) {
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [snapshots, setSnapshots] = useState([])
  const [dailySummary, setDailySummary] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { loadMonthData() }, [currentMonth, refreshKey])

  const loadMonthData = async () => {
    setLoading(true)
    try {
      const start = currentMonth.startOf('month').format('YYYY-MM-DD')
      const end = currentMonth.endOf('month').format('YYYY-MM-DD')
      const res = await getDailySnapshots({ start_date: start, end_date: end })
      const snapList = res.snapshots || res.results || res || []
      setSnapshots(Array.isArray(snapList) ? snapList : [])

      // Build daily summary map from API response
      const summaryMap = {}
      const apiSummary = res.daily_summary || []
      apiSummary.forEach(s => { summaryMap[s.date] = s })
      // Fallback: compute from snapshots if API doesn't return daily_summary
      if (apiSummary.length === 0 && snapList.length > 0) {
        snapList.forEach(s => {
          if (!summaryMap[s.date]) {
            summaryMap[s.date] = { date: s.date, daily_pl: 0, total_pl: 0, count: 0 }
          }
          summaryMap[s.date].daily_pl += parseFloat(s.daily_pl || 0)
          summaryMap[s.date].total_pl += parseFloat(s.total_pl || 0)
          summaryMap[s.date].count += 1
        })
      }
      setDailySummary(summaryMap)
    } catch (e) {
      console.error(e)
      setSnapshots([])
      setDailySummary({})
    } finally {
      setLoading(false)
    }
  }

  const prevMonth = () => setCurrentMonth(m => m.subtract(1, 'month'))
  const nextMonth = () => setCurrentMonth(m => m.add(1, 'month'))
  const goToday = () => setCurrentMonth(dayjs())

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await autoUpdatePrices()
      message.success(res.detail || '数据同步成功')
      if (res.failed_symbols?.length > 0) {
        message.warning(`${res.failed_symbols.length} 个持仓获取失败: ${res.failed_symbols.join(', ')}`)
      }
      loadMonthData()
    } catch (err) {
      message.error(err.response?.data?.detail || '同步失败')
    } finally {
      setSyncing(false)
    }
  }

  const onSelectDate = (dateStr) => {
    setSelectedDate(dateStr)
    setModalOpen(true)
  }

  // Month totals
  const summaryValues = Object.values(dailySummary)
  const monthPl = summaryValues.reduce((s, d) => s + parseFloat(d.daily_pl || 0), 0)
  const profitDays = summaryValues.filter(d => parseFloat(d.daily_pl || 0) > 0).length
  const lossDays = summaryValues.filter(d => parseFloat(d.daily_pl || 0) < 0).length

  // Selected day data
  const selectedSummary = selectedDate ? dailySummary[selectedDate] : null
  const selectedSnapshots = selectedDate
    ? snapshots.filter(s => s.date === selectedDate)
    : []

  // Calendar grid
  const startOfMonth = currentMonth.startOf('month')
  const startDay = startOfMonth.day()
  const daysInMonth = currentMonth.daysInMonth()
  const todayStr = dayjs().format('YYYY-MM-DD')
  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = currentMonth.date(d).format('YYYY-MM-DD')
    cells.push({ day: d, date: dateStr, summary: dailySummary[dateStr], isToday: dateStr === todayStr })
  }
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) for (let i = 0; i < remaining; i++) cells.push(null)

  // Detail table columns
  const detailColumns = [
    { title: '代码', dataIndex: 'symbol', width: 80 },
    { title: '名称', dataIndex: 'name', width: 100 },
    {
      title: '收盘价', dataIndex: 'close_price', width: 90, align: 'right',
      render: (v) => hidden ? '****' : Number(v).toFixed(2),
    },
    {
      title: '日盈亏', dataIndex: 'daily_pl', width: 100, align: 'right',
      render: (v) => hidden ? '****' : <span style={{ color: plColor(v), fontWeight: 600 }}>{formatMoney(v)}</span>,
    },
    {
      title: '日盈亏%', dataIndex: 'daily_pl_pct', width: 90, align: 'right',
      render: (v) => hidden ? '****' : <span style={{ color: plColor(v) }}>{formatPct(v)}</span>,
    },
    {
      title: '总盈亏', dataIndex: 'total_pl', width: 100, align: 'right',
      render: (v) => hidden ? '****' : <span style={{ color: plColor(v), fontWeight: 600 }}>{formatMoney(v)}</span>,
    },
    {
      title: '总盈亏%', dataIndex: 'total_pl_pct', width: 90, align: 'right',
      render: (v) => hidden ? '****' : <span style={{ color: plColor(v) }}>{formatPct(v)}</span>,
    },
  ]

  return (
    <div>
      {/* Month Summary Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: 16, padding: '24px 32px', marginBottom: 20, color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button type="text" icon={<LeftOutlined />} onClick={prevMonth}
              style={{ color: '#fff', fontSize: 18 }} />
            <span style={{ fontSize: 22, fontWeight: 700, minWidth: 140, textAlign: 'center' }}>
              {currentMonth.format('YYYY年MM月')}
            </span>
            <Button type="text" icon={<RightOutlined />} onClick={nextMonth}
              style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<SyncOutlined spin={syncing} />} loading={syncing} onClick={handleSync}
              style={{ borderRadius: 16, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
              同步今日数据
            </Button>
            <Button onClick={goToday} style={{ borderRadius: 16, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
              今天
            </Button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 48 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>本月盈亏</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: plColor(monthPl) }}>
              {hidden ? '****' : `${monthPl > 0 ? '+' : ''}¥${formatMoney(monthPl)}`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>盈利天数</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#f5222d' }}>{profitDays}天</div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>亏损天数</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#52c41a' }}>{lossDays}天</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card loading={loading} styles={{ body: { padding: 12 } }}>
        {/* Weekday Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 8 }}>
          {WEEKDAYS.map((w, i) => (
            <div key={i} style={{ fontSize: 13, fontWeight: 600, color: i === 0 || i === 6 ? '#ff6b6b' : '#999', padding: 8 }}>
              {w}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((cell, i) => {
            if (!cell) return <div key={`e${i}`} style={{ height: 88 }} />
            const { day, date: dateStr, summary, isToday } = cell
            const dailyPl = summary ? parseFloat(summary.daily_pl || 0) : 0
            const dailyPlPct = summary ? parseFloat(summary.daily_pl_pct || 0) : 0
            const hasData = !!summary

            // Background color based on daily P&L
            let bgColor = 'transparent'
            if (hasData && dailyPl !== 0) {
              bgColor = dailyPl > 0
                ? `rgba(245,34,45,${Math.min(0.1 + Math.abs(dailyPl) * 0.0002, 0.3)})`
                : `rgba(82,196,26,${Math.min(0.1 + Math.abs(dailyPl) * 0.0002, 0.3)})`
            }
            if (isToday) bgColor = '#e6f7ff'
            const bgColorBase = bgColor

            return (
              <div
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                style={{
                  height: 88, borderRadius: 10, padding: 6,
                  cursor: 'pointer', position: 'relative',
                  transition: 'all 0.2s',
                  background: bgColor,
                  border: isToday ? '2px solid #1677ff' : '2px solid transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e6f7ff' }}
                onMouseLeave={e => { e.currentTarget.style.background = bgColorBase }}
              >
                <div style={{
                  fontSize: 14, fontWeight: isToday ? 700 : 400,
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 4px',
                  background: isToday ? '#1677ff' : 'transparent',
                  color: isToday ? '#fff' : '#333',
                }}>
                  {day}
                </div>

                {hasData && dailyPl !== 0 && (
                  <div style={{
                    fontSize: 11, fontWeight: 600, textAlign: 'center',
                    color: plColor(dailyPl),
                    background: dailyPl > 0 ? 'rgba(245,34,45,0.08)' : 'rgba(82,196,26,0.08)',
                    borderRadius: 4, padding: '1px 0', marginBottom: 2,
                  }}>
                    {hidden ? '****' : `${dailyPl > 0 ? '+' : ''}${formatMoney(dailyPl)}`}
                  </div>
                )}
                {hasData && dailyPlPct !== 0 && (
                  <div style={{
                    fontSize: 10, textAlign: 'center',
                    color: plColor(dailyPlPct),
                  }}>
                    {hidden ? '****' : `${dailyPlPct > 0 ? '+' : ''}${Number(dailyPlPct).toFixed(2)}%`}
                  </div>
                )}
                {hasData && dailyPl === 0 && (
                  <div style={{ fontSize: 10, textAlign: 'center', color: '#8c8c8c' }}>
                    持平
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Day Detail Modal */}
      <Modal
        title={null}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={800}
        closable
        styles={{ body: { padding: 0 } }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          padding: '24px 28px 20px', color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                {selectedDate && dayjs(selectedDate).format('YYYY年MM月DD日')}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                星期{selectedDate && WEEKDAYS[dayjs(selectedDate).day()]}
                {selectedSummary ? ` · ${selectedSummary.count}个持仓` : ' · 无数据'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 32, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>当日盈亏</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: plColor(parseFloat(selectedSummary?.daily_pl || 0)) }}>
                {hidden ? '****' : `${selectedSummary && parseFloat(selectedSummary.daily_pl) > 0 ? '+' : ''}¥${formatMoney(selectedSummary?.daily_pl || 0)}`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>累计盈亏</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: plColor(parseFloat(selectedSummary?.total_pl || 0)) }}>
                {hidden ? '****' : `${selectedSummary && parseFloat(selectedSummary.total_pl) > 0 ? '+' : ''}¥${formatMoney(selectedSummary?.total_pl || 0)}`}
              </div>
            </div>
          </div>
        </div>

        {/* Snapshot Table */}
        <div style={{ padding: '16px 20px' }}>
          {selectedSnapshots.length === 0 ? (
            <Empty description="当日无持仓快照数据" style={{ padding: 40 }} />
          ) : (
            <Table
              dataSource={selectedSnapshots}
              columns={detailColumns}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 700 }}
            />
          )}
        </div>
      </Modal>
    </div>
  )
}
