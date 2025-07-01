<template>
   <div class="echart" :style="style" ref="echartRef" />
</template>
<script>
import { mixin } from "@/utils/mixin"
import echarts from 'echarts'
export default {
  name: "Echart",
  mixins: [mixin],
  props: {//���ܸ��������������
    option: {
      type: Object,
      default: () => {
        return {}
      }
    },
    styleObj: {
      type: Object, 
      default: () => {
        return {}
      }
    },
  },
  data () {
    return {
      myChart: null,
    }
  },
  computed: {
    style () {
      return { ...this.styleObj }
    }
  },
  mounted () {
    setTimeout(() => {
      this.drawEchart()
    }, 325)//ȷ�����ڹ��ص�dom��Ⱦ���
  },
  methods: {
      drawEchart() {
          const that = this;
          //console.log(this.$refs.echartRef);
          if(!echarts) {
            echarts = require('echarts');
          }
          // console.log("echarts: ", echarts);
          that.myChart = echarts.init(this.$refs.echartRef);//����׼���õ�domԪ�أ���ʼ��echartsʵ��
          // that.myChart.clear(that.option)
          that.myChart.setOption(that.option);//ָ��ͼ���������������
          that.myChart.off('click');//�������click�¼��������ظ���
          that.myChart.on('click', (param) => {//ʹ��on��������click�¼�������ͼ��ʱ���������ø��������
              that.$emit('click', param)
          })
          window.addEventListener("resize", this.resize, false);//����resize�¼�������
      },
      resize() {
        this.myChart && this.myChart.resize()//ͼ������Ӧ���ڴ�С
      }
  },
  beforeRouteLeave (to, from, next) {
    window.removeEventListener("resize", this.resize, false)
    next()
  },
  watch: {
    option (val) {
      this.drawEchart()
      this.resize()
    },
    sidebarOpened (val) {
      setTimeout(() => {//����
        this.myChart && this.myChart.resize()
      }, 300)
    }
  }
}
</script>

<style lang='less' scoped>
.echart {
  width: 100%;
  min-width: 100%;
  height: 100%;
}
</style>
