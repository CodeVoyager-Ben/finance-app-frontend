import { Row, Col } from 'antd'
import ReactECharts from 'echarts-for-react'

export default function AssetAllocationChart({ byAssetType, totalMarketValue }) {
  if (!byAssetType || byAssetType.length === 0) return null

  const total = Number(totalMarketValue || 0)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (p) => `${p.name}<br/>市值: ${Number(p.value).toFixed(2)}<br/>占比: ${p.percent.toFixed(1)}%`,
    },
    series: [{
      type: 'pie',
      radius: ['50%', '80%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
      data: byAssetType.map(t => ({
        name: t.asset_type_name,
        value: Number(t.market_value).toFixed(2),
        itemStyle: { color: t.asset_type_color },
      })),
    }],
    graphic: [{
      type: 'text',
      left: 'center',
      top: '40%',
      style: { text: total.toFixed(2), fontSize: 14, fontWeight: 'bold', textAlign: 'center', fill: '#333' },
    }, {
      type: 'text',
      left: 'center',
      top: '52%',
      style: { text: '总市值', fontSize: 11, textAlign: 'center', fill: '#999' },
    }],
  }

  return (
    <Row align="middle" style={{ minHeight: 200 }}>
      <Col flex="200px">
        <ReactECharts option={option} style={{ height: 200 }} />
      </Col>
      <Col flex="auto" style={{ paddingLeft: 8 }}>
        {byAssetType.map((t) => (
          <div key={t.asset_type_name} style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <span style={{
              width: 12, height: 12, borderRadius: 3, marginRight: 8, flexShrink: 0,
              background: t.asset_type_color || '#1677ff',
            }} />
            <span style={{ flex: 1, fontSize: 13 }}>{t.asset_type_name}</span>
            <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 12 }}>
              {Number(t.weight_pct).toFixed(1)}%
            </span>
          </div>
        ))}
      </Col>
    </Row>
  )
}
