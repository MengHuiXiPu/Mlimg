const offline = {
  state: {
    modelType: '1',
    taskName: '',
    modelId: null,
    tagType: '',
    dlId: [],
    dlItem: [],
    computEngineType: 2,
    coreSize: 1,
    memorySize: 4,
    gpuSize: 8,
    gpuMaxSize: 8,
    videoMemorySize: 2,
    coreSizeMax: 8,
    memorySizeMax: 16,
    algorithmId: '',  //模型绑定的算法id
    currentOffline: null
  },

  mutations: {
    setCurrentOffline: (state, model) => {
      state.currentOffline = model
    },
    setmodelTypeAndtaskName: (state, obj) => {
      state.modelType = obj.modelType
      state.taskName = obj.taskName
    },
    setmodelIdandtagType: (state, obj) => {
      state.modelId = obj.modelId
      state.tagType = obj.tagType
      // 新增模型下的算法id
      state.algorithmId = obj.algorithmId || state.algorithmId
    },
    setOfflinedlId: (state, dlId) => {
      state.dlId = dlId
    },
    setOfflinedlItem: (state, dlItem) => {
      state.dlItem = dlItem
    },
    setConfig: (state, config) => {
      const { computEngineType, coreSize, memorySize, gpuSize, videoMemorySize, gpuMaxSize, coreSizeMax, memorySizeMax } = config
      state.computEngineType = computEngineType
      state.coreSize = coreSize
      state.memorySize = memorySize
      state.gpuSize = gpuSize
      state.videoMemorySize = videoMemorySize
      state.gpuMaxSize = gpuMaxSize
      state.memorySizeMax = memorySizeMax
      state.coreSizeMax = coreSizeMax
    },
    // 重置分步状态
    clearOfflineState: (state) => {
      // state.modelType = '1'
      state.taskName = ''
      state.modelId = null
      state.tagType = ''
      state.dlId = []
      state.config = {
        computEngineType: '2',
        coreSize: 1,
        memorySize: 2,
        gpuSize: 1,
        videoMemorySize: 2,
      }
    },
  },

  actions: {

  }
}

export default offline
