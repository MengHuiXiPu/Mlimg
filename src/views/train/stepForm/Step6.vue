<template>
  <div>
    <step-layout>
      <template slot="leftDeploy">
        <div class="deploy-style">
          <div style="padding-left: 16px; padding-top: 8px;">
            <!-- <h1>模型发布</h1>
            <p>将您的模型发布至【应用中心】</p> -->
            <h1>模型保存</h1>
            <p>将您的模型保存至【模型管理】</p>
          </div>
          <div style="display: flex; justify-content: space-evenly; flex-direction: column;">
            <!-- <a-form-model
                :model="form"
                :label-col="{ span: 6 }"
                :wrapper-col="{ span: 18 }"
                ref="ruleForm"
                :rules="rules"
                layout="horizontal"
                style="padding: 15px;"
            >
                         <a-form-model-item label="发布至">
                           <a-select v-model="form.publishType" prop="publishType">
                             <a-select-option :value="1">应用中心</a-select-option>
              &lt;!&ndash;                <a-select-option :value="2" :disabled="type === 1">体验中心</a-select-option>&ndash;&gt;
                           </a-select>
                         </a-form-model-item>
              <template v-if="form.publishType === 1">
                <a-form-model-item :label="type === 0 ? '任务名称' : '任务组名称'" prop="taskName">
                  <a-input v-model="form.taskName" :maxLength="50" />
                </a-form-model-item>
                <a-form-model-item label="发布目录" prop="treeValue">
                  <a-tree-select
                      showSearch
                      allowClear
                      :filterTreeNode="fillterFUN"
                      v-model="form.treeValue"
                      style="width: calc(100% - 70px)"
                      :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
                      :tree-data="treeData"
                      :load-data="onLoadData"
                      placeholder="Please select"
                      @select="onSelect"
                  />
                  <a-button
                      size="small"
                      @click="() => this.$refs.createTree.showModal()"
                      class="addNode"
                      type="primary">
                    新增目录
                  </a-button>
                </a-form-model-item>
              </template>
              <template v-else>
                <a-form-model-item label="应用标题" prop="taskName">
                  <a-input v-model="form.taskName" :maxLength="50" />
                </a-form-model-item>
                <a-form-model-item label="应用类型" prop="appType">
                  <a-select v-model="form.appType">
                    <a-select-option v-for="item in appTypeList" :key="item.value" :value="item.value" :disabled="item.disabled">
                      {{ item.title }}
                    </a-select-option>
                  </a-select>
                </a-form-model-item>
              </template>
              <a-form-model-item label="任务描述" prop="description">
                <a-input v-model="form.description" type="textarea" />
              </a-form-model-item>
            </a-form-model> -->
            <!-- <a-button key="submit" type="primary" :loading="loading" @click="handleOk" class="btnStep" style="margin: auto; pointer-events: none; opacity: 0.5;">
              确认
            </a-button> -->
            <a-button key="submit" type="primary" :loading="saveBtnLoading" @click="handleSave" class="btnStep" style="margin: auto;">保存</a-button>
          </div>
        </div>
        <create-tree
            ref="createTree"
            @getTree="getTree"
            :urlObject="{
            get: 'getAppTaskTreeList',
            post: 'savaAppTaskTreeList'
          }" />
      </template>
      <template slot="rightDeploy">
        <div class="deploy-style">
          <h1>模型导出</h1>
          <p>将您的模型转换为其他模型格式并下载</p>
          <div class="card-style">
            <CardDeploy :cardInfo="item" v-for="item in deployInfo" :key="item" class="card" @change="handleModelTransform"/>
          </div>
        </div>
        <a-modal v-model="exportVisible" :title="'导出为'+exportTitle" :footer="null" centered class="model-style">
          <div style="display: flex;justify-content: center; align-items: center;">
            <p v-if="!transformLoading">正在转换格式...</p>
            <div v-if="transformLoading">
              <div v-if="transformSuccess" style="text-align: center;">
                <p>格式转换完成</p>
                <a href="#" @click="onExportModel(exportTitle)">点击下载</a>
              </div>
              <div v-if="!transformSuccess">
                <p>格式转换失败，请重试</p>
              </div>
            </div>
          </div>
        </a-modal>
      </template>
      <template slot="bottomDeploy">
        <a-button class="btnStep" type="primary" @click="prevStep">上一步</a-button>
        <a-button class="btnStep" style="margin-left: 10px;" type="primary" @click="cancel" >完成</a-button>
      </template>
    </step-layout>
  </div>
</template>

<script>
import StepLayout from '@/components/StepLayout'
import { getAppTaskTreeList } from '@/api/dataCenter'
import { releaseModel, editModel, modelGroup, getModelTransform, downloadFileCommon, downloadFileCommon2, saveFromOldModel } from '@/api/modelManage'
import createTree from '@/components/tree/createTree'
import bus from '@/utils/bus'
import {mapState} from "vuex";
import CardDeploy from "@/components/CardDeploy";
export default {
  name: 'Step6',
  props: {
    parentData: {
      type: Object,
      default: () => {}
    },
    pagination: {
      type: Object,
      default: () => {}
    },
    type: {
      type: Number,
      default: 0
    }
  },
  components: {
    createTree,
    StepLayout,
    CardDeploy
  },
  data () {
    return {
      visible: false,
      loading: false,
      saveBtnLoading: false,
      title: this.type === 0 ? '模型发布' : '模型组发布',
      storedDirId: '',
      deployInfo: [
        {
          logoImg: require('@/assets/pytorch.png'),
          cardName: 'Pytorch',
          isAvailable: true,
        },
        {
          logoImg: require('@/assets/onnx.png'),
          cardName: 'ONNX',
          isAvailable: true,
        },
        {
          logoImg: require('@/assets/openvino.png'),
          cardName: 'OpenVINO',
          isAvailable: false,
        },
        {
          logoImg: require('@/assets/tensorRT.png'),
          cardName: 'TensorRT',
          isAvailable: false,
        },
        {
          logoImg: require('@/assets/paddle.jpg'),
          cardName: 'PaddlePaddle',
          isAvailable: false,
        },
      ],
      form: {
        publishType: 1,
        taskName: '',
        treeValue: '', // 请求不是这个值，这里只是为了显示再input中并校验
        description: '',
        appType: ''
      },
      rules: {
        publishType: [{ required: true, message: '请选择发布类型', trigger: 'change' }],
        appType: [{ required: true, message: '请选择应用类型', trigger: 'change' }],
        taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
        treeValue: [{ required: true, message: '请选择发布目录', trigger: 'change' }],
        description: [{ required: true, message: '请输入任务描述', trigger: 'blur' }],
      },
      treeData: [],
      rowData: {},
      appTypeList: [
          {
        title: '人脸人体',
        value: 1,
        disabled: true
      }, {
        title: '文字识别',
        value: 2,
        disabled: true
      }, {
        title: '工业质检',
        value: 3,
        disabled: false
      }],
      exportVisible: false, // 导出对话框
      exportTitle: '', // 导出标题
      transformLoading: false, // 是否转换加载完成
      transformSuccess: false, // 是否转换成功
      fileName: '' // 设置模型下载的文件名
    }
  },
  mounted () {
    this.getTree();
  },
  computed: {
    ...mapState({
      currentModel: state => state.model.currentModel,
      modelInfoRecord: state => state.model.modelInfoRecord
    }),
    modelId(){
      return this.$route.query.id;
    }
  },
  methods: {
    prevStep () {
      this.$emit('prevStep')
    },
    cancel () {
      this.$emit('cancel')
    },
    showDialog () {
      this.visible = true
      this.treeData = []
      this.getTree()
      if (this.$refs.ruleForm) {
        this.$refs.ruleForm.resetFields()
      }
      this.rowData = { ...this.parentData }
    },
    getTree () {
      const query = {
        parentId: "0",
        parentCode: "0"
      }
      this.treeData = []
      this.loading = true
      getAppTaskTreeList(query).then(res => {
        const { data = [], code = 0 } = res
        this.loading = false
        if (res.code === 0) {
          this.treeData = this.genTreeNode(data)
        }
      })
    },
    onSelect (checkedKeys, node) {
      this.$nextTick(() => {
        this.form.treeValue = node.dataRef.storedDirName
        this.storedDirId = node.dataRef.storedDirId
      })
    },
    // 模型发布
    handleOk () {
      const that = this
      that.loading = true
      this.$refs.ruleForm.validate((valid) => {
        if (!valid) {
          that.loading = false
          return false
        } else {
          const _params = {
            storedDirId: that.storedDirId,
            storedDirName: that.form.treeValue.replace(' / ', ';'),
            appType: that.form.appType
          }
          console.log("that.modelInfoRecord+++++++: ", that.modelInfoRecord)
          that.rowData.id = that.modelInfoRecord.id
          that.rowData.modelName = that.modelInfoRecord.modelName
          that.rowData.versionLabel = that.modelInfoRecord.versionLabel
          that.rowData.tagType = that.modelInfoRecord.tagType
          const params = {
            publishType: that.form.publishType,
            description: that.form.description,
            taskName: that.form.taskName,
            modelId: that.rowData.id,
            modelName: this.type === 0 ? that.rowData.modelName : that.rowData.groupName,
            modelVersion: that.rowData.versionLabel || '',
            tagType: that.rowData.tagType,
            taskType: this.type,
            ..._params
          }
          console.log("publish params: ++++", params)
          releaseModel(params).then(data => {
            that.loading = false
            if (data.code === 0) {
              const obj = {
                id: that.rowData.id,
                isPublish: 2,
              }
              that.loading = true
              const edit = this.type === 0 ? editModel : modelGroup.addModelGroup
              edit(obj, 'put').then(res => {
                that.loading = false
                if (res.code === 0) {
                  // this.$emit("getDataList", {
                  //   pageSize: that.rowData.id ? that.pagination.pageSize : 10,
                  //   pageIndex: that.rowData.id ? that.pagination.current : 1,
                  // })
                  this.visible = false
                  bus.$emit('reloadTask')
                  that.$message.success("发布成功")
                }
              })
            }
          })
        }
      })
    },
    genTreeNode (data, storedDirId, storedDirName) {
      return data.map(item => {
        const { nodeName, nodeCode, id, childNodeNum } = item
        console.log(storedDirName, nodeName)
        const names = storedDirName ? `${storedDirName} / ${nodeName}` : nodeName
        const ids = `${nodeCode}${id};`
        // const ids = storedDirId ? `${storedDirId}${id};` : `${id};`
        return {
          id,
          storedDirId: ids,
          storedDirName: names,
          value: ids, // value 设置为ids
          title: nodeName,
          nodeCode,
          // disabled: childNodeNum !== 0,
          isLeaf: childNodeNum === 0
        }
      })
    },
    onLoadData (treeNode) {
      const { id, nodeCode, storedDirId, storedDirName } = treeNode.dataRef
      const query = {
        parentId: id,
        parentCode: nodeCode
      }
      return getAppTaskTreeList(query).then((res) => {
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          treeNode.dataRef.children = this.genTreeNode(data, storedDirId, storedDirName)
          this.treeData = [...this.treeData]
        }
      })
    },
    fillterFUN (searchVal, treeNode) {
      return treeNode.data.props.title.includes(searchVal)
    },
    handleCancel () {
      this.visible = false
    },

    // /api/v1/traincenter/modelVersionInfo/HttpConvertModelType?modelId=3202&&convertType=onnx
    // 模型转换
    async handleModelTransform(cardName) {
      this.exportVisible = true  // 显示模型转换的对话框
      this.exportTitle = cardName // 模型转换对话框的标题

      // if(cardName.toLowerCase() === 'pytorch') { // 如果是pytorch，不用进行模型转换
      //   this.transformSuccess = true
      //   this.transformLoading = true
      //   return ;
      // }
      this.transformLoading = false
      const params = {
        modelId: this.modelId,
        convertType: cardName.toLowerCase()
      }
      console.log("params: ", params)
      const res = await getModelTransform(params)
      console.log("模型转换res: ", res)
      if(res.code == 0) {
        this.fileName = res.data.modelName
        this.transformSuccess = true
      }else {
        this.transformSuccess = false
      }
      this.transformLoading = true
    },
    // 下载模型
    async onExportModel() {
      const modelType = this.exportTitle.toLowerCase()
      if(this.exportTitle.toLowerCase() === 'pytorch') {
        window.open(`${location.origin}/api/v1/traincenter/modelManageInfo/download?id=${this.modelId}`)
        // const url = '/api/v1/traincenter/modelManageInfo/download'
        // downloadFileCommon2(url, {
        //   id: this.modelId,
        //   // zipFilePath: "exportCommonModel_" + this.modelId + ".pth"
        //   zipFilePath: this.fileName,
        // });
      }else {
        window.open(`${location.origin}/api/v1/traincenter/modelManageInfo/downloadConvertModel?modelId=${this.modelId}&modelType=${modelType}`)
        // const url = '/api/v1/traincenter/modelManageInfo/downloadConvertModel'
        // downloadFileCommon2(url,{
        //   modelId: this.modelId,
        //   modelType: this.exportTitle.toLowerCase(),
        //   // zipFilePath: "exportBizModel_" + this.modelId + "."+ this.exportTitle.toLowerCase()
        //   zipFilePath: this.fileName,
        // });
      }
      // this.$message.info("模型导出中，请耐心等待")
      this.exportVisible = false
    },
    // 保存模型至 模型管理
    async handleSave() {
      try {
        const resopnse = await this.$prompt('请输入模型名称', '保存模型')
        if (!resopnse?.value || !resopnse?.value.trim()) return this.$message.warning('未输入名称， 无法保存模型')
        this.saveBtnLoading = true
        const saveRes = await saveFromOldModel({
          modelId: this.modelInfoRecord?.id || this.modelId,
          modelName: resopnse?.value
        })
        this.saveBtnLoading = false
        if (saveRes.code === 0) {
          this.$message.success("模型已保存，请到【方案中心】->【模型管理】中查看")
        } else {
          this.$message.error(saveRes.data?.message || saveRes.data?.msg || saveRes.msg || saveRes.message)
        }
      } catch (error) {
        this.saveBtnLoading = false
        if (error !== "cancel") {
          console.error(error)
        }

      }
    }
  }
}
</script>

<style scoped lang="less">
@import "~@/config/theme.less";
/deep/ .step-content .deploy .top {
  padding: 0!important;
}
/deep/ .step-content .deploy .top .rightDeploy {
  padding: 16px!important;
}
/deep/ .ant-col-6 {
  width: 20%!important;
}
/deep/ .ant-modal-content {
  width: 40vw;
  // height: 20vw;
  max-width: 422px!important;
  // max-height: 221px!important;
  min-width: 308px!important;
  min-height: 154px!important;
}
.deploy-style {
  font-family: '微软雅黑 Bold', '微软雅黑 Regular', '微软雅黑', sans-serif;
  color: #333;
  h1 {
    font-weight: 700;
    font-size: 16px;
  }
  p {
    font-size: 14px;
  }
}
.card-style {
  // display: flex;
  //justify-content: space-between;
  padding: 8px;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 24px;
  grid-template-rows: repeat(2, auto); /* 设置2行 */
  .card {
     grid-column: auto / span 1;
     width: 100%;
  }
}
.model-style {
  font-family: 'Arial Normal', 'Arial', sans-serif;
  font-size: 14px;
  a {
    color: #00f;
  }
}
.btnStep {
  width: @nextStepWidth;
  height: @nextStepHeight;
  color: @nextStepColor;
  background-color: @nextStepBgc;
  border-radius: @borderRadiusSmall;
}
</style>
