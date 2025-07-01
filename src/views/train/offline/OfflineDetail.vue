<template>
  <div class="page-content">
    <a-card :bordered="false" class="content-card scrollbar">
      <!-- <back-title url="/train/offline" :title="offlineInfo.taskName || 'ww'" /> -->
      <a-tabs v-model="activeKey">
        <a-tab-pane key="3" :tab="offlineInfo.taskName">
          <a-card :bordered="false" class="basic-card">
            <Result type="forecast" :paramId="dataId" :datalist="datalist" :modelType="modelType" :modelId="modelId"/>
          </a-card>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script>
import Result from "@/views/train/model/components/Result"
import { getOfflineById } from "@/api/offlineForecast"
import {getDataIdList} from "@/api/modelManage"

export default {
  name: "OfflineDetail",
  components: {
    Result,
  },
  data () {
    return {
      datalist: [],
      activeKey: "3",
      offlineInfo: {},
      dataId: null,
      modelType: null,
      modelId:"",
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      const { query: { id, modelType,modelId } } = to
      const _id = id || vm.$store.state.offline.currentOffline
      
      vm.dataId = _id
      vm.modelType = modelType
      vm.modelId = modelId;
      vm.getOfflineById(_id)
    })
  },

  mounted () {
    if(this.$route.query.modelType != 3){
      this.getDataIdList();
    }
  },
  methods: {
    getDataIdList () {
      let id  = this.$route.query.modelId
      getDataIdList(id).then(res => {
        if (res.code === 0) {
          let ids = res.data.map(item => item.dlId)
          this.datalist = [...new Set(ids)]
          console.log(this.datalist);
        }
      })
    },
    async getOfflineById (id) {
      const res = await getOfflineById(id)
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
  display: flex;
  flex-direction: column;
  &>.content-card {
    border-radius: 16px;
    flex: 1;
    overflow-y: auto;
  }
  .content-card /deep/ .ant-card-body {
    
    padding: 15px 20px 20px 20px;
  }
  .basic-card /deep/ .ant-card-body {
    padding: 0;
  }
  // .offlinedetail {
  //   background: #fff;
  //   border-radius: 16px;
  //   padding: 12px;
  // }

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
