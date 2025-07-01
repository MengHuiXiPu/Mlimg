<template>
  <div class="stepModelOffline2">
    <a-tabs v-model="tabActiveKey" @change="onTabChange">
      <a-tab-pane key="1" tab="图像训练集">
      </a-tab-pane>
      <a-tab-pane key="2" tab="图像题库集">
      </a-tab-pane>
    </a-tabs>
    <step-layout>
      <template slot="left">
        <div style="width: 100%;padding-left: 10px;padding-right: 10px">
          <tree
            :tabActiveKey="tabActiveKey"
            :getDataParam="{ taskStatus: 2 }"
            :url-object="trainingTreeApi"
            @searchData="getDataList"
            :total="total"
          ></tree>
        </div>
      </template>
      <template slot="right">
        <div class="right-content">
          <a-input-search
            placeholder="请输入数据集名称"
            style="width: 200px;margin-right: 30px"
            @change="onSearchChange"
            @search="onSearch"
          />未找到合适数据集？
          <a @click="handleToImageManage" href="javascript:;">新建数据集</a>
          <a-select
            :value="dlId"
            mode="multiple"
            style="width: 100%;margin: 10px 0;"
            placeholder="已选择数据集"
            @change="handleChange"
            option-label-prop="label"
          >
            <a-select-option v-for="item in dlItem" :key="item.id" :value="item.id" :label="item.dlName">
              {{ item.dlName }}
            </a-select-option>
          </a-select>
          <a-table
            v-resize
            class="table-content"
            :loading="loading"
            :rowKey="(record)=>record.id"
            :row-selection="rowSelection"
            @change="tableDataChange"
            :columns="columns"
            :data-source="tableData"
            :pagination="pagination"
          >
            <a slot="dlName" slot-scope="text, record">
              <a-tag
                color="#4aa6e8"
                style="zoom: 0.7; margin-right: 2px;border-radius: 10px;"
                :style="{ visibility: ['分割', '目标检测'].includes(record.dlTagType) ? '' : 'hidden' }">
                {{ record.markFileType === 1 ? 'JSON' : 'XML' }}
              </a-tag>
              {{ text }}
            </a>
          </a-table>
        </div>
      </template>
      <template slot="bottom">
        <a-button type="primary" @click="nextStep">下一步</a-button>
        <!-- <a-button type="primary" style="margin-right: 10px" @click="startTask" :loading="saveLoading">开始任务</a-button> -->
        <a-button style="margin-left: 10px;" @click="cancel">取消</a-button>
      </template>
    </step-layout>
  </div>
</template>

<script>
import StepLayout from "@/components/StepLayout"
import tree from "@/components/tree"
import { getDataSetList, getTargetType } from "@/api/dataCenter"
import { getParams } from '@/utils/util'
import { mapState } from 'vuex'
import { mixinHeader } from "@/utils/mixin"
import debounce from 'lodash.debounce'
export default {
  name: "Step2",
  mixins: [mixinHeader],
  components: {
    StepLayout,
    tree
  },
  data () {
    return {
      tableData: [],
      columns: [
        {
          title: '数据集名称',
          ellipsis: true,
          dataIndex: "dlName",
          scopedSlots: { customRender: "dlName" },
          width: '25%'
        },
        {
          title: "样本量",
          dataIndex: "sampleNum"
        },
        {
          title: "数据集路径",
          ellipsis: true,
          dataIndex: "dlRealDir"
        },
        {
          title: "创建时间",
          dataIndex: "createTime"
        }
      ],
      loading: false,
      saveLoading: false,
      dlTagTypeOpt: [],
      filterDlTagType: false,
      trainingTreeApi: {
        search: "getTreeList",
        add: "savaTreeList",
        edit: "editTreeList",
        delete: "deleteTreeList"
      },
      total: 0,
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
      // 新建离线预测：图像题库集2
      tabActiveKey: "1",
      search: "",
      nodeId: null,
    }
  },
  mounted () {
    this.getTargetTypeData()
    this.getDataList({ isFirst: true })
  },
  computed: {
    ...mapState({
      dlId: state => state.model.offline.dlId || [],
      dlItem: state => state.model.dlItem || [],
      tagType: state => state.model.modelInfo.tagType,
    }),
    rowSelection () {
      return {
        onChange: (selectedRowKeys, selectedRows) => {
          this.$nextTick(() => {
            this.$store.commit('setModelOfflineDlId', selectedRowKeys)
            this.$store.commit('setModelOfflineDlItem', selectedRows)
            this.$forceUpdate()
          })
        },
        selectedRowKeys: this.dlId
      }
    }
  },
  methods: {
    onTabChange () {
      this.getDataList({ isFirst: true, dlTagType: this.tagType })
    },
    handleChange (value) {
      this.$store.commit('setModelOfflineDlId', value)
      this.$store.commit('setModelOfflineDlItem', this.dlItem.filter(item => value.includes(item.id)))
    },
    onSearchChange:
      debounce(function (e) {
      this.search = e.target.value
      this.getDataList()
    }, 300),
    onSearch:
      debounce(function (value) {
      this.search = value
      this.getDataList()
    }, 300),
    async getTargetTypeData () {
      const data = await getTargetType()
      if (data.code === 0) {
        this.dlTagTypeOpt = data.data.map(element => {
          return {
            text: element.nodeName,
            value: element.nodeName
          }
        })
        if (this.columns.filter(item => item.key === 'dlTagType').length === 0) {
          this.columns.splice(1, 0, 
            {
              title: "标注类型",
              dataIndex: "dlTagType",
              key: "dlTagType",
              filters: this.dlTagTypeOpt,
              filterMultiple: false,
              width: 100
            }
          )
        }
      }
    },
    async getDataList (param) {
      const params = getParams(param, this, "offlineDataMrg")
      if (param?.isFirst) {
        params.nodeId = null
        params.nodeCode = null
      }
      params.dlTagType = this.tagType
      const responseData = await getDataSetList(params)
      if (responseData.code === 0) {
        this.loading = false
        this.tableData = responseData.data.records
        this.pagination.total = responseData.data.total
        if (param?.isFirst) {
          this.total = responseData.data.total
        } else {
          getDataSetList({
            dlType: this.tabActiveKey,
            dlTagType: this.tagType,
            source: 'traincenter',
            taskStatus: 2
          }).then(res => {
            this.total = res.data.total
          })
        }
      }
    },
    tableDataChange (pagination, filters) {
      if (filters.dlTagType) this.filterDlTagType = true
      this.getDataList({
        pageSize: pagination.pageSize,
        pageIndex: pagination.current,
        dlTagType: filters?.dlTagType ? filters.dlTagType[0] : (this.filterDlTagType ? '' : this.tagType)
      })
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
    },
    handleToImageManage () {
      this.$router.push("/dataCenter/dataMrg/index")
    },
    nextStep () {
      if (this.dlId.length > 0) {
        this.$emit('nextStep')
      } else {
        this.$message.error('请选择数据集')
      }
    },
    cancel () {
      this.$store.commit('setisShowDetail', true)
    },

  },

}
</script>

<style lang="less" scoped>
.right-content {
  height: 100%;
  padding: 20px 20px 0;
  .table-content {
    margin-left: 0;
    margin-right: 0;
  }
}
.stepModelOffline2{
  /deep/ .tcl-tabs-nav .tcl-tabs-tab {
    padding-left: 20px;
    padding-right: 0;
    padding-top: 16px;
    padding-bottom: 4px;
    margin-right: 0;
    font-size: 16px;
    line-height: 22px;
    font-weight: 600;
  }
  /deep/ .tcl-tabs-bar {
    border-bottom: 0;
  }
  /deep/ .tcl-tabs-ink-bar {
    display: none !important;
    width: 0 !important;
  }
  /deep/ .tcl-tabs-nav-container{
    padding-left: 20px;
  }
  .step-content{
    height: calc(100vh - 64px - 175px);
  }
}
</style>
