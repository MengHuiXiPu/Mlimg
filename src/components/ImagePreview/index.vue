<template>
  <div class="image-preview" :class="editShow && 'fold'">
      <a-spin :spinning="listLoad" wrapperClassName="loading" tip="正在加载...">
          <div class="user" v-if="detailData.dlTagType !== '分类'">
              <span style="color: #fff">最近标注人员：<br />{{ currentImage.lastModify }}</span>
          </div>
          <div class="top-left-list">
              <div class="mode-make">
                  <span class="display"
                        v-if="detailData.dlTagType !== '分类' && !detailData.kdDatalistName"
                        :class="labelShow && 'select'"
                        :style="{ cursor: editShow ? 'no-drop' : 'pointer' }"
                        @click="!editShow && (labelShow = !labelShow)">
                      显示标注
                  </span>
                  <template v-if="selectMenu &&
            ((detailData.dsType === 1 || detailData.dsType === 4 || detailData.dsType === 6) || (detailData.dsType === 2 && (detailData.deepCopy === 1 || detailData.remoteWritePermission === 1)) ||
            (detailData.dsType === 3 && (detailData.deepCopy === 1 || detailData.remoteWritePermission === 1)) || (detailData.dsType === 5 && detailData.deepCopy === 1))">
                      <span class="edit" :class="editShow && 'select'" @click="edit">
                          编辑模式
                      </span>
                      <span class="edit" :class="noSaveType && 'select'" @click="noSaveType = !noSaveType">快速标注模式</span>
                      <a-popover title="帮助" placement="bottomLeft">
                          <template slot="content">
                              <pre class="modelLog"
                                   :style="{
                    'white-space': warpType ? 'pre-line' : 'nowrap',
                    color: '#000'
                  }">
                              <b>快速标注模式：</b>无需点击保存，切换图片时会自动保存标注的结果<br />
                              <b>绘图区按键说明：</b><br />
                  ESC按键：退出绘图状态<br />
                  Enter按键：保存当前图片所有标注及类别<br />
                  Ctrl按键：按住Ctrl键移动到图片上可以打开放大镜，松开则关闭放大镜<br />
                  鼠标左键：点击时目标选中标注，目标是图片时则取消选中标注；拖动时目标时图片则拖动图片，目标是标注时则拖动图片<br />
                  鼠标中键：按住Ctrl键鼠标移动到图片上滚动鼠标中键则进行图片放大缩小<br />
                  Delete键：选中标注状态下按Delete键可以快速删除标注<br />
                  ← →按键：上一张、下一张<br />
                  ↑ ↓按键：放大图片、缩小图片<br />
                  WSAD方向键：选中标注后，可以通过长按【W】【S】【A】【D】键上下左右移动标注框<br />
                  R键：旋转图片
                </pre>
                          </template>
                          <span v-if="detailData.dlTagType !== '分类'"><a-icon type="question" /></span>
                      </a-popover>
                  </template>
              </div>
              <div class="file-make">
                  <template v-if="detailData.dlTagType !== '分类'">
                      <span class="checkSelect">
                          <a-select v-model="checkSelect" @change="checkSelectChange">
                              <a-select-option :value="0">全部</a-select-option>
                              <a-select-option :value="1">已复核</a-select-option>
                              <a-select-option :value="2">未复核</a-select-option>
                          </a-select>
                      </span>
                      <span class="save"
                            @click="saveArea"
                            title="保存"
                            :style="{
                color: isSave ? '#383838' : '#fff',
                cursor: isSave ? 'no-drop' : 'pointer'
              }">
                          <i class="icon-ai-baocun"></i>
                      </span>
                      <span class="revoke"
                            @click="backPrev" title="撤销"
                            :style="{
                color: backUpData.length !== 0 && backUpIndex === 0 ? '#383838' : '#fff',
                cursor: backUpData.length !== 0 && backUpIndex === 0 ? 'no-drop' : 'pointer'
              }">
                          <i class="icon-ai-chexiao"></i>
                      </span>
                      <span class="redo"
                            @click="redo"
                            title="重做"
                            :style="{
                color: backUpData.length !== 0 && backUpIndex === backUpData.length - 1 ? '#383838' : '#fff',
                cursor: backUpData.length !== 0 && backUpIndex === backUpData.length - 1 ? 'no-drop' : 'pointer'
              }">
                          <i class="icon-ai-zhongzuo"></i>
                      </span>
                      <span class="reset" @click="reset" title="重置">
                          <i class="icon-ai-zhongzhi"></i>
                      </span>
                  </template>
                  <span class="quit" @click="noSaveQuit(closePreview)" title="退出">
                      <a-icon type="close" />
                  </span>
              </div>
          </div>
          <div class="image-preview-content">
              <p>{{ currentImage.name }}</p>
              <div class="prevArrow" @click="noSaveQuit(prevImage)">
                  <a-icon type="left-circle" />
              </div>
              <div class="nextArrow" @click="noSaveQuit(nextImage)">
                  <a-icon type="right-circle" />
              </div>
              <div class="img-list">
                  <div class="img-item"
                       :style="{
              cursor: setAreaType ? 'crosshair' : 'grab'
            }"
                       :ref="'image-' + pictureId.id"
                       v-for="pictureId in data"
                       :key="pictureId.id"
                       v-show="pictureId.id === previewImage"
                       @mouseenter="mouseEnterImage"
                       @mouseleave="mouseLeaveImage"
                       @mousedown="mouseDownImage">
                      <img :id="'img_' + pictureId.id" :ref="'img_' + pictureId.id" :src="pictureList[pictureId.id]" draggable="false" />
                      <svg v-show="labelShow" :xmlns="xmlns" version="1.1" :id="'svg' + pictureId.id" :ref="'svg' + pictureId.id"></svg>
                      <div class="magnifier"
                           v-if="pictureId.id === previewImage && isZoomType"
                           :style="{
                width: currentImage.width * 0.25 / scale.x + 'px',
                height: currentImage.height * 0.25 / scale.y + 'px'
              }">
                      </div>
                  </div>
              </div>
              <div class="currentImageNumber">
                  <span>{{ currentImageIndex + '/' + pagination.total}}</span>
              </div>
          </div>
          <div class="image-preview-list">
              <div class="label-list" :style="{
          height: codeType !== 1 ? 'calc(100vh - 70px)' : ''
        }">
                  <p class="tab">
                      <span @click="codeType = 2" :style="{ 'margin-right': '10px', color: codeType === 2 ? '#fff' : '#5a5a5a' }">移动类别(F1)</span>
                      <span @click="codeType = 1" :style="{ 'margin-right': '10px', color: codeType === 1 ? '#fff' : '#5a5a5a' }" v-if="detailData.dlTagType !== '分类'">标签列表(F2)</span>
                      <span @click="codeType = 3" :style="{ color: codeType === 3 ? '#fff' : '#5a5a5a' }">切换类别(F3)</span>
                  </p>
                  <div v-show="codeType === 1">
                      <ul>
                          <li class="label-item"
                              :class="currentLabel && currentLabel.id === item.id && 'selected'"
                              @click="currentLabel = { ...item }"
                              v-for="item in labelList"
                              :key="item.id">
                              <span class="name">{{ item.name }}</span>
                              <span class="color"
                                    :style="{
                    background: item.color
                  }">
                              </span>
                              <span class="delete" @click.stop="deleteLabel(item)"><a-icon type="close" /></span>
                          </li>
                      </ul>
                      <div class="add-label">
                          <div class="add-label-input">
                              <a-input v-model="addLabelName" />
                          </div>
                          <div class="add-label-button">
                              <span @click="addLabel"><a-icon type="plus"></a-icon></span>
                          </div>
                      </div>
                  </div>
                  <div v-show="codeType === 2">
                      <div class="sort">
                          <span :class="sortType === 'name' && 'select'" @click="sortMenu('name')">名称<a-icon type="arrow-down" /></span>
                          <span :class="sortType === 'number' && 'select'" @click="sortMenu('number')">数量<a-icon type="arrow-down" /></span>
                      </div>
                      <ul class="menu">
                          <li class="label-item code"
                              :class="[
                  currentCode && currentCode === item.name && 'selected',
                  item.name === currentImage.selectMenu && 'active',
                  currentImage.review && item.name === currentImage.selectMenu && 'isReview']"
                              @click="currentCode = item.name"
                              v-for="(item, index) in currentMenuData"
                              :key="index">
                              <span class="name">{{ item.name }}</span>
                          </li>
                      </ul>
                      <div class="add-label">
                          <div class="add-label-input">
                              <a-input placeholder="请输入类别名称"
                                       @search="onSearch"
                                       @change="onSearchChange" />
                          </div>
                          <div class="add-label-button">
                              <span @click="moveCode('next')">移动</span>
                              <span @click="visible = true">添加类别</span>
                          </div>
                      </div>
                  </div>
                  <div v-show="codeType === 3">
                      <div class="sort">
                          <span :class="sortType === 'name' && 'select'" @click="sortMenu('name')">名称<a-icon type="arrow-down" /></span>
                          <span :class="sortType === 'number' && 'select'" @click="sortMenu('number')">数量<a-icon type="arrow-down" /></span>
                      </div>
                      <ul class="menu">
                          <li v-for="(item, index) in currentMoveMenuData"
                              :key="index"
                              class="label-item code"
                              :class="[
                  currentMoveCode && currentMoveCode === item.name && 'selected',
                  item.name === currentImage.selectMenu && 'active',
                  currentImage.review && item.name === currentImage.selectMenu && 'isReview']"
                              @click="currentMoveCode = item.name">
                              <span class="name">{{ item.name }}</span>
                          </li>
                      </ul>
                      <div class="add-label">
                          <div class="add-label-input">
                              <a-input placeholder="请输入类别名称"
                                       @search="onSearch"
                                       @change="onSearchChange" />
                          </div>
                          <div class="add-label-button">
                              <span @click="moveChangeCode('next')">切换</span>
                          </div>
                      </div>
                  </div>
              </div>
              <div class="graph-list" v-if="detailData.dlTagType !== '分类'">
                  <p><a-checkbox defaultChecked="true" @change="hideAllGraph($event)" /><span style="margin-left: 5px">标注列表</span></p>
                  <ul>
                      <li class="graph-item" v-for="item in currentImage.markPositions" :key="item.id">
                          <a-checkbox v-model="item.selected" @change="hideGraph($event, item)" />
                          <span class="name" :id="currentImage.id + '-' +item.id" @click="selectGraph(item)">{{ item.label }}</span>
                          <span class="color"
                                :style="{
                  background: item.labelColor || 'red'
                }">
                          </span>
                          <span class="delete" @click="deleteGraph(item)"><a-icon type="close" /></span>
                      </li>
                      <li class="graph-item" v-for="item in areaPositionList" :key="item.id">
                          <a-checkbox v-model="item.selected" @change="hideGraph($event, item)" />
                          <span class="name" :id="currentImage.id + '-' +item.id" @click="selectGraph(item)">{{ item.label }}</span>
                          <span class="color"
                                :style="{
                  background: item.labelColor || 'red'
                }">
                          </span>
                          <span class="delete" @click="deleteGraph(item)"><a-icon type="close" /></span>
                      </li>
                  </ul>
              </div>
          </div>
          <div class="tool-list rotate" v-if="getImageFun">
              <span class="rotate" :class="setAreaType === ''  && 'rotate'" @click="rotateImg" title="旋转">
                  <a-icon type="sync" />
              </span>
          </div>
          <div class="tool-list" v-else-if="detailData.dlTagType === '分类'">
              <a-popconfirm title="确认删除当前图片么?"
                            ok-text="确定"
                            cancel-text="取消"
                            @confirm="deleteCurrentImage">
                  <span class="pointer" title="删除图片">
                      <a-icon type="delete" />
                  </span>
              </a-popconfirm>
              <span class="rotate" :class="setAreaType === ''  && 'rotate'" @click="rotateImg" title="旋转">
                  <a-icon type="sync" />
              </span>
          </div>
          <div class="tool-list" v-else-if="!getImageFun && detailData.dlTagType !== '分类'">
              <a-popconfirm title="确认删除当前图片么?"
                            ok-text="确定"
                            cancel-text="取消"
                            @confirm="deleteCurrentImage">
                  <span class="pointer" title="删除图片">
                      <a-icon type="delete" />
                  </span>
              </a-popconfirm>
              <span class="pointer" :class="isSuperimpose && 'select'" @click="isSuperimpose = !isSuperimpose" title="叠加">
                  <a-icon type="block" />
              </span>
              <span class="rotate" :class="setAreaType === ''  && 'rotate'" @click="rotateImg" title="旋转">
                  <a-icon type="sync" />
              </span>
              <span class="zoom" :class="isZoomType && 'select'" @click="changeZoomType" title="放大镜">
                  <a-icon type="zoom-in" />
              </span>
              <span v-if="detailData.markFileType === 1" class="pointer" :class="setAreaType === 'pointer'  && 'select'" @click="setArea('pointer')" title="点">
                  <i class="icon-ai-dian"></i>
              </span>
              <span v-if="detailData.markFileType === 1" class="line" :class="setAreaType === 'line'  && 'select'" @click="setArea('line')" title="线">
                  <i class="icon-ai-xian"></i>
              </span>
              <span class="area" :class="setAreaType === 'rectangle' && 'select'" @click="setArea('rectangle')" title="绘制矩形">
                  <i class="icon-ai-Rectangle"></i>
              </span>
              <span v-if="detailData.markFileType === 1" class="area" :class="setAreaType === 'circle' && 'select'" @click="setArea('circle')" title="绘制圆形">
                  <i class="icon-ai-yuan"></i>
              </span>
              <span v-if="detailData.markFileType === 1" class="area" :class="setAreaType === 'polyline' && 'select'" @click="setArea('polyline')" title="线带">
                  <i class="icon-ai-xian1"></i>
              </span>
              <span v-if="detailData.markFileType === 1" class="area" :class="setAreaType === 'polygon' && 'select'" @click="setArea('polygon')" title="绘制多边形">
                  <i class="icon-ai-polygon_draw"></i>
              </span>
          </div>
      </a-spin>
    <canvas
      id="magnifier-image"
      :width="currentImage.width * 0.25 * 2 / scale.x"
      :height="currentImage.height * 0.25 * 2 / scale.y"
      v-if='isZoomType'
    />
    <a-modal
      :visible="visible"
      title="新建类别"
      @ok="addMenu"
      @cancel="handleCancel"
      :maskClosable="false"
    >
      <a-form-model
        :model="form"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        ref="ruleForm"
        :rules="rules"
        layout="horizontal"
      >
        <a-form-model-item label="类别名称" prop="name">
          <a-input :maxLength="50" v-model="form.name" />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
  </div>
</template>

<script>
import { activeAreaConfig, makeSVG, returnData } from './config'
import { editLabel, menuConfig } from '@/api/dataCenter'
import { getSearchCategory } from '@/api/modelManage'
import {
  getPicture
} from "@/api/modelManage"
import debounce from 'lodash.debounce'
export default {
  name: 'ImgPreview',
  data () {
    return {
      listLoad: false,
      previewImgList: [],
      previewImage: null,
      previewZoomType: {
        scale: 1,
        rotate: 0,
        moveType: false
      },
      setAreaType: '',
      setAreaStart: false,
      setAreaPosition: {},
      labelShow: true,
      editShow: false,
      areaPositionList: [],
      areaDOM: null,
      currentLabel: {},
      currentCode: '',
      currentMoveCode: '',
      searchCode: '',
      labelList: [],
      xmlns: 'http://www.w3.org/2000/svg',
      labelColorList: ['red', '#ffcf00', '#2cff00', '#00d5ff', '#0024ff', '#a400ff', '#880000'],
      isSave: true,
      isBack: false,
      isRedo: false,
      backUpData: [],
      backUpIndex: 0,
      currentGraph: null,
      moveGraphType: false,
      currentImageIndex: 0,
      codeType: 2,
      listChangeType: false,
      noSaveType: false,
      isSuperimpose: false,
      sortType: 'name',
      resize: false,
      isZoomType: false,
      magnifierPosition: {
        x: 0,
        y: 0
      },
      visible: false,
      form: {
        name: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入类别名称', trigger: 'blur' },
          { required: true, pattern: /^[a-zA-Z0-9-_\u4e00-\u9fa5]+$/, max: 50, message: '名称只能包含数字、字母、中文和下划线', trigger: "blur" }
        ]
      },
      currentMenuData: [],
      currentMoveMenuData: [],
      scale: { x: 1, y: 1 },
      checkSelect: 0
    }
  },
  props: {
    data: {
      type: Array,
      default: null,
      required: false
    },
    pictureList: {
      type: Object,
      default: () => {}
    },
    default: {
      type: Number,
      default: 0,
      required: false
    },
    selectMenu: {
      type: String,
      default: '',
      required: false
    },
    menuData: {
      type: Array,
      default: () => [],
      required: false
    },
    detailData: {
      type: Object,
      default: () => {},
      required: false
    },
    getImageFun: {
      type: Function,
      default: null
    },
    pagination: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    currentImage () {
      let image = {
        id: 1,
        name: 'img.jpg',
        markPositions: []
      }
      if (this.previewImgList.length > 0 && this.previewImage) {
        image = this.previewImgList.filter(picture => picture.id === this.previewImage)[0]
        if (!image) return false
        // image = image[0]
        if (image.selectMenu === undefined) image.selectMenu = this.selectMenu
        if (!image.markPositions) return JSON.parse(JSON.stringify(image))
        image.markPositions = image.markPositions.map(item => {
          return {
            ...item,
            selected: true
          }
        })
      }
      return JSON.parse(JSON.stringify(image))
    }
  },
  created () {//创建时调用
    if (this.selectMenu) this.getTagList()
    if (!this.getImageFun && this.detailData.dlTagType !== '分类') {
      this.edit()
    }
    this.currentMenuData = JSON.parse(JSON.stringify(this.menuData))
    this.currentMoveMenuData = JSON.parse(JSON.stringify(this.menuData))
  },
  beforeDestroy () {
    document.removeEventListener('DOMMouseScroll', this.mouseWheel, {
      capture: true,
      passive: false
    })
    window.removeEventListener('mousewheel', this.mouseWheel, {
      capture: true,
      passive: false
    })
    window.removeEventListener('keydown', this.mouseDbClick, false)
    document.removeEventListener('keydown', this.keyDown, false)
    document.removeEventListener('keyup', this.changeGraphData, false)
    document.removeEventListener('keypress', this.keyPressImage, false)
    document.removeEventListener('keydown', this.keyChangeImage, false)
    document.removeEventListener('keyup', this.keyChangeImage, false)
  },
  watch: {
    data: {
      handler: function (val, oldVal) {
        if (!this.previewImage) this.previewImage = this.default
            //console.log(oldVal, val, this.previewImage)
          console.log(this.detailData)
        if (oldVal && oldVal.length > 0 && oldVal[oldVal.length - 1].id === this.previewImage && val[val.length - 1].id !== this.previewImage) {
          this.previewImage = val[val.length - 1].id
          this.currentCode = ''
          this.listLoad = false
        }
        this.previewImgList = JSON.parse(JSON.stringify(this.data))
        this.previewImgList.forEach((item, index) => {
          item.selectMenu = this.selectMenu
          if (item.id === this.previewImage) {
            this.currentImageIndex = index + 1 + this.pagination.pageSize * (this.pagination.current - 1)
            this.labelShow = true
            this.$nextTick(() => {
              this.activeArea()
            })
          }
          this.$forceUpdate()
        })
      },
      immediate: true,
      deep: true
    },
    menuData: {
      handler: function (val) {
        this.currentMenuData = JSON.parse(JSON.stringify(val))
        this.currentMoveMenuData = JSON.parse(JSON.stringify(this.menuData))
        this.sortMenu(this.sortType)
        this.handleCancel()
      },
      deep: true
    }
  },
  mounted () {//模板创建完成，挂载时调用
    if (this.data) {
      this.previewImage = this.default
    }
    if (this.currentMenuData.length > 0) {
      this.$nextTick(() => {
        this.sortMenu('name')
      })
    }
    console.log('data', this.data)
    console.log('default', this.default)
    console.log('pictureList', this.pictureList)
    this.checkSelect = this.$parent.reviewRange
    document.addEventListener('keydown', this.keyDown, false)
    document.addEventListener('keydown', this.keyChangeImage, false)
    document.addEventListener('keyup', this.keyChangeImage, false)
  },
  methods: {
    edit () {
      this.editShow = !this.editShow
      this.labelShow = true
      if (!this.editShow) this.setAreaType = ''
      if (!this.setAreaType && this.editShow) this.setAreaType = 'rectangle'
    },
    async getImage (item) {
      const getImage = this.getImageFun || getPicture
      this.listLoad = true
      const res = await getImage(item.id)
      this.listLoad = false
      item.url = window.URL.createObjectURL(res)
      window.URL.revokeObjectURL(res)
      this.labelShow = true
      this.$nextTick(() => {
        this.activeArea()
        this.$forceUpdate()
      })
    },  
    activeArea () {
      this.previewImgList.forEach(img => {
        if (img.id === this.previewImage) {
          const image = this.$refs['img_' + img.id][0]
          const _image = this.$refs['image-' + img.id][0]
          const svg = this.$refs['svg' + String(img.id)][0]
          _image.style.transform = `scale(1) rotate(${this.previewZoomType.rotate}deg)`
          const render = () => {
            img.width = image.naturalWidth
            img.height = image.naturalHeight
            this.$set(this.currentImage, 'width', image.naturalWidth)
            this.$set(this.currentImage, 'height', image.naturalHeight)
            this.scale = {
              x: image.naturalWidth / _image.offsetWidth,
              y: image.naturalHeight / _image.offsetHeight
            }
            svg.innerHTML = ''
            img.markPositions && img.markPositions.forEach((item, index) => {
              if (!item.id) item.id = new Date().getTime() + index
              const { id, label, labelColor, type, position } = item
              const config = activeAreaConfig({
                id, label, labelColor, type, position
              }, this.scale.x, this.scale.y, this.currentLabel)
              const graphics = makeSVG(item.type, config)
              this.$nextTick(() => {
                svg.setAttribute('viewBox', `0 0 ${image.clientWidth} ${image.clientHeight}`)
                svg.appendChild(graphics)
              })
            })
            this.$nextTick(() => {
              this.backUpData.push({
                area: JSON.parse(JSON.stringify(this.areaPositionList)),
                data: this.currentImage.markPositions ? JSON.parse(JSON.stringify(this.currentImage.markPositions)) : []
              })
              this.backUpIndex = 0
            })
            this.$forceUpdate()
          }
          if (image.naturalWidth) {
            this.$nextTick(() => {
              render()
            })
          } else {
            image.onload = () => {
              render()
            }
          }
        }
      })
    },
    prevImage () {
      if (this.currentGraph) this.selectGraph(this.currentGraph)
      let activeZoomType = false
      if (this.isZoomType) {
        activeZoomType = true
        this.changeZoomType()
      }
      this.currentCode = ''
      this.previewImgList.some((item, index, arr) => {
        if (item.id === this.previewImage) {
          if (arr[index - 1]) {
            const { pageSize, current, total } = this.pagination
            if ((index) % pageSize === 0 && Math.ceil((index + (pageSize * (current - 1) - arr.length)) / pageSize) !== current) {
              this.listLoad = true
              this.$emit('page', 'prev', () => {
                this.previewImage = this.data[this.data.length - 1].id
                this.activeArea()
                this.$nextTick(() => {
                  this.listLoad = false
                })
                if (activeZoomType) {
                  activeZoomType = false
                  this.$nextTick(() => {
                    this.changeZoomType()
                  })
                }
              })
            } else {
              this.previewImage = arr[index - 1].id
              if (activeZoomType) {
                activeZoomType = false
                this.$nextTick(() => {
                  this.changeZoomType()
                })
              }
            }
          } else {
            this.listLoad = true
            this.$emit('page', 'prev', (res) => {
              this.listLoad = false
              if (res.length !== 0) {
                this.previewImage = res[res.length - 1].id
                this.$nextTick(() => {
                  this.activeArea()
                })
              } else {
                this.listLoad = false
              }
              if (activeZoomType) {
                activeZoomType = false
                this.$nextTick(() => {
                  this.changeZoomType()
                })
              }
            })
          }
          return true
        }
      })
      if (this.currentImageIndex > 1) this.currentImageIndex--
      this.backUpData = []
      this.areaPositionList = []
      this.previewZoomType.scale = 1
      // this.previewZoomType.rotate = 0
      this.activeArea()
    },
    nextImage (type) {
      if (this.currentGraph) this.selectGraph(this.currentGraph)
      if (this.previewImage === this.data[this.data.length - 1].id
        && this.currentCode && this.noSaveType) {
        return false
      }
      let activeZoomType = false
      if (this.isZoomType) {
        activeZoomType = true
        this.changeZoomType() 
      }
      this.currentCode = ''
      this.previewImgList.some((item, index, arr) => {
        if (item.id === this.previewImage) {
          if (arr[index + 1]) {
            const { pageSize, current, total } = this.pagination
            if ((index + 1) % pageSize === 0 && Math.ceil((index + 2 + (pageSize * (current - 1) - arr.length)) / pageSize) !== current) {
              this.listLoad = true
              this.$emit('page', 'next', () => {
                this.listLoad = false
                this.previewImage = arr[index + 1].id
                this.activeArea()
                if (activeZoomType) {
                  activeZoomType = false
                  this.$nextTick(() => {
                    this.changeZoomType()
                  })
                }
              })
            } else {
              this.previewImage = arr[index + 1].id
              if (activeZoomType) {
                activeZoomType = false
                this.$nextTick(() => {
                  this.changeZoomType()
                })
              }
            }
          } else {
            this.listLoad = true
            this.$emit('page', 'next', (res) => {
              this.listLoad = false
              if (res.length !== 0) {
                this.previewImage = res[0].id
                this.$nextTick(() => {
                  this.activeArea()
                })
              } else {
                this.listLoad = false
              }
              if (activeZoomType) {
                activeZoomType = false
                this.$nextTick(() => {
                  this.changeZoomType()
                })
              }
            })
          }
          return true
        }
      })
      if (this.currentImageIndex < this.pagination.total && type !== 'delete') this.currentImageIndex++
      this.areaPositionList = []
      this.backUpData = []
      this.previewZoomType.scale = 1
      // this.previewZoomType.rotate = 0
      this.activeArea()
    },
    closePreview () {
      this.previewImage = null
      this.backUpData = []
      this.previewZoomType.scale = 1
      this.previewZoomType.rotate = 0
      if (this.listChangeType) this.$emit('reload')
      this.$emit('close')
    },
    mouseEnterImage () {
      if (document.addEventListener) { // 兼容Firefox
        document.addEventListener('DOMMouseScroll', this.mouseWheel, {
          capture: true,
          passive: false
        })
      }
      window.addEventListener('mousewheel', this.mouseWheel, {
        capture: true,
        passive: false
      })
    },
    mouseLeaveImage (e) {
      e = e || window.event
      if (document.addEventListener) { // 兼容Firefox
        document.removeEventListener('DOMMouseScroll', this.mouseWheel, {
          capture: true,
          passive: false
        })
      }
      window.removeEventListener('mousewheel', this.mouseWheel, {
        capture: true,
        passive: false
      })
      if (this.areaDOM) {
        if (this.areaDOM.tagName === 'polyline' || this.areaDOM.tagName === 'polygon') {
          this.mouseDbClick({ key: 'Escape' })
        } else {
          this.mouseUpImage()
        }
      }
      if (this.currentGraph) {
        this.changeGraphData()
      }
    },
    mouseWheel (e) {
      if (event.ctrlKey || event.metaKey) {
        // 当鼠标在图片上是禁用浏览器默认事件（浏览器缩放）
        event.preventDefault()
        e = e || window.event
        let transformObj = null
        // 解决Firfox不兼容e.path属性
        const path = e.path || (event.composedPath && event.composedPath())
        path.some(node => {
          if (node.className === 'img-item') {
            transformObj = node
            return true
          }
        })
        if (!transformObj) return false
        this.imageZoom(e.wheelDelta || -e.detail, transformObj)
      }
    },
    imageZoom (zoomType, transformObj) {
      // 图片缩放速度
      const speed = 0.1
      if (zoomType > 0) {
        this.previewZoomType.scale = this.previewZoomType.scale + speed
      } else {
        this.previewZoomType.scale = this.previewZoomType.scale - speed
      }
      // zoom值在火狐中无效，这里改用transforms:scale
      const cssArray = transformObj.style.transform.split(' ')
      cssArray[0] = `scale(${this.previewZoomType.scale})`
      transformObj.style.transform = cssArray.join(' ')
    },
    mouseDbClick (e = {}) {
      if (e.key !== 'Escape') return false
      if (this.areaDOM) {
        const points = this.areaDOM.getAttribute('points')
        if (!points) return false
        const point = points.split(' ')
        point.pop()
        this.areaDOM.setAttribute('points', point.join(' '))
        this.setAreaPosition.points = point
        const data = {
          id: this.setAreaPosition.id,
          label: this.currentLabel.name,
          markName: this.currentLabel.name,
          position: returnData(this.setAreaPosition, this.scale),
          type: this.setAreaPosition.type,
          labelColor: this.currentLabel.color,
          selected: true
        }
        this.areaPositionList.push(data)
        this.setAreaPosition = {}
        this.setAreaStart = false
        this.areaDOM = null
        this.isSave = false
        this.isBack = true
        this.backUpData.push({
          area: JSON.parse(JSON.stringify(this.areaPositionList)),
          data: JSON.parse(JSON.stringify(this.currentImage.markPositions))
        })
        this.backUpIndex++
        this.$nextTick(() => {
          this.selectGraph(this.areaPositionList[this.areaPositionList.length - 1])
        })
        window.removeEventListener('keydown', this.mouseDbClick, false)
      } else if (this.setAreaType) {
        // this.selectGraph(this.areaPositionList[this.areaPositionList.length - 1])
        this.setAreaType = ''
        this.resize = false
      }
    },
    mouseDownImage (e) {
      e = e || window.event
      this.resize = false
      let transformObj = e.target
      let backObj = this.$refs['svg' + this.previewImage][0]
      const path = e.path || (event.composedPath && event.composedPath())
      path.some(node => {
        if (node.nodeName === 'svg') {
          this.$nextTick(() => {
            if (this.currentGraph) this.selectGraph(this.currentGraph)
          })
          transformObj = node
          transformObj.onmouseleave = () => {
            transformObj.onmousemove = null
            this.previewZoomType.moveType = false
          }
          return true
        } else if (node.id && node.id.includes('resizeItem-')) {
          // transformObj = node
          this.resize = true
          const positionIndex = node.id.substring(node.id.indexOf('-') + 1)
          this.$refs['svg' + this.previewImage][0].onmousemove = (e) => {
            this.onResizeMouseMove(e, node, Number(positionIndex))
          }
          this.$refs['svg' + this.previewImage][0].onmouseup = () => {
            this.changeGraphData()
          }
          return true
        } else if (!this.setAreaType && e.target.className !== 'magnifier') {
          transformObj = node
          if (node.classList.value !== 'selected') {
            const graph = [ ...this.currentImage.markPositions,
            ...this.areaPositionList ].filter(item => item.id == node.id)[0]
            this.selectGraph(graph)
          }
          return true
        } 
      })
      if (this.resize) return false
      if (transformObj.tagName !== 'svg' && this.setAreaType && !this.currentGraph) return false
      if (transformObj.tagName !== 'svg' && !this.setAreaType && this.currentGraph) {
        this.moveGraphType = true
        backObj.onmousemove = (e) => this.moveGraph(e)
        backObj.onmouseup = () => this.changeGraphData()
        return false
      }
      const x = navigator.userAgent.indexOf('Firefox') > -1 ? e.layerX : e.offsetX
      const y = navigator.userAgent.indexOf('Firefox') > -1 ? e.layerY : e.offsetY
      transformObj.onmousemove = () => {
        this.mouseMoveImage()
      }
      transformObj.onmouseup = () => {
        this.mouseUpImage()
      }
      if (!this.setAreaType) {
        this.previewZoomType.moveType = true
        this.setAreaPosition.startX = x
        this.setAreaPosition.startY = y
      } else {
        if (!this.currentLabel) {
          this.$message.warning('绘制标注前请选择一个标签')
          return false
        }
        if (this.areaDOM && (this.areaDOM.tagName === 'polyline' || this.areaDOM.tagName === 'polygon')) {
          const points = this.areaDOM.getAttribute('points')
          const point = points.split(' ')
          point.push(x + ',' + y)
          this.areaDOM.setAttribute('points', point.join(' '))
          return false
        }
        const id = new Date().getTime()
        this.setAreaPosition.id = id
        this.setAreaPosition.type = this.setAreaType
        this.setAreaPosition.startX = x
        this.setAreaPosition.startY = y
        this.setAreaStart = true
        const config = activeAreaConfig({
          id: id,
          type: this.setAreaType,
          position: [{
            x: x,
            y: y
          }, {
            x: x,
            y: y
          }]
        }, 0, 0, this.currentLabel)
        if (!this.areaDOM && this.setAreaType === 'polyline' || this.setAreaType === 'polygon') {
          window.addEventListener('keydown', this.mouseDbClick, false)
        }
        if (!this.isSuperimpose) {
          this.areaPositionList.forEach(item => {
            this.deleteGraph(item)
          })
          this.areaPositionList = []
        }
        this.areaDOM = makeSVG(this.setAreaType, config)
        transformObj.appendChild(this.areaDOM)
        transformObj.onmousemove = () => this.mouseMoveImage()
        // 防止出现在areaDOM上鼠标松开导致没有执行mouseup
        transformObj.onmouseup = () => this.mouseUpImage()
      }
    },
    moveGraph (e) {
      e = e || window.event
      const _image = this.$refs['image-' + this.previewImage][0]
      const zoom = Number(_image.style.transform.substring(_image.style.transform.indexOf('(') + 1, _image.style.transform.indexOf(')')))
      if (!this.moveGraphType) return false
      this.changeGraphPosition(e.movementX / zoom, e.movementY / zoom)
    },
    mouseMoveImage (e) {
      // 绘制标注时，当前函数不执行
      e = e || window.event
      if (!this.setAreaType) {
        if (!this.previewZoomType.moveType) return false
        let transformObj = e.target
        const path = e.path || (event.composedPath && event.composedPath())
        path.some(node => {
          if (node.nodeName === 'svg') {
            transformObj = node
            return true
          }
        })
        const style = window.getComputedStyle(transformObj.parentNode)
        const top = style.top
        const left = style.left
        // e.movementX：mousemove函数每次执行鼠标移动的距离
        transformObj.parentNode.style.top = Number(top.substring(0, top.indexOf('px'))) + e.movementY / this.scale.y + 'px'
        transformObj.parentNode.style.left = Number(left.substring(0, left.indexOf('px'))) + e.movementX / this.scale.x + 'px'
      } else {
        if (!this.setAreaStart) return false
        const x = navigator.userAgent.indexOf('Firefox') > -1 ? e.layerX : e.offsetX
        const y = navigator.userAgent.indexOf('Firefox') > -1 ? e.layerY : e.offsetY
        this.setAreaPosition.endX = x
        this.setAreaPosition.endY = y
        switch (this.setAreaType) {
        case 'line':
          this.areaDOM.setAttribute('y2', y)
          this.areaDOM.setAttribute('x2', x)
          break
        case 'rectangle':
          if (x < this.setAreaPosition.startX) {
            this.areaDOM.setAttribute('x', x)
            this.areaDOM.setAttribute('width', this.setAreaPosition.startX - x)
          } else {
            this.areaDOM.setAttribute('width', x - this.setAreaPosition.startX)
          }
          if (y < this.setAreaPosition.startY) {
            this.areaDOM.setAttribute('y', y)
            this.areaDOM.setAttribute('height', this.setAreaPosition.startY - y)
          } else {
            this.areaDOM.setAttribute('height', y - this.setAreaPosition.startY)
          }
          break
        case 'circle':
          const _x = Math.abs(y - this.setAreaPosition.startY)
          const _y = Math.abs(x - this.setAreaPosition.startX)
          const r = Math.sqrt(Math.pow(_x, 2) + Math.pow(_y, 2))
          this.areaDOM.setAttribute('r', r)
          break
        case 'polygon':
          let points_polygon = this.areaDOM.getAttribute('points')
          const pointsArr_polygon = points_polygon.split(' ')
          if (pointsArr_polygon[pointsArr_polygon.length - 1] === '') pointsArr_polygon.pop()
          pointsArr_polygon[pointsArr_polygon.length - 1] = x + ',' + y
          this.areaDOM.setAttribute('points', pointsArr_polygon.join(' '))
          break
        case 'polyline':
          let points_polyline = this.areaDOM.getAttribute('points')
          const pointsArr_polyline = points_polyline.split(' ')
          if (pointsArr_polyline[pointsArr_polyline.length - 1] === '') pointsArr_polyline.pop()
          pointsArr_polyline[pointsArr_polyline.length - 1] = x + ',' + y
          this.areaDOM.setAttribute('points', pointsArr_polyline.join(' '))
          break
        }
      }
    },
    mouseUpImage (e) {
      if (!this.setAreaType) {
        this.previewZoomType.moveType = false
      } else {
        if (!this.setAreaStart) return false
        if (this.setAreaType === 'polygon' || this.setAreaType === 'polyline') {
          return false
        }
        const data = {
          id: this.setAreaPosition.id,
          label: this.currentLabel.name,
          markName: this.currentLabel.name,
          position: returnData(this.setAreaPosition, this.scale),
          type: this.setAreaPosition.type,
          labelColor: this.currentLabel.color,
          selected: true
        }
        this.setAreaPosition = {}
        this.setAreaStart = false
        this.areaDOM = null
        if (data.type !== 'pointer' && data.position.length <= 1) return false
        this.areaPositionList.push(data)
        this.backUpData.push({
          area: JSON.parse(JSON.stringify(this.areaPositionList)),
          data: JSON.parse(JSON.stringify(this.currentImage.markPositions))
        })
        this.backUpIndex++
        this.isSave = false
        this.$nextTick(() => {
          this.selectGraph(this.areaPositionList[this.areaPositionList.length - 1])
        })
      }
    },
    keyPressImage (e) {
      const speed = 1
      switch (e.key) {
        case 'w':
          // top
          this.changeGraphPosition(0, -speed)
          break
        case 'a':
          // left
          this.changeGraphPosition(-speed, 0)
          break
        case 's':
          // bottom
          this.changeGraphPosition(0, speed)
          break
        case 'd':
          // right
          this.changeGraphPosition(speed, 0)
          break
      }
    },
    async keyChangeImage (e) {
      if (this.listLoad) return false
      if (e.type === 'keyup') {
        switch (e.keyCode) {
          case 13:
            this.saveArea()
            break
          case 27:
            this.mouseDbClick(e)
            break
          case 37:
            // left
            // if (this.noSaveType) await this.saveArea()
            this.noSaveQuit(this.prevImage)
            break
          case 39:
            // right
            // if (this.noSaveType) await this.saveArea()
            this.noSaveQuit(this.nextImage)
            break
          case 38:
            // top
            this.imageZoom(1, this.$refs['image-' + this.previewImage][0])
            break
          case 40:
            // bottom
            this.imageZoom(-1, this.$refs['image-' + this.previewImage][0])
            break
          case 82:
            // r
            this.rotateImg()
            break
          case 46:
            if (this.currentGraph) this.deleteGraph(this.currentGraph)
            break
          case 17:
            this.isZoomType = false
            window.removeEventListener('mousemove', this.changeMagnifier, false)
            break
        }
      } else {
        switch (e.keyCode) {
          case 38:
            // top
            this.imageZoom(1, this.$refs['image-' + this.previewImage][0])
            break
          case 40:
            // bottom
            this.imageZoom(-1, this.$refs['image-' + this.previewImage][0])
            break
        }
      }
    },
    keyDown (e) {
      switch (e.keyCode) {
        case 17:
          window.addEventListener('mousemove', this.changeMagnifier, false)
          break
        case 112:
          e.preventDefault()
          this.codeType = 2
          break
        case 113:
          e.preventDefault()
          this.codeType = 1
          break
        case 114:
          e.preventDefault()
          this.codeType = 3
          break
      }
    },
    changeZoomType () {
      this.isZoomType = !this.isZoomType
      if (this.isZoomType) {
        window.addEventListener('mousemove', this.changeMagnifier, false)
      } else {
        window.removeEventListener('mousemove', this.changeMagnifier, false)
      }
    },
    changeMagnifier (e) {
      e = e || window.event
      this.isZoomType = true
      if (this.listLoad) return false
      if (this.isZoomType) {
        const x = navigator.userAgent.indexOf('Firefox') > -1 ? e.layerX : e.offsetX
        const y = navigator.userAgent.indexOf('Firefox') > -1 ? e.layerY : e.offsetY
        const dom = document.querySelector('.magnifier')
        const canvas = document.getElementById('magnifier-image')
        if (canvas) {
          const ctx = canvas.getContext("2d")
          if (e.target.className === 'magnifier') {
            dom.style.top = e.target.offsetTop + e.movementY / window.devicePixelRatio + 'px'
            dom.style.left = e.target.offsetLeft + e.movementX / window.devicePixelRatio + 'px'
            this.magnifierPosition = {
              x: e.target.offsetLeft + e.movementX / window.devicePixelRatio,
              y: e.target.offsetTop + e.movementY / window.devicePixelRatio
            }
          } else {
            dom.style.top = y + 'px'
            dom.style.left = x + 'px'
            this.magnifierPosition = { x, y }
          } 
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(
            document.getElementById('img_' + this.previewImage),
            (dom.offsetLeft - dom.offsetWidth * 0.5) * this.scale.x,
            (dom.offsetTop - dom.offsetHeight * 0.5) * this.scale.y,
            dom.offsetWidth * this.scale.x,
            dom.offsetHeight * this.scale.y,
            0,
            0,
            canvas.width,
            canvas.height
          )
        }
      }
    },
    changeGraphData () {
      this.moveGraphType = false
      if (this.resize) {
        this.$forceUpdate()
        this.backUpData.push({
          area: JSON.parse(JSON.stringify(this.areaPositionList)),
          data: JSON.parse(JSON.stringify(this.currentImage.markPositions))
        })
        this.backUpIndex++
        this.isSave = false
      }
      this.resize = false
      document.removeEventListener('keyup', this.changeGraphData, false)
    },
    changeGraphPosition (_x, _y) {
      // devicePixelRatio： 获取到浏览器的缩放比例（包括系统设置中的缩放比例）
      const x = _x / window.devicePixelRatio
      const y = _y / window.devicePixelRatio
      document.getElementById('resize-' + this.currentGraph.id).childNodes.forEach(item => {
        item.setAttribute('x', Number(item.getAttribute('x')) + x)
        item.setAttribute('y', Number(item.getAttribute('y')) + y)
      })
      const selected = this.currentGraph
      const dom = document.getElementById(selected.id)
      switch (selected.type) {
        case 'rectangle':
          dom.setAttribute('x', Number(dom.getAttribute('x')) + x)
          dom.setAttribute('y', Number(dom.getAttribute('y')) + y)
          this.currentGraph.position = [{
            x: this.currentGraph.position[0].x + x * this.scale.x,
            y: this.currentGraph.position[0].y + y * this.scale.y
          }, {
            x: this.currentGraph.position[1].x + x * this.scale.x,
            y: this.currentGraph.position[1].y + y * this.scale.y
          }]
          break
        case 'circle':
          dom.setAttribute('cx', Number(dom.getAttribute('cx')) + x)
          dom.setAttribute('cy', Number(dom.getAttribute('cy')) + y)
          this.currentGraph.position = [{
            x: this.currentGraph.position[0].x + x * this.scale.x,
            y: this.currentGraph.position[0].y + y * this.scale.y
          }, {
            x: this.currentGraph.position[1].x + x * this.scale.x,
            y: this.currentGraph.position[1].y + y * this.scale.y
          }]
          break
        case 'pointer':
          dom.setAttribute('cx', Number(dom.getAttribute('cx')) + x)
          dom.setAttribute('cy', Number(dom.getAttribute('cy')) + y)
          this.currentGraph.position = [{
            x: this.currentGraph.position[0].x + x * this.scale.x,
            y: this.currentGraph.position[0].y + y * this.scale.y
          }]
          break
        case 'polyline':
        case 'polygon':
          const points = dom.getAttribute('points')
          let point = points.split(' ')
          if (point[point.length - 1] === '') point.pop()
          point = point.map(item => {
            const data = item.split(',')
            return (Number(data[0]) + x) + ',' + (Number(data[1]) + y)
          })
          dom.setAttribute('points', point.join(' '))
          this.currentGraph.position = this.currentGraph.position.map(item => {
            return {
              x: item.x + x * this.scale.x,
              y: item.y + y * this.scale.y
            }
          })
          break
        case 'line':
          dom.setAttribute('x1', Number(dom.getAttribute('x1')) + x)
          dom.setAttribute('y1', Number(dom.getAttribute('y1')) + y)
          dom.setAttribute('x2', Number(dom.getAttribute('x2')) + x)
          dom.setAttribute('y2', Number(dom.getAttribute('y2')) + y)
          this.currentGraph.position = [{
            x: this.currentGraph.position[0].x + x * this.scale.x,
            y: this.currentGraph.position[0].y + y * this.scale.y
          }, {
            x: this.currentGraph.position[1].x + x * this.scale.x,
            y: this.currentGraph.position[1].y + y * this.scale.y
          }]
          break
      }
      if (_x !== 0 && _y !== 0) this.resize = true
      document.addEventListener('keyup', this.changeGraphData, false)
    },
    async saveArea (type) {
      if (!this.isSave) {
        const { id, markFileType } = this.detailData
        this.currentImage.markPositions.forEach(item => {
          item.position.forEach(el => {
            el.x = Math.round(el.x)
            el.y = Math.round(el.y)
          })
        })
        const params = {
          dataListId: id,
          fileCategory: this.selectMenu,
          markFileType,
          markPositions: [
            ...this.currentImage.markPositions,
            ...this.areaPositionList
          ],
          pictureHeight: this.currentImage.height,
          pictureWidth: this.currentImage.width,
          pictureId: this.previewImage,
          pictureName: this.currentImage.name
        }
        this.listLoad = true
        const res = await editLabel.savePictureLabel(params)
        this.listLoad = false
        if (res.code !== 0) return false
        if (!this.currentCode) this.$message.success('保存成功')
        this.isSave = true
        this.currentImage.markPositions = this.currentImage.markPositions.concat(this.areaPositionList)
        this.$set(this.currentImage, 'review', 1)
        this.areaPositionList = []
        this.listChangeType = true
        if (this.pagination.total === 1) {
          this.closePreview()
          return false
        }
        if (this.currentCode) {
          this.moveCode(type && 'next')
          return false
        }
        if (this.previewImage === this.data[this.data.length - 1].id) {
          this.listLoad = true
          this.checkSelect !== 2 && this.nextImage('delete')
        } else {
          this.nextImage(this.checkSelect === 2 && 'delete')
        }
        this.$emit('save')
      }
      if (this.currentCode) await this.moveCode(type && 'next')
    },
    setArea (type) {
      // 设置标注
      this.setAreaType = this.setAreaType === type ? '' : type
    },
    reset () {
      // 重置标注
      this.areaPositionList.forEach(item => {
        const dom = document.getElementById(item.id)
        dom.parentNode.removeChild(dom)
      })
      this.areaPositionList = []
      this.currentImage.markPositions = this.previewImgList.filter(item => {
        return item.id === this.currentImage.id
      })
      this.backUpData.push({
        area: JSON.parse(JSON.stringify(this.areaPositionList)),
        data: JSON.parse(JSON.stringify(this.currentImage.markPositions))
      })
      this.backUpIndex++
    },
    backPrev () {
      // 撤回上一步
      if (this.backUpIndex === 0) return false
      this.backUpIndex--
      this.changeHistoryData()
    },
    redo () {
      // 重做
      if (this.backUpIndex === this.backUpData.length - 1) return false
      this.backUpIndex++
      this.changeHistoryData()
    },
    changeHistoryData () {
      this.areaPositionList = JSON.parse(JSON.stringify(this.backUpData[this.backUpIndex].area))
      this.$refs['svg' + this.previewImage][0].innerHTML = ''
      this.areaPositionList.forEach(item => {
        if (!document.getElementById(item.id)) {
          const { id, label, labelColor, type, position } = item
          const config = activeAreaConfig({
            id, label, labelColor, type, position
          }, 1, 1, this.currentLabel)
          const graphics = makeSVG(item.type, config)
          this.$nextTick(() => {
            this.$refs['svg' + this.previewImage][0].appendChild(graphics)
          })
        }
      })
      this.currentImage.markPositions = JSON.parse(JSON.stringify(this.backUpData[this.backUpIndex].data))
      this.currentImage.markPositions.forEach(item => {
        if (!document.getElementById(item.id)) {
          const { id, label, labelColor, type, position } = item
          const config = activeAreaConfig({
            id, label, labelColor, type, position
          }, this.scale.x, this.scale.y, this.currentLabel)
          const graphics = makeSVG(item.type, config)
          this.$nextTick(() => {
            this.$refs['svg' + this.previewImage][0].appendChild(graphics)
          })
        }
      })
    },
    hideAllGraph (e) {
      this.currentImage.markPositions.forEach(item => {
        item.selected = e.target.checked
        const dom = document.getElementById(item.id)
        dom.style.display = e.target.checked ? '' : 'none'
      })
      this.areaPositionList.forEach(item => {
        item.selected = e.target.checked
        const dom = document.getElementById(item.id)
        dom.style.display = e.target.checked ? '' : 'none'
      })
      this.$forceUpdate()
    },
    hideGraph (e, item) {
      item.selected = e.target.checked
      const dom = document.getElementById(item.id)
      dom.style.display = e.target.checked ? '' : 'none'
      this.$forceUpdate()
    },
    selectGraph (item) {
      const clones = document.getElementById(item.id)
      const target = document.getElementById(this.currentImage.id + '-' + item.id)
      if (!clones) return false
      clones.parentNode.childNodes.forEach(node => {
        if (node.id != item.id) {
          node.classList.remove('selected')
          node.setAttribute('fill', 'rgba(0,0,0,0)')
        }
      })
      const dom = clones.cloneNode(true)
      clones.parentNode.removeChild(clones)
      this.$refs['svg' + this.previewImage][0].appendChild(dom)
      document.getElementsByClassName('graph-item').forEach(node => {
        const arr = node.getElementsByClassName('selected')
        if (arr.length > 0) arr[0].classList.remove('selected')
      })
      if (dom.getAttribute('class')) {
        dom.setAttribute('fill', 'rgba(0,0,0,0)')
        dom.classList.remove('selected')
        target.classList.remove('selected')
        this.currentGraph = null
        document.removeEventListener('keypress', this.keyPressImage, false)
        this.$refs['svg' + this.previewImage][0].childNodes.forEach(element => {
          if (element.id && element.id.includes('resize-')) {
            this.$refs['svg' + this.previewImage][0].removeChild(element)
          }
        })
      } else {
        this.currentGraph = item
        dom.setAttribute('fill', dom.getAttribute('stroke'))
        dom.classList.add("selected")
        target.classList.add('selected')
        document.addEventListener('keypress', this.keyPressImage, false)
        this.createResizeDom(item)
      }
    },
    deleteGraph (item) {
      // 删除图形
      if (this.currentGraph && item.id === this.currentGraph.id) {
        this.selectGraph(item)
      }
      const dom = document.getElementById(item.id)
      dom.parentNode.removeChild(dom)
      const area = this.areaPositionList.filter(node => {
        return node.id !== item.id
      })
      this.areaPositionList = area
      const data = this.currentImage.markPositions.filter(node => {
        return node.id !== item.id
      })
      this.$set(this.currentImage, 'markPositions', data)
      this.backUpData.push({
        area: JSON.parse(JSON.stringify(this.areaPositionList)),
        data: JSON.parse(JSON.stringify(this.currentImage.markPositions))
      })
      this.backUpIndex++
      this.isSave = false
    },
    deleteLabel (record) {
      const name = [ ...this.areaPositionList, ...this.currentImage.markPositions ].filter(item => {
        return item.label === record.name
      })
      if (name.length > 0) {
        this.$message.warning('当前存在基于该标签创建的标注图形，无法删除')
        return false
      }
      this.labelList = this.labelList.filter(item => {
        return item.id !== record.id
      })
      if (!record.test) {
        this.saveLabel()
      } else {
        this.currentLabel = null
      }
    },
    addLabel () {
      if (this.addLabelName.trim() === '') {
        this.$message.warning('标签名不能为空')
        return false
      }
      if (this.labelList.filter(item => item.name === this.addLabelName).length > 0) {
        this.$message.warning('当前已有该标签，标签不能重名')
        return false
      }
      this.labelList.push({
        id: new Date().getTime(),
        name: this.addLabelName,
        color: this.labelColorList[this.labelList.length % this.labelColorList.length]
      })
      this.saveLabel()
    },
    async saveLabel () {
      const params = {
        dataListId: this.detailData.id,
        labelList: this.labelList
      }
      this.listLoad = true
      const res = await editLabel.saveDataListTag(params)
      this.listLoad = false
      if (!res.code === 0) return false
      this.getTagList()
      this.$message.success('操作成功')
    },
    async getTagList () {
      this.listLoad = true
      const res = await editLabel.getDataListTag(this.detailData.id)
      this.listLoad = false
      if (res.code !== 0) return false
      this.labelList = res.data
      this.addLabelName = ''
      if (this.labelList.length === 0) {
        this.labelList.push({
          id: new Date().getTime(),
          name: 'tag',
          color: this.labelColorList[this.labelList.length % this.labelColorList.length],
          test: true
        })
        this.currentLabel = JSON.parse(JSON.stringify(this.labelList[0]))
        return false
      }
      this.currentLabel = JSON.parse(JSON.stringify(this.labelList[0]))
    },
    async noSaveQuit (callback) {
      if (this.noSaveType && (!this.isSave || this.currentCode)) {
        await this.saveArea(true)
        return false
        // if (this.checkSelect === 2 && this.previewImage === this.data[this.data.length - 1].id) {
        //   return false
        // } else {
        //   return callback()
        // }
      }
      if (this.isSave) {
        return callback()
      }
      document.removeEventListener('keyup', this.keyChangeImage, false)
      document.removeEventListener('keydown', this.keyChangeImage, false)
      this.$confirm({
        title: '提示',
        content: '当前还有标注内容未保存，确定离开么?',
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          this.isSave = true
          document.addEventListener('keyup', this.keyChangeImage, false)
          document.addEventListener('keydown', this.keyChangeImage, false)
          callback()
        },
        onCancel: () => {
          document.addEventListener('keyup', this.keyChangeImage, false)
          document.addEventListener('keydown', this.keyChangeImage, false)
        }
      })
    },
    rotateImg () {
      const _image = this.$refs['image-' + this.previewImage][0]
      const cssArray = _image.style.transform.split(' ')
      this.$set(this.previewZoomType, 'rotate', this.previewZoomType.rotate === 270 ? 0 : this.previewZoomType.rotate + 90)
      if (!cssArray[0]) cssArray[0] = 'scale(1)'
      cssArray[1] = `rotate(${this.previewZoomType.rotate}deg)`
      _image.style.transform = cssArray.join(' ')
    },
    onSearchChange:
      debounce(function (e) {
        this.searchCode = e.target.value
        const id = this.detailData.id
        const param = id + '_' + this.searchCode
        this.getSearchingDataList(param)
      }, 300),
    onSearch:
      debounce(function (value) {
        this.searchCode = value
        const id = this.detailData.id
        const param = id + '_' + this.searchCode
        this.getSearchingDataList(param)
      }, 300),
    async getSearchingDataList (param) {
      const data = this.codeType === 2 ? 'currentMenuData' : 'currentMoveMenuData'
      this.listLoad = true
      const res = await getSearchCategory(param)
      this.listLoad = false
      if (res.code === 0) this[data] = res.data.DataListCategory.map((item, index) => {
        return {
          name: item,
          value: res.data.DataListCategoryNum[index],
          selected: false
        }
      })
    },
    async moveCode (type) {
      if (!this.currentCode) this.currentCode = this.currentImage.selectMenu
      this.$emit('moveTo', { key: this.currentCode, id: this.currentImage.id, isReview: true })
      this.$set(this.currentImage, 'review', 1)
      this.previewImgList.forEach((item) => {
        if (item.id === this.currentImage.id) {
          item.reivew = 1
        }
      })
      this.listChangeType = true
      if (this.data.length === 1 && this.pagination.current === 1) {
        this.closePreview()
        return false
      }
      if (this.data.length === 1 && this.pagination.current !== 1) {
        // this.prevImage()
        this.listLoad = true
        return false
      }
      if (this.previewImage === this.data[this.data.length - 1].id && this.currentCode !== this.currentImage.selectMenu) {
        this.listLoad = true
      } else {
        this.currentCode = ''
        if (type === 'next') this.nextImage('delete')
      }
    },
    async moveChangeCode () {
      this.listLoad = true
      this.$parent.handleCategorySelect(this.currentMoveCode).then(() => {
        this.$nextTick(() => {
          this.listLoad = false
          this.previewImage = this.data[0].id
          this.currentImageIndex = 1
          this.activeArea()
        })
      })
    },
    deleteCurrentImage () {
      const _index = this.previewImage
      this.$emit('delete', { id: _index })
      this.listChangeType = true
      if (this.pagination.total === 1) {
        this.closePreview()
        return false
      }
      if (this.previewImage === this.data[this.data.length - 1].id) {
        this.listLoad = true
      } else {
        this.nextImage('delete')
      }
    },
    sortMenu (type) {
      this.sortType = type
      const data = this.codeType === 2 ? 'currentMenuData' : 'currentMoveMenuData'
      if (type === 'name') {
        const menuData = this[data].map(item => item.name)
        this[data] = menuData.sort().map(item => {
          return {
            name: item,
            value: this[data].filter(menu => menu.name === item)[0].value
          }
        })
      } else {
        this[data].sort((a, b) => {
          return b.value - a.value
        })
      }
    },
    createResizeDom (graph) {
      this.$refs['svg' + this.previewImage][0].childNodes.forEach(element => {
        if (element.id && element.id.includes('resize-')) {
          this.$refs['svg' + this.previewImage][0].removeChild(element)
        }
      })
      const maxX = Math.max(...graph.position.map(item => item.x))
      const maxY = Math.max(...graph.position.map(item => item.y))
      const minX = Math.min(...graph.position.map(item => item.x))
      const minY = Math.min(...graph.position.map(item => item.y))
      let width = Math.min((maxX - minX), (maxY - minY)) * 0.03
      if (width < 3) width = 3
      const scaleX = this.scale.x
      const scaleY = this.scale.y
      const g = makeSVG('g', { id: 'resize-' + graph.id })
      graph.position.forEach((item, index) => {
        if (graph.type === 'circle' && index === 0) {
          return false
        }
        const resize = activeAreaConfig({
          id: 'resizeItem-' + index,
          type: 'rectangle',
          labelColor: '#fff',
          position: [{
            x: Number(item.x) - width,
            y: Number(item.y) - width
          }, {
            x: Number(item.x) + width,
            y: Number(item.y) + width
          }]
        }, scaleX, scaleY, '')
        const resizeDOM = makeSVG('rectangle', resize)
        resizeDOM.style.cursor = 'nw-resize'
        g.appendChild(resizeDOM)
      })
      this.$refs['svg' + this.previewImage][0].appendChild(g)
    },
    // onResizeMouseDown () {},
    onResizeMouseMove (e, node, positionIndex) {
      if (!this.resize) return false
      const x = navigator.userAgent.indexOf('Firefox') > -1 ? e.layerX : e.offsetX
      const y = navigator.userAgent.indexOf('Firefox') > -1 ? e.layerY : e.offsetY
      node.setAttribute('x', x - 7.5)
      node.setAttribute('y', y - 7.5)
      const scaleX = this.scale.x
      const scaleY = this.scale.y
      const currentPosition = this.currentGraph.position
      const transformObj = document.getElementById(this.currentGraph.id)
      switch (this.currentGraph.type) {
      case 'line':
        transformObj.setAttribute('y' + (positionIndex + 1), y)
        transformObj.setAttribute('x' + (positionIndex + 1), x)
        this.currentGraph.position[positionIndex] = {
          x: x * scaleX,
          y: y * scaleY
        }
        break
      case 'rectangle':
        const resize = document.getElementById('resizeItem-' + (positionIndex ? 0 : 1))
        const { x1, y1, x2, y2 } = {
          x1: Math.min(currentPosition[0].x, currentPosition[1].x) / scaleX,
          y1: Math.min(currentPosition[0].y, currentPosition[1].y) / scaleY,
          x2: Math.max(currentPosition[0].x, currentPosition[1].x) / scaleX,
          y2: Math.max(currentPosition[0].y, currentPosition[1].y) / scaleY
        }
        if (Number(node.getAttribute('x')) < Number(resize.getAttribute('x'))) {
          transformObj.setAttribute('x', x)
          transformObj.setAttribute('width', x2 - x)
        } else {
          transformObj.setAttribute('width', x - x1)
        }
        if (Number(node.getAttribute('y')) < Number(resize.getAttribute('y'))) {
          transformObj.setAttribute('y', y)
          transformObj.setAttribute('height', y2 - y)
        } else {
          transformObj.setAttribute('height', y - y1)
        }
        this.currentGraph.position = [{
          x: Number(transformObj.getAttribute('x')) * scaleX,
          y: Number(transformObj.getAttribute('y'))  * scaleY
        }, {
          x: (Number(transformObj.getAttribute('x')) + Number(transformObj.getAttribute('width'))) * scaleX,
          y: (Number(transformObj.getAttribute('y')) + Number(transformObj.getAttribute('height'))) * scaleY
        }]
        break
      case 'pointer':
        transformObj.setAttribute('cx', x)
        transformObj.setAttribute('cy', y)
        this.currentGraph.position = [{
          x: x * scaleX,
          y: y * scaleY
        }]
        break
      case 'circle':
        const _x = Math.abs(y - currentPosition[0].y / scaleY)
        const _y = Math.abs(x - currentPosition[0].x / scaleX)
        const r = Math.sqrt(Math.pow(_x, 2) + Math.pow(_y, 2))
        transformObj.setAttribute('r', r)
        this.currentGraph.position[1] = {
          x: x * scaleX,
          y: y * scaleY
        }
        break
      case 'polygon':
      case 'polyline':
        let points_polygon = transformObj.getAttribute('points')
        const pointsArr_polygon = points_polygon.split(' ')
        pointsArr_polygon[positionIndex] = x + ',' + y
        if (pointsArr_polygon[pointsArr_polygon.length - 1] === '') pointsArr_polygon.pop()
        transformObj.setAttribute('points', pointsArr_polygon.join(' '))
        this.currentGraph.position = pointsArr_polygon.map(item => {
          return {
            x: item.split(',')[0] * scaleX,
            y: item.split(',')[1] * scaleY
          }
        })
        break
      }
    },
    async addMenu () {
      const params = {
        categoryName: this.form.name,
        dlId: this.detailData.id
      }
      const res = await menuConfig.addMenu(params)
      if (res.code !== 0) return false
      this.$message.success('新增成功')
      this.$emit('reload')
    },
    handleCancel () {
      this.form = {
        name: ''
      }
      if (this.$refs.ruleForm) this.$refs.ruleForm.clearValidate()
      this.visible = false
    },
    checkSelectChange () {
      this.listLoad = true
      this.$parent.reviewRange = this.checkSelect
      this.$parent.changeMarkRange().then(() => {
        this.$nextTick(() => {
          this.previewImage = this.data[0].id
          this.currentImageIndex = 1
          this.listLoad = false
          this.activeArea()
        })
      })
    }
  }
}
</script>

<style lang="less" scoped>
@import url('./style.less');
</style>