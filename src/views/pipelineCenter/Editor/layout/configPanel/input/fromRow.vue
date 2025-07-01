<template>
  <el-row class="ar-form-row pading-side-3">
    <el-col :span="6" class="single-line-ellipsis" :title="item.displayName || item.varName">
      {{ item.displayName || item.varName || item.description }}
      <!-- <span class="el-icon-info"></span> -->
    </el-col>
    <el-col :span="18">
      <template v-if="item.controlType === 'textInput'">
        <el-input size="mini" v-model="item.value" :placeholder="`请输入`"></el-input>
        <!-- <inherit-block v-if="hasInherit"></inherit-block> -->
      </template>
      <template v-else-if="item.controlType === 'dropdown'">
        <el-select placeholder="请选择" v-model="item.value" size="mini">
          <!-- -${option.description} -->
          <el-option v-for="option in item.options" :key="option.value" :label="`${option.label}`" :value="option.value">
          </el-option>
        </el-select>
      </template>
      <template v-else-if="item.controlType === 'slider'">
        <el-input-number v-model="item.value" :min="item.minValue" :max="item.maxValue" :step="item.step || 1" size="mini"
          step-strictly>
        </el-input-number>
      </template>
      <template v-else-if="item.controlType === 'fileUpload'">
        <div class="vertical-center">
          <a-upload :showUploadList="false" :customRequest="$event => handleUpload($event, item)">
            <el-button size="mini" type="primary">点击上传</el-button>
          </a-upload>
          <div style="flex: 1">
            <image-viewer v-if="item.fileOption.filterName !== 'onnx' && Boolean(item.value)" width="80px" height="40px"
              :src="imageMap[item.varName]" :url-list="[imageMap[item.varName]]" objectFit="contain"
              :appendToBody="false"></image-viewer>
          </div>
        </div>
      </template>
      <template v-else-if="item.controlType === 'struct'">
        <div class="struct-border">
          <!-- 需要拆分继承 -->
          <template v-if="Boolean(item.split)">
            <form-row v-for="(structItem, index) in item.struct" :item="structItem"></form-row>
          </template>
          <!-- 不需要拆分继承，直接统一继承，显示为一个继承按钮 -->
          <template v-else>
            <inherit-block v-if="hasInherit" :item="item"></inherit-block>
          </template>
        </div>
      </template>
      <template v-else>

      </template>
    </el-col>
  </el-row>
</template>

<script>
import Operator from "@/api/operator";
import { Message as $message } from "element-ui";
import pipelineApi from "@/api/pipeline";
// import OnnxModelSelector from "../../../components/OnnxModelSelector.vue";
import { useNodeData, useGetState } from "@pipeline/Editor/store/index.js";
import InheritBlock from "./inherit.vue";
import ImageViewer from "@/components/ImageViewer/index.js";
import { ref, watch, set as $set } from "vue";
export default {
  name: "FormRow",
  components: {
    InheritBlock,
    ImageViewer,
  },
  props: {
    /**
     * 算子节点的输入端子项或初始化配置项(items/inits中的配置项)
     */
    item: {
      type: Object,
      default: () => ({})
    },
    /**
     * @description 该配置项是否可以从前辈节点中继承输出作为输入（当前逻辑是items可，inits不需要继承）
     */
    hasInherit: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    // getToken,
  },
  setup(props) {
    // const node = useNodeData();
    const pipelineId = useGetState('pipelineId')
    const imageMap = ref({})
    // 
    const handleUpload = async (data = {}, configItem) => {
      let formParam = new FormData()
      formParam.append("id", new Blob([pipelineId.value], {
        type: "application/json",
      })
      );
      formParam.append('file', data.file)
      const uploadRes = await Operator.uploadImage(formParam)
      if (uploadRes.code === 0) {
        $message.success("上传成功")
        // 将存储路径更新到configItem
        configItem.value = uploadRes.data
        loadImg(uploadRes.data, configItem)
      }
    }
    // 上传完图片后，拿到的是图片的路径，需要根据路径去加载反显图片
    const loadImg = async (path, targetItem) => {
      if (!path) return null
      // if (imageMap.value[targetItem.varName]) return imageMap.value[targetItem.varName]
      const res = await Operator.getImage({
        id: pipelineId.value,
        imgPath: path,
      })
      const url = `data:image/jpeg;base64,${res.data}`
      // imageMap.value[targetItem.varName] = url
      $set(imageMap.value, targetItem.varName, url)
    }
    watch(() => props.item.value, (newVal) => {
      if (newVal && props.item.controlType === 'fileUpload' && props.item.fileOption.filterName !== 'onnx')
        loadImg(newVal, props.item)
    }, { immediate: true })
    return {
      // node,
      handleUpload,
      loadImg,
      imageMap,
    }
  }
}


</script>

<style lang="less" scoped>
@import "~@pipeline/Editor/layout/baseStyle.less";

.ar-form-row {
  margin: 5px 0;
}

.select-model-wrap {
  margin-bottom: 5px;
}

.onnx-status {
  margin-left: 10px;
  position: absolute;
  top: 15px;
}
</style>
