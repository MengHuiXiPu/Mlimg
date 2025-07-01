import debounce from 'lodash/debounce';
export default {
  data() {
    return {
      
    }
  },
  methods: {
    /**
     * @description: 重置画布尺寸
     * width height的计算参考的之前的（operatorGroupPage.vue里初始化graph尺寸）代码
     */
    resetGraphSize: debounce(function(){
      const h = document.documentElement.clientHeight - 101
      const w = document.documentElement.clientWidth - 550
      this.graph.changeSize(w, h);
    }, 500),
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resetGraphSize);
  },
  mounted () {
    window.addEventListener('resize', this.resetGraphSize);
  },
}