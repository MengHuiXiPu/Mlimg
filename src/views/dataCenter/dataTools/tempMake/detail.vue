<template>
  <div class="">
    <a-spin :spinning="spinning">
      <template v-if="tempId">
        <div style="text-align: right;"><a-button type="primary" @click="goEdit">去编辑模板</a-button></div>
        <el-descriptions column="3" style="margin-bottom: 10px;" title="基本信息" size="medium">
          <el-descriptions-item label="创建人">{{ tempData.createBy }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ tempData.createTime | moment }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ tempData.updateTime | moment }}</el-descriptions-item>
          <el-descriptions-item label="描述">
            <text-editor :text="tempData.desc" size="mini" @change="handlUpdateDesc" maxlength="512" :key="tempId"></text-editor>
          </el-descriptions-item>
        </el-descriptions>
        <el-divider></el-divider>
        <div class="picture-footage-box">
          <span class="tab-header">待拼接图片素材</span>
          <!-- :customRequest="customUploadHandle" -->
          <a-upload list-type="picture" :file-list="fileList" class="upload-list-inline" ref="refUploadComp"
            accept="image/*" multiple :beforeUpload="beforeUploadHandle" :customRequest="customUploadHandle"
            :remove="removeHandle" @change="handlePicListChange" @preview="handlePicPreview">
            <a-button type="primary" size="small"> <a-icon type="upload" /> 本地上传 </a-button>
          </a-upload>
          <div style="margin-top: 10px;text-align:center;">
            <span v-if="!fileList.length">暂无图片素材，请
              <a class="common-link" @click="callUpload">点击添加</a>
            </span>
          </div>
        </div>
        <a-tabs v-model="activeKey" style="margin-top: 30px;" :animated="false">
          <a-tab-pane tab="dat文件" key="datFile">
            <template v-if="tempData.datFile">
              <div class="desc-item">
                <span class="desc-label">dat文件</span>
                <span class="desc-text"> {{ tempData.datFile.name }}
                  <a-tooltip title="点击下载">
                    <a-icon type="download" class="download-icon" @click="downLoadDat" />
                  </a-tooltip>
                </span>
              </div>
              <div class="desc-item">
                <span class="desc-label"> dat文件最近生成时间</span>
                <span class="desc-text">{{ tempData.datFile.createdAt | moment}}</span>
              </div>
            </template>
            <a-empty style="line-height: 10;" :image="simpleImage" v-else>
              <span slot="description"> 信息为空，快去 <a class="common-link" @click="goEdit">编辑模板</a>吧</span>
            </a-empty>
          </a-tab-pane>
          <a-tab-pane tab="拼接图" key="picture">
            <template v-if="tempData.splicedPic">
              <div class="desc-item">
                <span class="desc-label">图片最近生成时间</span>
                <span class="desc-text">{{ tempData.splicedPic.updateTime | moment }}</span>
              </div>
              <div class="desc-item">
                <span class="desc-label"> 图片像素</span>
                <span class="desc-text">{{ picSizeText }}</span>
              </div>
              <el-image style="width: 200px; height: 200px" :src="imgSrc(tempData.splicedPic.url)" :preview-src-list="[tempData.splicedPic.url]" fit="contain"></el-image>
            </template>
            <a-empty style="line-height: 10;" :image="simpleImage" v-else>
              <span slot="description"> 信息为空，快去 <a class="common-link" @click="goEdit">编辑模板</a>吧</span>
            </a-empty>
          </a-tab-pane>
        </a-tabs>
      </template>
      <a-empty style="line-height: 30;" :image="simpleImage" v-else>
        <span slot="description"> 未选择模版，请选择或 <a class="common-link" @click="handCreate">创建新的模版</a></span>
      </a-empty>
    </a-spin>
  </div>
</template>

<script>
import textEditor from "@/components/business/textEditor/index.vue";
import { Empty } from 'ant-design-vue';
import { getTempDeteil, saveTemp, uploadPic, deletePicture, getPicList, getThumbnailList, getPicByPath, downloadDatFile } from "@/api/tempMake.js";
import { saveAs } from "file-saver";
export default {
  components: {
    textEditor,
  },
  data() {
    return {
      spinning: false,
      tempData: {},
      activeKey: "datFile",
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
      fileList: [],
      pagination: {
        limit: 999,
        pageNo: 1,
        total: 0
      },
      downloadIng: false, //
      picSizeText: "", //图片像素
    }
  },
  props: {
    tempId: {
      type: Number,
      default: 0
    },
  },
  methods: {
    imgSrc(url) {
      return url || require("@/assets/images/place.gif");
    },
    // 更新描述
    handlUpdateDesc(newText) {
      saveTemp({
        id: this.tempId,
        desc: newText
      }).then(res => {
        if (res.code === 0) {
          this.$message.success('已更新')
          this.tempData.desc = newText
        }
      })
    },
    goEdit() {
      if (!this.fileList.length) return this.$message.warning('请先上传图片')
      this.$emit('edit')
    },
    callUpload() {
      this.$refs.refUploadComp.$refs.uploadRef.$refs.uploaderRef.onClick()
    },
    handCreate() {
      this.$emit('create')
    },
    // 校验必须是图片格式
    beforeUploadHandle(file, fileList) {
      if (file.type.indexOf('image') === -1) {
        this.$message.error('请上传图片格式的文件')
        return false
      }
      // 限制单次最多上传 20 张图片
      // if (fileList.length > 2) {
      //   this.$message.error('单次最多只能上传 20 张图片')
      //   fileList.splice(0)
      //   return false
      // }
      // console.log('fileList', fileList)
      return true
    },
    handlePicPreview(file) {
      return false
    },
    customUploadHandle({ file, onProgress, onSuccess, onError }) {
      let formParam = new FormData()
      formParam.append('templateMakeId', this.tempId)
      formParam.append('file', file)
      return uploadPic(formParam, (progressEvent) => {
        // console.log('进度信息:', progressEvent)
        const percent = (progressEvent.loaded / progressEvent.total * 100 | 0);
        onProgress({ percent }, file)
      }).then(res => {
        if (res.code === 0) {
          onSuccess(res, file)
          // 刷新图片列表(fix 用户上传后再直接点击删除，因为删除接口需要后端的图片 id，而上传成功后后端又没有返回图片 id，所以需要刷新图片列表已获取删除所需的 id)
          // this.fetchPictureList()
          // 将文件在数据库中的 id set 到 fileList 中，用于删除图片时获取图片 id
          this.fileList = this.fileList.map(item => {
            if (item.uid === file.uid) {
              item.id = res.data
            }
            return item
          })

        }
      }).catch((err) => {
        onError(err, file)
      })
    },
    handlePicListChange(info) {
      // let fileList = [...info.fileList];

      // // 更新文件状态
      // fileList = fileList.map(file => {
      //   if (file.response) {
      //     // 文件上传成功
      //     file.url = file.response.url; // 假设返回的响应中有 url
      //   }
      //   return file;
      // });

      this.fileList = info.fileList;
    },
    removeHandle(file) {
      return new Promise((resolve, reject) => {
        this.$confirm({
          title: '删除图片',
          content: `删除待拼接图片后，可能导致拼接中的图片缺失部分元素，请谨慎操作`,
          okText: '确定删除',
          okType: 'danger',
          onOk: () => {
            deletePicture([file.id]).then(res => {
              if (res.code === 0) {
                this.$message.success('已删除')
                resolve(true)
              } else {
                reject()
              }
            }).catch(() => {
              reject()
            })
          },
          onCancel: () => {
            reject()
          },
        });
      })
    },
    downLoadDat() {
      if (this.downloadIng) {
        return this.$message.warning("资源传输中，请稍后...")
      }
      this.downloadIng = true
      this.$message.warning("资源已开始传输，请稍后...")

      downloadDatFile(this.tempId).then(res => {
        const blob = new Blob([res], { type: "application/zip" });
        saveAs(blob, `${this.tempData?.datFile?.name || this.tempData.name}.zip`);
        // 已下载
        this.$message.success('已完成下载')
      }).finally(() => {
        this.downloadIng = false
      })
    },
    fetchPictureList() {
      const { pageNo, limit } = this.pagination
      getPicList({
        templateMakeInfoId: this.tempId,
        pageNo: pageNo,
        limit: limit
      }).then(res => {
        if (res.code === 0) {
          this.pagination.total = res.data.total
          this.fileList = res.data.records.map(item => {
            return {
              uid: item.id,
              id: item.id,
              name: item.picName,
              status: 'done',
              // url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
              // thumbUrl: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'
            }
          })
          // 遍历去加载缩略图
          this.fileList.forEach(item => {
            getThumbnailList(item.uid).then(res => {
              const url = window.URL.createObjectURL(res)
              this.$set(item, 'url', url)
            })
          })
        }
      })
    },
    /**
     * @public
     */
    async getTempDetailData(needLoadPic = true) {
      this.spinning = true
      needLoadPic && this.fetchPictureList()
      //查询模板详情和图片列表 
      try {
        const tempResult = await getTempDeteil(this.tempId, {
          needFrontendConfigs: true,
        })
        this.spinning = false
        if (tempResult.code === 0) {
          this.tempData = tempResult.data
          const path = tempResult.data.splicedPic?.path
          if (path) { //存在拼接图路径，用路径去查询图片
            const picResult = await getPicByPath(path)
            const url = window.URL.createObjectURL(picResult)
            this.$set(this.tempData.splicedPic, 'url', url)
            // 还要从 frontendConfigs中去获取图片的像素显示，0.0
            try {
              const step2Data = (tempResult.data?.frontendConfigs || []).find(item => item.step === 2)
              const step2ConfigStr = step2Data?.config || ''
              const step2Config = JSON.parse(step2ConfigStr)
              this.picSizeText = `${step2Config.width || '-'} * ${step2Config.height || '-'}`
            } catch (e) {
              console.error(e)
            }
          }
        }
      } catch (e) {
        console.log(e)
        this.spinning = false
      }
    }
  },
  watch: {
    tempId() {
      if (this.tempId) {
        // this.fileList = []
        //查询模板详情和图片列表 
        this.getTempDetailData()
      }
    }
  },
}
</script>

<style lang="less" scoped>
.tab-header {
  color: #303133;
  font-size: 16px;
  font-weight: 700;
  margin-right: 20px;
}
.upload-list-inline {
  &::v-deep {
    .ant-upload-list-item {
      float: left;
      width: 180px;
      margin-right: 8px;
    }

    // .ant-upload-list {
    //   max-height: 200px;
    //   overflow: auto;
    // }
  }
}
.desc-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  .desc-label {
    width: 150px;
    color: #303133;
    font-size: 14px;
    font-weight: 700;
  }
  .desc-text {
    color: #606266;
    font-size: 14px;
  }
  .download-icon {
    margin-left: 10px;
    font-size: 18px;
    color: #409eff;
    cursor: pointer;
  }
}
</style>