<template>
  <a-modal
    :visible="visible"
    title="制作数据集"
    @ok="handleOk"
    @cancel="handleCancel"
    width="50%"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    :loading="loading"
    :maskClosable="false"
    destroyOnClose
  >
    <a-spin :spinning="loading">
      <a-form-model
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        ref="ruleForm"
        layout="horizontal"
        :model="rowData"
        :rules="rules"
      >
        <a-form-model-item label="数据集名称" prop="inputDataListName">
          <a-input :maxLength="50" v-model="rowData.inputDataListName" />
        </a-form-model-item>
        <a-form-model-item label="单Code最大数量" prop="imgMaxCountByCode">
          <a-input-number style="width: 100%" v-model="rowData.imgMaxCountByCode" disabled/>
        </a-form-model-item>
        <a-form-model-item label="过滤条件" prop="useDetailSet">
          <a-radio-group v-model="rowData.useDetailSet">
            <a-radio :value="0">不需要</a-radio>
            <a-radio :value="1">需要</a-radio>
          </a-radio-group>
          <div v-show="rowData.useDetailSet === 1">
            <a-form-model-item
              v-for="(item, index) in rowData.codeDetailList"
              :key="index"
              :label="item.name"
              :prop="'codeDetailList.' + index + '.value'"
              :rules="{
                required: true,
                message: '请输入样本数量',
                trigger: 'blur',
              }"
              class="code"
              >
              <a-input-number v-model="item.value" :min="0" :max="item.max > rowData.imgMaxCountByCode ? rowData.imgMaxCountByCode : item.max" :precision="0" :step="1" @change="changeValue($event, 'codeDetailList.' + index + '.value')" style="width: 50%;font-size:12px"></a-input-number>
            </a-form-model-item>
          </div>
        </a-form-model-item>
        <a-form-model-item label="数据集类别" prop="dlType">
          <a-select v-model="rowData.dlType">
            <a-select-option
              v-for="(item,key) in dlTypeList"
              :key="key"
              :value="item.value"
            >{{ item.text }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="标注类型" prop="dlTagType">
          <a-select v-model="rowData.dlTagType">
            <a-select-option
              v-for="(item,key) in dlTagTypeOpt"
              :key="key"
              :value="item.value"
            >{{ item.text }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="是否包含业务信息" prop="containSpecial">
          <a-radio-group
            v-model="rowData.containSpecial"
            :disabled="Boolean(rowData.id)"
          >
            <a-radio :value="true">是</a-radio>
            <a-radio :value="false">否</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item label="标注格式" prop="markFileType" v-if="['目标检测', '分割'].includes(rowData.dlTagType)">
          <a-select v-model="rowData.markFileType">
            <a-select-option :value="1">JSON</a-select-option>
            <a-select-option :value="2">XML</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="备注" prop="remark">
          <a-input v-model="rowData.remark" type="textarea" />
        </a-form-model-item>

        <a-form-model-item label="存放目录" prop="storedDirName">
          <a-tree-select
            :disabled="Boolean(rowData.id)"
            showSearch
            allowClear
            :filterTreeNode="fillterFUN"
            v-model="rowData.storedDirName"
            style="width: calc(100% - 70px)"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
            :tree-data="treeData"
            :load-data="onLoadData"
            placeholder="请选择目录"
            @select="onSelect"
          />
          <a-button
            size="small"
            class="addNode"
            @click="() => this.$refs.createTree.showModal()"
            type="primary">
            新增目录
          </a-button>
        </a-form-model-item>
      </a-form-model>
    </a-spin>
    <create-tree
      ref="createTree"
      @getTree="getTree"
      :urlObject="{
        get: 'getTreeList',
        post: 'savaTreeList'
      }" />
  </a-modal>
</template>

<script>
import {
  getTreeList,
  checkDataListNameAvl,
  getTargetType
} from "@/api/dataCenter"
import { imageSearch } from '@/api/appCenter'
import createTree from '@/components/tree/createTree'
export default {
  name: "createDataSet",
  components: {
    createTree
  },
  data () {
    const checkName = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        callback(new Error('当前值不能为空'))
      } else {
        const checkData = await checkDataListNameAvl({
          dataListName: value,
          dlType: this.rowData.dlType
        })
        if (checkData.data) {
          callback()
        } else {
          callback(new Error('当前名称已存在，请重新输入'))
        }
      }
    }
    return {
      rules: {
        inputDataListName: [
          {
            required: true,
            message: "请输入数据集名称",
            trigger: "blur"
          }, {
            required: true,
            validator: checkName,
            trigger: "blur"
          }
        ],
        dlType: [
          {
            required: true,
            message: "请选择数据集类型",
            trigger: "change"
          }
        ],
        dlTagType: [
          {
            required: true,
            message: "请选择标注类型",
            trigger: "change"
          }
        ],
        markFileType: [
          {
            required: true,
            message: "请选择标注格式",
            trigger: "change"
          }
        ],
        containSpecial: [
          {
            required: true,
            message: "请选择是否包含业务信息",
            trigger: "change"
          }
        ],
        remark: [
          {
            required: true,
            message: "请输入备注",
            trigger: "blur"
          }
        ],
        storedDirName: [
          { required: true, message: "请选择存放目录", trigger: "change" }
        ]
      },
      treeData: [],
      formIdLink: "",
      rowData: {},
      visible: false,
      loading: false,
      dlTagTypeOpt: [],
      dlTypeList: [{
        value: 1,
        text: '图像训练集'
      }, {
        value: 2,
        text: '图像题库集'
      }],
      codeDetailList: []
    }
  },
  props: {
    queryId: {
      type: String,
      default: '',
      required: false
    },
    codeList: {
      type: Array,
      default: [],
      required: false
    }
  },
  mounted () {
  },
  methods: {
    showDialog () {
      this.visible = true
      this.rowData = {
        dlTagType: '分类',
        codeDetailList: [],
        useDetailSet: 0,
        dlType: 1
      }
      this.getTargetTypeData()
      this.getCodeFilterList()
      this.getCodeImageMax()
      this.loading = true
      this.$set(this.rowData, 'codeDetailList', JSON.parse(JSON.stringify(this.codeList)).map(item => {
        return {
          ...item,
          max: item.value
        }
      }))
      this.getTree()
      if (this.$refs.ruleForm) {
        this.$refs.ruleForm.resetFields()
      }
    },
    getTree () {
      this.loading = true
      this.treeData = []
      getTreeList({ parentId: "0" }).then(res => {
        this.loading = false
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          this.treeData = this.genTreeNode(data)
        }
      })
    },
    async getCodeImageMax () {
      this.loading = true
      const res = await imageSearch.getCodeImageMax()
      this.loading = false
      this.$set(this.rowData, 'imgMaxCountByCode', res.data)
    },
    async getTargetTypeData () {
      this.loading = true
      const data = await getTargetType()
      this.loading = false
      if (data.code === 0) {
        this.dlTagTypeOpt = data.data.map(element => {
          return {
            text: element.nodeName,
            value: element.nodeName
          }
        })
      }
    },
    async getCodeFilterList () {
    },
    handleOk () {
      this.$refs.ruleForm.validate(async valid => {
        if (!valid) {
          return false
        } else {
          this.rowData.storedDirId = this.formIdLink
          this.loading = true
          const params = {
            ...this.rowData,
            shareType: 1,
            queryId: this.queryId
          }
          const res = await imageSearch.createDataSet(params)
          this.loading = false
          if (res.code !== 0) return false
          this.$message.success('制作成功')
          this.handleCancel()
        }
      })
    },
    onSelect (checkedKeys, node) {
      this.$nextTick(() => {
        this.rowData.storedDirName = node.dataRef.titleLink
        this.formIdLink = node.dataRef.idLink
      })
    },
    changeValue (value, prop) {
      if (value) {
        this.$refs.ruleForm.clearValidate(prop)
      } else {
        this.$refs.ruleForm.validateField(prop)
      }
    },
    genTreeNode (data, titleLink) {
      return data.map(item => {
        const { nodeName, nodeCode, id, childNodeNum } = item
        return {
          id,
          idLink: `${nodeCode}${id};`,
          titleLink: titleLink ? `${titleLink} / ${nodeName}` : nodeName,
          // value就是idLink
          value: `${nodeCode}${id};`,
          title: nodeName,
          nodeCode,
          // disabled: childNodeNum !== 0,
          isLeaf: childNodeNum === 0
        }
      })
    },
    onLoadData (treeNode) {
      const { id, nodeCode, titleLink } = treeNode.dataRef
      const query = {
        parentId: id,
        parentCode: nodeCode
      }
      return getTreeList(query).then(res => {
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          treeNode.dataRef.children = this.genTreeNode(data, titleLink)
          this.treeData = [...this.treeData]
        }
      })
    },
    fillterFUN (searchVal, treeNode) {
      return treeNode.data.props.title.includes(searchVal)
    },
    handleCancel () {
      this.$refs.ruleForm.resetFields()
      this.visible = false
    }
  }
}
</script>

<style scoped lang="less">
/deep/ .ant-form{
  /deep/ .hideCodeList{
    cursor: pointer;
    color: #445cce;
    position: relative;
    span{
      margin-left: 3px;
    }
  }
}
</style>
