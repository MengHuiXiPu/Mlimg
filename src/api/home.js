import { axios } from '@/utils/request'

// 整体概览
export function getOverview () {
    return axios({
      url: `/api/v1/datacenter/homepage/loadOriginData`,
      method: 'get',
    })
}

// 整体概览
export function getK8sQuota (params) {
    return axios({
      url: `/api/v1/datacenter/homepage/loadK8sQuota`,
      method: 'get',
      params
    })
}

// 获取CPU/GPU默认配置信息
export function getDefaultConfig () {
  return axios({
    url: `/api/v1/system/tbConfigInfo/getCpuAndGpuDefaultConfInfo`,
    method: 'get',
  })
}

export function downFileConfig (url) {
  return axios({
    method: 'head',
    url,
    responseType: 'blob'
  })
}

export function downFile (url, onDownloadProgress) {
  return axios({
    method: 'get',
    url,
    timeout: 0,
    responseType: 'blob',
    onDownloadProgress: (e) => onDownloadProgress(e)
  })
}