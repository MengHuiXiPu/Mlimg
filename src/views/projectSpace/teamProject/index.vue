<template>
  <div>
    <a-tabs v-model="tabActiveKey" default-active-key="1" @change="callback">
      <a-tab-pane tab="项目信息" key="1">
        <project-info />
      </a-tab-pane>
      <a-tab-pane tab="项目成员" key="2">
        <project-member />
      </a-tab-pane>
      <a-tab-pane tab="项目资源" key="3">
        <project-resource />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script >
import ProjectInfo from "@/views/projectSpace/teamProject/projectIfo.vue";
import ProjectMember from "@/views/projectSpace/teamProject/projectMember.vue";
import ProjectResource from "@/views/projectSpace/teamProject/projectResource.vue";
export default {
  components: {
    ProjectMember,
    ProjectInfo,
    ProjectResource
  },
  data() {
    return {
      tabActiveKey: "1",
    }
  },
  methods: {
    callback(key) {
      console.log(key);
    },
  }
}
</script>
<style lang="less" scoped>
</style>