<template>
  <div class="app-container">
    <el-card class="box-card" shadow="never">
      <div slot="header" class="clearfix">
        <el-tooltip class="item" effect="dark" content="选择指定角色分配菜单" placement="top">
          <span class="role-span">目录列表</span>
        </el-tooltip>
        <!-- 向根目录添加目录节点 -->
        <el-button
          icon="el-icon-circle-plus-outline"
          style="float: right; padding: 6px 9px;"
          type="primary"
          @click="AddLevel0Directory"
          >新建根目录</el-button
        >
      </div>
      <el-tree
        ref="directoryTree"
        class="directory-tree"
        :data="treeData"
        :props="defaultProps"
        node-key="id"
        lazy
        :load="lazyLoad"
        :render-content="renderContent"
      />
    </el-card>
  </div>
</template>

<script>
import { getModelTreeList, savaModelTreeList,editModelTreeList, deleteModelTreeList  } from "@/api/dataCenter.js"
export default {
  name: '',
  data() {
    return {
      treeData: [],
      defaultProps: {
        label: 'nodeName',
        isLeaf: function (data, node) {
          return data.childNodeNum < 1
        }
      }
    }
  },
  methods: {
    // 懒加载节点
    lazyLoad(node, resolve) {
      if (node.level === 0) {
        return resolve(this.treeData);
      }
      const { id, nodeCode } = node.data
      getModelTreeList({
        parentId: id,
        parentCode: nodeCode
      }).then(res => {
        if(res.code == 0) {
          resolve(res.data || [])
        }else {
          resolve([])
        }
      })
    },
    // 向根目录添加节点
    async AddLevel0Directory() {
      try {
        const resopnse = await this.$prompt('请输入名称', '新建目录')
        if(!resopnse?.value) return this.$message.warning('未输入名称， 无法创建目录')
        const params = {
          level: 1,
          nodeName: resopnse.value,
          parentCode: "0",
          parentId: 0
        }
        const appendRes = await savaModelTreeList(params)
        if(appendRes.code == 0) { //刷新
          this.loadLevel0Data()
          this.$message.success("已保存")
        }
      } catch (error) {
        
      } 
    },
    // 初始化时，加载第一层节点
    loadLevel0Data() {
      getModelTreeList({ parentId: "0" }).then(res => {
        if (res.code === 0) {
          this.treeData = res.data || []
        }
      })
    },
    // 在某个节点下创建新的节点
    async append(event, targetNodeData, targetNode) {
      event.stopPropagation()
      try {
        const resopnse = await this.$prompt('请输入名称', '新建目录')
        if(!resopnse?.value) return this.$message.warning('未输入名称， 无法创建目录')
        const { id, nodeCode, level } = targetNodeData
        let params = {
          parentId: id,
          nodeName: resopnse.value,
          parentCode: nodeCode,
          level: level + 1
        }
        const appendRes = await savaModelTreeList(params)
        if(appendRes.code == 0) { //刷新/reload对应target 节点的数据
          this.$message.success("已保存")
          // 清空节点的子节点数据
          // targetNode.childNodes = [];
          targetNode.loaded = false; // 标记该节点为未加载状态
          // 重新加载节点 A 的子节点
          // this.$refs.directoryTree.store.load(targetNode, () => {
          targetNode.expand(); // 展开节点
          // });
        }
      } catch (error) {
        
      }
    },
    // 重命名目录
    async edit(event, targetNodeData, targetNode) {
      event.stopPropagation()
      try {
        const resopnse = await this.$prompt('请输入名称', '修改目录', {
          inputValue: targetNodeData.nodeName
        })
        if(!resopnse?.value) return this.$message.warning('未输入名称， 无法编辑目录')
        const { id, nodeCode } = targetNodeData
        let params = {
          nodeName: resopnse.value,
          id,
          nodeCode
        }
        const appendRes = await editModelTreeList(params)
        if(appendRes.code != 0) return
        this.$message.success("已保存")
        //刷新/reload对应target 节点的数据
        if(targetNodeData.level > 1) { 
          targetNode.parent.loaded = false; // 标记该节点为未加载状态
          // 重新加载节点 A 的子节点
          targetNode.parent.expand(); // 展开节点
        }else {
          this.loadLevel0Data()
        }
      } catch (error) {
        
      }
    },
    // 删除目录
    remove(event, targetNodeData) {
      event.stopPropagation()
      deleteModelTreeList(targetNodeData.id).then(res => {
        if(res.code == 0) {
          this.$refs.directoryTree.remove(targetNodeData)
          this.$message.success(`目录${targetNodeData.nodeName}已删除`)
        }
      })
    },
    // 自定义节点内容的render函数
    renderContent(h, { node, data, store }) {
      return (
        <span class="custom-tree-node">
          {/* {data.children.length ? <i class="el-icon-circle-plus-outline"></i> : null} */}
          <span class="node-label">{node.label}</span>
          <span>
            <el-button size="mini" type="text" icon="el-icon-circle-plus-outline" on-click={ ($event) => this.append($event, data, node) }>新增</el-button>
            <el-button size="mini" type="text" icon="el-icon-edit-outline" on-click={ ($event) => this.edit($event, data, node) }>编辑</el-button>
            <el-button size="mini" type="text" icon="el-icon-delete" on-click={ ($event) => this.remove($event, data) }>删除</el-button>
          </span>
        </span>);
    }
  },
  created () {
    this.loadLevel0Data()
  }
}
</script>

<style lang="less" scoped>
.directory-tree {
  ::v-deep .custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    padding-right: 8px;
    color: #333;
  }
  // 调整树节点的高度
  ::v-deep .el-tree-node__content{
    height: 40px;
  }
  ::v-deep .el-button--text{
    color: #0000ff;
    font-size: 13px;
  }
}
</style>
<style>
.el-button {
  outline: none!important;
}
</style>