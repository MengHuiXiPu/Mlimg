<template>
  <div class="mb-8"><i v-tooltip.right="text" class="fa fa-x" :class="icon" :style="{ color: iconColor, fontSize: '22px' }" @click="click"></i><br></div>
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
      icon: "fa-eye-slash"
    };
  },
  methods: {
    execute() {
      this.$parent.hideAll();
    }
  }
};
</script>

<style scoped>
.mb-8 {
  margin-bottom: 8px;
}
</style>
