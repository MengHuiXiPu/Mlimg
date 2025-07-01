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
        <a-form-model-item class="form-model-item-title" label="数据筛选条件">
        </a-form-model-item>
        <a-form-model-item label="筛选范围" prop="mainFilterType">
          <a-radio-group v-model="rowData.mainFilterType" @change="changeMainFileType">
            <a-radio :value="1">判错图片</a-radio>
            <a-radio :value="2">全部图片</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item label="类别" prop="dataType">
          <a-select v-model="rowData.dataType" @change="changeDataType">
            <a-select-option :value="1">真实类别</a-select-option>
            <a-select-option :value="2">预测类别</a-select-option>
          </a-select>
          <span class="hideCodeList" v-if="hideCodeList === false" @click="hideCodeList = true">
            <a-icon type="plus-square" /><span>显示类别列表</span>
          </span>
          <span class="hideCodeList" v-else @click="hideCodeList = false">
            <a-icon type="minus-square" /><span>隐藏类别列表</span>
          </span>
          <a-tooltip placement="top">
            <template slot="title">
              筛选Code阈值
            </template>
            <span><a-icon type="question-circle" /></span>
          </a-tooltip>
        </a-form-model-item>
        <div v-show="hideCodeList">
          <a-form-model-item
            v-for="(item, index) in rowData.codeFilterList"
            :key="index"
            :label="item.name"
            :prop="'codeFilterList.' + index + '.value'"
            :rules="{
              required: item.type !== 3,
              message: '请输入阈值范围',
              trigger: 'blur',
            }"
            class="code"
            >
            <a-select v-model="item.type" style="width: 50%; padding-right: 10px;font-size:12px" @change="codeChange($event, item)">
              <a-select-option v-for="code in codeFilterList" :key="code.value" :value="code.value">
                {{ code.name }}
              </a-select-option>
            </a-select>
            <a-input-number v-model="item.value" :min="0" :max="1.1" :precision="4" :step="0.0001" @change="changeValue($event, 'codeFilterList.' + index + '.value')" style="width: 50%;font-size:12px" :disabled="item.type === 3"></a-input-number>
          </a-form-model-item>
        </div>
        <a-form-model-item label="预测框数量" prop="bboxCntFilterValue">
          <a-select v-model="rowData.bboxCntFilterType" style="width: 50%; padding-right: 10px">
            <a-select-option v-for="code in codeFilterList" :key="code.value" :value="code.value">
              {{ code.name }}
            </a-select-option>
          </a-select>
          <a-input v-model="rowData.bboxCntFilterValue" style="width: 50%" :disabled="rowData.bboxCntFilterType === 3"></a-input>
        </a-form-model-item>
        <a-form-model-item class="form-model-item-title" label="数据集信息">
        </a-form-model-item>
        <a-form-model-item label="数据集名称" prop="inputDataListName">
          <a-input :maxLength="50" v-model="rowData.inputDataListName" />
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
<!--        <a-form-model-item label="标注格式" prop="markFileType" v-if="rowData.dlTagType === '目标检测'">-->
        <a-form-model-item label="标注格式" prop="markFileType">
<!--          <a-select v-model="rowData.markFileType" :disabled="rowData.dataType === 1">-->
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
            @click="() => this.$refs.createTree.showModal()"
            class="addNode"
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
  saveDataSetList,
  checkDataListNameAvl,
  getTargetType
} from "@/api/dataCenter"
import { exportDataSet } from '@/api/offlineForecast'
import createTree from '@/components/tree/createTree'
export default {
  name: "exportDataSet",
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
        mainFilterType: [
          {
            required: true,
            message: "请选择筛选范围",
            trigger: "change"
          }
        ],
        dataType: [
          {
            required: true,
            message: "请选择类别",
            trigger: "change"
          }
        ],
        bboxCntFilterValue: [
          {
            required: true,
            message: "请输入预测框数量",
            trigger: "blur"
          }
        ],
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
      hideCodeList: true,
      dlTypeList: [{
        value: 1,
        text: '图像训练集'
      }, {
        value: 2,
        text: '图像题库集'
      }],
      codeFilterList: [{
        value: -2,
        name: '小于等于'
      }, {
        value: -1,
        name: '小于'
      }, {
        value: 0,
        name: '等于'
      }, {
        value: 1,
        name: '大于'
      }, {
        value: 2,
        name: '大于等于'
      }, {
        value: 3,
        name: '无'
      }]
    }
  },
  props: {
    paramId: {
      type: String,
      default: ''
    }
  },
  mounted () {
  },
  methods: {
    showDialog () {
      this.visible = true
      this.rowData = {
        dlTagType: 1,
        mainFilterType: 1,
        bboxCntFilterType: 3,
        bboxCntFilterValue: 0,
        codeFilterList: [],
        dlType: 1,
        forecastId: this.paramId
      }
      this.changeMainFileType()
      this.getTargetTypeData()
      this.getCodeFilterList()
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
    changeMainFileType () {
      this.$set(this.rowData, 'dataType', this.rowData.mainFilterType)
      this.getCodeFilterList()
    },
    changeDataType () {
      this.getCodeFilterList()
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
      this.loading = true
      const res = await exportDataSet.codeFilterList({
        mainFilterType: this.rowData.mainFilterType,
        dataType: this.rowData.dataType,
        forecastId: this.paramId
      })
      this.loading = false
      if (res.code !== 0) return false
      this.$set(this.rowData, 'codeFilterList', res.data.codeList.map(item => {
        return {
          name: item,
          value: null,
          type: 3
        }
      }))
      this.$set(this.rowData, 'dlTagType', res.data.dlTagType)
      this.$set(this.rowData, 'markFileType', res.data.markFileType)
    },
    handleOk () {
      this.$refs.ruleForm.validate(valid => {
        if (!valid) {
          return false
        } else {
          if (this.rowData.codeFilterList.length === 0) {
            this.$message.warning('当前范围无类别，请确认后重试')
            return false
          }
          this.rowData.storedDirId = this.formIdLink
          this.rowData.shareType = 1
          this.loading = true
          exportDataSet.createConditionalImgSet(
            this.rowData
          ).then(data => {
            this.loading = false
            if (data.code === 0) {
              this.visible = false
              if (data.data.status) {
                this.$message.success(
                  data.data.message
                )
              } else {
                this.$message.error(
                  data.data.message
                )
              }
            }
          })
        }
      })
    },
    onSelect (checkedKeys, node) {
      this.$nextTick(() => {
        this.rowData.storedDirName = node.dataRef.titleLink
        this.formIdLink = node.dataRef.idLink
      })
    },
    codeChange (value, option) {
      if (value === 3) {
        option.value = null
      }
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
      this.hideCodeList = true
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
    left: -99px;
    span{
      margin-left: 3px;
    }
  }
  &-item.code{
    padding-left: 50px!important;
  }
  .form-model-item-title{
    .ant-form-item-label{
      text-align: left;
      padding-left: 10px;
      overflow: inherit;
      label{
        font-weight: bold;
        font-size: 16px;
        &::before{
          content: '';
          position: absolute;
          left: -8px;
          top: 0;
          width: 3px;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
        }
        &::after{
          content: '';
        }
      }
    }
  }
}
</style>
