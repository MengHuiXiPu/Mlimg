export function getBarOption (data, title, name) {
  const xAxisData = data.map(item => item.fileCategory)
  const seriesData = data.map(item => {
    return {
      ...item,
      value: item.num
    }
  })
  const option = {
    color: ['#1890FF'],
    title: {
      show: !!title,
      text: title
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const { name, value, seriesName, data: { percent } } = params
        const str = `${name}<br />${seriesName}: ${value} (${percent})`
        return percent ? str : `${name}<br />${seriesName}: ${value}`
      }
    },
    grid: {
      top: title ? 40 : 20,
      left: 20,
      right: 20,
      bottom: 10,
      containLabel: true
    },
    xAxis: [{
      type: 'category',
      data: xAxisData,
      axisTick: {
        alignWithLabel: true
      },
      axisLine: {
        show: true,
        lineStyle: {
          width: 1,
          color: '#E6E7EA'
        }
      },
      axisLabel: {
        color: '#09102F',
        // rotate: 45,
      }
    }],
    yAxis: {
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#E5E8EA',
          type: 'dashed',
        }
      },
      splitNumber: 2
    },
    series: [{
      name,
      type: 'bar',
      barWidth: 10,
      data: seriesData,
    }]
  }
  return option
}