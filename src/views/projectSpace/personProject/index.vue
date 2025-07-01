<template>
  <div>
    <el-tabs v-model="tabActiveKey">
      <el-tab-pane label="项目信息" name="1">
        <project-detail />
      </el-tab-pane>
      <el-tab-pane label="项目资源" name="3">
        <ResourceDetail />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script>
import ProjectDetail from "@/views/projectSpace/personProject/projectDetail.vue";
import ResourceDetail from "@/views/projectSpace/personProject/resourceDetail.vue";
export default {
  components: {
    ProjectDetail,
    ResourceDetail
  },
  data() {
    return {
      tabActiveKey: "1",
      input: '',
      textarea: ''
    }
  }
}
</script>
<style lang="less" scoped>

</style>

