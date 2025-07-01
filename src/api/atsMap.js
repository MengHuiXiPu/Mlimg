/*
 * @Author: lichao.sun 
 * @Date: 2024-07-25 13:38:13 
 * @Last Modified by: lichao.sun
 * @Last Modified time: 2025-03-17 14:13:14
 * @description: ats map 页面
 */
import { axios } from '@/utils/request'
// 获取任务列表
export function getTaskList(params) {
  return axios({
    url: `/api/v1/data-processing/ast-info`,
    method: 'get',
    params
  })
}
// 获取任务详情
export function getTaskDeteil(id, params) {
  return axios({
    url: `/api/v1/data-processing/ast-info/${id}`,
    method: 'get',
    params
  })
}
// 新增/保存任务
export function saveTask(data) {
  return axios({
    url: `/api/v1/data-processing/ast-info/save`,
    method: 'post',
    data
  })
}
// 删除任务
export function deleteTask(id) {
  return axios({
    url: `/api/v1/data-processing/ast-info/${id}`,
    method: 'delete',
  })
}
// 上传 csv/xlsx 文件
export function uploadCsv(id, data, onUploadProgress) {
  return axios({
    url: `/api/v1/data-processing/ast-info/${id}/csv-upload`,
    method: 'post',
    data,
    onUploadProgress
  })
}
// csv 编辑后的保存
export function saveCsv(id, data) {
  return axios({
    url: `/api/v1/data-processing/ast-info/${id}/csv-edit`,
    method: 'post',
    data
  })
}
// 下载 csv 示例文件
// export function downloadCsv(params) {
//   return axios({
//     url: `/api/v1/data-processing/ast-info/download-example-csv`,
//     method: 'get',
//     params,
//     // responseType: 'blob'
//   })
// }
// 获取待调优图片列表
export function getPicList(params) {
  return axios({
    url: `/api/v1/data-processing/templateMakingPic/getList`,
    method: 'get',
    params
  })
}
// 图片上传
export function uploadPic(data, onUploadProgress) {
  return axios({
    url: `/api/v1/data-processing/templateMakingPic/importFiles`,
    method: 'post',
    data,
    onUploadProgress
  })
}
// 根据图片 id获取原图
export function getSourceImgById(id) {
  return axios({
    url: `/api/v1/data-processing/templateMakingPic/getSourcePictureById/${id}`,
    method: 'get',
    family: -1
  })
}
// 根据图片路径回去原图
export function getSourceImgByPath(path) {
  return axios({
    url: `/api/v1/data-processing/templateMakingPic/getPictureByPath`,
    method: 'get',
    params: { path },
    family: -1
  })
}
// 查询调优算法参数配置
export function getAlgorithmConfig() {
  return axios({
    url: `/api/v1/data-processing/ast-info/configs`,
    method: 'get',
  })
}
// 保存调优数据
export function saveTuningData(data) {
  return axios({
    url: `/api/v1/data-processing/frontend-config/save`,
    method: 'post',
    data
  })
}
// 生成调优图
export function generateTuning(picId) {
  return axios({
    url: `/api/v1/data-processing/ast-step-result/${picId}/generate-improved`,
    method: 'post',
    // data
  })
}
// 获取调优图结果列表
export function getTuningImgList(picId) {
  return axios({
    url: `/api/v1/data-processing/ast-step-result/${picId}/improved-pics`,
    method: 'get',
  })
}
// 删除图片
export function deletePicture(ids) {
  return axios({
    url: `/api/v1/data-processing/templateMakingPic/deleteByIds`,
    method: 'delete',
    data: ids
  })
}