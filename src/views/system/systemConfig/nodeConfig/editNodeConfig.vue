<template>
  <a-modal
    :visible="visible"
    :title="'节点权限配置'"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    @ok="save"
    @cancel="cancel"
    :maskClosable="false"
  >
<!--    :col="1"-->
<!--    :row="20"-->
    <a-form-model
      :model="form"
      ref="ruleForm"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      :rules="rules"
      layout="horizontal"
    >
      <a-form-model-item label="节点类型" prop="nodeType">
        <a-select v-model="form.nodeType" @change="getTree" :disabled="Boolean(form.id)">
          <a-select-option v-for="item in nodeTypeList" :key="item.value" :value="item.value">
            {{ item.text }}
          </a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item label="节点" prop="nodeDetail">
        <a-tree-select
          showSearch
          allowClear
          :disabled="!form.nodeType"
          :filterTreeNode="fillterFUN"
          v-model="form.nodeDetail"
          :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
          :tree-data="treeData"
          :load-data="onLoadData"
          placeholder="请选择节点"
          @select="onSelect"
        />
      </a-form-model-item>
      <a-form-model-item label="关联用户" prop="relationUser">
        <a-button size="small" @click="addUser">
          <a-icon type="plus" />添加用户
        </a-button>
        <a-select v-model="form.relationUser" placeholder="请选择关联用户" mode="multiple" @deselect="delUser">
          <a-select-option v-for="item in userList" :key="item.uid" :value="item.uid">
            {{ item.name }}
          </a-select-option>
        </a-select>
      </a-form-model-item>
    </a-form-model>
    <addUser ref="addUser" :userList="userList" @getUserList="getUserList"></addUser>
  </a-modal>
</template>
<script>
import {
  getTreeList,
  getModelTreeList,
  getAppTaskTreeList
} from '@/api/dataCenter'
import addUser from './addUser'
import system from '@/api/system'
export default {
  name: "editNodeConfig",
  components: {
    addUser
  },
  data () {
    return {
      loading: false,
      visible: false,
      form: {},
      oldForm: {},
      rules: {
        nodeType: [{ required: true, message: '请选择节点类型', trigger: 'change' }],
        nodeDetail: [
          { required: true, message: '请选择节点', trigger: 'change' },
          { required: true, validator: this.checkNode,  trigger: 'change' }
        ],
        relationUser: [{ required: true, message: '请选择关联用户', trigger: 'change' }]
      },
      treeData: [],
      api: {
        getTreeList,
        getModelTreeList,
        getAppTaskTreeList
      },
      userList: []
    }
  },
  props: {
    nodeTypeList: {
      require: true,
      type: Array,
      default: () => []
    }
  },
  computed: {
    treeApi () {
      const arr = this.nodeTypeList.filter(item => item.value === this.form.nodeType)
      return arr.length > 0? this.api[arr[0].api] : false
    }
  },
  methods: {
    showModal (record) {
      this.visible = true
      if (record?.id) {
        this.oldForm = JSON.parse(JSON.stringify(record))
        this.form = {
          ...record,
          relationUser: record.relationUser.split(',')
        }
        this.userList = this.form.relationUser.map((item, index) => {
          return {
            uid: item,
            name: record.relationUserNick.split(',')[index]
          }
        })
        this.getTree()
        // this.userList = this.form.relationUser.
      }
    },
    getTree () {
      this.loading = true
      this.treeData = []
      this.treeApi && this.treeApi({ parentId: "0" }).then(res => {
        this.loading = false
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          this.treeData = this.genTreeNode(data)
        }
      })
    },
    async save () {
      this.$refs.ruleForm.validate(async valid => {
        if (!valid) {
          return false
        } else {
          const form = {
            ...this.form,
            relationUser: this.form.relationUser.join(),
            relationUserNick: this.userList.map(item => item.name).join(),
            nodeTypeDesc: this.nodeTypeList.filter(item => item.value === this.form.nodeType)[0].text
          }
          const method = form.id ? 'put' : 'post'
          this.loading = true
          const res = await system.nodeConfig.editNodeConfig(form, method)
          this.loading = false
          if (res.code !== 0) return false
          this.$message.success('添加成功')
          this.$emit('getDataList')
          this.cancel()
        }
      })
    },
    cancel () {
      this.visible = false
      this.form = {}
      this.oldForm = {}
      this.userList = []
      this.treeData = []
      this.$refs.ruleForm.clearValidate()
    },
    fillterFUN (searchVal, treeNode) {
      return treeNode.data.props.title.includes(searchVal)
    },
    onLoadData (treeNode) {
      const { id, nodeCode, titleLink } = treeNode.dataRef
      const query = {
        parentId: id,
        parentCode: nodeCode
      }
      return this.treeApi(query).then(res => {
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          treeNode.dataRef.children = this.genTreeNode(data, titleLink)
          this.treeData = [...this.treeData]
        }
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
          // title: nodeName,
          title: nodeName,
          nodeCode,
          isLeaf: childNodeNum === 0,
        }
      })
    },
    onSelect (checkedKeys, node) {
      this.$nextTick(() => {
        this.$set(this.form, 'nodeDetail', node.dataRef.titleLink)
      })
      this.$set(this.form, 'nodeId', node.dataRef.idLink)
    },
    addUser () {
      this.$refs.addUser.showModal(this.userList)
    },
    getUserList (userList) {
      this.userList = JSON.parse(JSON.stringify(userList))
      this.$set(this.form, 'relationUser', this.userList.map(item => item.uid))
    },
    delUser (val) {
      const userList = JSON.parse(JSON.stringify(this.userList))
      userList.forEach((item, index) => {
        if (item.uid === val) {
          this.userList.splice(index, 1)
        }
      })
    },
    async checkNode (rule, value, callback) {
      const params = {
        nodeType: this.form.nodeType,
        nodeId: this.form.nodeId
      }
      if (this.oldForm.nodeId === this.form.nodeId) return callback()
      const res = await system.nodeConfig.checkNodeExist(params)
      if (res.code !== 0) return callback()
      return res.data ? callback() : callback(new Error('当前类型下的节点权限数据已存在，请重新选择'))
    }
  }
}
</script>

<style scoped lang="less">
.ant-select-selection{
  max-height: 400px;
  overflow-y: auto;
}
</style>
