import { axios } from '@/utils/request'

// 获取模型管理表格列表数据
export function getModelTableList (params) {
    return axios({
      url: `/api/v1/traincenter/modelManageInfo/list`,
      method: 'get',
      params: params
    })
}
// 获取模型列表(改版后，训练好并保存或本地上传新建的才成为模型) ,在模型管理首页列表调用
export function getModelList (params) {
  return axios({
    url: `/api/v1/traincenter/modelManageInfo/getModelList`,
    method: 'get',
    params: params
  })
}
// 模型导入
export function importModel (data) {
  return axios({
    url: `/api/v1/traincenter/modelManageInfo/import`,
    method: 'POST',
    data: data
  })
}
// (训练完后)保存模型至模型管理
export function saveFromOldModel (data) {
  return axios({
    url: `/api/v1/traincenter/modelManageInfo/saveFromOldModel`,
    method: 'post',
    data
  })
}

// 模型导出
// export function exportModel (params) {
//   return axios({
//     url: `/api/v1/traincenter/modelManageInfo/download`,
//     method: 'get',
//     params: params
//   })
// }
// 获取数据集id
export function  getDataIdList(id) {
  return axios({
    url: `/api/v1/traincenter/modelManageInfo/getTrainSetByModelId/${id}`,
    method: 'get',
  })
}
// 数据集选中情况
export function  updateForecastDataSet(params) {
  return axios({
    url: `/api/v1/traincenter/offlineForecastInfo/updateForecastDataSet`,
    method: 'post',
    params: params
  })
}

// 新建模型
export function createModel(params) {
    return axios({
        url: `/api/v1/traincenter/modelManageInfo/createModel `,
        method: 'post',
        data: params
    })
}

// 删除模型
export function delModel (params) {
    return axios({
      url: `/api/v1/traincenter/modelManageInfo/${params}`,
      method: 'DELETE',
    })
}

export function delModeCheckDepend (id) {
  return axios({
    url: `/api/v1/traincenter/modelManageInfo/checkModelDependenceSub/${id}`,
    method: 'get'
  })
}

// 停止训练
export function stopModelTrain (params) {
    return axios({
      url: `/api/v1/traincenter/modelManageInfo/modelTrainTaskStop`,
      method: 'post',
      data: params
    })
}

// 模型新建第三步，根据上一步的数据集数组查询分类信息
export function getCategoryInfo (params) {
  return axios({
    url: `/api/v1/datacenter/dataListFileDetail/getCategoryInfos/${params}`,
    method: 'get',
  })
}
// 保存模型训练设置
export function saveTrainSet(params) {
    return axios({
        url: `/api/v1/traincenter/modelManageInfo/completeSet?modelType=1`,
        method: 'post',
        data: params
    })
}
// 根据保存的模型数据开始训练
export function startTrain (params) {
    return axios({
      url: `/api/v1/traincenter/modelManageInfo/completeSetTrainStart`,
      method: 'post',
      data: params
    })
}
export function startTrainIM(params) {//创建模型 无须保存直接开始训练
    return axios({
        url: `/api/v1/traincenter/modelManageInfo`,
        method: 'post',
        data: params
    })
}
// 获取模型检测项
export function getCheckItems(params) {//获取查看模型-数据集检测页的检测项,params=2
    return axios({
        url: `/api/v1/dataanalysis/datasetCheck/getCheckItemsInfo/${params}`,
        method: 'get',
    })
}
// 模型发布
export function releaseModel (params) {
  return axios({
    url: `/api/v1/traincenter/modelManageInfo/publishModelToTask`,
    method: 'post',
    data: params
  })
}
// 模型发布至已有推理服务
export function releaseModelToAlreadyInfesvr (infesvrId, params) {
    return axios({
        url: `/api/v1/traincenter/modelManageInfo/publishModelToTask/${infesvrId}`,
        method: 'post',
        data: params
    })
}
// 模型发布完成后修改模型的状态
export function editModel (params) {
  return axios({
    url: `/api/v1/traincenter/modelManageInfo`,
    method: 'put',
    data: params
  })
}
// 模型重命名
export function editModelName (params) {
  return axios({
    url: `/api/v1/traincenter/modelManageInfo/updateRechristen`,
    method: 'put',
    data: params
  })
}
// 模型导出,目前未使用blob的下载方式
export function downloadModel (params) {
  return axios({
    url: `/api/v1/traincenter/modelManageInfo/download/${params}`,
    method: 'get',
    responseType: 'blob'
  })
}
// 批量导入模型
export function modelImport (params) {
  return axios({
    url: '/api/v1/traincenter/modelManageInfo/batchImportModels',
    method: 'post',
    data: params
  })
}
// 模型移动节点
export function modelMoveNode (params) {
  return axios({
    url: '/api/v1/traincenter/modelManageInfo/updateMobileNode',
    method: 'put',
    data: params
  })
}

// 模型训练监控批量删除训练模型
export function delInfoModels (params) {
  return axios({
    url: '/api/v1/traincenter/modelManageInfo/deleteModelInfoByPatch',
    method: 'delete',
    data: params
  })
}

/**
 *
 * @param {*}} 模型管理详情接口
 */
// 根据id获取模型信息
export function getModelInfoById (params) {
  return axios({
    url: `/api/v1/traincenter/modelManageInfo/base/${params}`,
    method: 'get',
  })
}
//保存模型数据集信息和选中项
export function setDataSet(params) {
    return axios({
        url: `/api/v1/traincenter/modelManageInfo/completeSetMergeDatasetAndSelectedType`,
        method: 'post',
        params
    })
}
// 根据数据集ids获取数据集信息，模型详情页-模型信息-表格
export function getModelDLtByDLId (params) {
  return axios({
    url: `/api/v1/datacenter/dataListFileStatistics/${params}`,
    method: 'get',
  })
}
//通用模型统计code 图片及标注数量（及分辨率）
export function getCodeData(params) {
    return axios({
        url: `/api/v1/datacenter/datasetstatcInfo/selectDatasetSeCheckInfo/${params}`,
        method: 'get',
    })
}
//读取模型训练要求
/*
 * @params="数据集ID1,数据集ID2,……?imagesId=算法ID"
 * */
export function selectDatasetSeNoAddMinMustAdd(params) {
    return axios({
        url: `/api/v1/dataanalysis/datasetCheck/selectDatasetSeNoAddMinMustAdd/${params}`,
        method: 'get',
    })
}
//获取模型所用数据集选中的code list
export function getCodeList(params) {
    return axios({
        url: `/api/v1/traincenter/modelManageInfo/selectManageDatasetsDirsAndSelectedType/${params}`,
        method: 'get',
    })
}
//上传code_density文件
export function uploadCodeDensity(params) {
    return axios({
        url: `/api/v1/datacenter/file/uploadModelCodeDensity`,
        method: 'post',
        params
    })
}
//模型完成设置接口后的开始训练（查看模型-训练参数）
export function setTrainStart(params) {
    return axios({
        url: `/api/v1/traincenter/modelManageInfo/completeSetTrainStart`,
        method: 'post',
        data: params
    })
}
// 获取业务模型数据
export function getBusinessModelManageInfo(params) {
    return axios.get('/api/v1/traincenter/modelManageInfo/' + params)
}
export function saveRemake (params) {
  return axios({
    url: '/api/v1/traincenter/modelManageInfo/updateModelDesc',
    method: 'post',
    params
  })
}

// 根据ID修改模型参数
export function editModelParams (data) {
  return axios({
    url: '/api/v1/traincenter/modelManageInfo/modifyAlgorithmParam',
    method: 'put',
    data
  })
}

//准备查询通用各离线数据分析维度页签数据标题列表接口
export function getTabs(params) {
    return axios({
        url: `/api/v1/traincenter/modelCommonController/findDataanalysisTabReady/${params}`,
        method: 'get',
    })
}

//查询通用各离线数据分析维度结果数据
export function getTabData(params) {
    return axios({
        url: `/api/v1/traincenter/modelCommonController/findDataanalysisTab/${params}`,
        method: 'get',
    })
}

/**
 *
 * @param {params} 数据集id
 */
// 根据数据集id获取文件分类信息，模型详情页-模型信息-柱状图
export function getFileCategory (params) {
  return axios({
    url: `/api/v1/datacenter/dataListFileDetail/getFileCategory/${params}`,
    method: 'get',
  })
}

/**
 *
 * @param {params} 数据集id
 */
// 根据数据集id获取文件分类信息，数据集详情页-数据集分类柱状图
export function getFileCategoryAndCount (params) {
  return axios({
    url: `/api/v1/datacenter/dataListFileDetail/getFileCategoryAndCount/`,
    method: 'get',
    params
  })
}

/**
 *
 * @param {params} 数据集id
 */
// 根据数据集id获取文件分类信息，数据集详情页-数据集分类柱状图
export function getAllListCategory (params) {
  return axios({
    url: `/api/v1/datacenter/dataListFileDetail/getAllListCategory/${params}`,
    method: 'get',
  })
}

/**
 *
 * @param {params} 数据集id
 */
// 搜索数据集类型
export function getSearchCategory (params) {
  return axios({
    url: `/api/v1/datacenter/dataListFileDetail/getSearchCategory/${params}`,
    method: 'get',
  })
}

// 根据数据集id和数据集类别获取图片文件存储id
export function getPictureFileIds (params, confirmMarkRange) {
  const queryStr = typeof confirmMarkRange !== 'undefined' ? `?confirmMarkRange=${confirmMarkRange}` : ''
  return axios({
    url: `/api/v1/datacenter/dataListFileDetail/getPictureFileIds/${params}${queryStr}`,
    method: 'get',
  })
}

// 根据id获取图片
export function getPicture (params, mode = 'original') {
  // mode取值包括 original（原图）、thumbnail（缩略图）、thumbnail_with_bbox（有标注框的缩略图）
  return axios({
    url: `/api/v1/datacenter/dataListFileDetail/getPicture/${params}?mode=${mode}`,
    method: 'get',
    family: -1,
    // responseType: 'blob'
  })
}

// 根据文件路径获取blob图片
export function getPictureFilePath(params) {
  return axios({
    url: `/api/v1/dataanalysis/aiTemplateMakeinfo/getImageBlobByFilePath?filePath=${params}`,
    method: 'get',
      family:-1
    // responseType: 'blob'
  })
}

//验证集获取图片
export function getImage (id) {
  return axios({  
    url: `/api/v1/datacenter/file/getImg/model/${id}`,
    method: 'get',
      family: -1
    // responseType: 'blob'
  })
}

//模型评估建议
export function getRecommendations() {
    return axios({
        url: `/api/v1/traincenter/forecastResultInfo/getAllRecommendations/`,
        method: 'get',
    })
}
/*
 * params:json风格字符串,如
{
	"groundTrue":"TNXIF0",
	"predictCode":"TN4HI2",
	"modelId":2019, 
	"limit":10,
	"pageNo":1
}

*/
//返回混淆矩阵各单元格对应的图片列表——验证集
export function getMatrixImgListM(params) {
    return axios({
        url: `/api/v1/traincenter/modelTrainResultInfo/confusionMatrixCellList/${params}`,
        method: 'get',
    })
}

export function getMatrixImgListMOriginPic(params) {
  return axios({
      url: `/api/v1/traincenter/modelTrainResultInfo/confusionMatrixCellOriginPicList/${params}`,
      method: 'get',
  })
}
/*
 * params:json风格字符串,如
{
	"groundTrue":"TNXIF0",
	"predictCode":"TN4HI2",
	"forecastId":2019,
	"limit":10,
	"pageNo":1
}
*/
//返回混淆矩阵各单元格对应的图片列表——测试集
export function getMatrixImgListF(params) {
    return axios({
        url: `/api/v1/traincenter/forecastResultInfo/confusionMatrixCellList/${params}`,
        method: 'get',
    })
}
/**
 *
 * @param {params} id
 */
// 根据id获取结果列表table，模型详情页-结果洞察-结果列表表格
export function getResultList (params) {
  return axios({
    url: `/api/v1/traincenter/modelTrainResultInfo/trainResultInfoList`,
    method: 'get',
    params
  })
}

/**
 *
 * @param {params} id
 */
// 根据id获取错分详情，模型详情页-结果洞察-柱状图
export function getErrorDetailList (params) {
  return axios({
    url: `/api/v1/traincenter/modelTrainResultInfo/errorDetail`,
    method: 'post',
    data: params
  })
}

/**
 *
 * @param {params} id
 */
// 点击Bar柱子获取对应的样本详情，模型详情页-结果洞察-样本详情表格
export function getSampleDetailList (params) {
  return axios({
    url: `/api/v1/traincenter/modelTrainResultInfo/list`,
    method: 'get',
    params,
  })
}


export function downloadErrorDetail (params) {
  let param = ''
  Object.keys(params).forEach(item => {
    param += `${item}=${params[item]}&`
  })
  return `/api/v1/traincenter/modelTrainResultInfo/export?${param}`
}

/**
 *
 * @param {params} id
 */
// 模型详情页-结果洞察-混淆矩阵
export function getMatrixList (params) {
  return axios({
    url: `/api/v1/traincenter/modelTrainResultInfo/confusionMatrix/${params}`,
    method: 'get',
  })
}

/**
 *
 * @param {params} id
 */
// 模型详情页-结果洞察-下载详情
export function getSampleDetailListExport (params) {
  return axios({
    url: `/api/v1/traincenter/modelTrainResultInfo/export`,
    method: 'get',
    params,
    // responseType: 'blob'
  })
}

// 模型详情页-结果洞察-数据分流图
export function getDataFlow (params) {
  return axios({
    url: `/api/v1/traincenter/modelTrainResultInfo/dataFlow/${params}`,
    method: 'get',
    // responseType: 'blob'
  })
}

// 新建模型-获取K8S使用情况(主要是GPU数量)
export function getK8SDataInfo (params) {
  return axios({
    url: `/api/v1/datacenter/homepage/loadK8sQuota`,
    method: 'get',
    params,
    // responseType: 'blob'
  })
}

// 新建模型-获取算法参数（处理后的信息）
export function getConfig (params) {
  return axios({
    url: `/api/v1/algorithm/imageManageInfo/getConfig/${params}`,
    method: 'get'
  })
}

// 新建业务模型--获取依赖通用模型（树状结构）
export function getModelDepend (params) {
  return axios.get('/api/v1/traincenter/modelManageInfo/getModelDepend/' + params)
}

// 获取模型历史日志
export function getModelHistoryLog (params) {
  return axios.get('/api/v1/traincenter/modelManageInfo/fetchModelHistoryLog/' + params)
}
// 获取模型实时日志
export function getModelRealLog (params) {
  return axios.get('/api/v1/schedule/scheduleController/fetchPodRunLog', {
    params: {
      modelId: params
    }
  })
}
// 删除或者新增外部依赖模型
export function postOperModelFile (params, uploadProgress) {
  return axios({
    url: '/api/v1/traincenter/modelManageInfo/operModelFile',
    method: 'post',
    data: params,
    onUploadProgress: (e) => uploadProgress(e)
  })
}



/**
 * 验证模型名称是否可用
 */
export function checkModelNameAvl (params) {
  return axios.get('/api/v1/traincenter/modelManageInfo/checkModelNameAvl', { params })
}

/**
 * 新建模型-步骤3-获取模型列表
 */
export function fetchSuccessTrainModelList (params) {
  return axios.get('/api/v1/traincenter/modelManageInfo/fetchSuccessTrainModelList', { params })
}

/**
 * 新建模型-步骤3-获取公共类型
 */
export function fetchModelPublicCategory (params) {
  return axios.get('/api/v1/traincenter/modelManageInfo/fetchModelPublicCategory', { params })
}

/**
 * 暂停模型训练
 */
export function pauseTrainModel (params) {
  return axios({
    url: '/api/v1/traincenter/modelCommonController/pauseTrainModel?modelId=' + params.modelId,
    method: 'post'
  })
}
/**
 * 恢复模型训练
 */
export function recoverTrainModel (params) {
  return axios({
    url: '/api/v1/traincenter/modelCommonController/recoverTrainModel',
    method: 'post',
    data: params
  })
}

/**
 * 获取训练监控图表数据
 */
export function fetchTrainMonitorQXData (params) {
  return axios({
    url: '/api/v1/traincenter/modelManageInfo/fetchTrainMonitorQXData',
    method: 'get',
    params
  })
}
/**
 * 获取训练监控表格数据
 */
export function fetchTrainMonitorModelList (params) {
  return axios({
    url: '/api/v1/traincenter/modelManageInfo/fetchTrainMonitorModelList',
    method: 'get',
    params
  })
}
/**
 * 训练监控，设置最佳模型
 */
export function actionSetBestModel (params) {
  return axios({
    url: '/api/v1/traincenter/modelManageInfo/actionSetBestModel',
    method: 'put',
    params
  })
}

export const middleResult = {
  fetchRunningResultData (params) {
    return axios({
      url: '/api/v1/traincenter/modelCommonController/fetchRunningResultData',
      method: 'get',
      params
    })
  },
  getFileList (params) {
    return axios({
      url: '/api/v1/traincenter/modelCommonController/fetchRunningResultSubDirPictureContent',
      method: 'get',
      params
    })
  },
  getImage (params) {
    return axios({
      url: '/api/v1/traincenter/modelCommonController/fetchRunSubDirPictureContent',
      method: 'get',
        family: -1,
      // responseType: 'blob',
      params
    }) 
  }
}

export const modelVersion = {
  getImageVersionList: (params) => {
    return axios({
      url: '/api/v1/traincenter/modelManageInfo/getVersionList',
      method: 'get',
      params
    })
  }
}

export const modelGroup = {
  addModelGroup: (params, method) => {
    return axios({
      url: '/api/v1/traincenter/modelGroupInfo',
      method,
      data: params
    })
  },
  getModelGroup: (params, method) => {
    return axios({
      url: `/api/v1/traincenter/modelGroupInfo/${params}`,
      method,
    })
  },
  getModelGroupList: (params) => {
    return axios({
      url: '/api/v1/traincenter/modelGroupInfo/list',
      method: 'get',
      params
    })
  }
}


//通用下载
export function downloadFileCommon(urlVal, params) {
    alert('准备下载')
    return axios({
        url: urlVal,
        method: 'get',
        params: params,
        responseType: 'blob'
    }).then(response => {
            // console.log(response)

            // 创建一个下载链接并触发下载
            const downloadLink = document.createElement('a');
            downloadLink.href = window.URL.createObjectURL(response);
            if( params.zipFilePath){
            downloadLink.download = params.zipFilePath; // 设置文件名
            }
            downloadLink.click();
        })
        .catch(error => {
            // 处理请求错误
            console.error('Error:', error);
        });
}

export async function downloadFileCommon2(urlVal, params) {
    let response=null;
    try {
        response = await axios({
            url: urlVal,
            method: 'get',
            params: params,
            responseType: 'blob'
        })
        // console.log(response)
        // 创建一个下载链接并触发下载
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(response);
        if(params.zipFilePath) {
            downloadLink.download = params.zipFilePath; // 设置文件名
        }
        downloadLink.click();
    }catch(error) {
        // 处理请求错误
        console.error('Error:', error);
    }
    return response;
}


// /api/v1/traincenter/modelVersionInfo/HttpConvertModelType?modelId=3202&&convertType=onnx
// 模型格式转换
export function getModelTransform (params) {
    return axios({
        url: `/api/v1/traincenter/modelVersionInfo/HttpConvertModelType`,
        method: 'get',
        params
    })
}

// 停止tensorboard服务
export function stopTensorboardServe(modelid) {
  return axios({
    url: `/api/v1/adapter/stop_tensorboard/${modelid}`,
    method: "get",
  })
}
