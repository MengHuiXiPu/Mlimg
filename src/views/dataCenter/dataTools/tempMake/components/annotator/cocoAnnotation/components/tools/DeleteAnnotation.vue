<template>
  <div class="mb-8 tool-btn-wrap">
    <a-icon
      type="minus-square"
      v-tooltip.right="$t('dataCenter.delCurrentAnnotation')"
      @click="deleteAnnotation('cur')"
      :style="{ color: iconColor, fontSize: '22px', marginBottom: '8px' }"
    />
    <!-- <br /> -->
    <!-- <a-icon
      v-if="!$parent.noDatasetMode"
      type="close-square"
      v-tooltip.right="$t('dataCenter.delAllAnnotation')"
      @click="deleteAnnotation('all')"
      :style="{ color: iconColor, fontSize: '22px', marginBottom: '8px' }"
    /> -->
  </div>
</template>

<script>
import button from "../../mixins/toolBar/button";
import { getSingleDataListDetailById } from "@/api/dataCenter";
export default {
  mixins: [button],
  methods: {
    async deleteAnnotation(flag) {
      if (this.$parent.noDatasetMode) {    //非数据集标注模式，直接emit
        this.$emit('handleDelete', flag)
        return
      }
      const datasetDetail = await getSingleDataListDetailById(
        this.$parent.dataset.id
      );
      if (datasetDetail.data.autoMarkTaskStatus === 1) {
        return this.$message.warning('还有未完成的标注任务，请停止标注任务再删除！')
      }
      if (flag === 'all') {
        const annotatorIns = this.$parent
        if (annotatorIns.activeTool === "Brush") { //需要将"Brush"的isModalOpen置为true，避免滑动影响
          annotatorIns.$refs.brush.isModalOpen = true
        }
        this.$confirmEle('此操作将删除数据集下所有标注信息, 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$emit('handleDelete', flag)
          if (annotatorIns.activeTool === "Brush") { //需要将"Brush"的isModalOpen恢复为false
            annotatorIns.$refs.brush.isModalOpen = false
          }
        }).catch(() => {
          if (annotatorIns.activeTool === "Brush") { //需要将"Brush"的isModalOpen恢复为false
            annotatorIns.$refs.brush.isModalOpen = false
          }
        });
      } else {
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
</style>