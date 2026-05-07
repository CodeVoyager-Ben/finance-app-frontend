import { useEffect } from 'react'
import { Modal, Form, Input, Select, InputNumber } from 'antd'
import { CURRENCIES } from '../constants'

export default function AccountModal({ open, onCancel, onOk, assetTypes, fundAccounts, loading, initialValues }) {
  const [form] = Form.useForm()
  const isEdit = !!initialValues

  useEffect(() => {
    if (open && initialValues) {
      form.setFieldsValue(initialValues)
    }
  }, [open, initialValues, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onOk(values)
      form.resetFields()
    } catch {}
  }

  return (
    <Modal
      title={isEdit ? '编辑投资账户' : '新增投资账户'}
      open={open}
      onCancel={() => { form.resetFields(); onCancel() }}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="账户名称" rules={[{ required: true, message: '请输入账户名称' }]}>
          <Input placeholder="如：A股账户、美股账户" />
        </Form.Item>
        <Form.Item name="asset_type" label="资产类型" rules={[{ required: true, message: '请选择资产类型' }]}>
          <Select placeholder="选择资产类型">
            {assetTypes.filter(t => t.is_active).map(t => (
              <Select.Option key={t.id} value={t.id}>
                {t.icon} {t.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="fund_account" label="资金账户">
          <Select allowClear placeholder="可选，关联资金账户">
            {(fundAccounts || []).filter(a => a.is_active).map(a => (
              <Select.Option key={a.id} value={a.id}>
                {a.icon} {a.name} ({a.account_type})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="currency" label="币种" initialValue="CNY">
          <Select>
            {CURRENCIES.map(c => (
              <Select.Option key={c.value} value={c.value}>{c.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="broker" label="券商/平台">
          <Input placeholder="如：华泰证券" />
        </Form.Item>
        <Form.Item name="balance" label="初始余额" initialValue={0}>
          <InputNumber style={{ width: '100%' }} min={0} precision={2} />
        </Form.Item>
        <Form.Item name="initial_investment" label="初始投入金额" initialValue={0}>
          <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="记录历史总投入，用于计算真实收益率" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
