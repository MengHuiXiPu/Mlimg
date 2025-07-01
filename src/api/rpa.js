import { axios } from '@/utils/request'

export default {
  // 上传图片
  rpaLabelingImageImport: function (data) {
    return axios({
      url: '/api/v1/pipelinecenter/rpaLabelingImage/create',
      method: 'post',
      data
    })
  },
  // 获取图片列表
  getListByProjectId: function (projectId) {
    return axios({
      url: `/api/v1/pipelinecenter/rpaLabelingImage/getListByProjectId/${projectId}`,
      method: 'GET'
    })
  },
  getImage: function (id) {
    return axios({
      url: `/api/v1/pipelinecenter/rpaLabelingImage/download/${id}`,
      method: 'GET'
    })
  },
  
  rpaProjectCreate: function (data) {
    return axios({
      url: '/api/v1/pipelinecenter/rpaLabelingProject/create',
      method: 'post',
      data,
    })
  },
  rpaProjectUpdate: function (id, data) {
    return axios({
      url: `/api/v1/pipelinecenter/rpaLabelingProject/update/${id}`,
      method: 'PUT',
      data,
    })
  },
  getRpaList: function (params) {
    return axios({
      url: `/api/v1/pipelinecenter/rpaLabelingProject/getList`,
      method: 'GET',
      params
    })
  },
  deleteRpaItem: function (id) {
    return axios({
      url: `/api/v1/pipelinecenter/rpaLabelingProject/delete/${id}`,
      method: 'DELETE'
    })
  },
  opGroupInstanceUpdate: function (projectId, operatorId, data) {
    return axios({
      url: `/api/v1/pipelinecenter/rpaLabelingProject/${projectId}/updateOpGroupInstance/${operatorId}`,
      method: 'PUT',
      data,
    })
  },
  // 创建算子组实例
  createOpGroupInstance: function (projectId, data) {
    return axios({
      url: `/api/v1/pipelinecenter/rpaLabelingProject/${projectId}/createOpGroupInstance`,
      method: 'post',
      data,
    })
  },
  saveScreenshot: function (projectId, data) {
    return axios({
      url: `/api/v1/pipelinecenter/rpaLabelingProject/${projectId}/saveScreenshot`,
      method: 'post',
      data,
    })
  },
  downloadScreenshot: function (projectId, params) {
    return axios({
      url: `/api/v1/pipelinecenter/rpaLabelingProject/${projectId}/downloadScreenshot`,
      method: 'GET',
      params,
    })
  },
  deleteRpaPic: function (id) {
    return axios({
      url: `/api/v1/pipelinecenter/rpaLabelingImage/delete/${id}`,
      method: 'DELETE'
    })
  }
}