<template>
  <div class="header-navebar">
    <span class="hamburger" @click="toggleCollapseMenu" :class="{ 'el-icon-s-fold':!isCollapse, 'el-icon-s-unfold': isCollapse,}"></span>
    <el-select v-model="currentProjectId" placeholder="请选择" class="project-select" size="small" @change="changeProject">
      <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id">
        {{item.projectName}}
      </el-option>
    </el-select>
    <el-button type="primary" plain>创建项目</el-button>
    <div class="global-config-area">
      <a-tooltip title="帮助文档">
        <a-icon type="question-circle" class="icon-item" theme="filled" @click="linkToDoc"/>
      </a-tooltip>
    </div>
  </div>
</template>

<script>
import * as ProjectApi from "@/api/project";

import { getSystemConfig } from "@/api/dataCenter";
export default {
  data() {
    return {
      currentProjectId: null,
      projectOptions: [
        // {id: 0, projectName: '默认项目'}
      ],
      docUrl: "",
    }
  },
  props: {
    isCollapse: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    currentStoreProjectId() {
      return this.$store.getters.currentProjectId
    }
  },
  watch: {
    currentStoreProjectId(newVal, oldVal) {
      this.currentProjectId = Number.parseInt(newVal);
    }
  },
  created() {
    // let param = `?` + `current=` + 1 + `&size=` + 10000
    ProjectApi.getProjectByUser()
      .then(res => {
        console.log(res)
        this.projectOptions.push(...res)
        this.$store.commit('SET_CURRENT_PROJECT_LIST', this.projectOptions)
        if (this.projectOptions.length > 0) {
          this.currentProjectId = this.projectOptions[0].id
          this.$store.commit('SET_CURRENT_PROJECT', this.currentProjectId)
        }
      })
      .catch(err => {
        console.log(err);
      }).finally(() => {
      })
  },
  methods: {
    toggleCollapseMenu() {
      this.$emit('toggleCollapseMenu')
    },
    changeProject(e) {
      this.$store.commit('SET_CURRENT_PROJECT', e);
    },
    linkToDoc() {
      const originUrl = this.docUrl || `${window.location.origin}`
      const url = `${originUrl}/web/#/645830101/221660888`
      console.log("帮助文档地址：", url)
      window.open(url)
    },
    // 查询系统配置的文档链接地址
    queryDocsLinkUrl() {
      getSystemConfig({ keyName: "doc_host_port" }).then(res => {
        this.docUrl = res.data?.valueInfo || null
      })
    },
  },
  created() {
    this.queryDocsLinkUrl()
  }
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";

.header-navebar {
  height: 45px;
  position: relative;

  .hamburger {
    font-size: 22px;
    cursor: pointer;
    vertical-align: -3px;
  }

  .project-select {
    margin: 0 10px;
  }
  .global-config-area {
    position: fixed; // 系统会出滚动条，样式乱七八糟，且会与之前写好的的avatar重叠，所以直接使用fixed
    // right: 60px;
    // top: 12px;
    right: 75px;
    top: 18px;
    display: flex;
    .icon-item {
      font-size: 17px;
      cursor: pointer;
    }
    // align-items: center;
  }
}
</style>
