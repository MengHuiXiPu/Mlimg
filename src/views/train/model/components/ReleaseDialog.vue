<template>
  <a-modal
    :visible="visible"
    :title="title"
    @ok="handleOk"
    @cancel="handleCancel"
    :maskClosable="false"
  >
    <template slot="footer">
      <a-button key="back" @click="handleCancel">
        取消
      </a-button>
      <a-button key="submit" type="primary" :loading="loading" @click="handleOk">
        确定
      </a-button>
    </template>
    <a-form-model
      :model="form"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      ref="ruleForm"
      :rules="rules"
      layout="horizontal"
    >
      <a-form-model-item label="发布至">
        <a-select v-model="form.publishType" prop="publishType">
          <a-select-option :value="1">应用中心</a-select-option>
          <a-select-option :value="2" :disabled="type === 1">体验中心</a-select-option>
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
    </a-form-model>
    <create-tree
      ref="createTree"
      @getTree="getTree"
      :urlObject="{
        get: 'getAppTaskTreeList',
        post: 'savaAppTaskTreeList'
      }" />
  </a-modal>
</template>

<script>
import { getAppTaskTreeList } from '@/api/dataCenter'
import { releaseModel, editModel, modelGroup } from '@/api/modelManage'
import createTree from '@/components/tree/createTree'
import bus from '@/utils/bus'
export default {
  name: "ReleaseDialog",
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
    createTree
  },
  data () {
    return {
      visible: false,
      loading: false,
      title: this.type === 0 ? '模型发布' : '模型组发布',
      storedDirId: '',
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
      appTypeList: [{
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
      }]
    }
  },
  mounted () {
  },
  methods: {
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
                  this.$emit("getDataList", {
                    pageSize: that.rowData.id ? that.pagination.pageSize : 10,
                    pageIndex: that.rowData.id ? that.pagination.current : 1,
                  })
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
    }
  }
}
</script>

<style scoped>
</style>
