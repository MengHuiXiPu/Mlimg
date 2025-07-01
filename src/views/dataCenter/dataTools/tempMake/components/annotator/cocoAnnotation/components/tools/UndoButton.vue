<template>
  <div class="mb-8">
    <i
      v-tooltip.right="text"
      class="fa fa-x"
      :class="icon"
      :style="iconStyle"
      @click="click"
    ></i
    ><br />
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
      name: 'undo',
      icon: "fa-undo",
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
        color:
          this.undoList.length === 0 ? this.color.disabled : this.color.enabled,
        fontSize: "22px",
      };
    },
  },
};
</script>
<style scoped>
.mb-8 {
  margin-bottom: 8px;
}
</style>
