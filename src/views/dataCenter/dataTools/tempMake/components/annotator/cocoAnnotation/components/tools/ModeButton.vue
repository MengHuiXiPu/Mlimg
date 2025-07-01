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
  name: "ModeButton",
  mixins: [button],
  model: {
    prop: "mode",
    event: "update",
  },
  props: {
    mode: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      name: "Mode: " + this.mode,
    };
  },
  watch: {
    mode() {
      this.name = "Mode: " + this.mode;
    },
  },
  computed: {
    icon() {
      if (this.mode == "segment") return "fa-pencil-square-o";
      if (this.mode == "label") return "fa-tags";
      return "";
    },
  },
  methods: {
    next() {
      if (this.mode == "segment") return "label";
      return "segment";
    },
    execute() {
      this.$emit("update", this.next());
    },
  },
};
</script>

<style scoped>
.mb-8 {
  margin-bottom: 8px;
}
</style>