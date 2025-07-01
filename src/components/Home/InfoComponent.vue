<template>
  <div class="box">
    <div class="left">
      <img src="@/assets/svgs/info-pic_u42-0.svg" alt="svg">

    </div>
    <div class="right">
      <div class="text">{{ name }}</div>
      <div class="number">{{ number }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "InfoComponent",
  props: {
    name: {
      type: String,
      default: ""
    },
    number: {
      type: Number,
      default: ""
    },
    imageUrl: {
      type: String,
      default: ""
    },
  }
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
.box {
  display: flex;
  width: @homeAComponentWidth;
  height: @homeAComponentHeight;
  background-color: @homeAComponentBgc;
  .left {
    flex: 1;
    margin: auto;
    img {
      width: @homeAImageWidth;
      height: @homeAImageWidth;
    }
  }
  .right {
    flex: 2;
    .text {
      font-size: @homeATextFontSize;
      color: @homeATextColor;
    }
    .number {
      font-size: @homeANumberFontSize;
      color: @homeANumberColor;
    }
  }
}
</style>