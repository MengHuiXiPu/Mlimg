<template>
  <a-empty :image="simpleImage" class="empty-style"/>
</template>
<script>
import { Empty } from 'ant-design-vue'
export default {
  name: "NoData",
  components: {},
  data () {
    return {}
  },
   beforeCreate () {
    this.simpleImage = Empty.PRESENTED_IMAGE_SIMPLE
  },
  computed: {

  },
  methods: {

  },
  mounted () {

  }
}
</script>
<style lang="less" scoped>
.empty-style{
    position: relative;
    top: 50%;
    transform: translateY(-50%);
    margin: 0 !important;
}
</style>