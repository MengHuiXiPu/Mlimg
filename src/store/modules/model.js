

const model = {
  defaultConfig:{
    computEngineType: 2,
    coreSize: 4,
    memorySize: 16,
    gpuSize: 1,
    videoMemorySize: 12,
  },
  state: {
    step: {//分步表单
      imagesId: null, // 第一步选择的算法id
      modelType: '1',//通用模型modeltype=1，业务模型modeltype=2
      step1ImageType: '1', // 第一步选择的镜像类型
      step1ImageItem: {}, // 第一步选择的镜像详细信息
      dlId: [], // 第二步选择的数据集id, 使用时以,分割
      dlItem: [], // 第二步选择的数据集对象数组
      modelID: null, // 新建模型后，模型ID
      newModelVisible: false, // 新建模型的对话框是否显示
      // 这到底是个什么j8东西？？？？为什么很多信息在各步中有的放这里，有的又不放这里，有的从这里取，有的又不从这里取
      preParam: {
        verifyWay: null,
        verifyIds: null,
        oneness: 0,
        preTrainImageId: '',
        needPreTrainModel: 0,
        selectedType: [],
        algorithmParam: '',
        splitRatio: 20,
        tagType: '',
        businessParam: '',
      },
      // 增加标签映射和标签数量配置后，需要采集的数据信息
      labelMapConfig: {
        needLabelMap: false, //是否需要label映射
        labelRule: [
          {
            "mainLabel":"",  //needLabelMap为fasle时，与数据集lable一一对应，是label标签名称，needLabelMap为true时，为用户填写的映射后的label名，与数据集lable为一对多的关系
            "originalLabel":[ //needLabelMap为fasle时，不需要，needLabelMap为true时，为用户填写的映射后的label名，与数据集lable为一对多的关系
              // ""
            ],
            "limit": -1
          }
        ], //映射规则
      },
      dataSouce: {
        computEngineType: 2,
        coreSize: 4,
        memorySize: 16,
        gpuSize: 1,
        videoMemorySize: 12,
        modelName: '',
        // 存放目录:node_name拼接 以英文分号;分隔
        storedDirName: '',
        // 存放目录:node_id拼接 以英文分号;分隔
        storedDirId: '',
        modelDescription: '',
        modelId: '', // 新建模型ID
      },
      taskStatus: 1,//taskstatus=0，调用api完成训练设置，taskstatus=1调用api开始训练
      parentId:null,
    },
    tempdatalist:[],//临时数据集列表
    modelInfoToVersion: null,
    dlItem: [],
    offline: {
      dlId: [],
      computEngineType: '2',
      coreSize: 1,
      memorySize: 16,
      gpuSize: 1,
      videoMemorySize: 12,
    },
    isShowDetail: true,
    modelInfo: {},
    taskName: '',
    detailmodelType: '1',
    // 当前模型ID
    currentModel: null,
    // 记录模型信息，缓存模型的信息
    modelInfoRecord: {},
    resourceMaxConfig: {
      coreSizeMax: 8,
      memorySizeMax: 16,
      gpuMaxSize: 23.69 - 0.3
    }
  },

  mutations: {
    // 设置标签映射数据
    setLabelMapConfig(state, labelMapConfig) {
      state.step.labelMapConfig = {
        ...state.step.labelMapConfig,
        ...labelMapConfig
      };
    },
    // 设置新建模型的对话框是否显示
    setNewModelVisible(state, visible) {
      state.step.newModelVisible = visible;
    },
    // 重置部分内容
    resetState(state) {
      console.log("重置！！！！！！！！！！")
      // 将state重置为初始状态
      state.modelInfoRecord = {};
      state.currentModel = null;
      // ...
    },
    setpauseStatus(state, num) {
      state.modelInfoRecord.pauseStatus = num
    },
    setModelInfoRecord(state, modelInfo) {
      state.modelInfoRecord = {
        ...state.modelInfoRecord,
        ...modelInfo
      }
    },
    setModelID(state, modelID) {
      state.step.modelID = modelID;
    },
    setSplitRatio: (state, value) => {
      state.step.preParam.splitRatio = value;
    },
    setModelInfo: (state, model) => {
      // console.log("保存了！！！")
      state.step.dataSouce.modelName = model.modelName
      state.step.dataSouce.storedDirName = model.storedDirName
      state.step.dataSouce.modelDescription = model.modelDescription
      state.step.dataSouce.storedDirId = model.storedDirId
      state.step.dataSouce.modelId = model.modelId
      console.log("state.step.dataSouce: ++++", state.step.dataSouce)
    },
    setSelectedType: (state, selectedType) => {
      state.step.preParam.selectedType = selectedType
    },
    setComputeResource: (state, compute) => {
      state.step.dataSouce.computEngineType = compute.computEngineType
      state.step.dataSouce.coreSize = compute.coreSize
      state.step.dataSouce.memorySize = compute.memorySize
      state.step.dataSouce.gpuSize = compute.gpuSize
      state.step.dataSouce.videoMemorySize = compute.videoMemorySize
    },
    setComputeResourceCPU: (state, compute) => {
      state.step.dataSouce.computEngineType = compute.computEngineType
      state.step.dataSouce.coreSize = compute.coreSize
      state.step.dataSouce.memorySize = compute.memorySize
      state.step.dataSouce.gpuSize = 0
      state.step.dataSouce.videoMemorySize = 0
    },
    setCurrentModel: (state, model) => {
      //
      state.currentModel = model
      console.log("设置成功model:  ", model)
    },
    setimagesId: (state, selectedRowKeys) => {
      state.step.imagesId = selectedRowKeys
    },
    setmodelType: (state, modelType) => {
      state.step.modelType = modelType
    },
    setDefaultValidationSet: (state, val) => {
      state.step.preParam.splitRatio = val
    },
    setStep1ImageType: (state, step1ImageType) => {
      state.step.step1ImageType = step1ImageType
    },
    setStep1ImageItem: (state, selectedRows) => {
      state.step.step1ImageItem = selectedRows
      state.step.preParam.algorithmParam = selectedRows.algorithmParam
      state.step.preParam.businessParam = selectedRows.businessParam
    },
    setbusinessParam: (state, businessParam) => {
      state.step.preParam.businessParam = businessParam
    },
    setneedPreTrainModel: (state, needPreTrainModel) => {
      state.step.preParam.needPreTrainModel = needPreTrainModel
    },
    setStep3AlgorithmParam: (state, algorithmParam) => {
      state.step.preParam.algorithmParam = algorithmParam
    },
    setdlId: (state, selectedRowKeys) => {
      // 数组去重
      selectedRowKeys = selectedRowKeys.filter((item, index, array) => array.indexOf(item) === index)
      state.step.dlId = selectedRowKeys
    },
    setdlItem: (state, selectedRows) => {
      state.step.dlItem = selectedRows
    },
    resetItem: (state) => {
      state.step.dlId = []
      state.step.dlItem = []
    },
    setparentId: (state, val) => {
      state.step.parentId = val
    },
    settempdlId: (state, selectedRowKeys) => {
      state.tempdatalist = selectedRowKeys
    },
    setpreParam: (state, preParam) => {
      state.step.preParam = { ...state.step.preParam, ...preParam }
    },
    setpredataSouce: (state, dataSouce) => {
      state.step.dataSouce = { ...dataSouce }
    },
    setisShowDetail: (state, bool) => {
      state.isShowDetail = bool
    },
    setmodelInfo: (state, modelInfo) => {
      state.modelInfo = { ...modelInfo }
    },
    setmodelInfoToVersion: (state, modelInfo) => {
      state.modelInfoToVersion = modelInfo ? { ...modelInfo } : null
    },
    setTaskName: (state, taskName) => {
      state.taskName = taskName
    },
    setModelOffline: (state, offline) => {
      state.offline = offline
    },
    setModelOfflineDlId: (state, id) => {
      state.offline.dlId = id
    },
    setModelOfflineDlItem: (state, dlItem) => {
      state.dlItem = [ ...dlItem ]
    },
    setdetailmodelType: (state, modelType) => {
      state.detailmodelType = modelType
    },
    // 重置分步状态
    clearState: (state) => {
      state.step.imagesId = null
      state.step.step1ImageType = '1'
      state.step.step1ImageItem = {}
      state.step.dlId = []
      state.step.preParam = {
        needPreTrainModel: 0,
        selectedType: [],
        algorithmParam: '',
        splitRatio: 20,
        tagType: '',
        businessParam: '',
        // needPreTrainModel: 0,
        verifyWay: 1,
        verifyIds: ''
      }
      state.step.dataSouce = {
        computEngineType: 2,
        coreSize: 1,
        memorySize: 16,
        gpuSize: 1,
        videoMemorySize: 12,
        modelName: '',
        // 存放目录:node_name拼接 以英文分号;分隔
        storedDirName: '',
        // 存放目录:node_id拼接 以英文分号;分隔
        storedDirId: ''
      }
    },
    // 设置几项资源配置的最大值
    setResourceMaxConfig(state, res = {}) {
      state.resourceMaxConfig.coreSizeMax = res.coreSizeMax
      state.resourceMaxConfig.memorySizeMax = res.memorySizeMax
      state.resourceMaxConfig.gpuMaxSize = res.gpuMaxSize
    }
  },

  actions: {
    // 在step1选择镜像时，保存镜像id
    // SaveimagesId ({ commit }, id) {
    //     console.log(id, '-------')
    //     commit('setimagesId', id)
    // }

  }
}

export default model
