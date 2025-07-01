<template>
  <a-modal
    :visible="visible"
    :footer="null"
    wrapClassName="fullscreen-modal"
    :mask="false"
    :keyboard="false"
    :destroyOnClose="true"
    :closable="false"
    @cancel="doCloseModal"
  >
    <div class="content">
      <header class="header-box">
        <div class="header-left">
          <a-steps :current="currentStep" size="small" class="step-navigation" @change="dispatchStep">
            <a-step title="多图拼接" />
            <a-step title="截取拼接大图" />
            <a-step title="部件标注" />
            <a-step title="生成MASK图"/>
            <a-step title="生成dat文件" />
          </a-steps>
        </div>
        <div class="header-right">
          <a-button type="primary" size="small" class="header-btn" v-show="currentStep != 0 " @click="dispatchStep(currentStep-1)">上一步</a-button>
          <a-button type="primary" size="small" class="header-btn" @click="dispatchStep(currentStep+1)" v-show="currentStep != 4">下一步</a-button>
          <a-button type="primary" size="small" class="header-btn" @click="saveAndClose" v-show="currentStep == 0">保存并退出</a-button>
          <a-button type="primary" size="small" class="header-btn" @click="doCloseModal">退出</a-button>
        </div>
      </header>
      <!-- <a-divider style="margin: 0"/> -->
      <div class="banner-text">{{ bannerText }}</div>
      <a-spin :spinning="spinning" :tip="spinningText">
        <article class="main-box">
          <KeepAlive>
            <component 
              :is="activeComponent" ref="refDynamicStep" 
              :tempData="tempDetailData" 
              v-if="isReady" 
              :currentStep="currentStep" 
              :showLoading="showLoading"
              :closeLoading="closeLoading"
            class="main-box-content"/>
          </KeepAlive>
        </article>
      </a-spin>
    </div>
  </a-modal>
</template>

<script>
import step1 from "./components/step1/index.vue"
import step2 from "./components/step2/index.vue"
import step3 from "./components/annotator/index.vue"
import step4 from "./components/step4.vue"
import step5 from "./components/step5.vue"
import { saveEditorData, getTempDeteil } from "@/api/tempMake.js"
import { useSetFEConfigs, useGetFEConfigs } from "./store.js"
export default {
  name: "EditModal",
  components: {
    step1: step1,
    step2: step2,
    step3, //标注页面
    step4,
    step5,
  },

  data() {
    return {
      currentStep: 0,
      stepCompMap: new Map([
        [0, 'step1'],
        [1, 'step2'],
        [2, 'step3'],
        [3, 'step4'],
        [4, 'step5'],
      ]),
      spinning: false,
      spinningText: '加载中,请稍后...',
      isReady: false, // 是否已经获取到数据，获取到之后再渲染具体页面（否则不知道渲染具体 step）
      tempDetailData: {}, //更详细的模板信息数据
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    //模板id
    // 模板数据
    tempData: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  computed: {
    // 匹配动态组件
    activeComponent() {
      return this.stepCompMap.get(this.currentStep)
    },
    bannerText() {
      const textArr = [
        '请通过鼠标左键选中右侧周期图，并拖入画布区域，完成图片的拼接工作',
        '请通过鼠标框选截取区域，并手动调整尺寸，再点击截取按钮，完成对拼接后的大图的截取',
        '请使用标注工具完成对部件的标注',
        '请点击Mask图生成按钮，完成Mask图的生成',
        '请点击生成Dat文件，完成Dat模版文件的制作'
      ]
      return textArr[this.currentStep]
    },
    tempId() {
      return this.tempData.id
    }
  },
  methods: {
    async dispatchStep(targetStep) {
      if (this.spinning) return
      // 允许查看前面的步骤
      if (targetStep < this.currentStep) {
        this.currentStep = targetStep;
        return;
      }
      // 只能查看后一步,即不允许跳跃
      if (targetStep - this.currentStep > 1) return
      try {
        if (this.currentStep == 0) {
          await this.$refs.refDynamicStep.nextStep()
          this.currentStep = 1
        } else if (this.currentStep == 1) { // step2 截取图片
          const cropedImageObj = await this.$refs.refDynamicStep.nextStep()
          const { cropedImagebase64Url, config, isNewCut } = cropedImageObj
          if (isNewCut) { //裁剪了图片，需要保存，并生成新的数据集
            this.showLoading("信息保存中...")
            // 创建虚拟数据集
            const saveRes = await saveEditorData({
              templateMakingInfoId: this.tempId,
              step: 2,
              config: JSON.stringify(config),
              picBase64: cropedImagebase64Url,
            })
            this.closeLoading()
            if (saveRes.code === 0) {
              // this.$message.success('保存成功')
              // 将生成的虚拟数据集 id 更新到tempDetailData
              if (this.tempDetailData.splicedPic) {
                this.tempDetailData.splicedPic.remark = saveRes.data.dlId
              } else {
                this.tempDetailData.splicedPic = {
                  remark: saveRes.data.dlId
                }
              }
              this.currentStep = 2
            }
          } else { //没有裁剪图片，直接进入下一步
            this.currentStep = 2
          }
        } else if (this.currentStep == 2) {  //标注完成，进入生成 mask 图
          await this.$refs.refDynamicStep.nextStep()
          this.currentStep = 3
        } else if (this.currentStep == 3) {//进入 dat 文件生成
          await this.$refs.refDynamicStep.nextStep()
          this.currentStep = 4
        }
      } catch (error) {
        this.closeLoading()
        console.error(error)
      }
    },
    // 保存并退出，仅第一步需要
    async saveAndClose() {
      try {
        if (this.spinning) return
        if (this.currentStep == 0) {
          await this.$refs.refDynamicStep.nextStep(true)
        }
        this.doCloseModal()
      } catch (e) {
        this.closeLoading()
        console.log(e)
      }
    },
    // 关闭 modal 直接退出
    async doCloseModal() {
      this.$emit('update:visible', false)
      this.$emit('success')
      this.closeLoading()
    },
    // 查询模板数据
    async getSavedData() {
      this.showLoading()
      try {
        const configResult = await getTempDeteil(this.tempId, {
          needFrontendConfigs: true,
        })
        this.closeLoading()
        if (configResult.code == 0) {
          this.tempDetailData = configResult.data || {}
          this.currentStep = configResult.data?.currentStep || 0
          // 后端在最后一步执行完成时 仍然会currentStep+1，导致无法显示最后一步的界面
          if (this.currentStep > 4) this.currentStep = 4
          useSetFEConfigs(configResult.data?.frontendConfigs)
          this.isReady = true
        }
      } catch (e) {
        this.closeLoading()
        console.error(e)
      }
    },
    /**
     * @public
     */
    showLoading(text) {
      this.spinning = true
      this.spinningText = text || '加载中,请稍后...'
    },
    /**
     * @public
     */
    closeLoading() {
      this.spinning = false
    },
  },
  created() {
    this.getSavedData()
  },
}
</script>

<style lang="less" scoped>
.header-box {
  height: 50px;
  line-height: 50px;
  display: flex;
  justify-content: space-around;
  .header-left {
    width: 70%;
    text-align: center;
    .step-navigation {
      margin-top: 15px;
    }
  }
  .header-right {
    width: 30%;
    text-align: right;
    .header-btn {
      margin: 0 10px;
    }
  }
}
.banner-text {
  height: 35px;
  line-height: 35px;
  font-size: 15px;
  color: #e6a23c;
  text-align: center;
}
.main-box {
  height: calc(100vh - 50px - 35px);
  padding-bottom: 15px;
}
/deep/ .fullscreen-modal .ant-modal {
  width: 100% !important;
  height: 100vh;
  top: 0;
  padding: 0;
}
/deep/ .fullscreen-modal .ant-modal-body {
  height: 100vh;
  padding: 0 5px 5px;
  // background-color: @bg-color-g;
}

/deep/ .fullscreen-modal .ant-modal-close-x {
  color: #ffffff;
}
/deep/ .ant-message .anticon {
  vertical-align: 0.125em;
}
</style>