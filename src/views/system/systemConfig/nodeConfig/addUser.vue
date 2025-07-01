<template>
  <a-modal
    :visible="visible"
    :title="'选择用户'"
    width="1000px"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    @ok="save"
    @cancel="cancel"
    :maskClosable="false"
  >
    <div class="addUser-header">
      <span>组织：</span>
      <a-tree-select
        v-model="search.orgCode"
        tree-data-simple-mode
        allowClear
        :filterTreeNode="fillterFUN"
        style="width: 250px"
        :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
        :tree-data="treeData"
        placeholder="请选择组织"
        :load-data="onLoadData"
      />
      <span>姓名/用户名：</span>
      <a-input v-model="search.keyword" placeholder="请输入姓名/用户名"/>
      <a-button type="primary" @click="searchBefore">搜索</a-button>
    </div>
    <div class="addUser-content">
      <div class="addUser-content-left">
        <a-table
          :columns="columns"
          :data-source="tableData"
          :pagination="pagination"
          :row-selection="rowSelection"
          :loading="loading"
          @change="tableDataChange"
          :scroll="{ y: 360 }"
          :rowKey="record => record.uid"
        />
      </div>
      <div class="addUser-content-right">
        <div class="addUser-content-right-top">
          <span>已选择({{ userList.length }})</span>
          <a class="clear" @click="clearAll">清空</a>
          <a-input v-model="userSearch" placeholder="请输入姓名/用户名" @change="searchRightUser"></a-input>
        </div>
        <div class="addUser-content-right-bottom">
          <div class="user" v-for="(item, index) in userList" :key="item.uid" :hidden="item.hidden">
            <a-tag closable @close="delUser(item, index)">{{ item.name }}</a-tag>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>
<script>
import system from '@/api/system'
export default {
  name: "addUser",
  data () {
    return {
      loading: false,
      visible: false,
      userList: [],
      tableData: [],
      treeData: [],
      search: {
        keyword: '',
        orgCode: ''
      },
      searchData: {},
      userSearch: '',
      pagination: {
        total: 0,
        pageSize: 10,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"],
        showTotal: function (total) {
          return `共 ${total} 条`
        }
      },
      columns: [{
        title: "用户名",
        dataIndex: "uid",
        key: "uid",
      }, {
        title: "姓名",
        dataIndex: "name",
        key: "name",
      }, {
        title: "组织",
        dataIndex: "orgposRemark",
        key: "orgposRemark",
      }],
      rowSelection: {
        selectedRowKeys: [],
        onChange: this.onSelectChange
      }
    }
  },
  methods: {
    showModal (record) {
      this.visible = true
      this.userList = [ ...record ]
      this.$set(this.rowSelection, 'selectedRowKeys', this.userList.map(item => item.uid))
      this.getUserList()
      this.getOrginList('', true)
    },
    searchBefore () {
      this.searchData = JSON.parse(JSON.stringify(this.search))
      this.pagination.current = 1
      this.getUserList()
    },
    async getUserList () {
      const { current, pageSize } = this.pagination
      const params = {
        pageNo: current,
        limit: pageSize,
        ...this.searchData
      }
      this.loading = true
      const res = await system.user.getUserList(params)
      this.loading = false
      if (res.code !== 0) return false
      this.tableData = res.data.records
      this.$set(this.pagination, 'total', res.data.total)
    },
    async getOrginList (val, isFirst) {
      const params = {
        code: val || '00000000',
        status: 1,
        dataSources: 0
      }
      const res = await system.user.getOrginList(params)
      if (res.code !== 0) return false
      console.log(res)
      if (isFirst) {
        this.treeData = this.genTreeNode(res.data)
      }
    },
    genTreeNode (data) {
      console.log(data)
      return data.map(item => {
        const { code, name, id, leaf } = item
        return {
          id,
          value: code,
          title: name,
          isLeaf: leaf
        }
      })
    },
    async onLoadData (treeNode) {
      console.log(treeNode)
      const { value } = treeNode.dataRef
      const query = {
        code: value,
        status: 1,
        dataSources: 0
      }
      return system.user.getOrginList(query).then(res => {
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          treeNode.dataRef.children = this.genTreeNode(data)
          this.treeData = [...this.treeData]
        }
      })
    },
    fillterFUN (searchVal, treeNode) {
      return treeNode.data.props.title.includes(searchVal)
    },
    tableDataChange (pagination) {
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
      this.getUserList()
    },
    save () {
      this.$emit('getUserList', this.userList)
      this.cancel()
    },
    cancel () {
      this.$set(this.rowSelection, 'selectedRowKeys', [])
      this.$set(this.pagination, 'current', 1)
      this.visible = false
    },
    delUser (record, _index) {
      this.userList.splice(_index, 1)
      let rowIndex = null
      this.rowSelection.selectedRowKeys.forEach((item, index) => {
        if (item === record.uid) rowIndex = index
      })
      this.rowSelection.selectedRowKeys.splice(rowIndex, 1)
    },
    clearAll () {
      this.userList = []
      this.$set(this.rowSelection, 'selectedRowKeys', [])
    },
    onSelectChange (selectedRowKeys, selectedRows) {
      this.$set(this.rowSelection, 'selectedRowKeys', selectedRowKeys)
      const userList = JSON.parse(JSON.stringify(this.userList))
      userList.forEach((item, index) => {
        if (selectedRowKeys.filter(user => user === item.uid).length === 0) {
          this.userList = this.userList.filter(child => child.uid !== item.uid)
        }
      })
      const arr = selectedRows.filter(item => {
        return this.userList.filter(user => user.uid === item.uid).length === 0
      })
      this.userList.push(...arr)
    },
    searchRightUser () {
      this.userList.forEach(item => {
        if (!(item.uid.includes(this.userSearch) || item.name.includes(this.userSearch))) {
          item.hidden = true
        } else {
          item.hidden = false
        }
      })
    }
  }
}
</script>

<style scoped lang="less">
.addUser-header{
  padding-bottom: 10px;
  overflow: hidden;
  border-bottom: 1px solid #ccc;
  &>*{
    float: left;
    margin-right: 10px;
    line-height: 30px;
  }
  .ant-input{
    width: 250px;
  }
}
.addUser-content{
  overflow: hidden;
  height: 455px;
  padding-top: 10px;
  & > * {
    float: left;
    height: 100%;
  }
  &-left{
    padding-right: 10px;
    width: 75%;
  }
  &-right{
    // float: left;
    width: 25%;
    &-top{
      background: #f1f1f1;
      padding: 10px;
       & > span, & > a{
        line-height: 40px;
      }
      .clear{
        cursor: pointer;
        float: right;
      }
    }
    &-bottom{
      height: calc(100% - 90px);
      border: 1px solid #f1f1f1;
      padding: 10px;
      overflow-y: auto;
      .user{
        float: left;
        margin-bottom: 10px;
      }
    }
  }
}
</style>
