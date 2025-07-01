import { axios } from '@/utils/request'

const system = {
  monitor: {
    getHostInfo: () => {
      return axios({
        url: '/api/v1/system/monitorInfo/getHostInfo',
        method: 'post'
      })
    },
    getHostInfoDetail: (params) => {
      return axios({
        url: '/api/v1/system/monitorInfo/getHostInfoDetails',
        method: 'post',
        data: params
      })
    },
    getTaskList: (params) => {
      return axios({
        url: '/api/v1/system/monitorInfo/getTaskInfo',
        method: 'post',
        data: params
      })
    },
    getSystemInfo: (params) => {
      return axios({
        url: '/api/v1/system/dataClusterInfo/queryDataClusterSimpleInfoByIp',
        method: 'get',
        params
      })
    },
    getTargetData: (params) => {
      return axios({
        url: '/api/v1/system/monitorInfo/getMonitorIndexInfo',
        method: 'post',
        data: params
      })
    },
    changeRole: (params) => {
      return axios({
        url: '/api/v1/system/dataClusterInfo/exchangeHostRole',
        method: 'post',
        params
      })
    }
  },
  alerm: {
    getAlermData: () => {
      return axios({
        url: '/api/v1/system/monitorSendWarnConf/list',
        method: 'get'
      })
    },
    saveAlermData: (params) => {
      return axios({
        url: '/api/v1/system/monitorSendWarnConf/editMonitorSendWarnConf',
        method: 'post',
        data: params
      })
    }
  },
  user: {
    getUserList: (params) => {
      return axios({
        url: '/api/permission/secStaff/list',
        method: 'get',
        params
      })
    },
    getOrginList: (params) => {
      return axios({
        url: '/api/permission/secOrg/list',
        method: 'get',
        params
      })
    }
  },
  systemConfig: {
    getDataList: (params) => {
      return axios({
        method: 'get',
        url: '/api/v1/system/tbConfigInfo/list',
        params
      })
    },
    editConfig: (params) => {
      return axios({
        method: 'put',
        url: '/api/v1/system/tbConfigInfo',
        data: params
      })
    },
  },
  nodeConfig: {
    getDataList: (params) => {
      return axios({
        method: 'get',
        url: '/api/v1/system/tbDataNodePermissionConfigInfo/list',
        params
      })
    },
    editNodeConfig: (params, method) => {
      return axios({
        method,
        url: '/api/v1/system/tbDataNodePermissionConfigInfo',
        data: params
      })
    },
    deleteNodeConfig: (params) => {
      return axios({
        method: 'delete',
        url: `/api/v1/system/tbDataNodePermissionConfigInfo/${params}`
      })
    },
    checkNodeExist: (params) => {
      return axios({
        method: 'get',
        url: '/api/v1/system/tbDataNodePermissionConfigInfo/checkNodeExist',
        params
      })
    }
  }
}

export default system