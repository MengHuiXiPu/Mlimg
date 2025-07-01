<template>
  <div class="frame-container">
    <a-spin :spinning="loading" indicator="<a-icon type='loading' style='font-size: 32px' spin />" style="position:absolute;top: 50%;left: 50%;"></a-spin>
    <iframe
      ref="refIframe"
      :src="src"
      width="100%"
      height="100%"
      frameborder="0"
      v-bind="$attrs"
    />
  </div>
</template>

<script>
export default {
  name: 'frame-container',
  data() {
    return {
      loading: false
    }
  },
  props: {
    src: {
      type: String,
      required: true,
      default: ''
    }
  },
  async mounted() {
    this.upwatch = this.$watch('src',(val) => {
      if(!val) return
      this.loading = true
      this.$nextTick(() => {
        this.$refs.refIframe.onload = () => {
          this.loading = false
        }
        this.$refs.refIframe.onerror = () => {
          this.loading = false
        }
      })
    }, {
        immediate: true
      })
  },
  // 外部组件缓存状态时,iframe不会被缓存，切换回来时会重新load frame
  activated() {
    this.loading = true
  }
}
</script>

<style lang="less" scoped>
.frame-container {
  // position: absolute;
  // top: 0px;
  // left: 0px;
  height: 100%;
  width: 100%;
  .spin-content {
    border: 1px solid #91d5ff;
    background-color: #e6f7ff;
    padding: 30px;
  }
}
</style>