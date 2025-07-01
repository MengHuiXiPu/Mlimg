<template>
  <div><i v-tooltip.right="name" class="fa fa-x" :class="icon" :style="{ color: iconColor, fontSize: '22px' }" @click="click"></i><br></div>
</template>

<script>
import button from "../../mixins/toolBar/button";

import { mapMutations } from "vuex";

export default {
  name: "UndoButton",
  mixins: [button],
  data() {
    return {
      icon: "fa-undo",
      disabled: true
    };
  },
  methods: {
    ...mapMutations(["undo"]),
    execute() {
      this.undo();
    }
  },
  computed: {
    undoList() {
      return this.$store.state.annotator.undo;
    },
    name() {
      let length = this.undoList.length;
      if (length == 0) {
        return "Nothing to undo";
      }
      let last = this.undoList[length - 1];
      return "Undo (Last Action: " + last.name + " " + last.action + ")";
    }
  },
  watch: {
    undoList() {
      this.disabled = this.undoList.length === 0;
      this.iconColor = this.disabled ? this.color.disabled : this.color.enabled;
    }
  },
  created() {
    this.iconColor = this.color.disabled;
  }
};
</script>
