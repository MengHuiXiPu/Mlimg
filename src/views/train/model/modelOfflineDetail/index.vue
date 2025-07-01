<template>
  <div class="page-content">
    <a-card :bordered="false" class="content-card">
      <back-title :url="url" :title="offlineInfo.taskName || ''" />
      <a-tabs v-model="activeKey">
        <a-tab-pane key="3" tab="结果洞察">
            <a-card :bordered="false" class="basic-card">
                <!--{{dataId}}||{{datalist}}||{{modelId}}-->
                <Result type="forecast" :paramId="dataId" :datalist="datalist" :modelId="modelId" :modelType="modelType" />
            </a-card>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script>
import Result from "@/views/train/model/components/Result"
import { getOfflineById } from "@/api/offlineForecast"

export default {
  name: "ModelOfflineDetail",
  components: {
    Result,
  },
  data () {
      return {
          activeKey: "3",
          offlineId: this.$route.query.id,
          offlineInfo: {},
          datalist: null,
          modelId: null,//模型id
          url: '/train/model',
          modelType: null,
      }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.getOfflineById()
      const { modelId, key, modelType, id ,datalist} = to.query
      const _id = vm.$store.state.offline.currentOffline || id
        vm.dataId = _id;
        vm.modelId = modelId;
        vm.datalist = datalist;
        vm.modelType = modelType;
      vm.url = `/train/model/detail/${modelId}?key=${key}&modelType=${modelType}`
    })
  },

  mounted () {

  },
  methods: {
    async getOfflineById () {
      const res = await getOfflineById(this.offlineId)
      const { data = {}, msg, code } = res
      if (code === 0) {
        this.offlineInfo = data
      }
    },
  }
}
</script>

<style lang="less" scoped>
.page-content {
  .content-card /deep/ .ant-card-body {
    padding: 15px 20px 20px 20px;
  }
  .basic-card /deep/ .ant-card-body {
    padding: 15px 0px 0px 0px;
  }

  // tabs样式修改↓
  /deep/ .ant-tabs-nav .ant-tabs-tab:first-child {
    padding-left: 0;
  }
  /deep/ .ant-tabs-nav .ant-tabs-tab {
    padding-right: 0;
    padding-bottom: 10px;
    padding-left: 20px;
    margin-right: 0;
    font-size: 16px;
    line-height: 22px;
    font-weight: 600;
  }
  /deep/ .ant-tabs-bar {
    border-bottom: 2px solid #e6e7ea;
  }
  /deep/ .ant-tabs-ink-bar {
    display: none !important;
    width: 0 !important;
  }
  // tabs样式修改↑
}
</style>
