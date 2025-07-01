<template>
  <div class="block-item-container">
    <h5 class="title">输入参数
      <a-tooltip title="算子的输入参数 名称 类型 及订阅关系">
        <a-icon type="question-circle-o" style="vertical-align: 2px;" />
      </a-tooltip>
    </h5>
    <el-table :data="tableData" row-key="varName" border default-expand-all v-bind="$attr" empty-text="暂无数据">
      <el-table-column prop="varName" label="名称" show-overflow-tooltip width="90px"></el-table-column>
      <el-table-column prop="varType" label="类型" width="60px" show-overflow-tooltip></el-table-column>
      <el-table-column prop="value">
        <template slot="header" slot-scope="scope">
          <span>默认值
            <a-tooltip title="当不设置订阅关系时，该参数默认使用默认值">
              <a-icon type="question-circle-o" style="vertical-align: 2px;" />
            </a-tooltip>
          </span>
        </template>
        <template slot-scope="{ row, column, $index }">
          <image-viewer v-if="isImage((row.fileOption || {}).filterName) && Boolean(row.value)" width="50px"
            height="30px" :src="imageMap[row.varName]" :url-list="[imageMap[row.varName]]" objectFit="contain"
            :appendToBody="false">
          </image-viewer>
          <div v-else-if="(row.fileOption || {}).filterName === 'onnx'" class="select-model-wrap">
            <el-popover placement="top-start" width="200" trigger="hover" :append-to-body="false"
              :content="row.value && row.value.endsWith('.onnx') ? row.value : ''">
              <el-button type="text" slot="reference" class="onnx-status" size="mini">
                {{ row.value && row.value.endsWith('.onnx') ? '已关联' : '未关联' }}
              </el-button>
            </el-popover>
          </div>
          <a-tooltip :title="row.value" v-else>
            <span class="file-name">{{ row.value }}</span>
          </a-tooltip>
        </template>
      </el-table-column>
      <el-table-column width="110px">
        <template slot="header" slot-scope="scope">
          <span>订阅关系
            <a-tooltip title="可绑定上一节点的输出，作为该节点的输入参数，绑定后将替代默认值运行">
              <a-icon type="question-circle-o" style="vertical-align: 2px;" />
            </a-tooltip>
          </span>
        </template>
        <template slot-scope="{ row, column, $index }">
          <el-tag size="mini" type="success" v-if="row.inheritText">{{ row.inheritText }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { ref, set as $set } from 'vue';
import ImageViewer from "@/components/ImageViewer/index.js";
import Operator from "@/api/operator";
export default {
  components: {
    ImageViewer,
  },
  data() {
    return {

    }
  },
  props: {
    pipelineId: {
      type: Number,
      default: ""
    },
    tableData: {
      type: Array,
      default: () => []
    },
    graph: {
      type: Object,
      default: () => ({})
    }
  },
  watch: {
    tableData(newVal) {
      (newVal || []).forEach(item => {
        if (!item.fileOption) item.fileOption = {}
        if (item.controlType === 'fileUpload' && this.isImage(item.fileOption?.filterName)) {
          this.loadImg(item.value, item)
        }
        // 需要拆分时，添加可展开的子表格行
        if (item.struct && item.split == 1) {
          item.children = item.struct
        }
        // 转换继承变量, 需求变成又不需要多点继承了,先根据索引只取第一个信息
        if (item.inheritNodeIds?.length) {
          const id = item.inheritNodeIds[0]
          const nodeData = this.graph.getCellById(id)?.getData()
          // item.inheritText = `${nodeData?.label || nodeData?.name}-${item.inheritVariables?.[0]}`
          this.$set(item, 'inheritText', `${nodeData?.label || nodeData?.name}/${item.inheritVariables?.[0] || ""}`)
        }
      })
    }
  },
  setup(props) {
    const imageMap = ref({});
    const isImage = (str = "") => {
      return str.includes('png') || str.includes('jpg') || str.includes('jpeg')
    }
    // 上传完图片后，拿到的是图片的路径，需要根据路径去加载反显图片
    const loadImg = async (path, targetItem) => {
      if (!path) return null
      const res = await Operator.getImage({
        id: props.pipelineId,
        imgPath: path,
      })
      const url = `data:image/jpeg;base64,${res.data}`
      $set(imageMap.value, targetItem.varName, url)
    }
    return {
      imageMap,
      isImage,
      loadImg,
    }
  },
}
</script>

<style lang="less" scoped>
@import "./style.less";
</style>