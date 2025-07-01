<template>
  <div class="block-item-container">
    <h5 class="title">{{ title }}
      <!-- <a-popover placement="topRight" trigger="hover" v-if="description">
        <template slot="content">
          <p style="margin-bottom: 0;">{{ description }}</p>
        </template>
        <a-icon type="question-circle" class="table-question-icon" />
      </a-popover> -->
      <a-tooltip :title="description" v-if="description">
        <a-icon type="question-circle-o" style="vertical-align: 2px;" />
      </a-tooltip>
    </h5>
    <slot></slot>
  </div>
</template>

<script>
export default {
  data() {
    return {

    }
  },
  props: {
    title: {
      type: String,
      default: ""
    },
    description: {
      type: String,
      default: ""
    }
  },
}
</script>

<style lang="less" scoped>
.block-item-container {
  .title {
    color: #333333;
    font-weight: 700;
    font-size: 15px;
    margin: 15px 0;
  }
}
</style>