import ReactECharts from 'echarts-for-react'

export default function AssetAllocationChart({ byAssetType, totalMarketValue }) {
  if (!byAssetType || byAssetType.length === 0) return null

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (p) => `${p.name}<br/>市值: ${Number(p.value).toFixed(2)}<br/>占比: ${p.percent.toFixed(1)}%`,
    },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
      },
      data: byAssetType.map(t => ({
        name: t.asset_type_name,
        value: Number(t.market_value).toFixed(2),
        itemStyle: { color: t.asset_type_color },
      })),
    }],
    graphic: [{
      type: 'text',
      left: '35%',
      top: '45%',
      style: {
        text: `${(Number(totalMarketValue) / 10000).toFixed(1)}万`,
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        fill: '#333',
      },
    }],
  }

  return <ReactECharts option={option} style={{ height: 300 }} />
}
