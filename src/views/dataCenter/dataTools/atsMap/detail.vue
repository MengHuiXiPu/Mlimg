<template>
  <div class="ats-detail-wrapper scrollbar">
    <a-spin :spinning="spinning">
      <template v-if="taskId">
        <div style="text-align: right;"><a-button type="primary" @click="goEdit">去调优</a-button></div>
        <el-descriptions column="3" style="margin-bottom: 10px;" title="基本信息" size="medium">
          <el-descriptions-item label="创建人">{{ taskData.createBy }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ taskData.createTime | moment }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ taskData.updateTime | moment }}</el-descriptions-item>
          <el-descriptions-item label="描述">
            <text-editor :text="taskData.desc" size="mini" @change="handlUpdateDesc" maxlength="512" :key="taskId"></text-editor>
          </el-descriptions-item>
        </el-descriptions>
        <!-- <el-divider></el-divider> -->
        <div class="picture-footage-box">
          <span class="tab-header">产品配置文件</span>
          <a-tabs v-model="activeKey" style="margin-top: 30px;" :animated="false">
            <!-- <a-tab-pane tab="产品规则配置文件" key="21">
              <template v-if="taskData.product">
                <edit-table :csvData="taskData.product" :taskId="taskId" :activeKey="activeKey" :ref="`refEditTable${activeKey}`" @reUpload="callUpload"></edit-table>
              </template>
              <a-empty style="line-height: 10;" :image="simpleImage" v-else>
                <span slot="description"> 暂无产品规则配置文件，请点击 <a class="common-link" @click="callUpload">添加csv文件</a>吧， 文件示例
                  <a class="common-link" @click="downLoadExample">点击下载</a></span>
              </a-empty>
            </a-tab-pane> -->
            <a-tab-pane tab="Panel配置文件-white" key="22">
              <template v-if="taskData.white">
                <edit-table :csvData="taskData.white" :taskId="taskId" :activeKey="activeKey" :ref="`refEditTable${activeKey}`" @reUpload="reUpload"></edit-table>
              </template>
              <a-empty style="line-height: 10;" :image="simpleImage" v-else>
                <span slot="description"> 暂无Panel配置文件，请点击 <a class="common-link" @click="callUpload">添加csv文件</a>吧， 文件示例
                  <a class="common-link" @click="downLoadExample">点击下载</a></span>
              </a-empty>
            </a-tab-pane>
            <a-tab-pane tab="Panel配置文件-black" key="23">
              <template v-if="taskData.black">
                <edit-table :csvData="taskData.black" :taskId="taskId" :activeKey="activeKey" :ref="`refEditTable${activeKey}`" @reUpload="callUpload"></edit-table>
              </template>
              <a-empty style="line-height: 10;" :image="simpleImage" v-else>
                <span slot="description"> 暂无Panel配置文件，请点击 <a class="common-link" @click="callUpload">添加csv文件</a>吧， 文件示例
                  <a class="common-link" @click="downLoadExample">点击下载</a></span>
              </a-empty>
            </a-tab-pane>
          </a-tabs>
        </div> 
      </template>
      <a-empty style="line-height: 30;" :image="simpleImage" v-else>
        <span slot="description"> 未选择模版，请选择或 <a class="common-link" @click="handCreate">创建新的任务</a></span>
      </a-empty>
      <!-- csv 上传 -->
      <a-upload ref="refUploadComp" :beforeUpload="beforeUploadHandle" :customRequest="customUploadHandle" accept=".csv, .xls" :showUploadList="false"></a-upload>
    </a-spin>
  </div>
</template>

<script>
import textEditor from "@/components/business/textEditor/index.vue";
import { Empty } from 'ant-design-vue';
import { saveTask, getTaskDeteil, uploadCsv } from "@/api/atsMap.js";
import editTable from "./components/editTable.vue";
export default {
  components: {
    textEditor,
    editTable,
  },
  data() {
    return {
      spinning: false,
      taskData: {},
      activeKey: "22",
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
    }
  },
  props: {
    taskId: {
      type: Number,
      default: 0
    },
  },
  methods: {
    // 更新描述
    handlUpdateDesc(newText) {
      saveTask({
        id: this.taskId,
        desc: newText
      }).then(res => {
        if (res.code === 0) {
          this.$message.success('已更新')
          this.taskData.desc = newText
        }
      })
    },
    goEdit() {
      // 校验 white,black 两个文件已上传
      if (!this.taskData.white) {
        return this.$message.warning('请先上传Panel配置文件-white')
      }
      if (!this.taskData.black) {
        return this.$message.warning('请先上传Panel配置文件-black')
      }
      this.$emit('edit')
    },
    callUpload() {
      this.$refs.refUploadComp.$refs.uploadRef.$refs.uploaderRef.onClick()
    },
    // 重新上传
    reUpload() {
      this.$confirm({
        title: `重新上传？`,
        content: '重新上传将覆盖原有配置文件',
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          this.callUpload()
        }
      })
    },
    handCreate() {
      this.$emit('create')
    },
    // 校验必须是图片格式
    beforeUploadHandle(file, fileList) {
      return true
    },
    customUploadHandle({ file, onProgress, onSuccess, onError }) {
      let formParam = new FormData()
      formParam.append('step', this.activeKey)
      formParam.append('csv', file)
      return uploadCsv(this.taskId, formParam).then(res => {
        if (res.code === 0) {
          onSuccess(res, file)
          this.$message.success('上传成功')
          // 将结果写入 taskData
          switch (this.activeKey) {
            case '21':
              this.$set(this.taskData, 'product', res.data)
              break
            case '22':
              this.$set(this.taskData, 'white', res.data)
              break
            case '23':
              this.$set(this.taskData, 'black', res.data)
              break
            default:
              break
          }
          this.$nextTick(() => {
            this.$refs[`refEditTable${this.activeKey}`].initTable()
          })
        }
      }).catch((err) => {
        console.error(err)
        onError(err, file)
      })
    },
    // 下载 csv 示例文件
    downLoadExample() {
      const a = document.createElement('a')
      a.href = `${window.location.origin}/api/v1/data-processing/ast-info/download-example-csv?step=${this.activeKey}`
      a.click()
      URL.revokeObjectURL(a.href)
      // window.open(`${window.location.origin}/api/v1/data-processing/ast-info/download-example-csv?step=${this.activeKey}`)
    },
    /**
     * @public
     */
    async getTaskDetailData() {
      this.spinning = true
      //查询模板详情和图片列表 
      try {
        const result = await getTaskDeteil(this.taskId, { needStepResult: true })
        if (result.code === 0) {
          this.taskData = result.data
        }
        this.spinning = false
      } catch (e) {
        console.error(e)
        this.spinning = false
      }
    }
  },
  watch: {
    taskId() {
      if (this.taskId) {
        this.activeKey = "22"
        //查询模板详情和图片列表 
        this.getTaskDetailData()
      }
    }
  },
}
</script>

<style lang="less" scoped>
.tab-header {
  color: #303133;
  font-size: 16px;
  font-weight: 700;
  margin-right: 20px;
}
.table-col-input {
  width: 100%;
}
.ats-detail-wrapper {
  &::v-deep {
    .ant-table-thead > tr > th,
    .ant-table-tbody > tr > td {
      padding: 8px;
    }
  }
}
</style>