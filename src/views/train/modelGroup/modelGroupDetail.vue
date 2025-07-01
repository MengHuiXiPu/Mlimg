<template>
  <div>
    <a-spin :spinning="loading">
      <a-card>
        <h1 style="margin-bottom: 20px">基础信息</h1>
        <div class="info">
          <a-statistic title="模型组名称" :value="modelGroupData.groupName" groupSeparator=""/>
          <a-statistic title="创建用户" :value="modelGroupData.createBy" groupSeparator=""/>
          <a-statistic title="创建时间" :value="modelGroupData.createTime | moment" />
        </div>
      </a-card>
      <a-card style="margin-top: 10px">
        <h1>子模型信息</h1>
        <a-table
          :columns="columns"
          :data-source="tableData"
          :pagination="pagination"
          @change="tableDataChange"
          :rowKey="(record, index) => index"
        >
        </a-table>
      </a-card>
    </a-spin>
  </div>
</template>

<script>
import { mixinHeader } from "@/utils/mixin"
import { modelGroup } from '@/api/modelManage'
export default {
  name: "modelGroupDetail",
  mixins: [mixinHeader],
  data () {
    return {
      loading: false,
      modelGroupData: {
        groupName: '模型组1',
        createBy: 'geek',
        createTime: 1605511961264,
        description: '模型备注信息'
      },
      tableData: [],
      columns: [
        {
          title: "子模型名称",
          dataIndex: "modelName",
          key: "modelName",
          ellipsis: true,
          align: 'center'
        },
        {
          title: "模型版本",
          dataIndex: "modelVersionLabel",
          ellipsis: true,
          key: "modelVersionLabel",
          align: 'center'
        },
        {
          title: "模型类型",
          dataIndex: "modelType",
          ellipsis: true,
          key: "modelType",
          align: 'center',
          customRender: (text, record) => {
            return text === 1 ? '目标检测' : '分类'
          }
        },
        {
          title: "算法类型",
          dataIndex: "tagType",
          ellipsis: true,
          key: "tagType",
          align: 'center'
        },
        {
          title: "算法名称(版本号)",
          dataIndex: "imageName",
          ellipsis: true,
          key: "imageName",
          align: 'center',
          customRender: (text, record) => {
            return `${text}(${record.imageVersionLabel})`
          }
        },
      ],
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
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.getModelGroup(to.query.id)
    })
  },
  mounted () {
  },
  methods: {
    async getModelGroup (params) {
      this.loading = true
      const res = await modelGroup.getModelGroup(params, 'get')
      this.loading = false
      if (!res.code === 0) return false
      this.modelGroupData = res.data
      this.tableData = this.modelGroupData.subModelList
    },
    tableDataChange (pagination) {
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
    }
  }
}
</script>

<style lang="less" scoped>
.info{
  &>*{
    width: 33%;
    float: left;
  }
}
</style>
