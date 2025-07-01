<template>
  <div class="label-item">
    <div class="label-name">{{ labelName + ": " }}</div>
    <div class="bar">
      <div
        class="bar-fill"
        :style="{ width: (count / maxValue) * 100 + '%' }"
      >{{ count !== 0 ? count : '' }}</div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    count: {
      type: Number,
      default: 0,
    },
    maxValue: {
      type: Number,
      default: 0,
    },
    labelName: {
      type: String,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.label-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  .label-name {
    text-align: left;
    color: #000;
    width: 70px;
    padding-right: 8px;
    overflow: hidden;
    text-overflow: ellipsis; //文本溢出显示省略号
    white-space: nowrap; //文本不会换行
  }
  .bar {
    width: calc(100% - 70px);
    height: 16px;
    background-color: #f2f2f2;
    border-radius: 4px;
    overflow: hidden;
  }
  .bar-fill {
    color: white;
    height: 100%;
    background-color: #007bff;
    transition: width 0.3s ease;
  }
}
</style>