/**
 * @description 图片复判相关接口
 */
import { axios } from '@/utils/request';

// 获取规则列表
export const getRuleList = (params) => {
  return axios({
    url: '/api/v1/rejudge/rule-template',
    method: 'get',
    params
  })
}
// 获取复盘应用详情
export const queryAppDetail = (id) => {
  return axios({
    url: `/api/v1/rejudge/rejudge/${id}`,
    method: 'get',
  })
}
// 整体保存复判应用（需要所有的必填信息，用于完整的保存）
export const saveAppData = (params) => {
  return axios({
    url: '/api/v1/rejudge/rejudge/save',
    method: 'post',
    data: params
  })
}
// 更新复判应用data，按照key更新
export const updateAppData = (id, params) => {
  return axios({
    url: `/api/v1/rejudge/rejudge/save-task/${id}`,
    method: 'post',
    data: params
  })
}
// 删除复判应用
export const deleteApp = (id) => {
  return axios({
    url: `/api/v1/rejudge/rejudge/${id}`,
    method: 'delete',
  })
}
// 获取内置配置
export const getBuiltInConfig = (params) => {
  return axios({
    url: '/api/v1/rejudge/rejudge/builtin-config',
    method: 'get',
    params
  })
}
// 获取业务日志
export const getBusinessLog = (params) => {
  return axios({
    url: '/api/v1/rejudge/rejudge/getRejudgeLog',
    method: 'get',
    params
  })
}
// 获取pod错误日志
export const getPodLog = (params) => {
  return axios({
    url: '/api/v1/rejudge/rejudgeErrorLog/getRejudgeErrorLog',
    method: 'get',
    params
  })
}
