<template>
  <svg
    class="svg-icon"
    aria-hidden="true"
    v-on="$listeners"
  >
    <use :href="`#icon-${type}`"/>
  </svg>
</template>

<script>
// doc: https://panjiachen.github.io/vue-element-admin-site/feature/component/svg-icon.html#usage
// 用法： <svg-icon type="admin"/>

export default {
  name: 'SvgIcon',
  props: {
    type: {
      type: String,
      required: false
    },
  }
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
.svg-icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  //fill: @menuColor;
  //color: @menuColor;
  //stroke: @menuColor;
  // margin-right:10px;
  overflow: hidden;
}

.svg-external-icon {
  background-color: currentColor;
  mask-size: cover!important;
  display: inline-block;
}
//path {
//  fill: inherit !important;
//}
</style>
