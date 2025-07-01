<template>
  <a-modal
    :visible="visible"
    title="移动节点"
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
      <a-form-model-item label="选择节点" prop="treeValue">
        <a-tree-select
          showSearch
          allowClear
          :filterTreeNode="fillterFUN"
          v-model="form.treeValue"
          style="width: calc(100% - 70px)"
          :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
          :tree-data="treeData"
          :load-data="onLoadData"
          placeholder="请选择一个节点t"
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
    <create-tree
      ref="createTree"
      @getTree="getTree"
      :urlObject="{
        get: 'getModelTreeList',
        post: 'savaModelTreeList'
      }" />
  </a-modal>
</template>

<script>
import createTree from '@/components/tree/createTree'
import { getModelTreeList } from "@/api/dataCenter"
import {
  modelMoveNode
} from "@/api/modelManage"
export default {
  name: "moveNode",
  components: {
    createTree
  },
  data () {
    return {
      visible: false,
      loading: false,
      dir: {
        storedDirId: '',
        storedDirName: '',
      },
      form: {
        treeValue: '', // 请求不是这个值，这里只是为了显示再input中并校验
      },
      rules: {
        treeValue: [{ required: true, message: '请选择移动目录', trigger: 'change' }],
      },
      treeData: []
    }
  },
  methods: {
    showModal (id) {
      this.visible = true
      this.getTree()
      this.form.id = id
    },
    getTree () {
      const query = {
        parentId: "0",
        parentCode: "0"
      }
      this.treeData = []
      this.loading = true
      getModelTreeList(query).then(res => {
        const { data = [], code = 0 } = res
        this.loading = false
        if (res.code === 0) {
          this.treeData = this.genTreeNode(data)
        }
      })
    },
    onSelect (checkedKeys, node) {
      this.$nextTick(() => {
        const { storedDirId, storedDirName, id } = node.dataRef
        this.form.treeValue = storedDirName
        this.dir = {
          storedDirId, storedDirName, nodeId: id
        }
      })
    },
    handleOk () {
      this.$refs.ruleForm.validate(async (valid) => {
        if (!valid) {
          return false
        } else {
          this.loading = true
          const params = {
            id: this.form.id,
            ...this.dir
          }
          const res = await modelMoveNode(params)
          this.loading = false
          if (res.code !== 0) return false
          this.$message.success('移动成功')
          this.handleCancel()
          this.$emit('reload')
        }
      })
    },
    genTreeNode (data, storedDirId, storedDirName) {
      return data.map(item => {
        const { nodeName, nodeCode, id, childNodeNum } = item
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
      return getModelTreeList(query).then((res) => {
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
      this.$refs.ruleForm.resetFields()
      this.visible = false
    }
  }
}
</script>

<style scoped>
</style>
