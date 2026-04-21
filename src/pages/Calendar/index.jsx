import { useState, useEffect } from 'react'
import { Card, Calendar, Modal, List, Tag, Typography, Empty, Button } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getDailySummary, getTransactions } from '../../api/finance'

const { Title, Text } = Typography

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [dailySummary, setDailySummary] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [daySummary, setDaySummary] = useState(null)
  const [dayTransactions, setDayTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => { loadMonthData() }, [currentMonth])

  const loadMonthData = async () => {
    setLoading(true)
    try {
      const data = await getDailySummary({ year: currentMonth.year(), month: currentMonth.month() + 1 })
      setDailySummary(data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const summaryMap = {}
  dailySummary.forEach(s => { summaryMap[s.date] = s })

  const onSelectDate = async (date) => {
    const dateStr = date.format('YYYY-MM-DD')
    setSelectedDate(dateStr)
    setDaySummary(summaryMap[dateStr] || null)
    try {
      const data = await getTransactions({ date: dateStr })
      setDayTransactions(data.results || data)
      setModalOpen(true)
    } catch (e) { console.error(e) }
  }

  const prevMonth = () => setCurrentMonth(m => m.subtract(1, 'month'))
  const nextMonth = () => setCurrentMonth(m => m.add(1, 'month'))
  const goToday = () => setCurrentMonth(dayjs())

  // Month totals
  const monthIncome = dailySummary.reduce((s, d) => s + parseFloat(d.income || 0), 0)
  const monthExpense = dailySummary.reduce((s, d) => s + parseFloat(d.expense || 0), 0)
  const monthBalance = monthIncome - monthExpense

  // Day totals
  const dayIncome = daySummary ? parseFloat(daySummary.income) : 0
  const dayExpense = daySummary ? parseFloat(daySummary.expense) : 0
  const dayCount = daySummary ? parseInt(daySummary.count) : 0

  // Generate calendar grid data
  const startOfMonth = currentMonth.startOf('month')
  const startDay = startOfMonth.day() // 0=Sun
  const daysInMonth = currentMonth.daysInMonth()
  const cells = []
  // Prev month padding
  for (let i = 0; i < startDay; i++) cells.push(null)
  // This month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = currentMonth.date(d)
    const dateStr = date.format('YYYY-MM-DD')
    cells.push({ day: d, date: dateStr, summary: summaryMap[dateStr], isToday: dateStr === dayjs().format('YYYY-MM-DD') })
  }
  // Next month padding
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) for (let i = 0; i < remaining; i++) cells.push(null)

  return (
    <div>
      {/* Month Summary Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
        borderRadius: 16, padding: '24px 32px', marginBottom: 20, color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button type="text" icon={<LeftOutlined />} onClick={prevMonth}
              style={{ color: '#fff', fontSize: 18 }} />
            <Title level={3} style={{ color: '#fff', margin: 0, minWidth: 140, textAlign: 'center' }}>
              {currentMonth.format('YYYY年MM月')}
            </Title>
            <Button type="text" icon={<RightOutlined />} onClick={nextMonth}
              style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <Button onClick={goToday} style={{ borderRadius: 16, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
            今天
          </Button>
        </div>
        <div style={{ display: 'flex', gap: 48 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>收入</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#ff6b6b' }}>+¥{monthIncome.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>支出</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#69db7c' }}>-¥{monthExpense.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>结余</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: monthBalance >= 0 ? '#ff6b6b' : '#69db7c' }}>
              {monthBalance >= 0 ? '+' : ''}¥{monthBalance.toFixed(2)}
            </div>
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
            if (!cell) return <div key={`e${i}`} style={{ height: 80 }} />
            const { day, date: dateStr, summary, isToday } = cell
            const income = summary ? parseFloat(summary.income) : 0
            const expense = summary ? parseFloat(summary.expense) : 0
            const balance = income - expense
            const hasData = income > 0 || expense > 0

            // Background: positive(收入>支出)=light red, negative(支出>收入)=light green
            let bgColor = 'transparent'
            if (hasData) {
              bgColor = balance >= 0
                ? `rgba(255,107,107,${Math.min(0.12 + Math.abs(balance) * 0.002, 0.3)})`
                : `rgba(82,196,26,${Math.min(0.12 + Math.abs(balance) * 0.002, 0.3)})`
            }
            if (isToday) bgColor = '#e6f7ff'
            const bgColorBase = bgColor

            return (
              <div
                key={dateStr}
                onClick={() => onSelectDate(dayjs(dateStr))}
                style={{
                  height: 80, borderRadius: 10, padding: 6,
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

                {income > 0 && (
                  <div style={{
                    fontSize: 11, fontWeight: 600, textAlign: 'center',
                    color: '#ff6b6b', // 正数=红色
                    background: 'rgba(255,107,107,0.08)', borderRadius: 4, padding: '1px 0',
                  }}>
                    +{income.toFixed(2)}
                  </div>
                )}
                {expense > 0 && (
                  <div style={{
                    fontSize: 11, fontWeight: 600, textAlign: 'center',
                    color: '#52c41a', // 负数=绿色
                    background: 'rgba(82,196,26,0.08)', borderRadius: 4, padding: '1px 0',
                  }}>
                    -{expense.toFixed(2)}
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
        width={560}
        closable
        styles={{ body: { padding: 0 } }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
          padding: '24px 28px 20px', color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                {selectedDate && dayjs(selectedDate).format('YYYY年MM月DD日')}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                星期{selectedDate && WEEKDAYS[dayjs(selectedDate).day()]} · {dayCount}笔交易
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 32, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>收入（正）</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#ff6b6b' }}>+¥{dayIncome.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>支出（负）</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#69db7c' }}>-¥{dayExpense.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>当日结余</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: (dayIncome - dayExpense) >= 0 ? '#ff6b6b' : '#69db7c' }}>
                {(dayIncome - dayExpense) >= 0 ? '+' : ''}¥{(dayIncome - dayExpense).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {dayTransactions.length === 0 ? (
            <Empty description="当日无交易记录" style={{ padding: 40 }} />
          ) : (
            <List
              dataSource={dayTransactions}
              split
              renderItem={(item) => {
                const amount = parseFloat(item.amount)
                const isIncome = item.transaction_type === 'income'
                return (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 24px',
                    borderBottom: '1px solid #f5f5f5',
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: isIncome
                        ? 'linear-gradient(135deg, #ff6b6b20 0%, #ff6b6b10 100%)'
                        : 'linear-gradient(135deg, #69db7c20 0%, #69db7c10 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, flexShrink: 0,
                    }}>
                      {item.category_icon || (isIncome ? '💰' : '💸')}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Text strong style={{ fontSize: 14 }}>{item.category_name || '未分类'}</Text>
                        <Tag color={isIncome ? 'red' : 'green'}
                          style={{ fontSize: 11, lineHeight: '18px', padding: '0 6px', margin: 0, borderRadius: 4 }}>
                          {isIncome ? '收入' : '支出'}
                        </Tag>
                      </div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>
                        {item.account_name}
                        {item.note && <span> · {item.note}</span>}
                      </div>
                    </div>

                    {/* Amount */}
                    <div style={{
                      fontSize: 17, fontWeight: 700, flexShrink: 0,
                      color: isIncome ? '#ff6b6b' : '#52c41a',
                    }}>
                      {isIncome ? '+' : '-'}¥{amount.toFixed(2)}
                    </div>
                  </div>
                )
              }}
            />
          )}
        </div>
      </Modal>
    </div>
  )
}
