export function getRingOption (num = 0, title) {
  const fontColor = "#09102F"
  const noramlSize = 16
  const datas = {
    value: (num * 100).toFixed(0),
    company: "%",
    ringColor: [{
      offset: 0,
      color: '#2F54EB' // 0% 处的颜色
    }, {
      offset: 1,
      color: '#2F54EB' // 100% 处的颜色
    }]
  }
  const option = {
    title: {
      // text: datas.value + datas.company,
      x: 'center',
      y: 'center',
      textStyle: {
        fontWeight: 'normal',
        color: fontColor,
        fontSize: noramlSize
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}%'
    },
    color: ['#E6E7EA'],
    legend: {
      show: false,
    },
    series: [{
      name: title,
      type: 'pie',
      // clockWise: true,
      radius: ['50%', '65%'],
      center: ['50%', '50%'],
      itemStyle: {
        normal: {
          borderColor: '#fff',
          borderWidth: 2,
          label: {
            show: false
          },
          labelLine: {
            show: false
          }
        }
      },
      // hoverAnimation: false,
      data: [
        {
          value: datas.value,
          name: '已使用',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: datas.ringColor
            },
          }
        },
        {
          name: '未使用',
          value: 100 - datas.value,
          emphasis: {
            itemStyle: {
              color: '#E6E7EA',
            }
          }
        }
      ]
    }]
  }
  return option
}