<template>
  <div class="page-content-height page-content">
    <a-steps :current="currentStep" size="small" type="navigation" class="step-navigation" @change="dispatchStep">
      <a-step title="选择算法推理服务" />
      <a-step title="配置code映射规则" />
      <a-step title="配置MES通信" />
      <!-- disabled -->
      <a-step title="设置图片复判筛选规则"/>
      <a-step title="设置虚拟站点信息" />
      <a-step title="完成" />
    </a-steps>
    <div style="height: 1px;background-color: #fff"></div>
    <div class="step-content scrollbar">
      <KeepAlive>
        <component :is="activeComponent" ref="refDynamicStep" :state="state" :setState="setState" />
      </KeepAlive>
    </div>
    <footer>
      <a-button @click="closeTagView" size="small" style="margin-right: 20px">取消</a-button>
      <a-button type="primary" @click="currentStep--" size="small" style="margin-right: 20px" v-if="currentStep > 0">上一步</a-button>
      <a-button type="primary" @click="handleNext" size="small" :loading="nextLoading">{{nextBtnText}}</a-button>
    </footer>
  </div>
</template>

<script>
import step1 from '../steps/step1';
import step2 from '../steps/step2';
import step3 from '../steps/step3';
import step4 from '../steps/step4';
import step5 from '../steps/step5';
import step6 from '../steps/step6';
import { saveAppData } from "@/api/picReview";
import Bus from "@/utils/bus"
export default {
  name: "picReviewAdd",
  components: {
    step1,
    step2,
    step3,
    step4,
    step5,
    step6
  },
  computed: {
    // 匹配动态组件
    activeComponent() {
      return this.stepCompMap.get(this.currentStep)
    },
    nextBtnText() {
      return this.currentStep === 5 ? '完成' : '下一步'
    }
  },
  data() {
    return {
      currentStep: 0,
      nextLoading: false, // 下一步按钮的loading
      stepCompMap: new Map([
        [0, 'step1'],
        [1, 'step2'],
        [2, 'step3'],
        [3, 'step4'],
        [4, 'step5'],
        [5, 'step6']
      ]),
      /**
       * @public
       * @description 整个流程采集的数据，会下放给各step，里面会通过表单双向绑定，所以尽量保持这个对象的pure纯净
       */
      state: {
        // id: null,
        applicationName: '',
        applicationDesc: '',
        // step1
        algoTaskId: null, //算法服务（任务）id
        // step2
        codeMappings: [ //算法返回码与业务码的映射关系
          {
            key: '',
            value: ''
          }
        ],
        // step3
        receiveDataSourceId: null,  //接收rv消息的数据源id
        nasDataSourceId: null, //nas的数据源id
        messageTypeKey: '',   //消息类型格式设置
        sendDataSourceId: null, //发送rv消息的数据源id
        messageName: '', //消息类型格式设置
        // step4
        picRule: {
          builtinAggRuleId: null, //内置的图片规则，与 customFilterRules 和 businessFields 属性互斥
          customFilterRules: [ //自定义图片过滤规则，与 builtinAggRuleId 属性互斥
            {
              fieldName: '', //业务code
              operation: '', //条件
              value: '',
              logic: 1,
            }
          ],
          businessFields: [] //自定义图片业务信息字段，与 builtinAggRuleId 属性互斥
        }, //图片复判筛选规则配置
        // step5
        virtualStationName: '', //虚拟站点名称
        virtualDeviceName: '', //虚拟站点设备描述
        resultSummaryRuleId: null, // 站点汇总规则id
      }
    }
  },
  methods: {
    dispatchStep(targetStep) {
      // 允许查看前面的步骤
      if (targetStep < this.currentStep) {
        this.currentStep = targetStep;
        return;
      }
      // 只能查看后一步,即不允许跳跃
      if (targetStep - this.currentStep > 1) return
      // 调用子组件的下一步方法，触发校验
      const nextMethod = this.$refs.refDynamicStep.next;
      nextMethod({
        resolve: () => {
          this.currentStep = targetStep;
        },
        reject: () => {
          // 第一步的提示在step1中特殊文本处理
          (this.currentStep != 0) && this.$message.warning('请填写合法的信息')
        }
      });
    },
    async handleNext() {
      const nextMethod = this.$refs.refDynamicStep.next;
      this.nextLoading = true;
      const result = new Promise((resolve, reject) => {
        nextMethod({ resolve, reject, })
      })
      result.then(() => {
        this.nextLoading = false;
        if (this.currentStep === 5) {
          this.handleSave()
        } else {
          this.currentStep++;
        }
      }).catch((error) => {
        console.error(error)
        this.nextLoading = false;
      })
    },
    handleSave() {
      this.nextLoading = true
      saveAppData(this.state).then(res => {
        if (res.code === 0) {
          this.$message.success('保存成功')
          this.closeTagView()
        }
      }).finally(() => {
        this.nextLoading = false
      })
    },
    setState(key, value) {
      this.state[key] = value
    },
    // 点击取消或新建成功后，关闭当前tagview并返回列表页
    closeTagView() {
      Bus.$emit('closeTagView', this.$route, "/application/picReview")
    }
  },
  setup() {

  },
}
</script>

<style lang="less" scoped>
/deep/ .ant-steps-finish-icon {
  vertical-align: 0;
}
.page-content {
  display: flex;
  flex-direction: column;
  padding-bottom: 10px;
  .step-navigation {
    margin-bottom: 0px;
    background-color: #f6f7fa;
    border-radius: 5px 5px 0 0;
  }
  .step-content {
    position: relative;
    flex: 1;
    overflow-y: auto;
    background-color: #f6f7fa;
    border-radius: 0 0 5px 5px;
    padding: 10px 15px 0;
  }
  footer {
    margin-top: 10px;
    height: 26px;
    text-align: right;
  }
}
</style>