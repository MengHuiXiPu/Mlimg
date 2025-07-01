<template>
    <div class="ant-page-header-heading">
        <span class="ant-page-header-heading-title">{{ pageTitle || title }}</span>
    </div>
</template>

<script>
export default {
  props: {
      pageTitle: {
        type: String,
        default: '',
      },
  },
  data () {
    return {
      path: '',
      title: ''
    }
  },
  created () {
    this.getPageTitle()
  },
  methods: {
    getPageTitle () {
      this.path = this.$route.path
      this.title = this.$route.meta.title
    }
  },
  watch: {
    $route () {
      this.getPageTitle()
    }
  }
}
</script>

<style scoped lang='less'>
.ant-page-header-heading{
    height: 42px;
    padding-top: 16px;
    margin-left: 20px;
    // margin-top: 18px;
}
.ant-page-header-heading-title{
    font-size: 16px;
    line-height: 22px;
    font-family: '微软雅黑', sans-serif;
    // font-weight:500;
    // color:#09102F;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 600;
}
</style>
