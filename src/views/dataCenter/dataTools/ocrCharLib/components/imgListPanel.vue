<template>
  <a-spin :spinning="spinning">
    <div class="space-between">
      <a class="common-link" @click="callUpload">本地上传图片</a>
      <a-button type="primary" size="medium" v-if="scene === 'original'" @click="goSlice">去截取字符串</a-button>
      <a-button type="primary" size="medium" v-if="scene === 'character'" @click="goSplicing">去拼接OCR模版图</a-button>
    </div>
    <div class="image-list-wrapper" v-if="imgList.length">
      <div class="img-list" >
        <div class="img-item" v-for="(item,index) in imgList" :key="item.id" @mouseenter="item._isShowMask = true" @mouseleave="item._isShowMask = false">
          <el-image :src="matchImgSrc(item)" fit="contain" class="img-item-img" :preview-src-list="imgSrcList"></el-image>
          <transition name="el-fade-in">
            <div class="img-item-mask" v-show="item._isShowMask">
              <a-icon type="eye" class="img-item-mask-icon" @click="openPreviewImg(index)"/>
              <a-icon type="delete" class="img-item-mask-icon" @click="removeImg(item)"/>
            </div>
          </transition>
        </div>
      </div>
      <!-- :showSizeChanger="true" -->
      <a-pagination :show-total="() => `共 ${pagination.total} 条`" show-quick-jumper
        :defaultPageSize="pagination.pageSize" :default-current="pagination.current" :current="pagination.current"
        :total="pagination.total" show-less-items @change="pageChange" size="small" class="pagation-comp"
        :hideOnSinglePage="true" 
      />
    </div>
    <a-empty style="line-height: 10;" :image="simpleImage" v-else>
      <span slot="description" v-if="scene==='original'"> 暂无原图，请 <a class="common-link" @click="callUpload">去本地上传</a></span>
      <span slot="description" v-if="scene==='character'"> 暂无字符图，请 <a class="common-link" @click="callUpload">去本地上传</a>或<a class="common-link" @click="callUpload">去截取字符图</a></span>
    </a-empty>
    <!-- 图片预览 -->
    <el-image-viewer v-if="imgViewerVisible"  :url-list="imgSrcList" :on-close="onCloseImgViewer" :initialIndex="initialIndex"/>
    <!-- 图片 上传 -->
    <a-upload ref="refUploadComp" :beforeUpload="beforeUploadHandle" :customRequest="customUploadHandle" accept="image/*" :showUploadList="false" multiple></a-upload>
  </a-spin>
</template>

<script>
import { uploadPic, deletePicture, getPicList, getPicByPath } from "@/api/tempMake.js";
import { Empty } from 'ant-design-vue';
import elImageViewer from "element-ui/packages/image/src/image-viewer"
import { uploadCharPic, deleteCharPic, getStepList } from "@/api/ocrCharLib.js"
export default {
  name: 'originalImgPanel',
  components: {
    elImageViewer,
  },
  data() {
    return {
      spinning: false, //
      imgList: [],
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
      imgViewerVisible: false, //显示预览
      initialIndex: 0, //预览图片的索引
      // 一次上传用户选择的图片数量
      uploadTotalNum: 1,
      uploadFinishNum: 0, //一次上传完成数量 无论是否成功，当==uploadTotalNum时，任务本次上传动作完成，进行图片列表刷新
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0
      },
    }
  },
  props: {
    // 模板 id
    tempId: {
      type: Number | String,
      default: ""
    },
    // 场景  取值：原图列表: original  字符图列表: character
    // 原图与字符图增删图片的接口不一样，接口响应字段也不一样，页面显示文本也有区别
    scene: {
      type: String,
      default: "original"
    }
  },
  computed: {
    imgSrcList() {
      return this.imgList.map(item => {
        return item.url
      })
    }
  },
  watch: {
    tempId() {
      if (this.tempId) {
        this.pagination.current = 1
        this.fetchPictureList()
      }
    }
  },
  methods: {
    matchImgSrc(item) {
      return item.url || require("@/assets/images/place.gif");
    },
    openPreviewImg(index) {
      this.initialIndex = index
      this.imgViewerVisible = true
    },
    onCloseImgViewer() {
      this.imgViewerVisible = false
    },
    callUpload() {
      this.$refs.refUploadComp.$refs.uploadRef.$refs.uploaderRef.onClick()
    },
    // 去截取字符图
    goSlice() {
      // 检查原图列表不为空 
      if (this.imgList.length === 0) {
        this.$message.warning('请先上传原图')
        return
      }
      this.$emit('slice')
    },
    // 去拼接模板
    goSplicing() {
      // 检查字符图列表不为空 ----改为 detail 中校验(detail 中也有去拼接的按钮)
      // if (this.imgList.length === 0) {
      //   this.$message.warning('请先上传或截取字符图')
      //   return
      // }
      this.$emit('splicing')
    },
    // 校验必须是图片格式
    beforeUploadHandle(file, fileList) {
      this.uploadTotalNum = fileList.length
      return true
    },
    customUploadHandle({ file, onProgress, onSuccess, onError }) {
      this.spinning = true
      let formParam = new FormData()
      let uploadMethod = this.scene === 'character' ? uploadCharPic : uploadPic
      if (this.scene === 'character') {
        formParam.append('dataProcessingId', this.tempId)
        formParam.append('pic', file)
      }
      if (this.scene === 'original') {
        formParam.append('templateMakeId', this.tempId)
        formParam.append('file', file)
      }
      uploadMethod(formParam).then(res => {
        if (res.code === 0) {

        }
      }).catch((err) => {
        this.$message.error(`${file.name}上传失败`)
      }).finally(() => {
        this.uploadFinishNum++
        if (this.uploadFinishNum === this.uploadTotalNum) {
          this.$message.success('上传完成')
          this.spinning = false
          this.fetchPictureList()
          this.uploadFinishNum = 0
        }
      })
    },
    pageChange(page, pageSize) {
      this.pagination.current = page
      this.pagination.pageSize = pageSize
      this.fetchPictureList()
    },
    // 获取图片列表
    fetchPictureList() {
      const { current, pageSize } = this.pagination
      if (this.scene === 'original') {
        getPicList({
          templateMakeInfoId: this.tempId,
          pageNo: current,
          limit: pageSize
        }).then(res => {
          if (res.code === 0) {
            this.pagination.total = res.data.total
            this.imgList = res.data.records
            // 遍历去加载缩略图
            this.imgList.forEach(item => {
              this.$set(item, '_isShowMask', false)
              getPicByPath(item.picUrl).then(res => {
                const url = window.URL.createObjectURL(res)
                this.$set(item, 'url', url)
              })
            })
          }
        })
      }
      if (this.scene === 'character') {
        getStepList({
          dataProcessingId: this.tempId,
          pageNo: current,
          limit: pageSize,
          stepEnum: "32", //字符图固定 32
        }).then(res => {
          if (res.code === 0) {
            this.pagination.total = res.data.total
            this.imgList = res.data.records
            // 遍历去加载图片
            this.imgList.forEach(item => {
              this.$set(item, '_isShowMask', false)
              getPicByPath(item.path).then(res => {
                const url = window.URL.createObjectURL(res)
                this.$set(item, 'url', url)
              })
            })
          }
        })
      }
    },
    removeImg(image) {
      // this.$confirm({
      //   title: '删除图片',
      //   content: `删除图片`,
      //   okText: '确定删除',
      //   okType: 'danger',
      //   onOk: () => {
      const deleteHandler = this.scene === 'character' ? deleteCharPic : deletePicture
      const param = this.scene === 'character' ? image.id : [image.id]
      deleteHandler(param).then(res => {
        if (res.code === 0) {
          this.$message.success('已删除')
          this.fetchPictureList()
        }
      }).catch(() => {
        reject()
      })
      // },
      // });
    },
  },
  mounted() {
    this.fetchPictureList()
  },
}
</script>

<style lang="less" scoped>
.img-list {
  display: flex;
  // min-height: 40vh;
  flex-wrap: wrap;
  overflow: auto;
  .img-item {
    position: relative;
    margin: 10px;
    height: 80px;
    .img-item-img {
      width: 100px;
      height: 100%;
    }
    // 遮罩层
    .img-item-mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 3px;
      background-color: rgba(0, 0, 0, 0.35);
      display: flex;
      justify-content: center;
      align-items: center;
      .img-item-mask-icon {
        cursor: pointer;
        color: #fff;
        margin: 0 5px;
      }
    }
  }
}
.pagation-comp {
  margin-top: 20px;
  text-align: right;
}
</style>