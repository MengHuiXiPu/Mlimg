<template>
  <div class="editor-wrapper">
    <div class="editor-content" ref="divCropImageRef" id="divCropImageRef"></div>
    <div class="right-panel">
      <a-form-model
        ref="refConfigForm"
        :label-col="{ span: 11 }"
        :wrapper-col="{ span: 12 }"
        layout="horizontal"
        :model="cropData"
      >
        <a-form-model-item label="起点x坐标" prop="startX">
          <a-input-number v-model="cropData.startX" size="small" :min="0"  :precision="0" :step="1" style="width: 90%" @change="handleCropDataChange"/>
        </a-form-model-item>
        <a-form-model-item label="起点y坐标" prop ="startY">
          <a-input-number v-model="cropData.startY" size="small" :min="0"  :precision="0" :step="1" style="width: 90%" @change="handleCropDataChange"/>
        </a-form-model-item>
        <a-form-model-item label="宽度(px)" prop ="width">
          <a-input-number v-model="cropData.width" size="small" :min="0" :max="sourceImageSize.width" :precision="0" :step="1" style="width: 90%" @change="handleCropDataChange"/>
        </a-form-model-item>
        <a-form-model-item label="高度(px)" prop ="height">
          <a-input-number v-model="cropData.height" size="small" :min="0" :max="sourceImageSize.height" :precision="0" :step="1" style="width: 90%" @change="handleCropDataChange"/>
        </a-form-model-item>
      </a-form-model>
      <a-row class="crop-rect-info" style="margin-bottom: 22px;">
        <a-col :span="12" style="color:#333333">合成图像素大小：</a-col>
        <a-col :span="10">{{ `${sourceImageSize.width} * ${sourceImageSize.height}` }}</a-col>
      </a-row>
      <a-row class="crop-rect-info">
        <a-col :span="12" style="color:#333333">截取框像素大小：</a-col>
        <a-col :span="10">{{ `${cropData.width} * ${cropData.height}` }}</a-col>
      </a-row>
      <div class="space-between" style="margin: 20px 10px">
        <a-button type="primary" size="medium" @click="handleCropImage" :disabled="!canCut">手动截取</a-button>
        <a-button type="primary" size="medium" disabled>智能截取</a-button>
      </div>
      <el-image v-if="cropedImagebase64Url" class="crop-image" :src="cropedImagebase64Url" :preview-src-list="[cropedImagebase64Url]" fit="contain" @load="handleCropImageLoad"></el-image>
      <div style="text-align: center;" v-show="cropedImgInfo.width">图片像素：{{ cropedImgInfo.width }} * {{ cropedImgInfo.height }}</div>
    </div>
     <!-- Tooltip 浮层 -->
    <div v-show="showTooltip" class="position-tooltip" :style="tooltipStyle">
      X: {{ tooltipX }}, Y: {{ tooltipY }}
    </div>
  </div>

</template>

<script>
// step2 裁剪图片
import { App, Rect, Frame, Image, ImageEvent, PointerEvent } from 'leafer-ui';
import { EditorScaleEvent, EditorMoveEvent } from '@leafer-in/editor' // 导入图形编辑器插件
import '@leafer-in/editor';
import '@leafer-in/export';
import '@leafer-in/viewport' // 导入视口插件
import '@leafer-in/view';
import '@leafer-in/find';
import { Ruler } from 'leafer-x-ruler';
import { onMounted, ref, watch, nextTick, reactive, onActivated, onDeactivated } from 'vue'
import { getPicByPath } from "@/api/tempMake.js";
import { useDeleteEle } from "../hooks.js";
import { debounce } from "lodash"
import { message as Message } from "ant-design-vue"
import { useSetApp, useSetFrame, useGetFEConfigs, useSetFEConfigs } from "../../store.js";
import { getSingleDataListDetailById, getPictureIdPageList } from "@/api/dataCenter";
import { getPicture, getFileCategoryAndCount } from "@/api/modelManage";
let app = null
let frame = null
export default {
  name: 'step2',
  data() {
    return {
      // 裁剪后图片的信息
      cropedImgInfo: {
        width: 0,
        height: 0,
      }
    }
  },
  props: {
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
  computed: {
    canCut() {
      return this.cropData.height > 0 && this.cropData.width > 0
    }
  },
  methods: {
    /**
     * @public
     * isexit 
     */
    nextStep() {
      return new Promise((resolve, reject) => {
        // this.tempData.splicedPic.remark是裁剪后生成的虚拟数据集
        // 用户没有裁剪图片，但是之前已裁剪过，只是返回来查看，此时 resolve(),直接下一步
        // 根据是否是 base64 来判断是否是新截取的图片(以data:image/开头)
        const isBase64 = typeof (this.cropedImagebase64Url) === 'string' && this.cropedImagebase64Url.startsWith('data:image/')
        if (this.cropedImagebase64Url) {
          resolve({ cropedImagebase64Url: this.cropedImagebase64Url, isNewCut: isBase64, config: { width: this.cropData.width, height: this.cropData.height } })
        } else {
          Message.error("请先裁剪图片")
          reject('请先裁剪图片')
        }
      })
    },
    async fetchDsDetails() {
      // 数据集 id
      const dsId = this.tempData.splicedPic?.remark
      if (!dsId) return
      this.showLoading('图片加载中...')
      try {
        // 先获取数据集详情
        // const dsDetail = await getSingleDataListDetailById(parseInt(dsId))
        // if (dsDetail.code === 0) {
        // 获取类别列表，用类别再去查图片 id
        const catRes = await getFileCategoryAndCount({
          id: dsId,
          markRange: 0,
          reviewRange: 0
        })
        let category = ""
        if (catRes.code === 0) {
          category = catRes.data.DataListCategory[0]
        }
        // 获取数据集的图片id列表(虽然只有一张)
        const idRes = await getPictureIdPageList({
          categoryName: category,
          markRange: 0,
          limit: 1000,
          pageNo: 1,
          // reviewRange: 0,
          id: dsId
        })
        if (idRes.code === 0) {
          const imageId = idRes.data.records[0].id
          // 根据 id 去加载图片
          const blob = await getPicture(imageId)
          const url = window.URL.createObjectURL(blob)
          this.cropedImagebase64Url = url
          // this.isReady = true
        }
        this.closeLoading()
        // }
      } catch (e) {
        this.closeLoading()
        console.error(e)
      }
    },
    // 截图加载后，获取截图的像素
    handleCropImageLoad(event) {
      if (event.target.complete) {
        const image = event.target
        this.cropedImgInfo.width = image.naturalWidth
        this.cropedImgInfo.height = image.naturalHeight
      }
    }
  },
  created() {
    this.fetchDsDetails()
  },
  setup(props) {
    let startPos = null
    let isDrawing = false
    let cropRect = null //鼠标创建的选区rect实例
    const showTooltip = ref(false);
    const tooltipX = ref(0);
    const tooltipY = ref(0);
    const tooltipStyle = ref({});
    let draggable = false // 是否可拖拽画布
    let cropData = reactive({
      startX: 0,
      startY: 0,
      width: 0,
      height: 0,
    })
    let imageUrl = ""  //待裁剪的图片的 url（原始图片）
    let cropedImagebase64Url = ref("") //裁剪后的图片的 url，手动截取时是 base64，反显数据集保存的图片时是 blob
    let sourceImageSize = ref({
      width: 0,
      height: 0
    })
    Message.config({ top: `100px`, })
    const updateCropData = (x, y, width, height) => {
      cropData = Object.assign(cropData, {
        startX: Math.ceil(x),
        startY: Math.ceil(y),
        width: Math.ceil(width),
        height: Math.ceil(height),
      })
    }
    /**
     * @description 创建截取框选区
     */
    const initSelection = () => {
      app.on(PointerEvent.DOWN, (event) => {
        if (!isDrawing && !app.editor.target) {
          const localPos = event.getPagePoint();
          // 记录起点
          startPos = { x: localPos.x, y: localPos.y }
        }
      })
      app.on(PointerEvent.MOVE, (event) => {
        if (startPos && !cropRect) {
          isDrawing = true  // 标记正在绘制
        }
      })
      app.on(PointerEvent.UP, (event) => {
        if (isDrawing) {
          const localPos = event.getPagePoint();
          const _x = Math.min(startPos.x, localPos.x)
          const _y = Math.min(startPos.y, localPos.y)
          const _width = Math.abs(localPos.x - startPos.x)
          const _height = Math.abs(localPos.y - startPos.y)
          cropRect = new Rect({
            x: _x,
            y: _y,
            width: _width,
            height: _height,
            stroke: '#1890FF',
            strokeWidth: 2,
            dashPattern: [5, 5],
            // fill: null, // 不填充 null
            // fill: "rgba(255, 0, 0, 0.3)",
            fill: "transparent",
            editable: true,
          })
          frame.add(cropRect)
          app.editor.target = cropRect
          // 将画布设置为可拖拽
          draggable = "auto"
          // 将尺寸，坐标更新到 cropData
          updateCropData(_x, _y, _width, _height)
        }
        // 重置startPos和isDrawing，便于记录下一个绘制
        startPos = null
        isDrawing = false
      })
    }
    // 监听鼠标移动事件
    const positionObserver = () => {
      // 监听鼠标移动事件
      const throttledMouseMove = (event) => {
        const { x, y } = event // 获取鼠标在 Frame 上的坐标
        // 获取鼠标在画布上的坐标
        const localPos = event.getLocalPoint();
        // console.log('Frame 局部坐标:', localPos.x, localPos.y)
        // 更新 Tooltip 的坐标
        tooltipX.value = localPos.x.toFixed();
        tooltipY.value = localPos.y.toFixed();

        // 更新 Tooltip 的位置
        tooltipStyle.value = {
          left: `${x + 10}px`, // 稍微偏移，避免 Tooltip 遮挡鼠标
          top: `${y + 10}px`,
        };
      }
      frame.on(PointerEvent.ENTER, () => {
        // 显示 Tooltip
        showTooltip.value = true;
      })
      frame.on(PointerEvent.MOVE, throttledMouseMove)
      // 当鼠标移出 Frame 时隐藏 Tooltip
      frame.on(PointerEvent.LEAVE, () => {
        showTooltip.value = false;
      });
    }
    /**
     * 初始化画布
     */
    const initLeafer = () => {
      app = new App({
        view: 'divCropImageRef',
        tree: { type: 'viewport' }, // 给 tree 层添加视口  //
        sky: {},
        ground: { type: 'viewport' },
        fill: '#F2F2F2', // 背景色
        // grow: true, // 自动生长 贴合画布内容
        zoom: { min: 0.02, max: 256 },
        move: {
          drag: draggable,
          // disabled: true,
          // dragEmpty: true,
          // drag: false,
          // dragOut: true
        },
        editor: {
          resizeable: true, //调整大小
          skewable: false, // 禁止倾斜
          rotateable: false, // 禁止旋转
        },
      })
      // requestAnimationFrame(() => {
      // app.tree.zoom(0.8)
      // })
      // 创建并添加画布
      frame = new Frame({
        name: 'frame',
        width: 0,
        height: 0,
        editable: false,
        resizeChildren: true,
      });
      app.tree.add(frame)
      const ruler = new Ruler(app);
      positionObserver()
      initSelection()
      useDeleteEle(() => {
        if (app?.editor?.target) {
          app.editor?.target.remove();
          // 将画布设置为可交互(鼠标移动是框选)
          draggable = false
          cropRect = null;
          startPos = null
        }
      })
    }
    // 加载大图
    const fetchIamge = async (path) => {
      props.showLoading('图片加载中...')
      try {
        // 清空画布上的现有图片 todo..
        const picResult = await getPicByPath(path)
        props.closeLoading()
        imageUrl = window.URL.createObjectURL(picResult)
        // 将图片添加到 leafer
        const image = new Image({
          url: imageUrl,
          draggable: false,
          crossOrigin: 'anonymous', // 解决跨域问题
          cursor: 'crosshair'
        })
        image.once(ImageEvent.LOADED, function (e) {
          // console.log(e.image.width, e.image.height)
          sourceImageSize.value = {
            width: e.image.width,
            height: e.image.height
          }
          const _width = frame.width
          const _height = frame.height
          if (e.image.width > _width || e.image.height > _height) {
            frame.width = e.image.width
            frame.height = e.image.height
            app.tree.zoom('fit')
          }
          // 将截取框的尺寸默认设置为原图尺寸
          updateCropData(0, 0, e.image.width, e.image.height)
        })
        // 添加到frame画布，拖拽移动时会联动标尺
        frame.add(image)
      } catch (err) {
        props.closeLoading()
        Message.error("资源加载失败")
      }
    }
    /**
     * 监听编辑器resize 事件，更新到右侧裁剪信息
     */
    const resizeObserver = () => {
      app.editor.on(EditorScaleEvent.SCALE, (event) => {
        // console.log("缩放：", event.target.width)
        const { x, y, width, height } = event.target
        updateCropData(x, y, width, height)
      })
      app.editor.on(EditorMoveEvent.MOVE, (event) => {
        const { x, y, width, height } = event.target
        updateCropData(x, y, width, height)
      })
    }
    const methods = {
      handleCropDataChange: debounce(() => {
        const { startX, startY, width, height } = cropData
        // 修改编辑框的尺寸和位置
        if (cropRect) {
          cropRect.width = width
          cropRect.height = height
          cropRect.x = startX
          cropRect.y = startY
        }
      }, 500),
      handleCropImage: () => {
        // if (!cropRect) return Message.warning("请先用鼠标创建截取区域")
        // 根据cropData，构建裁剪区域
        const { startX, startY, width, height } = cropData
        // 临时生成的裁剪选区
        const tempCropRect = new Rect({
          width: width,
          height: height,
          zIndex: -1, // 避免在插入和移除时，画布视觉闪烁，故放在画布下方
          fill: {
            type: 'image',
            url: imageUrl,
            mode: 'clip',
            offset: { x: -startX, y: -startY },
            // scale: { x: 1.1, y: 1.1 },
            // rotation: 20
          }
        })
        // 必须添加上才能导出
        frame.add(tempCropRect)
        tempCropRect.export('png').then((res) => {
          // 获取裁剪后的图片URL
          cropedImagebase64Url.value = res.data
          // console.log('裁剪结果', res)
          // 移除用于裁剪的tempCropRect
          tempCropRect.remove()
        })
      },
    }
    onMounted(async () => {
      await nextTick()
      initLeafer()
      resizeObserver()
    })
    // 因为外面是以 kepp-alive+动态组件的方式使用，所以第一次加载也会触发 actived，避免重复执行，将数据渲染逻辑放在 actived里面
    onActivated(async () => {
      // await nextTick()
      const configString = useGetFEConfigs(1)
      const configObj = JSON.parse(configString)
      // console.log('第一步保存的数据', configObj)
      fetchIamge(configObj.combineImagePath)
    })
    onDeactivated(() => {
      cropRect && cropRect.remove()
      cropRect = null;
      startPos = null
      // RectList = app.find('Rect') || []
      // RectList.forEach(rect => {
      //   rect.remove()
      // });
    })
    return {
      showTooltip,
      tooltipX,
      tooltipY,
      tooltipStyle,
      cropData,
      cropedImagebase64Url,
      sourceImageSize,

      ...methods
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
  position: relative;
  .editor-content {
    // flex: 1;
    width: calc(100% - 280px);
    // height: calc(100vh - 80px);
    height: calc(100vh - 90px);
  }
  .right-panel {
    width: 280px;
    height: 100%;
    padding: 20px 15px;
    overflow: auto;
    border-left: 1px solid #e8e8e8;
    border-top: 1px solid #e8e8e8;
  }
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
.crop-image {
  width: 180px;
  height: 180px;
  margin-left: 35px;
}
/deep/ .ant-form-item {
  margin-bottom: 12px;
}
</style>