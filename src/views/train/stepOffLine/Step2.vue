<template>
  <div class="stepOffline2">
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
            :url-object="trainingTreeApi"
            :getDataParam="{ taskStatus: 2 }"
            @searchData="getDataList"
            :total="total"
            :isHover="false"
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
            class="table-content"
            :loading="loading"
            :rowKey="(record)=>record.id"
            :row-selection="rowSelection"
            @change="tableDataChange"
            :columns="columns"
            :data-source="tableData"
            :pagination="pagination"
          >
            <a slot="dlName" slot-scope="text, record" :title="text">
              <!-- 标注文件格式用单独一列展示 -->
              <!-- <a-tag
                color="#4aa6e8"
                style="zoom: 0.7; margin-right: 2px;border-radius: 10px;"
                :style="{ display: record.dlTagType === '目标检测' ? '' : 'none' }">
                {{ record.markFileType === 1 ? 'JSON' : 'XML' }}
              </a-tag> -->
              <a-tag
                color="#12d2ae"
                style="zoom: 0.7; margin-right: 2px;border-radius: 10px;"
                :style="{ display: record.containSpecial ? '' : 'none' }">
                业务
              </a-tag>
              {{ text }}
            </a>
            <a slot="markFileType" slot-scope="text, record">
              <a-tag :color="record.markFileType === 1 ? '#87d068': '#4aa6e8'" style="zoom: 0.7; margin-right: 2px;border-radius: 10px;">
                {{ record.markFileType === 1 ? 'JSON' : 'XML' }}
              </a-tag>
            </a>
          </a-table>
        </div>
      </template>
      <template slot="bottom">
        <a-button @click="prevStep">上一步</a-button>
        <a-button type="primary" @click="nextStep" style="margin-left: 15px;">下一步</a-button>
        <a-button style="margin-left: 10px;" @click="cancel">取消</a-button>
      </template>
    </step-layout>
  </div>
</template>

<script>
import StepLayout from "@/components/StepLayout"
import tree from "@/components/tree"
import { getDataSetList, getTargetType } from "@/api/dataCenter"
import { mapState } from 'vuex'
import { getParams } from '@/utils/util'
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
          width: '20%'
        },
        {
          title: "样本量",
          dataIndex: "sampleNum",
          width: '80px'
        },
        {
          title: "标注文件格式",
          dataIndex: "markFileType",
          scopedSlots: { customRender: "markFileType" },
          width: '120px'
        },
        {
          title: "数据集路径",
          ellipsis: true,
          dataIndex: "dlRealDir"
        },
        {
          title: "创建时间",
          dataIndex: "createTime",
          width: '170px'
        }
      ],
      loading: false,
      saveLoading: false,
      trainingTreeApi: {
        search: "getTreeList",
        add: "savaTreeList",
        edit: "editTreeList",
        delete: "deleteTreeList"
      },
      total: 0,
      dlTagTypeOpt: [],
      filterDlTagType: false,
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
      // 新建离线预测：图像题库集
      tabActiveKey: "1",
      search: "",
      nodeId: null,
    }
  },
  mounted () {
    this.getTargetTypeData()
    this.getDataList({ isFirst: true, dlTagType: this.tagType })
  },
  computed: {
    ...mapState({
      dlId: state => state.offline.dlId,
      dlItem: state => state.offline.dlItem,
      tagType: state => state.offline.tagType,
      offline: state => state.offline,
    }),
    rowSelection () {
      return {
        onChange: (selectedRowKeys = [], selectedRows = []) => {
          // 之前的写法：if (selectedRows.length > 0 && (selectedRows[selectedRows.length - 1].markFileType !== selectedRows[0].markFileType)) {
          // 这样在全选时 没办法拦截判断，改为如下写法
          const flagType = selectedRows[0]?.markFileType
          if(selectedRows.length > 0 && flagType && selectedRows.some(row => row.markFileType !==flagType)) {
            this.$message.warning('离线预测不能选择标注格式不同的文件')
            return false
          }
          // 在切换表格/翻页时, selectdRows只包含当前页的选中项，而不包含其他页的选中项，这里需从dlItem中判断
          const dlFlagType = this.dlItem[0]?.markFileType
          if(selectedRows.length > 0 && dlFlagType && selectedRows.some(row => row.markFileType !==dlFlagType)) {
            this.$message.warning('离线预测不能选择标注格式不同的文件')
            return false
          }
          // dlItem没啥用，显示已选择那里是错进错出,
          this.$nextTick(() => {
            this.$store.commit('setOfflinedlId', selectedRowKeys)
            if(selectedRowKeys.length && !selectedRows.length) { 
              return 
            }
            this.$store.commit('setOfflinedlItem', selectedRows)
          })
        },
        selectedRowKeys: this.dlId
      }
    }
  },
  methods: {
    handleChange (value) {
      this.$store.commit('setOfflinedlId', value)
      const newdlItem = this.dlItem.filter(item => value.includes(item.id))
      this.$store.commit('setOfflinedlItem', newdlItem)
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
              width: '120px'
            }
          )
        }
      }
    },
    async getDataList (param = {}) {
      param.taskStatus = 2
      const params = getParams(param, this, "offlineDataMrg")
      if (param?.isFirst) {
        params.nodeId = null
        params.nodeCode = null
      }
      // 新建业务类型离线评估时，本页面内获取模型列表不再根据dlTagType过滤，即支持选择所有类型
      if(this.$route.query.modelType == 2) { //表示新建业务类型离线评估
        params.dlTagType = ""
      }
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
            // dlTagType: this.tagType,
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
    onTabChange () {
      this.getDataList({ isFirst: true })
    },
    handleToImageManage () {
      this.$router.push("/dataCenter/dataMrg/index")
    },
    prevStep () {
      this.$emit("prevStep")
    },
    nextStep () {
      if (this.dlId.length > 0) {
        this.$emit('nextStep')
      } else {
        this.$message.error('请选择数据集')
      }
    },
    cancel () {
      this.$emit('cancel')
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
.stepOffline2{
  /deep/ .ant-tabs-nav .ant-tabs-tab {
    padding-left: 20px;
    padding-right: 0;
    padding-top: 16px;
    padding-bottom: 4px;
    margin-right: 0;
    font-size: 16px;
    line-height: 22px;
    font-weight: 600;
  }
  /deep/ .ant-tabs-bar {
    border-bottom: 0;
  }
  /deep/ .ant-tabs-ink-bar {
    display: none !important;
    width: 0 !important;
  }
  .step-content{
    height: calc(100vh - 230px);
  }
  /deep/ .bottom{
    padding-top: 10px;
  }
}
</style>
