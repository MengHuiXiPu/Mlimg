export function getLineOption (legendData, xAxisData, seriesData, label) {
    const option = {
      color: ['#1890FF', '#24BCB0', '#FF8A87'],
      tooltip: {
        trigger: "axis",
        appendToBody: true,
        formatter: (params) => {
          var showHtm = label ? `${params[0].name}(${label})<br />` : `${params[0].name}<br />`
          for (let index = 0; index < params.length; index++) {
            const element = params[index]
            const { marker, value, seriesName } = element
            showHtm += `${marker}${seriesName}: ${value}<br />`
          }
          return showHtm
        }
      },
      legend: {
        data: legendData,
        bottom: 4,
        left: 'center'
      },
      grid: {
        top: 20,
        left: 20,
        right: 20,
        bottom: 30,
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
          rotate: 45,
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
        }
      },
      series: seriesData
    }
    return option
  }