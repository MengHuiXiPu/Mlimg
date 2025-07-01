/**
 * 应用中心相关接口
 */

import { axios } from '@/utils/request'

/**
 * 分页获取应用管理列表
 */
export function getApplicationManagementList (params) {
  return axios({
    url: '/api/v1/applicationcenter/openApps/getList',
    method: 'get',
    params
  })
}

/**
 * 应用管理列表-更新应用
 */
export function updateApplicationManagementItem (params) {
  return axios({
    url: '/api/v1/applicationcenter/openApps/update',
    method: 'post',
    data: params
  })
}

/**
 * 获取推理应用目录列表
 */
export function getApplicationcenterList (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskInfo/getInferenceTaskInfoList',
    method: 'get',
    params
  })
}

export function listInferserviceInfo (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferservice',
    method: 'get',
    params
  })
}

/**
 * 推理任务获取结果列表
 */
export function getResultList (taskID, params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskInfo/' + taskID + '/resultList',
    method: 'get',
    params,
  })
}

/**
 * 获取推理任务最新结果
 */
export function getLatestResult (taskID, params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskInfo/' + taskID + '/latestResult',
    method: 'get',
    params
  })
}

/**
 * 推理任务获取图片
 */
export function getInferTaskImage (params) {
  return axios({
    url: `/api/v1/applicationcenter/inferenceTaskInfo/downloadImage`,
    method: 'GET',
    responseType: 'blob',
    params
  })
}

/**
 * 分页获取推理应用目录列表
 */
export function getTaskList (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskInfo/list',
    method: 'get',
    params
  })
}
/**
 * 推理应用目录新增列表
 */
export function saveApplicationcenter (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskModelConfig',
    method: 'post',
    data: params
  })
}

/**
 * 推理应用目录修改模型配置
 */
export function editApplicationcenter (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskModelConfig',
    method: 'put',
    data: params
  })
}

/**
 * 推理应用目录重命名
 */
export function editApplicationcenterName (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskInfo',
    method: 'put',
    data: params
  })
}

/**
 * 推理应用目录任务删除
 */
export function deleteApplicationcenter (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskInfo/' + params,
    method: 'delete'
  })
}
/**
 * 通过id获取模型任务
 */
export function getModelById (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskModelConfig/' + params,
    method: 'get'
  })
}

/**
 * 通过id获取推理任务
 */
export function getApplicationcenterById (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskInfo/base/' + params,
    method: 'get'
  })
}

/**
 * 通过id获取
 */
export function getInferserviceInfoById(id) {
  return axios({
    url: '/api/v1/applicationcenter/inferservice/' + id,
    method: 'get'
  })
}

/**
 * 通过id获取
 */
export function getInferserviceVersionByIdPage(id, pageNo=1, limit=10) {
  return axios({
    url: `/api/v1/applicationcenter/inferservice/${id}/version`,
    method: 'get',
    params: {
      pageNo,
      limit
    }
  })
}

/**
 * 通过id删除
 */
export function deleteInferserviceById(id) {
  return axios({
    url: `/api/v1/applicationcenter/inferservice/${id}`,
    method: 'delete',
  })
}


/**
 * 为子版本新增部署配置
 */
export function addConfigForInferserviceVersion(id, versionId, config) {
  return axios({
    url: `/api/v1/applicationcenter/inferservice/${id}/version/${versionId}/config/simple`,
    method: 'post',
    data: config,
  })
}


/**
 * 获取操作日志
 */
export function getInferserviceOperateLogByIdPage(id, searchParams={}) {
  return axios({
    url: `/api/v1/applicationcenter/inferservice/${id}/operatelog`,
    method: 'get',
    params: searchParams,
  })
}

/**
 * 启动服务
 */
export function startInferserviceByIdWithVersion(id, versionId, config) {
  return axios({
    url: `/api/v1/applicationcenter/inferservice-runner/${id}/runner/start/${versionId}/with-config`,
    method: "POST",
    data: config,
  })
}
/**
 * 停止服务
 */
export function stopInferserviceById(id) {
  return axios({
    url: `/api/v1/applicationcenter/inferservice-runner/${id}/runner/stop`,
    method: "POST",
  })
}

/**
 * 停止服务
 */
export function switchInferserviceById({infesvrId, oldVersionId, newVersionId, config}) {
  debugger
  return axios({
    url: `/api/v1/applicationcenter/inferservice-runner/${infesvrId}/runner/switch/${oldVersionId}/${newVersionId}/with-config`,
    method: "POST",
    data: config
  })
}
/**
 * 查询服务状态
 */
export function queryInferserviceStatusById(infesvrId) {
  return axios({
    url: `/api/v1/applicationcenter/inferservice-runner/${infesvrId}/state`,
    method: "POST",
  })
}

/**
 * 获取部署历史
 */
export function pagingDeployHis(infesvrId, pageNo=1, limit=10) {
  return axios({
    url: `/api/v1/applicationcenter/inferservice-runner/${infesvrId}/runner/deploy-history`,
    method: "GET",
    params: {
      pageNo,
      limit
    }
  })
}


/**
 * 获取部署历史
 */
export function queryDeployHistoryRollbackLast(infesvrId) {
  return axios({
    url: `/api/v1/applicationcenter/inferservice-runner/${infesvrId}/runner/deploy-history/rollback/1`,
    method: "GET",
  })
}


/**
 * 获取版本信息指定服务id和版本id
 */
export function selectOneInferserviceVersionInfoByInfesvrIdAndId(infesvrId, versionId) {
  return axios({
    url: `/api/v1/applicationcenter/inferservice/${infesvrId}/version/${versionId}`,
    method: "GET",
  })
}

/**
 * 重启服务
 */
export function restartInferserviceById(id, config) {
  return axios({
    url: `/api/v1/applicationcenter/inferservice-runner/${id}/runner/restart/with-config`,
    method: "POST",
    data: config
  })
}

/**
 * 得到各种数据源
 */
export function getdDataSourceInfo (params) {
  return axios({
    url: '/api/v1/datasource/dataSourceInfo/getDataSourceInfoList',
    method: 'get',
    params
  })
}

export function getOnlineData (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskInfo/countTaskDailyHandle',
    method: 'get',
    params
  })
}

/**
 * 终止or开始任务
 */
export function inferenceTaskStartOrStop (type, params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskInfo/' + type,
    method: 'post',
    data: params
  })
}

export function addTaskFromExistConfig (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskInfo/addTaskFromExistConfig',
    method: 'post',
    params
  })
}

export function exportTaskThreshold (params, uid) {
  return `/api/v1/applicationcenter/inferenceTaskInfo/exportTaskList?taskType=${params}&uid=${uid}`
}

export function uploadThreshold (data) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskInfo/importCode',
    method: 'post',
    data
  })
}

export function updateTaskDesc (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskInfo/updateTaskDesc',
    method: 'post',
    params
  })
}

/**
 * 通过id获取统计信息
 */
export function getStatisticsById (params) {
  const { fromDate, toDate, id } = params
  return axios({
    url: `/api/v1/applicationcenter/inferenceTaskInfo/statistics/${id}/${fromDate}/${toDate}`,
    method: 'get'
  })
}
/**
 * 通过id获取目录详情页混淆矩阵
 */
export function getunionMatrixById (params) {
  const { fromDate, toDate, id } = params
  return axios({
    url: `/api/v1/applicationcenter/inferenceTaskInfo/confusionMatrix/${id}/${fromDate}/${toDate}`,
    method: 'get'
  })
}

/**
 * 目录管理--获取目录列表
 */
export function inferenceCatalogConfList (params) {
  return axios({
    url: `/api/v1/applicationcenter/inferenceCatalogConf/list`,
    method: 'get',
    params
  })
}
/**
 * 目录管理--新增或修改目录
 */
export function inferenceCatalogConf (params, type) {
  return axios({
    url: `/api/v1/applicationcenter/inferenceCatalogConf`,
    method: type,
    data: params
  })
}
/**
 * 目录管理--获取单个目录配置
 */
export function inferenceCatalogConfInfo (params, type) {
  return axios({
    url: `/api/v1/applicationcenter/inferenceCatalogConf/` + params,
    method: type
  })
}
/**
 * 目录管理--新增/修改单个目录数据
 */
export function inferenceCatalogInfo (params, type) {
  return axios({
    url: `/api/v1/applicationcenter/inferenceCatalogInfo`,
    method: type,
    data: params
  })
}
/**
 * 目录管理--删除单个目录数据
 */
export function inferenceCatalogInfoDelete (params) {
  return axios({
    url: `/api/v1/applicationcenter/inferenceCatalogInfo`,
    method: 'delete',
    data: params
  })
}
/**
 * 目录管理--获取目录数据列表
 */
export function inferenceCatalogInfoList (params) {
  return axios({
    url: `/api/v1/applicationcenter/inferenceCatalogInfo/selectList`,
    method: 'get',
    params
  })
}
/**
 * 目录管理--数据筛选
 */
 export function inferenceCatalogInfoFilterList (params) {
  return axios({
    url: `/api/v1/applicationcenter/inferenceCatalogInfo/filterList`,
    method: 'get',
    params
  })
}
/**
 * 目录管理--获取路径默认参数
 */
export function getFileSourcePath (params) {
  return axios({
    url: `/api/v1/applicationcenter/inferenceTaskModelConfig/getFileSourcePath`,
    method: 'get',
    params
  })
}
/**
 * 目录管理--数据导入
 */
export function inferenceCatalogImport (params) {
  return axios({
    url: `/api/v1/applicationcenter/inferenceCatalogInfo/import`,
    method: 'post',
    data: params
  })
}

export function getChildrenList (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceCatalogInfo/getConfValue/',
    method: 'get',
    params
  })
}

export function getDataFlow (params) {
  const { id, beginDate, endDate } = params
  return axios({
    url: `/api/v1/applicationcenter/inferenceTaskInfo/dataFlow/${id}/${beginDate}/${endDate}`,
    method: 'get'
  })
}

/**
 * 通过id获取推理任务
 */
export function getPipInstanceAccessUrlList (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskInfo/getPipInstanceAccessUrlList',
    method: 'post',
    params
  })
}
/**
 * 通过id获取推理任务(新的)
 */
export function getAppUrlList (params) {
  return axios({
    url: '/api/v1/applicationcenter/inferenceTaskInfo/getAppUrlList',
    method: 'post',
    params
  })
}

export const messageSource = {
  // 新增或修改消息源
  inferenceDataSourceConf: (params, type) => {
    return axios({
      url: `/api/v1/applicationcenter/inferenceDataSourceConf`,
      method: type,
      data: params
    })
  },
  // 获取消息源列表
  inferenceDataSourceConfList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceDataSourceConf/list',
      method: 'get',
      params
    })
  },
  // 删除消息源或者获取指定ID消息源
  getInferenceDataSourceConf: (params, type) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceDataSourceConf/' + params,
      method: type
    })
  },
  // 获取引用该消息源的任务列表
  getMessageDataSourceTaskList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceDataSourceConf/checkTaskConfigRelyData',
      method: 'get',
      params
    })
  }
}

export const fileSource = {
  // 新增或修改文件源
  inferenceFileSourceConf: (params, type) => {
    return axios({
      url: `/api/v1/applicationcenter/inferenceFileSourceConf`,
      method: type,
      data: params
    })
  },
  // 获取文件源列表
  inferenceFileSourceConfList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceFileSourceConf/list',
      method: 'get',
      params
    })
  },
  // 删除文件源或者获取指定ID文件源
  getInferenceFileSourceConf: (params, type) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceFileSourceConf/' + params,
      method: type
    })
  },
  // 获取引用该文件源的任务列表
  getFileDataSourceTaskList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceFileSourceConf/checkTaskConfigRelyData',
      method: 'get',
      params
    })
  }
}

export const imageSource = {
  getSourceOption: (params) => {
    return axios.get(`/api/v1/applicationcenter/tbRvImgSourceConf/getAllMessageORFileSource/${params}`)
  },
  getDataList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbRvImgSourceConf/list',
      method: 'get',
      params
    })
  },
  createImageSource: (params, method) => {
    return axios({
      url: '/api/v1/applicationcenter/tbRvImgSourceConf',
      method,
      data: params
    })
  },
  deleteImageSource: (params) => {
    return axios.delete(`/api/v1/applicationcenter/tbRvImgSourceConf/${params}`)
  }
}

export const taskGroupConfig = {
  getDataList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceGroupConf/list',
      method: 'get',
      params
    })
  },
  createTaskGroupConfig: (params, method) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceGroupConf',
      method,
      data: params
    })
  },
  deleteTaskGroupConfig: (params) => {
    return axios.delete(`/api/v1/applicationcenter/inferenceGroupConf/${params}`)
  }
}

export const offlineBack = {
  getOfflineBackList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceReplayTaskConfig/list',
      method: 'get',
      params
    })
  },
  editOfflineBack: (params, type) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceReplayTaskConfig',
      method: type,
      data: params
    })
  },
  delOfflineBack: (params, type) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceReplayTaskConfig/' + params,
      method: type
    })
  },
  getOfflineBackBaseInfo (params) {
    return axios({
      url: '/api/v1/applicationcenter/inferenceReplayTaskConfig/base/' + params,
      method: 'get'
    })
  },
  getOfflineBackStatistics (params) {
    return axios({
      url: '/api/v1/applicationcenter/inferenceReplayTaskConfig/statistics/' + params,
      method: 'get'
    })
  },
  getOfflineBackMatrix (params) {
    return axios({
      url: '/api/v1/applicationcenter/inferenceReplayTaskConfig/confusionMatrix/' + params,
      method: 'get'
    })
  },
  checkOfflineBackName (params) {
    return axios({
      url: '/api/v1/applicationcenter/inferenceReplayTaskConfig/checkReplayTaskNameAvl',
      method: 'get',
      params
    })
  }
}

export const OPCode = {
  searchImageList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceTaskPredictResult/getTaskPredictJudge',
      method: 'post',
      data: params
    })
  },
  getPicture: (params, isReplay) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceTaskPredictResult/getTaskPredictPic/' + params,
      method: 'get',
      params: { isReplay },
      family: -1,
      // responseType: 'blob'
    })
  },
  editImageTag: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceTaskPredictResult/updateTaskPredictJudge',
      method: 'post',
      data: params
    })
  },
  getCodeList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceTaskCodeTag/queryTag',
      method: 'post',
      params
    })
  },
  editCode: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceTaskCodeTag',
      method: 'put',
      data: params
    })
  },
  addOPCodeTask: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceReviewTaskResult',
      method: 'post',
      data: params
    })
  },
  getOPCodeTaskList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceReviewTaskResult/list',
      method: 'get',
      params
    })
  },
  deleteOPCodeTask: (params, method) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceReviewTaskResult/' + params,
      method
    })
  },
  getPredictCodeList: (params) => {
    return axios({
      url: `/api/v1/applicationcenter/inferenceTaskPredictResult/getPredictCodeList/`,
      method: 'get',
      params
    })
  },
  getImageCodeList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceReviewTaskResult/queryReviewCode',
      method: 'post',
      data: params
    })
  },
  getImageList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceReviewTaskResult/queryReviewDetail',
      method: 'post',
      data: params
    })
  },
  exportDataSet: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceReviewTaskResult/convertDataList',
      method: 'post',
      data: params
    })
  },
  analysis: {
    getData: (params) => {
      return axios({
        url: '/api/v1/applicationcenter/tbReviewTaskResultAnalyse/getReviewAnalyseByMainId',
        method: 'get',
        params
      })
    },
    updateGlobalData: (params) => {
      return axios({
        url: '/api/v1/applicationcenter/tbReviewTaskResultAnalyse/actionTotalAnalyseResultByForecastId',
        method: 'get',
        params
      })
    },
    updateSingleData: (params) => {
      return axios({
        url: '/api/v1/applicationcenter/tbReviewTaskResultAnalyse/actionOneAnalyseResultByForecastId',
        method: 'get',
        params
      })
    },
    setCodeQuotaAsBest: (params) => {
      return axios({
        url: '/api/v1/applicationcenter/tbReviewTaskResultAnalyse/setCodeQuotaAsBest',
        method: 'put',
        params: { forecastId: params.forecastId, saveFlag: params.saveFlag },
        data: { codeSet: params.codeSet }
      })
    },
    setCodeAccuracyValue: (params) => {
      return axios({
        url: '/api/v1/applicationcenter/tbReviewTaskResultAnalyse/actionMeasureAccuracyValue',
        method: 'put',
        params
      })
    }
  }
}

export const middleResult = {
  fetchRunningResultData (params) {
    return axios({
      url: '/api/v1/applicationcenter/inferenceTaskInfo/fetchRunningTaskResult',
      method: 'get',
      params
    })
  },
  getFileList (params) {
    return axios({
      url: '/api/v1/applicationcenter/inferenceTaskInfo/fetchRunningTaskResultSubDirContent',
      method: 'get',
      params
    })
  },
  // getImage (params) {
  //   return axios({
  //     url: '/api/v1/applicationcenter/inferenceTaskInfo/fetchRunningTaskPictureContent',
  //     method: 'get',
  //     params
  //   })
  // }
  getImage: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceTaskInfo/fetchRunningTaskPictureContent',
      method: 'get',
      family: -1,
      // responseType: 'blob',
      params
    })
  }
}

export const billing = {
  billingList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbKdManageInfo/list',
      method: 'get',
      params
    })
  },
  addBilling: (params, method) => {
    return axios({
      url: '/api/v1/applicationcenter/tbKdManageInfo',
      method,
      data: params
    })
  },
  editBilling: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbKdManageInfo',
      method: 'put',
      data: params
    })
  },
  deleteBilling: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbKdManageInfo/' + params,
      method: 'delete'
    })
  },
  getBilling: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbKdManageInfo/fetchKdTaskSimpleInfo',
      method: 'get',
      params
    })
  },
  getBillingCategory: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbKdManageInfo/fetchKdTaskCategoryInfo',
      method: 'get',
      params
    })
  },
  getBillingImageList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbKdManageInfo/fetchKdTaskImgPageInfo',
      method: 'get',
      params
    })
  },
  getBillingImage: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbKdTaskManageResult/loadPicture/' + params,
      method: 'get',
      family: -1,
      // responseType: 'blob'
    })
  },
  middleResult: {
    fetchRunningResultData: (params) => {
      return axios({
        url: '/api/v1/applicationcenter/inferenceTaskInfo/fetchRunningTaskResult',
        method: 'get',
        params
      })
    },
    getFileList: (params) => {
      return axios({
        url: '/api/v1/applicationcenter/tbKdManageInfo/findIntermediateResult',
        method: 'get',
        params
      })
    },
    getImage: (params) => {
      return axios({
        url: '/api/v1/applicationcenter/inferenceTaskInfo/fetchRunningTaskPictureContent',
        method: 'get',
        family: -1,
        // responseType: 'blob',
        params
      })
    }
  }
}

export const changeTaskStatusToAll = {
  startAllTask: () => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceTaskInfo/inferenceTaskStartBatch',
      method: 'get'
    })
  },
  stopAllTask: () => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceTaskInfo/inferenceTaskStopBatch',
      method: 'get'
    })
  }
}

export const imageSearch = {
  getChildrenCodeList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbCsvPictureParseResult/getImgFactoryInfo',
      method: 'get',
      params
    })
  },
  getCodeList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbCsvPictureParseResult/getImgFileCategory',
      method: 'get',
      params
    })
  },
  getCodeListNumber: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbCsvPictureParseResult/getImgFileCategoryAndCount',
      method: 'post',
      data: params
    })
  },
  getImageList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbCsvPictureParseResult/getPointedFileCategoryImgInfo',
      method: 'get',
      params
    })
  },
  getImage: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbCsvPictureParseResult/getPictureById/' + params,
      method: 'get',
      family: -1,
      // responseType: 'blob'
    })
  },
  getCodeImageMax: () => {
    return axios({
      url: '/api/v1/applicationcenter/tbCsvPictureParseResult/getConfigImgMaxCountByCode',
      method: 'get',
    })
  },
  createDataSet: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbCsvPictureParseResult/createDatalistFromRvMessage',
      method: 'post',
      data: params
    })
  },
  getRangeConfig: () => {
    return axios({
      url: '/api/v1/applicationcenter/tbCsvPictureParseResult/getConfigMaxDateValue',
      method: 'get'
    })
  }
}

export function getTaskLog (params) {
  return axios({
    url: `/api/v1/applicationcenter/inferenceOperateLog/list`,
    method: 'get',
    params
  })
}

export const offlineBackExportSet = {
  getConfig: (params) => {
    return axios({
      url: `/api/v1/applicationcenter/inferenceReplayTaskConfig/findInferenceDifficultToSampleConf/${params}`,
      method: 'post'
    })
  },
  saveConfig: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceReplayPredictResult/createInferenceDifficultToSampleConf',
      method: 'post',
      data: params
    })
  }
}

export const realTimeDetail = {
  getDetailData: (params) => {
    return axios({
      url: `/api/v1/applicationcenter/inferenceMessageFlow/getLatest/${params}`,
      method: 'get'
    })
  },
  getTableData: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceTaskPredictResult/listLatest',
      method: 'post',
      data: params
    })
  },
}

export const modelStatisticsApi = {
  searchData: (data) => {
    return axios({
      url: '/api/v1/applicationcenter/tbQuotaConditionViewInfo/executeQuerySite',
      method: 'post',
      data
    })
  },
  searchModelData: (data) => {
    return axios({
      url: '/api/v1/applicationcenter/tbQuotaConditionViewInfo/executeQueryTask',
      method: 'post',
      data
    })
  },
  searchCodeData: (data) => {
    return axios({
      url: '/api/v1/applicationcenter/tbQuotaConditionViewInfo/executeQueryTaskCode',
      method: 'post',
      data
    })
  },
  getCondition: () => {
    return axios({
      url: '/api/v1/applicationcenter/tbQuotaConditionViewInfo/getQuotaCondition',
      method: 'get'
    })
  },
  getTaskList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbQuotaConditionViewInfo/getMatchConditionTask',
      method: 'get',
      params
    })
  }
}

export const esdReview = {
  searchData: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdAlgResult/filterEsdResult',
      method: 'get',
      params
    })
  },
  getImage: (id) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdAlgResult/loadPicture?id=' + id,
      method: 'get',
      family: -1,
      // responseType: 'blob'
    })
  },
  getTaskList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdReviewTaskInfo/fetchTaskByProgramType',
      method: 'get',
      params
    })
  },
  reviewResult: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdReviewTaskDetail/reviewAlgResult',
      method: 'post',
      params
    })
  },
  saveResult: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdReviewTaskDetail/finishReviewAlgResult',
      method: 'post',
      params
    })
  },
  getReviewCode: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdTaskAvlCode/getAvlCodeList',
      method: 'get',
      params
    })
  },
  addReviewCode: (data) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdTaskAvlCode/addNewCode',
      method: 'post',
      data
    })
  },
  delReviewCode: (ids) => {
    return axios({
      url: `/api/v1/applicationcenter/inferenceEsdTaskAvlCode/${ids}`,
      method: 'delete'
    })
  },
  getReviewTaskList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdReviewTaskInfo/list',
      method: 'get',
      params
    })
  },
  delReviewTask: (ids) => {
    return axios({
      url: `/api/v1/applicationcenter/inferenceEsdReviewTaskInfo/${ids}`,
      method: 'delete'
    })
  },
  zipImage: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdReviewTaskDetail/copyAndZipPicture',
      method: 'get',
      params
    })
  },
  getTaskCode: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdAlgResult/fetchEsdCodeAndCount',
      method: 'get',
      params
    })
  },
  getProductAndGlassId: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdAlgResult/fetchEsdProductAndGlassIdByTask',
      method: 'get',
      params
    })
  }
}

export const lscReview = {
  searchData: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceMessageLscPredict/filterLscResult',
      method: 'get',
      params
    })
  },
  getImage: (id) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceMessageLscPredict/loadPicture?id=' + id,
      method: 'get',
      family: -1,
      // responseType: 'blob'
    })
  },
  reviewResult: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceMessageLscPredict/reviewAlgResult',
      method: 'post',
      params
    })
  },
  saveResult: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceMessageLscPredict/finishReviewAlgResult',
      method: 'post',
      params
    })
  },
  getReviewCode: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdTaskAvlCode/getAvlCodeList',
      method: 'get',
      params
    })
  },
  addReviewCode: (data) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdTaskAvlCode/addNewCode',
      method: 'post',
      data
    })
  },
  delReviewCode: (ids) => {
    return axios({
      url: `/api/v1/applicationcenter/inferenceEsdTaskAvlCode/${ids}`,
      method: 'delete'
    })
  },
  getReviewTaskList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdReviewTaskInfo/list',
      method: 'get',
      params
    })
  },
  delReviewTask: (ids) => {
    return axios({
      url: `/api/v1/applicationcenter/inferenceEsdReviewTaskInfo/${ids}`,
      method: 'delete'
    })
  },
  zipImage: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdReviewTaskDetail/copyAndZipPicture',
      method: 'get',
      params
    })
  },
  getTaskCode: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdAlgResult/fetchEsdCodeAndCount',
      method: 'get',
      params
    })
  },
  getProductAndGlassId: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/inferenceEsdAlgResult/fetchEsdProductAndGlassIdByTask',
      method: 'get',
      params
    })
  }
}

export const productAxis = {
  getDataList: (params) => {
    return axios({
      url: '/api/v1/applicationcenter/tbEsdProductAxisInfo/list',
      method: 'get',
      params
    })
  },
  editData: (data, method) => {
    return axios({
      url: '/api/v1/applicationcenter/tbEsdProductAxisInfo',
      method,
      data
    })
  },
  delData: (ids) => {
    return axios({
      url: `/api/v1/applicationcenter/tbEsdProductAxisInfo/${ids}`,
      method: 'delete'
    })
  }
}