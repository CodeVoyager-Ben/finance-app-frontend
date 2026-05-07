import { Button, Tooltip } from 'antd'
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import usePrivacyStore from '../store/privacyStore'

export default function PrivacyToggle({ pageKey }) {
  const hiddenPages = usePrivacyStore((s) => s.hiddenPages)
  const toggle = usePrivacyStore((s) => s.toggle)
  const hidden = !!hiddenPages[pageKey]

  return (
    <Tooltip title={hidden ? '显示金额' : '隐藏金额'}>
      <Button
        type="text"
        icon={hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        onClick={() => toggle(pageKey)}
        style={{ fontSize: 18, color: hidden ? '#faad14' : undefined }}
      />
    </Tooltip>
  )
}
