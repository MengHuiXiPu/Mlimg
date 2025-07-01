<template>
  <div class="mb-8" :style="iconStyle" v-tooltip.right="text">
    <svg-icon class="icon" type="Redo" />
    <span class="text-desc">{{ $t("dataCenter.redo") }}</span>
  </div>
</template>

<script>
import button from "../../mixins/toolBar/button";

import { mapMutations } from "vuex";

export default {
  name: "UndoButton",
  mixins: [button],
  data() {
    return {
      name: "redo",
      text: "ctrl + shift + z",
    };
  },
  methods: {
    ...mapMutations(["redo"]),
    execute() {
      this.redo();
    },
  },
  computed: {
    redoList() {
      return this.$store.state.annotator.redo;
    },
    iconStyle() {
      return {
        cursor: this.redoList.length === 0 ? "not-allowed" : "not-allowed",
        color: this.color.enabled,
      };
    },
  },
};
</script>
<style scoped>
.mb-8 {
  margin-bottom: 8px;
  cursor: pointer;
}
.icon {
  outline: none;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s ease;
  position: relative;
  top: 3px;
}
.text-desc {
  margin-left: 8px;
  font-size: 9px;
}
</style>
