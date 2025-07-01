<template>
  <div class="mb-8"><i v-tooltip.right="text" class="fa fa-x" :class="icon" :style="{ color: iconColor, fontSize: '22px' }" @click="click"></i><br></div>
</template>

<script>
import button from "../../mixins/toolBar/button";

export default {
  name: "CenterButton",
  mixins: [button],
  data() {
    return {
      name: "Center Image",
      text: this.$t("dataCenter.centerButton"),
      icon: "fa-align-center"
    };
  },
  methods: {
    execute() {
      this.$parent.fit();
    }
  }
};
</script>

<style scoped>
.mb-8 {
  margin-bottom: 8px;
}
</style>