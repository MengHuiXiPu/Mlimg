/**
 * 算子相关接口
 */
import { axios } from '@/utils/request'

export default {
  // 获取算子类型列表
  getOperatorTypeList: function (params) {
    return axios({
      url: '/api/v1/pipelinecenter/operatorTypeNode/getOperatorTypeNodeByParentNode',
      method: 'GET',
      params
    })
  },
  // 新增算子类型
  createOperatorType: function (data) {
    return axios({
      url: '/api/v1/pipelinecenter/operatorTypeNode/add',
      method: 'post',
      data
    })
  },
  // 算子导入
  operatorImport: function (data, headers) {
    return axios({
      url: '/api/v1/pipelinecenter/operatorInfo/import',
      method: 'post',
      data,
      // headers: headers
    })
  },
  // 算子批量导入
  operatorBatchImport: function (data) {
    return axios({
      url: '/api/v1/pipelinecenter/operatorInfo/importOperatorList',
      method: 'post',
      data,
      headers: {
        "Content-Type": "multipart/form-data",
      }
    })
  },
  // 算子删除
  deleteOperator: function (id) {
    return axios({
      url: `/api/v1/pipelinecenter/operatorInfo/delete/${id}`,
      method: 'DELETE'
    })
  },
  // 设置算子共享
  setPipelineSharing(data) {
    return axios({
      url: '/api/v1/pipelinecenter/operatorInfo/updateToShared',
      method: 'post',
      data
    })
  },
  // 设置算子组共享
  setPipelineGroupSharing(data) {
    return axios({
      url: '/api/v1/pipelinecenter/operatorGroupTemplate/updateToShared',
      method: 'post',
      data
    })
  },
  // 算子更新
  updateOperator: function (data, headers) {
    return axios({
      url: '/api/v1/pipelinecenter/operatorInfo/update',
      method: 'PUT',
      data,
      headers: headers
    })
  },
  // 算子列表获取
  getOperatorList: function (params) {
    return axios({
      url: '/api/v1/pipelinecenter/operatorInfo/getList',
      method: 'GET',
      params,
    })
  },

  // 发布算子
  publishOperator: function (id, data) {
    return axios({
      url: `/api/v1/pipelinecenter/operatorInfo/publish/${id}`,
      method: 'post',
      data
    })
  },

  createPipelineTemplate: function (data) {
    return axios({
      url: '/api/v1/pipelinecenter/pipelineTemplateInfo/create',
      method: 'post',
      data,
    })
  },
  copyPipelineTemplate: function (data) {
    return axios({
      url: '/api/v1/pipelinecenter/pipelineTemplateInfo/copy',
      method: 'post',
      data,
    })
  },

  getPipelineTemplateList: function (params) {
    return axios({
      url: '/api/v1/pipelinecenter/pipelineTemplateInfo/getList',
      method: 'GET',
      params,
    })
  },
  getPipelineTemplateInfoById: function (id) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineTemplateInfo/${id}`,
      method: 'GET'
    })
  },
  updatePipelineTemplateById: function (id, data) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineTemplateInfo/update/${id}`,
      method: 'PUT',
      data
    })
  },
  deletePipelineTemplate: function (id) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineTemplateInfo/delete/${id}`,
      method: 'DELETE'
    })
  },
  uploadImage: function (data, headers) {
    return axios({
      url: '/api/v1/pipelinecenter/pipelineTemplateInfo/uploadImage',
      method: 'post',
      data,
      // headers: headers
    })
  },
  // 导出方案管理
  getTemplate: function (id) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineTemplateInfo/packageDownload/${id}`,
      method: 'GET',
      responseType: 'blob',
    })
  },
  // 导入方案
  uploadTemplate: function (data) {
    return axios({
      url: '/api/v1/pipelinecenter/pipelineTemplateInfo/importTemplate',
      method: 'POST',
      data,
      headers: {
        "Content-Type": "multipart/form-data",
      }
    })
  },
  getImage: function (params) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineTemplateInfo/downloadImage`,
      method: 'GET',
      params
    })
  },
  getInstanceImage: function (params) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineInstance/downloadImage`,
      method: 'GET',
      params
    })
  },
  pipelineDebug: function (id, data) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineTemplateInfo/debug/${id}`,
      method: 'post',
      data,
    })
  },
  publishPipelineTemplate: function (id, data) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineTemplateInfo/publish/${id}`,
      method: 'post',
      data,
    })
  },
  publishPipelineTemplateToAlreadyInfesvr: function (id, infesvrId, data) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineTemplateInfo/publish/${id}/to/${infesvrId}`,
      method: 'post',
      data,
    })
  },
  saveFormJson: function (data) {
    return axios({
      url: `/api/v1/pipelinecenter/appTableInfo/add`,
      method: 'post',
      data,
    })
  },
  getFormJson: function (params) {
    return axios({
      url: `/api/v1/pipelinecenter/appTableInfo/getAppTableInfoByPipelineId`,
      method: 'GET',
      params
    })
  },
  getResultList: function (id, params) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineInstance/${id}/resultList`,
      method: 'GET',
      params
    })
  },
  // 新建算子组模板
  createOperatorGroupTemplate: function (data) {
    return axios({
      url: `/api/v1/pipelinecenter/operatorGroupTemplate/create`,
      method: 'POST',
      data,
    })
  },
  // 算子组模板列表查询
  getOperatorGroupTemplateList: function (params) {
    return axios({
      url: `/api/v1/pipelinecenter/operatorGroupTemplate/getList`,
      method: 'GET',
      params
    })
  },
  // 根据id查询算子组模板
  getOperatorGroupTemplateInfoById: function (id) {
    return axios({
      url: `/api/v1/pipelinecenter/operatorGroupTemplate/${id}`,
      method: 'GET'
    })
  },
  // 更新算子组模板
  updateOperatorGroupTemplateById: function (id, data) {
    return axios({
      url: `/api/v1/pipelinecenter/operatorGroupTemplate/update/${id}`,
      method: 'PUT',
      data
    })
  },
  // 删除算子组模板
  deleteOperatorGroupTemplate: function (id) {
    return axios({
      url: `/api/v1/pipelinecenter/operatorGroupTemplate/delete/${id}`,
      method: 'DELETE'
    })
  },
  // 调试算子组模板
  operatorGroupDebug: function (id, data) {
    return axios({
      url: `/api/v1/pipelinecenter/operatorGroupTemplate/debug/${id}`,
      method: 'post',
      data,
    })
  },
  // 算子组上传图片
  uploadGroupImage: function (data, headers) {
    return axios({
      url: '/api/v1/pipelinecenter/operatorGroupTemplate/uploadImage',
      method: 'post',
      data,
      // headers: headers
    })
  },
  // 算子组获取图片
  getGroupImage: function (params) {
    return axios({
      url: `/api/v1/pipelinecenter/operatorGroupTemplate/downloadImage`,
      method: 'GET',
      params
    })
  },
  getVirOpGroupPipelineGraphById: function (id) {
    return axios({
      url: `/api/v1/pipelinecenter/operatorInfo/${id}/getVirOpGroupPipelineGraph`,
      method: 'GET'
    })
  },
  // 解决方案导入(算法方案)
  schemeImport: function (data) {
    return axios({
      url: '/api/v1/pipelinecenter/pipelineTemplateInfo/importAlgo',
      method: 'post',
      data,
      // headers:{
      //   "Content-Type": "multipart/form-data",
      // }
    })
  },
  // 普通方案导入（可视化编辑的方案）
  schemePipeLineImport: function (data) {
    return axios({
      url: '/api/v1/pipelinecenter/pipelineTemplateInfo/import',
      method: 'post',
      data,
      // headers:{
      //   "Content-Type": "multipart/form-data",
      // }
    })
  },
  // 算法方案导出
  schemeExport: function (id) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineTemplateInfo/exportAlgo/${id}`,
      method: 'GET',
      responseType: 'blob',
    })
  },
  // 普通方案导出（可视化编辑的方案）
  schemePipeLineExport: function (id) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineTemplateInfo/export`,
      method: 'GET',
      params: {
        id,
      },
      responseType: 'blob',
    })
  },
  // 获取算法方案配置具体信息
  schemeGetConfig: function (id) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineInferTaskConfig/get/${id}`,
      method: 'GET',
    })
  },
  // 支持分页，获取算法方案历史配置记录 
  schemeGetConfigList: function (params) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineInferTaskConfig/getList`,
      method: 'GET',
      params
    })
  },
  // 新建算法方案配置
  schemeCreateConfig: function (data) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineInferTaskConfig/create`,
      method: 'POST',
      data,
    })
  },
  // 更新算法方案配置
  schemeUpdateConfig: function (id, data) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineInferTaskConfig/update/${id}`,
      method: 'PUT',
      data,
    })
  },
  // 运行算法方案
  schemeRunConfig: function (id, data = {}) {
    return axios({
      url: `/api/v1/pipelinecenter/pipelineTemplateInfo/runAlgo/${id}`,
      method: 'POST',
      data,
    })
  },
  // 动态添加python算子(生成一个实例化的python算子)
  createPyOperator: function (data) {
    return axios({
      url: `/api/v1/pipelinecenter/operator/python/add-operator`,
      method: 'POST',
      data,
    })
  },
  // 填充/更新python算子实例的参数信息
  updatePyOperator: function (data) {
    return axios({
      url: `/api/v1/pipelinecenter/operator/python/update-operator`,
      method: 'post',
      data,
    })
  },
  // 解析python代码,获取输入和输出信息
  parsePyCode: function (data) {
    return axios({
      url: `/api/v1/pipelinecenter/operator/python/parse-code`,
      method: 'POST',
      data,
    })
  },
  // 获取运行方案的pod日志
  getPodLogs: function (podName) {
    return axios({
      url: `/api/v1/schedule/scheduleController/fetch-pod-log`,
      method: 'get',
      params: {
        podName
      }
    })
  }
}
