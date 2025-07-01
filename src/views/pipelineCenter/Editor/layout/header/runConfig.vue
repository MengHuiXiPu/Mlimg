<template>
  <div class="run-env-row">
    <el-form :inline="true" :model="envConfig" :rules="rules" size="mini" ref="refConfForm">
      <el-form-item prop="customImageId">
        <template #label>
          <span>运行环境
            <a-tooltip title="方案运行的镜像环境，可按需修改">
              <a-icon type="question-circle" style="vertical-align: 2px;margin-left: 3px;" />
            </a-tooltip>
          </span>
        </template>
        <el-select v-model="envConfig.customImageId" placeholder="选择镜像" @change="handleImageChange"
          style="width: 150px;">
          <el-option :label="item.name" :value="item.id" v-for="item in imageLists"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="运行资源">
        <span>{{ resourceConfLabel }}<a-icon type="edit" class="line-edit-icon" @click="handleEdit" /></span>
      </el-form-item>
    </el-form>
    <resource-config ref="refResourceConfig"></resource-config>
  </div>
</template>
<script>
import { newImage } from '@/api/imageManage.js';
import { matchRequestMethod } from '@pipeline/Editor/common/request.js';
import { useSetState, useGetState } from "@pipeline/Editor/store/index.js";
import Operator from "@/api/operator";
import resourceConfig from '@/components/business/resourceConfig/index.vue';

export default {
  components: {
    resourceConfig,
  },
  data() {
    return {
      rules: {
        customImageId: [
          { required: true, message: '请选择镜像', trigger: 'blur' },
        ],
      },
      imageLists: [],
      savedConfig: {}, // 已保存的资源配置
    }
  },
  props: {
    pipelineId: {
      type: String,
      default: ''
    }
  },
  computed: {
    resourceConfLabel() {
      const { coreSize, memorySize, gpuSize, videoMemorySize, computeEngineType } = this.envConfig;
      if (computeEngineType == 1) {
        return `${coreSize}core ${memorySize}GB`
      }
      return `${coreSize}core ${memorySize}GB  ${gpuSize}卡 * (${videoMemorySize}GB) `
    },
  },
  methods: {
    async handleEdit() {
      const { computeEngineType, coreSize, memorySize, gpuSize, videoMemorySize, pipelineInferTaskConfigId } = this.envConfig
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
        // 更新到envConfig
        useSetState('envConfig', {
          computeEngineType: newConfig.computeEngineType,
          coreSize: newConfig.coreSize,
          memorySize: newConfig.memorySize,
          gpuSize: newConfig.gpuSize || 1,
          videoMemorySize: newConfig.videoMemorySize,
        })

      }
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
    // 保存镜像配置
    handleImageChange() {
      matchRequestMethod('save')(this.pipelineId, {
        customImageId: this.envConfig.customImageId,
      }).then(res => {
        if (res.code == 0) {
          this.$message.success("镜像配置已保存")
        }
      })
    },
    /**
     * @public
     */
    checkRunConfig() {
      return new Promise((resolve, reject) => {
        this.$refs.refConfForm.validate(valid => {
          if (valid) {
            resolve(true)
          } else {
            this.$message.warning('请选择镜像')
            reject({
              type: 'valid',
              message: '请完善环境配置'
            })
          }
        })
      })
    }
  },
  created() {
    this.loadImageLists();
  },
  setup(props) {
    const envConfig = useGetState('envConfig');
    return {
      envConfig,
      useSetState,
    }
  }
}
</script>
<style lang="less" scoped>
.run-env-row {
  &::v-deep {
    .el-form-item--mini.el-form-item {
      margin-bottom: 0;
    }

    .el-form-item__label {
      margin-bottom: 0;
    }

    .el-form-item__error {
      display: none; //因为布局问题，改成toast提示
    }
  }
}
</style>