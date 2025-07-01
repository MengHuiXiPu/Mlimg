<template>
  <div class="mb-8">
    <i
      v-tooltip.right="name"
      class="fa fa-x"
      :class="icon"
      :style="{ color: iconColor, fontSize: '22px' }"
      @click="click"
    ></i
    ><br />
  </div>
</template>

<script>
import button from "../../mixins/toolBar/button";

export default {
  name: "SaveButton",
  mixins: [button],
  data() {
    return {
      name: "Save",
      icon: "fa-save",
    };
  },
  computed: {
    disabled() {
      return this.$parent.current.annotation === -1;
    },
  },
  watch: {
    disabled(val) {
      this.iconColor = val ? this.color.disabled : this.color.enabled;
    },
  },
  methods: {
    execute() {
      this.$parent.save();
    },
  },
};
</script>

<style scoped>
.mb-8 {
  margin-bottom: 8px;
}
</style>
