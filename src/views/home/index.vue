<template>
  <div v-if="isSSOLogin">
    <Hello></Hello>
  </div>
  <a-spin v-else :spinning="loading" style="height: calc(100% - 50px); overflow:auto;background-color: #daeaff;border-radius: 12px;">
    <a-card
      :bordered="false"
      class="overview"
    >
    <div class="main-title">
      <h1 class="title"> {{$t('home.hello')}} </h1>
      <p>{{$t('home.name')}}</p>
    </div>
      <div class="gutter-example">
        <div class="gutter-item" v-for="(item, index) in cardList"
          :key="item.name"
          :hidden="index === cardList.length - 1 && !($store.state.request.btnAuth !== null && $store.state.request.btnAuth && $store.state.request.btnAuth.includes('task-list'))">
          <div class="image">
            <svg-icon :type="getIcon(index)" class="icon" />
          </div>
          <div class="content">
            <div class="name">{{ item.name }}</div>
            <div class="number">{{ `${item.value}` }}{{$i18n.locale === 'zh' ? '个' : ''}}</div>
          </div>
        </div>
      </div>
      <div class="mianinfo">
        <div class="main">
          <div class="overview-content-left" v-if="sourceList.length || gpuList.length || loading">
            <div v-for="item in sourceList" :key="item.name" class="datasource">
              <div class="percentage">{{String(((Math.round(item.rate*10000))/100).toFixed(0))+'%'}}</div>
              <div class="datasource-title">
                <p>{{ item.name }}</p>
                <p>{{ `${item.usage}/${item.capacity} ${item.unit}` }}</p>
              </div>
              <div class="datasource-chart">
                <echart
                  :option="getRingOption(item.rate, item.name)"
                />
              </div>
            </div>
            <div class="datasource" v-if="gpuList.length">
              <div class="percentage">{{String(((Math.round(gpuList[0].num_rate*10000))/100).toFixed(0))+'%'}}</div>
                <div class="datasource-title">
                  <p>{{$t('home.GPU')}}</p>
                  <p>{{ `${gpuList[0].num_usage}/${gpuList[0].num_capacity} 卡` }}</p>
                </div>
                <div class="datasource-chart">
                  <echart
                    :option="getRingOption(gpuList[0].num_rate, $t('home.GPU'))"
                  />
                </div>
            </div>
            <div class="datasource" v-if="gpuList.length">
              <div class="percentage">{{String(((Math.round(gpuList[0].xc_rate*10000))/100).toFixed(0))+'%'}}</div>
                <div class="datasource-title">
                  <p>{{$t('home.Memory')}}</p>
                  <p>{{ `${gpuList[0].xc_usage}/${gpuList[0].xc_capacity} GB` }}</p>
                </div>
                <div class="datasource-chart">
                  <echart
                    :option="getRingOption(gpuList[0].xc_rate, $t('home.Memory'))"
                  />
                </div>
            </div>
          </div>
          <div class="overview-content-left" style="background: #fff; border-radius: 16px;" v-else><el-empty :image-size="150"></el-empty></div>
      </div>
        <div class="main-center">
          <div class="quickBtn">
            <h4 class="title">{{$t('home.QuickActions')}}</h4>
            <div class="btnList">
              <div v-for="item in quickCreateBtnList" :key="item.id" class="btn" @click="create(item)">
                {{item.name}}
              </div>
            </div>
          </div>
          <video :src="require('@/assets/video/feature.mp4')" autoplay muted loop controls class="videoplay"></video>
        </div>
        <div class="main-right">
          <div class="image">
            <img :src="$store.state.user.user.avatar ? $store.state.user.user.avatar : avatarDefault " alt="">
          </div>
          <div class="name">Hello, {{$store.state.user.user.username}}</div>
          <div class="email">{{$store.state.user.user.email}}</div>
<!--          <span @click="changeLang" style="cursor: pointer;">{{$i18n.locale === 'en' ? '中文' : 'English'}}</span>-->
          <div class="date" v-if="$store.state.user.user.expirationDays > -1">
            <div class="text"><span>试用期</span><span>{{$store.state.user.user.expirationDays - $store.state.user.user.remainingDays}} / {{$store.state.user.user.expirationDays}} 天</span></div>
            <el-progress define-back-color="#f59a23" color="#d7d7d7" :show-text="false" :stroke-width="16" :percentage="((Math.round((($store.state.user.user.expirationDays - $store.state.user.user.remainingDays)/$store.state.user.user.expirationDays)*10000))/100).toFixed(0)"></el-progress>
          </div>
        </div>
      </div>
    </a-card>
  </a-spin>
</template>

<script>
// import avatarDefault from "@/assets/images/avatar.png";
import store from "@/store";
import avatarDefault from "@/assets/avatar.png";
import { getRingOption } from '@/components/Echart/option/ring'
import { Echart } from "@/components"
import { getOverview, getK8sQuota } from '@/api/home'
import { mixinHeader } from "@/utils/mixin"
import SvgIcon from '../../components/svg-icon/svg-icon.vue';
import Hello from "@/views/Hello.vue";
export default {
  name: 'Home',
  components: {
    Hello,
    Echart,
    SvgIcon,
  },
  mixins: [mixinHeader],
  computed: {
    sourceListName () {
      return [
        {
           name: this.$t('home.CPU'),
           key: 'cpuQuota',
           unit: 'Cores'
        },
        {
           name: this.$t('home.Memoryusage'),
           key: 'memQuota',
           unit: 'GB'
        },
        {
           name: this.$t('home.storage'),
           key: 'storageQuota',
           unit: 'GB'
        }
      ]
    },
    overviewName () {
      return {
        total_datalist: this.$t('home.collection'),
        total_alg: this.$t('home.algorithms'),
        total_model: this.$t('home.model'),
        total_forecast: this.$t('home.tasks'),
        application_task: this.$t('home.OnlineTasks'),
        application_group_task: '在线任务组',
      }
    },
    quickCreateBtnList () {
      return [
        {
          name: this.$t('home.CreateDataset'),
          type: 'data'
        },
        {
          name: this.$t('home.universalalgorithm'),
          type: 'common'
        },
        {
          name: this.$t('home.BusinessAlgorithm'),
          type: 'business'
        },
        {
          name: this.$t('home.universalmodel'),
          type: 'commonmodel'
        },
        {
          name: this.$t('home.BusinessModel'),
          type: 'model'
        }
      ]
    },
    isSSOLogin() {
      return this.$store.state.user.user.roles[0].name == 'SSOLogin'
    }
  },
  data () {
    return {
      avatarDefault: avatarDefault,
      photoList: [],
      cardList: [],
      sourceList: [],
      gpuList: [],
      gpuNumberList: {
        onlineQuotaCapacity: '在线',
        offlineQuotaCapacity: '离线',
        mixQuotaCapacity: '混合'
      },
      loading: false,
      timer: null,
      requestType: 1, //显示理论的GPU等资源使用情况
    }
  },
  beforeDestroy () {
    clearTimeout(this.timer)
  },
  beforeRouteLeave (to, from, next) {
    clearTimeout(this.timer)
    next()
  },
  mounted () {
    if (this.$store.state.user.user.roles[0].name == 'SSOLogin'){
      this.isSSOLogin = true
    }else {
      this.isSSOLogin = false
    }

    this.getAllOverview('first')
    },
  methods: {
    getRingOption,
    changeLang () {
      if (this.$i18n.locale === 'en') {
        localStorage.setItem('lang', 'zh')
        this.$i18n.locale = 'zh'
      } else {
        localStorage.setItem('lang', 'en')
        this.$i18n.locale = 'en'
      }
      this.getAllOverview('first')
    },
    getIcon (index) {
      switch (index) {
        case 0:
          return "data1"
          break;
        case 1:
          return "suanfa1"
          break;
        case 2:
          return "moxing1"
          break;
        case 3:
          return "line"
          break;
        case 4:
          return "offline"
          break;
        default:
          return 'data1'
          break;
      }
    },
    create (item) {
      let name = ''
      if (item.type === "data") {
        name = "DatacenterDatamrgIndex"
      } else if (item.type.includes('model')) {
        name = 'TrainModel'
      } else {
        name = 'TrainMirror'
      }
      this.$router.push({
        name,
        params: {
          add: true,
          type: item.type
        }
      })
    },
    async getOverviewRes () {
      try {
        const res = await getOverview()
        if (res.code !== 0) return false
        this.cardList = Object.keys(this.overviewName).map(key => {
          return {
            name: this.overviewName[key],
            value: res.data[key].total,
            runningNumber: res.data[key].runningNumber
          }
        })
      } catch(err) {
        this.cardList = Object.keys(this.overviewName).map(key => {
          return {
            name: this.overviewName[key],
            value: 0,
            runningNumber: 0
          }
        })
      }
    },
    async getK8sQuotaRes (params, value) {
      this.requestType = params
      if (value === 'first') {
        this.loading = true
      }
      try {
        const res = await getK8sQuota({ requestType: params })
        this.loading = false
        if (res.code !== 0) return false
        const data = res.data
        this.sourceList = this.sourceListName.map(item => {
          return {
            ...item,
            ...data[item.key],
            unit: item.unit
          }
        })
        const filter = Object.keys(this.gpuNumberList).filter(item => data[item])
        this.gpuList = filter.map(item => {
          return {
            ...data[item],
            name: this.gpuNumberList[item]
          }
        })
        clearTimeout(this.timer)
        this.timer = setTimeout(this.getAllOverview, 30 * 1000)
      } catch (error) {
        this.sourceList = this.sourceListName.map(item => {
          return {
            ...item,
            rate: 0,
            usage: 0,
            capacity: 0
          }
        })
        this.gpuList = [
          {
            xc_rate: 0,
            xc_capacity: 0,
            xc_usage: 0,
            num_rate: 0,
            num_capacity: 0,
            num_usage: 0
          }
        ]
        this.loading = false
      }
    },
    async getAllOverview (value) {
      this.getOverviewRes()
      this.getK8sQuotaRes(this.requestType, value)
    },
  },
}
</script>
<style lang='less' scoped>
@import "~@/config/theme.less";
.mianinfo {
  height: calc(100vh - 350px);
  width: 100%;
  display: flex;
  font-size: 14px;
  .main-center {
    height: 100%;
    width: 0px;
    flex: 1;
    margin-left: 24px;
    margin-right: 12px;
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    .quickBtn {
      height: 150px;
      width: 100%;
      padding: 12px;
      background: #fff;
      margin-bottom: 12px;
      border-radius: @borderRadiusBig;
      display: flex;
      flex-direction: column;
      .title {
        color: #333;
        margin-bottom: 12px;
        font-size: inherit;
      }
      .btnList {
        flex: 1;
        display: flex;
        justify-content: space-between;
        .btn {
          width: 19%;
          height: 80px;
          border-radius: 8px;
          line-height: 80px;
          text-align: center;
          background: #daeaff;
          cursor: pointer;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: inherit;
          padding: 0;
        }
      }
    }
    .videoplay {
      flex: 1;
      border-radius: @borderRadiusBig;
      width: 100%;
      object-fit: fill
    }
  }
  .main-right {
    position: relative;
    margin-top: 12px;
    width: 27%;
    height: 100%;
    margin-left: 12px;
    background: #61a3ff;
    border-radius: @borderRadiusBig;
    text-align: center;
    color: #fff;
    .image {
      margin-top: 100px;
      margin-bottom: 4px;
      img {
        width: 150px;
        height: 150px;
        border-radius: 50%;
      }
    }
    .name {
      font-size: 20px;
      margin-bottom: 4px;
    }
    .email {
      font-size: 14px;
      margin-bottom: 6px;
    }
    .date {
      width: 100%;
      padding: 0 8%;
      position: absolute;
      font-size: 14px;
      bottom: 72px;
      .text {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
    }
  }
}
.main {
  height: 100%;
  border-radius: @borderRadiusBig;
  margin-top: 12px;
  width: 22%;
}
.main-title {
  width: 100%;
  height: 120px;
  border-radius: @borderRadiusBig;
  background: #60a2ff;
  padding-left: 30px;
  color: #fff;
  overflow: auto;
  margin-bottom: 12px;
  .title {
    margin-top: 20px;
    color: #fff;
    font-size: 28px;
  }
}
.overview{
  background:  transparent;
  height: 100%;
  /deep/ .ant-card-body{
    height: 100%;
    padding: 0px;
  }
  .overview-name{
    height:20px;
    font-size:20px;
    font-family: '微软雅黑', sans-serif;
    font-weight:600;
    color: #2F54EB;
    line-height:20px;
  }
  .gutter-example {
    // margin-top: 20px;
    height: 100px;
    width: 100%;
    border-radius: @borderRadiusBig;
    // padding: 12px;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    justify-content: space-between;
    justify-items: center;
    .gutter-item{
      width: 19%;
      background: #fff;
      border-radius: @borderRadiusBig;
      display: flex;
      align-items: center;
      .image {
        .icon {
          width: 60px;
          height: 60px;
        }
        margin: 0 16px;
      }
      .content {
        height: 100%;
        display: flex;
        align-items: center;
        flex-direction: column;
        justify-content: center;
        .name {
          font-size: 14px;
          color: #aaa;
        }
        .number {
          margin-top: 16px;
          font-size: 28px;
          font-weight: 700;
          color: #333;
        }
      }
    }
    .gutter-box {
      height: 100px;
      padding: 5px;
      border:1px solid rgba(230,231,234,1);
      // display: flex;
      // flex-direction: column;
      // align-items:center;
      // justify-content:center;
      &:hover{
        box-shadow: 0 2px 8px rgba(0,0,0,.15)
      }
      .detail{
        width: 100%;
        text-align: center;
        float: left;
        line-height: 35px;
        padding: 10px 0;
        &.hasRunningNumber{
          width: 80%;
        }
      }
      .chart{
        float: left;
        border: 1px solid #ccc;
        width: 12px;
        height: 70%;
        border-radius: 10px;
        position: relative;
        margin-top: 17px;
        left: -30px;
        .val{
          background: #2c8421;
          position: absolute;
          bottom: 0;
          width: 100%;
          border-radius: 0 0 10px 10px;
        }
      }
      .name{
        font-size:14px;
        font-family: '微软雅黑', sans-serif;
        font-weight:400;
        color:rgba(9,16,47,0.5);
      }
      .value{
        font-size:20px;
        font-family: '微软雅黑', sans-serif;
        font-weight:500;
        color:rgba(9,16,47,1);
      }
    }
  }
  .overview-content-title{
    // margin-top: 20px;
    height: 48px;
    line-height: 48px;
    margin: 0 12px;
    span{
      font-size:16px;
      font-family: '微软雅黑', sans-serif;
      font-weight:600;
      color:rgba(9,16,47,1);
    }
    .requestType{
      float: right;
      font-weight: initial;
      font-size: 14px;
      cursor: pointer;
    }
  }
  .overview-content-left{
      display: flex;
      height: 100%;
      display: flex;
      width: 100%;
      flex-direction: column;
      justify-content: space-between;
      .datasource{
        padding: 0 10px;
        width: 100%;
        height: 18%;
        min-height: 80px;
        background: #fff;
        border-radius: @borderRadiusBig;
        display: flex;
        justify-content: space-between;
        align-items: center;
        .percentage {
          // display: flex;
          // height: 100%;
          // align-items: center;
          color: #000;
          font-size: 28px;
          font-weight: 600;
          width: 80px;
          height: 60px;
          line-height: 60px;
          text-align: center;
          // margin-left: 4px;
          // justify-content: center;
        }
        .datasource-title{
          // flex: 1;
          // margin-left: 10px;
          width: 100px;
          font-size:14px;
          font-weight:400;
          color:#AAA;
          text-align: right;
          white-space: nowrap;
          p{
            width: 100%;
            margin: 0;
            line-height: 30px;
          }
        }
        .datasource-chart{
          width: 80px;
          height: 80px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          /deep/ .ant-empty{
            position: absolute;
            left: 50%;
            transform: translate(-50%, -50%);
            top: 50%;
          }
        }
      }
    }
  .overview-content{
    height: 100%;
    .overview-content-right{
      margin-top: 12px;
      width: 100%;
      height: 100%;
      border-left: 0;
      display: flex;
      flex-direction: column;
      .datasource{
        flex: 1;
        position: relative;
        height: 230px !important;
        border-radius: @borderRadiusBig;
        display: flex;
        .gpu-item {
          margin: 0 6px;
          height: 100%;
          flex: 1;
          background: #ddeeff;
          &.hidden {
          opacity: 0;
        }
        }
        & > span {
          position: absolute;
          line-height: 25px;
          left: 5px;
        }
        &.roleNumber-1{
          height: 100%;
          .datasource-title{
            p{
              line-height: 30px;
            }
          }
          .datasource-chart{
            height: calc(100% - 60px);
          }
        }
        &.roleNumber-2{
          height: 50%;
          .datasource-title{
            p{
              line-height: 25px;
            }
          }
          .datasource-chart{
            height: calc(100% - 50px);
          }
        }
        &.roleNumber-3{
          height: 33.33%;
          .datasource-title{
            p{
              line-height: 20px;
            }
          }
          .datasource-chart{
            height: calc(100% - 40px);
          }
        }
        .datasource-title{
          font-size:14px;
          font-weight:400;
          color:#09102F;
          text-align: center;
          p{
            margin: 0;
            line-height: 30px;
          }
        }
        .datasource-chart{
          height: calc(100% - 60px);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          /deep/ .ant-empty{
            position: absolute;
            left: 50%;
            transform: translate(-50%, -50%);
            top: 50%;
          }
        }
      }
    }
  }
}
</style>
