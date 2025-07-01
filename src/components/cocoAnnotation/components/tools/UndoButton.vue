<template>
  <div class="mb-8" @click="click" :style="iconStyle" v-tooltip.right="text">
    <svg-icon class="icon" type="undo" />
    <span class="text-desc">{{ $t("dataCenter.undo") }}</span>
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
      name: "undo",
      text: "ctrl + z",
    };
  },
  methods: {
    ...mapMutations(["undo"]),
    execute() {
      this.undo();
    },
  },
  computed: {
    undoList() {
      return this.$store.state.annotator.undo;
    },
    text() {
      let length = this.undoList.length;
      if (length == 0) {
        return this.$t("dataCenter.noUndo");
      }
      let last = this.undoList[length - 1];
      return `${this.$t("dataCenter.undo")} (${this.$t(
        "dataCenter.lastAction"
      )}: ${last.name} ${last.action})`;
    },
    iconStyle() {
      return {
        cursor: this.undoList.length === 0 ? "not-allowed" : "pointer",
        color: this.color.enabled,
      };
    },
  },
};
</script>
<style lang="scss" scoped>
.mb-8 {
  margin-bottom: 8px;
  cursor: pointer;
  font-size: 14px;
}
.icon {
  outline: none;
  cursor: pointer;
  font-size: 18px;
  position: relative;
  top: 2px;
}
.text-desc {
  margin-left: 8px;
  font-size: 9px;
}
</style>
