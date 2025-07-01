/*
 * @Author: lichao.sun 
 * @Date: 2024-07-25 13:38:13 
 * @Last Modified by: lichao.sun
 * @Last Modified time: 2025-03-19 16:52:06
 * @description: 模板制作-OCR字符库页面
 */
import { axios } from '@/utils/request'
// 获取模板列表
export function getTempList(params) {
  return axios({
    url: `/api/v1/data-processing//ocr-info`,
    method: 'get',
    params
  })
}
// 获取模板详情
export function getTempDeteil(id, params) {
  return axios({
    url: `/api/v1/data-processing//ocr-info/${id}`,
    method: 'get',
    params
  })
}
// 新增/保存模板
export function saveTemp(data) {
  return axios({
    url: `/api/v1/data-processing//ocr-info/save`,
    method: 'post',
    data
  })
}
// 删除模板
export function deleteTemp(id) {
  return axios({
    url: `/api/v1/data-processing//ocr-info/${id}`,
    method: 'delete',
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
// 根据图片路径获取原图
export function getSourceImgByPath(path) {
  return axios({
    url: `/api/v1/data-processing/templateMakingPic/getPictureByPath`,
    method: 'get',
    params: { path },
    family: -1
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
// 上传字符图
export function uploadCharPic(data, onUploadProgress) {
  return axios({
    url: `/api/v1/data-processing/ocr-step-result/upload-word-pic`,
    method: 'post',
    data,
    onUploadProgress
  })
}
// 删除字符图
export function deleteCharPic(id) {
  return axios({
    url: `/api/v1/data-processing/ocr-step-result/word-pic/${id}`,
    method: 'delete',
  })
}
// 获取制作步骤结果列表，包括 stepEnum: 获取字符图列表32  获取模板图列表 33
export function getStepList(params) {
  return axios({
    url: `/api/v1/data-processing/ocr-step-result/step-result-list`,
    method: 'get',
    params
  })
}
// 合成ocr模板
export function generateOcrTemplate(data) {
  return axios({
    url: `/api/v1/data-processing/ocr-info/generate-orc-template`,
    method: 'post',
    data
  })
}
// 保存ocr模板
export function saveOcrTemplate(data) {
  return axios({
    url: `/api/v1/data-processing/ocr-step-result/save-step-result`,
    method: 'post',
    data
  })
}
// 下载模板 zip 包
export function downloadOcrTemplate(templateMakingId) {
  return axios({
    url: `/api/v1/data-processing/ocr-info/download-ocr-template?id=${templateMakingId}`,
    method: 'get',
    responseType: 'blob'
  })
}