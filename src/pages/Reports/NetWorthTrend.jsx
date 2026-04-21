import ReactECharts from 'echarts-for-react'

export default function NetWorthTrend({ history }) {
  if (!history || history.length === 0) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>暂无数据</div>
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let s = `${params[0].axisValue}<br/>`
        params.forEach(p => {
          s += `${p.marker} ${p.seriesName}: ¥${parseFloat(p.value).toFixed(0)}<br/>`
        })
        return s
      },
    },
    legend: { data: ['资产', '负债', '净资产'], bottom: 0 },
    grid: { left: '3%', right: '4%', top: '8%', bottom: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: history.map(m => m.month),
      axisLabel: { formatter: v => v.substring(5) },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: v => v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v },
    },
    series: [
      {
        name: '资产', type: 'line', smooth: true,
        data: history.map(m => m.assets),
        areaStyle: { color: 'rgba(82,196,26,0.1)' },
        lineStyle: { color: '#52c41a', width: 2 },
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '负债', type: 'line', smooth: true,
        data: history.map(m => m.liabilities),
        areaStyle: { color: 'rgba(255,77,79,0.1)' },
        lineStyle: { color: '#ff4d4f', width: 2 },
        itemStyle: { color: '#ff4d4f' },
      },
      {
        name: '净资产', type: 'line', smooth: true,
        data: history.map(m => m.net_worth),
        lineStyle: { color: '#1677ff', width: 3 },
        itemStyle: { color: '#1677ff' },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: 300 }} />
}
