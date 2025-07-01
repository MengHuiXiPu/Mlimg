<template>
  <div>
    <a-header
      :auth="{ add: 'model-list-add' }"
      :tab-list="tabList"
      :tab-active-key="tabActiveKey"
      :placeholderText="'请输入模型组名称'"
      @tab-change="tabOnChange"
      @create="handCreate"
      @reload="handReload"
      @search="handSearch"
    ></a-header>

    <a-table
      v-resize
      :columns="columns"
      :data-source="tableData"
      :pagination="pagination"
      :loading="loading"
      @change="tableDataChange"
      :rowKey="record => record.id"
    >
      <!-- <span slot="title">
        <span>模型组1名称</span>
      </span> -->
      <span slot="groupName" slot-scope="text,record">
        <span
          class="image-name"
          :title="text"
          @click="toImageDetail(record)">{{ text }}</span>
      </span>
      <span slot="createTime" slot-scope="text">
        {{ text | moment }}
      </span>
      <span slot="operate" slot-scope="record">
        <a @click="() => handleEdit(record)" style="margin-right: 5px">编辑</a>
        <a @click="() => handleRelease(record)">发布</a>
        <a style="margin-left: 5px" @click="handleDelete(record)">删除</a>
      </span>
    </a-table>
    <add-model-group ref="addModelGroup" @getDataList="getDataList"></add-model-group>
    <release-model-group
      ref="releaseModelGroup"
      :parentData.sync="parentData"
      :pagination="pagination"
      :type="1"
      @getDataList="getDataList"
      ></release-model-group>
  </div>
</template>

<script>
import { mixinHeader } from "@/utils/mixin"
import { modelGroup } from '@/api/modelManage'
import { getTaskList } from "@/api/appCenter"
import moment from 'moment'
export default {
  name: "modelGroup",
  mixins: [mixinHeader],
  components: {
    addModelGroup: () => ({ component: import('./addModelGroup') }),
    releaseModelGroup: () => ({ component: import('../model/components/ReleaseDialog') })
  },
  data () {
    return {
      tabActiveKey: '1',
      status: ['未发布', '已发布'],
      tabList: [
        { key: "1", name: "模型组列表" }
      ],
      columns: [{
        title: '模型组名称',
        dataIndex: "groupName",
        key: "groupName",
        ellipsis: true,
        scopedSlots: { customRender: "groupName" },
        align: 'center',
        width: '30%'
      },
      {
        title: "子模型",
        dataIndex: "childrenModel",
        ellipsis: true,
        key: "childrenModel",
        align: 'center',
        width: '30%'
      },
      {
        title: "任务状态",
        dataIndex: "isPublish",
        key: "isPublish",
        ellipsis: true,
        align: 'center',
        width: 100,
        customRender: (text) => {
          if (text === 0) text = 1
          return this.status[text - 1]
        }
      },
      {
        title: "创建时间",
        dataIndex: "createTime",
        key: "createTime",
        scopedSlots: { customRender: "createTime" },
        align: 'center',
        width: 150,
      },
      {
        title: "操作",
        dataIndex: "",
        key: "x",
        scopedSlots: { customRender: "operate" },
        align: 'center'
      }],
      tableData: [],
      parentData: {},
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
      loading: false
    }
  },
  mounted () {
    this.getDataList()
  },
  methods: {
    tabOnChange () {},
    tableDataChange (pagination, filters, sorter) {
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
      this.getDataList({
        limit: pagination.pageSize,
        groupName: this.search,
        pageNo: pagination.current
      })
    },
    handleEdit (record) {
      this.$refs.addModelGroup.showModal(record)
    },
    handleRelease (record) {
      this.parentData = record
      this.$nextTick(() => {
        this.$refs.releaseModelGroup.showDialog()
      })
    },
    async handleDelete (record) {
      let taskList = []
      if (record.isPublish === 2) {
        const res = await getTaskList({
          limit: 9999999,
          modelId: record.id,
          pageNo: 1
        })
        if (res.code === 0) {
          taskList = res.data.records
        }
      }
      const content = taskList.length === 0 ? "此操作将永久删除，请确认是否删除?" : this.renderTaskList(taskList)
      this.$confirm({
        title: taskList.length === 0 ? `确定要删除 ${record.groupName} 吗?` : '提示',
        content,
        cancelText: '取消',
        okText: '确定',
        width: 600,
        okButtonProps: {
          props: { disabled: taskList.length !== 0 },
        },
        onOk: () => {
          modelGroup.getModelGroup(record.id, 'delete')
            .then((res) => {
              if (res.code === 0) {
                this.$message.success('删除成功!')
                if (this.tableData.length === 1 && this.pagination.total !== 1) this.pagination.current--
                this.handReload()
              }
            })
        },
        onCancel () {}
      })
    },
    handReload () {
      this.getDataList({
        limit: this.pagination.pageSize,
        groupName: this.search,
        pageNo: this.pagination.current
      })
    },
    handSearch (val) {
      this.search = val
      this.getDataList({
        groupName: val
      })
    },
    handCreate () {
      this.$refs.addModelGroup.showModal()
    },
    toImageDetail (record) {
      this.$router.push({
        path: "/train/modelGroup/detail",
        query: { id: record.id }
      })
    },
    async getDataList (params) {
      this.loading = true
      const res = await modelGroup.getModelGroupList(params)
      this.loading = false
      if (res.code !== 0) return false
      this.tableData = res.data.records.map(item => {
        let childrenModel = ''
        item.subModelList.filter(child => {
          childrenModel += child.modelName + ':' + child.modelVersionLabel + ';'
        })
        return {
          ...item,
          childrenModel
        }
      })
      this.pagination.total = res.data.total
    },
    renderTaskList (taskList) {
      const task = taskList.map(item => {
        return <p>
          <span class="taskName">{ item.taskName }</span>
          <span class="taskTime">{ moment(item.createTime).format('YYYY-MM-DD HH:mm:ss') }</span>
        </p>
      })
      return <div class="task">
        <h4>当前模型已发布下列任务组，请先删除下列任务组再删除该模型组：</h4>
        <div class="taskList">
          <p>
            <span class="taskName">任务组名称</span>
            <span class="taskTime">发布时间</span>
          </p>
          { task }
        </div>
      </div>
    },
  }
}
</script>

<style lang="less" scoped>
.taskList{
  overflow-y: auto;
  max-height: 250px;
  .taskName,.taskTime{
    display: inline-block;
    width: 50%
  }
}
</style>
