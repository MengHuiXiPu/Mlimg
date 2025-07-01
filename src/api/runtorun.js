/*
 * @Author: lichao.sun 
 * @Date: 2024-07-25 13:38:13 
 * @Last Modified by: lichao.sun
 * @Last Modified time: 2024-04-12 10:44:11
 * @description: run2run api接口
 */
import { axios } from '@/utils/request'

export function getAppList (params) {
  return axios({
    url: '/api/v1/runtorun/algorithm',
    method: 'get',
    params
  })
}
// 新建算法应用
export function createAlgorithmApp (data) {
  return axios({
    url: '/api/v1/runtorun/algorithm',
    method: 'post',
    // headers:{
    //   "Content-Type": "multipart/form-data",
    // },
    data
  })
}
// 更新算法应用
export function updateAlgorithmApp (id, data) {
  return axios({
    url: `/api/v1/runtorun/algorithm/${id}`,
    method: 'put',
    data
  })
}
// 删除算法应用
export function deleteAlgorithmApp (id) {
  return axios({
    url: `/api/v1/runtorun/algorithm/${id}`,
    method: 'DELETE',
  })
}
// 获取配置列表,同时支持根据id查询配置详情
export function getConfigList (params) {
  return axios({
    url: '/api/v1/runtorun/appconfig/getList',
    method: 'get',
    params
  })
}
// 更新/新增配置记录
export function saveOrUpdateConfig (data) {
  return axios({
    url: '/api/v1/runtorun/appconfig/saveOrUpdate',
    method: 'post',
    data
  })
}
/**
 * 删除配置记录
 * @param {*} ids : 逗号分隔的string
 * @returns 
 */
export function deleteConfig (ids) {
  return axios({
    url: `/api/v1/runtorun/appconfig/deleteById/${ids}`,
    method: 'DELETE'
  })
}
// 删除本地上传的图片
export function deletePictureById (ids) {
  return axios({
    url: `/api/v1/runtorun/configfile/deleteById/${ids}`,
    method: 'DELETE'
  })
}
// /api/v1/runtorun/configfile/importFiles
// 配置信息中导入图片（zip包批量导入目标图片列表）
export function uploadPicZipToConfig (data) {
  return axios({
    url: `/api/v1/runtorun/configfile/importFiles`,
    method: 'post',
    data
  })
}
// 查询配置下的图片列表  /api/v1/runtorun/configfile/getList
export function getConfigPicList (params) {
  return axios({
    url: '/api/v1/runtorun/configfile/getList',
    method: 'get',
    params
  })
}
// 根据id加载上传的图片(缩略图)
export function getThumbnailByid (id) {
  return axios({
    url: `/api/v1/runtorun/configfile/getThumbnailPictureById/${id}`,
    method: 'get',
    family: -1
  })
}
// 根据id加载上传的图片(原图)
export function getSourcePicById (id) {
  return axios({
    url: `/api/v1/runtorun/configfile/getSourcePictureById/${id}`,
    method: 'get',
    family: -1
  })
}
// 单张上传，导入配置图片
export function uploadPicToConfigInput (data) {
  return axios({
    url: `/api/v1/runtorun/configfile/uploadImage`,
    method: 'post',
    data
  })
}

// 根据上传单张图片接口返回的path，来加载图片
export function getSourcePicByPath (path) {
  return axios({
    url: `/api/v1/runtorun/configfile/getPictureByPath`,
    method: 'get',
    params: {path},
    family: -1
  })
}

// 启动算法调试任务 (多张)
export function runDebugTask (data) {
  return axios({
    url: `/api/v1/runtorun/debug/start`,
    method: 'post',
    data
  })
}
// 对单张图片启动调试
export function runDebugTaskSingle (data) {
  return axios({
    // url: `/api/v1/runtorun/debug/startSinglePicture?configId=${data.configId}&dataType=0&dlId=${data.dlid}&pictureId=${data.pictureId}`,
    url: `/api/v1/runtorun/debug/startSinglePicture`,
    method: 'post',
    data
  })
}
// 查询单张图的调试结果
export function getDebugResByPicId (params) {
  return axios({
    url: `/api/v1/runtorun/debug/result`,
    method: 'get',
    params
  })
}
// 取消/中断调试任务
export function stopDebugTask (taskId, data) {
  return axios({
    url: `/api/v1/runtorun/debug/cancel/${taskId}`,
    method: 'post',
    data
  })
}
// 查询调试任务状态进度, 需要轮训
export function getDebugTaskStatus (taskId) {
  return axios({
    url: `/api/v1/runtorun/debug/status`,
    method: 'get',
    params: { taskId }
  })
}
// 查询当前用户,在某条配置记录下，是否存在调试任务,返回任务id，可再根据该id去查询任务具体进度详情展示
export function getDebugTaskByConfig (configId) {
  return axios({
    url: `/api/v1/runtorun/debug/tasks`,
    method: 'get',
    params: { configId: configId }
  })
}

// 配置发布
export function publishApp (data) {
  return axios({
    url: `/api/v1/runtorun/appconfig/publish`,
    method: 'post',
    data
  })
}
// 判断某个配置最新一次改动是否调试成功（发布前查询，成功才可以发布）
export function getDebugIsSuccess (configId) {
  return axios({
    url: `/api/v1/runtorun/debug/getDebugIsSuccess`,
    method: 'get',
    params: { configId: configId }
  })
}
// 清除单张图片/配置记录关联的图片列表的推理结果
export function deletePicsDebugResult (data) {
  return axios({
    url: `/api/v1/runtorun/debug/deleteDebugResult`,
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data
  })
}

