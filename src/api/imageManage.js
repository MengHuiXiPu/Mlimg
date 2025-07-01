/**
 * 镜像管理相关接口
 */

import { axios } from '@/utils/request'

/**
 * 获取镜像管理列表
 */
export function getImageManageList (params) {
  return axios({
    url: '/api/v1/algorithm/imageManageInfo/getImageList',
    method: 'get',
    params
  })
}

/**
 * 镜像管理新增列表
 */
export function saveImageManage (params) {
  return axios({
    url: '/api/v1/algorithm/imageManageInfo',
    method: 'post',
    data: params
  })
}

/**
 * 镜像管理修改列表
 */
export function editImageManage (params) {
  return axios({
    url: '/api/v1/algorithm/imageManageInfo',
    method: 'put',
    data: params
  })
}
/**
 * 镜像管理删除
 */
export function deleteImageManage (params) {
  return axios({
    url: '/api/v1/algorithm/imageManageInfo/' + params,
    method: 'delete'
  })
}
/**
 * 通过id获取镜像管理
 */
export function getImageManageById (params) {
  return axios({
    url: '/api/v1/algorithm/imageManageInfo/' + params,
    method: 'get'
  })
}

/**
 * 获取通用镜像树状结构
 */
export function getImageListTree (params) {
  return axios({
    url: '/api/v1/algorithm/imageManageInfo/getImageListTree',
    method: 'get'
  })
}

/**
 * 验证镜像名称是否可用
 */
export function checkImageNameAvl (params) {
  return axios.get('/api/v1/algorithm/imageManageInfo/checkImageNameAvl', { params })
}

export function checkImageModel (id, params) {
  return axios({
    url: '/api/v1/algorithm/imageManageInfo/checkAlgorithmAndModelDependence/' + id,
    method: 'get',
    params
  })
}
export function getOffLineId (id, name) {
  return axios({
    url: `/api/v1/traincenter/offlineForecastInfo/getOfflineForecastInfo?modelId=${id}&taskName=${name}`,
    method: 'get',
  })
}
export const newImage = {
  getImageList (params) {
    return axios({
      url: '/api/v1/imagemanage/tbImageInfo/list/',
      method: 'get',
      params
    })
  },
  downloadDockerfile(id) {
    return axios({
      url: `/api/v1/imagemanage/tbImageInfo/downloadDockerfile/${id}`,
      method: 'get',
      responseType: 'blob'
    });
  },
  editImage (params, type) {
    return axios({
      url: '/api/v1/imagemanage/tbImageInfo/',
      method: type,
      data: params
    })
  },
  // editImageFile (params, type) {
  //   return axios({
  //     url: '/api/v1/imagemanage/tbImageInfo/add4Dockerfile',
  //     method: type,
  //     data: params
  //   })
  // },
  editImageFile(data, headers) {
    return axios({
        url: '/api/v1/imagemanage/tbImageInfo/add4Dockerfile',
        method: 'post',
        data,
        headers: headers
      })
  },
  getImage (params, type) {
    return axios({
      url: '/api/v1/imagemanage/tbImageInfo/' + params,
      method: type
    })
  },
  getPackageList (params) {
    return axios({
      url: '/api/v1/imagemanage/tbImageInfo/displayPointedPageInstallPkg',
      method: 'get',
      params
    })
  },
  addPackage (params) {
    return axios({
      url: '/api/v1/imagemanage/tbImageInfo/addMultiInstallPkg',
      method: 'put',
      params
    })
  },
  checkImageName (params) {
    return axios({
      url: '/api/v1/imagemanage/tbImageInfo/checkImageNameInfoAvl',
      method: 'get',
      params
    })
  },
  getImageDependList (params) {
    return axios({
      url: '/api/v1/imagemanage/tbImageInfo/checkImageDependence',
      method: 'get',
      params
    })
  }
}

export const imageVersion = {
  getImageVersionList: (params) => {
    return axios({
      url: '/api/v1/algorithm/imageManageInfo/getVersionList',
      method: 'get',
      params
    })
  }
}

export const mirrorExport = {
  compression: (params) => {
    return axios({
      url: '/api/v1/algorithm/imageManageInfo/yasuoCalculate',
      method: 'get',
      params
    })
  },
  download: (params) => {
    // return `/api/v1/algorithm/imageManageInfo/downCalculate?zipFilePath=${params}`
    // return axios({
    //   url: '/api/v1/imagemanage/imageManageInfo/downCalculate',
    //   method: 'get',
    //   params
    // })
      return axios({
          url: `/api/v1/algorithm/imageManageInfo/downCalculate?zipFilePath=${params}`,
          method: 'get',
          // family: -2,
          responseType: 'blob'
      })
  }
}
/*
 * 算法模板制作接口
*/

//读取模板制作step1页面左侧节点树
export function getNodeLeftTreeList() {
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/getNodeLeftTreeList`,
        method: 'get',
    })
}

//读取模板制作模板分页列表
export function getTemplateTabsList(params) {
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/list/${params}`,
        method: 'post',
    })
}

//模板基本
export function getTemplateById(id) {
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/${id}`,
        method: 'get',
    })
}


//部件基本信息
export function getComplabelByPkId(id) {
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/stepComplabel/${id}`,
        method: 'get',
    })
}

//模板添加
export function addTemplate(params) {
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/add/`,
        method: 'post',params
    })

}

//模板修改
export function editTemplate(params) {
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/${params}`,
        method: 'put',
    })
}

//模板删除
export function deleteTemplate(id) {
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/${id}`,
        method: 'delete',
    })
}

//各环节通用参数配置准备
export function getTemplateMakeinfo(params) {
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/configStrTpl/${params}`,
        method: 'get',
    })
}

//各站点部件左边二级树导航数据准备
export function getComplabelNodeListData(templateId) {
  return axios({
    url: `/api/v1/dataanalysis/aiTemplateMakeinfo/complabelNodeListData/${templateId}`,
    method: 'get',
  })
}

//各站点部件标注确认操作
export function stepComplabelMarkConfirmationDo(params) {
    if (window.confirm("确认标注无误？")) {
        axios.post(`/api/v1/dataanalysis/aiTemplateMakeinfo/stepComplabel/markConfirmation`, params, {
            headers: {
                'Content-Type': 'application/json',
               
            }
        }).then(response => {
            // 请求成功的回调，此时返回code===0
            console.log(response.data.outPath)
            //this.$forceUpdate();//刷新
        }).catch(error => {
            // 请求失败的回调
        });
    }
}

//各部件标注模板制作
export function templateComponentMakeDo(params) {
    if (window.confirm("请设置好各参数据，确认要生成部件模板吗？")) {
        const jsonparams = JSON.stringify(params);
        axios.post(`/api/v1/dataanalysis/aiTemplateMakeinfo/httpReqTemplateComponentMake`, jsonparams, {
            headers: {
                'Content-Type': 'application/json',
               
            }
        }).then(response => {
            // 请求成功的回调，此时返回code===0
            //this.$forceUpdate();//刷新
            alert("OK");
            console.log(response)
        }).catch(error => {
            // 请求失败的回调
        });
        alert("确认");
    } else {
        alert("取消");
    }
}

//通过传入目录查目录子目录树接口
export function getDirTreeDataList(params) {
     let paramsInput={"dirPath":params}
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/findDirTreeList`,
        params:paramsInput,
        method: 'get',
    })
}

//通过传入目录查目录下图片列表接口
export function findDirImageList(params) {
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/findDirImageList`,
        "params": params,
        method: 'get',
    })
}

//查目录Resize后的图片列表（切换标注底板图用）
export function findResizedImageList(params) {
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/stepResize/infoListByNodeIdClassIdByNodeIdClassId`,
        method: 'get',
        "params": params
    }).then(response => {
        // 请求成功的回调，此时返回code===0
        return response;
    }).catch(error => {
        // 请求失败的回调
    });
}

export function findResizedImageObj(params) {
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/stepResize/infoByNodeIdClassIdByNodeIdClassIdInputImage`,
        method: 'get',
        "params": params
    }).then(response => {
        // 请求成功的回调，此时返回code===0
        return response;
    }).catch(error => {
        // 请求失败的回调
    });
}


//彩图模板制作
export function templateFullMakeDo(params) {
    if (window.confirm("请设置好各参数据，确认要生成彩图模板吗？")) {
        const jsonparams = JSON.stringify(params);
        axios.post(`/api/v1/dataanalysis/aiTemplateMakeinfo/httpReqTemplateFullMake`, jsonparams, {
            headers: {
                'Content-Type': 'application/json',
               
            }
        }).then(response => {
            // 请求成功的回调，此时返回code===0
            //this.$forceUpdate();//刷新
        }).catch(error => {
            // 请求失败的回调
        });
        alert("确认");
    } else {
        alert("取消");
    }
}

//通过传入目录查目录Zip或tar文件列表接口
export function findDirZipFileList(params) {
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/findDirZipFileList`,
        "params":params,
        method: 'get',
    })
}



export function findStepComplabelObjByNodeClassIdEqmIdIndName(params) {
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/stepComplabel/infoObj`,
        method: 'get',
        "params": params
    }).then(response => {
        // 请求成功的回调，此时返回code===0
        return response;
    }).catch(error => {
        // 请求失败的回调
    });
}


//查已制作好的全图
export function findStepColorPictureInfoListByTemplateIdNodeIdClassIdEqpId(params) {
    return axios({
        url: `/api/v1/dataanalysis/aiTemplateMakeinfo/stepColorPicture/infoListByTemplateIdNodeIdClassIdEqpId`,
        method: 'get',
        "params": params
    }).then(response => {
        // 请求成功的回调，此时返回code===0
        return response;
    }).catch(error => {
        // 请求失败的回调
    });
}

// export function editImageFile(data, headers) {
//   return axios({
//       url: '/api/v1/imagemanage/tbImageInfo/add4Dockerfile',
//       method: 'post',
//       data,
//       headers: headers
//     }).then(response => {
//       // 请求成功的回调，此时返回code===0
//       return response;
//   }).catch(error => {
//       // 请求失败的回调
//   });
// }
