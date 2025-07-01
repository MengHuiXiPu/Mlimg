<template>
  <div class="mb-8" @click="click">
    <svg-icon class="icon" :style="iconColor" type="center" />
    <span class="text-desc">{{ $t("dataCenter.centerButton") }}</span>
  </div>
</template>

<script>
import button from "../../mixins/toolBar/button";

export default {
  name: "CenterButton",
  mixins: [button],
  methods: {
    execute() {
      this.$parent.fit();
    },
  },
};
</script>

<style lang="scss" scoped>
.mb-8 {
  margin-bottom: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
}
.icon {
  outline: none;
  font-size: 18px;
  position: relative;
  top: 1px;
}
.text-desc {
  margin-left: 8px;
  font-size: 9px;
}
</style>
