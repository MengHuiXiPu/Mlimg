<template>
  <div v-if="isMinimized" class="minimized-view" @click="openAddEditDialog">
    恢复新建数据集
  </div>
</template>

<script>
export default {
  props: {
    isMinimized: Boolean,
  },
  methods: {
    openAddEditDialog() {
      // 在这里可以触发恢复a-modal框的逻辑
      this.$emit('openAddEdit');
    },
  },
};
</script>

<style scoped>
.minimized-view {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background-color: #1890ff;
  color: #fff;
  padding: 5px;
  cursor: pointer;
}
</style>
