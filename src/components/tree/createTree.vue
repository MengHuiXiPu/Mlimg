<template>
  <a-modal v-model="dataSetVisible" title="新增节点" @ok="createTree" :maskClosable="false" @cancel="handleCancel">
    <a-form-model
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      ref="ruleForm"
      layout="horizontal"
      :model="createTreeData"
      :rules="rules"
    >
      <a-form-model-item label="节点名称" prop="nodeName">
        <a-input :maxLength="40" v-model="createTreeData.nodeName" />
      </a-form-model-item>
      <a-form-model-item label="父级目录" prop="storedDirName">
        <a-tree-select
          showSearch
          allowClear
          :filterTreeNode="fillterFUN"
          v-model="createTreeData.id"
          style="width: 100%"
          :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
          :tree-data="treeData"
          :load-data="onLoadData"
          placeholder="请选择父级目录"
          @select="onSelect"
        >
        </a-tree-select>
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import * as api from "@/api/dataCenter"
export default {
  name: 'createTree',
  data () {
    return {
      dataSetVisible: false,
      createTreeData: {},
      treeData: [],
      rules: {
        nodeName: [{ required: true, message: "请输入节点名称", trigger: "blur" }]
      }
    }
  },
  props: {
    urlObject: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    showModal () {
      this.dataSetVisible = true
      this.getTree()
    },
    getTree () {
      api[this.urlObject.get]({ parentId: "0" }).then(res => {
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          this.treeData = this.genTreeNode(data)
        }
      })
    },
    createTree () {
      this.$refs.ruleForm.validate(async valid => {
        if(!valid) return
        const { nodeCode, id, level, nodeName } = this.createTreeData
        let params = {}
        if (this.createTreeData.id) {
          params = {
            parentId: id,
            nodeName: nodeName,
            // nodeCode: nodeCode + id,
            parentCode: nodeCode,
            level: level + 1
          }
        } else {
          params = {
            level: 1,
            nodeName,
            parentCode: "0",
            parentId: 0
          }
        }
        const res = await api[this.urlObject.post](params)
        if (res.code !== 0) return false
        this.$message.success('添加成功')
        this.handleCancel()
        this.$emit('getTree')
      }) 
    },
    onLoadData (treeNode) {
      const { id, nodeCode, titleLink } = treeNode.dataRef
      const query = {
        parentId: id,
        parentCode: nodeCode
      }
      return api[this.urlObject.get](query).then(res => {
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          treeNode.dataRef.children = this.genTreeNode(data, titleLink)
          this.treeData = [...this.treeData]
        }
      })
    },
    genTreeNode (data, titleLink) {
      return data.map(item => {
        const { nodeName, nodeCode, id, childNodeNum, level } = item
        return {
          id,
          idLink: `${nodeCode}${id};`,
          titleLink: titleLink ? `${titleLink} / ${nodeName}` : nodeName,
          // value就是idLink
          value: id,
          // title: nodeName,
          title: nodeName,
          level,
          nodeCode,
          isLeaf: childNodeNum === 0,
        }
      })
    },
    fillterFUN (searchVal, treeNode) {
      return (treeNode.data.props.title && treeNode.data.props.title.includes(searchVal))
    },
    onSelect (checkedKeys, node) {
      const { nodeCode, level } = node.dataRef
      Object.assign(this.createTreeData, {
        nodeCode, level
      })
    },
    handleCancel () {
      this.createTreeData = {}
      this.dataSetVisible = false
    }
  }
}
</script>