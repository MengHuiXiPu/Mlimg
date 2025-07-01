<template>
  <div class="mb-8">
    <i
      v-tooltip.right="text"
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
import { getPicture } from "@/api/modelManage";
import { mapMutations } from "vuex";

export default {
  name: "SaveButton",
  mixins: [button],
  inject: ["modalInstance"],
  data() {
    return {
      name: "Save",
      text: this.$t('dataCenter.save'),
      icon: "fa-save",
    };
  },
  methods: {
    // ...mapMutations(["cancelLoadingItem"]),

    execute() {
      this.$parent.save(async (id) => {
        const res = await getPicture(id, "thumbnail_with_bbox");
        const url = window.URL.createObjectURL(res);
        this.modalInstance.pictureLoadList.forEach((ele) => {
          if (ele.id === id) {
            ele.url = url;
            this.$set(this.modalInstance.pictureLoadMap, id, url);
            // this.cancelLoadingItem(id);
          }
        });
        this.$message.success('保存成功')
      });
    },
  },
};
</script>

<style scoped>
.mb-8 {
  margin-bottom: 8px;
}
</style>
