<template>
  <a-modal
    :visible="visible"
    :footer="null"
    wrapClassName="fullscreen-modal"
    :mask="false"
    :keyboard="false"
    :destroyOnClose="true"
    :closable="false"
    @cancel="doCloseModal"
  >
    <a-spin :spinning="spinning" :tip="spinningText || '加载中...'">
      <div class="perf-modal-content">
        <div class="top-header">
          <a-button type="primary" @click="doCloseModal" size="medium">退出调优页面</a-button>
        </div>
        <div class="main-content">
          <div class="left-box">
            
            <div class="banner-text" v-if="pictureList?.length">请选择需要调优的图片，并点击【运行】生成结果文件</div>
            <div class="banner-sub-text" v-if="pictureList?.length">{{ showTuningImgPage ? '结果图片' : '选择测试图片' }}</div>
            <div class="center-area" id="tuning-center-area">
              <template v-if="pictureList?.length">
                <!-- <a-tooltip title="删除当前图片" >
                  <a-button type="primary" shape="round" icon="delete" class="delete-img-btn" @click="handDeleteImg(currentImg)"></a-button>
                </a-tooltip> -->
                <div class="carousel-area" v-show="!showTuningImgPage">
                  <a-carousel :arrows="false" :dots="false" ref="refCarousel" :afterChange="setCurrentImg">
                    <div v-for="item in pictureList" class="slick-slide-item" :key="item.id">
                      <img :src="imgSrc(item)"/>
                      <svg-icon type="spin" class="running-icon" v-if="running"></svg-icon>
                    </div>
                  </a-carousel>
                </div>
                <!-- 图片调优结果列表 -->
                <div class="img-result-list scrollbar" v-if="showTuningImgPage">
                  <div class="img-result-item" v-for="(item,index) in tuningImgList" :key="index">
                    <p class="img-name" :title="item.picName">{{ item.picName }}</p>
                    <el-image :src="imgSrc(item)" fit="contain" class="img-result-img" @click="doRangefinder(item)"></el-image>
                  </div>
                </div>
              </template>
              <a-empty style="line-height: 30;" :image="simpleImage" v-else>
                <span slot="description"> 未上传图片，请先 <a class="common-link" @click="callUpload">上传图片</a></span>
              </a-empty>
            </div>
            <!-- 缩略图导航 -->
            <div class="slick-dots slick-thumb">
              <a-button type="link" @click="handSelectImg('prev')" v-show="pictureList?.length" class="route-btn"> <a-icon type="left"/></a-button>
              <ul class="slick-thumb-list">
                <li :class="{ 'slick-active': item?.id === currentImg?.id }" class="slick-thumb-item" 
                  @mouseenter="item._showDelBtn = true" @mouseleave="item._showDelBtn = false"
                  v-for="(item,index) in pictureList" :key="item?.id" 
                  @click="handSelectImg(index)" :ref="`thumbItem-${index}`">
                  <a><img :src="imgSrc(item)" /></a>
                  <!-- 删除按钮 -->
                  <transition name="el-fade-in">
                    <div class="slick-thumb-item-mask" v-show="item._showDelBtn">
                      <a-icon type="delete" theme="filled" class="img-item-delete-icon" @click.stop="handDeleteImg(item)" title="删除当前图片"/>
                      <!-- <a-icon type="delete" theme="filled" /> -->
                    </div>
                  </transition>
                  <!-- <a v-show="item._showDelBtn" @click.stop="handDeleteImg(item)" class="common-link delete-btn" size="small" title="删除当前图片"><a-icon type="delete" theme="twoTone" /></a> -->
                </li>
              </ul>
              <a-button type="link" @click="handSelectImg('next')" v-show="pictureList?.length" class="route-btn"> <a-icon type="right" /></a-button>
            </div>
            <div class="bottom-area">
              <a-radio-group v-model="imgSource" button-style="solid">
                <a-radio-button value="local"> 图片来自本地</a-radio-button>
                <a-radio-button value="dataset" disabled>图片来自数据集</a-radio-button>
              </a-radio-group>
              <a-upload ref="refUploadComp" style="display: inline-block;" :showUploadList="false"
                accept="image/*" multiple :beforeUpload="beforeUploadHandle" :customRequest="customUploadHandle">
                <div class="upload-btn"><a class="common-link">点击上传本地图片</a></div>
              </a-upload>
              <a-button type="primary" :disabled="!pictureList?.length" @click="handleRun" :loading="running">{{ showTuningImgPage ? '重新运行': '点击运行' }}</a-button>
            </div>
          </div>
          <param-config class="config-panel" :params = "algoParam" ref="refConfigPanel" :image="currentImg"/>
        </div>
      </div>
    </a-spin>
    <!-- 测距页面 -->
    <rangefinder :visible.sync="showRangefinderModal" v-if="showRangefinderModal" :imageList="tuningImgList" ref="refRangefinder"></rangefinder>
  </a-modal>
</template>

<script>
import rangefinder from './rangefinder.vue';
import paramConfig from './paramConfig.vue';
import { getImageSize } from "@/utils/util.js";
import { getPicList, uploadPic, getSourceImgById, getTaskDeteil, getAlgorithmConfig, saveTuningData, generateTuning, getTuningImgList, getSourceImgByPath, deletePicture } from "@/api/atsMap.js";
import { Empty } from 'ant-design-vue';
const currStep = 24; //原图与算法参数 参见(https://apifox.com/apidoc/shared-0e3fd3ef-d2a3-4018-91d6-f07954c91ee9/api-270114738)
export default {
  name: "tuing",
  components: {
    rangefinder,
    paramConfig,
  },
  data() {
    return {
      spinning: false,  //全局loading
      spinningText: '', //
      imgSource: 'local', //图片来源  本地 or 数据集
      showRangefinderModal: false,
      pictureList: [], //图片列表
      currentImg: {}, //轮播图 当前显示的图片
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
      algoParam: [], //算法参数配置项
      running: false, //正在调优运行中  图片和运行按钮上的 loading
      tuningImgList: [], //调优结果图片列表
    }
  },
  props: {
    // 调优任务data
    taskData: {
      type: Object,
      default: () => ({})
    },
    visible: {
      type: Boolean,
      default: false
    },
  },
  computed: {
    taskId() {
      return this.taskData?.id
    },
    // 当存在调优结果时，控制页面上内容和可操作的按钮
    showTuningImgPage() {
      return this.tuningImgList.length > 0
    },
  },
  methods: {
    imgSrc(item) {
      return item.url || require("@/assets/images/place.gif");
    },
    callUpload() {
      this.$refs.refUploadComp.$refs.uploadRef.$refs.uploaderRef.onClick()
    },
    beforeUploadHandle(file, fileList) {
      // 校验必须是图片格式
      if (file.type.indexOf('image') === -1) {
        this.$message.error('请上传图片格式的文件')
        return false
      }
    },
    customUploadHandle({ file, onProgress, onSuccess, onError }) {
      this.spinning = true
      this.spinningText = '正在上传中...'
      let formParam = new FormData()
      formParam.append('templateMakeId', this.taskId)
      formParam.append('file', file)
      uploadPic(formParam, (progressEvent) => {
        // const percent = (progressEvent.loaded / progressEvent.total * 100 | 0);
        // onProgress({ percent }, file)
      }).then(async res => {
        this.spinning = this.spinningText = false
        if (res.code === 0) {
          // onSuccess(res, file)
          const newImg = { id: res.data, picName: file.name, _showDelBtn: false }
          if (!this.pictureList?.length) { //第一次上传，默认选中第一张图片
            this.currentImg = newImg
          }
          this.pictureList.push(newImg)
          const imgBlob = await getSourceImgById(newImg.id)
          const url = window.URL.createObjectURL(imgBlob)
          this.$set(newImg, 'url', url)
          const imgSize = await getImageSize(url)
          this.$set(newImg, 'height', imgSize.height)
          this.$set(newImg, 'width', imgSize.width)
        }
      }).catch((err) => {
        this.spinning = this.spinningText = false
        onError(err, file)
      })
    },
    // 关闭 modal 直接退出
    async doCloseModal() {
      this.$emit('update:visible', false)
      this.$emit('success')
    },
    // 轮播图切换后设置
    async setCurrentImg(currentIndex) {
      console.log('currentIndex', currentIndex)
      this.currentImg = this.pictureList[currentIndex] || {}
      // 获取当前缩略图图片的 DOM 元素
      const thumbItem = this.$refs[`thumbItem-${currentIndex}`][0];
      if (thumbItem) {
        // 使用 scrollIntoView 滚动到中间
        thumbItem.scrollIntoView({
          behavior: 'smooth', // 平滑滚动
          block: 'center',    // 垂直方向居中
          inline: 'center'    // 水平方向居中
        });
      }
      const imgSize = await getImageSize(this.currentImg.url)
      this.$set(this.currentImg, 'height', imgSize.height)
      this.$set(this.currentImg, 'width', imgSize.width)
    },
    // 导航切换图片
    async handSelectImg(index) {
      if (this.running) return
      const next = () => {
        if (index === 'prev') {
          this.$refs.refCarousel.prev()
        } else if (index === 'next') {
          this.$refs.refCarousel.next()
        } else {
          this.$refs.refCarousel.goTo(index)
        }
      }
      // 如果在显示调优后图片列表时，切换图片，，先清空调优结果图片列表，来返回轮播图视图
      if (this.showTuningImgPage) {
        // 清空调优结果图片列表
        this.tuningImgList = []
        await this.$nextTick()
        // 放在nextTick后也不会触发 afterchange事件，所以这里做一个延时
        setTimeout(() => {
          next()
        }, 500)
      } else {
        next()
      }
    },
    // 删除图片
    handDeleteImg(image) {
      // 二次确认弹框
      this.$confirm({
        title: `确定删除图片${image.picName}吗？`,
        content: '删除后不可恢复',
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          deletePicture([image.id]).then(res => {
            if (res.code === 0) {
              this.$message.success('删除成功')
              // 删除成功后，删除列表中的图片
              const index = this.pictureList.findIndex(item => item.id === image.id)
              this.pictureList.splice(index, 1)
              // 如果删除的是当前显示的图片，将 currentImg 设置为下一张
              if (this.currentImg.id === image.id) {
                // 切换到第一张图片,如果下一张图片不存在，则切换到第一张,注意此时 picturelist 已经删除了图片，所以时 index而不是 index + 1
                const targetIndex = this.pictureList[index] ? index : 0
                // a-carousel会自动切换，这里设置currentImg 用于显示选中框
                this.currentImg = this.pictureList[targetIndex] || {}
              }
            }
          })
        }
      })
    },
    // 跳转到测距页面
    async doRangefinder(item, index) {
      this.showRangefinderModal = true
      this.currentRangefiderImg = item
      await this.$nextTick()
      this.$refs.refRangefinder.focusImage({}, item)
    },
    // 获取图片列表
    async getPictureList() {
      try {
        const picListRes = await getPicList({
          templateMakeInfoId: this.taskId,
          pageNo: 1,
          limit: 999,
        })
        if (picListRes.code === 0) {
          this.pictureList = picListRes.data?.records.map(item => {
            return {
              id: item.id,
              picName: item.picName,
              picUrl: item.picUrl,
              _showDelBtn: false,
            }
          })
          // 遍历去加载图片
          this.pictureList.forEach((item, index) => {
            getSourceImgById(item.id).then(async res => {
              const url = window.URL.createObjectURL(res)
              this.$set(item, 'url', url)
              if (index === 0) { //读取默认 选中的大图（第一张图）的 size
                const imgSize = await getImageSize(url)
                this.$set(this.currentImg, 'height', imgSize.height)
                this.$set(this.currentImg, 'width', imgSize.width)
              }
            })
          })
          // 默认选中第一张
          this.currentImg = this.pictureList[0]
        }
      } catch (e) {
        console.error(e)
      }
    },
    // 获取任务详情
    async getTaskDetailData() {
      // this.spinning = true
      //查询模板详情和图片列表 
      try {
        const result = await getTaskDeteil(this.taskId, { needFrontendConfigs: true })
        if (result.code === 0) {
          this.taskData = result.data
          // 后端的接口用的是周期图拼接的，frontendConfigs在这里只用来存储算法的配置信息json，不再按照步骤来存储各 step 的信息
          // 接口凑合着用吧
          const config = (result.data?.frontendConfigs || []).find(item => item.step == currStep)
          if (config) {
            // 读取已经存在的算法参数配置
            try {
              this.algoParam = JSON.parse(config.config).params
            } catch (e) {
              // 保存的算法参数解析失败
              console.error('保存的算法参数解析失败:', e, '接口响应数据：', result.data?.frontendConfigs)
            }
          } else { //获取算法原始的参数配置
            const algoParamRes = await getAlgorithmConfig()
            this.algoParam = algoParamRes.data?.params || []
            // 渲染算法参数配置
          }
          await this.$nextTick()
          this.$refs.refConfigPanel.init()
        }
        // this.spinning = false
      } catch (e) {
        console.error(e)
        // this.spinning = false
      }
    },
    // 执行调优
    async handleRun() {
      try {
        this.running = true
        // 先校验算法参数
        const algoParams = await this.$refs.refConfigPanel.nextStep()
        // //configBackend要给后端提取算法参数的名称:值，{key: value}
        const configBackend = {}
        algoParams.forEach(item => {
          configBackend[item.name] = item.value
        })
        // 再保存算法参数配置
        const saveRes = await saveTuningData({
          templateMakingInfoId: this.taskId,
          step: currStep + "", //原图与算法参数（接口返回时时 int,这是上送时必须要是 stringi，否则报错）
          config: JSON.stringify({ params: algoParams }),
          configBackend: configBackend,
        })
        // 保存成功后再调用调优接口
        if (saveRes.code === 0) {
          const tuningResult = await generateTuning(this.currentImg.id)
          if (tuningResult.code === 0) {
            // 加载调优结果图片
            this.tuningImgList = (tuningResult.data || []).map(img => {
              return {
                url: '',
                ...img
              }
            })
            this.tuningImgList.forEach(async (item) => {
              const res = await getSourceImgByPath(item.picUrl)
              item.url = window.URL.createObjectURL(res)
            })
          }
        }
        this.running = false
      } catch (e) {
        console.error(e)
        this.running = false
      }
    },
    // 监听键盘按键
    handleKeyDown(event) {
      // 在测距页面时，不做任何处理
      if (this.showRangefinderModal) return
      if (event.key === 'ArrowLeft') {
        this.handSelectImg('prev')
      } else if (event.key === 'ArrowRight') {
        this.handSelectImg('next')
      }
    },
  },
  beforeDestroy() {

    // 移除键盘事件监听
    document.removeEventListener('keyup', this.handleKeyDown);
  },
  created() {
    this.getPictureList()
    document.addEventListener('keyup', this.handleKeyDown);
  },
  mounted() {
    this.getTaskDetailData()
  },
}
</script>

<style lang="less" scoped>
.perf-modal-content {
  background: #f2f2f2;
  .top-header {
    height: 40px;
    line-height: 40px;
    text-align: right;
    padding: 0 20px;
    background-color: #d7edf7;
  }
  .main-content {
    display: flex;
    width: 100%;
    height: calc(100vh - 50px);
    .left-box {
      flex: 1;
      overflow: hidden;
      .common-banner-text {
        height: 35px;
        line-height: 35px;
        text-align: center;
      }
      .banner-text {
        .common-banner-text();
        font-size: 15px;
        color: #e6a23c;
      }
      .banner-sub-text {
        .common-banner-text();
        color: #333;
        font-weight: 700;
      }
    }
    .config-panel {
      margin-top: 10px;
      width: 300px;
      height: calc(100vh - 60px);
    }
  }
}

.center-area {
  height: calc(100vh - 250px);
  // margin-top: 35px;
  position: relative;
  position: relative;
  .delete-img-btn {
    position: absolute;
    right: 20px;
    z-index: 1;
  }
  // 中间大图
  .slick-slide-item {
    cursor: pointer;
    position: relative;
    img {
      // border: 5px solid #fff;
      display: block;
      margin: auto;
      // max-width: 80%;
      height: 60vh;
      width: 60vw;
      object-fit: contain;
    }
    // 运行中loading
    .running-icon {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      font-size: 80px;
    }
  }
  // 调优后图片结果列表
  .img-result-list {
    max-height: 90%;
    display: flex;
    flex-wrap: wrap;
    overflow: auto;
    .img-result-item {
      // width: 150px;
      width: 20%;
      height: 180px;
      margin: 10px;
      .img-name {
        width: 100%;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .img-result-img {
        cursor: pointer;
        width: 100%;
        height: 150px;
      }
    }
  }
}
.bottom-area {
  // ant-radio-button-wrapper的所有子元素不设置 border-radius
  &::v-deep .ant-radio-button-wrapper > * {
    border-radius: 0 !important;
  }
  .upload-btn {
    display: inline-block;
    text-align: center;
    width: 40vw;
    height: 32px;
    line-height: 32x;
    border: 1px solid #ccc;
    vertical-align: middle;
    cursor: pointer;
    margin-right: 50px;
    a {
      line-height: 30px;
    }
  }
}
// 图片轮播导航条
.slick-dots {
  // height: 45px;
  height: 50px;
  margin-bottom: 20px;
  width: 100%;
  display: flex;
  justify-content: center;
  .route-btn {
    height: 40px;
  }
  .slick-thumb-list {
    max-width: calc(100% - 120px);
    display: inline-flex;
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-x: auto; /* 启用水平滚动 */
    scroll-behavior: smooth; /* 平滑滚动 */
    -ms-overflow-style: none; /* IE 和 Edge 隐藏滚动条 */
    scrollbar-width: none; /* Firefox 隐藏滚动条 */
    &::-webkit-scrollbar {
      display: none; /* Chrome, Safari 和 Opera 隐藏滚动条 */
    }
  }
  .slick-thumb-item {
    display: block;
    width: 60px;
    height: 45px;
    margin: 0 5px;
    position: relative;
    // 遮罩层
    .slick-thumb-item-mask {
      position: absolute;
      bottom: 0;
      left: 1px;
      width: 55px;
      height: 30%;
      // border-radius: 3px;
      background-color: rgba(0, 0, 0, 0.35);
      display: flex;
      justify-content: center;
      align-items: center;
      .img-item-delete-icon {
        cursor: pointer;
        color: #1890ff;
        margin: 0 5px;
      }
    }
    // height: 70px;
  }
  .slick-thumb-item img {
    // width: 100%;
    width: 56px;
    height: 100%;
    // filter: grayscale(100%);
    // object-fit: contain;
  }
  .slick-active img {
    // filter: grayscale(0%);
  }
  .slick-active {
    // border: 1px solid red;
    border: 2px solid #1890ff;
  }
}

/deep/ .fullscreen-modal .ant-modal {
  width: 100% !important;
  height: 100vh;
  top: 0;
  padding: 0;
}
/deep/ .fullscreen-modal .ant-modal-body {
  height: 100vh;
  padding: 0 5px 5px;
  // background-color: @bg-color-g;
}
/deep/ .ant-message .anticon {
  vertical-align: 0.125em;
}
</style>