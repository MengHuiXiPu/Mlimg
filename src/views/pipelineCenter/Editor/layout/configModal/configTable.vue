<template>
  <div>
    <!-- :tree-props="{ children: 'struct', }" -->
    <el-table :data="tableData" row-key="varName" border default-expand-all v-bind="$attr" empty-text="无参数需要配置">
      <el-table-column prop="varName" label="参数名称" show-overflow-tooltip></el-table-column>
      <el-table-column prop="varType" label="参数类型"></el-table-column>
      <el-table-column prop="value" label="参数值" width="240px">
        <template slot-scope="{ row, column, $index }">
          <el-input size="mini" v-model="row.value" :placeholder="`请输入`"
            v-if="row.controlType === 'textInput'"></el-input>
          <el-select placeholder="请选择" v-model="row.value" size="mini" v-else-if="row.controlType === 'dropdown'">
            <el-option v-for="option in row.options" :key="option.value" :label="`${option.label}`"
              :value="option.value"></el-option>
          </el-select>
          <el-input-number v-else-if="row.controlType === 'slider'" v-model="row.value" :min="row.minValue"
            :max="row.maxValue" :step="row.step || 1" size="mini">
          </el-input-number>
          <template v-else-if="row.controlType === 'fileUpload'">
            <div class="vertical-center">
              <!-- 这里可以上传图片和模型文件 -->
              <a-upload :showUploadList="false" :customRequest="$event => handleUpload($event, row)"
                :before-upload="(file) => beforeUpload(file, row)">
                <el-tooltip :content="`请选择${row.fileOption.filterName}格式文件`" effect="light" placement="top">
                  <el-button size="mini" type="primary" style="margin:0 2px;">点击上传</el-button>
                </el-tooltip>
              </a-upload>
              <image-viewer v-if="isImage(row.fileOption.filterName) && Boolean(row.value)" width="60px" height="30px"
                :src="imageMap[row.varName]" :url-list="[imageMap[row.varName]]" objectFit="contain"
                :appendToBody="false">
              </image-viewer>
              <!-- onnx的可以选择系统内模型方式 -->
              <div v-else-if="row.fileOption.filterName === 'onnx'" class="select-model-wrap">
                <el-button size="mini" type="primary" @click="$event => callOnnxModelSelector(row)">选择模型</el-button>
                <el-popover placement="top-start" width="200" trigger="hover" :append-to-body="false"
                  :content="row.value && row.value.endsWith('.onnx') ? row.value : ''">
                  <el-button type="text" slot="reference" class="onnx-status" size="mini">
                    {{ row.value && row.value.endsWith('.onnx') ? '已关联' : '未关联' }}
                  </el-button>
                </el-popover>
              </div>
              <el-tooltip :content="row.value" effect="light" placement="top" v-else>
                <span class="file-name">{{ row.value }}</span>
              </el-tooltip>
            </div>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述信息">
      </el-table-column>
      <el-table-column prop="address" label="订阅关系" v-if="hasInherit">
        <!-- 第一级一定有继承，第二级看是否可被拆分继承 -->
        <template slot-scope="{ row, column, $index }"
          v-if="row._firstLvel || (!row._firstLvel && Boolean(row._split))">
          <el-cascader :options="row._allPreCellData" :props="{ multiple: true }" clearable v-model="row._inheritData"
            @change="handleInheritChange($event, row)"></el-cascader>
        </template>
      </el-table-column>
    </el-table>
    <onnx-model-selector ref="onnxModelSelector" :getContainer="getContainer"></onnx-model-selector>
  </div>
</template>

<script>
import { Message as $message } from "element-ui";
import { useGraph, useGetState, useCell } from "@pipeline/Editor/store/index.js";
import { ref, watch, set as $set, onMounted } from "vue";
import ImageViewer from "@/components/ImageViewer/index.js";
import { toInheritData, fromInheritData } from "@pipeline/Editor/util/transData.js";
import OnnxModelSelector from "../../../components/OnnxModelSelector.vue";
import { matchRequestMethod } from "@pipeline/Editor/common/request.js";
export default {
  components: {
    ImageViewer,
    OnnxModelSelector,
  },
  props: {
    tableData: {
      type: Array,
      default: () => [],
    },
    // 是否有继承关系需要配置
    hasInherit: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {

    }
  },
  methods: {
    // 文件上传前格式校验
    beforeUpload(file, item) {
      const allowedExtensions = item.fileOption?.filterName.split(",");
      const isAllowedExtension = allowedExtensions.some((ext) => file.name.endsWith(`.${ext}`));
      if (!isAllowedExtension) {
        this.$message.error("文件类型不符合要求！");
        return false;
      }
    },
    getContainer() {
      return document.getElementById('graph-config-wrapper')
    },
    handleInheritChange(val, row) {
      const { inheritNodeIds, inheritVariables } = fromInheritData(val)
      row.inheritNodeIds = inheritNodeIds
      row.inheritVariables = inheritVariables
    },
    /**
     * @description: 调用选择算子模型页面以及后续逻辑处理
     * @param {Object} item 当前算子的item对象
     */
    async callOnnxModelSelector(item) {
      const instance = this.$refs?.onnxModelSelector;
      try {
        const selectResult = await instance.invokeModel({
          modelId: item.modelId,  //该参数用于反显已选择的模型
        });
        this.$emit('showLoading', true)
        const bindResult = await matchRequestMethod('bindModel')(this.pipelineId, {
          modelId: selectResult.id
        })
        this.$emit('showLoading', false)
        if (bindResult.code == 0) {
          item.value = bindResult.data || ""
          this.$message.success('模型绑定成功')
          item.modelId = selectResult.id
        }
      } catch (e) {
        this.$emit('showLoading', false)
        // this.$message.warning(e)
        console.error(e)
      }
    },
  },
  mounted() {
    // this.buildData(this.tableData)
  },
  setup(props) {
    const pipelineId = useGetState('pipelineId')
    const graph = useGraph()
    const cell = useCell();
    const imageMap = ref({});
    const loading = ref(false);
    const isImage = (str = "") => {
      // return /\.(jpg|jpeg|png|gif)$/.test(str)
      return str.includes('png') || str.includes('jpg') || str.includes('jpeg')
    }
    // 
    const handleUpload = async (data = {}, configItem) => {
      let formParam = new FormData()
      formParam.append("id", new Blob([pipelineId.value], {
        type: "application/json",
      })
      );
      formParam.append('file', data.file)
      const uploadRes = await matchRequestMethod('upload')(formParam)
      if (uploadRes.code === 0) {
        $message.success("上传成功")
        // 将存储路径更新到configItem
        configItem.value = uploadRes.data
        if (isImage(configItem.fileOption.filterName)) {  //判定为图片类型，加载图片
          loadImg(uploadRes.data, configItem)
        }
      }
    }
    // 上传完图片后，拿到的是图片的路径，需要根据路径去加载反显图片
    const loadImg = async (path, targetItem) => {
      if (!path) return null
      // if (imageMap.value[targetItem.varName]) return imageMap.value[targetItem.varName]
      const res = await matchRequestMethod('getImage')({
        id: pipelineId.value,
        imgPath: path,
      })
      const url = `data:image/jpeg;base64,${res.data}`
      $set(imageMap.value, targetItem.varName, url)
    }
    /**
    * 组装成可被el-cascader使用的数据结构
    */
    const buildData = (opItemData) => {
      // 获取输入端子的类型，与其匹配的输出类型才可被选中
      const legalType = opItemData.varType;  //为any时，不校验，即表示无类型限制，必有值，为null的都是脏数据,暂时当做any
      // 获取所有先序节点，并过滤掉start节点, 嵌套的节点可以继承外面的节点,但是外面的节点不能继承里面的节点
      const allPreCell = (graph.value.getPredecessors(cell.value) || []).filter(item => item.getData().name !== 'start').filter(node => {
        // return node.getParentId() === cell.value.getParentId()
        const currentParentId = cell.value.getParentId()
        if (!currentParentId) {  //说明当前节点是最外层的节点,要过滤掉嵌套在节点内的节点(存在父节点的节点)
          return !node.getParentId()
        }
        // 如果当前节点本身就是嵌套在某个节点内部,那么所有先序节点都可以继承
        return true
      })
      const allPreCellData = allPreCell.map(cell => {
        // 获取cell 的data
        const data = cell.getData()
        // 组装成可被el-cascader使用的数据结构
        return {
          value: data.id || data.name,
          label: data._label,
          children: data.outputs.map(item => {
            // 处理脏数据的情况,1、默认不拆分2、未配置varType就是any
            item._split = item.split === null ? 0 : item.split
            item._varType = item.varType === null ? 'any' : item.varType
            // item.struct = item.struct || []
            return {
              value: item.varName,
              label: item.displayName || item.varName,
              // 结构体类型且可被拆分继承再添加children
              children: (item.struct && Boolean(item._split)) ? item.struct.map(sitem => {
                sitem._varType = sitem.varType === null ? 'any' : sitem.varType
                return {
                  value: sitem.varName,
                  label: sitem.displayName || sitem.varName,
                  disabled: Boolean(legalType !== 'any' && sitem._varType !== 'any' && sitem._varType !== legalType)
                }
              }) : null,
              // 算子必须配置了varType，否则一概不能继承
              // 有一个是any的，那么都可以继承
              // 不为空且不都不是any，则类型相同才能用
              // disabled: (!legalType || !item.varType) ? true : (item.varType == 'any' || legalType == 'any') ? false : Boolean(item.varType !== legalType)
              disabled: (legalType !== 'any' && item._varType !== 'any' && item._varType !== legalType)
            }
          })
        }
      })
      // 设置订阅关系可选择项
      opItemData._allPreCellData = allPreCellData
      // 将已有的继承关系信息转换为可被el-cascader反显的格式
      $set(opItemData, "_inheritData", toInheritData(opItemData.inheritNodeIds, opItemData.inheritVariables))
      // 标识是第一级参数
      opItemData._firstLvel = true
      if (opItemData.struct && opItemData.split == 1) { //需要拆分继承时，给strcut中的数据也写入是否可继承的标识
        opItemData.children = opItemData.struct
        opItemData.children.forEach(child => {
          child._split = 1; // 使得子表格也显示订阅关系选择框
          buildData(child);  //递归设置构建订阅关系可选项
        })
        return
      }
    }
    onMounted(() => {
      props.tableData.forEach(item => {
        if (item.controlType === 'fileUpload' && isImage(item.fileOption.filterName)) {
          loadImg(item.value, item)
        }
        if (props.hasInherit) {
          buildData(item)
        } else {
          // 需要拆分时，添加可展开的子表格行
          if (item.struct && item.split == 1) {
            item.children = item.struct
          }
        }
      })
    })
    return {
      // node,
      handleUpload,
      loadImg,
      imageMap,
      pipelineId,
      loading,
      isImage,

    }
  }
}
</script>

<style lang="less" scoped>
@import "~@pipeline/Editor/layout/baseStyle.less";

.file-name {
  display: inline-block;
  max-width: 100px;
  margin-left: 15px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  // vertical-align: middle;
}
</style>