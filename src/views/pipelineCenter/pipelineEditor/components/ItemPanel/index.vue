<template>
  <div class="itempannel scrollbar">
    <Item />
  </div>
</template>

<script>
import Item from "./item.vue";
import eventBus from "../../utils/eventBus";
export default {
  components: { Item },
  data() {
    return {
      page: null,
      command:null
    };
  },
  created() {
    this.bindEvent();
  },
  methods: {
    bindEvent() {
      eventBus.$on("afterAddPage", page => {
        this.page = page;
      });
    },
  },
  beforeDestroy() {
    eventBus.$off('afterAddPageGroup')
  }
};
</script>

<style scoped>
.itempannel {
  height: 100%;
  position: absolute;
  left: 0px;
  z-index: 2;
  background: transparent;
  width: 250px;
  /* padding-top: 8px; */
  border-right: 1px solid #e6e9ed;
  overflow-y: auto;
  padding-bottom: 20px;
}
</style>