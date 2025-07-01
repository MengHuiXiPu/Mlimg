// 体验中心API
import { axios } from '@/utils/request'

const experience = {
  manage: {
    list: (params) => {
      return axios({
        url: '/api/v1/showcenter/tbAiShowTaskInfo/list',
        method: 'get',
        params
      })
    },
    getTaskInfo: (params, method) => {
      return axios({
        url: `/api/v1/showcenter/tbAiShowTaskInfo/${params}`,
        method
      })
    },
    editTask: (data) => {
      return axios({
        url: '/api/v1/showcenter/tbAiShowTaskInfo',
        method: 'put',
        data
      })
    },
    actionAlgRequest: (data) => {
      return axios({
        url: '/api/v1/showcenter/tbAiShowTaskInfo/createAIShowTaskPod',
        method: 'post',
        data
      })
    }
  },
  getImage: (id) => {
    return axios({
      url: `/api/v1/showcenter/tbAiShowTaskImgInfo/loadPicture/${id}`,
      method: 'get',
      family: -1,
      // responseType: 'blob'
    })
  },
  manageImage: {
    list: (params) => {
      return axios({
        url: '/api/v1/showcenter/tbAiShowTaskImgInfo/list',
        method: 'get',
        params
      })
    },
    upload: (data) => {
      return axios({
        url: '/api/v1/showcenter/tbAiShowTaskImgInfo/uploadExampleImg',
        method: 'post',
        data
      })
    },
    deleteImage: (params) => {
      return axios({
        url: '/api/v1/showcenter/tbAiShowTaskImgInfo/deleteImg',
        method: 'delete',
        params
      })
    },
    setTopImage: (params) => {
      return axios({
        url: '/api/v1/showcenter/tbAiShowTaskImgInfo/setTopImg',
        method: 'post',
        params
      })
    }
  },
  experienceInfo: {
    upload: (data, params) => {
      return axios({
        url: '/api/v1/showcenter/tbAiShowTaskImgInfo/uploadImgCal',
        method: 'post',
        params,
        data
      })
    },
    selectImage: (params) => {
      return axios({
        url: '/api/v1/showcenter/tbAiShowTaskImgInfo/selectImgCal',
        method: 'post',
        params
      })
    },
    getTopImage: (params) => {
      return axios({
        url: `/api/v1/showcenter/tbAiShowTaskImgInfo/getTopImgId/${params}`,
        method: 'get',
        // responseType: 'blob'
        family: -1,
      })
    }
  }
}

export default experience