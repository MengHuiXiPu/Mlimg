/*
 * @Author: lichao.sun 
 * @Date: 2024-04-07 13:38:13 
 * @Last Modified by: lichao.sun
 * @Last Modified time: 2024-04-12 10:44:11
 * @description: 端边云协同方案 api接口
 */
import { axios } from '@/utils/request'
/**
 * 下发文件列表查询
 * @param {object} params 
 * @returns 
 */
export function getFilesList (params) {
  return axios({
    url: '/api/v1/applicationcenter/transferFileInfo/getList',
    method: 'get',
    params
  })
}
// 上传下发文件
export function importFile (data) {
  return axios({
    url: '/api/v1/applicationcenter/transferFileInfo/import',
    method: 'post',
    headers:{
      "Content-Type": "multipart/form-data",
    },
    data
  })
}
// 上传标注文件(待标注的图片)
export function importAnnotationFile (data) {
  return axios({
    url: '/api/v1/applicationcenter/transferFileInfo/uploadImage',
    method: 'post',
    headers:{
      "Content-Type": "multipart/form-data",
    },
    data
  })
}
// 更新下发文件信息
export function updateTransferFile (params) {
  return axios({
    url: `/api/v1/applicationcenter/transferFileInfo/update`,
    method: 'put',
    data: params
  })
}
// 更新文件重新打包下发
export function updatePackageFileRecord (params) {
  return axios({
    url: `/api/v1/applicationcenter/transferRecord/updatePackageFileRecord`,
    method: 'post',
    data: params
  })
}
// 删除下发文件
export function removeFileById (id) {
  return axios({
    url: `/api/v1/applicationcenter/transferFileInfo/delete/${id}`,
    method: 'delete'
  })
}
// 下载下发文件
export function downloadFileById (id) {
  return axios({
    url: `/api/v1/applicationcenter/transferFileInfo/download/${id}`,
    method: 'get',
    responseType: 'blob'
  })
}
// 设备列表查询
export function getDeviceList (params) {
  return axios({
    url: '/api/v1/applicationcenter/deviceconfig/getlist',
    method: 'get',
    params
  })
}
// 保存标注文件的标注数据
export function saveAnnotationData (id, data) {
  return axios({
    url: `/api/v1/applicationcenter/transferFileInfo/updateAnnotation/${id}`,
    method: 'post',
    data
  })
}
// 下载标注图片
export function downloadAnnotationImg (id) {
  return axios({
    url: `/api/v1/pipelinecenter/transferFileInfo/downloadImage/${id}`,
    method: 'get'
  })
}
// 新建文件类型数据下发记录
export function createFileTransferRecord (data) {
  return axios({
    url: `/api/v1/applicationcenter/transferRecord/createFileRecord`,
    method: 'post',
    data
  })
}
// 查询数据下发记录列表
export function getTransferRecordList (params) {
  return axios({
    url: `/api/v1/applicationcenter/transferRecord/getList`,
    method: 'get',
    params
  })
}

// 新建命令类型数据下发记录
export function createCommandTransferRecord (data) {
  return axios({
    url: `/api/v1/applicationcenter/transferRecord/createCommandRecord`,
    method: 'post',
    data
  })
}
// 更新数据类型下发记录
export function updateFileTransferRecord (id, data) {
  return axios({
    url: `/api/v1/applicationcenter/transferRecord/updateFileRecord/${id}`,
    method: 'put',
    data
  })
}
// 更新设备信息
export function updateDeviceInfo (data) {
  return axios({
    url: '/api/v1/applicationcenter/deviceconfig/update',
    method: 'post',
    data
  })
}

// 删除数据下发记录
export function removeRecorById (id) {
  return axios({
    url: `/api/v1/applicationcenter/transferRecord/delete/${id}`,
    method: 'delete'
  })
}
// 标注图片下载
export function getTransferImage (id) {
  return axios({
    url: `/api/v1/applicationcenter/transferFileInfo/downloadImage/${id}`,
    // url: '/api/v1/pipelinecenter/operatorGroupTemplate/downloadImage?id=69&imgPath=templateId69%2Fdebug%2Fupload%2F1709275740534_2.jpg',
    method: 'get',
    family: -1,
    // responseType: 'blob'
  })
}
// 获取单个下发文件详情
export function getTransferFileDetail (id) {
  return axios({
    url: `/api/v1/applicationcenter/transferFileInfo/${id}`,
    method: 'get'
  })
}
