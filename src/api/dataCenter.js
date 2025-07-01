import { axios } from "@/utils/request";

/**
 * 数据源查询列表
 */
export function getDataSoureList(params) {
  return axios({
    url: "/api/v1/datasource/dataSourceInfo/list",
    method: "get",
    params,
  });
}
// 消息队列源列表查询
export function getRVSoureList(params) {
  return axios({
    url: "/api/v1/datasource/rvConfig/getList",
    method: "get",
    params,
  });
}
/**
 * 数据源新增列表
 */
export function saveDataSoure(params) {
  return axios({
    url: "/api/v1/datasource/dataSourceInfo",
    method: "post",
    data: params,
  });
}
// 消息队列源新增
export function addRVSource(params) {
  return axios({
    url: "/api/v1/datasource/rvConfig/add",
    method: "post",
    data: params,
  });
}
// 消息队列源修改
export function updateRVSource(params) {
  return axios({
    url: "/api/v1/datasource/rvConfig/update",
    method: "post",
    data: params,
  });
}
// 消息队列源删除
export function deleteRVSource(id) {
  return axios({
    url: "/api/v1/datasource/rvConfig/delete",
    method: "post",
    params: { id },
  });
}
// 连接测试消息队列源
export function testRVSource(daemon) {
  return axios({
    url: `/api/v1/datasource/rvConfig/telnet`,
    method: "post",
    params: { daemon },
  });
}
/**
 * 数据源修改列表
 */
export function editDataSoure(params) {
  return axios({
    url: "/api/v1/datasource/dataSourceInfo",
    method: "put",
    data: params,
  });
}
/**
 * 数据源删除列表
 */
export function deleteDataSoure(params) {
  return axios({
    url: "/api/v1/datasource/dataSourceInfo/" + params,
    method: "delete",
  });
}
/**
 * 数据源连接测试
 */
export function contectDataSoureTest(params) {
  return axios({
    url: "/api/v1/datasource/dataSourceInfo/linkDataSource",
    method: "post",
    data: params,
  });
}
/**
 * 数据集查询列表
 */
export function getDataSetList(params) {
  return axios({
    url: "/api/v1/datacenter/dataListInfo/list",
    method: "get",
    params,
    // 支持数组格式参数
    paramsSerializer: params => {
      return Object.keys(params)
        .map(key => {
          if (Array.isArray(params[key])) {
            return params[key].map(value => `${key}=${value}`).join('&');
          }
          return `${key}=${params[key] === undefined ? "" : params[key]}`;
        })
        .join('&');
    }
  });
}
/**
 * 数据集新增
 */
export function saveDataSetList(params) {
  return axios({
    url: "/api/v1/datacenter/dataListInfo",
    method: "post",
    data: params,
  });
}
/**
 * 本地上传数据集
 * @param {*} params 
 * @param {*} onUploadProgress 进度函数
 * @param {*} signal abort 控制器
 * @returns 
 */
export function uploadDataSet(params, onUploadProgress, signal) {
  return axios({
    url: "/api/v1/datacenter/dataListInfo/addFromLocal",
    method: "post",
    data: params,
    signal,
    onUploadProgress
  });
}
/**
 * 数据集编辑
 */
export function editDataSetList(params) {
  return axios({
    url: "/api/v1/datacenter/dataListInfo",
    method: "put",
    data: params,
  });
}
/**
 * 数据集删除
 */
export function deleteDataSetList(params) {
  return axios({
    url: "/api/v1/datacenter/dataListInfo/" + params,
    method: "delete",
  });
}
/**
 * 数据集删除
 */
export function getDataSetListById(params) {
  return axios({
    url: "/api/v1/datacenter/dataListInfo/" + params,
    method: "get",
  });
}

export function moveDataSetNode(params) {
  return axios({
    url: "/api/v1/datacenter/dataListInfo/moveDataListNode",
    method: "put",
    params,
  });
}

/**
 * 单个数据集详情
 */
export function getSingleDataListDetailById(params) {
  return axios({
    url: "/api/v1/datacenter/dataListInfo/dlDetail/" + params,
    method: "get",
  });
}

/**
 * 单个数据集样本详情
 */
export function getSingleDataListSampleDetailById(params) {
  return axios({
    url: "/api/v1/datacenter/dataListFileStatistics/dlSampleDetail/" + params,
    method: "get",
  });
}
// 数据集类型标志位设置
export function dataListChangeType(params) {
  return axios({
    url: "/api/v1/datacenter/dataListInfo/transformDataListDlTagType",
    method: "post",
    params,
  });
}
/**
 * 基于原分割数据集，创建一个新的分类数据集
 * @param {*} data 
 * @returns 
 */
export function changeSegToCls(data) {
  return axios({
    url: "/api/v1/datacenter/dataListInfo/changeSegToCls",
    method: "post",
    data,
  });
}
// 数据集转换
export function datasetConvert(data) {
  return axios({
    url: "/api/v1/datacenter/dataListInfo/dataset-convert",
    method: "post",
    data,
  });
}

/**
 * 数据集样本详情图片列表分页
 */
export function getPictureIdPageList(params) {
  return axios({
    url: "/api/v1/datacenter/dataListFileDetail/pictureIdPageList",
    method: "get",
    params,
  });
}

export function removeAllLabel(data) {
  return axios({
    url: "/api/v1/datacenter/dataListInfo/batchDeleteMarkPosition",
    method: "post",
    params: data,
  });
}
// 获取某数据集下label标签列表(区分已标注和未标注)
export function getLabelList(params) {
  return axios({
    url: `/api/v1/datacenter/dataListInfo/getLabelsOrCategoryList`,
    method: "get",
    params: params,
  });
}
// 移动图片到新的label
export function movePicturesToLabel(data) {
  return axios({
    url: "/api/v1/datacenter/dataListFileDetail/movePictureToNewLabel",
    method: "post",
    data: data,
  });
}
/**
 * 数据集树节点查询列表
 */
export function getTreeList(params) {
  return axios({
    // http://10.8.2.244:8030
    url: "/api/v1/datacenter/dataListNode/getDataListNodeByParentNode",
    method: "get",
    params: params,
  });
}
export function savaTreeList(params) {
  return axios({
    url: "/api/v1/datacenter/dataListNode",
    method: "post",
    data: params,
  });
}
export function editTreeList(params) {
  return axios({
    url: "/api/v1/datacenter/dataListNode",
    method: "put",
    data: params,
  });
}
export function deleteTreeList(params) {
  return axios({
    url: "/api/v1/datacenter/dataListNode/deletebyId/" + params,
    method: "delete",
  });
}

/**
 * 获取提示标注可用模型
 */
export function getaPromptModel() {
  return axios({
    url: "/api/v1/datacenter/autoAnnotator/promptSegModels",
    method: "get",
  });
}

/**
 * 根据图片id删除标注
 */
export function deleteByImageId(imageId) {
  return axios({
    url: "/api/v1/datacenter/dataListAnnotation/deleteByImageId/" + imageId,
    method: "delete",
  });
}

/**
 * 根据数据集id删除标注
 */
export function deleteByDatasetId(datasetId) {
  return axios({
    url: "/api/v1/datacenter/dataListAnnotation/deleteByDatasetId/" + datasetId,
    method: "delete",
    data: {},
  });
}
/**
 * 获取自动标注任务信息
 */
// export function dataListAutoMarkTaskInfo(id) {
//   return axios({
//     url: "/api/v1/datacenter/dataListAutoMarkTaskInfo/" + id,
//     method: "get",
//   });
// }
// 获取Sam mask图片
export function getSamMaskPicture(id) {
  return axios({
    url: `/api/v1/datacenter/dataListAutoMarkTaskInfo/${id}/promptMaskedImage`,
    method: "get",
    family: -1
  });
}

/**
 * 查询标注类型
 */
export function getTargetType() {
  return axios({
    url: "/api/v1/algorithm/imagesManageNode/getNodeListByLevel/2/1",
    method: "get",
  });
}

export function pushData(data) {
  return axios({
    url: "/api/v1/datacenter/dataListInfo/reAddDatalistContent",
    method: "post",
    data,
  });
}
/**
 * 镜像管理树节点查询
 */
export function getImageMrgTreeList(params) {
  return axios({
    // http://10.8.2.244:8030
    url: "/api/v1/algorithm/imagesManageNode/getDataListNodeByParentNode",
    method: "get",
    params: params,
  });
}
export function savaImageMrgTreeList(params) {
  return axios({
    url: "/api/v1/datacenter/dataListNode",
    method: "post",
    data: params,
  });
}
export function editImageMrgTreeList(params) {
  return axios({
    url: "/api/v1/datacenter/dataListNode",
    method: "put",
    data: params,
  });
}
export function deleteImageMrgTreeList(params) {
  return axios({
    url: "/api/v1/datacenter/dataListNode/deletebyId/" + params,
    method: "delete",
  });
}

// 离线预测的树节点查询,只有这个与模型管理不一样，增删改是一样的
/**
 *
 * @param {树节点查询} params
 */
export function getOfflineTreeList(params) {
  return axios({
    url: "/api/v1/traincenter/modelManageNode/getOfflineForecastDataListNodeByParentNode",
    method: "get",
    params: params,
  });
}

// 模型管理树节点,写在这里是为了使用tree方便
/**
 *
 * @param {树节点查询} params
 */
export function getModelTreeList(params) {
  return axios({
    url: "/api/v1/traincenter/modelManageNode/getDataListNodeByParentNode",
    method: "get",
    params: params,
  });
}
/**
 *
 * @param {树节点新增} params
 */
export function savaModelTreeList(params) {
  return axios({
    url: "/api/v1/traincenter/modelManageNode",
    method: "post",
    data: params,
  });
}
/**
 *
 * @param {树节点修改} params
 */
export function editModelTreeList(params) {
  return axios({
    url: "/api/v1/traincenter/modelManageNode",
    method: "put",
    data: params,
  });
}
/**
 *
 * @param {树节点删除} params
 */
export function deleteModelTreeList(params) {
  return axios({
    url: "/api/v1/traincenter/modelManageNode/deletebyId/" + params,
    method: "delete",
  });
}

/**
 * 推理应用目录树节点查询
 */
export function getAppTaskTreeList(params) {
  return axios({
    // http://10.8.2.244:8030
    url: "/api/v1/applicationcenter/inferenceTaskNode/getDataListNodeByParentNode",
    method: "get",
    params: params,
  });
}
/**
 * 推理应用目录树节点保存
 */
export function savaAppTaskTreeList(params) {
  return axios({
    url: "/api/v1/applicationcenter/inferenceTaskNode",
    method: "post",
    data: params,
  });
}
/**
 * 推理应用目录树节点编辑
 */
export function editAppTaskTreeList(params) {
  return axios({
    url: "/api/v1/applicationcenter/inferenceTaskNode",
    method: "put",
    data: params,
  });
}
/**
 * 推理应用目录树节点删除
 */
export function deleteAppTaskTreeList(params) {
  return axios({
    url: "/api/v1/applicationcenter/inferenceTaskNode/deletebyId/" + params,
    method: "delete",
  });
}
/**
 * 移动目标图片至新类别目录
 */
export function movePictureToNewCategory(params) {
  return axios({
    url: "/api/v1/datacenter/dataListFileDetail/movePictureToNewCategory",
    method: "post",
    data: params,
  });
}

export function moveCodeImageToNewCategory(params) {
  return axios({
    url: "/api/v1/datacenter/dataListFileDetail/moveSelectedCategoryToNewCategory",
    method: "post",
    data: params,
  });
}

export function getMaxCodeImageNumber(params) {
  return axios({
    url: "/api/v1/system/tbConfigInfo/getConfigInfoByKeyInfo",
    method: "get",
    params,
  });
}

/**
 * 获取系统配置
 * @param {*} params
 * @returns
 */
export function getSystemConfig(params) {
  return axios({
    url: "/api/v1/system/tbConfigInfo/getConfigInfoByKeyInfo",
    method: "get",
    params,
  });
}

/**
 * 上传图片至当前类别目录
 */
export function uploadPictureCurrentCategory(params) {
  return axios({
    url: "/api/v1/datacenter/dataListFileDetail/uploadPictureCurrentCategory",
    method: "post",
    data: params,
  });
}

/**
 * 删除当前目录下的目标图片
 */
export function removeMultiPicture(params) {
  return axios.delete(
    "/api/v1/datacenter/dataListFileDetail/removeMultiPicture/",
    { params }
  );
}

/**
 * 获取所有NAS源
 */
export function getAllNasList(params) {
  return axios.get("/api/v1/datacenter/dataListInfo/getTargetDataSourceList", {
    params,
  });
}

/**
 * 获取所有NAS源
 */
export function getSelectedNasDirectory(params) {
  return axios.get("/api/v1/datacenter/dataListInfo/getSelectedNasDirectory", {
    params,
  });
}
// 获取所有NAS源(与上面的一样的参数，只是后端搞不清原有接口的使用以及影响，要求在新建数据集配置目录时使用新的这个来查询)
export function getSelectedNasDirectoryNew(params) {
  return axios.get("/api/v1/datacenter/dataListInfo/getSubdirectoriesByDataSource", {
    params,
  });
}

/**
 * 验证数据源名称是否可用
 */
export function checkDataSourceNameAvl(params) {
  return axios.get("/api/v1/datasource/dataSourceInfo/checkDataSourceNameAvl", {
    params,
  });
}

/**
 * 验证数据集名称是否可用
 */
export function checkDataListNameAvl(params) {
  return axios.get("/api/v1/datacenter/dataListInfo/checkDataListNameAvl", {
    params,
  });
}

export const editLabel = {
  savePictureLabel: (params) => {
    return axios({
      url: "/api/v1/datacenter/dataListFileDetail/onLineSavePictureMarkInfo",
      method: "post",
      data: params,
    });
  },
  getDataListTag: (params) => {
    return axios({
      url: "/api/v1/datacenter/dataListInfo/dlMarkLabelList/" + params,
      method: "get",
    });
  },
  saveDataListTag: (params) => {
    return axios({
      url: "/api/v1/datacenter/dataListInfo/dlMarkLabelList",
      method: "post",
      data: params,
    });
  },
};

export function getTaskList(params) {
  return axios.get(
    "/api/v1/datasource/dataSourceInfo/checkRelyThisDataSource",
    { params }
  );
}

export const menuConfig = {
  addMenu: (params) => {
    return axios({
      url: "/api/v1/datacenter/dataListInfo/addDataListCategory",
      method: "post",
      params,
    });
  },
  deleteMenu: (params) => {
    return axios({
      url: "/api/v1/datacenter/dataListInfo/deleteDataListCategory",
      method: "post",
      params,
    });
  },
};
export const autoLabel = {
  addAutoLabel: (params) => {
    return axios({
      url: "/api/v1/datacenter/dataListAutoMarkTaskInfo/addAutoMarkTask",
      method: "post",
      data: params,
    });
  },
  stopAutoLabel: (params) => {
    return axios({
      url: "/api/v1/datacenter/dataListAutoMarkTaskInfo/autoMarkTaskStop",
      method: "post",
      params,
    });
  },
};

export function activeDownload(params) {
  return axios({
    url: "/api/v1/datacenter/dataListFileDetail/copyAndZipPicture",
    method: "get",
    params,
  });
}

export function getDataListByDlTag(params) {
  return axios({
    url: "/api/v1/datacenter/dataListInfo/getDataListNameByDlTagType",
    method: "get",
    params,
  });
}
// 启动自动标注
export function autoAnnotation(params) {
  return axios({
    url: "/api/v1/datacenter/autoAnnotator/autoAnnotateWithModel",
    method: "post",
    data: params,
  });
}
// 停止自动标注
export function stopAutoAnnotation(taskId) {
  return axios({
    url: `/api/v1/datacenter/autoAnnotator/stopTaskById/${taskId}`,
    method: "post",
  });
}
//下载调整fiamly:-2
// export function downloadTargetCategoryPicture(params) {
//   return axios({
//     url: `/api/v1/datacenter/dataListFileDetail/downloadTargetCategoryPicture`,
//     method: 'get',
//     family: -2,
//     // responseType: 'blob'
//     params
//   })
// }
