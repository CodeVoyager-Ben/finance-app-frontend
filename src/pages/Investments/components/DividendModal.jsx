import { Modal, Form, Select, InputNumber, DatePicker, Input } from 'antd'
import dayjs from 'dayjs'

export default function DividendModal({ open, onCancel, onOk, accounts, holdings, loading }) {
  const [form] = Form.useForm()
  const selectedAccount = Form.useWatch('investment_account', form)
  const selectedHolding = Form.useWatch('holding', form)
  const dividendType = Form.useWatch('dividend_type', form)
  const perUnit = Form.useWatch('dividend_per_unit', form)
  const qty = Form.useWatch('quantity', form)
  const tax = Form.useWatch('tax', form)

  const filteredHoldings = selectedAccount
    ? holdings.filter(h => h.investment_account === selectedAccount)
    : holdings

  const handleHoldingSelect = (holdingId) => {
    const h = holdings.find(x => x.id === holdingId)
    if (h) {
      form.setFieldsValue({ symbol: h.symbol, name: h.name, quantity: h.quantity })
    }
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      if (values.ex_date) values.ex_date = values.ex_date.format('YYYY-MM-DD')
      if (values.pay_date) values.pay_date = values.pay_date.format('YYYY-MM-DD')
      onOk(values)
      form.resetFields()
    } catch {}
  }

  return (
    <Modal
      title="记录分红/利息"
      open={open}
      onCancel={() => { form.resetFields(); onCancel() }}
      onOk={handleOk}
      confirmLoading={loading}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical"
        initialValues={{ dividend_type: 'cash', ex_date: dayjs(), tax: 0 }}
      >
        <Form.Item name="investment_account" label="投资账户" rules={[{ required: true }]}>
          <Select placeholder="选择账户" onChange={() => form.setFieldsValue({ holding: null })}>
            {accounts.map(a => (
              <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="holding" label="关联持仓" rules={[{ required: true }]}>
          <Select placeholder="选择持仓" onChange={handleHoldingSelect}>
            {filteredHoldings.map(h => (
              <Select.Option key={h.id} value={h.id}>{h.symbol} - {h.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="symbol" label="代码" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="name" label="名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="dividend_type" label="分红方式" rules={[{ required: true }]}>
          <Select>
            <Select.Option value="cash">现金分红</Select.Option>
            <Select.Option value="reinvest">分红再投资</Select.Option>
            <Select.Option value="interest">利息收入</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="ex_date" label="除权除息日" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="pay_date" label="发放日">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="dividend_per_unit" label="每单位分红" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} precision={4} />
        </Form.Item>
        <Form.Item name="quantity" label="持有数量" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} precision={4} />
        </Form.Item>
        <Form.Item name="total_amount" label="总金额"
          extra={perUnit && qty ? `自动: ${(Number(perUnit) * Number(qty)).toFixed(2)}` : null}
        >
          <InputNumber style={{ width: '100%' }} min={0} precision={2} />
        </Form.Item>
        <Form.Item name="tax" label="扣税">
          <InputNumber style={{ width: '100%' }} min={0} precision={2} />
        </Form.Item>
        <Form.Item name="net_amount" label="税后净额">
          <InputNumber style={{ width: '100%' }} min={0} precision={2} />
        </Form.Item>
        <Form.Item name="note" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
