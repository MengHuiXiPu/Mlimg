<template>
  <div class="page-content alarm">
    <a-spin :spinning="loading">
      <h4 class="name">时段设置</h4>
      <div class="alarm-item time">
        <div class="alarm-item-form">
          <label>报警时间间隔</label>
          <a-input-number v-model="data.monitorWarnTimeInterval" />
          <span>分钟</span>
          <a-tooltip placement="top">
            <template slot="title">
              报警数据的巡查与推送频率
            </template>
            <a-icon style="margin-left: 5px" type="question-circle" />
          </a-tooltip>
        </div>
        <div class="alarm-item-form">
          <label>数据统计周期</label>
          <a-input-number v-model="data.monitorIndexCycle" />
          <span>分钟</span>
          <a-tooltip placement="top">
            <template slot="title">
              针对业务指标有效，即根据设定的数据统计周期（时间段范围），统计各业务指标的数量
            </template>
            <a-icon style="margin-left: 5px" type="question-circle" />
          </a-tooltip>
        </div>
      </div>
      <h4 class="name">硬件报警设置</h4>
      <div class="alarm-item hardware">
        <div class="hardware-row header">
          <div class="header-item" :class="item.type" v-for="item in hardwareName" :key="item.type">
            <span>{{ item.name }}</span>
            <a-tooltip v-if="item.type === 'title'" placement="top">
              <template slot="title">
                #ip#: 表示主机的ip<br/>
                #index#：表示指标名称<br/>
                #value#：表示设定的阈值<br/>
              </template>
              <a-icon style="margin-left: 5px" type="question-circle" />
            </a-tooltip>
          </div>
        </div>
        <div class="hardware-content">
          <div class="hardware-content-row" v-for="item in data.hardware_setup" :key="item.name">
            <div class="hardware-content-row-item name">
              <a-select v-model="item.indexName" disabled>
                <a-select-option v-for="option in hardwareNameList" :key="option.value">
                  {{ option.name }}
                </a-select-option>
              </a-select>
            </div>
            <div class="hardware-content-row-item conf">
              <a-select v-model="item.indexTerms">
                <a-select-option v-for="compare in compareList" :key="compare.value">
                  {{ compare.name }}
                </a-select-option>
              </a-select>
            </div>
            <div class="hardware-content-row-item value">
              <a-slider v-model="item.thresholdNumber" :min="0.01" :max="1" :step="0.01" />
              <a-input-number v-model="item.thresholdNumber" :min="0.01" :max="1" :step="0.01" />
            </div>
            <div class="hardware-content-row-item title">
              <a-input v-model="item.content" allow-clear />
            </div>
            <div class="hardware-content-row-item type">
              <a-select v-model="item.status">
                <a-select-option :value="2">否</a-select-option>
                <a-select-option :value="1">是</a-select-option>
              </a-select>
            </div>
          </div>
        </div>
      </div>
      <h4 class="name">业务报警设置</h4>
      <div class="alarm-item hardware">
        <div class="hardware-row header">
          <div class="header-item" :class="[item.type, (item.type === 'value' || item.type === 'name') && 'no-slider']" v-for="item in hardwareName" :key="item.type">
            <span>{{ item.name }}</span>
            <a-tooltip v-if="item.type === 'title'" placement="top">
              <template slot="title">
                #index#：表示指标名称<br/>
                #value#：表示设定的阈值<br/>
              </template>
              <a-icon style="margin-left: 5px" type="question-circle" />
            </a-tooltip>
          </div>
        </div>
        <div class="hardware-content">
          <div class="hardware-content-row" v-for="item in data.business_setup" :key="item.name">
            <div class="hardware-content-row-item name no-slider">
              <a-select v-model="item.indexName" disabled>
                <a-select-option v-for="option in businessNameList" :key="option.value">
                  {{ option.name }}
                </a-select-option>
              </a-select>
            </div>
            <div class="hardware-content-row-item conf">
              <a-select v-model="item.indexTerms">
                <a-select-option v-for="compare in compareList" :key="compare.value">
                  {{ compare.name }}
                </a-select-option>
              </a-select>
            </div>
            <div class="hardware-content-row-item value no-slider">
              <a-input-number v-model="item.thresholdNumber" :min="1" :step="1" />
            </div>
            <div class="hardware-content-row-item title">
              <a-input v-model="item.content" allow-clear />
            </div>
            <div class="hardware-content-row-item type">
              <a-select v-model="item.status">
                <a-select-option :value="2">否</a-select-option>
                <a-select-option :value="1">是</a-select-option>
              </a-select>
            </div>
          </div>
        </div>
      </div>
      <div class="alerm-footer" style="text-align: center">
        <a-button @click="saveConfig" type="primary" :loading="saveLoading">生效</a-button>
      </div>
    </a-spin>
  </div>
</template>
<script>
import system from '@/api/system'
export default {
  name: "alarm",
  components: {
  },
  data () {
    return {
      hardwareName: [{
        name: '指标',
        type: 'name'
      }, {
        name: '条件',
        type: 'conf'
      }, {
        name: '阈值',
        type: 'value'
      }, {
        name: '报警标题',
        type: 'title'
      }, {
        name: '是否生效',
        type: 'type'
      }],
      compareList: [{
        name: '>',
        value: 1
      }, {
        name: '>=',
        value: 2
      }, {
        name: '<',
        value: 3
      }, {
        name: '<=',
        value: 4
      }],
      data: {},
      saveLoading: false,
      loading: false,
      hardwareNameList: [{
        value: 0,
        name: 'GPU超时数量'
      }],
      businessNameList: [{
        value: 0,
        name: '超时未返回的glass数量'
      }]
    }
  },
  mounted () {
    this.getData()
  },
  methods: {
    async getData () {
      // 获取表单数据
      this.loading = true
      const res = await system.alerm.getAlermData()
      this.loading = false
      if (res.code !== 0) return false
      this.data = res.data
    },
    async saveConfig () {
      // 保存配置
      const { monitorIndexCycle, monitorWarnTimeInterval,
        hardware_setup, business_setup } = this.data
      const params = {
        monitorIndexCycle,
        monitorWarnTimeInterval,
        sendWarnConfEditParamList: [
          ...hardware_setup,
          ...business_setup
        ]
      }
      this.saveLoading = true
      const res = await system.alerm.saveAlermData(params)
      this.saveLoading = false
      if (res.code !== 0) return false
      this.$message.success('保存成功')
      this.getData()
    }
  }
}
</script>

<style scoped lang="less">
.alarm{
  .name {
    // font-weight: bold;
    font-size: 18px;
  }
  &-item{
    padding: 12px;
    margin-bottom: 12px;
    background: #fff;
    border-radius: 18px;
    overflow: hidden;
    &>.name{
      // font-weight: bold;
      font-size: 18px;
    }
    &-form{
      width: 50%;
      float: left;
      padding: 0 10px;
      label{
        width: 120px;
        display: inline-block;
      }
      .ant-input-number{
        display: inline-block;
        width: calc(100% - 320px);
      }
      &>span{
        margin-left: 5px;
      }
    }
    &.hardware{
      min-height: 250px;
    }
    .hardware{
      &-row{
        &.header{
          font-weight: bold;
          overflow: hidden;
          padding-bottom: 5px;
          border-bottom: 1px solid #ccc;
          text-align: center;
        }
        .header-item{
          float: left;
          &.name{
            width: 14%;
            &.no-slider{
              width: 30%
            }
          }
          &.conf, &.type{
            width: 8%;
          }
          &.value{
            &:not(.no-slider){
              width: 30%;
            }
            &.no-slider{
              width: 14%;
            }
          }
          &.title{
            width: 40%
          }
        }
      }
      &-content{
        overflow: hidden;
        &-row{
          overflow: hidden;
          padding-top: 10px;
          &-item{
            float: left;
            padding: 0 5px;
            .ant-select{
              width: 100%
            }
            &.name{
              width: 14%;
              &.no-slider{
                width: 30%
              }
            }
            &.conf, &.type{
              width: 8%;
            }
            &.title{
              width: 40%
            }
            &.value{
              text-align: center;
              &:not(.no-slider){
                width: 30%;
                .ant-slider{
                  width: calc(70% - 20px);
                  float: left;
                  margin: 14px 10px;
                }
                .ant-input-number{
                  float: left;
                  width: 30%;
                }
              }
              &.no-slider{
                width: 14%;
                .ant-input-number{
                  width: 70%;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>