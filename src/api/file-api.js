/**
 * 网盘中心相关接口
 */

import { axios } from '@/utils/request'

export default {

  //上传文件
  uploadFile: function (data, headers) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/cloudFileUpload',
      method: 'post',
      data,
      headers: headers
    })
  },
  //获取文件绝对路径
  getFilePath: function (params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/getFilePath',
      method: 'get',
      params,
    })
  },
  // 文件预览
  getPreviewFile: function (params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/previewText',
      method: 'get',
      params,
      responseType: "blob",
    })
  },
  // 设置分享
  setSharing(params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/setShareFileOrFolder',
      method: 'post',
      params
    })
  },
  //设置共享
  setPublicSharing(params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/setPublicFileOrFolder',
      method: 'post',
      params
    })
  },
  getShareUser(params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/getShareUsers',
      method: 'get',
      params
    })
  },
  //获取个人分享文件
  getShareList: function (params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/getShareFilesAndDirs',
      method: 'get',
      params
    })
  },
  // 获取共享文件
  getPublicList(params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/getPublicFilesAndDirs',
      method: 'get',
      params
    })
  },
  // 分享和共享进入子目录获取结果
  getShareSubList(params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/getShareFilesAndDirsById',
      method: 'get',
      params
    })
  },
  // 获取个人文件列表 //废弃
  getfileList: function (params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/getCloudDiskFilesAndDirsByOrder',
      method: 'get',
      params
    })
  },

  // 获取个人文件列表(排序)
  getSortedFileList: function (params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/getCloudDiskFilesAndDirsByOrder',
      method: 'get',
      params
    })
  },

  //个人文件搜索
  // searchFileAndOpenDir: function(params) {
  //   return axios({
  //     url: '/api/v1/datacenter/personalCloudDisk/getCloudDiskFilesAndDirs',
  //     method: 'get',
  //     params
  //   })
  // },


  // 上传文件夹
  uploadFolder: function(params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/makeFolder',
      method: 'post',
      params,
    })
  },

  //下载单个文件
  downloadFile: function (params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/downloadPersonalFile',
      method: 'get',
      params,
      responseType: "blob",
    })
  },

  //打包下载文件夹
  downloadFolder: function (params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/packageDownload',
      method: 'get',
      params,
      responseType: "blob",
    })
  },

  // 获取个人文件夹列表
  getFolderList: function (params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/getCloudDiskFolders',
      method: 'get',
      params,
    })
  },
  // // 新建文件夹
  // newFolder: function(params) {
  //   return request({
  //     url: 'new_folder',
  //     method: 'post',
  //     params
  //   })
  // },
  // // 文件列表
  // fileList: function(params) {
  //   return request({
  //     url: 'list',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 收藏/取消收藏
  // favoriteUrl: function(params) {
  //   const isFavorite = params.isFavorite
  //   if (isFavorite) {
  //     return request({
  //       url: 'favorite',
  //       method: 'post',
  //       params,
  //       paramsSerializer: function(params) {
  //         return qs.stringify(params, { arrayFormat: 'repeat' })
  //       }
  //     })
  //   } else {
  //     return request({
  //       url: 'unFavorite',
  //       method: 'post',
  //       params,
  //       paramsSerializer: function(params) {
  //         return qs.stringify(params, { arrayFormat: 'repeat' })
  //       }
  //     })
  //   }
  // },
  // // 将文件设为公共文件
  // setPublic: function(params) {
  //   return request({
  //     url: 'setPublic',
  //     method: 'put',
  //     params
  //   })
  // },
  // 删除
  delete: function (params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/deleteFileOrFolder',
      method: 'delete',
      params,
    })
  },
  batchDelete(params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/deleteFileOrFolderBatch',
      method: 'delete',
      params,
    })
  },
  // 重名名
  rename: function (params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/renameFileOrFolder',
      method: 'post',
      params,
    })
  },
  // 搜索文件🔍
  searchFile: function (params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/searchFileOrFolder',
      method: 'get',
      params,

    })
  },
  // // 搜索文件🔍-打开目录
  // searchFileAndOpenDir: function(params) {
  //   return request({
  //     url: 'search-file-open',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 查找下级目录
  // queryFileTree: function(params) {
  //   return request({
  //     url: 'query-file-tree',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 查找上级目录
  // upperLevelList: function(params) {
  //   return request({
  //     url: 'upper-level-list',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 查找下级目录
  // listfiles: function(params) {
  //   return request({
  //     url: 'listfiles',
  //     method: 'get',
  //     params
  //   })
  // },
  // 移动文件/文件夹
  move: function (params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/moveFileOrFolder',
      method: 'post',
      params,
    })
  },
  // 复制文件/文件夹
  copy: function (params) {
    return axios({
      url: '/api/v1/datacenter/personalCloudDisk/copyFileOrFolder',
      method: 'post',
      params,
    })
  },
  // /**
  //  * 创建副本
  //  * @param params
  //  */
  // duplicateFile(params) {
  //   return request({
  //     url: 'duplicate',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 生成分享链接
  // generate: function(data) {
  //   return request({
  //     url: 'share/generate',
  //     method: 'post',
  //     data: data
  //   })
  // },
  // // 取消分享
  // cancelShareLink: function(params) {
  //   return request({
  //     url: 'share/cancel',
  //     method: 'delete',
  //     params,
  //     paramsSerializer: function(params) {
  //       return qs.stringify(params, { arrayFormat: 'repeat' })
  //     }
  //   })
  // },
  // // 分享列表
  // sharelist: function(params) {
  //   return request({
  //     url: '/share/list',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 挂载文件夹
  // mountFolder: function(data) {
  //   return request({
  //     url: '/share/mount-folder',
  //     method: 'put',
  //     data: data
  //   })
  // },
  // // 验证提取码
  // validShareCode: function(data) {
  //   return request({
  //     url: 'public/valid-share-code',
  //     method: 'post',
  //     data
  //   })
  // },
  // // 访问分享链接
  // accessShare: function(params) {
  //   return request({
  //     url: 'public/access-share',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 获取分享者信息
  // getSharer: function(params) {
  //   return request({
  //     url: 'public/get/sharer',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 获取分享信息
  // getShare: function(params) {
  //   return request({
  //     url: '/get/share',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 访问分享链接里的文件夹
  // accessShareOpenDir: function(params) {
  //   return request({
  //     url: 'public/access-share/open',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 通过filepath预览文本文件
  // previewTextByPath: function(params) {
  //   return request({
  //     url: '/preview/path/text',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 预览文本文件
  // previewText: function(params) {
  //   return request({
  //     url: '/preview/text',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 访问分享的文本文件
  // sharePreviewText: function(params) {
  //   return request({
  //     url: '/public/s/preview/text',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 解压文件
  // unzip: function(params) {
  //   return request({
  //     url: '/unzip',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 根据path删除文件
  // delFile: function(params) {
  //   return request({
  //     url: 'delFile',
  //     method: 'delete',
  //     params,
  //     paramsSerializer: function(params) {
  //       return qs.stringify(params, { arrayFormat: 'repeat' })
  //     }
  //   })
  // },
  // // 根据path重命名文件
  // renameByPath: function(params) {
  //   return request({
  //     url: '/rename/path',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 根据path添加文件/文件夹
  // addFile: function(params) {
  //   return request({
  //     url: '/addfile',
  //     method: 'post',
  //     params
  //   })
  // },
  // // 是否允许下载
  // isAllowDownload: function(params) {
  //   return request({
  //     url: '/isAllowDownload',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 根据id获取文件信息
  // getFileInfoById: function(params) {
  //   return request({
  //     url: '/file_info',
  //     method: 'get',
  //     params
  //   })
  // },
  // // 根据id获取文件信息
  // getPublicFileInfoById: function(params) {
  //   return request({
  //     url: '/public/file_info',
  //     method: 'get',
  //     params
  //   })
  // }
}
