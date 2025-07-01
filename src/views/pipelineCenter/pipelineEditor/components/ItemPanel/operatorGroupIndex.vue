<template>
  <div class="itempannel">
    <OperatorGroupItem />
  </div>
</template>

<script>
import OperatorGroupItem from "./operatorGroupItem.vue";
import eventBus from "../../utils/eventBus";
export default {
  components: { OperatorGroupItem },
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
      eventBus.$on("afterAddPageGroup", page => {
        this.page = page;
      });
    },
  },
  beforeDestroy() {
    eventBus.$off('afterAddPageGroup')
  }
};
</script>

<style scoped lang="less">
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
}
/* .itempannel ul {
  padding: 0px;
  padding-left: 16px;
} */
// .itempannel li {
//   color: rgba(0, 0, 0, 0.65);
//   border-radius: 4px;
//   width: 160px;
//   height: 28px;
//   line-height: 26px;
//   padding-left: 8px;
//   border: 1px solid rgba(0, 0, 0, 0);
//   list-style-type: none;
// }
// .itempannel li:hover {
//   background: white;
//   border: 1px solid #ced4d9;
//   cursor: move;
// }
</style>