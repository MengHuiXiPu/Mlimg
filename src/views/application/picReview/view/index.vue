<template>
  <div class="page-content-height page-content">
    <el-descriptions column="5" style="margin-bottom: 10px;">
      <div slot="title">
        <text-editor :text="state.applicationName" size="mini" @change="handleTextChange($event, 'applicationName')" required></text-editor>
      </div>
      <el-descriptions-item label="应用状态">
        <span >
          <a-badge status="default" v-if="state.taskStatus == 1"/> 
          <a-badge status="processing" v-else-if="state.taskStatus == 2"/> 
          <a-badge status="error" v-else/> 
          {{ state.taskStatusName }}
        </span>
      </el-descriptions-item>
      <el-descriptions-item label="创建人">{{ state.createBy }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ state.createTime | moment }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ state.updateTime | moment }}</el-descriptions-item>
      <el-descriptions-item label="描述">
        <text-editor :text="state.applicationDesc" size="mini" @change="handleTextChange($event, 'applicationDesc')"></text-editor>
      </el-descriptions-item>
    </el-descriptions>
    <!-- <div class="driver"></div> -->
     <!-- <el-divider content-position="left" class="el-descriptions__title">应用配置</el-divider> -->
    <div class="step-container scrollbar">
      <header class="space-between config-header">
        <!-- &nbsp; -->
        <h5 class="descriptions__title">应用配置</h5>
        <!-- 上线和上线中的不可修改 -->
        <el-link type="primary" :disabled="[2,3].includes(state.taskStatus)" @click="toggleEditMode" v-if="readOnly">修改配置</el-link>
        <span v-else>
          <el-link type="primary" @click="handSave" :icon="saveLoading ? 'el-icon-loading':null">保存</el-link>
          <el-link type="primary" @click="toggleEditMode">取消</el-link>
        </span>
        
      </header>
      <a-steps :current="currentStep" size="small" type="navigation" @change="dispatchStep">
        <a-step title="选择算法推理服务" />
        <a-step title="配置code映射规则" />
        <a-step title="配置MES通信" />
        <a-step title="设置图片复判筛选规则"/>
        <a-step title="设置虚拟站点信息" />
      </a-steps>
      <div class="step-content scrollbar">
        <KeepAlive>
          <component :is="activeComponent" ref="refDynamicStep" :state="state" :setState="setState" :readOnly="readOnly" v-if="state.id"/>
        </KeepAlive>
      </div>
    </div>
  </div>
</template>

<script>
import step1 from '../steps/step1';
import step2 from '../steps/step2';
import step3 from '../steps/step3';
import step4 from '../steps/step4';
import step5 from '../steps/step5';
import textEditor from "@/components/business/textEditor/index.vue";
import { saveAppData, deleteApp, getBuiltInConfig, updateAppData, queryAppDetail } from '@/api/picReview';
import cloneDeep from "lodash/cloneDeep";
export default {
  name: 'picReviewConfig',
  components: {
    step1,
    step2,
    step3,
    step4,
    step5,
    textEditor,
  },
  data() {
    return {
      currentStep: 0,
      readOnly: true, // 是否可编辑
      // 复判应用接口需要采集的数据，会下放给各step，里面会通过表单双向绑定，所以尽量保持这个对象的pure纯净
      state: {

      },
      origialState: {}, // 原始数据
      stepCompMap: new Map([
        [0, 'step1'],
        [1, 'step2'],
        [2, 'step3'],
        [3, 'step4'],
        [4, 'step5'],
      ]),
      saveLoading: false, // 保存按钮的loading
    }
  },
  computed: {
    // 匹配动态组件
    activeComponent() {
      return this.stepCompMap.get(this.currentStep)
    },
    appName() {
      return this.$route.query.name
    }
  },
  methods: {
    dispatchStep(targetStep) {
      if (this.readOnly) { //只读模式下，随意切换
        this.currentStep = targetStep;
        return
      }
      // 调用下一步方法
      const nextMethod = this.$refs.refDynamicStep.next;
      nextMethod({
        resolve: () => {
          this.currentStep = targetStep;
        },
        reject: () => {
          this.$message.warning('请填写合法的数据')
        }
      });
    },
    // 更新应用名称和描述
    handleTextChange(newText, field) {
      const id = this.$route.params.id;
      let param = {}
      // [field]: newText
      // 后端的奇葩操作, 这接口字段设计牛逼
      if (field === 'applicationName') {
        param.key = newText
      }
      if (field === 'applicationDesc') {
        param.value = newText
      }
      updateAppData(id, param).then(res => {
        if (res.code === 0) {
          this.$message.success('保存成功')
          this.state[field] = newText
        }
      })
    },
    toggleEditMode() {
      if (this.readOnly) { // 进入编辑模式
        // 记录修改前的state, 退出编辑模式时还原
        this.origialState = cloneDeep(this.state)
        this.readOnly = false
      } else { // 退出编辑模式（用户点击取消按钮）
        // 还原数据
        this.readOnly = true
        this.state = this.origialState
      }
    },
    handSave() {
      if (this.saveLoading) return
      // 校验当前step
      this.$refs.refDynamicStep.next({
        resolve: () => {
          // 校验通过，该方法会被执行
          //要去掉名称和描述，否则后端会报错重名， 这两个字段只能在updateAppData接口修改  0.0
          const param = {
            ...this.state,
          }
          delete param.applicationName
          delete param.applicationDesc
          this.saveLoading = true
          saveAppData(param).then(res => {
            if (res.code === 0) {
              this.$message.success('保存成功')
              this.readOnly = true
              this.getAppDetail()
            }
          }).finally(() => {
            this.saveLoading = false
          })
        },
        reject: () => {
          // 校验不通过
          this.$message.warning('请填写正确的信息后再保存')
        }
      })
      // const id = this.$route.params.id;
    },
    // 获取应用详情
    getAppDetail() {
      queryAppDetail(this.$route.params.id).then(res => {
        if (res.code == 0) {
          this.state = res.data || {}
        }
      })
    },
    setState(key, value) {
      this.state[key] = value
    }
  },
  created() {
    this.getAppDetail()
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
  .step-container {
    flex: 1;
    overflow-y: auto;
    background-color: #f6f7fa;
    border-radius: 5px;
    padding: 10px 15px;
    // 因为只读状态时样式与原型不兼容，这里稍作美化，那个原型也就那么回事
    .step-content {
      position: relative;
      min-height: calc(100% - 100px);
      background-color: #ffffff;
      border-radius: 5px;
      padding: 10px 15px 0;
    }
  }
  &::v-deep {
    .el-descriptions__header {
      margin-bottom: 15px;
    }
    .el-descriptions__body .el-descriptions__table .el-descriptions-item__cell {
      font-weight: 600;
      font-size: 14px;
    }
    .el-divider__text {
      font-weight: 600;
      font-size: 16px;
    }
  }
}
.config-header {
  /deep/ .el-link {
    margin-left: 10px;
    font-size: 15px;
  }
}
</style>