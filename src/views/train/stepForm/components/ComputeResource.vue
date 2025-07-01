<template>
  <a-form-model
      :model="form"
      ref="ruleForm"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      :rules="rules"
      layout="horizontal"
      style="max-width: 700px; margin: 20px auto 0;"
  >
    <a-form-model-item label="计算引擎">
      <a-radio-group
          v-model="form.computEngineType"
          @change="handleSelectChange"
          :disabled="modelInfoRecord.taskStatus === 1"
      >
        <a-radio :value="1">
          CPU
        </a-radio>
        <a-radio :value="2">
          GPU
        </a-radio>
      </a-radio-group>
    </a-form-model-item>

    <a-form-model-item label="cpu" prop="coreSize">
      <a-input-number
          v-model="form.coreSize"
          :min="1"
          :max="resourceMaxConfig.coreSizeMax"
          :precision="0"
          placeholder="请输入cpu核心数"
          style="width: 95%;margin-right:5px"
          :disabled="modelInfoRecord.taskStatus === 1"
      />
      <span>核</span>
    </a-form-model-item>

    <a-form-model-item label="内存" prop="memorySize">
      <a-input-number
          v-model="form.memorySize"
          :min="0"
          :max="resourceMaxConfig.memorySizeMax"
          placeholder="请输入cpu内存数"
          style="width: 95%;margin-right:5px"
          :disabled="modelInfoRecord.taskStatus === 1"
      />
      <span>GB</span>
    </a-form-model-item>

    <a-form-model-item v-if="form.showGpu" label="gpu" prop="gpuSize">
          <!-- :disabled="modelInfoRecord.taskStatus === 1 || modelInfoRecord.supportDistTraining===false"       :max="gpuMaxNum" -->
      <a-input-number
          type="number"
          v-model="form.gpuSize"
          placeholder="请输入gpu数"
          :disabled="modelInfoRecord.taskStatus === 1"
          style="width: 95%;margin-right:5px"
          :min="1"
          :precision="0"
          
      />
      <!--          -->
      <span>张</span>
      <!-- <a-tooltip class="gpuNumber" :style="{ position: 'absolute', 'margin-left': '10px', color: '#ccc', 'line-height': '40px', cursor: 'pointer' }">
        <template slot="title">
          {{ `最大支持：${gpuMaxNum}张` }}
        </template>
        <a-icon type="question-circle" />
      </a-tooltip> -->
    </a-form-model-item>

    <a-form-model-item v-if="form.showGpu" label="显存" prop="videoMemorySize">
      <a-input-number
          v-model="form.videoMemorySize"
          placeholder="请输入gpu显存数"
          style="width: 95%;margin-right:5px"
          :min="0"
          :max="form.gpuMaxSize"
          :step="1"
          :precision="2"
          :disabled="modelInfoRecord.taskStatus === 1"
      />
      <span>GB</span>
      <a-tooltip
          class="gpuNumber"
          :style="{
              position: 'absolute',
              'margin-left': '10px',
              color: '#ccc',
              'line-height': '40px',
              cursor: 'pointer'
            }"
      >
        <template slot="title">
          {{ `当前GPU最大显存：${form.gpuMaxSize + 0.01}GB` }}
        </template>
        <a-icon type="question-circle" />
      </a-tooltip>
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import StepLayout from '@/components/StepLayout'
import { getModelTreeList, savaModelTreeList } from '@/api/dataCenter'
import {
  saveTrainSet,
  startTrainIM,
  getK8SDataInfo,
  checkModelNameAvl
} from '@/api/modelManage'
import system from '@/api/system'
import { mapState } from 'vuex'
import createTree from '@/components/tree/createTree'
// import bus from '@/utils/bus'
import model from "@/store/modules/model";
import { getSystemConfig } from "@/api/dataCenter";

export default {
  name: 'ComputeResource',
  components: {
    StepLayout,
    createTree
  },
  mounted () {
    system.systemConfig.getDataList({pageNo: 1, limit: 10}).then(res=> {
      if (res.code === 0) {
        if (res.data.records && res.data.records.length) {
          let params = res.data.records.find(item => {
            return item.keyInfo === 'gpu_size_max'
          })
          console.log(params);
          if (params) {
            this.gpuMaxSize = params.valueInfo
            this.$set(this.form, 'gpuMaxSize', Number(params.valueInfo) - 0.3)
          } else {
            this.$set(this.form, 'gpuMaxSize', 23.69 - 0.3)
          }
        }
      } else {
        this.$set(this.form, 'gpuMaxSize', 23.69 -0.3)
      }
    })
  },
  data () {
    const dataSouce = { ...this.$store.state.model.step.dataSouce }
    const gpuValidator = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('请输入gpu核心数!'))
      } else {
        callback()
        if (Number(value) > (this.k8sDataInfo.gpuCapacity - this.k8sDataInfo.gpuUsed)) {
          callback(new Error('剩余GPU数量不足，请确认后重新输入!'))
        } else {
          callback()
        }
      }
    }
    const gpuMemory = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('请输入gpu显存数!'))
      } else {
        if (Number(value) > (this.form.gpuMaxSize)) {
          return callback(new Error('剩余GPU显存不足，请确认后重新输入!'))
        } else {
          return callback()
        }
      }
    }
    return {
      labelCol: { lg: { span: 5 }, sm: { span: 5 } },
      wrapperCol: { lg: { span: 19 }, sm: { span: 19 } },
      treeData: [],
      storedDirId: dataSouce.storedDirId,
      rules: {
        coreSize: [{ required: true, message: '请输入cpu核心数!', trigger: 'blur' }],
        memorySize: [{ required: true, message: '请输入cpu内存数!', trigger: 'blur' }],
        // gpuSize: [{ required: true, message: '请输入gpu核心数!', trigger: 'blur' }],
        gpuSize: [{ required: true, validator: gpuValidator, trigger: 'blur' }],
        videoMemorySize: [{ required: true, validator: gpuMemory, trigger: 'blur' }],
      },
      form: {
        ...dataSouce,
        showGpu: dataSouce.computEngineType === 2,
      },
      k8sDataInfo: {},
      saveLoading: false,
      dataSetVisible: false,
      reserved_gpu_num: 0,  //系统预留的GPU数
      createTreeData: {}
    }
  },
  watch: {
    form: {
      handler(value) {
        if(this.form.showGpu) {
          this.$store.commit('setComputeResource', value)
        }else {
          this.$store.commit('setComputeResourceCPU', value)
        }
      },
      deep: true
    }
  },
  computed: {//用计算方法
    ...mapState({//从vuex store中获取分步表单的数据
      step: state => state.model.step,
      dataSouce: state => state.model.step.dataSouce,
      preParam: state => state.model.step.preParam,
      modelInfo: state => state.model.modelInfoToVersion,
      parentId: state => state.model.step.parentId,
      modelInfoRecord: state => state.model.modelInfoRecord,
      currentModel: state => state.model.currentModel,
      resourceMaxConfig: state => state.model.resourceMaxConfig
    }),
    // GPU允许设置的最大数，取值逻辑如下：
    // k8sDataInfo.offlineQuotaCapacity?.num_capacity + k8sDataInfo.mixQuotaCapacity?.num_capacity, 某个不存在时取0相加，都不存在时Set result = 1
    // gpuMaxNum() {
    //   // const num_capacity = this.k8sDataInfo?.onlineQuotaCapacity?.num_capacity
    //   let num_offline = this.k8sDataInfo?.offlineQuotaCapacity?.num_capacity || 0
    //   let num_mix = this.k8sDataInfo?.mixQuotaCapacity?.num_capacity || 0
    //   const num_total = (num_offline + num_mix) || 1
    //   // 减掉系统预留的
    //   const res = num_total - this.reserved_gpu_num
    //   // 默认设置为1
    //   return res > 0 ? res : 1
      
    // }
  },
  async activated () {
    console.log("ComputeResource this.modelInfoRecord: ", this.modelInfoRecord)
    this.querySystemConfig()
    this.getTree()
    await this.getK8SData()
    this.$nextTick(() => {
      if(this.modelInfoRecord.taskStatus > 0 || this.modelInfoRecord.videoMemorySize) {
        this.form.gpuSize = this.modelInfoRecord.gpuSize
        this.form.computEngineType = this.modelInfoRecord.computEngineType
        this.form.coreSize = this.modelInfoRecord.coreSize
        this.form.memorySize = this.modelInfoRecord.memorySize
        this.form.videoMemorySize = this.modelInfoRecord.videoMemorySize
        this.form.showGpu = this.modelInfoRecord.computEngineType === 2
      }
    })
  },
  methods: {
    getTree () {
      const query = {
        parentId: 0,
        parentCode: '0;'
      }
      this.treeData = []
      getModelTreeList(query).then(res => {
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          this.treeData = this.genTreeNode(data)
        }
      })
    },
    genTreeNode (data, storedDirName, storedDirId) {
      return data.map(item => {
        const { nodeName, nodeCode, id, childNodeNum } = item;
        const names = storedDirName ? `${storedDirName} / ${nodeName}` : nodeName;
        const ids = `${nodeCode}${id};`;
        return {
          id,
          storedDirId: ids,
          storedDirName: names,
          value: ids, // value 设置为ids
          title: nodeName,
          nodeCode,
          // disabled: childNodeNum !== 0,
          isLeaf: childNodeNum === 0
        }
      })
    },
    handleSelectChange (e) {
      this.$nextTick(() => {
        this.form.showGpu = e.target.value !== 1
        if(this.form.showGpu){
          this.form.gpuSize = model.defaultConfig.gpuSize
          this.form.videoMemorySize = model.defaultConfig.videoMemorySize
        }
      })
    },
    async getK8SData() {
      try {
        const data = await getK8SDataInfo();
        if (data && data.data) {
          //解析响应数据
          this.k8sDataInfo = JSON.parse(JSON.stringify(data.data));
        }
      }
      catch (error) {
        console.error(error);//处理data为undefined异常
      }
    },
    // 查询系统配置信息
    querySystemConfig() {
      getSystemConfig({keyName: 'reserved_gpu_num'}).then(res => {
        if(res.code ==0 ) {
          this.reserved_gpu_num = res?.data?.valueInfo === undefined ? 0 : res?.data?.valueInfo * 1
        }else {
          this.reserved_gpu_num = 0
        }
      }).catch(()=>{
        this.reserved_gpu_num = 0
      })
    } 
  },
}
</script>

<style lang="less" scoped>
.ant-select-tree-node-content-wrapper{
  .create{
    float: right;
    display: none;
  }
  &:hover{
    .treeName{
      .create{
        display: inline;
      }
    }
  }
}
</style>
