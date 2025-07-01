<template>
  <div class="sample-detail">
    <a-spin :spinning="exportLoading" tip="正在准备文件中，请稍等...">
      <div class="loading" slot="indicator" style="width: 300px;transform: translateX(-50%);">
        <a-progress :percent="exportLoadingNumber" status="active" />
      </div>
      <div class="sample-detail-image">
        <div class="sample-detail-left">
          <div class="search-sit">
            <a-input-search placeholder="请输入类别名称" @search="onSearch" @change="onSearchChange" />
          </div>
          <ul class="left-list scrollbar">
            <li class="left-list-item">
              <a-checkbox v-if="exportType" :indeterminate="indeterminate" :checked="checkAll" @change="changeSelectAll">
                全选
              </a-checkbox>
              <!-- <a v-if="$route.query.dlType !== '3'" class="addMenu" @click="showAddMenu()">
                添加类别
              </a> -->
            </li>
            <li class="left-list-item list-desc">
              <span style="width: 90px;">标签名</span>
              <span>图片数</span>
              <span>标注数</span>
            </li>
            <li v-for="(val, index) in menuData" :key="index" class="left-list-item" :class="{
              select: selectMenu === val.name
            }" @click="handleCategorySelect(val.name)">
              <template v-if="exportType || editType">
                <!-- 类别复选框 -->
                <!-- <a-checkbox v-model="val.selected" @click.stop @change="changeSelectCode($event, val.name)"></a-checkbox> -->
                <a-checkbox :checked="val.selected" :disabled="val.disabled" :indeterminate="val.indeterminate" @click.stop @change="changeSelectCode($event, val.name)"></a-checkbox>
              </template>
              <span class="lebel" :title="val.name">{{ val.name }}</span>
              <span class="number" :class="val.value === 0 && 'isZero'">
                <a-badge :overflow-count="9999" :count="val.value ? val.value : 0" show-zero
                  :number-style="{ backgroundColor: '#52c41a' }" />
              </span>
              <!-- 标注数 -->
              <span><a-badge :overflow-count="9999" :count="val.annoNum ? val.annoNum : 0" show-zero :number-style="{ backgroundColor: '#52c41a' }" /></span>
            </li>
          </ul>
        </div>
        <div class="sample-detail-right">
          <div class="sample-detail-header">
            <div class="sample-detail-group" v-show="editType">
              <a-button-group size="small">
                <a-dropdown :disabled="selectImageList.length === 0 && selectCodeList.length === 0">
                  <a-menu slot="overlay" @click="moveTo" style="max-height: 200px;overflow-y: auto">
                    <a-menu-item
                      :disabled="(selectCodeList.length === 0 && selectMenu === item.name) || (selectCodeList.length > 0 && selectCodeList[0].name === item.name)"
                      v-for="item in menuNumber" :key="item.name">
                      {{ item.name }}
                    </a-menu-item>
                  </a-menu>
                  <a-button type="default">移动至<a-icon type="down" /></a-button>
                </a-dropdown>
                <a-upload :accept="accept.toString()" :showUploadList="false" :before-upload="uploadImage">
                  <a-button type="default" size="small">上传<a-icon type="upload"></a-icon></a-button>
                </a-upload>
                <a-popconfirm title="确定删除当前选中项么?" ok-text="是" cancel-text="否" @confirm="deleteImage"
                  :disabled="selectImageList.length === 0 && selectCodeList.length === 0">
                  <!-- 后端说目前调用的删除接口废弃了，先前端隐藏删除功能 -->
                  <!-- <a-button type="default"
                    :disabled="selectImageList.length === 0 && selectCodeList.length === 0">删除<a-icon
                      type="delete"></a-icon></a-button> -->
                </a-popconfirm>
                <a-button :type="selectAllImgType && 'primary'" @click="selectAllImg">全选</a-button>
                <a-button :disabled="selectCodeList.length === 0" @click="removeAllLabel">清空标注</a-button>
              </a-button-group>
            </div>
            <div class="sample-detail-group" v-show="exportType">
              <a-button-group>
                <a-tooltip>
                  <template slot="title" v-if="selectCodeList.length === 0">
                    请先选择类别
                  </template>
                  <a-button type="default" @click="exportDataSet" :disabled="selectCodeList.length === 0">导出</a-button>
                </a-tooltip>
              </a-button-group>
            </div>
            <div class="sample-detail-check">
              <!-- 去除复核状态和标注状态筛选项 -->
              <!-- <span style="margin-right: 10px">{{ reviewRangeList[reviewRange].text }}：{{ reviewMarkNumber[0] }}</span>
              <span>复核状态：</span>
              <a-select size="small" v-model="reviewRange" @change="changeMarkRange" style="margin-right: 10px">
                <a-select-option v-for="item in reviewRangeList" :key="item.value" :value="item.value">
                  {{ item.text }}
                </a-select-option>
              </a-select>
              <span style="margin-right: 10px">{{ markRangeList[markRange].text }}：{{ reviewMarkNumber[1] }}</span>
              <span>标注状态：</span>
              <a-select size="small" v-model="markRange" @change="changeMarkRange" style="margin-right: 10px">
                <a-select-option v-for="item in markRangeList" :key="item.value" :value="item.value">
                  {{ item.text }}
                </a-select-option>
              </a-select> -->
              <a-checkbox :checked="exportType" @change="changeExportType" v-if="!readOnly">
                导出模式
              </a-checkbox>
              <a-checkbox :checked="editType" @change="changeEditType" v-if="!readOnly"
                :disabled="(detailData.dsType === 2 || detailData.dsType === 3) && detailData.deepCopy === 0 && detailData.remoteWritePermission !== 1">
                编辑模式
              </a-checkbox>
              <a style="cursor: pointer" @click="changeLabelType" v-show="['目标检测', '分割'].includes(detailData.dlTagType)">
                <a-icon type="interaction" style="margin-right: 3px;vertical-align:middle;" />
                <span>{{ labelType ? '隐藏标注' : '显示标注' }}</span>
              </a>
            </div>
          </div>
          <!--图片列表-->
          <div class="sample-detail-right-content">
            <!--设置等待状态-->
            <a-spin :spinning="imgListLoading">
              <!--遍历图片数组，以id为key值-->
              <div class="img-item" v-for="pictureId in pictureList" :key="pictureId.id">
                <img :id="'img_' + pictureId.id" :src="(labelType ? picIdUrlBboxMap[pictureId.id] : picIdUrlMap[pictureId.id]) || defaultPhone" style="border-radius: 4px;"
                  @click="handleShowLargePicture(pictureId.id)" />
                <!-- 显示空白复选框 ———— 编辑模式开启 || 没有选中任何类别 -->
                <div class="selectBtn" v-if="editType || selectCodeList.length !== 0">
                  <!--选中图片，暂时都禁用了，接口不支持自选图片做操作，只可以通过标签选择操作-->
                  <a-checkbox :checked="pictureId.selected" disabled @change="selectImage($event, pictureId)"></a-checkbox>
                </div>
                <!-- <a-icon v-if="!picIdUrlMap[pictureId.id]" type="loading" /> -->
                <a-icon v-if="labelType ? !picIdUrlBboxMap[pictureId.id] : !picIdUrlMap[pictureId.id]" type="loading" />
                <!-- <svg :xmlns="'http://www.w3.org/2000/svg'" v-show="labelType" version="1.1" :id="'svg' + pictureId.id"
                  @click="handleShowLargePicture(pictureId.id)"></svg> -->
              </div>
              <div class="img-item" style="opcity: 0" v-if="pictureList.length % 4 === 2"></div>
              <div class="img-item" style="opcity: 0" v-if="pictureList.length % 4 === 2 || pictureList.length % 4 === 3"></div>
            </a-spin>
          </div>
          <div class="pagation-image">
            <a-pagination :show-total="() => `共 ${pagination.total} 条`" show-quick-jumper
              :defaultPageSize="pagination.pageSize" :default-current="pagination.current" :current="pagination.current"
              :total="pagination.total" show-less-items @change="pageChange" />
          </div>
        </div>
      </div>
    </a-spin>
    <!-- <a-modal :visible="visible" title="新建类别" @ok="addMenu" @cancel="handleCancel" :maskClosable="false">
      <a-form-model :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" ref="ruleForm" :rules="rules" layout="horizontal">
        <a-form-model-item label="类别名称" prop="name">
          <a-input :maxLength="50" v-model="form.name" />
        </a-form-model-item>
      </a-form-model>
    </a-modal> -->
    <AnnotatorModal  
      :is-show.sync="visibleAnnotator" 
      :dataset-id="currentID" 
      :dlTagType="detailData.dlTagType"
      :select-menu="selectMenu" 
      :pagination="pagination" 
      :image-id="previewImage" 
      :pictureList="pictureList" 
      @on-fresh="reloadPage" />
    <!-- <ImagePreview v-else-if="env === 'production' && previewImage" :selectMenu="selectMenu" :menuData="menuNumber" :data="pictureList"
      :pictureList="picIdUrlMap" :default="previewImage" :detailData="detailData" :pagination="pagination"
      @close="closePreview" @save="handleCategorySelect(selectMenu)" @reload="getData(currentID, selectMenu)"
      @page="imagePreviewPageChange" @delete="deleteImage" @moveTo="moveTo" /> -->
  </div>
</template>

<script>
import axios from "axios";
import ImagePreview from '@/components/ImagePreview'
import AnnotatorModal from './annotatorModal'
import { activeAreaConfig, makeSVG } from '@/components/ImagePreview/config'
import { downloadFile } from '@/utils/util'
import debounce from 'lodash.debounce'
import {
  getSingleDataListDetailById,
  moveCodeImageToNewCategory,
  getPictureIdPageList,
  movePictureToNewCategory,
  uploadPictureCurrentCategory,
  removeMultiPicture,
  menuConfig,
  activeDownload,
  getMaxCodeImageNumber,
  removeAllLabel,
} from "@/api/dataCenter"
import {
  getFileCategoryAndCount,
  getSearchCategory,
  getPicture,
  downloadFileCommon
} from "@/api/modelManage"
export default {
  name: 'sampleDetail',
  components: {
    ImagePreview,
    AnnotatorModal
  },
  data() {
    return {
      loading: false,
      imgListLoading: false,
      exportLoading: false,
      exportLoadingNumber: 0,
      exportLoadingTime: null,
      visible: false,
      visibleAnnotator: false,
      menuData: [],
      menuNumber: [],
      currentID: null,
      selectMenu: '',
      pictureData: [],
      pictureList: [],
      picIdUrlMap: {},
      picIdUrlBboxMap: {},
      pagination: {
        total: 0,
        pageSize: 16,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["16", "20", "24", "28"]
      },
      previewImage: null,
      editType: false,
      labelType: false,
      exportType: false,
      indeterminate: false,
      checkAll: false,
      selectAllImgType: false,
      progress: {
        val: 0,
        status: 'active'
      },
      accept: ['.jpg', '.png', '.jpeg', '.svg', '.gif'],
      form: {
        name: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入类别名称', trigger: 'blur' },
          { required: true, pattern: /^[a-zA-Z0-9-_\u4e00-\u9fa5]+$/, max: 50, message: '名称只能包含数字、字母、中文和下划线', trigger: "blur" }, 
        ]
      },
      markRange: 0,
      reviewRange: 0,
      batch_move_max_size: 1000,
      reviewMarkNumber: [0, 0],
      allTotal: 0,
      reviewRangeList: [{
        value: 0,
        text: '全部'
      }, {
        value: 1,
        text: '已复核'
      }, {
        value: 2,
        text: '未复核'
      }],
      markRangeList: [{
        value: 0,
        text: '全部'
      }, {
        value: 1,
        text: '已标注'
      }, {
        value: 2,
        text: '未标注'
      }],
      env: process.env.NODE_ENV
    }
  },
  computed: {
    selectImageList() {
      return this.pictureList.filter(item => item.selected)?.map(item => item.id)
    },
    // 用于判断左侧类别有几项被选择
    selectCodeList() {
      return this.menuData.filter(item => item.selected || item.indeterminate)
    },
    defaultPhone() {
      return require("@/assets/images/place.gif")
    }
  },
  props: {
    detailData: {
      type: Object,
      default: () => { }
    },
    currentID: {
      type: String,
      default: ''
    },
    // 只读模式：导出/编辑模式不可见，点击图片不会进入标注作业页面
    readOnly: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    isActive(val) {
      if (val) {
        document.addEventListener('keydown', this.keyChangePagination, false)
      } else {
        document.removeEventListener('keydown', this.keyChangePagination, false)
      }
    }
  },
  beforeDestroy() {
    // 清空图片缓存
    Object.values(this.picIdUrlMap).forEach(item => {
      window.URL.revokeObjectURL(item)
    })
    document.removeEventListener('keydown', this.keyChangePagination, false)
  },
  mounted() {
    this.active()
    this.getResourceConfig()
    this.getData(this.currentID)
    document.addEventListener('keydown', this.keyChangePagination, false)
  },
  methods: {
    async getResourceConfig() {
      const res = await getMaxCodeImageNumber({ keyName: 'batch_move_max_size' })
      if (res.code !== 0) return false
      this.batch_move_max_size = Number(res.data.valueInfo)
    },
    async moveTo(param) {
      // 将当前选中图片移动至其他分类--接口是移动整个标签内所有图片，无法移动单张图片，需要修改接口--todo
      // 需要判断有没有选中的图片，没有的话就禁用
      const key = param.key
      if (this.selectCodeList.length > 0) {
        const total = this.selectCodeList?.map(item => item.value).reduce((t, v) => {
          return t + v
        })
        if (total > this.batch_move_max_size) {
          this.$message.warning('移动code图片数量不能超过' + this.batch_move_max_size)
          return false
        }
        const params = {
          destCategory: key,
          dlId: Number(this.currentID),
          requestType: 2,
          srcCategory: this.selectCodeList?.map(item => item.name)
        }
        this.imgListLoading = true
        const res = await moveCodeImageToNewCategory(params)
        this.imgListLoading = true
        if (res.code !== 0) return false
        this.$message.success('移动成功')
        if (this.selectCodeList[0].name !== this.selectMenu) {
          this.getData(this.currentID, this.selectMenu)
        } else {
          this.getData(this.currentID)
        }
      } else {
        const params = {
          destCategory: key,
          dlId: Number(this.currentID),
          id: param.id ? [param.id] : this.selectImageList,
          srcCategory: this.selectMenu,
          requestType: param.isReview ? 1 : 2
        }
        const data = await movePictureToNewCategory(params)
        this.$message.success('操作成功')
        const { current, total, pageSize } = this.pagination
        if ((this.selectImageList.length === this.pictureList.length || this.pictureList.length === 1) && current === Math.ceil(total / pageSize) && current !== 1) {
          this.pagination.current--
        }
        if (param.id) {
          this.handleCategorySelect(this.selectMenu)
        } else {
          this.getData(this.currentID, this.selectMenu)
        }
      }
    },
    uploadImage(file, list) {
      // 上传图片至当前分类，有可能还包含xml或者json文件
      // 上传完成之后需要重新请求接口刷新图片列表，并跳转到当前页
      if (!this.accept.includes(file.name.substring(file.name.lastIndexOf('.')).toLowerCase())) {
        this.$message.error('请上传图片或者json文件')
        return false
      }
      const formData = new FormData()
      formData.append('dlId', this.currentID)
      formData.append('fileCategory', this.selectMenu)
      formData.append('file', file)
      uploadPictureCurrentCategory(formData).then(data => {
        if (data.code === 0) {
          this.$message.success('上传成功')
          this.getData(this.currentID)
        }
      })
      return false
    },
    removeAllLabel() {
      this.$confirm({
        content: '确定要清空选中Code的所有标注么？',
        cancelText: '取消',
        okText: '确定',
        onOk: async () => {
          const params = {
            dlId: this.currentID,
            requestType: 2,
            reviewRange: this.reviewRange,
            codes: this.selectCodeList?.map(item => item.name).toString()
          }
          this.loading = true
          const res = await removeAllLabel(params)
          this.loading = false
          if (res.code !== 0) return false
          this.$message.success('操作成功')
          this.handleCategorySelect(this.selectMenu)
        }
      })
    },
    async deleteImage(param) {
      if (this.selectCodeList.length > 0) {
        const params = {
          categoryNames: this.selectCodeList?.map(item => item.name).toString(),
          reviewRange: this.reviewRange,
          markRange: this.markRange,
          dlId: this.currentID
        }
        menuConfig.deleteMenu(params).then(res => {
          if (res.code !== 0) return false
          this.$message.success('删除成功')
          this.getData(this.currentID)
        })
      } else {
        // 从当前分类删除当前选中的图片列表
        // 删除完成之后需要将当前图片列表中的最后一个删除，并且修改total
        const data = await removeMultiPicture({
          ids: String(param.id ? [param.id] : this.selectImageList),
          dlId: this.currentID
        })
        if (data.code === 0) {
          this.$message.success('删除成功')
          // this.handleCategorySelect(this.selectMenu)
          const { current, total, pageSize } = this.pagination
          if (this.selectImageList.length === this.pictureList.length && current === Math.ceil(total / pageSize) && current !== 1) {
            this.pagination.current--
          }
          if (param.id && this.pagination.total !== 1) {
            this.handleCategorySelect(this.selectMenu)
          } else {
            this.getData(this.currentID, this.selectMenu)
          }
        }
      }
    },
    // showAddMenu() {
    //   this.visible = true
    // },
    //  addMenu() {
    //   this.$refs.ruleForm.validate(async (valid) => {
    //     if(valid){
    //       const params = {
    //         categoryName: this.form.name,
    //         dlId: this.currentID
    //       }
    //       const res = await menuConfig.addMenu(params)
    //       if (res.code !== 0) return false
    //       this.$message.success('新增成功')
    //       this.getData(this.currentID)
    //       this.handleCancel()
    //     }
    //   });
    // },
    handleCancel() {
      this.form = {
        name: ''
      }
      this.$refs.ruleForm.resetFields()
      this.visible = false
    },
    changeExportType(e) {
      this.exportType = e.target.checked
      this.editType = false
      this.menuData.forEach(item => {
        item.selected = false
        item.disabled = false;
      })
      this.indeterminate = false
      this.checkAll = false
      // this.menuData.forEach((item, index) => {
      //   item.selected = false
      //   this.$set(this.menuData, index, item)
      // })
    },
    async exportDataSet() {
      // 导出数据集-目前只支持按照标签进行导出，根据checkbox勾选导出对应图片暂不支持，需修改接口--todo
      const total = this.selectCodeList?.map(item => item.value).reduce((total, num) => {
        return total + num
      })
      if (total > 10000) {
        this.$message.warning('单次导出图片总数不能超过一万张')
        return false
      }
      const codeList = this.selectCodeList?.map(item => item.name).join(',')
      this.exportLoading = true
      this.exportLoadingTime = setInterval(() => {
        this.exportLoadingNumber = this.exportLoadingNumber + Math.round((80 / total * 100))
      }, 1000)
      const res = await activeDownload({ dataListId: this.currentID, categorys: codeList })
      this.exportLoading = false
      clearInterval(this.exportLoadingTime)
      this.exportLoadingTime = null
      this.exportLoadingNumber = 0
      if (res.code !== 0) return false

      //const url = `/api/v1/datacenter/dataListFileDetail/downloadTargetCategoryPicture?zipFilePath=${res.data.zipFilePath}&requestId=${res.data.requestId}`

      // downloadTargetCategoryPicture({ zipFilePath: escape(res.data.zipFilePath) , requestId: res.data.requestId })
      const url = `/api/v1/datacenter/dataListFileDetail/downloadTargetCategoryPicture`;
      downloadFileCommon(url,{ zipFilePath: res.data.zipFilePath , requestId: res.data.requestId })
     // await downloadFile(url)
    },
    changeSelectCode(e, name) {
      // 获取当前复选框的状态
      const selected = e.target.checked;
      if (this.editType) {
        this.menuData.forEach(item => {
          if (name === item.name) {
            item.selected = selected
          } else {
            // 将除选中的其他复选框设为 disabled
            // item.disabled = e.target.checked;
            this.$set(item, 'disabled', e.target.checked);
          }
        })
        // this.menuData.forEach((item, index) => {
        //   if (name === item.name) {
        //     item.selected = selected
        //     this.$set(this.menuData, index, item)
        //   } else {
        //     // 将除选中的其他复选框设为 disabled
        //     // item.disabled = e.target.checked;
        //     this.$set(item, 'disabled', e.target.checked);
        //   }
        // })
      };
      if(this.exportType) {
        this.menuData.forEach(item => {
          if (name === item.name) {
            item.selected = selected;
            item.indeterminate = false;
          }
        })
      }
      // 全选的三个状态之一，全选 checkAll， 不全选 indeterminate， 全不选
      // selectCodeList在computed中根据menuData中menu的selected字段computed的，所以放在后面才能取到最新的值，fix bugid：ADCP-829
      this.indeterminate = !!this.selectCodeList.length && this.selectCodeList.length < this.menuData.length
      this.checkAll = this.selectCodeList.length === this.menuData.length
      // 根据当前复选框的状态更新所有图片的选中状态
      const picName = this.pictureList[0]?.categoryName;
      if(picName == name){
        this.selectAllImgType = !this.selectAllImgType
      }
      this.pictureList.forEach((item, index) => {
        if(item.categoryName === name){
          item.selected = selected;
        }
      });
      // 暂不修改吧
      // if(this.selectMenu == name) { //check的就是当前menu
      //   this.pictureList.forEach((item, index) => {
      //     item.selected = selected;
      //   });
      // }else { //先加载check的menu对应的pictures，再设置选中
      //   this.handleCategorySelect(name, () => {
      //     this.$nextTick(() => {
      //       this.pictureList.forEach((item, index) => {
      //         item.selected = selected;
      //       });
      //       this.selectAllImgType = true
      //     })
      //     this.menuData.forEach(item => {
      //       if (name === item.name) {
      //         item.selected = selected
      //       } else {
      //         // 将除选中的其他复选框设为 disabled
      //         // item.disabled = e.target.checked;
      //         this.$set(item, 'disabled', e.target.checked);
      //       }
      //     })
      //   })
      // }
      
    },
    changeSelectAll(e) {
      this.indeterminate = false
      this.checkAll = e.target.checked
      this.menuData.forEach(item => {
        item.selected = e.target.checked
      })
      this.pictureList.forEach(item => {
        item.selected = e.target.checked;
      });
    },
    selectAllImg() {
      // 判断当前展示的为哪一标签的图片，然后判断左侧选择的标签是否和展示标签一致。如果不一致，则全选无效。
      const categoryName = this.pictureList[0]?.categoryName;
      const category = this.menuData.filter(item => item.selected && item.name != categoryName);
      if(category.length) return;
      this.selectAllImgType = !this.selectAllImgType
      this.menuData.forEach(item => {
        if(item.name === categoryName){
          item.indeterminate = false;
          this.$set(item, 'selected', this.selectAllImgType)
        }
      })
      this.pictureList.forEach((item, index) => {
        item.selected = this.selectAllImgType
        this.$set(this.pictureList, index, item)
      })
    },
    pageChange(page, pageSize) {
      this.pagination.pageSize = pageSize
      this.pagination.current = page
      this.handleCategorySelect(this.selectMenu)
    },
    keyChangePagination(e) {
      if (this.imgListLoading) return false
      switch (e.keyCode) {
        case 37:
          if (this.pagination.current === 1) return false
          this.pageChange(this.pagination.current - 1, this.pagination.pageSize)
          break
        case 39:
          if (this.pagination.current === Math.ceil(this.pagination.total / this.pagination.pageSize)) return false
          this.pageChange(this.pagination.current + 1, this.pagination.pageSize)
          break
      }
    },
    async imagePreviewPageChange(data, callback) {//大图展示切换图片
      if (data === 'prev') {
        if (this.pagination.current === 1) {
          return callback([])
        }
        this.$set(this.pagination, 'current', this.pagination.current - 1)
      } else {
        if (this.pagination.current === Math.ceil(this.pagination.total / this.pagination.pageSize)) {
          return callback([])
        }
        this.$set(this.pagination, 'current', this.pagination.current + 1)
      }
      await this.handleCategorySelect(this.selectMenu, callback)
    },
    closePreview() {
      this.previewImage = null
      document.addEventListener('keydown', this.keyChangePagination, false)
      // this.getMenuData(this.currentID)
    },
    changeEditType(e) {
      this.selectAllImgType = false;
      this.editType = e.target.checked
      this.exportType = false
      this.menuData.forEach(item => {
        item.selected = false;
        item.disabled = false;
      })
      // this.menuData.forEach((item, index) => {
      //   item.selected = false
      //   this.$set(this.menuData, index, item)
      // })
      this.pictureList.forEach((item, index) => {
        item.selected = false
        this.$set(this.pictureList, index, item)
      })
    },
    // 切换是否显示标注
    changeLabelType() {
      this.labelType = !this.labelType
      this.pictureList.forEach((picId, index) => {//遍历图片列表
        picId.selected = false
        if (!this.picIdUrlBboxMap[picId.id]) {
          getPicture(picId.id, "thumbnail_with_bbox").then(res => {
            // console.log("res: ", res);
            const url = window.URL.createObjectURL(res)
            this.$set(this.picIdUrlBboxMap, picId.id, url)
            this.$forceUpdate()//强制重新渲染
          })
        }
      })
    },
    selectImage(e, pic) {
      const id = pic.id;
      const category = this.menuData.filter(item => item.name === pic.categoryName)[0];
      let num = 0; // 统计当前 pictureList 有几张图片被选中
      this.pictureList.forEach((item, index) => {
        if (item.id === id) {
          item.selected = e.target.checked
          this.$set(this.pictureList, index, item)
        }
        if(item.categoryName === category.name && item.selected){
          num++;
        }
      })
      if(num == 0){
        category.selected = false;
        category.indeterminate = false;
        this.selectAllImgType = false;
      }else if(num > 0 && num < this.pictureList.length){
        category.selected = false;
        category.indeterminate = true;
        this.selectAllImgType = false;
      }else if(num == this.pictureList.length){
        category.selected = true;
        category.indeterminate = false;
        this.selectAllImgType = true;
      }
    },
    async getSearchedDataList(param) {
      param = this.currentID + '_' + this.search
      const res = await getSearchCategory(param)
      if (res.code === 0) this.menuData = res.data.DataListCategory?.map((item, index) => {
        return {
          name: item,
          value: res.data.DataListCategoryNum[index],
          selected: false
        }
      })
    },
    async changeMarkRange() {
      this.pagination = {
        total: 0,
        pageSize: 16,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["16", "20", "24", "28"]
      }
      await this.getMenuData(this.currentID, this.selectMenu)
    },
    // 根据选择的类别获取到对应的图片列表val
    // 之前on-fresh会调用
    async handleCategorySelect(val, callback) {
      // 切换时 取消全部类别复选框的勾选
      this.menuData.forEach(item => {
        item.selected = false;
        // 取消选中的复选框的 disabled 设置
        this.$set(item, 'disabled', false);
      })
      // 切换时，全选框状态也要改变
      this.indeterminate = !!this.selectCodeList.length && this.selectCodeList.length < this.menuData.length
      this.checkAll = this.selectCodeList.length === this.menuData.length
      if (this.selectMenu !== val) {
        this.selectMenu = val
        this.pagination = {
          total: 0,
          pageSize: 16,
          current: 1,
          showSizeChanger: true,
          pageSizeOptions: ["16", "20", "24", "28"]
        }
      }
      this.selectAllImgType = false
      this.imgListLoading = true
      const params = {
        categoryName: val,
        id: this.currentID,
        limit: this.pagination.pageSize,
        pageNo: this.pagination.current,
        markRange: this.markRange,
        reviewRange: this.reviewRange
      }
      this.labelType = false
      const res = await getPictureIdPageList(params)//获取图片列表
      // const res = await axios.get(`/api/v1/datacenter/dataListFileDetail/pictureIdPageList`, { params })
      if (res.code !== 0) return false//若出错则接下来的不执行
      this.imgListLoading = false//将图片列表的加载状态置为false
      this.pagination.total = res.data.total//更新分页组件总数据条数
      this.pictureList = res.data.records;
      if (callback) callback(this.pictureList);
      this.$forceUpdate();//强制更新

      this.pictureList.forEach((picId, index) => {//遍历图片列表
        picId.selected = false;
        // 当前图片属于哪一类
        picId.categoryName = val;
        // const renders = () => {
        //   this.$nextTick(() => {
        //     const img = document.getElementById('img_' + String(picId.id))
        //     document.getElementById('svg' + String(picId.id)).innerHTML = ''
        //     const render = () => {
        //       const scaleX = img.naturalWidth / img.offsetWidth
        //       const scaleY = img.naturalHeight / img.offsetHeight
        //       picId.markPositions.forEach(item => {
        //         const { id, label, labelColor, type, position, positionList } = item
        //         for (let i = 0; i < positionList.length; i++) {
        //           const element = positionList[i];
        //           const config = activeAreaConfig({
        //             id: id + "_detail" + index, label, type, ...{ position: element }, ...{ labelColor: '#FFFFFF' }
        //           }, scaleX, scaleY, {})
        //           const graphics = makeSVG(item.type, config)
        //           graphics.setAttribute("fill", '#FF000096');
        //           this.$nextTick(() => {
        //             document.getElementById('svg' + String(picId.id)).appendChild(graphics)
        //           })
        //         }
        //       })
        //     }
        //     if (img && img.naturalWidth) {
        //       render()
        //     }
        //     else {
        //       img.onload = () => {
        //         render()
        //       }
        //     }
        //   })
        // }
        if (this.picIdUrlMap[picId.id]) {
          picId.url = this.picIdUrlMap[picId.id]
          this.$forceUpdate()
          // renders()
        } else {
          // picId.url = `${this.imageUrl}/${picId.id}`
          getPicture(picId.id, "thumbnail").then(res => {
            // console.log("res: ", res);
            const url = window.URL.createObjectURL(res)
            // console.log("url: ", url)
            picId.url = url
            this.$set(this.picIdUrlMap, picId.id, url)
            // if (picId.existPicMark) {
            //   renders()
            // }
            this.$forceUpdate()//强制重新渲染
          })
        }
      })
      // console.log(this.pictureList)
    },
    handleShowLargePicture(imageID) {
      if(this.readOnly) return
      if (this.editType) {
        this.pictureList.forEach((item, index) => {
          if (item.id === imageID) {
            item.selected = !item.selected
            this.$set(this.pictureList, index, item)
          }
        })
      } else {
        this.previewImage = imageID
        this.visibleAnnotator = true
        document.removeEventListener('keydown', this.keyChangePagination, false)
      }
    },
    async getMenuData(id, selectMenu) {
      const res = await getFileCategoryAndCount({
        id,
        markRange: this.markRange,
        reviewRange: this.reviewRange
      })
      if (res.code !== 0) return false
      if (res.data && Object.keys(res.data).length === 0) {
        this.menuNumber = []
        // this.noDataFun()
        return false
      }
      this.reviewMarkNumber = res.data.sum
      // this.noData = false
      this.menuNumber = res.data.DataListCategory?.map((item, index) => {
        return {
          name: item,
          value: res.data.DataListCategoryNum[index], 
          // 目前发现题库集接口没有返回DataListCategoryAnnoNum字段，导致报错，等待后台处理
          annoNum: (res.data?.DataListCategoryAnnoNum || [])[index],   //提取类别下的标注数量
        }
      }).sort((a, b) => {
        return b.value - a.value
      })
      this.menuData = [...this.menuNumber]?.map(item => {
        return {
          ...item,
          selected: false,
          // 根据右侧图片列表是否全选修改左侧对应标签下全选框选择样式
          indeterminate: false,
        }
      })
      if (selectMenu) {
        await this.handleCategorySelect(selectMenu)
      } else {
        this.menuNumber[0] && await this.handleCategorySelect(this.menuNumber[0].name)
      }
      return res
    },
    async getData(id, selectMenu) {
      this.loading = true
      getSingleDataListDetailById(id).then(res => {
        if (res.code === 0) {
          this.detailData = res.data || []
          if (this.detailData.markFileType === 2) {
            this.accept.push('.xml')
          } else {
            this.accept.push('.json')
          }
        }
      })
      const res = await this.getMenuData(id, selectMenu)
      this.loading = false
    },
    active() {
      this.editType = false
      this.labelType = false
      this.exportType = false
      this.checkAll = false
      this.indeterminate = false
      this.pagination = {
        total: 0,
        pageSize: 16,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["16", "20", "24", "28"]
      }
      this.pictureList = []
      this.menuNumber = []
      this.option2 = {}
    },
    onSearchChange:
      debounce(function (e) {
        this.search = e.target.value
        const id = this.$route.query.id
        const param = id + '_' + this.search
        this.getSearchingDataList(param)
      }, 300),
    onSearch:
      debounce(function (value) {
        this.search = value
        this.getSearchedDataList(value)
      }, 300),
    async getSearchingDataList(param) {
      const res = await getSearchCategory(param)
      if (res.code === 0) this.menuData = res.data.DataListCategory?.map((item, index) => {
        return {
          name: item,
          value: res.data.DataListCategoryNum[index],
          selected: false
        }
      })
    },
    reloadPage() {
      this.active()
      this.getResourceConfig()
      this.getData(this.currentID)
      document.addEventListener('keydown', this.keyChangePagination, false)
    }
  }
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
/deep/ .ant-tabs .ant-tabs-card .ant-tabs-card-bar .ant-tabs-tab {
  margin: 0 10px;
}
.sample-detail-image {
  // height: calc(100vh - 250px);
  display: flex;
  .sample-detail-left {
    background-color: @baseLayoutBgColor;
    height: auto;
  }
  .sample-detail-right {
    background-color: @baseLayoutBgColor;
    flex: 1;
    margin-left: 16px;
    border-radius: 16px;
    overflow-y: auto;
    /deep/ .ant-select{
      width: 80px;
    }
  }
}
.pagation-image {
  float: right;
  padding: 5px 10px;
}

.sample-detail {
  &-header {
    height: 40px;
    padding: 0 1%;
  }

  &-check {
    text-align: right;
  }

  &-group {
    float: left;
  }

  .ant-radio-button-wrapper {
    padding: 0 11px;
  }

  &-left {
    width: 240px;
    padding: 10px;
    float: left;
    // background: rgba(247, 247, 248, 1);
    background-color: @baseLayoutBgColor;

    .search-sit {
      width: 100%;
      height: 36px;
      background: rgba(255, 255, 255, 1);
      border-radius: 2px;
      // border: 2px solid rgba(230, 231, 234, 1);
    }
    .list-desc {
      font-size: 13px;
      margin: 0 0 5px 5px;
    }
    .left-list {
      margin-top: 10px;
      height: calc(100% - 36px);
      list-style: none;
      overflow: auto;

      .addMenu {
        float: right;
        cursor: pointer;
      }

      &-item {
        height: 24px;
        line-height: 24px;
        // padding: 0 10px;
        color: #09102F;
        cursor: pointer;
        overflow: hidden;

        // 
        display: flex;
        justify-content: space-between;

        &>label {
          display: inline-block;
          vertical-align: top;
          height: 16px;
          line-height: 16px;
          margin-top: 4px;
        }

        &>.lebel {
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          width: 90px;
          display: inline-block;
          margin-left: 5px;
        }

        &.select {
          background: #E6E7EA;
          border-radius: 4px;
        }

        &>.number.isZero {
          .anticon {
            display: none;
            font-size: 18px;
            vertical-align: middle;
            color: red
          }
        }

        &:hover>.number.isZero {
          .ant-badge {
            display: none;
          }

          .anticon {
            display: inline-block;
          }
        }
      }
    }
  }

  &-right {
    width: calc(100% - 200px);
    float: left;
    padding-left: 10px;
    height: 100%;

    &-content {
      .ant-spin-nested-loading,
      /deep/ .ant-spin-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
      }
    }
    .img-item {
      position: relative;
      width: 24.2%;
      margin: 5px;
      height: auto;
      min-width: 200px;
      margin-bottom: 12px;
      cursor: pointer;

      .selectBtn {
        position: absolute;
        top: 0;
        z-index: 2;
      }

      img {
        width: 100%;
        height: 100%;
        user-select: none;
      }

      &>svg {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
        // padding: 0 10px;
      }

      i {
        position: absolute;
        left: 50%;
        top: 50%;
        font-size: 50px;
        transform: translate3d(-50%, -50%, 0);
        z-index: 2;
        // transform: translateX(-50%)!important;
        // transform: translateY(-50%)!important;
      }
    }
  }
}
</style>