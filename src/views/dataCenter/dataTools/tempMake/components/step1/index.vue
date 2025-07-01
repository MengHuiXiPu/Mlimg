<template>
  <div class="editor-wrapper">
    <div class="editor-content" ref="divRef" id="divRef"></div>
     <!-- Tooltip 浮层 -->
    <div v-show="showTooltip" class="position-tooltip" :style="tooltipStyle">
      X: {{ tooltipX }}, Y: {{ tooltipY }}
    </div>
    <toolbar class="toolbar" v-if="appIsReady"></toolbar>

    <transition name="rightBox-fade">
      <div v-if="showPictureList" class="picture-list scrollbar">
        <div
          class="img-box"
          ref="imgBox"
          v-for="item in pictureList"
          :key="item.id"
        >
          <div class="img-name" :title="item.picName">{{item.picName}}</div>
          <img :id="'pic_' + item.id" :src="imgSrc(item)" @dragend="addToCanvas($event, item)"/>
        </div>
      </div>
    </transition>
    <config-panel class="right-panel scrolbar" @emitEvent="handEmitEvent" :state="currentImage" :frameConfig="frameConfig"></config-panel>
    <!-- <a-button type="primary" @click="exportCanvas">导出</a-button> -->
  </div>
</template>

<script>
let app = null
let frame = null
let guideLines = null
import configPanel from "./configPanel.vue";
import { App, Rect, Text, Canvas, Line, RenderEvent, Leafer, Frame, Ellipse, Box, Image, ImageEvent, PointerEvent, ZoomEvent } from 'leafer-ui';
import { Editor, EditorEvent, EditorRotateEvent, EditorMoveEvent } from '@leafer-in/editor' // 导入图形编辑器插件
import '@leafer-in/editor';
import '@leafer-in/export';
import '@leafer-in/viewport' // 导入视口插件
import '@leafer-in/find'
import '@leafer-in/animate'
// import { Snap } from 'leafer-x-snap';
import { Ruler } from 'leafer-x-ruler';
import { onMounted, onUnmounted, ref, watch, nextTick, reactive, set } from 'vue'
// import { debounce, throttle } from "lodash"
import { useMagicKeys, useActiveElement } from '@vueuse/core';
import { useSetApp, useSetFrame, useGetFEConfigs, useSetFEConfigs, useClearData, useGetApp } from "../../store.js";
import { getPicList, getSourcePic, saveEditorData, uploadTempPic, getPicByPath } from "@/api/tempMake.js";
import { useDeleteEle, usePointerPosTooltip } from "../hooks.js";
import toolbar from "../toolbar.vue"
import { GuideLines } from 'leafer-x-guide-line'
export default {
  name: "step1",
  components: {
    configPanel,
    toolbar,
  },
  props: {
    // 模板数据
    tempData: {
      type: Object,
      default: () => ({})
    },
    showLoading: {
      type: Function,
      default: () => { }
    },
    closeLoading: {
      type: Function,
      default: () => { }
    },
  },
  data() {
    return {
      showPictureList: true,
      pictureList: [],
    }
  },
  methods: {
    handEmitEvent(eventName, value) {
      switch (eventName) {
        case 'locked':
          this.target.locked = value
          break;
        case 'rotate':
          // 基础角度
          const baseAngle = this.target.rotation
          // 围绕rect 的中心点旋转
          this.target.rotateOf('center', value - baseAngle, true)
          break;
        case 'crop':
          this.cropImage()
          break;
        case 'toggleGuideLine':
          // guideLines.changeEnabled(value)
          guideLines.enabled = value
          break;
        default:
          break;
      }
    },
    getPictureList() {
      // const { pageNo, limit } = this.pagination
      getPicList({
        templateMakeInfoId: this.tempData.id,
        pageNo: 1,
        limit: 999,
      }).then(res => {
        if (res.code === 0) {
          // this.pagination.total = res.data.total
          this.pictureList = res.data.records.map(item => {
            return {
              id: item.id,
              picName: item.picName,
              picUrl: item.picUrl,
            }
          })
          // 遍历去加载图片
          this.pictureList.forEach(item => {
            getSourcePic(item.id).then(res => {
              const url = window.URL.createObjectURL(res)
              this.$set(item, 'url', url)
            })
          })
        }
      })
    },
    imgSrc(item) {
      return item.url || require("@/assets/images/place.gif");
    },
    cropImage() {
      const cid = this.currentImage.id
      const currImage = frame.findId(cid)
      if (!currImage) {
        console.error("未找到当前图片，frame.findOne异常")
        return
      }
      const { topPx, leftPx, bottomPx, rightPx } = this.currentImage.cropData
      // console.log('currImage', currImage)
      // 更新currentImage中的位置和尺寸
      this.currentImage.position.x = this.currentImage.position.x + leftPx / 2
      this.currentImage.position.y = this.currentImage.position.y + topPx / 2
      this.currentImage.width = currImage.width - leftPx - rightPx
      this.currentImage.height = currImage.height - topPx - bottomPx
      const cropRect = new Rect({
        id: cid,
        width: 0,
        height: 0,
        editable: true,
        zIndex: -1, //避免添加再删除的闪烁问题
        x: this.currentImage.position.x + leftPx / 2,
        y: this.currentImage.position.y + topPx / 2,
        fill: {
          type: 'image',
          url: currImage.url,
          crossOrigin: 'anonymous',
          mode: 'clip',
          offset: { x: 0, y: 0 },
          // scale: { x: 1.1, y: 1.1 },
          // rotation: 20
        }
      })
      // 调整裁剪区域尺寸
      cropRect.width = this.currentImage.width
      cropRect.height = this.currentImage.height
      // 调整图片在裁剪区域内的位置
      cropRect.fill.offset.x = -leftPx
      cropRect.fill.offset.y = -topPx

      // 将裁剪区域添加到画布
      frame.add(cropRect)
      // 将cropRect导出为图片，作为新的图片的 url add到 frame，这样才能让用户继续裁剪
      cropRect.export('png').then(async res => {
        // console.log("导出裁剪后的结果", res)
        const image = new Image({
          id: cid,
          // name: this.currImage.picName,
          url: res.data,
          draggable: true,
          dragBounds: 'parent', // 限制元素拖动范围 
          editable: true,
          crossOrigin: 'anonymous',
          x: this.currentImage.position.x,
          y: this.currentImage.position.y,
          rotation: this.currentImage.rotation,
          // resizeable: false,
          // rotateable: true, // 允许旋转
        })
        // 再以 blob 导出一次(或者将base64 转为 blob)
        cropRect.export('png', { blob: true }).then((blocRes) => {
          // 必须set到currentImage.blobUrl,用来存储裁剪后的图片，(因为服务器上只有原图，没有裁剪后的图片)
          this.currentImage.blobUrl = blocRes.data
          // 移除截取框
          frame.remove(cropRect)
          // 移除 frame上的原始图片
          frame.remove(currImage)
          frame.add(image)
          // 务必在 loaded 后选中，否则下面的选中无法触发
          image.once(ImageEvent.LOADED, e => {
            app.editor.select(image)
          })
          // console.log('psd currentImage', this.currentImage)
        })
      })
      // 移除原始图片
      // frame.remove(currImage)
    },
    /**
     * @public
     */
    nextStep(isExit = false) {
      return new Promise(async (resolve, reject) => {
        const ImageList = app.find('Image')
        console.log('ImageList', ImageList)
        if (!ImageList.length) {
          if (isExit) resolve()
          else this.$message.error('请添加图片')
          return
        }
        this.showLoading('信息保存中...')
        try {
          // 生成画布快照图片 blob
          const combineImage = await this.getCombineImage(true)
          // 找到所有经过裁剪的图片
          const cropedImages = this.psdList.filter(item => !!item.blobUrl)
          const formData = new FormData()
          cropedImages.forEach(item => {
            // 使用 '.' 分割文件名，获取扩展名
            // const parts = item.picName.split('.') || [];
            // // 返回最后一个部分，即扩展名
            // const extension = parts[parts.length - 1];

            // const imgName = `${name}_croped_${new Date().getTime()}.${extension || 'png'}`
            const imgName = item.picName
            formData.append('fileList', new File([item.blobUrl], imgName, {
              type: 'image.png',
            }))
            console.log("上传图片名称", imgName, item)
          })
          // 添加合成图
          formData.append('fileList', new File([combineImage], `${this.tempData.name}_combine_${new Date().getTime()}.png`, {
            type: 'image.png',
          }))
          formData.append('templateMakeId', this.tempData.id)
          const uploadPicRes = await uploadTempPic(formData)
          const pathList = uploadPicRes.code === 0 ? (uploadPicRes.data || []) : []
          // 取最后一个路径给combineImagePath
          let combineImagePath = pathList[pathList.length - 1]
          // 上传后接口按照顺序返回 path,前端也需要按照顺序，update 到 psdList
          cropedImages.forEach((img, index) => {
            img.picUrl = pathList[index]
          })
          // console.log('uploadPicRes', uploadPicRes)
          // 上传合成的图片，裁剪的图片，
          // const json = app.tree.toJSON()
          this.psdList.forEach(item => {
            delete item.url  // 删除url，本地 blob 对象地址，存给后台没有意义
            delete item.blobUrl
          })
          // console.log("psdList", this.psdList)
          const json = {
            frameConfig: this.frameConfig,
            psdList: this.psdList,
            // 合成图
            combineImagePath: combineImagePath,
          }
          const saveRes = await saveEditorData({
            templateMakingInfoId: this.tempData.id,
            step: 1,
            config: JSON.stringify(json),
          })
          this.closeLoading()
          if (saveRes.code == 0) {
            // 更新到 store
            useSetFEConfigs(JSON.stringify(json), 1)
            resolve()
          }
          else reject("保存画布参数异常")
        } catch (error) {
          this.closeLoading()
          console.error(error)
          reject(error)
        }

      })
    },
    // 获取合成的图片(默认 base64)
    getCombineImage(isBlob = false) {
      return new Promise((resolve, reject) => {
        frame.export('canvas').then(result => {
          const leaferCanvas = result.data
          const imgData = leaferCanvas.export('png', isBlob)
          // leaferCanvas.export(`${this.tempData.name}.png`)
          resolve(imgData)
        }).catch(err => {
          reject(err)
        })
      })
    },
    // 将点击的图片添加到画布
    addToCanvas(event, item) {
      event.preventDefault()
      // 转换浏览器事件坐标为 app 的画布坐标
      const worldPosition = app.getWorldPointByClient(event)
      // app 画布坐标转换为 frame 坐标(frame 才是真正的图片承载体)
      const localPosition = frame.getLocalPoint(worldPosition)
      // 拖拽放置点在图片外时，不做添加操作
      if (localPosition.x > this.frameConfig.width + 100) return

      const { picName, picUrl } = item
      const picId = item.id
      const id = new Date().getTime()
      // console.log('x,y', localPosition.x, localPosition.y)

      const image = new Image({
        id, //图片 id 要和添加到画布上的图片 id 区分
        picId, //用于还原画布内容时加载图片
        name: item.picName,
        url: item.url,
        draggable: true,
        dragBounds: 'parent', // 限制元素拖动范围 
        editable: true,
        crossOrigin: 'anonymous', // 解决跨域问题
        // resizeable: false,
        // rotateable: true, // 允许旋转
      })
      image.once(ImageEvent.LOADED, (e) => {
        const imgWidth = e.image.width
        const imgHeight = e.image.height
        // 调整图片的中心点位置为拖拽的位置
        image.x = localPosition.x - imgWidth / 2 > 0 ? localPosition.x - imgWidth / 2 : 0;
        image.y = localPosition.y - imgWidth / 2 > 0 ? localPosition.y - imgHeight / 2 : 0;
        // 调整 frame 的尺寸，以适应图片尺寸
        const _width = frame.width
        const _height = frame.height
        const padding = 500
        const maxWidth = Math.ceil(Math.max(localPosition.x + imgWidth / 2 + padding, _width, imgWidth + padding))
        const maxHeight = Math.ceil(Math.max(localPosition.y + imgHeight / 2 + padding, _height, imgHeight + padding))
        frame.width = maxWidth
        frame.height = maxHeight
        // 如果超出画布，则自动放大画布
        if (frame.width > _width || frame.height > _height) {
          this.zoomToFit()
        }
        // 更新画布尺寸
        this.frameConfig.width = frame.width
        this.frameConfig.height = frame.height
        // 添加到 psdList队列
        this.psdList.push({
          id,
          picId,
          picName,
          picUrl, //数据库存储的图片 path
          blobUrl: '', //如果存在裁剪，则将裁剪后的blob 放在这里上传到后端
          showPanel: false, //是都显示右侧配置信息
          width: imgWidth,
          height: imgHeight,
          position: { //位置坐标
            x: image.x,
            y: image.y,
          },
          rotation: 0, // 旋转角度
          locked: false, //锁定
          zIndex: image.zIndex, // 层级
          // 裁剪数据
          cropData: {
            topPx: 0,
            leftPx: 0,
            bottomPx: 0,
            rightPx: 0,
          },
        })
        // console.log("psdList", this.psdList)
      })
      // 添加到frame画布，拖拽移动时会联动标尺
      frame.add(image)
    }
  },
  created() {
    this.getPictureList()
  },
  setup(props) {
    // const keys = useMagicKeys();
    const target = ref(null); //编辑器 target
    const showTooltip = ref(false);
    const tooltipX = ref(0);
    const tooltipY = ref(0);
    const tooltipStyle = ref({});
    const appIsReady = ref(false);
    const frameConfig = ref({
      width: 1000,
      height: 600,
      guideLinesEnabled: false,  //是否启用辅助线
    })
    // 已保存的 在画布上的图片列表(类似 psd 文件)，保存到后端并在再次进入第一步时还原画布元素
    const psdList = ref([])
    const currentImage = ref({
      position: {},
      cropData: {}
    })
    const zoomToFit = () => {
      app = useGetApp()
      app.tree.zoom('fit', 50, null, true)
      // 不知道为何，toolbar 中监听不到 手动调用app.tree.zoom()的缩放事件的,只能监听到鼠标滚轮触发的 zoom 事件，所以这里手动触发
      app.tree.emit(ZoomEvent.ZOOM)
    }
    // 将接口保存的画布内容，添加/绘制到画布中
    const renderGraph = (jsonData) => {
      console.log('jsonData', jsonData)
      const { psdList, } = jsonData
      // set 画布尺寸
      frame.width = jsonData.frameConfig.width
      frame.height = jsonData.frameConfig.height
      frameConfig.value = jsonData.frameConfig
      psdList.forEach(item => {
        const image = new Image({
          id: item.id,
          picId: item.picId,
          name: item.picName,
          url: item.url,
          x: item.position.x,
          y: item.position.y,
          rotation: item.rotation,
          locked: item.locked,
          zIndex: item.zIndex,
          draggable: true,
          dragBounds: 'parent', // 限制元素拖动范围 
          editable: true,
          crossOrigin: 'anonymous', // 解决跨域问题
          // resizeable: false,
          // rotateable: true, // 允许旋转
        })
        frame.add(image)
      })
      zoomToFit()
    }
    // 绑定事件监听
    const bindEvent = (app) => {
      app.editor.on(EditorEvent.SELECT, (event) => {
        // console.log("编辑器选择目标", app.editor.target)
        // 获取数据，传递给右侧配置面板
        const _target = app.editor.target
        // console.log("_target", _target)
        if (!_target) {
          currentImage.value && (currentImage.value.showPanel = false)
          return
        }
        // 获取数据，传递给右侧配置面板
        currentImage.value = psdList.value.find(psd => psd.id === _target.id) || {}
        currentImage.value = Object.assign(currentImage.value, {
          showPanel: _target ? true : false,
          width: _target?.width || 0,
          height: _target?.height || 0,
          position: {
            x: Math.ceil(_target?.x || 0),
            y: Math.ceil(_target?.y || 0),
          },
          rotation: _target?.rotation || 0, // 旋转角度
          locked: _target?.locked || false, //锁定
          zIndex: _target?.zIndex || 0, // 层级
        })
        target.value = app.editor.target
      })

      app.editor.on(EditorRotateEvent.ROTATE, (event) => {
        // console.log("旋转：", event)
        currentImage.value.rotation = event.target?.rotation || 0
      })
      app.editor.on(EditorMoveEvent.MOVE, (event) => {
        // 取整
        event.target.x = Math.ceil(event.target.x)
        event.target.y = Math.ceil(event.target.y)
        currentImage.value.position = { x: event.target.x, y: event.target.y }
      })
    }
    const initGuideLine = () => {
      // 修改默认配置项
      guideLines = new GuideLines(app, {
        // 是否启用吸附线
        enabled: false,
        // 吸附距离
        alignLineMargin: 5,
        // 对齐线宽
        // alignLineWidth: 1,
        // 标记点大小
        // signSize: 3,
        // 对齐线条颜色
        // alignLineColor: '#F68066'
        // distance: {
        //   show: true,
        //   fillStyle: '#F68066',
        // }
      })
      // guideLines.enabled = false
    }
    onMounted(async () => {
      await nextTick()
      app = new App({
        view: 'divRef',
        // grow: true, //
        // top: 100,
        // left: 100,
        fill: '#F2F2F2', // 背景色
        zoom: { min: 0.02, max: 256 },
        move: {
          drag: "auto"
        },
        ground: { type: 'viewport' },
        editor: {
          resizeable: false, //禁止调整大小
          skewable: false, // 禁止倾斜
          rotateable: true, // 允许旋转
          circle: { width: 16, height: 16 },
        },
        // sky: { type: 'draw', usePartRender: false },
        tree: { type: 'viewport' }, // 添加 tree 层
        sky: {}  // 添加 sky 层
      });

      const ruler = new Ruler(app);
      // 创建并添加画布
      frame = new Frame({
        width: frameConfig.value.width,
        height: frameConfig.value.height,
        // position: { x: 100, y: 100 },
        // x: 100,
        // y: 100,
        // fill: '#FF4B4B',
        overflow: 'hide',
        editable: false,
        // lockRatio: true,
        resizeChildren: true,
      });
      // console.log("frame创建：", frame)
      app.tree.add(frame);
      useSetApp(app)
      useSetFrame(frame)
      zoomToFit()
      appIsReady.value = true
      // 
      showTooltip.value = usePointerPosTooltip(frame).showTooltip
      tooltipX.value = usePointerPosTooltip(frame).tooltipX
      tooltipY.value = usePointerPosTooltip(frame).tooltipY
      tooltipStyle.value = usePointerPosTooltip(frame).tooltipStyle
      // const { showTooltip, tooltipX, tooltipY, tooltipStyle  } = usePointerPosTooltip(frame)

      // 绑定删除键
      useDeleteEle(() => {
        let _app = app || useGetApp()
        if (_app.editor?.target) {
          _app.editor.target.remove();
          // 在 psdList 中移除对应的图片
          const idx = psdList.value.findIndex(item => item.id === _app.editor.target.id);
          psdList.value.splice(idx, 1)
          // console.log("psdList", psdList.value)
        }
      })
      // 获取保存的画布上的内容
      const getSavedData = async () => {
        try {
          const configString = useGetFEConfigs(1)
          if (configString) { //加载对应的图片
            const configObj = JSON.parse(configString)
            // console.log(json)
            psdList.value = configObj.psdList
            await Promise.allSettled(configObj.psdList.map(item => {
              // 在数据库中的图片
              return getPicByPath(item.picUrl)
            })).then(list => {
              list.forEach((sourceUrl, idx) => {
                if (sourceUrl.value) {
                  // set(json.psdList[idx], 'url', window.URL.createObjectURL(sourceUrl.value))
                  configObj.psdList[idx].url = window.URL.createObjectURL(sourceUrl.value)
                }
              })
              renderGraph(configObj)
            })
          }
        } catch (e) {
          console.error(e)
        }
      }
      initGuideLine(app)
      getSavedData()
      bindEvent(app)
    })
    onUnmounted(() => {
      frame.destroy()
      app.destroy()
      app = null
      frame = null
      guideLines = null
      useClearData()
    })
    return {
      appIsReady,
      showTooltip,
      tooltipX,
      tooltipY,
      tooltipStyle,
      frameConfig,
      psdList,
      currentImage,
      target,
      currentImage,
      zoomToFit,
    }
  }
}
</script>

<style lang="less" scoped>
.editor-wrapper {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: row;
  .right-panel {
    width: 280px;
    height: 100%;
    padding: 0 15px;
    overflow: auto;
    border-left: 1px solid #e8e8e8;
  }
  .picture-list {
    // width: auto;
    width: 168px;
    height: 100%;
    overflow: auto;
    .img-box {
      position: relative;
      padding: 4px;
      cursor: pointer;
      & > img {
        width: 150px;
        height: 84px;
      }
      .img-name {
        text-align: center;
        font-size: 12px;
        // 超出显示省略号
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 150px;
      }
    }
  }
  .editor-content {
    // flex: 1;
    width: calc(100% - 280px - 170px);
    // height: calc(100vh - 80px);
    height: calc(100vh - 90px);
  }
  // background: red;
}
.position-tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none; /* 防止 Tooltip 干扰鼠标事件 */
  z-index: 1000; /* 确保 Tooltip 在最上层 */
}
.toolbar {
  position: absolute;
  top: 20px;
  right: 470px;
}
&::v-deep .anticon {
  vertical-align: 0 !important;
}
</style>