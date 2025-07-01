<template>
  <div class="addBusinessStep-content-item start">
    <step-layout class="step-style">
      <template slot="left">
        <div style="width: 100%;padding: 10px">
          <tree
            :url-object="treeApi"
            @searchData="getDataList"
            :tabActiveKey="tabActiveKey"
            :total="pagination.total"
            :isHover="false"
            :hasImageStatus="true"
          ></tree>
        </div>
      </template>
      <template slot="right">
        <div class="right-content">
          <a-input-search
            placeholder="请输入算法名称"
            style="width: 200px;margin-right: 30px"
            @search="onSearch"
            @change="onSearchChange"
          />
          未找到合适算法？
          <a @click="handleToImageManage" href="javascript:;">新建算法</a>
          <a-table
            v-resize
            class="table-content"
            :rowKey="(record)=>record.id"
            :row-selection="rowSelection"
            @change="tableDataChange"
            @expand="getChildren"
            :columns="columns"
            :data-source="data"
            :pagination="pagination"
            :expandedRowKeys="expandedRowKeys"
            :loading="loading">
            <span slot="action" slot-scope="text, record" >
              <a-popover placement="left">
                <template slot="content">
                  <a-descriptions style="width: 306px" :column="{ xs: 1, sm: 1, md: 1}">
                    <a-descriptions-item label="算法名称">{{ record.imageName }}</a-descriptions-item>
                    <a-descriptions-item label="算法名称">{{ record.algorithm }}</a-descriptions-item>
                    <a-descriptions-item label="创建用户">{{ record.createBy }}</a-descriptions-item>
                    <a-descriptions-item label="算法说明">{{ record.imagesDescribe }}</a-descriptions-item>
                    <a-descriptions-item label="更新用户">{{ record.updateBy }}</a-descriptions-item>
                    <a-descriptions-item label="更新时间">{{ record.updateTime | moment }}</a-descriptions-item>
                  </a-descriptions>
                </template>
                <template slot="title">
                  <span>算法基础信息</span>
                </template>
                <a-icon type="info-circle" />
              </a-popover>
            </span>
          </a-table>
        </div>
      </template>
    </step-layout>
  </div>
</template>

<script>
import StepLayout from '@/components/StepLayout'
import tree from "@/components/tree"
import { getImageManageList, imageVersion
} from '@/api/imageManage'
import { getTargetType } from "@/api/dataCenter"
import { mixinHeader } from "@/utils/mixin"
import debounce from 'lodash.debounce'
import { getParams } from '@/utils/util'
import { mapState } from 'vuex'
export default {
  name: 'AddBusniessStep1',
  mixins: [mixinHeader],
  components: {
    StepLayout,
    tree,
  },
  props: {
    postData: {
      type: Object,
      default: null
    },
    selectImage: {
      type: Object,
      default: null
    },
    active: {
      default: false,
      type: Boolean
    }
  },
  data () {
    return {
      loading: false,
      data: [],
      columns: [],
      tagTypeOpt: [],
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
        search: "getImageMrgTreeList",
        add: "savaImageMrgTreeList",
        edit: "editImageMrgTreeList",
        delete: "deleteImageMrgTreeList"
      },
      tabActiveKey: "2",
      rowSelection: {
        onChange: this.selectChange,
        type: 'radio',
        selectedRowKeys: this.postData.imagesId ? [this.postData.imagesId] : []
      }
    }
  },
  watch: {
    active (val) {
      if (val) {
        this.rowSelection.selectedRowKeys = []
        this.getDataList()
      }
    },
    immediate: true
  },
  computed: {
    ...mapState({
        modelInfo: state => state.model.modelInfoToVersion,
    })
  },
  mounted () {
    this.getTargetTypeData()
    this.getDataList()
    this.rowSelection.selectedRowKeys = this.postData.imagesId ? [this.postData.imagesId] : []
  },
  methods: {
    async getTargetTypeData () {
      const data = await getTargetType()
      if (data.code === 0) {
        this.tagTypeOpt = data.data.map(element => {
          return {
            text: element.nodeName,
            value: element.nodeName
          }
        })
        this.columns = [
            {
              title: '算法名称',
              ellipsis: true,
              dataIndex: 'imageName',
            },
            {
              title: '版本号',
              ellipsis: true,
              dataIndex: 'versionLabel',
              width: 100
            },
            {
              title: '算法类型',
              dataIndex: 'tagType',
              width: 100
              // filters: this.tagTypeOpt,
              // filterMultiple: false,
            },
            {
              title: '算法信息',
              dataIndex: 'action',
              scopedSlots: { customRender: 'action' },
              width: 100
            },
        ]
      }
    },
    async getDataList (param) {
      const params = {
        ...getParams(param, this, "mirror"),
        imageStatus: 1,
        imageType: Number(this.tabActiveKey),
        sourceVersionId: this.modelInfo ? this.modelInfo.imageSourceVersionId : ''
      }
      const responseData = await getImageManageList(params)
      if (responseData.code === 0) {
        this.loading = false
        this.data = responseData.data.records.map(item => {
          console.log(item.versionCounts)
          item.children = item.versionCounts > 1 ? [] : undefined
          return item
        })
        this.pagination.total = responseData.data.total
        if (this.modelInfo && !this.selectImage) {
          await this.getChildren(true, this.data[0])
          this.$emit('changeSelectImage', {
            id: this.postData.imagesId,
            selectImage: this.data.filter(item => item.id === this.postData.imagesId)[0] || this.data[0].children.filter(item => item.id === this.postData.imagesId)[0]
          })
        }
      }
    },
    async getChildren (expanded, record) {
      try {
      if (!expanded) {
        this.expandedRowKeys = []
        return false
      } else {
        this.expandedRowKeys = [record.id]
      }
      // 当状态为展开时，获取当前算法的所有版本
      this.loading = true
      const res = await imageVersion.getImageVersionList({ sourceVersionId: record.sourceVersionId })
      this.loading = false
      if (res.code !== 0) return false
      record.children = res.data.length > 0 ? res.data.filter(item => {
        if (this.modelInfo && item.id === this.modelInfo.imagesId) {
          this.$store.commit('setimagesId', this.modelInfo.imagesId)
          this.$store.commit('setStep1ImageItem', item)
        }
        return item.id !== item.sourceVersionId
      }) : undefined
      } catch (error) {
        this.loading = false 
      }
    },
    handleToImageManage () {
      this.$router.push("/train/mirror")
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
    tableDataChange (pagination, filters, sorter) {
      this.getDataList({
        pageSize: pagination.pageSize,
        pageIndex: pagination.current,
        tagType: filters?.tagType ? filters.tagType[0] : ""
      })
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
    },
    selectChange (selectedRowKeys, selectedRows) {
      console.log(selectedRows)
      this.$emit('changeSelectImage', {
        id: selectedRowKeys[0],
        selectImage: selectedRows[0]
      })
      this.rowSelection.selectedRowKeys = [...selectedRowKeys]
    }
  }
}
</script>

<style lang="less">
.start{
  height: 100%;
  .step-style {
    //height: 100% - 100px;
  }
  .step-content{
    //height: calc(100vh - 265px);
    .splitter-pane{
      float: left;
      position: static !important;
      &-resizer{
        position: absolute;
      }
    }
  }
  .select-style{
    width: 100%;
  }
  .right-content{
    height: 100%;
    padding: 20px 20px 0;
    .table-content{
      margin-left: 0;
      margin-right: 0;
    }
  }
}
</style>
