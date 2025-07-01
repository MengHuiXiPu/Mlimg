<template>
  <div ref="chart"/>
</template>
<script>
import * as echarts from "echarts-v5/core"
import debounce from "lodash/debounce";
// 引入图表，图表后缀都为 Chart
import {
  LineChart, // 线图
  BarChart,  // 饼图
  GaugeChart, // 仪表盘
} from 'echarts-v5/charts';
// 引入组件
import {
  TitleComponent, // 标题组件
  TooltipComponent, // 工具栏
  GridComponent, // 网格
  DatasetComponent, // 数据集
  TransformComponent, // 转换
  LegendComponent, // 图例
  DataZoomComponent, // 缩放组件
  ToolboxComponent, // 工具
  TimelineComponent, // 时间线工具
} from 'echarts-v5/components';
// 标签自动布局、全局过渡动画等特性
import {
  LabelLayout,
  UniversalTransition
} from 'echarts-v5/features';
// 引入渲染器，注意引入 CanvasRenderer 或者 SVGRenderer 是必须的一步
import {CanvasRenderer, SVGRenderer} from 'echarts-v5/renderers';


const METHOD_NAMES = [
  "getWidth",
  "getHeight",
  "getDom",
  "getOption",
  "resize",
  "dispatchAction",
  "convertToPixel",
  "convertFromPixel",
  "containPixel",
  "getDataURL",
  "getConnectedDataURL",
  "appendData",
  "clear",
  "isDisposed",
  "dispose"
];


echarts.use([
  LineChart,
  GaugeChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  TimelineComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
  SVGRenderer,
]);

export default {
  name: "VChart",
  // 全局主题控制
  inject: ["ecTheme"],
  props: {
    option: {
      type: Object,
      required: true
    },
    initOption: {
      type: Object,
      required: false
    },
    opts: {
      type: Object,
      default: {},
    },
    debounceWait: {
      type: Number,
      default: 300,
    },
    debounceOpts: {
      type: Object,
      default: {},
    },
    theme: String,
    loading: Boolean,
  },
  data() {
    return {
      chart: null,
    }
  },

  computed: {
    chartOption() {
      return this.option;
    },
    chartTheme() {
      return this.theme || this.ecTheme || "default";
    },
    chartInitOption() {
      return this.initOption;
    }
  },
  watch: {
    loading() {
      this.doLoad();
    }
  },
  created() {
    this.$watch("chartOption", debounce(() => {
      this.chart.setOption(this.chartOption, this.opts);
    }, this.debounceWait, this.debounceOpts), {
      deep: true,
    });
    this.$watch("chartTheme", debounce(() => {
      this.chart.dispose();
      this.createChart();
      this.doLoad();
    }, this.debounceWait, this.debounceOpts), {
      deep: true,
    });

    // 暴露echarts实例的方法
    METHOD_NAMES.forEach((name) => {
      this[name] = (...args) => {
        if (!this.chart) {
          throw new Error("ECharts is not initialized yet.");
        }
        return this.chart[name].apply(this.chart, args);
      }
    });
  },
  mounted() {
    this.createChart();
    this.doLoad();
  },
  destroyed() {
    this.chart.dispose();
  },
  methods: {
    doLoad(option) {
      if (this.chart) {
        if (this.loading) {
          this.chart.showLoading();
        } else {
          this.chart.hideLoading();
        }
      }
    },
    createChart() {
      this.chart = echarts.init(this.$refs.chart, this.chartTheme, this.chartInitOption);
      this.chart.setOption(this.chartOption, this.opts);
      this.$refs.chart.onresize = debounce(() => {
        this.chart.resize();
      }, 200);
    },
  },
}
</script>
<style scoped lang="less">
</style>