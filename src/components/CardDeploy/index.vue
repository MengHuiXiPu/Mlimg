<template>
  <div :class="{'deploy': true, 'disabled': !cardInfo.isAvailable}" @click="handleClick" :disabled="!cardInfo.isAvailable">
    <div class="left">
      <img :src="cardInfo.logoImg" alt="">
    </div>
    <div class="right">
      <h2>{{ cardInfo.cardName }}</h2>
    </div>
    <p v-if="!cardInfo.isAvailable">Unavailable</p>
  </div>
</template>

<script>
export default {
  name: "CardDeploy",
  props: {
    cardInfo: {
      type: Object,
      default: {}
    }
  },
  methods: {
    handleClick() {
      if(this.cardInfo.isAvailable) {
        this.$emit('change', this.cardInfo.cardName);
      }
    }
  }
}
</script>

<style>
/* @media (min-width: 1600px) {
  .card-style>.card {
    width: 32% !important;
  }
  .deploy {

  }
} */
</style>

<style lang="less" scoped>
@import "~@/config/theme.less";
.deploy {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border: 2px solid transparent;
  height: 150px;
  border-radius: @borderRadiusBig;
  background: #fff;
  padding: 8px;
  cursor: pointer;
  position: relative;
  &.disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
  p {
    position: absolute;
    right: 8px;
    bottom: 8px;
    margin: 0;
  }
  .left {
    flex: 1;
    img {
      width: 50%;
    }
  }
  .right {
    flex: 1;
  }
}
</style>