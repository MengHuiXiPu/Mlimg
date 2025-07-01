<template>
  <div>
    <div>
      <h3 class="setting-index-title">画布设置</h3>
      <a-list :split="false">
        <a-list-item>
          <el-input-number v-model="frameConfig.width" size="mini" slot="actions" @blur="resetFrameSize" :controls="false" :min="400"/>
          <a-list-item-meta>
            <span slot="title">画布宽度</span>
          </a-list-item-meta>
        </a-list-item>
        <a-list-item>
          <el-input-number v-model="frameConfig.height" size="mini" slot="actions" @blur="resetFrameSize" :controls="false" :min="300"/>
          <a-list-item-meta>
            <div slot="title">画布高度</div>
          </a-list-item-meta>
        </a-list-item>
        <a-list-item>
          <a-switch slot="actions" size="small" v-model="frameConfig.guideLinesEnabled" @change="toggleGuideLine"/>
          <a-list-item-meta>
            <span slot="title">自动吸附对齐
              <a-tooltip title="开启后在一定间隔内会与最近的节点对齐">
                <a-icon type="question-circle" class="table-question-icon"/> 
              </a-tooltip>
            </span>
          </a-list-item-meta>
        </a-list-item>
      </a-list>
    </div>
    <!-- 存在选中的图片时，显示图片信息 -->
    <div v-show="state.showPanel">
      <a-divider />
      <div>
        <h3 class="setting-index-title">图片信息</h3>
        <a-list :split="false">
          <a-list-item>
            <a-list-item-meta title="当前图片"></a-list-item-meta>
            <span slot="actions" class="text-ellipsis list-item-content" :title="state.picName">{{ state.picName }}</span>
          </a-list-item>
          <a-list-item>
            <a-list-item-meta title="图片像素"></a-list-item-meta>
            <span slot="actions">{{ `${state.width}*${ state.height }` }}</span>
          </a-list-item>
          <!-- <a-list-item>
            <a-list-item-meta title="位置坐标"></a-list-item-meta>
            <span slot="actions">{{ `${state.position.x}*${ state.position.y }` }}</span>
          </a-list-item> -->
          <a-list-item>
            <a-switch slot="actions" size="small" v-model="state.locked" @change="handleLocked"/>
            <a-list-item-meta>
              <span slot="title">锁定图片
                <a-tooltip title="当图片处于锁定状态下的图片无法被拖动、修改等操作">
                  <a-icon type="question-circle" class="table-question-icon"/> 
                </a-tooltip>
              </span>
            </a-list-item-meta>
          </a-list-item>
        </a-list>
      </div>
      <a-divider />
      <div>
        <div class="space-between" style="margin-bottom: 12px;">
          <h3 class="setting-index-title" style="margin-bottom: 0;">单图旋转操作
            <a-tooltip title="选中图片后，设置旋转角度（0 ~ +-360°之间，精确到0.1°），点击按钮可对图片进行旋转">
              <a-icon type="question-circle" class="table-question-icon"/> 
            </a-tooltip>
          </h3>
          <a-button type="primary" @click="handleRotate" :disabled="state.locked" size="small">点击旋转</a-button>
        </div>
        <a-list :split="false">
          <a-list-item>
            <a-input-number v-model="state.rotation" size="small" slot="actions" :min="-360" :max="360" :disabled="state.locked" :precision="1" :step="0.1"/>
            <a-list-item-meta title="旋转角度"></a-list-item-meta>
          </a-list-item>
        </a-list>
      </div>
      <a-divider />
      <div>
        <div class="space-between" style="margin-bottom: 12px;">
          <h3 class="setting-index-title" style="margin-bottom: 0;">单图裁剪操作
            <a-tooltip title="选中图片后，设置图片各边缘的裁剪像素值，点击按钮可对图片进行裁剪">
              <a-icon type="question-circle" class="table-question-icon"/> 
            </a-tooltip>
          </h3>
          <a-button type="primary" @click="handleCut" :disabled="state.locked || !canCut" size="small" :loading="cutLoading">点击裁剪</a-button>
        </div>
        <a-list :split="false">
          <a-list-item>
            <span slot="actions">
              <a-input-number v-model="state.cropData.topPx" size="small" :precision="0" :min="0" :max="state.height-1"/>
              像素裁剪
            </span>
            <a-list-item-meta title="上端边缘"></a-list-item-meta>
          </a-list-item>
          <a-list-item>
            <span slot="actions"><a-input-number v-model="state.cropData.bottomPx" size="small" :precision="0" :min="0" :max="state.height-1"/>像素裁剪</span>
            <a-list-item-meta title="下端边缘"></a-list-item-meta>
          </a-list-item>
          <a-list-item>
            <span slot="actions"><a-input-number v-model="state.cropData.leftPx" size="small" :precision="0" :min="0" :max="state.width-1"/>像素裁剪</span>
            <a-list-item-meta title="左端边缘"></a-list-item-meta>
          </a-list-item>
          <a-list-item>
            <span slot="actions"><a-input-number v-model="state.cropData.rightPx" size="small" :precision="0" :min="0" :max="state.width-1"/>像素裁剪</span>
            <a-list-item-meta title="右端边缘"></a-list-item-meta>
          </a-list-item>
        </a-list>
      </div>
    </div>
  </div>
</template>

<script>
import { useGetFrame, useGetApp } from '../../store.js';
// import { throttle } from "lodash"
let app = null
let frame = null
export default {

  name: 'configPanel',
  data() {
    return {
      rotate: 0, //      // 旋转角度
      cutLoading: false,
    }
  },
  props: {
    // 画布配置
    frameConfig: {
      type: Object,
      default: () => ({})
    },
    state: {
      type: Object,
      default: () => ({})
    },
  },
  computed: {
    // 裁剪按钮是否可点击
    canCut() {
      const { topPx, leftPx, bottomPx, rightPx } = this.state?.cropData || {}
      return this.state?.cropData && (topPx || leftPx || bottomPx || rightPx)
    },
    maxTopPx() {
      return this.state.height - this.state.cropData.bottomPx - 1 < 0 ? 0 : this.state.height - this.state.cropData.bottomPx - 1
    }
  },
  methods: {
    handleRotate() {
      this.$emit("emitEvent", "rotate", this.state.rotation)
    },
    // 开启/关闭自动吸附
    toggleGuideLine() {
      this.$emit("emitEvent", "toggleGuideLine", this.frameConfig.guideLinesEnabled)
    },
    handleCut() {
      // 先校验裁剪尺寸是否超出图片本身大小
      const { topPx, leftPx, bottomPx, rightPx } = this.state?.cropData || {}
      const { width, height } = this.state
      if (topPx + bottomPx >= height || leftPx + rightPx >= width) {
        this.$message.error('裁剪尺寸不能超出图片本身大小')
        return
      }
      this.cutLoading = true
      setTimeout(() => {
        this.cutLoading = false
      }, 1000)
      this.$emit("emitEvent", "crop")
    },
    handleLocked(val) {
      this.$emit("emitEvent", "locked", this.state.locked)
    },
    resetFrameSize() {
      const { width, height } = this.frameConfig
      // frame.resizeWidth(width)
      // frame.resizeHeight(height)
      frame.width = width
      frame.height = height
    },
    initParams() {
      frame = useGetFrame()
      app = useGetApp()
    },
  },
  setup() {

  },
  mounted() {
    // this.$nextTick(() => {
    //   this.initParams()
    // })
    setTimeout(() => {
      this.initParams()
    }, 1000)
  }
}
</script>

<style lang="less" scoped>
// 文本超出省略的样式
.text-ellipsis {
  display: inline-block;
  width: 130px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/deep/ .ant-list-item {
  padding: 10px 0;
  // margin: 5px 0;
}
/deep/ .ant-divider-horizontal {
  margin: 18px 0;
}
/deep/ .ant-list-item-action {
  margin-left: 20px;
}

// .list-item-content {
//   max-height: 100px;
// }
.setting-index-title {
  margin-bottom: 12px;
  color: rgba(0, 0, 0, 0.85);
  font-size: 15px;
  line-height: 22px;
}
</style>