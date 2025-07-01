<template>
  <div>
    <a-row :gutter="2" class="alarm-row">
      <a-col :span="3"><span style="font-size: 16px; font-weight: bold ">是否开启告警</span></a-col>
      <a-col :span="21">
        <a-switch v-model:checked="enable" checked-children="开" un-checked-children="关" :disabled="!isEdited"/>
        <a-button v-if="!isEdited" style="float: right; margin-right: 10px" @click="editEnable">编辑</a-button>
        <div v-else  style="float: right; ">
          <a-button style="margin-right: 10px" @click="saveAlarm">保存</a-button>
          <a-button style="margin-right: 10px" @click="refreshAlertDefine">取消</a-button>
        </div>
      </a-col>
    </a-row>
    <a-row :gutter="2" class="alarm-row">
      <a-col :span="3">
        <span style="font-size: 16px; font-weight: bold ">通知静默(m)</span>
        <a-tooltip class="common-tooltip">
          <template slot="title">通知静默指在规定的一段时间内（单位：m），如果多次触发阈值告警，仅发送一次消息通知</template>
          <a-icon type="question-circle" />
        </a-tooltip>
      </a-col>
      <a-col :span="21">
        <a-input-number v-model="silenceTime" :max="10000" :min="0" style="width: 60px" :disabled="!isEdited" @change="validateSilenceTime"></a-input-number>
        <span v-if="errors.silencePeriod" class="error error-left">{{ errors.silencePeriod }}</span>
      </a-col>
    </a-row>
    <a-row :gutter="2" class="alarm-row">
      <a-col :span="3"><span style="font-size: 16px; font-weight: bold ">告警规则配置</span></a-col>
      <a-col :span="21">
        <a-row :gutter="8" class="run-title-row">
          <a-col class="header-title-row-col" :span="4">
            <span>资源</span>
          </a-col>
          <a-col class="header-title-row-col" :span="4">
            <span>指标</span>
          </a-col>
          <a-col class="header-title-row-col" :span="4">
            <span>条件</span>
          </a-col>
          <a-col class="header-title-row-col" :span="2">
            <span>阈值</span>
          </a-col>
          <a-col class="header-title-row-col" :span="4">
            <span>
              数据检测周期(m)
            </span>
            <a-tooltip class="common-tooltip">
              <template slot="title">监控的指标数据需要选择时间段约束（单位：m）：在当前设置的时间段内</template>
              <a-icon type="question-circle" />
            </a-tooltip>
          </a-col>
          <a-col class="header-title-row-col" :span="4">
            <span>
              告警间隔(m)
            </span>
            <a-tooltip class="common-tooltip">
              <template slot="title">指标的告警周期（单位：m），即指标统计的间隔周期</template>
              <a-icon type="question-circle" />
            </a-tooltip>
          </a-col>
          <a-col class="header-title-row-col" :span="2">
            <span></span>
          </a-col>
        </a-row>
        <a-row v-if="alarmRule.length > 0" v-for="(item, index) in alarmRule" :gutter="8" style="padding-bottom: 10px">
          <a-col :span="4">
            <a-select v-model="item.metric" style="width: 100px" :disabled="!isEdited" @change="validateMetric(index)">
              <a-select-option :key="item1.code" :value="item1.code"
                               v-for="item1 in metricSelect"
              >
                {{ item1.name }}
              </a-select-option>
            </a-select>
            <span v-if="errors[`metric${index}`]" class="error error-left">{{ errors[`metric${index}`] }}</span>

          </a-col>
          <a-col :span="4">
            <a-select v-model="item.field" style="width: 140px" :disabled="!isEdited" @change="validateField(index)" >
              <a-select-option :key="item1.code" :value="item1.code"
                               v-for="item1 in getFieldSelectByCode(item.metric)"
              >
                {{ item1.name }}
              </a-select-option>
            </a-select>
            <span v-if="errors[`field${index}`]" class="error error-left">{{ errors[`field${index}`] }}</span>

          </a-col>
          <a-col :span="4">
            <a-select v-model="item.exprSymbol" style="width: 120px" :disabled="!isEdited">
              <a-select-option :key="item1.code" :value="item1.code" v-for="item1 in exprSelect" @change="validateExprSymbol(index)" >
                {{ item1.name }}
              </a-select-option>
            </a-select>
            <span v-if="errors[`exprSymbol${index}`]" class="error error-left">{{ errors[`exprSymbol${index}`] }}</span>
          </a-col>
          <a-col :span="2">
            <a-input-number v-model="item.threshold" :max="10000" :min="0" style="width: 60px" :disabled="!isEdited" @change="validateThreshold(index)"></a-input-number>
            <span v-if="errors[`threshold${index}`]" class="error error-left">{{ errors[`threshold${index}`] }}</span>

          </a-col>
          <a-col :span="4">
            <a-input-number v-model="item.timeConstr" :max="10000" :min="0" style="width: 100px" :disabled="!isEdited" @change="validateTimeConstr(index)"></a-input-number>
            <span v-if="errors[`timeConstr${index}`]" class="error error-left">{{ errors[`timeConstr${index}`] }}</span>
          </a-col>
          <a-col :span="4">
            <a-input-number v-model="item.schedule" :max="10000" :min="0" style="width: 100px" :disabled="!isEdited" @change="validateSchedule(index)"></a-input-number>
            <span v-if="errors[`schedule${index}`]" class="error error-left">{{ errors[`schedule${index}`] }}</span>
          </a-col>
          <a-col :span="1">
            <a-tooltip placement="leftTop">
              <template slot="title">删除</template>
              <a-icon type="delete"  v-if="isEdited" @click="deleteRow(item)" />
            </a-tooltip>
          </a-col>
        </a-row>
        <a-row><a v-if="isEdited" @click="addRow" style="color: #0E0EFF">添加告警规则</a></a-row>
      </a-col>
    </a-row>
    <a-row :gutter="2" class="alarm-row">
      <a-col :span="3"><span style="font-size: 16px; font-weight: bold ">告警方式配置</span></a-col>
      <a-col :span="21">
        <a-row :gutter="2" style="padding-bottom: 10px;">
          <a-col :span="2"><span>告警方式: </span></a-col>
          <a-col :span="22">

            <a-checkbox-group v-model="alarmMethodCheckedList" :disabled="!isEdited" @change="validateAlarmMethod">
              <a-checkbox
                  v-for="(item) in alarmMethodOptions"
                  :key="item.code"
                  :value="item.code"
              >
                {{ item.name }}
              </a-checkbox>
            </a-checkbox-group>
            <span v-if="errors.alarmMethod" class="error">{{ errors.alarmMethod }}</span>
          </a-col>
        </a-row>
        <a-row :gutter="2">
          <a-col :span="2"><span>接收人: </span></a-col>
          <a-col :span="22">
            <div class="receiver-container">
              <div class="list-container">
                <div
                    v-for="item in receiverList"
                    :key="item.id"
                    class="name-item"
                >
                  <div class="name">
                    {{ item.nickName }}
                  </div>
                  <div class="icon">
                    <a-icon type="delete" v-if="isEdited" @click="deleteReceiver(item)"/>
                  </div>
                </div>
                <br/>
                <a v-if="isEdited" class="add-receiver-btn" @click="addReceiver">添加接收人</a>
              </div>
            </div>
            <span v-if="errors.receiver" class="error error-left">{{ errors.receiver }}</span>
          </a-col>
        </a-row>
      </a-col>
    </a-row>

    <a-modal  title="选择接收人"
              v-model:open="addDialogVisible"
              @ok="handleSelectUserOk"
              width="50%"
    >
      <alarm-user-dialog ref="alarmUserDialogRef"></alarm-user-dialog>
    </a-modal>
  </div>
</template>
<script>
import AlarmUserDialog from "@/views/application/catalog/alarmUserDialog.vue";
import {getMetricsTypeList} from "@/api/metrics";
import {getAlertData, getMetricsType, modifyAlertData, saveAlertData} from "@/api/alert";

export default {
  name: "alarmConfig",
  components: {AlarmUserDialog},
  props: {
    alarm: {
      default: {},
      type: Object
    }
  },

  data() {
    return {
      loading: false,

      isEdited: false,
      enable: false,
      silenceTime: 60,
      // 新增接收人
      addDialogVisible: false,

      monitorId: null,
      alertDefineId: null,

      metricSelect: [],

      fieldSelect: [],
      exprSelect: [
        {id: '1',  code: '>', name: '大于'},
        {id: '2',  code: '=', name: '等于'},
        {id: '3',  code: '<', name: '小于'},
        {id: '4',  code: '>=', name: '大于等于'},
        {id: '5',  code: '<=', name: '小于等于'},
      ],
      schedule: 0,
      alarmMethodOptions: [
        {code: 1, name: '邮件'},
        {code: 2, name: '待办'},
        // {code: 3, name: 'WebHook'},
        // {code: 4, name: '短信'},
        // {code: 5, name: 'T信'},
      ],

      alarmRule: [],
      alarmMethodCheckedList: [],
      receiverList: [],

      errors: {}
    }
  },

  mounted() {
    this.monitorId = this.alarm.monitorId
    this.getMetricsTypeList()
    this.getData(this.monitorId)
  },
  methods: {

    //添加行
    addRow() {
      const newKey = this.alarmRule.length ? this.alarmRule[this.alarmRule.length - 1].key + 1 : 1
      this.alarmRule.push({key: newKey, code: '', name: ''})
    },
    //删除行
    deleteRow(record) {
      this.alarmRule = this.alarmRule.filter(item => item.key !== record.key)
    },

    //开启编辑
    editEnable() {
      if (!this.isEdited) {
        this.isEdited = true
      }else {
        this.isEdited = false
      }
    },

    refreshAlertDefine(){
      this.getMetricsTypeList()
      this.getData(this.monitorId)
      this.isEdited = false
    },

    async saveAlarm() {
      //TODO校验
      if (!this.validateSilenceTime()){
        this.$message.error('请输入静默时长');
        return
      }

      if (this.alarmRule.length === 0){
        this.$message.error('请添加规则');
        return
      }else {
        for (let i = 0; i < this.alarmRule.length; i++) {
          if(!this.validateMetric(i)
              || !this.validateField(i)
              || !this.validateExprSymbol(i)
              || !this.validateThreshold(i)
              || !this.validateTimeConstr(i)
              || !this.validateSchedule(i)){
            this.$message.error('请补充规则');
            return
          }
        }
      }

      if (!this.validateAlarmMethod()){
        this.$message.error('请选择告警方式');
        return
      }

      if (!this.validateAlarmReceiver()){
        this.$message.error('请选择通知联系人');
        return
      }

      if (!this.validateSilenceTime()){
        this.$message.error('请完善信息');
        return
      }

      if (!this.validateSilenceTime()){
        this.$message.error('请完善信息');
        return
      }

      if (!this.validateSilenceTime()){
        this.$message.error('请完善信息');
        return
      }

      if (!this.validateSilenceTime()){
        this.$message.error('请完善信息');
        return
      }

      if (!this.validateSilenceTime()){
        this.$message.error('请完善信息');
        return
      }

      if (!this.validateSilenceTime()){
        this.$message.error('请完善信息');
        return
      }

      //TODO 保存告警规则最新信息
      this.alarm = {
        ...this.alarm,
        alertDefineId: this.alertDefineId,
        enable: this.enable,
        rule: this.alarmRule,
        method: this.alarmMethodCheckedList,
        receiver: this.receiverList,
        silenceTime: this.silenceTime
      }
      if(this.alarm.alertDefineId){
        this.putData(this.alarm)
      }else {
        this.postData(this.alarm)
      }

    },

    addReceiver() {
      this.addDialogVisible = true
    },

    deleteReceiver(item) {
      // alert('删除用户 '+ item+ ' 成功')
      this.receiverList = this.receiverList.filter(f => f.id !== item.id)
    },

    handleSelectUserOk(){
      this.receiverList = this.$refs.alarmUserDialogRef.crud.selections
      this.addDialogVisible = false;
    },


    getData(monitorId) {
      getAlertData(monitorId).then(res => {
        this.enable = res.data.enable
        this.silenceTime = res.data.silenceTime

        this.alertDefineId = res.data.alertDefineId

        if (res.data.rule != null) {
          this.alarmRule = []
          res.data.rule.forEach((item, index) => {
            const newKey = this.alarmRule.length ? this.alarmRule[this.alarmRule.length - 1].key + 1 : 1
            this.alarmRule.push({...item, key: newKey})
          })
        } else {
          this.alarmRule = []
        }

        if (res.data.method != null) {
          this.alarmMethodCheckedList = res.data.method
        } else {
          this.alarmMethodCheckedList = []
        }

        if (res.data.receiver != null) {
          this.receiverList = res.data.receiver
        } else {
          this.receiverList = []
        }

      })
    },
    postData(param) {
      saveAlertData(param).then(res => {
        if (this.isEdited) {
          this.$message.success('保存成功');
          this.isEdited = false;
        }
      }).catch(err => {
        console.log(err);
        this.$message.error('保存失败');
      })
    },
    putData(param) {
      modifyAlertData(param).then(res => {
        if (this.isEdited) {
          this.$message.success('保存成功');
          this.isEdited = false;
        }
      }).catch(err => {
        console.log(err);
        this.$message.error('保存失败');
      })
    },

    getMetricsTypeList() {

      getMetricsType().then(res => {
        console.log('getMetricsTypeList', res.data);
        this.metricSelect = res.data;
      })
    },

    getFieldSelectByCode(code) {
      if (code) {
        let filter = this.metricSelect.filter(f => f.code === code);
        let pop = filter.pop();
        return pop.detail
      }
      return []
    },

    validateSilenceTime() {
      if (this.silenceTime === null || this.silenceTime < 0) {
        this.errors.silenceTime = '请输入有效的通知静默时间';
        return false
      } else {
        delete this.errors.silenceTime;
        return true
      }
    },
    validateMetric(index) {
      if (!this.alarmRule[index].metric) {
        this.$set(this.errors, `metric${index}`, '请选择对象');
        return false
      } else {
        this.$delete(this.errors, `metric${index}`);
        return true
      }
    },
    validateField(index) {
      if (!this.alarmRule[index].field) {
        this.$set(this.errors, `field${index}`, '请选择指标');
        return false
      } else {
        this.$delete(this.errors, `field${index}`);
        return true
      }
    },
    validateExprSymbol(index) {
      if (!this.alarmRule[index].exprSymbol) {
        this.$set(this.errors, `exprSymbol${index}`, '请选择条件判断');
        return false
      } else {
        this.$delete(this.errors, `exprSymbol${index}`);
        return true
      }
    },
    validateThreshold(index) {
      if (this.alarmRule[index].threshold === undefined || this.alarmRule[index].threshold === '' || this.alarmRule[index].threshold === null || this.alarmRule[index].threshold < 0) {
        this.$set(this.errors, `threshold${index}`, '请输入有效的阈值');
        return false;
      } else {
        this.$delete(this.errors, `threshold${index}`);
        return true
      }
    },
    validateTimeConstr(index) {
      if (this.alarmRule[index].timeConstr === undefined || this.alarmRule[index].timeConstr === '' || this.alarmRule[index].timeConstr === null || this.alarmRule[index].timeConstr < 0) {
        this.$set(this.errors, `timeConstr${index}`, '请输入有效的数据检测周期');
        return false
      } else {
        this.$delete(this.errors, `timeConstr${index}`);
        return true
      }
    },
    validateSchedule(index) {
      if (this.alarmRule[index].schedule === undefined || this.alarmRule[index].schedule === '' || this.alarmRule[index].schedule === null || this.alarmRule[index].schedule < 0) {
        this.$set(this.errors, `schedule${index}`, '请输入有效的告警间隔');
        return false
      } else {
        this.$delete(this.errors, `schedule${index}`);
        return true
      }
    },
    validateAlarmMethod() {
      if (this.alarmMethodCheckedList.length === 0) {
        this.errors.alarmMethod = '请选择至少一种告警方式';
        return false
      } else {
        delete this.errors.alarmMethod;
        return true
      }
    },
    validateAlarmReceiver() {
      if (this.receiverList.length === 0) {
        this.errors.receiver = '请选择至少一种告警方式';
        return false
      } else {
        delete this.errors.receiver;
        return true
      }
    },
  }
}
</script>
<style lang="less" scoped>
@import "~@/config/theme.less";

.alarm {
  &-row {
    width: 100%;
    padding-bottom: 10px;
  }
}

.header {
  &-title {
    &-row {
      width: 100%;
      padding-bottom: 10px;

      .col {
        font-size: 12px;
      }
    }
  }

  &-content {
    &-row {
      width: 800px;
      padding-bottom: 10px;

      .col {
        font-size: 12px;
      }
    }
  }

}

.container {
  display: flex;
  justify-content: center; /* 水平居中内容 */
  align-items: center; /* 垂直居中内容 */
  width: auto;
  height: 30px;
  margin: 5px;
}

.child {
  display: flex;
  justify-content: center; /* 水平居中内容 */
  align-items: center; /* 垂直居中内容 */
  border: 1px dashed blue; /* 边框用于可视化 */
  padding: 2px;
  width: 80px;
}


///////////////
.receiver-container {
  //width: 300px; /* 大div的宽度 */
  //height: 200px; /* 大div的高度 */
  width: 600px;
  height: 160px;
  overflow-y: auto; /* 实现上下滚动 */
  border: 1px dashed #ccc;
  padding: 10px;
}

.list-container {
  display: flex;
  flex-wrap: wrap; /* 自动换行 */
}

.name-item {
  position: relative;
  width: 100px;
  height: 40px;
  padding: 10px;
  margin: 10px 0;
  transition: box-shadow 0.3s ease;
}

.name-item .name {
  transition: box-shadow 0.3s ease;
}

.name-item:hover .name {
  box-shadow: 0 10px 10px rgba(0, 0, 0, 0.5);
}

.icon {
  display: none;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

.name-item:hover .icon {
  display: block;
}

.add-receiver-btn {
  position: relative;
  width: 100px;
  height: 30px;
  padding: 10px;
  margin: 10px 0;
}

.run-title-row {
  line-height: 1;
}

.common-tooltip {
  vertical-align: 0em
}

.error {
  color: red;
  font-size: 12px;

  &-left {
    float: left;
  }
}
</style>