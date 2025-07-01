/**
 * 网盘中心相关接口
 */

import { axios } from '@/utils/request'

export default {
  //上传文件
  uploadOperator: function (data, headers) {
    return axios({
      url: '/api/v1/pipelinecenter/personalCloudDisk/cloudFileUpload',
      method: 'post',
      data,
      headers: headers
    })
  },
  getOperatorInfoList: function (params) {
    return axios({
      url: '/api/v1/pipelinecenter/operatorInfo/getOperatorInfoList',
      method: 'get',
      params
    })
  },
  // 获取共享文件
  getPipelineList(params) {
    return axios({
      url: '/api/v1/pipelinecenter/personalCloudDisk/getPublicFilesAndDirs',
      method: 'get',
      params
    })
  },
  // 删除算子
  deleteOperatorInfo: function (params) {
    return axios({
      url: '/api/v1/pipelinecenter/operatorInfo/delete',
      method: 'delete',
      params,
    })
  },
  batchDeleteOperator:function (params) {
    return axios({
      url: '/api/v1/pipelinecenter/personalCloudDisk/deleteFileOrFolderBatch',
      method: 'delete',
      params,
    })
  },
  // 删除算子
  deletePipeline: function (params) {
    return axios({
      url: '/api/v1/pipelinecenter/personalCloudDisk/deleteFileOrFolder',
      method: 'delete',
      params,
    })
  },
  batchDeletePipeline:function (params) {
    return axios({
      url: '/api/v1/pipelinecenter/personalCloudDisk/deleteFileOrFolderBatch',
      method: 'delete',
      params,
    })
  },

  // 搜索🔍
  searchOperator: function (params) {
    return axios({
      url: '/api/v1/pipelinecenter/personalCloudDisk/searchFileOrFolder',
      method: 'get',
      params,

    })
  },
  // 搜索🔍
  searchPipeline: function (params) {
    return axios({
      url: '/api/v1/pipelinecenter/personalCloudDisk/searchFileOrFolder',
      method: 'get',
      params,

    })
  },
  /**
   * @description: 将模型绑定到算子，用于算子组
   * @param {string} id 算子组id
   * @param {*} data 
   * @returns 
   */
  bindOperatorModelOG: function (id, data = {}) {
    return axios({
      url: `/api/v1/pipelinecenter/operatorGroupTemplate/${id}/selectModel`,
      method: 'post',
      data,
    })
  },
  /**
   * @description: 将模型绑定到算子，用于方案
   * @param {string} id 方案id
   * @param {object} data 
   * @returns 
   */
  bindOperatorModelPipeline(id,data = {}) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineTemplateInfo/${id}/selectModel`,
      method: 'post',
      data,
    })
  }

}
