<template>
  <step-layout>
    <template slot="left">
      <div style="width: 100%;padding: 0 10px">
        <tree
          :tabActiveKey="tabActiveKey"
          :getDataParam="{ taskStatus: this.tabActiveKey === '1' ? '2' : '' }"
          :url-object="treeApi"
          @searchData="getDataList"
          :total="total"
          :isHover="false"
        ></tree>
      </div>
    </template>
    <template slot="right">
      <div class="right-content">
        <a-table
          class="table-content"
          :rowKey="(record)=>record.id"
          :row-selection="rowSelection"
          @change="tableDataChange"
          @expand="getChildren"
          :columns="columns"
          :data-source="data"
          :pagination="pagination"
          :loading="loading"
          :expandedRowKeys="expandedRowKeys"
        >
          <span
            slot="taskStatus"
            slot-scope="text"
          >
            {{ text === 2 ? '完成' : '未完成' }}
          </span>
          <span slot="imageName" slot-scope="text, record">
            {{ `${text}(${record.imageVersionLabel})` }}
          </span>
        </a-table>
      </div>
    </template>
    <template slot="bottom">
      <a-button type="primary" @click="nextStep">下一步</a-button>
      <a-button style="margin-left: 10px;" @click="cancel">取消</a-button>
    </template>
  </step-layout>
</template>

<script>
import StepLayout from '@/components/StepLayout'
import tree from "@/components/tree"
import { getParams } from '@/utils/util'
import { getModelTableList, modelVersion } from "@/api/modelManage"
import { mapState } from 'vuex'
import { mixinHeader } from "@/utils/mixin"
export default {
  name: 'Step1',
  mixins: [mixinHeader],
  components: {
    StepLayout,
    tree,
  },
  props: {
    tabActiveKey: {
      default: '1',
      type: String
    }
  },
  data () {
    return {
      loading: false,
      data: [],
      columns: [
        {
          title: '模型名称',
          ellipsis: true,
          dataIndex: "modelName",
          width: 200
        },
        {
          title: '版本号',
          ellipsis: true,
          dataIndex: 'versionLabel',
          width: 90
        },
        {
          title: "算法名称",
          ellipsis: true,
          dataIndex: "imageName",
          scopedSlots: { customRender: "imageName" }
        },
        {
          title: "算法类型", // 标注类型
          dataIndex: "tagType",
          width: 90
        },
        {
          title: "训练状态",
          dataIndex: "taskStatus",
          scopedSlots: { customRender: "taskStatus" },
          width: 90
        },
        {
          title: "创建时间",
          dataIndex: "createTime",
        },
      ],
      expandedRowKeys: [],
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
      treeApi: {
        search: "getModelTreeList",
        add: "savaModelTreeList",
        edit: "editModelTreeList",
        delete: "deleteModelTreeList"
      },
      total: 0
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.getDataList({ isFirst: true })
    })
  },
  computed: {
    ...mapState({
        modelId: state => state.offline.modelId,
    }),
    rowSelection () {
      return {
        onChange: (selectedRowKeys, selectedRows) => {
          // console.log("selectedRows++++++: ", selectedRows);
          const modelId = selectedRows[0].id
          const tagType = selectedRows[0].tagType
          const algorithmId = selectedRows[0].imageId
          this.$store.commit('setmodelIdandtagType', { modelId, tagType, algorithmId })
          this.$store.commit('setOfflinedlId', [])
        },
        type: 'radio',
        selectedRowKeys: [this.modelId]
      }
    },
  },
  methods: {
    async getDataList (param) {
      const params = getParams(param, this, "model")
      // 按后台要求增加该参数
      params.addType = 1
      const responseData = await getModelTableList({ ...params, taskStatus: this.tabActiveKey === '1' ? '2' : '' })
      if (responseData.code === 0) {
        this.loading = false
        this.data = responseData.data.records.map(item => {
          item.children = item.versionCounts > 1 ? [] : undefined
          return item
        })
        this.pagination.total = responseData.data.total
        if (param?.isFirst) {
          this.total = responseData.data.total
        } else {
          getModelTableList({ taskStatus: '2' }).then(res => {
            this.total = res.data.total
          })
        }
      }
    },
    async getChildren (expanded, record) {
      if (!expanded) {
        this.expandedRowKeys = []
        return false
      } else {
        this.expandedRowKeys = [record.id]
      }
      // 当状态为展开时，获取当前算法的所有版本
      this.loading = true
      const res = await modelVersion.getImageVersionList({ sourceVersionId: record.sourceVersionId })
      this.loading = false
      if (res.code !== 0) return false
      record.children = res.data.filter(item => {
        return item.id !== item.sourceVersionId
      })
    },
    nextStep () {
      if (this.modelId) {
        this.$emit('nextStep')
      } else {
        this.$message.error('请选择模型')
      }
    },
    cancel () {
      this.$emit('cancel')
    },
    tableDataChange (pagination) {
      this.getDataList({
        pageSize: pagination.pageSize,
        pageIndex: pagination.current,
      })
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
    },
  },

}
</script>

<style lang="less" scoped>
.select-style{
  width: 100%;
}
.right-content{
  height: 100%;
  padding: 0 20px 0;
  .table-content{
    margin-left: 0;
    margin-right: 0;
  }
}
/deep/ .splitter-pane.vertical.splitter-paneR{
  min-height: 100%;
  height: auto;
  border-left: 1px solid rgba(0,0,0,0.2);
}
/deep/ .vue-splitter-container{
  min-height: calc(100vh - 230px);
}
/deep/ .step-content .bottom{
  padding-top: 10px;
}
</style>
