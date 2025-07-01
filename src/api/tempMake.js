/*
 * @Author: lichao.sun 
 * @Date: 2024-07-25 13:38:13 
 * @Last Modified by: lichao.sun
 * @Last Modified time: 2025-03-11 16:40:21
 * @description: 模板制作 api接口（后修改页面为周期图拼接）
 */
import { axios } from '@/utils/request'
const controller = 'data-processing'
// 获取模板列表
export function getTempList(params) {
  return axios({
    url: `/api/v1/${controller}/template-making-info`,
    method: 'get',
    params
  })
}
// 获取模板制作详情
export function getTempDeteil(id, params) {
  return axios({
    url: `/api/v1/${controller}/template-making-info/${id}`,
    method: 'get',
    params
  })
}
// 新增/保存模板
export function saveTemp(data) {
  return axios({
    url: `/api/v1/${controller}/template-making-info/save`,
    method: 'post',
    data
  })
}
// 保存编辑器信息
export function saveEditorData(data) {
  return axios({
    url: `/api/v1/${controller}/frontend-config/save`,
    method: 'post',
    data
  })
}
// 删除模板
export function deleteTemp(id) {
  return axios({
    url: `/api/v1/${controller}/template-making-info/${id}`,
    method: 'delete',
  })
}
// 获取图片列表
export function getPicList(params) {
  return axios({
    url: `/api/v1/${controller}/templateMakingPic/getList`,
    method: 'get',
    params
  })
}
// 获取缩略图
export function getThumbnailList(id) {
  return axios({
    url: `/api/v1/${controller}/templateMakingPic/getThumbnailPictureById/${id}`,
    method: 'get',
    family: -1
    // params
  })
}
// 获取原图
export function getSourcePic(id) {
  return axios({
    url: `/api/v1/${controller}/templateMakingPic/getSourcePictureById/${id}`,
    method: 'get',
    family: -1
  })
}
// 根据 path 获取图片
export function getPicByPath(path) {
  return axios({
    url: `/api/v1/${controller}/templateMakingPic/getPictureByPath`,
    method: 'get',
    params: { path },
    family: -1
  })
}
// 图片上传
export function uploadPic(data, onUploadProgress) {
  return axios({
    url: `/api/v1/${controller}/templateMakingPic/importFiles`,
    method: 'post',
    data,
    onUploadProgress
  })
}
// 图片上传(存储裁剪后的图片和合成图)
export function uploadTempPic(data) {
  return axios({
    url: `/api/v1/${controller}/templateMakingPic/importFileList`,
    method: 'post',
    data,
  })
}

// 删除图片
export function deletePicture(ids) {
  return axios({
    url: `/api/v1/${controller}/templateMakingPic/deleteByIds`,
    method: 'delete',
    data: ids
  })
}
// 根据id获取图片(原图)
export function getPicById(id) {
  return axios({
    url: `/api/v1/${controller}/templateMakingPic/getSourcePictureById/${id}`,
    method: 'get',
  })
}
// 下载 dat 文件
export function downloadDatFile(templateMakingId) {
  return axios({
    url: `/api/v1/${controller}/template-making-info/${templateMakingId}/download-dat`,
    method: 'post',
    responseType: 'blob'
  })
}
// 生成 mask 图
export function generateMask(data) {
  return axios({
    url: `/api/v1/${controller}/templateMakingPic/createMarkPics`,
    method: 'post',
    data
  })
}
// 生成 dat 文件
export function generateDat(templateMakingId) {
  return axios({
    url: `/api/v1/${controller}/template-making-info/${templateMakingId}/generate-dat`,
    method: 'post',
    // data
  })
}