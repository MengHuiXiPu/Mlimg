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
      <div class="splicing-modal-content">
        <div class="top-header">
          <a-button type="primary" @click="doCloseModal" size="medium">退出</a-button>
        </div>
        <div class="main-content">
          <div class="left-box">
            <div class="banner-text">{{ templateData.path ? '拼接结果': '请在字符库中选择需要拼接的字符' }}</div>
            <div class="toolbar" v-show="!templateData.path">
              <a-button type="primary" @click="selectAll" size="small">全选</a-button>
              <a-button type="primary" @click="invertSelection" style="margin-left: 10px;" size="small">反选</a-button>
              <a-checkbox :indeterminate="indeterminate" v-model="allBinarize" @change="onAllBinarizeChange" style="margin-left: 25px;">
                全都字符二值化
                <a-tooltip>
                  <template slot="title">
                    <span style="font-size: 12px;">点击勾选：所有图片都被勾选二值化；<br>取消勾选：所有图片都取消勾选二值化</span>
                  </template>
                  <a-icon type="question-circle-o" style="vertical-align: 1px;"/>
                </a-tooltip>
              </a-checkbox> 
            </div>
            <div class="center-area">
              <template v-if="!templateData.path">
                <div 
                  class="char-img-list scrollbar"
                  v-infinite-scroll="loadMore" 
                  infinite-scroll-distance="0" 
                  infinite-scroll-disabled="loadDisabled"
                  infinite-scroll-delay="300"
                  infinite-scroll-immediate="false"
                >
                  <div class="char-img-item" v-for="(item,index) in charImgList" :key="index">
                    <span class="char-img-name-header" @click.stop="toggleSelect(item)">
                      <a-radio v-model="item._selected"></a-radio>
                      <span class="char-img-name" :title="item.filename">{{ item.filename }}</span>
                    </span>
                    <el-image :src="matchImgSrc(item)" class="char-img" @click.stop="toggleSelect(item)"></el-image>
                    <a-checkbox v-model="item.picIsBinarize">二值化</a-checkbox>
                  </div>
                  <!--  -->
                  <p v-if="charImgListLoading" class="loading-text" ><i class="el-icon-loading"></i>&nbsp;加载中...</p>
                  <div v-if="!charImgListLoading && loadDisabled" style="width: 100%;">
                    <div style="text-align: center;margin: 15px 0;">{{ charImgList.length ? '无更多数据': '暂无数据' }}</div>
                  </div>
                  <!-- 底部占位，可以让用户看到加载中 -->
                  <div style="height: 30px;"></div>
                </div>
              </template>
              <div class="temp-img-container" v-if="templateData.path">
                <el-image :src="matchImgSrc(templateData)" fit="contain" class="temp-img" :preview-src-list="[templateData.url]"></el-image>
              </div>
            </div>
          </div>
          <div class="config-panel">
            <header class="right-header">操作区</header>
            <div class="right-content">
              <label class="label-header" style="margin-bottom: 20px;">选择字符总数量 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ totalCharNum }}</label>
              <label class="label-header">拼接规则设置</label>
              <a-form-model
                style="width: 100%;"
                :model="configData"
                :rules="formRules"
                :label-col="labelCol"
                :wrapper-col="wrapperCol"
                labelAlign="left"
                ref="refInputForm"
              >
                <a-form-model-item label="每行字符图数量" prop="linePicNum">
                  <a-input-number size="small" :min="1" :precision="0" v-model="configData.linePicNum" />
                </a-form-model-item>
                <a-form-model-item label="列间是否预留空白位" prop="columnsExistSpaces">
                  <a-radio-group v-model="configData.columnsExistSpaces">
                    <a-radio :value="true">是</a-radio>
                    <a-radio :value="false">否</a-radio>
                  </a-radio-group>
                </a-form-model-item>
                <a-form-model-item label="行间是否错开空白位" prop="lineExistSpaces">
                  <a-radio-group v-model="configData.lineExistSpaces">
                    <a-radio :value="true">是</a-radio>
                    <a-radio :value="false">否</a-radio>
                  </a-radio-group>
                </a-form-model-item>
              </a-form-model>
              <div class="btn-area space-around">
              <a-button type="primary" @click="handleGenerate" v-if="!templateData.path">点击生成模板</a-button>
                <a-button type="primary" v-show="templateData.path" @click="showSaveTempModal=true" :disabled="templateData.isSaved">保存模板</a-button>
                <a-button type="primary" @click="remake" v-show="templateData.path">重新制作</a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-spin>
    <!-- 保存模板 moadal -->
    <a-modal
      title="保存模板"
      :visible="showSaveTempModal"
      :confirm-loading="saveTempLoading"
      okText="保存"
      @ok="handleSaveTemp"
      @cancel="showSaveTempModal=false"
    >
    <a-form-model :model="saveTempFormData" :rules="saveTempFormRules" :label-col="{ span: 6 }" :wrapper-col="{ span: 17 }" ref="refSaveTempForm">
      <a-form-model-item label="模板名称" prop="templateName">
        <a-input v-model="saveTempFormData.templateName" :maxLength="128"/>
      </a-form-model-item>
      </a-form-model>
    </a-modal>
  </a-modal>
</template>
<script>
// 字符图拼接
import { generateOcrTemplate, saveOcrTemplate, getStepList } from "@/api/ocrCharLib.js";
import { getPicByPath } from "@/api/tempMake.js";
import { validateName } from '@/utils';
export default {
  name: "splicingModal",
  props: {
    // 模板id
    tempId: {
      type: String | Number,
      default: ""
    },
    visible: {
      type: Boolean,
      default: false
    },
  },
  data() {
    return {
      spinning: false,
      pagination: {
        pageSize: 60, //太小了不会触发滚动条懒加载，且字符图都很小,可以多加载
        total: 0,
        current: 1,
      },
      charImgList: [], //字符图列表
      charImgListLoading: false, // 字符图列表加载中
      indeterminate: false, // 全选半选状态
      allBinarize: true, //全都字符二值化

      labelCol: { span: 14 },
      wrapperCol: { span: 10 },
      configData: {
        templateName: '', //模板名称
        linePicNum: 1, //每行字符图数量
        columnsExistSpaces: true, //列间是否预留空白位
        lineExistSpaces: true, //行间是否错开空白位
      },
      formRules: {
        linePicNum: [
          { required: true, message: '请输入每行字符图数量', trigger: 'change' },
        ],
        columnsExistSpaces: [
          { required: true, message: '请选择列间是否预留空白位', trigger: 'change' },
        ],
        lineExistSpaces: [
          { required: true, message: '请选择行间是否错开空白位', trigger: 'change' },
        ],
      },
      // 生成的模板图信息,每次重心制作时重置
      templateData: {
        path: '',
        url: '',
        isSaved: false, //是否已经保存过，保存过不能再次点击保存
      },
      showSaveTempModal: false, //
      saveTempLoading: false,
      saveTempFormData: {
        templateName: '',
      },
      saveTempFormRules: {
        templateName: [
          { required: true, message: '请输入模板名称', trigger: 'blur' },
          { validator: validateName, trigger: ["blur", "change"] }
        ],
      }
    }
  },
  computed: {
    totalCharNum() {
      return this.charImgList.filter(item => item._selected).length
    },
    // 判定不再需要滚动加载的标识变量
    loadDisabled() {
      if (!this.pagination.total) return true
      return this.charImgList.length && (this.charImgList.length >= this.pagination.total)
    },
  },
  methods: {
    // 重新制作
    remake() {
      // 清空生成的模板图的路径
      this.templateData.url = "";
      this.templateData.path = "";
      this.templateData.isSaved = false;
    },
    // 选中/取消选中
    toggleSelect(image) {
      image._selected = !image._selected
    },
    // 全选
    selectAll() {
      this.charImgList.forEach(item => {
        item._selected = true;
      });
    },
    // 反选
    invertSelection() {
      this.charImgList.forEach(item => {
        item._selected = !item._selected;
      });
    },
    // 是否全部二值化切换
    onAllBinarizeChange() {
      this.charImgList.forEach(item => {
        item.picIsBinarize = this.allBinarize
      });
    },
    // 调用算法生成模板图
    handleGenerate() {
      if (this.totalCharNum < 1) {
        return this.$message.warning('请选择字符图')
      }
      const { linePicNum, columnsExistSpaces, lineExistSpaces } = this.configData
      if (!linePicNum) return this.$message.warning('请输入每行字符图数量')
      const picList = this.charImgList.filter(item => item._selected).map(item => {
        return {
          picIsBinarize: item.picIsBinarize, //是否二值化
          picPath: item.path
        }
      })
      this.spinning = true;
      this.spinningText = "模板生成中..."
      generateOcrTemplate({
        templateMakeInfoId: this.tempId,
        // templateName: '',
        columnsExistSpaces,
        lineExistSpaces,
        linePicNum,
        picList,
      }).then(res => {
        if (res.code === 0) {
          this.$message.success('生成模板成功')
          // 获取生成的模板路径，并加载对应的模板图
          this.templateData.path = res.data
          // this.templateData.url = ""
          getPicByPath(this.templateData.path).then(blob => {
            this.templateData.url = window.URL.createObjectURL(blob)
          })
        }
      }).finally(() => {
        this.spinning = this.spinningText = false
      })
    },
    // 保存模板
    handleSaveTemp() {
      // 校验表单
      this.$refs.refSaveTempForm.validate(valid => {
        if (valid) {
          this.saveTempLoading = true
          saveOcrTemplate({
            path: this.templateData.path, //模板路径
            templateName: this.saveTempFormData.templateName, //模板名称
            dataProcessingId: this.tempId,
            stepEnum: 33, // enum 模板图固定
          }).then(res => {
            if (res.code === 0) {
              this.$message.success('模板保存成功')
              this.templateData.isSaved = true;
              this.showSaveTempModal = false;
              this.saveTempFormData.templateName = "";
            }
          }).finally(() => {
            this.saveTempLoading = false
          })
        }
      })
    },
    /**
     * 分页加载更多图片
     */
    loadMore() {
      if (this.charImgListLoading) return
      this.pagination.current++
      this.fetchCharImgList()
    },
    // 获取字符图列表
    fetchCharImgList() {
      this.charImgListLoading = true
      const { current, pageSize } = this.pagination;
      getStepList({
        dataProcessingId: this.tempId,
        pageNo: current,
        limit: pageSize,
        stepEnum: "32", //字符图固定 32
      }).then(res => {
        if (res.code === 0) {
          this.pagination.total = res.data.total
          // 遍历去加载图片
          res.data.records.forEach(item => {
            this.$set(item, '_isShowMask', false)
            this.$set(item, '_selected', false) //默认不勾选
            this.$set(item, 'picIsBinarize', true) //二值化默认全部勾选
            getPicByPath(item.path).then(res => {
              const url = window.URL.createObjectURL(res)
              this.$set(item, 'url', url)
            })
          })
          this.charImgList = this.charImgList.concat(res.data.records)
        }
      }).finally(() => {
        this.charImgListLoading = false
      })
    },
    matchImgSrc(item) {
      return item.url || require("@/assets/images/place.gif");
    },
    doCloseModal() {
      this.$emit('update:visible', false)
      this.$emit('close')
    }
  },
  created() {
    this.fetchCharImgList()
  }
}
</script>
<style lang="less" scoped>
.splicing-modal-content {
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
      .banner-text {
        height: 35px;
        line-height: 35px;
        font-size: 14px;
        // color: #e6a23c;
        color: #333;
        font-weight: 700;
        text-align: center;
      }
      .toolbar {
        height: 35px;
      }
      .char-img-list {
        max-height: calc(100vh - 120px);
        overflow: auto;
        display: flex;
        flex-wrap: wrap;
        .char-img-item {
          // width: 120px;
          width: 8vw;
          min-width: 100px; //最小 100px
          height: 130px;
          margin: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          .char-img-name-header {
            width: 8vw;
            height: 20px;
            margin-bottom: 5px;
            cursor: pointer;
            .char-img-name {
              display: inline-block;
              text-align: left;
              // width: 95px;
              width: 6vw;
              vertical-align: middle;
              text-align: center;
              font-size: 12px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
          .char-img {
            width: 100%;
            height: 80px;
            cursor: pointer;
            margin-bottom: 5px;
          }
        }
        .loading-text {
          width: 100%; //使其在 flex 中换行显示 而不是
          text-align: center;
          height: 20px;
          margin-top: 10px;
        }
      }
      .temp-img-container {
        width: 100%;
        padding: 30px;
        .temp-img {
          width: 100%;
          height: 80vh;
        }
      }
    }
    .config-panel {
      margin-top: 10px;
      width: 300px;
      height: calc(100vh - 60px);
      border-top: 1px solid #f2f2f2;
      border-left: 1px solid #f2f2f2;
      background-color: #fff;
      padding-left: 10px;
      .right-header {
        height: 40px;
        text-align: center;
        line-height: 40px;
        font-weight: 600;
      }
      .right-content {
        background-color: #d7edf7;
        height: calc(100% - 40px);
        overflow: auto;
        padding: 15px 10px;
        // .label-item {
        //   color: #333;
        //   font-size: 14px;
        //   display: block;
        //   font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
        //     "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
        //     "Helvetica Neue", Helvetica, Arial, sans-serif, "Apple Color Emoji",
        //     "Segoe UI Emoji", "Segoe UI Symbol";
        // }
        .label-header {
          display: block;
          color: #333;
          font-size: 14px;
          font-weight: 700;
          margin: 10px 0;
        }
        /deep/ .ant-form-item {
          margin-bottom: 0px;
        }
      }
    }
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
</style>

