<template>
  <div class="config-wrapper">
    <input-config class="input-block scrollbar" ref=""></input-config>
    <!-- 右下 输出结果展示 -->
    <div class="output-block scrollbar">
      <header class="right-header">
        <span>结果展示
          <i class="el-icon-info result-icon" style="color: #67C23A;" v-if="parsedOutputJson.code === 0"></i>
          <i class="el-icon-info result-icon" style="color: #909399;" v-if="!outputsJson"></i>

          <i class="el-icon-info result-icon" style="color: #F56C6C;" v-if="outputsJson && parsedOutputJson.code !== 0"/>
          <!-- <a-badge status="success" /> -->
        </span>
        
        <a-button type="link" size="small" @click="viewOutputJson" :disabled="!outputsJson">JSON</a-button>
      </header>
      <template v-if="Array.isArray(outputs)">
        <div v-for="record in outputs" class="output-item">
          <!-- text -->
          <el-row v-if="record.type==='text'" :gutter="5">
            <el-col :span="7" class="row-label" :title="record.label">{{ record.label }}：</el-col>
            <el-col :span="17">
              <!-- <p class="text">{{  record.value }}</p> -->
              <a-textarea v-model="record.value" size="small" disabled :auto-size="{ minRows: 2, maxRows: 6 }" v-if="record.value?.length > 12"/>
              <a-input v-model="record.value"  disabled v-else></a-input>
            </el-col>
          </el-row>
          <!-- rect -->
          <template v-if="record.type==='rect'">
            <el-row class="rect-result-area">
              <el-col :span="7" class="row-label" :title="record.label">{{ record.label }}：</el-col>
              <el-col :span="17" style="background-color: transparent;">
                <div v-for="area in record.value" class="rect-result-item">
                  <header class="space-between " style="line-height: 28px;" @mouseenter="highLigntAnnotation(true, area)" @mouseleave="highLigntAnnotation(false, area)">
                    <a-checkbox size="small" class="coordinate" v-model="area._check" @change="$event => toggleViewPath($event, area)">{{ area.rect }}</a-checkbox>
                    <i class="arrow" :class="area._showDetail ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" @click="toggleShowRectDetail(area)"></i>
                  </header>
                  <div v-show="area._showDetail" style="margin: 0 0 10px 25px">
                    <div class="text-4-bottom space-between" v-if="area.confidence">confidence： 
                      <!-- <el-tooltip :content="area.confidence" placement="top" effect="light"> -->
                        <span style="font-size: 12px;">{{ area.confidence}}</span>
                      <!-- </el-tooltip> -->
                    </div>
                    <!-- <el-row v-if="area.confidence">
                        <el-col :span="12" class="row-label">confidence：</el-col>
                        <el-col :span="12"><a-input disabled :value="area.confidence" size="small"></a-input></el-col>
                      </el-row> -->
                    <!-- <a-textarea v-model="area.text" size="small" disabled :auto-size="{ minRows: 2, maxRows: 6 }" v-if="area.text"/> -->
                    <!-- <div class="text-4-bottom">文本：</div> -->
                    <a-textarea v-model="area.text" size="small" disabled :auto-size="{ minRows: 2, maxRows: 6 }" v-if="area.text"/>
                    <!-- <p class="text-4-bottom">{{ area.text }}</p> -->
                    <!-- <el-row>
                      <el-col :span="12" class="row-label">confidence：</el-col>
                      <el-col :span="12"><a-input disabled :value="area.confidence.toFixed(2)" size="small"></a-input></el-col>
                    </el-row> -->
                    <!-- <el-row v-if="area.text" :gutter="5">
                      <el-col :span="5" class="row-label">文本：</el-col>
                      <el-col :span="18"><a-textarea v-model="area.text" size="small" disabled :auto-size="{ minRows: 2, maxRows: 6 }"/></el-col>
                    </el-row> -->
                  </div>
                </div>
              </el-col>
            </el-row >
          </template>
          <!-- Point -->
          <el-row  v-if="record.type==='point'" :gutter="5">
            <el-col :span="7" class="row-label" :title="record.label">{{ record.label }}：</el-col>
            <el-col :span="17">
              <a-input disabled v-model="record.value" size="small"></a-input>
            </el-col>
          </el-row >
          <!-- color -->
          <el-row v-if="record.type==='color'" :gutter="5">
            <el-col :span="7" class="row-label" :title="record.label">{{ record.label }}：</el-col>
            <el-col :span="17">
              <!-- 暂时只考虑一个值，即为string，不考虑多值(数组的情况) v-for="colorItem in record.value"  -->
              <div class="color-item">
                <!-- <span>{{ record.value }}</span> -->
                <a-input disabled v-model="record.value" size="small"></a-input>
                <span  :style="{backgroundColor: transformColor(record.value)}" class="color-block">
                  <!-- <el-color-picker :value ="transformColor(colorItem)" disabled></el-color-picker> -->
                </span>
              </div>
            </el-col>
          </el-row >
        </div>
      </template>
      <a-empty class="empty-info" :image="simpleImage" v-else/>
    </div>
    <!-- 输出JSON查看 -->
    <a-modal width="740px" class="dataDialog" v-model="showJsonModal" :footer="null" title="推理结果JSON数据">
      <a-textarea :rows="25" disabled v-model="fmtOutputJson" class="output-json-textarea"/>
    </a-modal>
  </div>
</template>

<script>
/**
 * outputs格式参考：https://confluence.tclking.com/pages/viewpage.action?pageId=382703057
 */
import { useState } from "../hooks/state";
import InputConfig from "./input/index.vue";
import { Empty } from 'ant-design-vue';
import  EventBus  from "@/utils/bus.js";
import { generateId } from "../../util.js";
export default {
  data() {
    return {
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
      showJsonModal: false,
      // showRectDetail: false, //展开显示rect区域下的文本，confident等输出
    }
  },
  watch: {
    outputs: {
      handler(val) {
        if(!val || !Array.isArray(val)) return
        // 获取rect输出
        const rectOutputs = val.filter(o => o.type === 'rect')
        // 获取point输出
        const pointOutputs = val.filter(o => o.type==='point')
        // 解析出rect，并emit绘制
        rectOutputs.forEach(output => {
          if(output.value && Array.isArray(output.value)) {
            output.value.forEach(v => {
              // 发布消息->graph来绘制rect
              v.rect && EventBus.$emit('r2rCreateRect', v.rect)
              // 设置默认勾选
              this.$set(v, "_check", true)
            })
          }
        })
        // 解析出point,并触发绘制
        pointOutputs.forEach(output => {
          if(output.value && output.length) {
            EventBus.$emit('r2rCreateCircle', output.value)
          }
        })
      },
      // immediate: true
    }
  },
  computed: {
    // 用于算法输出结果json查看,stringify化的
    fmtOutputJson() {
      try {
        const data = JSON.parse(this.outputsJson)
        return JSON.stringify(data, null, 1)
      }catch (e) {
        // console.error(e)
        return ""
      }
    },
    // js化的算法输出结果
    parsedOutputJson() {
      try {
        const data = JSON.parse(this.outputsJson)
        return data
      }catch (e) {
        // console.error(e)
        return {}
      }
    }
  },
  methods: {
    /**
     * @description 解析转换颜色值数组为rgb字符串，三种格式: rgb：'[41, 56, 61]', hex: '#29383d', CMYK:'(33, 8, 0, 76)'
     * @param {*} colorStr = "" 
     */
    transformColor(colorStr = "") {
      if(typeof(colorStr) !== 'string') {
        this.$message.warning("颜色值不符合规范")
        throw new Error("Invalid RGB array", colorStr);
      }
      if(colorStr.startsWith("[")) { //rgb
        // 移除方括号和空格，然后拆分成数组
        const rgbArray = colorStr.replace(/[\[\]\s]/g, '').split(',').map(Number);
        // 解构数组成单独的 RGB 值
        const [r, g, b] = rgbArray;
        // 返回 RGB 格式的字符串
        return `rgb(${r}, ${g}, ${b})`;
      }else if ( colorStr.startsWith("(") ) {// 移除括号和空格，然后拆分成数组
        const cmykArray = colorStr.replace(/[()]/g, '').split(',').map(Number);
        // 解构数组成单独的 CMYK 值
        const [c, m, y, k] = cmykArray;
        // 将 CMYK 颜色值的百分比（0-100）转换为 0-1 的范围
        const cNormalized = c / 100;
        const mNormalized = m / 100;
        const yNormalized = y / 100;
        const kNormalized = k / 100;
        // 根据公式计算 RGB 值
        const r = Math.round(255 * (1 - cNormalized) * (1 - kNormalized));
        const g = Math.round(255 * (1 - mNormalized) * (1 - kNormalized));
        const b = Math.round(255 * (1 - yNormalized) * (1 - kNormalized));
        return `rgb(${r}, ${g}, ${b})`;
      }else {
        return colorStr
      }
    },
    /**
     * 查看原始json输出
     */
    viewOutputJson() {
      this.showJsonModal = true
    },
    toggleShowRectDetail(data) {
      this.$set(data, '_showDetail', !data._showDetail)
    },
    // 显示/隐藏输出标注
    toggleViewPath(event, area) {
      const value = event.target.checked
      const rectangle = this.shapesGroup.children.find(child => child.data.id === generateId(area.rect));
      if (rectangle) {
          rectangle.visible = value;
      }
    },
    // 高亮标注块
    highLigntAnnotation(flag, area) {
      const rectangle = this.shapesGroup.children.find(child => child.data.id === generateId(area.rect));
      const originalSize = rectangle.bounds.size.clone();
      const scaleFactor = 1.2; // 缩放比例
      if (rectangle && flag) {
        // rectangle.strokeColor = '#fd7979'; // 高亮显示为黄色边框
        rectangle.strokeColor = '#1890ff'
        // rectangle.scale(scaleFactor);
        rectangle.fillColor = 'rgb(24,144,255, 0.6)'
        rectangle.strokeWidth = 1; // 加粗边框
      }
      if (rectangle && !flag) {
        rectangle.strokeColor = 'white'; // 高亮显示为黄色边框
        // rectangle.scale(1 / scaleFactor)
        rectangle.fillColor = 'rgba(0, 255, 255, 0.6)'
        rectangle.strokeWidth = 0;
      }
    }
  },
  setup() {
    const { outputs, outputsJson, shapesGroup } = useState()
    return {
      outputs,
      outputsJson,
      shapesGroup,
    }
  },
  components: {
    InputConfig,
  }
}
</script>

<style lang="less" scoped>
@import "../../base.less";
.config-wrapper {
  .input-block {
    .base-block();
    height: 59%;
    margin-bottom: 5px;
    padding: 0 10px 0 5px;
    overflow: auto;
  }
  .output-block {
    height: 39%;
    .base-block();
    padding: 0 10px;
    overflow: auto;
    .output-item {
      padding: 5px 0;
    }
    .empty-info {
      margin-top: 60px;
    }
    .color-item{
      display: flex;
      .color-block{
        height: 25px;
        width: 25px;
        margin: 0 0 5px 10px;
      }
    }
    .text {
      margin-bottom: 8px;
    }
    .text-4-bottom {
      margin-bottom: 4px;
    }
    .arrow {
      cursor: pointer;
    }
    &.ant-input-disabled {
      color: unset;
      background: unset;
    }
    .result-icon{
      font-size: 16px;
      vertical-align: text-bottom;
      margin-left: 5px;
    }
  }
}
.rect-result-item {
    header {
      &:hover {
        // background-color: #1890ff;
        // border-radius: 5px;
        // border-bottom: 1px solid #1890ff;
        // border-bottom: 1px solid #f5f5f5;
        // opacity: 0.7;
        .coordinate {
          // color: #ffffff;
          color: #1890ff;
        }
      }
    }
}
.output-json-textarea {
  &.ant-input-disabled {
    color: unset;
    background: unset;
  }
}
</style>