<template>
  <div><i v-tooltip.right="name" class="fa fa-x" :class="icon" :style="{ color: iconColor, fontSize: '22px' }" @click="click"></i><br></div>
</template>

<script>
import button from "../../mixins/toolBar/button";
import axios from "axios";

export default {
  name: "DeleteButton",
  mixins: [button],
  props: {
    image: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      name: "Delete Image",
      icon: "fa-trash-o"
    };
  },
  methods: {
    execute() {
      axios.delete("/api/image/" + this.image.id).then(() => {});
    }
  }
};
</script>
