import { useState, useEffect, useRef, useCallback } from 'react'
import { Modal, Form, Input, Select, InputNumber, DatePicker, AutoComplete, Space, Typography } from 'antd'
import dayjs from 'dayjs'
import { TRANSACTION_TYPES, FEE_RATES } from '../constants'
import { searchSecurity } from '../../../api/finance'

const { Text } = Typography

const TRADE_TYPES = ['buy', 'sell', 'dividend', 'interest', 'deposit', 'withdraw', 'fee']

// 按券商标准费率自动计算买入手续费
function calcBuyFees(qty, price) {
  if (!qty || !price || qty <= 0 || price <= 0) return 0
  const amount = qty * price
  const commission = Math.max(amount * FEE_RATES.commission_rate, FEE_RATES.commission_min)
  const transferFee = amount * FEE_RATES.transfer_fee_rate
  return Math.round((commission + transferFee) * 100) / 100
}

// 按券商标准费率自动计算卖出手续费
function calcSellFees(qty, price) {
  if (!qty || !price || qty <= 0 || price <= 0) return 0
  const amount = qty * price
  const commission = Math.max(amount * FEE_RATES.commission_rate, FEE_RATES.commission_min)
  const stampDuty = amount * FEE_RATES.stamp_duty_rate
  const transferFee = amount * FEE_RATES.transfer_fee_rate
  return Math.round((commission + stampDuty + transferFee) * 100) / 100
}

export default function TradeModal({ open, onCancel, onOk, accounts, holdings, loading }) {
  const [form] = Form.useForm()
  const transType = Form.useWatch('transaction_type', form)
  const selectedAccount = Form.useWatch('investment_account', form)
  const selectedHolding = Form.useWatch('holding', form)
  const watchQuantity = Form.useWatch('quantity', form)
  const watchPrice = Form.useWatch('price', form)

  const [searchOptions, setSearchOptions] = useState([])
  const [searching, setSearching] = useState(false)
  const timerRef = useRef(null)

  const needSymbolFields = !['deposit', 'withdraw', 'fee'].includes(transType)
  const needPriceFields = ['buy', 'sell'].includes(transType)
  const isSell = transType === 'sell'
  const isBuy = transType === 'buy'
  const filteredHoldings = selectedAccount
    ? holdings.filter(h => h.investment_account === selectedAccount)
    : holdings

  // 代码搜索（防抖）
  const handleSymbolSearch = useCallback((value) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!value || value.length < 1) {
      setSearchOptions([])
      return
    }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchSecurity(value)
        const list = res.results || res || []
        setSearchOptions(list.map(item => ({
          value: item.symbol,
          label: `${item.symbol} - ${item.name}${item.type === 'fund' ? ' (基金)' : ''}`,
          item,
        })))
      } catch {
        setSearchOptions([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  // 选中搜索结果
  const handleSymbolSelect = (value, option) => {
    form.setFieldsValue({ symbol: value, name: option.item.name })
    setSearchOptions([])
  }

  // 选择持仓时自动填充
  const handleHoldingSelect = (holdingId) => {
    const h = holdings.find(x => x.id === holdingId)
    if (h) {
      form.setFieldsValue({ symbol: h.symbol, name: h.name })
    }
  }

  // 自动计算手续费（按标准费率）
  useEffect(() => {
    if (!needPriceFields) return
    const qty = Number(watchQuantity) || 0
    const price = Number(watchPrice) || 0
    if (qty > 0 && price > 0) {
      const fee = isSell ? calcSellFees(qty, price) : calcBuyFees(qty, price)
      form.setFieldsValue({ fee })
    }
  }, [watchQuantity, watchPrice, needPriceFields, isSell, isBuy, form])

  // 卖出时自动计算盈亏
  useEffect(() => {
    if (!isSell || !selectedHolding) return
    const h = holdings.find(x => x.id === selectedHolding)
    if (!h) return
    const qty = Number(watchQuantity) || 0
    const price = Number(watchPrice) || 0
    const fee = Number(form.getFieldValue('fee')) || 0
    if (qty > 0 && price > 0) {
      const pl = (price - Number(h.avg_cost)) * qty - fee
      form.setFieldsValue({ profit_loss: Math.round(pl * 100) / 100 })
    }
  }, [isSell, selectedHolding, watchQuantity, watchPrice, holdings, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      if (values.date) values.date = values.date.format('YYYY-MM-DD')
      if (['buy', 'sell'].includes(values.transaction_type) && values.quantity && values.price) {
        values.amount = Number(values.quantity) * Number(values.price)
      }
      onOk(values)
      form.resetFields()
    } catch {}
  }

  return (
    <Modal
      title="记录交易"
      open={open}
      onCancel={() => { form.resetFields(); onCancel() }}
      onOk={handleOk}
      confirmLoading={loading}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ transaction_type: 'buy', date: dayjs(), fee: 0, profit_loss: 0 }}>
        <Form.Item name="investment_account" label="投资账户" rules={[{ required: true, message: '请选择账户' }]}>
          <Select placeholder="选择账户">
            {accounts.map(a => (
              <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="transaction_type" label="交易类型" rules={[{ required: true }]}>
          <Select>
            {TRADE_TYPES.map(t => (
              <Select.Option key={t} value={t}>
                {TRANSACTION_TYPES[t]?.icon} {TRANSACTION_TYPES[t]?.label || t}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        {needSymbolFields && (
          <>
            <Form.Item name="holding" label="关联持仓">
              <Select placeholder="选择持仓（可自动填充）" allowClear onChange={handleHoldingSelect}>
                {filteredHoldings.map(h => (
                  <Select.Option key={h.id} value={h.id}>{h.symbol} - {h.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="symbol" label="代码" rules={[{ required: true, message: '请输入代码' }]}>
              <AutoComplete
                options={searchOptions}
                onSearch={handleSymbolSearch}
                onSelect={handleSymbolSelect}
                placeholder="输入代码或名称搜索，如 600519"
                loading={searching}
              />
            </Form.Item>
            <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="如 贵州茅台" />
            </Form.Item>
          </>
        )}
        <Form.Item name="quantity" label="数量"
          rules={needSymbolFields ? [{ required: true, message: '请输入数量' }] : []}
        >
          <InputNumber style={{ width: '100%' }} min={0} precision={4} />
        </Form.Item>
        <Form.Item name="price" label="价格"
          rules={needPriceFields ? [{ required: true, message: '请输入价格' }] : []}
        >
          <InputNumber style={{ width: '100%' }} min={0} precision={4} />
        </Form.Item>
        {!needPriceFields && (
          <Form.Item name="amount" label="金额">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
        )}
        {needPriceFields && (
          <Form.Item name="fee" label="手续费（按标准费率自动计算，可修改）"
            extra={isSell ? '佣金万2.5(最低5元) + 印花税0.05% + 过户费0.001%' : '佣金万2.5(最低5元) + 过户费0.001%'}
          >
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
        )}
        {isSell && (
          <Form.Item name="profit_loss" label="盈亏金额（自动计算）">
            <InputNumber style={{ width: '100%' }} precision={2} />
          </Form.Item>
        )}
        <Form.Item name="date" label="交易日期" rules={[{ required: true, message: '请选择日期' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="note" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
