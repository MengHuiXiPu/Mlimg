<template>
  <a-modal
    :visible="visible"
    title="困难数据集制作"
    @ok="handleOk"
    @cancel="handleCancel"
    width="720px"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    :loading="loading"
    :maskClosable="false"
    destroyOnClose
    centered
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
        <a-form-model-item class="form-model-item-title" label="困难样本条件">
          <a-tooltip>
            <template slot="title">
              困难样本判断依据：<br/>
                a、预测类别与真实类别是否不一致；<br/>
                b、根据置信度与阈值比较进行判断；<br/>
                c、根据有效检测框的数量进行判断；
            </template>
            <a-icon type="question-circle"></a-icon>
          </a-tooltip>
        </a-form-model-item>
        <a-form-model-item label="设置无缺陷Code" prop="isCode" v-if="['分割', '目标检测'].includes(rowData.tagType)">
          <a-tooltip>
            <template slot="title">
              否：真实code与预测code不一致为困难样本<br/>
              是：无缺陷code为一大类，其他code为另一大类，两类的真实值与预测值不一致为困难样本
            </template>
            <a-icon type="question-circle" style="margin-right: 10px"></a-icon>
          </a-tooltip>
          <a-radio-group v-model="rowData.isCode">
            <a-radio :value="1" :disabled="rowData.codeThreshold.length === 0">是</a-radio>
            <a-radio :value="2">否</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item label="无缺陷Code" prop="codeNames" :filter-option="filterOption" v-if="rowData.isCode === 1 && ['分割', '目标检测'].includes(rowData.tagType)">
          <a-select v-model="rowData.codeNames" mode="multiple">
            <a-select-option
              v-for="(item, key) in rowData.codeThreshold"
              :key="key"
              :value="item.codeName"
            >{{ item.codeName }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="置信度阈值设置" prop="isCodeThreshold">
          <a-radio-group v-model="rowData.isCodeThreshold">
            <a-radio :value="1">是</a-radio>
            <a-radio :value="2">否</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <div v-if="rowData.isCodeThreshold === 1">
          <a-form-model-item
            v-for="(item, index) in rowData.codeThreshold"
            :key="index"
            :label="item.codeName"
            :prop="'codeThreshold.' + index + '.codeValue'"
            :rules="{
              required: item.type !== 3,
              message: '请输入阈值范围',
              trigger: 'blur',
            }"
            class="code"
            >
            <a-select v-model="item.symbolType" style="width: 50%; padding-right: 10px;font-size:12px" @change="codeChange($event, item)">
              <a-select-option v-for="code in codeThreshold" :key="code.value" :value="code.value">
                {{ code.name }}
              </a-select-option>
            </a-select>
            <a-input-number
              v-model="item.codeValue"
              :min="0"
              :max="1.1"
              :precision="4"
              :step="0.0001"
              @change="changeValue($event, 'codeThreshold.' + index + '.codeValue')"
              style="width: 50%;font-size:12px"
              :disabled="item.symbolType === 6"
              ></a-input-number>
          </a-form-model-item>
        </div>
        <a-form-model-item prop="bboxCntFilterValue" v-if="['分割', '目标检测'].includes(rowData.tagType)">
          <a-select v-model="rowData.boxType" style="width: 33%; padding-right: 10px">
            <a-select-option :value="2">有效检测框数量</a-select-option>
            <a-select-option :value="1">检测框数量</a-select-option>
          </a-select>
          <a-select v-model="rowData.boxSymbolType" style="width: 33%; padding-right: 10px">
            <a-select-option v-for="code in codeThreshold" :key="code.value" :value="code.value">
              {{ code.name }}
            </a-select-option>
          </a-select>
          <a-input-number v-model="rowData.boxNumber" :min="1" style="width: 33%" :disabled="rowData.boxSymbolType === 6" />
        </a-form-model-item>
        <a-form-model-item class="form-model-item-title" label="数据集信息">
        </a-form-model-item>
        <a-form-model-item label="单code最大数量" prop="singleCodeImgMax">
          <a-input v-model="rowData.singleCodeImgMax" disabled style="width: 95%" />
          <a-tooltip>
            <template slot="title">
              限制图片量过多，单个code不能超过的最大数量，如超过最大数量则随机抽取
            </template>
            <a-icon type="question-circle" style="margin-left: 10px"></a-icon>
          </a-tooltip>
        </a-form-model-item>
        <a-form-model-item label="数据集名称" prop="dataSetName">
          <a-input :maxLength="50" v-model="rowData.dataSetName" />
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
        <a-form-model-item label="标注类型" prop="tagType">
          <a-select v-model="rowData.tagType">
            <a-select-option
              v-for="(item,key) in dlTagTypeOpt"
              :key="key"
              :value="item.value"
            >{{ item.text }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="标注格式" prop="markFileType" v-if="['分割', '目标检测'].includes(rowData.tagType)">
          <a-select v-model="rowData.markFileType">
            <a-select-option :value="1">JSON</a-select-option>
            <a-select-option :value="2">XML</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="是否包含业务信息" prop="containSpecial">
          <a-radio-group
            v-model="rowData.containSpecial"
          >
            <a-radio :value="1">是</a-radio>
            <a-radio :value="0">否</a-radio>
          </a-radio-group>
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
import { offlineBackExportSet } from '@/api/appCenter'
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
        isCode: [
          {
            required: true,
            message: "请选择设置无缺陷Code",
            trigger: "change"
          }
        ],
        codeNames: [
          {
            required: true,
            message: "请选择无缺陷Code",
            trigger: "change"
          }
        ],
        isCodeThreshold: [
          {
            required: true,
            message: "请选择置信度阈值设置",
            trigger: "change"
          }
        ],
        boxType: [
          {
            required: true,
            message: "请选择检测框类型",
            trigger: "change"
          }
        ],
        boxNumber: [
          {
            required: true,
            message: "请输入预测框数量",
            trigger: "blur"
          }
        ],
        containSpecial: [{
          required: true,
          message: "请选择是否包含业务信息",
          trigger: "change"
        }],
        dataSetName: [
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
        tagType: [
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
      isCodeThreshold: true,
      dlTypeList: [{
        value: 1,
        text: '图像训练集'
      }, {
        value: 2,
        text: '图像题库集'
      }],
      codeThreshold: [{
        value: 4,
        name: '小于等于'
      }, {
        value: 3,
        name: '小于'
      }, {
        value: 5,
        name: '等于'
      }, {
        value: 1,
        name: '大于'
      }, {
        value: 2,
        name: '大于等于'
      }, {
        value: 6,
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
        isCode: 1,
        codeNames: [],
        isCodeThreshold: 1,
        codeThreshold: [],
        boxType: 2,
        boxSymbolType: 2,
        tagType: 1,
        mainFilterType: 1,
        bboxCntFilterType: 3,
        bboxCntFilterValue: 0,
        containSpecial: 0,
        dlType: 1,
        forecastId: this.paramId
      }
      // this.changeMainFileType()
      this.getTree()
      this.getTargetTypeData()
      this.getCodeFilterList()
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
      const res = await offlineBackExportSet.getConfig(this.paramId)
      this.loading = false
      if (res.code !== 0) return false
      const data = JSON.parse(res.data.codeThreshold)
      this.$set(this.rowData, 'codeThreshold', Object.keys(data).map(item => {
        return {
          codeName: item,
          codeValue: data[item],
          symbolType: 3
        }
      }))
      if (this.rowData.codeThreshold.length === 0) this.rowData.isCode = 2
      this.$set(this.rowData, 'singleCodeImgMax', res.data.singleCodeImgMax)
      this.$set(this.rowData, 'tagType', res.data.tagType)
    },
    handleOk () {
      this.loading = true
      this.$refs.ruleForm.validate(valid => {
        if (!valid) {
          this.loading = false
          return false
        } else {
          this.rowData.storedDirId = this.formIdLink
          this.rowData.replayId = this.paramId
          this.rowData.shareType = 1
          offlineBackExportSet.saveConfig(
            this.rowData
          ).then(data => {
            this.loading = false
            if (data.code === 0) {
              this.visible = false
              this.$message.success(
                data.msg
              )
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
    filterOption (input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    fillterFUN (searchVal, treeNode) {
      return treeNode.data.props.title.includes(searchVal)
    },
    handleCancel () {
      // this.$refs.ruleForm.resetFields()
      this.isCodeThreshold = true
      this.visible = false
    }
  }
}
</script>

<style scoped lang="less">
/deep/ .ant-form{
  /deep/ .isCodeThreshold{
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
