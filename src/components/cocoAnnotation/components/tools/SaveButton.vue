<template>
  <div class="mb-8" :style="{ color: iconColor }" @click="click">
    <i class="fa fa-x common-icon" :class="icon"></i>
    <span class="text-desc">(S){{ text }}</span>
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
      text: this.$t("dataCenter.save"),
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
        this.$parent.getData();
        this.$message.success("保存成功");
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.mb-8 {
  margin-bottom: 8px;
  cursor: pointer;
}
.text-desc {
  margin-left: 8px;
  font-size: 9px;
}
.common-icon {
  font-size: 20px;
  position: relative;
  top: 3px;
}
</style>
