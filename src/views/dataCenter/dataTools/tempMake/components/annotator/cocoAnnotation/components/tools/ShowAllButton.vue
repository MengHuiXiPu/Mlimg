<template>
  <div class="mb-8"><i v-tooltip.right="text" class="fa fa-x" :class="icon" :style="{ color: iconColor, fontSize: '22px' }" @click="click"></i><br></div>
</template>

<script>
import button from "../../mixins/toolBar/button";

export default {
  name: "ShowAllButton",
  mixins: [button],
  data() {
    return {
      name: "Show All",
      text: this.$t("dataCenter.showAll"),
      icon: "fa-eye"
    };
  },
  methods: {
    execute() {
      this.$parent.showAll();
    }
  }
};
</script>

<style scoped>
.mb-8 {
  margin-bottom: 8px;
}
</style>