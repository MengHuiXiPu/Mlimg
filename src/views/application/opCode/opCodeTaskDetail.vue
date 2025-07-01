<template>
  <div class="opCodeTaskDetail page-content">
    <a-header
      :showSearch="false"
      :showNew="false"
      :showReload="false"
      :auth="{ add: 'dataMrg-list-add' }"
      :showPageHeader="false"
      pageTitle="复判任务详情"
      newText="新建"
    />
    <a-spin :spinning="loading">
      <div class="top">
        <div class="top-title" style="margin-top: 16px;">
          <a-divider class="title" type="vertical" />
          <span>任务名称：{{ taskDetail.name }}</span>
        </div>
        <div class="top-content" style="margin-bottom: 12px;">
          <a-descriptions :column="4" size="small" :title="''" class="detailTitle">
            <a-descriptions-item label="开始时间">{{ taskDetail.startTime | moment }}</a-descriptions-item>
            <a-descriptions-item label="结束时间">{{ taskDetail.endTime | moment }}</a-descriptions-item>
          </a-descriptions>
          <a-descriptions :column="4" size="small" :title="''" class="detailTitle">
            <a-descriptions-item :label="item.title" v-for="(item, index) in directoryData" :key="index">
              {{ item.value }}
            </a-descriptions-item>
          </a-descriptions>
          <a-descriptions :column="4" size="small" :title="''" class="detailTitle">
            <a-descriptions-item label="图片数量(已复判)">{{ taskDetail.imgNum }}</a-descriptions-item>
            <a-descriptions-item label="复判准确率">{{ taskDetail.precisionRate + '%' }}</a-descriptions-item>
            <a-descriptions-item label="turnon准确率">{{ taskDetail.turnonPrecisionRate + '%' }}</a-descriptions-item>
            <a-descriptions-item label="rework准确率">{{ taskDetail.reworkPrecisionRate + '%' }}</a-descriptions-item>
          </a-descriptions>
          <a-descriptions :column="1" size="small" :title="''" class="detailTitle">
            <a-descriptions-item label="阈值条件设置">{{ taskDetail.codeThreshold }}</a-descriptions-item>
          </a-descriptions>
        </div>
      </div>
      <div class="bottom">
        <a-tabs v-model="activeKey">
          <a-tab-pane :key="1" tab="混淆矩阵">
            <div class="bottom-content">
              <a-table
                :pagination="false"
                :columns="matrixColumns"
                :data-source="matrixData"
                v-if="matrixData.length > 0"
              >
                <template slot="isNum" slot-scope="text">
                  <div class="isNum" :style="getStyle(text)">{{ text | isNumber }}</div>
                </template>
              </a-table>
              <NoData v-else/>
            </div>
          </a-tab-pane>
          <a-tab-pane :key="2" tab="复判详情">
            <opCodeTaskImageList :id="$route.query.id" :detailData="taskDetail"></opCodeTaskImageList>
          </a-tab-pane>
          <a-tab-pane :key="3" tab="分析测算">
            <analysis :id="$route.query.id" />
          </a-tab-pane>
        </a-tabs>
      </div>
    </a-spin>
  </div>
</template>

<script>
import { OPCode, inferenceCatalogConfList } from "@/api/appCenter"
import { NoData } from "@/components"
import { getMatrixColumns, getBackgroundStyle } from '@/utils/util'
import opCodeTaskImageList from './opCodeTaskImageList'
import analysis from './analysis'
export default {
  name: 'opCodeTaskDetail',
  components: { NoData, opCodeTaskImageList, analysis },
  data () {
    return {
      taskDetail: {},
      matrixData: [],
      matrixColumns: [],
      loading: false,
      activeKey: 1,
      directoryData: [],
      directoryTableData: []
    }
  },
  beforeRouteEnter (to, from, next) {
    const { id } = to.query
    next(vm => {
      vm.getData(id)
    })
  },
  mounted () {
  },
  methods: {
    async getData (id) {
      this.loading = true
      const res = await OPCode.deleteOPCodeTask(id, 'get')
      this.loading = false
      this.getInferenceCatalogConfList()
      if (res.code !== 0) return false
      this.taskDetail = res.data
      try {
        this.$set(this.taskDetail, 'codeThreshold', JSON.parse(res.data.codeThreshold).value)
      } catch (err) {
        console.log(err)
        this.$set(this.taskDetail, 'codeThreshold', '')
      }
      if (res.data.confusionMatrix) {
        const { head, matrix } = JSON.parse(res.data.confusionMatrix)
        this.matrixColumns = getMatrixColumns(head)
        this.matrixData = matrix.map((item, index) => {
          return {
            ...item,
            key: index,
            precisionRate: `${(item.precisionRate * 100).toFixed()}%`,
            recallRate: `${(item.recallRate * 100).toFixed()}%`,
          }
        })
      }
    },
    getStyle (num) {
      return getBackgroundStyle(num)
    },
    async getInferenceCatalogConfList () {
      this.loading = true
      const res = await inferenceCatalogConfList()
      if (res.code === 0) {
        this.loading = false
        const field = this.taskDetail.conditionJson ? JSON.parse(this.taskDetail.conditionJson) : {}
        this.directoryData = res.data.records.map(item => {
          return {
            title: item.name,
            value: field[item.value] ? field[item.value].split(/([>,<,=]=?)/)[2] : ''
          }
        })
        this.directoryTableData = res.data.records
      }
    }
  }
}
</script>

<style lang="less" scoped>
.opCodeTaskDetail{
  .top-content {
    background: #fff;
    border-radius: 16px;
    padding: 12px !important;
  }
  .top{
    &-title{
      margin-bottom: 10px;
      span{
        font-size: 16px;
        font-weight: 600;
        color: #000;
      }
    }
    &-content{
      overflow: hidden;
      padding: 5px 0;
      border-top: 1px solid #ccc;
      border-bottom: 1px solid #ccc;
      .ant-statistic{
        float: left;
        width: 16.66%;
        text-align: center;
        height: 80px;
        /deep/ .ant-statistic-title{
          line-height: 30px;
          font-weight: bold;
        }
        &:not(:first-child){
          border-left: 1px solid #ccc;
        }
      }
    }
  }
  .bottom{
    &-content{
      height: calc(100vh - 440px);
      // background: #ccc;
      /deep/ .ant-table-body{
        max-height: calc(100vh - 435px);
      }
      .isNum {
        height: 53px;
        line-height: 53px;
        // padding-left: 16px;
      }
    }
  }
}
</style>