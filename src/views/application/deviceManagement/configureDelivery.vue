/*
 * @Author: lichao.sun 
 * @Date: 2024-04-10 11:00:24 
 * @Last Modified by: lichao.sun
 * @Last Modified time: 2024-04-18 18:01:47
 * @description:   配置下发页面
 */
<template>
  <div>
    <div ref="headerContent" style="margin-bottom: 24px">
      <div class="bread">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/home/index' }">
          首页
        </el-breadcrumb-item>
        <el-breadcrumb-item v-if="breadInfo.parentName">
          <a style="color: #333 !important"
            >{{ breadInfo.parentName ?? "" }}
          </a></el-breadcrumb-item
        >
        <el-breadcrumb-item
          :to="{ path: breadInfo.path }"
          v-if="breadInfo.title"
        >
          <a style="color: #333 !important">
            {{ breadInfo.title ?? "" }}
          </a>
        </el-breadcrumb-item>
        <el-breadcrumb-item
          :to="{ path: breadInfo.appPath, query: { appId: $route.query.appId } }"
          v-if="breadInfo.appName && breadInfo.appPath"
        >
          <a style="color: #333 !important">
            {{ breadInfo.appName ?? "" }}
          </a>
        </el-breadcrumb-item>
        <el-breadcrumb-item v-if="$route.meta.title"
          >{{ $route.meta.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <a-header :showPageHeader="false" :isShowBread="false" :pageTitle="配置下发" />
    </div>
    <div class="page-content" :style="{ height: contentHeight + 'px' }">
      <a-spin :spinning="pageLoading">
        <a-card :bordered="false" class="step-content">
          <div class="addModelStep-header-steps">
            <a-steps slot="extra" class="steps" v-model="currentStep" size="small" @change="onStepChange">
              <a-step title="选择流程应用" />
              <a-step title="选择下发文件" />
              <a-step title="扩展参数配置" />
              <!-- <a-step title="下发记录" /> -->
            </a-steps>
          </div>
        </a-card>
        <a-card :bordered="false" style="flex: 1" class="card-content">
          <KeepAlive>
            <component :is="activeComponent" @collect-data="collectData" :transferData="transferData"/>
          </KeepAlive>
        </a-card>
      </a-spin>
    </div>
  </div>
</template>
 
<script>
import opSelector from './opSelector.vue'
// import transferRecords from './transferRecords.vue'
import setParameters from './setParameters.vue'
import fileSelector from './fileSelector.vue'
import { createFileTransferRecord, updateFileTransferRecord, getTransferRecordList } from '@/api/cloud.js'
export default {
  name: 'configureDelivery',
  data() {
    return {
      currentStep: 0,
      pageLoading: false,
      // 文件下发记录data数据
      param: {
        //生成类型下发记录所需采集的信息
        deviceId: this.$route.query.id,  //设备id
        inferTaskId: null,   //算法id
        fileIds: [],     // 文件ids
        transferCfg: null    //扩展配置
      },
      stepCompMap: new Map([
        [0, 'opSelector'],
        [1, 'fileSelector'],
        [2, 'setParameters'],
        // [3, 'transferRecords']
      ]),
      transferData: {}, //接口返回的最新下发记录数据,
      breadInfo: ""
    }
  },
  computed: {
    // 匹配动态组件
    activeComponent() {
      return this.stepCompMap.get(this.currentStep)
    }
  },
  components: {
    opSelector,
    // transferRecords,
    setParameters,
    fileSelector
  },
  mounted() {
    this.queryLatestRecords()
  },
  methods: {
    onStepChange(val) {
      this.currentStep = val
    },
    /**
     * 采集数据到transferData
     * @param {*} key 
     * @param {*} data 
     */
    collectData(key, data) {
      if (key === 'op') {
        this.param.inferTaskId = data.id ? data.id *1 : this.transferData.inferTaskId  //用户没重新选择算法则使用记录中保存的
        this.currentStep = 1
      } else if (key === 'file') {
        this.param.fileIds = data.map(file => file.id * 1)
        this.currentStep = 2
      } else if (key === 'extendCommandParam') { //扩展命令参数
        this.param.transferCfg = data
        // 调用保存接口
        this.generateRecord()
      }
    },
    // 调接口生成/更新下发记录
    async generateRecord() {
      const { deviceId = this.$route.query.id, inferTaskId, fileIds, transferCfg } = this.param
      const data = {
        deviceId,
        inferTaskId,
        fileIds,
        transferCfg
      }
      try {
        this.pageLoading = true
        const res =  this.transferData.id ? await updateFileTransferRecord(this.transferData.id, data): await createFileTransferRecord(data)
        this.pageLoading = false
        if(res.code == 0) {
          this.$message.success('保存成功')
        }
      }catch {
        this.pageLoading = false
      }
      
    },
    // 查询设备最新的文件下发记录
    queryLatestRecords() {
      this.pageLoading = true
      getTransferRecordList({
        deviceId: this.$route.query.id, //目标设备id
        recordType: 0, // 0 文件记录  1命令记录
        pageNo: 1,
        limit: 10   //limit 1即可，但因为传1接口报错，后端限制了必须>10， 将就着用吧
      }).then(res => {
        if (res.code == 0 && Array.isArray(res?.data?.records)) {
          if(res?.data?.records[0] && res?.data?.records[0].transferStatus==4) { //最新记录是已下发的记录，要新增
            this.transferData = {}
          }else { //其他状态做更新
            this.transferData = res?.data?.records[0] || {}
          }
        }
      }).finally(() => {
        this.pageLoading = false
      })
    }
  },
  created(){
    this.breadInfo = localStorage.getItem("bread")
      ? JSON.parse(localStorage.getItem("bread"))
      : {};
  }
}
</script>
 
<style lang="less" scoped>
@import "~@/config/theme.less";

.bread {
  padding: 4px 20px;
  padding-left: 0;
  margin-top: 20px;
}

.page-content {
  border-radius: 20px;
  background-color: @tabBackgroundColor;
  padding: 10px;
  overflow: visible;

  .step-content {
    padding: 0 !important;

    /deep/ .ant-card-body {
      padding: 15px 20px 5px 20px;
    }

    /deep/ .addModelStep-header-steps {
      margin: 0 auto;
    }
  }

  .card-content /deep/ .ant-card-body {
    padding: 0;
    height: 100%;
  }

  .steps {
    max-width: 80%;
    margin: 0 auto 15px auto;
  }
}
</style>
