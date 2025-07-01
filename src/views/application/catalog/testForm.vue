<template>
  <a-form
      :model="alarm"
      :rules="rules"
      ref="formRef"
      :labelCol="{ span: 3 }"
      :wrapperCol="{ span: 21 }"
  >
    <a-form-item name="enable">
      <template #label>
        <span style="font-size: large">是否开启告警</span>
      </template>
      <a-switch v-model:checked="alarm.enable" checked-children="开" un-checked-children="关" :disabled="!isEdited"/>
      <a-button v-if="!isEdited" style="float: right; margin-right: 10px" @click="editEnable">编辑</a-button>
      <div v-else  style="float: right; ">
        <a-button style="margin-right: 10px" @click="saveAlarm">保存</a-button>
        <a-button style="margin-right: 10px" @click="refreshAlertDefine">取消</a-button>
      </div>
    </a-form-item>
    <a-form-item name="silenceTime">
      <template #label>
        <a-tooltip title="告警静默指在规定的一段时间内（单位：m），如果多次触发阈值告警，仅发送一次消息通知">
          <span style="font-size: large">告警静默(m)</span>
        </a-tooltip>
      </template>
      <a-input-number v-model="alarm.silenceTime" :max="10000" :min="0" style="width: 60px" :disabled="!isEdited"></a-input-number>
    </a-form-item>

    <a-form-item name="alertRun">
      <template #label>
        <span style="font-size: large">告警规则</span>
      </template>
      <a-col>
        <a-row :gutter="8" class="run-title-row">
          <!--          <a-col class="header-title-row-col" :span="1">-->
          <!--          </a-col>-->
          <a-col class="header-title-row-col" :span="4">
            <span>对象</span>
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
        <a-row v-if="alarm.rule.length > 0" v-for="(item, index) in alarm.rule" :gutter="8" style="padding-bottom: 10px">
          <!--            <a-col :span="1">-->
          <!--              <span v-if="alarmRule.length > 1 && index > 0" style="font-size: larger">or</span>-->
          <!--            </a-col>-->
          <a-col :span="4">
            <a-select v-model="item.metric" style="width: 100px" :disabled="!isEdited">
              <a-select-option :key="item1.code" :value="item1.code"
                               v-for="item1 in metricSelect"
              >
                {{ item1.name }}
              </a-select-option>
            </a-select>
          </a-col>
          <a-col :span="4">
            <a-select v-model="item.field" style="width: 140px" :disabled="!isEdited" >
              <a-select-option :key="item1.code" :value="item1.code"
                               v-for="item1 in getFieldSelectByCode(item.metric)"
              >
                {{ item1.name }}
              </a-select-option>
            </a-select>
          </a-col>
          <a-col :span="4">
            <a-select v-model="item.exprSymbol" style="width: 120px" :disabled="!isEdited">
              <a-select-option :key="item1.code" :value="item1.code" v-for="item1 in exprSelect">
                {{ item1.name }}
              </a-select-option>
            </a-select>
          </a-col>
          <a-col :span="2">
            <a-input-number v-model="item.threshold" :max="10000" :min="0" style="width: 60px" :disabled="!isEdited"></a-input-number>
          </a-col>
          <a-col :span="4">
            <a-input-number v-model="item.timeConstr" :max="10000" :min="0" style="width: 100px" :disabled="!isEdited"></a-input-number>
          </a-col>
          <a-col :span="4">
            <a-input-number v-model="item.schedule" :max="10000" :min="0" style="width: 100px" :disabled="!isEdited"></a-input-number>
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
    </a-form-item>

    <!-- 复选框 -->
    <a-form-item name="alertMethod">
      <template #label>
        <span style="font-size: large">告警方式配置</span>
      </template>
      <a-row :gutter="2" style="padding-bottom: 10px;">
        <a-col :span="2"><span>告警方式 </span></a-col>
        <a-col :span="22">
          <a-checkbox-group v-model="alarm.method" :disabled="!isEdited">
            <a-checkbox
                v-for="(item) in alarmMethodOptions"
                :key="item.code"
                :value="item.code"
            >
              {{ item.name }}
            </a-checkbox>
          </a-checkbox-group>
        </a-col>
      </a-row>
      <a-row :gutter="2">
        <a-col :span="2"><span>接收人 </span></a-col>
        <a-col :span="22">
          <div class="receiver-container">
            <div class="list-container">
              <div
                  v-for="item in alarm.receiver"
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
        </a-col>
      </a-row>
    </a-form-item>

    <a-modal  title="选择接收人"
              v-model:open="addDialogVisible"
              @ok="handleSelectUserOk"
              width="50%"
    >
      <alarm-user-dialog ref="alarmUserDialogRef"></alarm-user-dialog>
    </a-modal>
  </a-form>
</template>

<script>
import AlarmUserDialog from "@/views/application/catalog/alarmUserDialog.vue";

export default {
  components: {
    AlarmUserDialog
  },
  props: {
    alarm: {
      default: {},
      type: Object
    }
  },
  data() {
    return {
      rules: {
        enable: [{ required: true, message: '请选择是否开启' }],
        silenceTime: [{ required: true, message: '请输入静默时长' }],
        alertRun: [{ required: true, message: '请填写告警规则' }],
        alertMethod: [{ required: true, message: '请选择告警方式' }],
      },

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
      receiverList: []
    };
  },
  mounted() {
    this.monitorId = this.alarm.monitorId
    this.getMetricsTypeList()
    this.getAlertData(this.monitorId)
  },
  methods: {
    handleSubmit() {
      this.$refs.formRef.validate().then(() => {
        // 表单验证通过后的处理逻辑
        console.log('表单验证成功:', this.form);
      }).catch(error => {
        console.log('表单验证失败:', error);
      });
    },


    //添加行
    addRow() {
      const newKey = this.alarm.rule.length ? this.alarm.rule[this.alarm.rule.length - 1].key + 1 : 1
      this.alarm.rule.push({key: newKey, code: '', name: ''})
    },
    //删除行
    deleteRow(record) {
      this.alarm.rule = this.alarm.rule.filter(item => item.key !== record.key)
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
      this.getAlertData(this.monitorId)
      this.isEdited = false
    },

    async saveAlarm() {
      this.$refs.formRef.validate().then(() => {
        // 表单验证通过后的处理逻辑
        console.log('表单验证成功:', this.form);

        //TODO 保存告警规则最新信息
        // this.alarm = {
        //   ...this.alarm,
        //   alertDefineId: this.alertDefineId,
        //   enable: this.enable,
        //   rule: this.alarmRule,
        //   method: this.alarmMethodCheckedList,
        //   receiver: this.receiverList,
        //   silenceTime: this.silenceTime
        // }
        if(this.alarm.alertDefineId){
          this.putData(this.alarm)
        }else {
          this.postData(this.alarm)
        }

      }).catch(error => {
        console.log('表单验证失败:', error);
      });
    },

    addReceiver() {
      this.addDialogVisible = true
    },

    deleteReceiver(item) {
      // alert('删除用户 '+ item+ ' 成功')
      this.alarm.receiver = this.alarm.receiver.filter(f => f.id !== item.id)
    },

    handleSelectUserOk(){
      this.alarm.receiver = this.$refs.alarmUserDialogRef.crud.selections
      this.addDialogVisible = false;
    },


    getAlertData(monitorId) {
      axios({
        url: '/api/v1/alert/config/'+ monitorId,
        method: 'get'
      }).then(res => {
        console.log('testForm',res.data);
        this.alarm.enable = res.data.enable
        this.alarm.silenceTime = res.data.silenceTime

        this.alarm.alertDefineId = res.data.alertDefineId

        if(res.data.rule !=null){
          res.data.rule.forEach((item, index) => {
            const newKey = this.alarm.rule.length ? this.alarm.rule[this.alarm.rule.length - 1].key + 1 : 1
            this.alarm.rule.push({...item, key: newKey})
          })
        }else {
          this.alarm.rule =[]
        }

        if(res.data.method !=null ){
          this.alarm.method = res.data.method
        }else {
          this.alarm.method = []
        }

        if(res.data.receiver !=null ){
          this.alarm.receiver = res.data.receiver
        }else {
          this.alarm.receiver = []
        }

        console.log('this.alarm',this.alarm);
      })
    },
    postData(param) {
      axios({
        url: '/api/v1/alert/config',
        method: 'post',
        data: param
      }).then(res => {
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
      axios({
        url: '/api/v1/alert/config',
        method: 'put',
        data: param
      }).then(res => {
        if (this.isEdited) {
          this.$message.success('保存成功');
          this.isEdited = false;
        }
      }).catch(err => {
        console.log(err);
        this.$message.error('保存失败');
      })
    },

    isNumber(value){
      if(isNaN(value)){
        console.log('不是数字');
      }else{
        console.log('是数字');
      }
    },
    getMetricsTypeList(){

      axios({
        url: '/api/v1/alert/metrics/type',
        method: 'get'
      }).then(res => {
        console.log('getMetricsTypeList', res.data);
        this.metricSelect = res.data;
      })
    },

    // getFieldSelect(item, id){
    //   // getMetricsType(id).then(res => {
    //   //   console.log(res);
    //   //   this.fieldSelect = res.data.detail
    //   // }).catch(err => {
    //   //   console.log(err);
    //   // })
    //   this.fieldSelect = []
    //   axios({
    //     url: '/api/v1/alert/metrics/type/' + id,
    //     method: 'get'
    //   }).then(res => {
    //     console.log('getMetricsType', res.data);
    //     this.fieldSelect = res.data.detail
    //     item.fieldList = res.data.detail
    //   })
    // },

    getFieldSelectByCode(code){
      if (code){
        let filter = this.metricSelect.filter(f => f.code === code);
        let pop = filter.pop();
        return pop.detail
      }
      return []
    },

    isExist(code, alarmRule){
      return alarmRule.find(f => f.metric === code);
    }
  },
};
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
.run-title-row{
  line-height: 1;
}
.common-tooltip{
  vertical-align: 0em
}
</style>