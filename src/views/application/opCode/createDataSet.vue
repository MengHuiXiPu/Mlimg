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
          <!-- <a-select v-model="rowData.dlTagType">
            <a-select-option
              v-for="(item,key) in dlTagTypeOpt"
              :key="key"
              :value="item.value"
            >{{ item.text }}</a-select-option>
          </a-select> -->
          <a-input v-model="rowData.dlTagType" disabled />
        </a-form-model-item>
        <a-form-model-item label="包含业务信息" prop="containSpecial">
          <a-radio-group
            v-model="rowData.containSpecial"
            :disabled="Boolean(rowData.id)"
          >
            <a-radio :value="true">是</a-radio>
            <a-radio :value="false">否</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item label="数据筛选条件1" prop="queryType1">
          <a-select v-model="rowData.queryType1">
            <a-select-option :value="0">全部</a-select-option>
            <a-select-option :value="1">{{'turnon&rework'}}</a-select-option>
            <a-select-option :value="2">turnon</a-select-option>
            <a-select-option :value="2">rework</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="数据筛选条件2" prop="queryType2">
          <a-select v-model="rowData.queryType2">
            <a-select-option :value="0">全部</a-select-option>
            <a-select-option :value="1">预测与复判结果一致</a-select-option>
            <a-select-option :value="2">预测与复判结果不一致</a-select-option>
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
  checkDataListNameAvl,
} from "@/api/dataCenter"
import { OPCode } from '@/api/appCenter'
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
        queryType1: [
          {
            required: true,
            message: "请选择数据筛选条件1",
            trigger: "change"
          }
        ],
        queryType2: [
          {
            required: true,
            message: "请选择数据筛选条件2",
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
      // dlTagTypeOpt: [],
      dlTypeList: [{
        value: 1,
        text: '图像训练集'
      }, {
        value: 2,
        text: '图像题库集'
      }, {
        value: 3,
        text: '开单题库集'
      }]
    }
  },
  mounted () {
  },
  methods: {
    showDialog (rowData) {
      this.visible = true
      this.rowData = {
        ...rowData,
        dlTagType: '分类',
        dlType: 1,
        queryType1: 0,
        queryType2: 0
      }
      this.loading = true
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
    handleOk () {
      this.$refs.ruleForm.validate(async valid => {
        if (!valid) {
          return false
        } else {
          this.rowData.storedDirId = this.formIdLink
          const params = {
            ...this.rowData,
            shareType: 1
          }
          this.loading = true
          const res = await OPCode.exportDataSet(params)
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
