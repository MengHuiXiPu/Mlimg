<template>
  <div class="tree-content">
    <div class="tree-header" @mouseenter="showAdd = true" @mouseleave="showAdd = false">
      <span class="slot-type">
        <a-icon type="home" @click="activeData" style="margin-right: 5px; font-size: 12px"></a-icon>
      节点分类</span>
      <span v-if="isHover ? !showAdd : true">{{ total }}</span>
      <a-icon v-if="(isHover ? showAdd : false) && $store.state.request.btnAuth && $store.state.request.btnAuth !== null && $store.state.request.btnAuth.includes(auth.add)" type="plus-square" @click="append" :style="{ color: '#2F54EB' }" />
    </div>
    <a-tree
      :treeData="treeData"
      :replaceFields="replaceFields"
      :expanded-keys="expandedKeys"
      :auto-expand-parent="autoExpandParent"
      @expand="onExpand"
      @load="load"
      :loadedKeys="loadedKeys"
      :selectedKeys="selectedKeys"
      :load-data="onLoadData"
      @select="handleSelect"
    >
      <template slot="custom" slot-scope="item">
        <div class="custom-tree-node">
          <a-tooltip placement="top">
            <template slot="title">
              <span>{{ item.nodeName }}</span>
            </template>
            <!--节点名-->
            <div class="custom-tree-node-name">{{ item.nodeName }}</div>
          </a-tooltip>
          <!--节点内数据集数量-->
          <!--根据isHover值不同应用不同的CSS类，若item.userModel>0则显示内容-->
          <span :class="isHover ? 'childNum-hover' : 'childNum'">{{ item.userModel > 0 ? item.userModel : '' }}</span>
          <a-dropdown
            :trigger="['click']"
            overlay-class-name="meun-css"
            :overlayStyle="{'width':'150px'}"
            :class="isHover ? 'action':'action-hover' "
            :getPopupContainer="
              triggerNode => {
                return triggerNode.parentNode || document.body;
              }
            "
          >
            <a class="ant-dropdown-link" @click.stop="e => e.preventDefault()">
              <a-icon type="down" />
            </a>
            <!--展开列表-->
            <a-menu slot="overlay">
                <a-menu-item v-if="$store.state.request.btnAuth && $store.state.request.btnAuth !== null && $store.state.request.btnAuth.includes(auth.add)" key="1" @click="append(item)">新建节点</a-menu-item>
                <a-menu-item v-if="$store.state.request.btnAuth && $store.state.request.btnAuth !== null && $store.state.request.btnAuth.includes(auth.rename)" key="2" @click="edit(item)">重命名</a-menu-item>
                <a-menu-item v-if="$store.state.request.btnAuth && $store.state.request.btnAuth !== null && $store.state.request.btnAuth.includes(auth.delete)"
                             key="3"
                             @click="remove(item)">删除</a-menu-item>
                <!--v-show="!item.userModel && !item.childNodeNum"-->
            </a-menu>
          </a-dropdown>
        </div>
      </template>
    </a-tree>
    <a-modal v-model="dataSetVisible" :title="dataSetTitle" @ok="handleOk" :maskClosable="false">
      <div class="slot-name">
        <span class="name">
          <span style="color:red">*</span>节点名称:
        </span>
        <a-input placeholder="节点名称" v-model="name" :maxlength="40" />
      </div>
    </a-modal>
  </div>
</template>

<script>
import * as api from "@/api/dataCenter"
export default {
  name: "Tree",
  props: {
    urlObject: {
      type: Object,
      default: () => {}
    },
    auth: {
      type: Object,
      default: () => {
        return {
        }
      }
    },
    getDataParam: {
      type: Object,
      default: null
    },
    tabActiveKey: {
      type: String,
      default: ""
    },
    total: {
      type: Number,
      default: 0
    },
    isHover: {
      type: Boolean,
      default: true
    },
    hasImageStatus: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    tabActiveKey () {
      this.loadedKeys = []
      this.selectedKeys = []
      this.onLoadData()
    }
  },
  data () {
    return {
      node: null,
      rowData: {},
      treeData: [],
      loadedKeys: [],
      selectedKeys: [],
      dataSetVisible: false,
      dataSetTitle: "",
      name: "",
      showAdd: false,
      replaceFields: {
        title: "nodeName",
        key: "id"
      },
      autoExpandParent: true,
      expandedKeys: [],
    }
  },
  mounted () {
    this.onLoadData()
  },
  methods: {
    load (loadedKeys) {
      this.loadedKeys = loadedKeys
    },
    onExpand (expandedKeys, e) {
      this.expandedKeys = expandedKeys
      this.autoExpandParent = false
    },
    genTreeNode (data) {
      return data.map(item => {
        return {
          ...item,
          scopedSlots: { title: "custom" },
          isLeaf: item.childNodeNum === 0,
          key: item.id,
        }
      })
    },
    activeData () {
      this.loadedKeys = []
      this.selectedKeys = []
      this.onLoadData()//重置存储已加载和已选中的树节点key值，然后加载树形结构
      this.$emit("searchData", {//触发自定义事件
        // isFirst: true,
        dataRef: {
          nodeId: 0,
          nodeCode: ''
        }
      })
    },
    onLoadData (treeNode) {//当前树节点
      const params = {
        parentId: treeNode ? treeNode.dataRef.id : 0,
        parentCode: treeNode ? treeNode.dataRef.nodeCode : "",
        dlType: this.tabActiveKey ? this.tabActiveKey : null
      }
      if (this.getDataParam?.dlTagType) params.dlTagType = this.getDataParam.dlTagType
      if (this.getDataParam?.taskStatus) params.taskStatus = this.getDataParam.taskStatus
      if (this.hasImageStatus) params.imageStatus = 1
      if (treeNode?.isLeaf) {
        return ;
      }
      return api[this.urlObject.search](params).then(res => {//调用api获取树结构数据
        if (res.code === 0) {
          if(treeNode?.isLeaf === true) {
            return ;
          }
          if (treeNode) {
            treeNode.dataRef.children = this.genTreeNode(res.data)//遍历子树节点，将当前节点子树设为函数返回值
            this.treeData = [...this.treeData]
            console.log("treeData: ", this.treeData);
          } else {
            this.expandedKeys = []
            this.treeData.length = 0
            this.autoExpandParent = true
            this.treeData = this.genTreeNode(res.data)
          }
        }
      })
    },
    // 新增或者删除时需要更新节点数量
    reloadData (params) {
      const param = {//通过params参数设置param的属性
        parentId: params ? params.dataRef.parentId : 0,
        dlType: this.tabActiveKey ? this.tabActiveKey : null
      }
      api[this.urlObject.search](param).then(res => {//调用api获取数据
        if (res.code === 0) {
          this.autoExpandParent = true
          if (params) {
            this.treeData.forEach(item => {//若params不为空，遍历treeData，更新与params对应的userModel属性
              if (item.id === params.dataRef.id) {
                item.userModel = res.data.filter(key => {
                  return key.id === item.id
                })[0].userModel
              }
            })
          } else {
            res.data.forEach(item => {
              this.treeData.forEach(tree => {
                if (item.id === tree.id) {
                  tree.userModel = item.userModel
                }
              })
            })
          }
        }
      })
      this.$forceUpdate()//强制更新组件
    },
    handleSelect (selectedKeys, data) {
      this.selectedKeys = selectedKeys
      if (!data) return false
      const path = data.nativeEvent.path || (data.nativeEvent.composedPath && event.composedPath())
      if (path[0].nodeName === "DIV") {
        this.$emit("searchData", {
          nodeId: data.node.dataRef.nodeCode,
          isTree: true,
          dataRef: data.node.dataRef,
          dataType: 'select'
        })
      } else {
        this.node = data
      }
    },

    handleAction (type, params) {
      // todos 每次操作后，应发送查询请求：相当于点击当前节点的父节点操作，然后将查询结果push到父节点children
      switch (type) {
        case "new"://添加操作
          if (this.rowData.addOrEditType === 2) {
            const { dataRef } = this.node.node
            const { dataRef: parentDataRef } = this.node.node.$parent

            dataRef.isLeaf = false
            dataRef.childNodeNum += 1
            this.expandedKeys.push(dataRef.id)

            dataRef.children =
              !dataRef?.children || !dataRef?.children?.length === 0
                ? []
                : dataRef?.children

            dataRef.children.push({
              ...params,
              childNodeNum: 0,
              isLeaf: true,
              scopedSlots: { title: "custom" }
            })

            this.treeData = [...this.treeData]
          } else {
            // 这是添加根节点
            this.treeData.push({
              ...params,
              childNodeNum: 0,
              isLeaf: true,
              scopedSlots: { title: "custom" }
            })
          }
          break
        case "edit"://编辑操作
          const { dataRef } = this.node.node
          dataRef.nodeName = params
          break
        case "del"://删除操作
          api[this.urlObject.delete](params).then(res => {
            // 删除的时候判断父节点的children，0则取消展开和设为isLeaf
            if(res.code !== 0) {
              this.$message.error(res.msg);
            }
            if (res.code === 0 && this.node) {
              const delNodeId = this.node.node.dataRef.id
              const { dataRef: parentDataRef } = this.node.node.$parent
              // 删除根节点
              if (!parentDataRef) {
                this.treeData = this.treeData.filter((item, i) => {
                  return item.id !== delNodeId
                })
                return
              }

              // 从父节点里面删除当前节点
              parentDataRef.children = parentDataRef?.children.filter(
                (item, i) => {
                  return item.id !== params
                }
              )

              // 判断父节点是否有children，没有就设置为叶子节点
              if (
                !parentDataRef.children ||
                parentDataRef.children.length === 0
              ) {
                parentDataRef.isLeaf = true
                parentDataRef.childNodeNum = 0
                const index = this.expandedKeys.indexOf(parentDataRef.id)
                if (index > -1) {
                  this.expandedKeys.splice(index, 1)
                }
              } else {
                parentDataRef.isLeaf = false
                parentDataRef.childNodeNum = parentDataRef.childNodeNum - 1
              }

              this.treeData = [...this.treeData]
              if(res.msg === "success"){
                this.$message.info("删除成功");
              }else{
                this.$message.info(res.msg);
              }
            }
          }).catch(e => {
            console.log(e)
          }) 
          break
      }
    },

    append (rowData) {
      this.name = ""
      this.dataSetVisible = true
      this.dataSetTitle = "新建节点"
      rowData.addOrEditType = rowData?.nodeName ? 2 : 1
      this.rowData = { ...rowData }
    },
    remove (item) {
        const that = this
        if (!item.userModel && !item.childNodeNum) {
            this.$confirm({
                content: "确定要删除吗？",
                cancelText: '取消',
                okText: '确定',
                onOk() {
                    that.handleAction("del", item.id)
                },
                onCancel() { }
            })
        }
        else {
            this.$confirm({
                content: "删除可能导致数据损失，请删除当前所有数据集和子节点。",
                cancelText: '取消',
                onCancel() {}
            })
        }
    },
    edit (rowData) {
      this.dataSetVisible = true
      this.dataSetTitle = "编辑节点"
      this.name = rowData.nodeName
      rowData.addOrEditType = 3
      this.rowData = { ...rowData }
    },

    async handleOk () {
      if (!this.name) {
        this.$message.error("请输入节点名称！")
        return
      }
      let params
      if (this.rowData.addOrEditType === 3) {
        params = {
          parentId: this.rowData.parentId ? Number(this.rowData.parentId) : 0,
          nodeName: this.name,
          id: this.rowData.id,
          nodeCode: this.rowData.nodeCode,
          level: this.rowData.level + 1
        }
      } else {
        params = {
          level:
            this.rowData.addOrEditType === 2
              ? Number(this.rowData.level + 1)
              : 1,
          parentId:
            this.rowData.addOrEditType === 2 ? Number(this.rowData.id) : 0,
          parentCode:
            this.rowData.addOrEditType === 2 ? this.rowData.nodeCode : "0",
          nodeName: this.name
        }
      }
      const data = await api[ this.rowData.addOrEditType === 3 ? this.urlObject.edit : this.urlObject.add ](params)
      if (data.code === 0) {
        if (this.rowData.addOrEditType === 3) {
          this.handleAction("edit", this.name)
        } else {
          this.handleAction("new", data.data)
        }
        this.dataSetVisible = false
      }
    }
  }
}
</script>

<style scoped lang="less">
.tree-content {
  display: inline-block;
  width: 100%;
  /deep/ .ant-tree li .ant-tree-node-content-wrapper {
    width: calc(100% - 24px);
  }
  ///deep/ .tcl-tree li .tcl-tree-node-content-wrapper {
  //  width: calc(100% - 24px);
  //}
}
.icon {
  margin: 0px 10px;
  color: "#08c";
}
.custom-tree-node {
  display: flex;
  width: 100%;
  position: relative;
  .custom-tree-node-name {
    width: calc(100% - 15px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .action {
    display: none;
  }
  .action-hover{
     display: none;
  }
}
.custom-tree-node:hover {
  .action-hover{
     display: none;
  }
  .childNum-hover {
    display: none;
  }
  .childNum {
    display: inline-block;
  }
  .action {
    display: inline-block;
  }
}
.tree-header {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  margin-right: 0px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e6e7ea;
  .slot-type {
    font-size: 12px;
    font-weight: 500;
    color: #09102f;
  }
}
.meun-css {
  width: 500px;
  .ant-dropdown-menu-item {
    font-size: 12px;
    font-weight: 400;
    color: #09102f;
    line-height: 12px;
    padding: 10px;
  }
}
.slot-name {
  margin-left: 20px;
  display: flex;
  .name {
    text-align: center;
    margin-right: 10px;
    line-height: 32px;
    color: #09102f;
  }
  .ant-input {
    width: 350px;
  }
}
</style>
