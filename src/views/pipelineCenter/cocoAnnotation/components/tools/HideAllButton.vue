<template>
  <div><i v-tooltip.right="name" class="fa fa-x" :class="icon" :style="{ color: iconColor, fontSize: '22px' }" @click="click"></i><br></div>
</template>

<script>
import button from "../../mixins/toolBar/button";

export default {
  name: "HideAllButton",
  mixins: [button],
  data() {
    return {
      name: "Hide All",
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
