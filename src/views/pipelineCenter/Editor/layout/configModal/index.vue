<template>
  <a-modal v-model="showDialog" :title="nodeData._label" @ok="handleOk" @cancel="handleCancel" width="50%"
    class="config-modal" okText="保存" :keyboard="false" :confirm-loading="confirmLoading">
    <div class="card-container scrollbar" id="graph-config-wrapper" v-if="showDialog" v-loading="loading"
      element-loading-text="数据保存中" element-loading-spinner="el-icon-loading">
      <a-tabs default-active-key="1" size="small">
        <a-tab-pane key="1" tab="输入设置">
          <config-table :tableData="nodeData.items" :has-inherit="true"></config-table>
        </a-tab-pane>
        <a-tab-pane key="2" tab="初始化参数">
          <config-table :tableData="nodeData.inits" :has-inherit="false" @showLoading="showLoading"></config-table>
        </a-tab-pane>
        <a-tab-pane key="3" tab="远程调用" v-if="nodeData.supportRemote">
          <el-form size="mini" :model="nodeData.special" label-width="100px" class="remote-invoke-config-form">
            <el-form-item label="是否开启：">
              <el-switch v-model="nodeData.special.isRemote" size="mini"></el-switch>
            </el-form-item>
            <el-form-item label="调用地址：">
              <el-input v-model="nodeData.special.remoteAddr" :placeholder="`请输入调用地址`" style="width: 200px;"
                :disabled="!nodeData.special.isRemote"></el-input>
            </el-form-item>
          </el-form>
        </a-tab-pane>
      </a-tabs>
    </div>
  </a-modal>
</template>

<script>
import { useCell, useGraph } from "@pipeline/Editor/store/index.js";
import { ref } from "vue";
import configTable from "./configTable.vue";
import { saveGraph } from "@pipeline/Editor/common/request.js";
// import { validNodeConfig } from "@pipeline/Editor/common/cell.js";
export default {
  components: {
    configTable,
  },
  data() {
    return {
      showDialog: false,
      state: {}, //状态机
      nodeData: {}, //
    }
  },
  props: {
    /**
     * 输入端子配置项(items中的配置项)data
     */
    // item: {
    //   type: Object,
    //   default: () => ({})
    // },
  },
  methods: {
    /**
     * @description 
     * nodeData
     * @return Pormise
     */
    invoke(nodeData) {
      let statePromise = null;
      if (this.showDialog) return statePromise;
      this.nodeData = nodeData
      this.showDialog = true
      statePromise = new Promise((resolve, reject) => {
        this.state = {
          resolve,
          reject
        }
      })
      return statePromise
    },

    openDialog() {
      this.invoke(this.item)
    },
    async handleOk() {
      // 校验算子参数配置
      // await validNodeConfig(this.nodeData)

      // this.showDialog = false
      this.confirmLoading = true;
      saveGraph().then(() => {
        this.showDialog = false
        this.state.resolve()
      }).finally(() => {
        this.confirmLoading = false
      })
      // 关闭弹框  resolve state
      // 整合成inheritNodeIds和inheritVariables
      // this.state.resolve(this.inheritData)
    },
    handleCancel() {
      this.showDialog = false
      // 关闭弹框  reject state
      this.state.reject('canceled')
    },
    showLoading(flag) {
      this.loading = flag
    }
  },
  setup() {
    const cell = useCell();
    const graph = useGraph();
    const loading = ref(false);
    const confirmLoading = ref(false)
    return {
      cell,
      graph,
      loading,
      confirmLoading,
    }
  }
}
</script>

<style lang="less" scoped>
.inherit-block {
  & ::v-deep .el-checkbox {
    margin-bottom: 0;
  }
}

.config-modal {
  &::v-deep .ant-modal-body {
    padding: 0;
  }
}

.card-container {
  background: #f5f5f5;
  overflow: auto;
  padding: 5px 20px;
  height: 50vh;
}

.card-container>.ant-tabs-card>.ant-tabs-content {
  height: 120px;
  margin-top: -16px;
}

.card-container>.ant-tabs-card>.ant-tabs-content>.ant-tabs-tabpane {
  background: #fff;
  padding: 16px;
}

.card-container>.ant-tabs-card>.ant-tabs-bar {
  border-color: #fff;
}

.card-container>.ant-tabs-card>.ant-tabs-bar .ant-tabs-tab {
  border-color: transparent;
  background: transparent;
}

.card-container>.ant-tabs-card>.ant-tabs-bar .ant-tabs-tab-active {
  border-color: #fff;
  background: #fff;
}
</style>
<style>
/* lable标签被人默认设置成8px的margin-bottom,导致显示异常 */
label[class*="el-checkbox"] {
  margin-bottom: 0;
}

/* 远程调用表单样式 */
.remote-invoke-config-form {
  background-color: #ffffff;
  padding: 10px 0 5px 0;
  border-radius: 8px;
}
</style>