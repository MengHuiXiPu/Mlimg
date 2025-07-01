<template>
  <div class="mb-8 tool-btn-wrap" :style="{ color: iconColor }">
    <div @click="confirmDeleteAnnotation('cur')" class="tool-del-curr">
      <svg-icon class="icon" type="clear" />
      <span class="text-desc">{{ $t("dataCenter.delCurrentAnnotation") }}</span>
    </div>
    <div
      @click="confirmDeleteAnnotation('all')"
      class="tool-del-all"
      v-if="!$parent.noDatasetMode && isShowDelAllAnnotation"
    >
      <a-icon type="close-square" class="icon" />
      <span class="text-desc">{{ $t("dataCenter.delAllAnnotation") }}</span>
    </div>
  </div>
</template>

<script>
import button from "../../mixins/toolBar/button";
import {getSingleDataListDetailById} from "@/api/dataCenter";
export default {
  mixins: [button],
  data() {
    return {
      isShowDelAllAnnotation: false
    }
  },
  methods: {
    confirmDeleteAnnotation(flag) {
      this.$confirm({
        zIndex: 10000,
        content:
          flag === "cur"
            ? this.$t("dataCenter.annotationDelAsk")
            : this.$t("dataCenter.annotationAllDelAsk"),
        onOk: async () => {
          await this.deleteAnnotation(flag);
        },
        onCancel() {},
      });
    },
    async deleteAnnotation(flag) {
      if(this.$parent.noDatasetMode) {    //非数据集标注模式，直接emit
        this.$emit('handleDelete', flag)
        return
      }
      const datasetDetail = await getSingleDataListDetailById(
          this.$parent.dataset.id
      );
      if (datasetDetail.data.autoMarkTaskStatus === 1) {
        return this.$message.warning('还有未完成的标注任务，请停止标注任务再删除！')
      }
      if(flag==='all') {
        const annotatorIns = this.$parent
        if(annotatorIns.activeTool === "Brush") { //需要将"Brush"的isModalOpen置为true，避免滑动影响
          annotatorIns.$refs.brush.isModalOpen = true
        }
        this.$confirmEle('此操作将删除数据集下所有标注信息, 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$emit('handleDelete', flag)
          if(annotatorIns.activeTool === "Brush") { //需要将"Brush"的isModalOpen恢复为false
            annotatorIns.$refs.brush.isModalOpen = false
          }
        }).catch(() => {
          if(annotatorIns.activeTool === "Brush") { //需要将"Brush"的isModalOpen恢复为false
            annotatorIns.$refs.brush.isModalOpen = false
          }
        });
      }else {
        this.$emit('handleDelete', flag)
      }
    }
  },
}
</script>

<style lang="less" scoped>
.tool-btn-wrap {
  i {
    cursor: pointer;
  }
}
.mb-8 {
  margin-bottom: 8px;
}
.text-desc {
  margin-left: 8px;
  font-size: 9px;
}
.tool-del-curr {
  cursor: pointer;
  display: flex;
  align-items: center;
}
.icon {
  font-size: 20px;
}
.tool-del-all {
  margin-top: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
}
</style>