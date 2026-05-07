import { Modal, Form, InputNumber, Descriptions, Divider, Typography } from 'antd'
import dayjs from 'dayjs'
import { FEE_RATES, plColor, formatMoney } from '../constants'

const { Text } = Typography

function calcFees(amount) {
  const commission = Math.max(amount * FEE_RATES.commission_rate, FEE_RATES.commission_min)
  const stampDuty = amount * FEE_RATES.stamp_duty_rate
  const transferFee = amount * FEE_RATES.transfer_fee_rate
  return { commission, stampDuty, transferFee, total: commission + stampDuty + transferFee }
}

export default function SellModal({ open, holding, onCancel, onOk, loading, hidden }) {
  const [form] = Form.useForm()
  const sellPrice = Form.useWatch('price', form)
  const sellQty = Form.useWatch('quantity', form)

  if (!holding) return null

  const maxQty = Number(holding.quantity) || 0
  const avgCost = Number(holding.avg_cost) || 0
  const qty = Number(sellQty) || 0
  const price = Number(sellPrice) || 0
  const amount = price * qty
  const costValue = avgCost * qty

  const fees = amount > 0 ? calcFees(amount) : null
  const netProceeds = fees ? amount - fees.total : 0
  const profitLoss = netProceeds - costValue

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onOk({
        investment_account: holding.investment_account,
        holding: holding.id,
        symbol: holding.symbol,
        name: holding.name,
        transaction_type: 'sell',
        quantity: values.quantity,
        price: values.price,
        amount,
        fee: fees?.total.toFixed(2) || 0,
        profit_loss: profitLoss.toFixed(2),
        date: dayjs().format('YYYY-MM-DD'),
        note: `卖出 ${holding.name} ${values.quantity}股`,
      })
      form.resetFields()
    } catch {}
  }

  return (
    <Modal
      title={`卖出 ${holding.name} (${holding.symbol})`}
      open={open}
      onCancel={() => { form.resetFields(); onCancel() }}
      onOk={handleOk}
      confirmLoading={loading}
      okText="确认卖出"
      width={460}
      destroyOnClose
    >
      <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="可卖数量">
          <Text strong>{hidden ? '****' : maxQty.toFixed(2)}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="成本价">{hidden ? '****' : avgCost.toFixed(4)}</Descriptions.Item>
        <Descriptions.Item label="持仓成本">{hidden ? '****' : formatMoney(avgCost * maxQty)}</Descriptions.Item>
        <Descriptions.Item label="现价">{hidden ? '****' : Number(holding.current_price).toFixed(4)}</Descriptions.Item>
      </Descriptions>

      <Form form={form} layout="vertical"
        initialValues={{ quantity: maxQty, price: Number(holding.current_price) || undefined }}
      >
        <Form.Item name="quantity" label="卖出数量"
          rules={[
            { required: true, message: '请输入卖出数量' },
            {
              validator: (_, value) => {
                if (value && Number(value) > maxQty) {
                  return Promise.reject(`超出可卖数量（最多 ${maxQty.toFixed(2)}）`)
                }
                if (value && Number(value) <= 0) {
                  return Promise.reject('卖出数量必须大于0')
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <InputNumber style={{ width: '100%' }} min={0.01} max={maxQty} precision={2}
            placeholder={`最多卖出 ${maxQty.toFixed(2)}`} addonAfter={`/ ${maxQty.toFixed(2)}`}
          />
        </Form.Item>
        <Form.Item name="price" label="卖出价格" rules={[{ required: true, message: '请输入卖出价格' }]}>
          <InputNumber style={{ width: '100%' }} min={0.0001} precision={4} placeholder="输入卖出价格" />
        </Form.Item>
      </Form>

      {fees && price > 0 && qty > 0 && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="卖出金额">{hidden ? '****' : formatMoney(amount)}</Descriptions.Item>
            <Descriptions.Item label="佣金 (万2.5)">{hidden ? '****' : fees.commission.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="印花税 (0.05%)">{hidden ? '****' : fees.stampDuty.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="过户费 (0.001%)">{hidden ? '****' : fees.transferFee.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="总手续费">
              <Text type="danger">{hidden ? '****' : fees.total.toFixed(2)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="净到账">{hidden ? '****' : formatMoney(netProceeds)}</Descriptions.Item>
            <Descriptions.Item label="卖出盈亏" span={2}>
              <span style={{ color: plColor(profitLoss), fontWeight: 700, fontSize: 16 }}>
                {hidden ? '****' : `${profitLoss >= 0 ? '+' : ''}${formatMoney(profitLoss)}`}
                {!hidden && <span style={{ fontSize: 12, marginLeft: 8, fontWeight: 400 }}>
                  ({costValue > 0 ? ((profitLoss / costValue) * 100).toFixed(2) : '0.00'}%)
                </span>}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </>
      )}
    </Modal>
  )
}
