
import { axios } from '@/utils/request'

// 新增模型推理任务
export function addDataListServer (params) {
  return axios({
    url: `/api/v1/traincenter/offlineForecastInfo/addDataListServer`,
    method: 'post',
    data: params
  })
}

// 新增离线预测
export function createOffLineTask (params) {
    return axios({
      url: `/api/v1/traincenter/offlineForecastInfo`,
      method: 'post',
      data: params
    })
}
// 离线预测重命名
export function OffLineTaskRename (params) {
  return axios({
    url: `/api/v1/traincenter/offlineForecastInfo`,
    method: 'put',
    data: params
  })
}
// 分页获取离线预测列表 table
export function getOfflineTableList (params) {
    return axios({
      url: `/api/v1/traincenter/offlineForecastInfo/list`,
      method: 'get',
      params: params
    })
}

// 根据id删除离线预测
export function delOfflineById (params) {
  return axios({
    url: `/api/v1/traincenter/offlineForecastInfo/${params}`,
    method: 'DELETE',
  })
}

// 根据Id获取离线预测信息
export function getOfflineById (params) {
  return axios({
    url: `/api/v1/traincenter/offlineForecastInfo/${params}`,
    method: 'get',
  })
}

export function getImage (id) {
  return axios({
    url: `/api/v1/datacenter/file/getImg/forecast/${id}`,
    method: 'get',
    // responseType: 'blob'
    family: -1,
  })
}
/**
 *
 * @param {params} id
 */
// 根据id获取结果列表table
export function getResultList (params) {
  return axios({
    url: `/api/v1/traincenter/forecastResultInfo/forecastResultList`,
    method: 'get',
    params
  })
}

/**
 *
 * @param {params} id
 */
// 根据id获取错分详情
export function getErrorDetailList (params) {
  return axios({
    url: `/api/v1/traincenter/forecastResultInfo/errorDetail`,
    method: 'post',
    data: params
  })
}

export function downloadErrorDetail (params) {
  let param = ''
  Object.keys(params).forEach(item => {
    param += `${item}=${params[item]}&`
  })
  return `/api/v1/traincenter/forecastResultInfo/export/?${param}`
}
/**
 *
 * @param {params} id
 */
// 点击Bar柱子获取对应的样本详情
export function getSampleDetailList (params) {
  return axios({
    url: `/api/v1/traincenter/forecastResultInfo/list`,
    method: 'get',
    params,
  })
}

/**
 *
 * @param {params} id
 */
// 结果洞察-混淆矩阵
export function getMatrixList (params) {
  return axios({
    url: `/api/v1/traincenter/forecastResultInfo/confusionMatrix/${params}`,
    method: 'get',
  })
}


// 预测详情页-结果洞察-数据分流图
export function getDataFlow (params) {
  return axios({
    url: `/api/v1/traincenter/forecastResultInfo/dataFlow/${params}`,
    method: 'get',
    // responseType: 'blob'
  })
}

/**
 *
 * @param {params} id
 */
// 结果洞察-下载详情，目前未使用Blob的下载方式
export function getSampleDetailListExport (params) {
  return axios({
    url: `/api/v1/traincenter/forecastResultInfo/export`,
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取模型历史日志
export function fetchOfflineModelHistoryLog (params) {
  return axios.get('/api/v1/traincenter/offlineForecastInfo/fetchOfflineModelHistoryLog/' + params)
}
// 获取模型实时日志
export function fetchOfflineForecastPodRunLog (params) {
  return axios.get('/api/v1/schedule/scheduleController/fetchOfflineForecastPodRunLog', {
    params: {
      offlineModelId: params
    }
  })
}

/**
 * 验证离线预测名称是否可用
 */
export function checkTaskNameAvl (params) {
  return axios.get('/api/v1/traincenter/offlineForecastInfo/checkTaskNameAvl', { params })
}

/**
 * 终止离线任务
 */
export function offlineModelTrainTaskStop (params) {
  return axios({
    url: `/api/v1/traincenter/offlineForecastInfo/offlineModelTrainTaskStop`,
    method: 'post',
    params
  })
}
/**
 * 导出制作数据集
 */
export const exportDataSet = {
  codeFilterList: (params) => {
    return axios({
      url: `/api/v1/traincenter/forecastResultInfo/fetchAllImgCategory`,
      method: 'get',
      params
    })
  },
  createConditionalImgSet: (params) => {
    return axios({
      url: `/api/v1/traincenter/forecastResultInfo/createConditionalImgSet`,
      method: 'post',
      data: params
    })
  }
}
/**
 * 分析测算
 */
export const analysis = {
  getData: (params) => {
    return axios({
      url: '/api/v1/traincenter/offlineForecastResultAnalyse/getAnalyseResultByForecastId',
      method: 'get',
      params
    })
  },
  updateGlobalData: (params) => {
    return axios({
      url: '/api/v1/traincenter/offlineForecastResultAnalyse/actionTotalAnalyseResultByForecastId',
      method: 'get',
      params
    })
  },
  updateSingleData: (params) => {
    return axios({
      url: '/api/v1/traincenter/offlineForecastResultAnalyse/actionOneAnalyseResultByForecastId',
      method: 'get',
      params
    })
  },
  setCodeQuotaAsBest: (params) => {
    return axios({
      url: '/api/v1/traincenter/offlineForecastResultAnalyse/setCodeQuotaAsBest',
      method: 'put',
      params: { forecastId: params.forecastId },
      data: { codeSet: params.codeSet }
    })
  },
  setCodeAccuracyValue: (params) => {
    return axios({
      url: '/api/v1/traincenter/offlineForecastResultAnalyse/actionMeasureAccuracyValue',
      method: 'put',
      params
    })
  }
}