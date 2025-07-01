<template>
  <div class="viewer-wrapper">
    <div class="viewer-header">
      <el-button size="mini" @click="editPipeline" type="primary">去编排</el-button>
    </div>
    <div class="viewer-content">
      <div class="graph-container" ref="refViewerWrapper"></div>
      <div class="viewer-right-panel" v-show="showRightPanel">
        <i class="el-icon-close close-btn" @click="showRightPanel = false"></i>
        <el-tabs v-model="activeKey">
          <el-tab-pane label="方案信息" name="schemeInfoTab" class="scheme-info-tab">
            <el-descriptions title="" :column="1" size="medium" :colon="false" labelClassName="description-label">
              <el-descriptions-item label="方案名称">{{ pipelineData.name }}</el-descriptions-item>
              <el-descriptions-item label="方案描述">{{ pipelineData.remark || "--" }}</el-descriptions-item>
              <el-descriptions-item label="创建人">{{ pipelineData.createBy }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ pipelineData.createTime | moment }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ pipelineData.updateTime | moment }}</el-descriptions-item>
              <el-descriptions-item>
                <template slot="label">
                  <span>运行环境
                    <a-tooltip title="方案运行的镜像环境，可按需修改">
                      <a-icon type="question-circle" style="vertical-align: 2px;margin-left: 3px;" />
                    </a-tooltip>
                  </span>
                </template>
                <el-select v-model="pipelineData.customImageId" placeholder="选择镜像" @change="handleImageChange"
                  size="mini">
                  <el-option :label="item.name" :value="item.id" v-for="item in imageLists"></el-option>
                </el-select>
              </el-descriptions-item>
              <el-descriptions-item label="运行资源">
                <span>{{ resourceConfLabel }}<a-icon type="edit" class="line-edit-icon"
                    @click="handleEditResource" /></span>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="节点信息" name="nodeInfoTab" class="scrollbar panel-content">
            <template v-if="nodeData">
              <h5 class="block-title">基本信息</h5>
              <el-descriptions title="" :column="1" size="medium" :colon="false">
                <el-descriptions-item label="节点名称">{{ nodeData.label }}</el-descriptions-item>
                <el-descriptions-item label="节点类型">{{ nodeData.typeName || "--" }}</el-descriptions-item>
                <el-descriptions-item label="节点描述">{{ nodeData.remark || "--" }}</el-descriptions-item>
              </el-descriptions>
              <param-table :tableData="nodeData.inits" :pipelineId="pipelineId"></param-table>
              <in-table :tableData="nodeData.items" :pipelineId="pipelineId" :graph="graph"></in-table>
              <out-table :tableData="nodeData.outputs" :pipelineId="pipelineId"></out-table>
            </template>
            <a-empty :image="simpleImage" v-else />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <resource-config ref="refResourceConfig"></resource-config>
  </div>
</template>

<script>
import Operator from "@/api/operator";
import { initGroupView } from "@pipeline/Editor/common/graph.js";
import paramTable from '@pipeline/Viewer/paramTable.vue';
import inTable from '@pipeline/Viewer/inTable.vue';
import outTable from '@pipeline/Viewer/outTable.vue';
import { newImage } from '@/api/imageManage.js';
import resourceConfig from '@/components/business/resourceConfig/index.vue';
import { Empty } from 'ant-design-vue';
export default {
  name: "PipelineViewer",
  components: {
    paramTable,
    inTable,
    outTable,
    resourceConfig,
  },
  data() {
    return {
      activeKey: "schemeInfoTab",
      graph: null,
      showRightPanel: true,
      nodeData: null, //当前选中节点的data对象
      pipelineData: {},  //方案data
      resourceConfLabel: "",
      resourceConfigData: {},
      simpleImage: null,
    };
  },
  computed: {
    pipelineId() {
      return this.$route.params.id
    }
  },
  methods: {
    async handleEditResource() {
      const { computeEngineType, coreSize, memorySize, gpuSize, videoMemorySize, pipelineInferTaskConfigId } = this.resourceConfigData
      const newConfig = await this.$refs.refResourceConfig.invoke({
        computeEngineType,
        coreSize,
        memorySize,
        gpuSize,
        videoMemorySize
      })
      // 调用保存资源配置接口
      const res = await Operator.schemeUpdateConfig(pipelineInferTaskConfigId, {
        computeEngineType: newConfig.computeEngineType,
        coreSize: newConfig.coreSize,
        memorySize: newConfig.memorySize,
        gpuSize: newConfig.gpuSize,
        videoMemorySize: newConfig.videoMemorySize,
      })
      this.confirmLoading = false
      if (res.code == 0) {
        this.$message.success("配置已保存")
        this.resourceConfLabel = this.genConfLabel(newConfig)
      }
    },
    queryData() {
      Operator.getPipelineTemplateInfoById(this.pipelineId).then((res) => {
        if (res.code === 0) {
          // this.pipelineName = res.data?.name
          this.graph = initGroupView(
            this.$refs.refViewerWrapper,
            res.data.graph,
            { canSelect: true, }
          );
          this.pipelineData = res.data;
          this.addEventLis(this.graph);
          const pipelineInferTaskConfigId = res.data?.pipelineInferTaskConfigId;
          // 查询资源配置
          pipelineInferTaskConfigId && Operator.schemeGetConfig(pipelineInferTaskConfigId).then((cres) => {
            const { data, code } = cres;
            if (code == 0 && data) {
              this.resourceConfigData = {
                computeEngineType: data.computeEngineType,
                coreSize: data.coreSize,
                memorySize: data.memorySize,
                gpuSize: data.gpuSize || 1,
                videoMemorySize: data.videoMemorySize,
                pipelineInferTaskConfigId,
              }
              this.resourceConfLabel = this.genConfLabel(this.resourceConfigData)
            }
          });
        }
      });
    },
    // 保存镜像配置
    handleImageChange() {
      Operator.updatePipelineTemplateById(this.pipelineId, {
        customImageId: this.pipelineData.customImageId,
      }).then(res => {
        if (res.code == 0) {
          this.$message.success("镜像配置已保存")
        }
      })
    },
    editPipeline() {
      this.$router.push({
        path: `/pipelineCenter/editor`,
        query: { type: "scheme", id: this.pipelineId },
      });
      // this.$router.push({
      //   path: `/pipelineCenter/editor/${record.id}`,
      //   query: { type: "scheme", id: record.id, name: record.name }
      // })
    },
    addEventLis(graph) {
      graph.on("node:selected", ({ node }) => {
        this.showRightPanel = true;
        this.nodeData = node.getData();
      });
      graph.on("node:unselected", ({ node }) => {
        // this.showRightPanel = false;
        this.nodeData = null;
      });
    },
    loadImageLists() {
      newImage.getImageList({
        limit: 999,
        pageNo: 1,
        imageType: 2,
      }).then(res => {
        if (res.code == 0) {
          this.imageLists = res.data?.records || []
        }
      })
    },
    genConfLabel(resourceConfig) {
      const { coreSize, memorySize, gpuSize, videoMemorySize, computeEngineType } = resourceConfig;
      if (computeEngineType == 1) {
        return `${coreSize}core ${memorySize}GB`
      }
      return `${coreSize}core ${memorySize}GB  ${gpuSize}卡 * (${videoMemorySize}GB) `
    },
  },
  mounted() {
    this.simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;
    this.loadImageLists();
    this.queryData();
  },
};
</script>

<style lang="less" scoped>
.viewer-wrapper {
  display: flex;
  flex-direction: column;
  padding: 0 20px 10px;
  box-sizing: border-box;
  position: relative;

  .viewer-header {
    height: 40px;
    line-height: 40px;
    padding: 0 20px;
    // border-bottom: 1px solid #f2f2f2;
    text-align: right;
  }

  .viewer-content {
    flex: 1;
    border: 1px solid #f2f2f2;
    display: flex;
    flex-direction: row;

    .graph-container {
      flex: 1;
    }

    .viewer-right-panel {
      position: relative;
      width: 400px;
      padding: 0 15px;
      border-left: 1px solid #f2f2f2;

      &::v-deep .el-tabs__nav-wrap {
        width: 160px;
      }

      .block-title {
        color: #333333;
        font-weight: 700;
        font-size: 15px;
        margin: 0 0 15px 0;
      }

      .panel-content {
        // height: calc(100vh - 90px -35px - 40px -15px);
        height: calc(100vh - 220px);
        overflow: auto;
        padding: 0 0 20px 0; //不让底部贴底
      }

      .close-btn {
        position: absolute;
        right: 20px;
        top: 15px;
        font-size: 18px;
        cursor: pointer;
        z-index: 1;
      }
    }
  }

  &::v-deep .el-descriptions-item__label {
    font-weight: 600;
    min-width: 22%;
  }

  .scheme-info-tab ::v-deep .el-descriptions-item__cell {
    padding-bottom: 25px; //由默认的10 ->25,增加间距
  }
}
</style>