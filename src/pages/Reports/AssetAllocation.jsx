import ReactECharts from 'echarts-for-react'
import { Typography } from 'antd'

const { Text } = Typography

export default function AssetAllocation({ allocation, totalAssets }) {
  if (!allocation || allocation.length === 0) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>暂无数据</div>
  }

  const colors = ['#52c41a', '#1677ff', '#722ed1', '#faad14', '#13c2c2', '#eb2f96']

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
    },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
      },
      data: allocation.map((a, i) => ({
        value: parseFloat(a.amount),
        name: a.category,
        itemStyle: { color: colors[i % colors.length] },
      })),
    }],
    graphic: [{
      type: 'text',
      left: 'center',
      top: '38%',
      style: {
        text: '总资产',
        textAlign: 'center',
        fill: '#999',
        fontSize: 12,
      },
    }, {
      type: 'text',
      left: 'center',
      top: '47%',
      style: {
        text: `¥${parseFloat(totalAssets).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        textAlign: 'center',
        fill: '#333',
        fontSize: 16,
        fontWeight: 'bold',
      },
    }],
  }

  return <ReactECharts option={option} style={{ height: 300 }} />
}
