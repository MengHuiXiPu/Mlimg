<template>
  <div class="mb-8" :style="{ color: iconColor }" @click="click">
    <i class="fa fa-x icon" :class="icon"></i>
    <span class="text-desc">{{ text }}</span>
  </div>
</template>

<script>
import button from "../../mixins/toolBar/button";

export default {
  name: "HideAllButton",
  mixins: [button],
  data() {
    return {
      name: "Hide All",
      text: this.$t("dataCenter.hideAll"),
      icon: "fa-eye-slash",
    };
  },
  methods: {
    execute() {
      this.$parent.hideAll();
    },
  },
};
</script>

<style scoped>
.mb-8 {
  margin-bottom: 8px;
  cursor: pointer;
}
.text-desc {
  margin-left: 8px;
  font-size: 9px;
}
.icon {
  font-size: 20px;
  position: relative;
  top: 3px;
}
</style>
