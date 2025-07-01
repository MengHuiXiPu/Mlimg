<template>
  <div class="page-content DataListDetail">
    <a-tabs v-model="tabKey" @change="handleChange" :animated="false">
      <a-tab-pane :key="1" tab="图片详情">
        <!-- <sampleDetail :isActive="tabKey === 1" :detailData="detailData" :currentID="currentID" /> -->
        <!-- <el-tabs v-model="categoryTabKey">
          <el-tab-pane :label="`已标注图片（${detailSampleData.markNum}张）`" name="1">
            <sampleDetail :isActive="tabKey === 1" :detailData="detailData" :currentID="currentID" :markRange="1"/>
          </el-tab-pane>
          <el-tab-pane :label="`未标注图片（${detailSampleData.sampleNum - detailSampleData.markNum}张）`" name="2">
            <sampleDetail :isActive="tabKey === 1" :detailData="detailData" :currentID="currentID" :markRange="2"/>
          </el-tab-pane>
        </el-tabs> -->
        <a-tabs v-model="categoryTabKey" :animated="false">
          <a-tab-pane :tab="`已标注图片（${detailSampleData.markNum || 0}张）`" :key="1">
            <sampleDetail :isActive="tabKey === 1" :detailData="detailData" :currentID="currentID" :markRange="1" @refreshData="refreshData" v-if="categoryTabKey == 1"/>
          </a-tab-pane>
          <a-tab-pane :tab="`未标注图片（${(detailSampleData.sampleNum - detailSampleData.markNum) || 0}张）`" :key="2">
            <sampleDetail :isActive="tabKey === 1" :detailData="detailData" :currentID="currentID" :markRange="2" @refreshData="refreshData" v-if="categoryTabKey == 2"/>
          </a-tab-pane>
        </a-tabs>
      </a-tab-pane>
      <a-tab-pane :key="2" tab="基本信息">
        <div class="content" v-if="tabKey === 2">
          <a-card :bordered="false" class="detailTitle basic-card">
            <a-descriptions :column="{ xs: 1, sm: 2, md: 3}" size="small" :title="detailData.dlName" class="detailTitle">
              <a-descriptions-item label="创建用户">{{ detailData.createBy }}</a-descriptions-item>
              <a-descriptions-item label="创建时间">{{ detailData.createTime | moment }}</a-descriptions-item>
              <a-descriptions-item label="修改用户">{{ detailData.updateBy }}</a-descriptions-item>
              <a-descriptions-item label="修改时间">{{ detailData.updateTime | moment }}</a-descriptions-item>
              <a-descriptions-item label="数据集目录">{{ detailData.storedDirName }}</a-descriptions-item>
              <a-descriptions-item label="备注信息">{{ detailData.dlDescribe }}</a-descriptions-item>
              <a-descriptions-item>
                <span slot="label" :style="{ color: isNotClassify(detailData.dlTagType) ? '' : '#ccc'}"> 标注格式</span>
                <span :style="{ color: isNotClassify(detailData.dlTagType) ? '' : '#ccc'}">
                  {{ isNotClassify(detailData.dlTagType) ? (detailData.markFileType === 1 ? 'JSON' : 'XML') : '无' }}
                </span>
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </div>
        <div class="content">
          <a-card :bordered="false" class="basic-card">
            <a-descriptions :column="{ xs: 1, sm: 2, md: 3}" size="small" title="样本信息">
              <a-descriptions-item label="样本数">{{ detailSampleData.sampleNum }}</a-descriptions-item>
              <a-descriptions-item label="类别数">{{ detailSampleData.categoryNum }}</a-descriptions-item>
              <a-descriptions-item label="标注文件异常总数">{{ detailSampleData.makefileErrorSum }}</a-descriptions-item>
              <!-- <a-descriptions-item label="最大类别">{{ detailSampleData.maxCategoryName }}</a-descriptions-item> -->
              <!-- <a-descriptions-item label="最小类别">{{ detailSampleData.minCategoryName }}</a-descriptions-item> -->
              <a-descriptions-item>
                <span slot="label" :style="{ color: isNotClassify(detailData.dlTagType) ? '' : '#ccc' }">智能标注</span>
                <span :style="{ color: isNotClassify(detailData.dlTagType) ? '' : '#ccc' }">{{ false }}</span>
              </a-descriptions-item>
              <a-descriptions-item>
                <span slot="label" :style="{ color: isNotClassify(detailData.dlTagType) ? '' : '#ccc'}">已标注</span>
                <span :style="{ color: isNotClassify(detailData.dlTagType) ? '' : '#ccc' }">{{ detailSampleData.markNum }}</span>
              </a-descriptions-item>
              <a-descriptions-item>
                <span slot="label" :style="{ color: isNotClassify(detailData.dlTagType) ? '' : '#ccc'}">标注比例</span>
                <span :style="{ color: isNotClassify(detailData.dlTagType) ? '' : '#ccc' }">{{ tagRate }}</span>
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </div>
        <div class="content content-no-line">
          <a-card :bordered="false" class="data-card">
            <a-descriptions :column="{ xs: 1, sm: 1, md: 1 }" title="分布图">
            </a-descriptions>
            <div class="data-card-chart ph" ref="refChart">
              <echart :option="option2" ref="echart" />
            </div>
          </a-card>
        </div>
      </a-tab-pane>   
      <a-tab-pane :key="3" tab="操作记录">
        <a-empty></a-empty>
      </a-tab-pane>
    </a-tabs>
    <!-- </a-spin> -->
  </div>
</template>

<script>
import { umodeldetail } from "@/components"
import { getSingleDataListDetailById, getSingleDataListSampleDetailById } from "@/api/dataCenter"
import { getFileCategoryAndCount, getCodeData } from "@/api/modelManage"
import { Echart } from "@/components"
import sampleDetail from './sampleDetailNew.vue'

export default {
  name: "DataListDetail",
  components: {
    Echart,
    sampleDetail,
    umodeldetail
  },
  computed: {
    tagRate: function () {
      if (Object.keys(this.detailSampleData).length > 0)
        return Math.floor((this.detailSampleData.markNum) / (this.detailSampleData.sampleNum) * 10000) / 100 + '%'
      else return '--'
    }
  },
  data() {
    return {
      categoryTabKey: 1,
      loading: true,
      detailData: {},
      currentID: null,
      detailSampleData: {},
      tabKey: 1,
      // 能不这么草率的起名字吗
      option2: {},
      noData: false,
      modelInfo: {},//空对象
    }
  },
  created() {
    this.currentID = this.$route.query.id
    this.getData(this.currentID)
  },
  // beforeRouteEnter(to, from, next) {//路由守卫钩子函数，进入当前路由前进行处理
  //   // 什么j8玩意
  //   next((vm) => {
  //     vm.tabKey = 1
  //     vm.currentID = to.query.id
  //     vm.getData(vm.currentID)
  //     vm.active()
  //     next()

  //     // vm.$nextTick(() => {//确保视图已更新完毕，然后进行处理
  //     //   vm.tabKey = 1
  //     //   if (to.query.id !== vm.currentID) {//若目的地址与当前地址不同，则跳转
  //     //     vm.currentID = to.query.id
  //     //     vm.getData(vm.currentID)
  //     //     vm.active()
  //     //     next()//继续路由导航
  //     //   } else {
  //     //     vm.option2 = { ...vm.option2 }
  //     //     if (vm.noData) vm.noDataFun()
  //     //     next()
  //     //   }
  //     // })
  //   })
  // },
  mounted() {
  },
  methods: {
    // 判断是否是分类数据集/非分类(分割/目标检测)数据集
    isNotClassify(dlTagType) {
      return ["分割", "目标检测"].includes(dlTagType)
    },
    active() {
      this.detailData = []
      this.detailSampleData = {}
      this.option2 = {}
    },
    getFileCategoryAndCountChart(FileCategoryAndCountData) {
      // const { DataListCategory = [], DataListCategoryNum = [] } = FileCategoryAndCountData
      let DataListCategory = []
      let DataListCategoryNum = []
      FileCategoryAndCountData.DataListCategoryNum?.map((item, index) => {//遍历每个元素，返回一个对象
        return {
          value: item,
          name: FileCategoryAndCountData.DataListCategory[index]
        }
      }).sort((a, b) => b.value - a.value).forEach(item => {//用sort方法对返回的对象数组排序，根据value降序排列
        DataListCategory.push(item.name)
        DataListCategoryNum.push(item.value)
      })//遍历有序数组，将name和value属性分别拷贝进DataListCategory和DataListCategoryNum
      const xAxis = {
        type: 'category',
        data: DataListCategory,//图表横坐标轴内容
        axisTick: {
          alignWithLabel: true,
          lineStyle: {
            color: '#E6E7EA'
          }
        },
        axisLabel: {
          color: '#09102F'
        },
        axisLine: {
          lineStyle: {
            color: '#E6E7EA'
          }
        }
      }
      const FileCategoryAndCountDataXAxisSeries = {
        name: '样本数',
        type: 'bar',
        barWidth: '30px',
        data: DataListCategoryNum,//各样本统计值
        emphasis: {
          itemStyle: {
            color: '#0E6FC9'
          }
        }
      }
      this.$nextTick(() => {
        this.option2 = {//设置图表数据配置
          color: ['#1890FF'],
          tooltip: {
            pointer: {
              type: 'shadow'
            },
            formatter: '{b}<br />{a}: {c}'
          },
          grid: {
            top: 20,
            left: '0',
            right: 20,
            bottom: '3%',
            containLabel: true
          },
          xAxis: xAxis,
          yAxis: [
            {
              type: 'value',
              axisTick: {
                show: false
              },
              axisLine: {
                lineStyle: {
                  color: '#E6E7EA'
                }
              },
              axisLabel: {
                color: '#09102F'
              },
              splitLine: {
                lineStyle: {
                  type: 'dashed'
                }
              }
            }
          ],
          series: [FileCategoryAndCountDataXAxisSeries]//指定图表数据
        }
      })
    },
    // 获取标注样本数
    async getMarkNum(id) {
      const res = await getFileCategoryAndCount({
        id,
        markRange: 1,
        reviewRange: 0
      })
      if (res.code !== 0) return false
      if (res.data && Object.keys(res.data).length === 0) {
        // this.noDataFun()
        return false
      }
      this.detailSampleData.markNum = res.data.sum[1]
      this.$set(this.detailSampleData, 'makefileErrorSum', res.data?.makefileErrorSum[0])
      // 
    },
    async getData(id, selectMenu) {
      this.loading = true//先设置加载中动效，载入数据后取消此动效
      getSingleDataListDetailById(id).then(res => {
        if (res.code === 0) {
          this.detailData = res.data || []
        }
      })
      getSingleDataListSampleDetailById(id).then(res => {
        this.detailSampleData = res.data || {};
        // console.log(this.detailSampleData.dlId, 'this.detailSampleData.dlId');
      })
      const res = await this.getMenuData(id, selectMenu)
      this.getMarkNum(id);
      // this.getCodeData(id);
      if (!res) return false
      this.getFileCategoryAndCountChart(res.data)
    },
    // 移动图片后，刷新图片数量信息
    refreshData() {
      getSingleDataListSampleDetailById(this.currentID).then(res => {
        this.detailSampleData = res.data || {};
      })
    },
    //读取基本信息-柱状分布图的数据
    async getMenuData(id, selectMenu) {
      const res = await getFileCategoryAndCount({
        id,
        markRange: 0,
        reviewRange: 0
      })
      if (res.code !== 0) return false
      if (res.data && Object.keys(res.data).length === 0) {
        this.noDataFun()
        return false
      }
      this.noData = false
      return res
    },
    // 该方法调用接口返回的数据在template中之前就被注释掉了，应该是不用了，后端反馈该接口关联东西较多，接入目标检测时总是报错，告知屏蔽不再调用
    // async getCodeData(id) {
    //     const res = await getCodeData(id);
    //     const { data = [], code, msg } = res;//数据解构
    //     if (code === 0) {
    //         this.data = data?.map(item => {//遍历data数组中的每个元素item，拆分出item的四个属性，然后添加新属性
    //             const { pixelWidth, pixelHeight } = item;//数据拆分
    //             return {
    //                 ...item,
    //                 resolution: `${pixelWidth}×${pixelHeight}`,//拼合分辨率数据
    //             }
    //         })
    //         this.loading = false;
    //     }
    //     else {
    //         this.loading = false;
    //     }
    //     this.$forceUpdate();//强制刷新组件，显示详表内容
    // },
    noDataFun() {
      this.$confirm({
        title: '提示',
        content: '找不到该数据集资源',
        okText: '返回列表',
        cancelButtonProps: {
          props: { disabled: true },
        },
        centered: true,
        onOk: () => {
          this.noData = true
          this.$router.push('/dataCenter/dataMrg/index')
        }
      });
    },
    async handleChange() {
      // if (event.type === 'keydown') this.tabKey = this.tabKey === 1 ? 2 : 1
      if (this.tabKey === 2) {
        this.active()
        this.getData(this.currentID)
        // this.$nextTick(() => {
        //   this.$refs.echart.resize()
        // })
      }
    },
  }
}
</script>

<style lang="less">
@import "~@/config/theme.less";
.DataListDetail {
  // height: 100%;  会导致无滚动条
  .sample-detail-left {
    // height: 100%;
    // background: #fff;
    // border-radius: 16px;
  }
  .sample-detail-right {
    .sample-detail-left();
    padding: 12px;
  }
  .ant-card {
    padding: 12px;
    border-radius: 16px;
  }
  .detailTitle.ant-descriptions {
    .ant-descriptions-title {
      font-size: 20px;
    }
  }
  .ant-descriptions-title {
    margin-bottom: 10px;
  }
  .ant-descriptions-item {
    padding-bottom: 0 !important;
    &-label {
      font-size: 12px !important;
      color: rgba(9, 16, 47, 1) !important;
    }
    &-content {
      font-size: 12px !important;
      color: rgba(9, 16, 47, 1) !important;
    }
  }
  .ant-card-body {
    padding: 5px 0px 0 0;
  }
  .data-card {
    position: relative;
    &-chart1.ph {
      height: 55px !important;
      margin-bottom: -20px;
    }
    &-chart,
    &-chart1 {
      height: calc(100vh - 550px);
      min-height: 50px;
      border: 1px solid #e6e7ea;
      overflow: hidden;
      &.ph {
        // width: calc(100% + 6px);
        user-select: none;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        padding: 0 6px;
        margin: 0px;
        border: none;
      }
    }
  }
}
</style>

<style lang="less" scoped>
.DataListDetail {
  display: flex;
  flex-direction: column;
  padding: 10px 20px;
}
.content {
  margin: 6px 0px;
  border-bottom: 1px solid #d4d4d4;
  padding-bottom: 15px;
  &-no-line {
    border: none;
    padding: 0;
  }
  &:first-child {
    margin: 5px;
    border-width: 2px;
  }
  .title {
    font-size: 20px;
    color: #09102f;
    font-weight: 500;
    margin-bottom: 10px;
  }
  .content-header {
    display: flex;
    justify-content: space-between;
    .left {
      display: flex;
      flex-direction: column;
    }
  }
}

.edit-icon {
  font-size: 16px;
  margin-right: 30px;
}
</style>
