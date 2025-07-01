/**
 * Echarts Options
 * - Service Success Rate
 * - Service CPM
 * - Service Percentile
 */
export const baseOption = {
    title: {
        left: "center",
        show: true,
        textStyle: {
            fontSize: 15
        }
    },
    legend: {
        type: 'scroll', // 图例类型，支持 'plain' 和 'scroll'
        orient: 'horizontal', // 图例的布局朝向，'horizontal' 或 'vertical'
        left: '10', // 图例的位置，可以是 'top', 'bottom', 'left', 'right' 或者具体的像素值
        top: "6%",
        selectedMode: 'multiple', // 图例选择模式，'single', 'multiple' 或者 false
        formatter: function () {
            // 返回自定义的图例文本格式
            return "";
        },
        tooltip: {
            show: true, // 是否显示图例的提示框
        }
    },
    grid: {
        top: "85"
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            animation: true,
            type: "cross",
        }
    },
    xAxis: {
        type: 'time',
        splitNumber: 4,
        splitLine: {
            show: true
        }
    },
    yAxis: {
        type: 'value',
        splitLine: {
            show: true
        }
    },
    dataZoom: [
        {
            type: 'inside',
            minValueSpan: 60 * 12 * 1000,
        },
    ],
};


export const requestMetricsOption = {
    title: {
        text: '请求指标',
        itemStyle: {
            fontSize: '2em'
        },
        left: 'center'
    },
    xAxis: {
        type: 'time',
    },
    legend: {
        type: 'scroll',
        left: "10%",
        top: "6%",
    },
    grid: {
        top: "85",
    },
    tooltip: {},
    dataZoom: [
        {
            type: 'slider'
        }
    ],
    yAxis: [
        {
            name: 'Percentage (%)',
            axisLabel: {
                formatter: function (value) {
                    return value;
                }
            },
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#333', // 轴线颜色
                },
                symbol: ['none', 'arrow'],
                symbolSize: [10, 15]
            },
        },
        {
            name: 'Response Time (ms)',
            axisLabel: {
                formatter: function (value) {
                    return value;
                }
            },
            axisLine: {
                show: true,
                symbol: ['none', 'arrow'], // 在轴的末端显示箭头
                lineStyle: {
                    color: '#333', // 轴线颜色
                },
                symbolSize: [10, 15] // 箭头的大小
            }
        }
    ],
    series: [],
};

export const requestQPSOption = {
    title: {
        text: 'QPS',
        itemStyle: {
            fontSize: '2em'
        },
        left: 'center',
    },
    xAxis: {
        type: 'time',
    },
    legend: {
        type: 'scroll',
        left: "10%",
        top: "6%",
    },
    grid: {
        top: "85",
    },
    tooltip: {},
    dataZoom: [
        {
            type: 'slider'
        }
    ],
    yAxis: [
        {
            name: 'CPM (call/min)',
            axisLabel: {
                formatter: function (value) {
                    return value;
                }
            },
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#333', // 轴线颜色
                },
                symbol: ['none', 'arrow'],
                symbolSize: [10, 15]
            },
        },
    ],
    series: [],
};
