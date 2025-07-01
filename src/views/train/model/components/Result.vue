<template>
    <div>
    <div class="result">
        <a-radio-group style="display: block" :value="value" @change="handleChange">
            <a-radio-button value="1">
                结果列表
            </a-radio-button>
            <a-radio-button value="2">
                混淆矩阵
            </a-radio-button>
            <a-radio-button value="3">
                数据分流图
            </a-radio-button>
            <a-radio-button value="4" v-if="modelType == 2">
                数据分析结果
            </a-radio-button>
            <a-radio-button value="5" v-if="type === 'forecast'">
                分析测算
            </a-radio-button>
            <!--混淆矩阵导出按钮-->
            <a-icon v-if="value === '2'" style="float: right;font-size: 20px" type="download" @click="exportExcel" />
            <span v-if="value === '1' && type === 'forecast'" @click="handleExport" style="cursor: pointer; color: #0679dc;float: right;line-height: 32px">
                <a-icon type="export" style="margin-right: 5px;vertical-align: middle;" />转换为数据集
            </span>
            <div v-if="value === '3'" style="float: right;width: 200px">
                <!-- 添加label显示 -->
                <a-slider v-model="zoomValue" @change="changeZoom" :step="0.05" :min="0" :max="1" />
            </div>
        </a-radio-group>
        <a-row v-if="value === '1'" style="margin-top: 15px;" :gutter="24" type="flex" justify="space-between">
            <div style="width: 100%;margin: 0 0 10px 15px">
                <span style="display: inline-block">选择类别：</span>
                <a-select v-model="codeType" @change="getResultList">
                    <a-select-option :value="1">预测类别</a-select-option>
                    <a-select-option :value="2">真实类别</a-select-option>
                </a-select>
            </div>
            <a-col :span="14">
                <a-spin :spinning="resultTableLoading">
                    <div class="result-left">
                        <!--结果列表左侧详细内容-->
                        <a-table :scroll="{ x: true, y: true }"
                                 :pagination="false"
                                 :columns="columns"
                                 :data-source="tableData"
                                 :customRow="getCustomRow"
                                 :rowClassName="getRowClassName"
                                 rowKey="id"
                                 v-if="this.tableData.length > 0">
                            <span slot="errorRatio" slot-scope="text, records">
                                <a-progress :format="(num) => `${num}%`" status="exception" :percent="Number(records.errorRatio)" />
                            </span>
                            <span slot="errorPercent" slot-scope="text, records">
                                <a-progress :format="(num) => `${num}%`" status="exception" :percent="Number(records.errorPercent)" />
                            </span>
                        </a-table>
                        <NoData v-else />
                    </div>
                </a-spin>
            </a-col>
            <a-col :span="10">
                <div class="result-right">
                    <div class="result-right-top">
                        <div class="title1">
                            <a-row type="flex" justify="space-between">
                                <a-col :span="12" class="name">
                                    {{ record.category ? `${record.category}错分详情` : '错分详情' }}
                                </a-col>
                            </a-row>
                        </div>
                        <div class="top1">
                            <a-spin :spinning="barLodaing">
                                <echart :styleObj="echartWidth"
                                        :option="option"
                                        v-if="this.barData.length > 0" />
                                <NoData v-else />
                            </a-spin>
                        </div>
                    </div>
                    <!--结果详情右下角-->
                    <div class="result-right-bottom">
                        <!--标题-->
                        <div class="title2">
                            <a-row type="flex" justify="space-between">
                                <a-col :span="6" class="name">
                                    {{ `${record.category || ''}样本详情`}}
                                </a-col>
                                <a-col :span="16" style="text-align:right">
                                    <span>置信度显示精度:&nbsp;&nbsp;</span>
                                    <a-select v-model="confPrecision" size="small" style="width: 60px;margin-right: 15px;">
                                        <a-select-option :value="item" v-for="item in 10">{{ item }}</a-select-option>
                                    </a-select>
                                    <a-select v-model="resultType" size="small" @change="getSampleDetailList()">
                                        <a-select-option :value="0">全部</a-select-option>
                                        <a-select-option :value="1">正确</a-select-option>
                                        <a-select-option :value="2">错误</a-select-option>
                                    </a-select>
                                    <a-button size="small" @click="downloadExcel" style="margin-left: 5px">导出</a-button>
                                </a-col>
                            </a-row>
                        </div>
                        <!--右下角表格-->
                        <div class="bottom1">
                            <a-spin :spinning="sampleTableLoading">
                                <a-table :scroll="{ x: true, y: true }"
                                         :columns="sampleTableColumns"
                                         :data-source="_sampleTableData"
                                         rowKey="id"
                                         :pagination="pagination"
                                         @change="handleTableChange">
                                    <div slot="imgPath" slot-scope="text, records" class="viewer-css">
                                        <img @click="openImagePreview(records.id)" :src="imageList[records.id]" class="img-css">
                                    </div>
                                    <!-- <span slot="customTitle">置信度<a-icon type="setting" v-tooltip="'点击设置显示精度'" @click="setConfPrecision"/> </span> -->
                                </a-table>
                            </a-spin>
                        </div>
                    </div>
                </div>
            </a-col>
        </a-row>
        <a-row v-if="value === '2'" style="margin-top: 15px; " type="flex" justify="space-between">
            <a-col :span="24">
                <a-spin :spinning="matrixLoading">
                    <!--混淆矩阵详细内容-->
                    <div class="table-matrix">
                        <!-- {{ matrixData }} -->
                        <a-table :scroll="{ x: matrixColumns.length * 115 + 'px', y: true }"
                                 :pagination="matrixPagination"
                                 @change="handleMatTableChange"
                                 :columns="matrixColumns"
                                 :data-source="matrixData"
                                 :customHeaderRow="rowClick"
                                 v-if="this.matrixData.length > 0">
                            <template slot="isNum" slot-scope="text">
                                <div class="isNum" :style="getStyle(text)">{{ text | isNumber }}</div>
                            </template>
                        </a-table>
                        <NoData v-else/>
                    </div>
                </a-spin>
                <!--图片详情显示的单选框-->
                <a-divider plain v-if="img_pagination.total">混淆矩阵错分图片列表↓</a-divider>
                <a-radio-group style="display: block;margin:10px;margin-bottom:0;" :value="matrix_value" @change="handleChange_1" size="small" buttonStyle="solid" v-if="pictureList.length>0&&(showimgType==1||showimgType==4)">
                    <!--业务模型无原图展示-->
                    <a-radio-button value="4" v-if="modelType=='1' && type=='model'">
                        大图GT({{foreCast}})->ADC({{groundTruth}})
                    </a-radio-button>
                    <a-radio-button value="1" v-if="modelType=='1'">
                        GT({{groundTruth}})->ADC({{foreCast}})
                    </a-radio-button>
                    <a-radio-button value="2" v-if="modelType=='1'">
                        训练集{{foreCast}}
                    </a-radio-button>
                    <a-radio-button value="3" v-if="modelType=='1'">
                        训练集{{groundTruth}}
                    </a-radio-button>
                </a-radio-group>
                <!--遍历图片数组，以id为key值-->
                <div style="width: 100%; float: left; padding-left: 10px;">
                    <!--设置等待状态-->
                    <div style="text-align:center">
                        <a-spin :spinning="imgListLoading" size="large">
                            <div v-for="pictureId in pictureIds" :key="pictureId.id" style="width: 25%; padding: 0 10px;margin-top:10px; margin-bottom: 10px; min-width: 200px; float: left; position: relative; cursor: pointer; z-index: 0; ">
                                <img :id="'img_' + pictureId.id"
                                     :src="pictureList[pictureId.id]"
                                     :title="pictureId.name"
                                     style="width: 100%; height: 100%; user-select: none; box-shadow: -2px -2px 0 2px grey;"
                                     @click="openMatrixImagePreview(pictureId.id)" />
                                <a-icon v-if="!pictureList[pictureId.id]" type="loading" style="width: 100%; height: 100%; user-select: none;" />
                            </div>
                        </a-spin>
                    </div>
                </div>
                <div class="pagation-image">
                    <!--注意区分结果列表和混淆矩阵的分页信息-->
                    <a-pagination :show-total="() => `共 ${img_pagination.total} 条`"
                                  show-quick-jumper
                                  :defaultPageSize="img_pagination.pageSize"
                                  :default-current="img_pagination.current"
                                  :current="img_pagination.current"
                                  :total="img_pagination.total"
                                  show-less-items
                                  v-if="img_pagination.total"
                                  @change="pageChange" />
                </div>
                <!--混淆矩阵大图展示-->
                <ImagePreview v-if="matrixTableImage"
                              :data="pictureIds"
                              :default="matrixTableImage"
                              :pictureList="pictureList"
                              :detailData="{ dlTagType: '分类' }"
                              :getImageFun="getImage"
                              :pagination="img_pagination"
                              @close="closePreview"
                              @page="matriximagePreviewPageChange" />
                <a-divider plain v-if="img_pagination.total">混淆矩阵错分图片列表↑</a-divider>
                <!--提示列表-->
                <h3 class="title3">混淆矩阵提示</h3>
                <a-table :columns="PromptColumns"
                         :data-source="PromptList"
                         :pagination="false">
                    <span slot="Possible_cause"
                          slot-scope="text">
                        <template>
                            <div v-for="(item, index) in text" :key="index" v-html="item" style="margin:10px;margin-left:0"></div>
                        </template>
                    </span>
                    <span slot="Analytical_method"
                          slot-scope="text">
                        <template>
                            <div v-for="(item, index) in text" :key="index" v-html="item" style="margin:10px;margin-left:0"></div>
                        </template>
                    </span>
                    <span slot="Solution"
                          slot-scope="text">
                        <template>
                            <div v-for="(item, index) in text" :key="index" v-html="item" style="margin:10px;margin-left:0"></div>
                        </template>
                    </span>
                </a-table>
            </a-col>
        </a-row>
        <a-row v-if="value === '3'">
            <!--数据分流图-->
            <div class="data-offload" :style="{height: `calc(100vh - 300px + ${400 * zoomValue}px)`}" id="wrapper">
                <p class="data-offload-title">
                    <span class="data-offload-title-left">题库类别</span>
                    <span class="data-offload-title-right">预测类别</span>
                </p>
                <div class="data-offload-chart">
                    <echart ref="offload"
                            :styleObj="'100%'"
                            :option="dataOffloadOption" />
                </div>
            </div>
        </a-row>
        <a-row v-if="value === '4'">
            <!--数据分析结果-->
            <!--此时，paramId为离线报告id，modelId启用，传输模型id-->
            <Report v-if="type === 'forecast'" :modelId="modelId" :taskId="paramId"></Report>
            <div v-else>
<!--                <h1 style="text-align:center">该功能正在开发中</h1>-->
            </div>
            
        </a-row>
        <a-row v-if="value === '5'">
            <!--分析测算-->
            <analysis v-if="type === 'forecast'" :id="Number(paramId)"></analysis>
        </a-row>
        <export-data-set ref="exportDataSet" :paramId="paramId"></export-data-set>
        <!--加载大图浏览组件-->
        <ImagePreview v-if="sampleTableImage"
                      :data="sampleTableImageList"
                      :default="sampleTableImage"
                      :pictureList="imageList"
                      :detailData="{ dlTagType: '分类' }"
                      :getImageFun="getImage"
                      :pagination="pagination"
                      @close="closePreview"
                      @page="imagePreviewPageChange" />
    </div>
    <!-- 需求变了，不需要这个了 -->
        <!-- <div class="result">
            <ManagementResult :type="type" :paramId="paramId"/>
        </div> -->
    </div>
</template>
<script>
import {axios} from '@/utils/request'
import configSystem from "@/config/system";
import { Echart, NoData } from "@/components"
import ImagePreview from '@/components/ImagePreview'
import { downloadFile, getMatrixColumns, getImageUrl, getDownloadimageUrl, getBackgroundStyle } from '@/utils/util'
import { getBarOption } from '@/views/train/model/util'
import analysis from './analysis'
import Report from './Report'
import CanvasSelect from './CanvasSelect'
import Stepform from './Stepform'
import { getPictureIdPageList } from "@/api/dataCenter"
import * as modelApi from "@/api/modelManage"
import * as offlineApi from "@/api/offlineForecast"
import exportDataSet from '@/views/train/model/components/exportDataSet'
import { getRecommendations } from "../../../../api/modelManage"
import ManagementResult from './ManagementResult.vue'
    const columns = [
      {
        title: "序号",
        dataIndex: "index",
        key: "index",
        width: '8%',
        align: 'center'
        // customRender:(value, row, index) => {//表体的数据列样式
        //     const obj = {
        //         children: value,
        //         attrs: {},
        //     };
        //     obj.attrs.align = 'center';
        //     return obj;
        // }
      },
      {
        title: "分类",
        ellipsis: true,
        dataIndex: "category",
        key: "category",
        width: '10%',
        align: 'center'
      },
      {
        title: '预测数',
        dataIndex: "predictSampleTotal",
        key: "predictSampleTotal",
        width: '8%',
        align: 'center'
      },
      {
        title: "题库数",
        dataIndex: "sampleTotal",
        key: "sampleTotal",
        width: '8%',
        // ellipsis: true,
        align: 'center'
      },
      {
        title: "题库分错数",
        dataIndex: "realErrorSampleTotal",
        key: "realErrorSampleTotal",
        width: '10%',
        // width: 80,
        // ellipsis: true,
        align: 'center'
      },
      {
        title: "预测分错数",
        dataIndex: "errorTotal",
        key: "errorTotal",
        width: '10%',
        // width: 90,
        align: 'center'
      },
      {
        title: "错误比例",
        dataIndex: "errorRatio",
        key: "errorRatio",
        scopedSlots: { customRender: "errorRatio" },
        // width: 100,
      },
      {
        title: "错误总占比",
        dataIndex: "errorPercent",
        key: "errorPercent",
        scopedSlots: { customRender: "errorPercent" },
        // width: 100,
      },
      {
        title: "准确率",
        dataIndex: "acc",
        key: "acc",
        width: '10%',
        customRender: (text) => {
          return (text * 100).toFixed(2) + '%'
            // return '--'
        }
      },
      {
        title: "召回率",
        dataIndex: "recall",
        key: "errorTotal",
        width: '10%',
        customRender: (text) => {
          return (text * 100).toFixed(2) + '%'
            // return '--'
        }
      }
    ]
    const PromptColumns = [
        {
            title: "可能原因",
            dataIndex: "Possible_cause",
            key: "Possible_cause",
            width: '33%',
            scopedSlots: { customRender:"Possible_cause" },//以插槽形式返回结果，对数组进行渲染，使得单元格内可以换行
        },
        {
            title: "分析思路",
            ellipsis: true,
            dataIndex: "Analytical_method",
            key: "Analytical_method",
            width: '33%',
            scopedSlots: { customRender: "Analytical_method" },
        },
        {
            title: '解决办法',
            dataIndex: "Solution",
            key: "Solution",
            width: '34%',
            scopedSlots: { customRender: "Solution" },
        },
    ]
export default {
        name: "Result",
        components: {
            Echart,
            NoData,
            ImagePreview,
            exportDataSet,
            analysis,
            Report,
            CanvasSelect,
            Stepform,
            ManagementResult
        },
        props: {//从父组件传来数据
            type: {
                type: String,
                default: null
            },
            paramId: {//模型id/离线报告id
                type: String,
                default: null
            },
            datalist: {//数据集列表
                type: Array,
                default: null
            },
            modelId: {//模型id
                type: String,
                default:null
            },
            modelType: {//modelType==1,通用模型;modelType==2,业务模型
                type: String,
                default: null
            }
        },
    data() {
    // const paramId = this.$route.query.id
        return {
            images: [],
            options: {
                inline: false,
                button: true,
                navbar: false,
                title: true,
                toolbar: false,
                tooltip: true,
                movable: false,
                zoomable: false,
                rotatable: false,
                scalable: false,
                transition: true,
                fullscreen: false,
                keyboard: true,
                url: 'data-source'
            },
            value: '1',
            columns,
            PromptColumns,
            tableData: [],
            sampleTableData: [],
            sampleTableImageList: [],//对象数组
            sampleTableImage: null,//结果列表大图展示当前图片id
            matrixTableImage:null,
            imageList: {},//(图片id,url)数组
            barData: [],
            option: {},
            dataOffloadOption: {},
            matrixData: [],
            matrixColumns: [],
            matrixLoading: false,
            // paramId,
            // 被点击那一行
            clickRowId: null,
            record: {},
            resultTableLoading: false,
            barLodaing: false,
            sampleTableLoading: false,
            barParams: {},
            pagination: {
                total: 0,
                pageSize: 10,
                current: 1,
                size: "small",
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "30", "50"],
                showTotal: function (total) {
                    return `共 ${total} 条`
                }
            },
            // 混淆矩阵表格 分页
            matrixPagination: {
                total: 0,
                pageSize: 10,
                current: 1,
                // size: "small",
            },
            img_pagination: {
                total: 0,
                pageSize: 12,
                current: 1,
                size: "small",
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "30", "50"],
                showTotal: function (total) {
                    return `共 ${total} 条`
                }
            },
            filterCode: '',
            downloadIds: [],
            resultType: 0,
            zoomValue: 0,
            api: {//包装引入的api 
                model: modelApi,
                forecast: offlineApi
            },
            idName: {
                model: 'modelId',
                forecast: 'forecastId'
            },
            exportExcelUrl: {
                model: '/api/v1/traincenter/modelTrainResultInfo/confusionMatrix/exportExcel/',
                forecast: '/api/v1/traincenter/forecastResultInfo/confusionMatrix/exportExcel/'
            },
            imageUrl: getImageUrl('/api/v1/datacenter/file/getImg', this.type),
            downloadimageUrl: getDownloadimageUrl('/api/v1/datacenter/file/downloadImg', this.type),
            // 1 预测类别 2 真实类别
            codeType: 1,
            imglist: null,
            imgListLoading: false,//混淆矩阵详情图片是否处于加载中
            pictureIds: [],//混淆矩阵详情图片 对象数组
            pictureList: [],//混淆矩阵详情图片 (id,url)对数组
            totalpictureIds: [],//某类别总错分图片集合
            PromptList: [{
                key:'1',
                Possible_cause:[],//混淆矩阵分析汇总提示列表——可能原因
                Analytical_method:[],//混淆矩阵分析汇总提示列表——分析思路
                Solution:[],//解决方法
            }],
            //displayType:"",//错分数据
            foreCast: "",//表示当前详情图片显示类型——预测类型对应的图片列表
            groundTruth:"",//表示当前详情图片——真实类型对应的图片列表
            matrix_value: '1',//错分数据/预测值对应的全部图片/真值对应的全部图片,单选框组合所用值
            showimgType: 1,//1为点击单元格，2为点击行，3为点击表头列单元格，4为点击单元格的二次菜单内读取该code全部训练数据
            disableclick: false,
            truth_code_list: [],//真值列表
            width: null,
            height: null,
            confPrecision: 4,       //置信度的显示精度
            imgparams:null//存储混淆矩阵图片浏览调用api参数的对象
        }
    },
  mounted () {
    // this.getResultList()
    // this.getMatrixList()
    // this.getDataOffload()
  },
  computed: {
    echartWidth () {
      return {
        width: this.barData.length > 0 ? `${this.barData.length * 70}px` : ''
      }
    },
    _sampleTableData() {
        return this.sampleTableData.map(data => {
            let _conf = data.conf ?  data.conf.toFixed(this.confPrecision || 4) : "-"
            return {
                ...data,
            _conf
            }
        })
    },
    sampleTableColumns() {
        const err = this.barData.map(item => {
            return { text: item.errorCategory, value: item.errorCategory }            
        })
        //console.log(err);
        return [
            {
                title: "样本图片",
                dataIndex: "imgPath",
                key: "imgPath",
                scopedSlots: { customRender: "imgPath" },
                width: '15%',
                align: 'center'
            },
            {
                title: "置信度",
                dataIndex: "_conf",
                key: "conf",
                width: '15%',
                align: 'center',
                // slots: { title: 'customTitle' },
                // customRender:(value, row, index) => {//表体的数据列样式
                //     const obj = {
                //         children: value,
                //         attrs: {},
                //     };
                //     obj.attrs.align = 'right';
                //     return obj;
                // }
            },
            {
                title: "真实类别",
                dataIndex: "groundTrue",
                key: "groundTrue",
                filters: this.codeType === 2 ? false : err,
                filterMultiple: false,
                width: '15%',
                align: 'center'
            },
            {
                title: "预测类别",
                dataIndex: "predictCode",          
                key: "predictCode",
                width: '15%',
                align: 'center',
                filters: this.codeType === 1 ? false : err,
                filterMultiple: false
            },
            {
                title: "预测框数量",
                dataIndex: "bboxCnt",
                key: "bboxCnt",
                width: 120,
                width: '15%',
                align: 'center'
            }
        ]
    }
  },
  watch: {
    paramId: {
      handler (val) {
        if (!val) return false
        this.sampleTableData = []
        this.getResultList()
        this.getMatrixList()
        this.getDataOffload()
        this.getRecommendations()
      },
      immediate: true
    }
      // this.paramId = val
      // if ((this.$route.name === 'ModelDetail' || this.$route.name === 'ModelOfflineDetail' || this.$route.name === 'OfflineDetail') && val) {
      //   // this.paramId = val
      //   this.$nextTick(() => {
      //     this.sampleTableData = []
      //     this.getResultList()
      //     this.getMatrixList()
      //     this.getDataOffload()
      //   })
      // }
  },
  methods: {
    getStyle (num) {
        // console.log("num: ", num);
        return getBackgroundStyle(num);//获取混淆矩阵处理颜色
    },
    onSelectChange (selectedRowKeys, selectedRows) {
        this.downloadIds = selectedRowKeys
    },
    clickEvent(item,row,type) {
        return {
            style: {
                'cursor': 'pointer',
            },
            on: {
                mouseenter: (event) => {
                },
                mouseleave: (event) => {
                },
                click: (event) => {
                    //console.log(item, row);
                    this.img_pagination.current = 1;//切换图片列表时重置页数
                    this.totalpictureIds = [];//清空缓存区   
                    this.imgparams = {//保存参数
                        item: item,
                        row: row,
                        type:type
                    }
                    this.showimg();
                }
            },
        }
      },
      rowClick(record, index) {
          return {
              on: {
                  click: (column, row,index) => {
                  },
              }
          };
      },
      pageChange(page, pageSize) {//混淆矩阵大图展示分页
          this.img_pagination.pageSize = pageSize;
          this.img_pagination.current = page;
          //console.log("page", page, "pageSize", pageSize,this.img_pagination);
          this.showimg();
      },
    // 查询结果列表
    async getResultList () {
      this.resultTableLoading = true
      const res = await this.api[this.type].getResultList({
        id: this.paramId,
        codeType: this.codeType
      })
      const { code, data = [], msg } = res
      if (code === 0) {
        this.tableData = data.map((item, index) => {
          return {
            ...item,
            errorRatio: (item.errorRatio * 100).toFixed(),
            errorPercent: (item.errorPercent * 100).toFixed(),
            index: index + 1,
            id: index + 1
          }
        })
        this.resultTableLoading = false
        this.$nextTick(async () => {
          if (this.tableData.length > 0 && this.tableData[0].id !== undefined) {
            this.record = this.tableData[0]
            this.clickRowId = this.tableData[0].id
            this.getErrorDetailList()
            this.getSampleDetailList()
          } else {
            this.barData = []
          }
        })
      }
    },
    // 查询错分详情
    async getErrorDetailList () {
      this.barLodaing = true
      const params = {
        selectedCode: this.record.category,
        [this.idName[this.type]]: this.paramId,
        codeType: this.codeType
      }
      const res = await this.api[this.type].getErrorDetailList(params)
      const { code, data = [], msg } = res
      if (code === 0) {
        this.barData = data.sort((a, b) => {
          return b.errorTotal - a.errorTotal
        }).map((item, index) => {
          return {
            ...item,
            fileCategory: item.errorCategory,
            num: item.errorTotal,
            percent: `${(item.percent * 100).toFixed()}%`
          }
        })
        this.barLodaing = false
        this.$nextTick(() => {
          this.option = getBarOption(this.barData, null, '错分数量')
        })
      }
    },
    // 查询样本详情
      async getSampleDetailList(predictCode = '', callback) {//结果列表右下角内容
          this.sampleTableLoading = true;
          const params = {
              codeType: this.codeType,
              groundTrue: this.codeType === 1 ? predictCode : '',
              selectPredictCode: this.record.category,
              predictCode: this.codeType === 1 ? '' : predictCode,
              [this.idName[this.type]]: this.paramId,//模型id
              limit: this.pagination.pageSize,
              pageNo: this.pagination.current,
              resultType: this.resultType
          };
          //console.log(params);
          const res = await this.api[this.type].getSampleDetailList(params);//调用api获取图片样本详情
          const { code, data: { records, total = 0 }, msg } = res;
          this.sampleTableLoading = false;
          this.sampleTableData = [];
          this.sampleTableImageList = [];
          this.pagination.total = total;
          //console.log(records); 
          if (code === 0) {
              records.forEach((item, index) => {
                  const { markPositions, existPicMark } = item;
                  this.$set(this.sampleTableData, index, {//设置右下角表格内容
                      ...item,
                      imageUrl: '',
                      conf: item.conf
                  });
                  this.$set(this.sampleTableImageList, index, {//设置右下角表格图片列表
                      id: item.id,
                      name: item.imgPath.substring(item.imgPath.lastIndexOf('/') + 1),
                      url: '',
                      markPositions,
                      existPicMark
                  });
                  if (!this.imageList[item.id]) {
                      this.getImage(item.id).then(res => {
                          const url = window.URL.createObjectURL(res);//设置右下角图片列表图片地址
                          //console.log(item.id,url);
                          this.$set(this.imageList, item.id, url);
              // this.sampleTableData[index].imageUrl = url
                      })
                  }
              })
              if (callback) callback(this.sampleTableImageList)
          }
      },
      async showimg() {
          let item = this.imgparams.item;
          let row = this.imgparams.row;
          let type = this.imgparams.type; 
          if (this.disableclick)
              return;
          this.disableclick = true;
          if (type == 3||type==4) {//显示数据集中某code的全部图片
              this.showimgType = type;//显示数据集中某code的全部图片
              this.imgListLoading = true;
              this.pictureIds = [];
              this.pictureList = [];
              if (typeof (this.datalist) =="string" )
                  this.datalist = this.datalist.split(",");
              this.img_pagination.total = 0;
              
              for (let k = 0; k < this.datalist?.length;k++) {
                  //console.log(this.datalist[k])
                  const params = {
                      categoryName: item,//type=3时item即为code类别名
                      id: this.datalist[k],//数据集id
                      limit: this.img_pagination.pageSize,
                      pageNo: this.img_pagination.current,
                      markRange: 0,
                      reviewRange: 0,
                  }
                //   console.log(params);
                  const res = await getPictureIdPageList(params)//获取图片列表
                //   console.log(res);
                  this.img_pagination.total += res.data.total;
                  this.pictureIds.push.apply(this.pictureIds, res.data.records);
              }
              //console.log(this.pictureIds);
              this.pictureIds.forEach((pic) => {
                  //验证集获取图片用getImage，训练集获取图片用getPicture，调用不同api
                  modelApi.getPicture(pic.id).then(res => {
                      const url = window.URL.createObjectURL(res)
                    //   console.log(pic.id, url)
                      this.$set(this.pictureList, pic.id, url)
                      this.$forceUpdate()
                  })
              })
              //console.log(this.pictureList);
              this.$forceUpdate()
              this.imgListLoading = false;
              this.disableclick = false;
              return;
          }
          else if (type == 2) {//表示输入的是分类名称，此时row为表头数组
              this.showimgType = 2;//点击预测错分类别
              this.imgListLoading = true;
              if (this.totalpictureIds?.length == 0) {//若无缓存则调用api读取本错分类别的全部数据
                  if (item?.category == null)//无数据
                      this.truth_code_list = [];
                  //const temp_pictureIds = [];
                  for (let i = 2; i < row.length; i++) {//获取全部真值列表
                      if (row[i].title == "题库总数")
                          break;
                      this.truth_code_list.push(row[i].title);
                      //temp_pictureIds.push([]);
                  }
                  //console.log(this.truth_code_list);
                  //console.log(temp_pictureIds);//不再使用此方法解决连续点击问题，直接用disableclick解决
                  for (let k in this.truth_code_list) {//TO DO:修复每个单元格只读取第一页的问题！
                      let sum = item[this.truth_code_list[k]];
                      sum = parseInt(sum);//提取数字并去除数据中的附加格式

                      for (let kk = 1; kk <= sum / this.img_pagination.pageSize+1; kk++) {
                          const params = {
                              groundTrue: this.truth_code_list[k],//真值
                              predictCode: item.category,//预测值
                              modelId: Number(this.paramId),//模型id,转化为数字类型 
                              limit: this.img_pagination.pageSize,
                              pageNo: kk
                          }
                          //console.log(kk);
                          //console.log(this.type)
                          if (this.type == "model") {
                              const urlparams = "?groundTrue=" + params.groundTrue + "&predictCode=" + params.predictCode + "&modelId=" + params.modelId + "&limit=" + params.limit + "&pageNo=" + params.pageNo;
                              const res = await modelApi.getMatrixImgListM(urlparams);//调用api，混淆矩阵详情跳转
                              //console.log(res);
                              this.totalpictureIds.push.apply(this.totalpictureIds, res.data.records);
                          }
                          else if (this.type == "forecast") {
                              const urlparams = "?groundTrue=" + params.groundTrue + "&predictCode=" + params.predictCode + "&forecastId=" + params.modelId + "&limit=" + params.limit + "&pageNo=" + params.pageNo;
                              //console.log(urlparams);
                              const res = await modelApi.getMatrixImgListF(urlparams);
                              //console.log(res);
                              this.totalpictureIds.push.apply(this.totalpictureIds, res.data.records);
                          }
                      }
                  } 
                  for (let k in this.matrixData) {//统计图片总数
                      if (this.matrixData[k].category == item.category) {
                          this.img_pagination.total = this.matrixData[k]["predictSampleTotal"];
                          break;
                      }
                  }
                  //console.log(this.totalpictureIds);
              }
              //若数据已成功读取，只需显示其中一页即可。
              this.pictureIds = [];
              this.pictureList = [];
              for (let i = (this.img_pagination.current - 1) * this.img_pagination.pageSize; i < this.img_pagination.current * this.img_pagination.pageSize && i < this.img_pagination.total; i++) {       
                  this.pictureIds.push(this.totalpictureIds[i]);
              }
              //console.log(this.pictureIds);
              this.pictureIds.forEach((pic) => {
                  //验证集获取图片用getImage，训练集获取图片用getPicture，调用不同api
                  if (this.type == "model") {
                      modelApi.getImage(pic.id).then(res => {
                          const url = window.URL.createObjectURL(res)
                          this.$set(this.pictureList, pic.id, url)
                          this.$forceUpdate()
                      })
                  }
                  else if (this.type == "forecast") {
                      this.getImage(pic.id).then(res => {
                          const url = window.URL.createObjectURL(res)
                          this.$set(this.pictureList, pic.id, url)
                          this.$forceUpdate()
                      })
                  }
              })
              this.$forceUpdate()
              this.imgListLoading = false;
              this.disableclick = false;
              return;
          }
          //单元格
          for (let i = 0; i < this.matrixData?.length; i++) {//如果指定单元格没有图片，则直接退出
              if (this.matrixData[i].category == row) {
                  if (this.matrixData[i][item] == 0 || this.matrixData[i][item] == "0") {
                      this.disableclick = false;
                      return;
                  } 
              }
          }
          this.showimgType = 1;//点击的是单元格
          
          this.imgListLoading = true;
          const params = {
              groundTrue: item,//真值
              predictCode: row,//预测值
              modelId: Number(this.paramId),//模型id,转化为数字类型
              limit: this.img_pagination.pageSize,
              pageNo: this.img_pagination.current
          }
          for (let k in this.matrixData) {
              if (this.matrixData[k].category == row)
                  this.img_pagination.total = this.matrixData[k][item];
          }
          this.img_pagination.total = this.img_pagination.total.replace('&Y', '');
          //console.log("total:"+this.img_pagination.total);
          this.foreCast = params.predictCode;//表示当前详情图片显示类型——预测类型对应的图片列表
          this.groundTruth = params.groundTrue;//表示当前详情图片——真实类型对应的图片列表
          this.pictureIds = [];
          this.pictureList = [];

          let res = null;
        //   console.log("before this.matrix_value: ", this.matrix_value)
        //   console.log("this.type: ", this.type)
          if (this.type == "model") {
              let urlparams = "?groundTrue=" + params.groundTrue + "&predictCode=" + params.predictCode + "&modelId=" + params.modelId + "&limit=" + params.limit + "&pageNo=" + params.pageNo;
              if(this.matrix_value == 4) {
                // console.log("this.datalist: ", this.datalist)
                urlparams += "&trainDatasetId=" + this.datalist
                // console.log(urlparams);
                res = await modelApi.getMatrixImgListMOriginPic(urlparams);//调用api，混淆矩阵详情跳转
                // console.log("getMatrixImgListMOriginPic: ", res);
                this.pictureIds = res.data.records;
              }else{
                res = await modelApi.getMatrixImgListM(urlparams);//调用api，混淆矩阵详情跳转
                this.pictureIds = res.data.records;
              }
          }
          else if (this.type == "forecast") {
              const urlparams = "?groundTrue=" + params.groundTrue + "&predictCode=" + params.predictCode + "&forecastId=" + params.modelId + "&limit=" + params.limit + "&pageNo=" + params.pageNo;
              //console.log(urlparams);
              res = await modelApi.getMatrixImgListF(urlparams);//读取blob格式数据
              //console.log(res);
              this.pictureIds = res.data.records;
          }
        //   console.log("this.pictureIds: ", this.pictureIds);
        //   console.log("this.pictureList before: ", this.pictureList);
          res.data.records.forEach(async (pic) => {
              //console.log(pic); //异步函数用push会导致重复push
            //验证集获取图片用getImage，训练集获取图片用getPicture，调用不同api
              if (this.type == "model") {
                  console.log("pic: ", pic);
                  if(this.matrix_value == 4) {
                    // form-data
                    await this.getImageBlob(pic)
                  }else {
                    modelApi.getImage(pic.id).then(res => {
                        const url = window.URL.createObjectURL(res);
                        this.$set(this.pictureList, pic.id, url);
                        this.$forceUpdate();
                    })
                  }
                  
              }
              else if (this.type == "forecast") {
                  this.getImage(pic.id).then(res => {//调用本组件内方法
                      const url = window.URL.createObjectURL(res);
                      //console.log(pic.id, url);
                      this.$set(this.pictureList, pic.id, url);
                      this.$forceUpdate();
                  })
              }
          })
        //   console.log("this.pictureIds: ", this.pictureIds);
        //   console.log("this.pictureList: ", this.pictureList);
          this.$forceUpdate()
          this.imgListLoading = false;
          this.disableclick = false;
          return;
    },
    async getImageBlob(pic) {
        
         console.log("pic.imgPath: ", pic.imgPath)
        const params = new URLSearchParams();
        params.append("imgPath", pic.imgPath);
        return axios.get(`/api/v1/datacenter/file/getImgByPath`, {
            params: params,
            family: -1
            // responseType: 'blob'
        }).then(res => {
            // console.log("axios res: ", res);
            const url = window.URL.createObjectURL(res);
            this.$set(this.pictureList, pic.id, url);
            // console.log("origin pic url: ", this.pictureList[pic.id])
            this.$forceUpdate();
        }).catch(err => {
            console.log(err);
        })
    },
    // 查询混淆矩阵列表
    async getMatrixList() {
        this.matrixLoading = true;
        const res = await this.api[this.type].getMatrixList(this.paramId);//调用api
        console.log("getMatrixList res: ", res);
        if(res.code !== 0) {
            this.matrixLoading = false;
            return ;
        }
        const { code, data: { head = [], matrix = [], topCorrectRate = '' }, msg } = res;
        const isNumber = (dataStr, pattern = '&Y') => {
            if (String(dataStr).includes(pattern)) {
                return String(dataStr).replace('&Y', '') || '';
            }
            else if (dataStr || dataStr == 0) {
                return String(dataStr);
            }
            else {
                return '';
            }
        }
        const renderContent = (value, index, isNum) => {//value为单元格内容,item当前列头，row当前行
            const obj = {
                children: value,
                attrs: {}
            }
            if (index === matrix.length) {//若当前单元格是最后一行则
                obj.children = value;
            }
            if (isNum) {
                //obj.children = <div class="isNum" style={this.getStyle(value)} onclick="this.showimg( {item }, { row}) ">{isNumber(value)}</div>
                if (this.getStyle(value).background!="#fff")
                    obj.children = <div class="isNum" style={this.getStyle(value)}>{isNumber(value)}</div>
            }
            return obj;//返回obj作为单元格内容
        }
        if (code === 0) {
            this.$nextTick(() => {
                //调用api获取混淆矩阵表头
                this.matrixColumns = getMatrixColumns(head).map((item, index, array) => {//item当前列头，array列头数组，这里index是列标签
                    //console.log("index:" + index);
                    // console.log("array: ", array);
                    if (index === 0) {//序号列
                        //console.log(index);
                        return {
                            ...item,
                            customRender: (text, row, index) => {
                                if (index === matrix.length) {
                                    return {
                                        children: ''
                                    }
                                }
                                else {
                                    return {
                                        children: text
                                    }
                                }
                            },
                        }
                    } 
                    else if (index === 1) {//预测类别列
                        //console.log(index);
                        return {
                            ...item,
                            customRender: (value, row, index) => {
                                return renderContent(value, index, item.isNum)//返回
                            },
                            customCell: (value,index) => {//这里的index是记录第几行的索引,value是行内容
                                return this.clickEvent(value,array,2)//为混淆矩阵添加点击事件,传空值进去表示读图类型
                            },
                        }
                    }
                    else if (index > 1 && index < array.length - 4) {//分真值类别预测类别总数
                        //console.log(index);
                        // console.log("modelType: ", this.modelType);
                        if (this.modelType == "1") {
                            return {
                                ...item,
                                customRender: (value, row, index) => {
                                    return renderContent(value, index, item.isNum)//返回
                                },
                                customCell: (row) => {
                                    return this.clickEvent(item.key, row.category, 1)//为混淆矩阵添加点击事件
                                },
                                customHeaderCell: (row) => {//为表头添加点击事件
                                    //console.log(row);
                                    return this.clickEvent(row.dataIndex, "", 3)
                                },
                            }
                        }
                        else if(this.modelType=="2"){//业务模型表头不能点击显示真实训练集图片
                            return {
                                ...item,
                                customRender: (value, row, index) => {
                                    return renderContent(value, index, item.isNum)//返回
                                },
                                customCell: (row) => {
                                    return this.clickEvent(item.key, row.category, 1)//为混淆矩阵添加点击事件
                                },
                            }
                        }
                    }
                    else if (index === array.length - 2) {//倒数第二列准确率
                        //console.log(index);
                        return {
                            ...item,
                            customRender: (text, row, index) => {//text为单元格原内容，row为当前行内容，此时index为行索引
                                if (index === matrix.length) {//最后一行计算总准确率
                                    return {
                                        children: (row.topCorrectRate * 100).toFixed() + '%'
                                    }
                                }
                                else {
                                    return {
                                        children: text
                                    }
                                }
                            },
                        }
                    }
                    else {
                        //console.log(index);
                        return {
                            ...item,
                            customRender: (value, row, index) => {
                                return renderContent(value, index, item.isNum)//返回
                            },
                        }
                    }
                })
                // console.log("matrixColumns: ", this.matrixColumns)
                //计算表格数据
                this.matrixData = matrix.map((item, index) => {
                    return {
                        ...item, 
                        key: index,
                        precisionRate: `${(item.precisionRate * 100).toFixed()}%`,
                        recallRate: `${(item.recallRate * 100).toFixed()}%`,
                    }
                })
                //在表格最下面一行输出总和准确率
                this.matrixData.push({
                    key: this.matrixData.length,
                    topCorrectRate
                })
                console.log("matrixData: ", this.matrixData);
                this.matrixLoading = false;
            })
        }
      },
    //   混淆矩阵表格分页change事件
      handleMatTableChange(pagination) {
        this.matrixPagination.current = pagination.current;
        this.matrixPagination.pageSize = pagination.pageSize;
      },
      async getRecommendations() {
          const res = await modelApi.getRecommendations();
          const recommend = res.data;
          for (let k in recommend) {
              if (recommend[k].suggestId == 1) {
                  this.PromptList[0].Possible_cause.push(recommend[k].suggustContent);//api传来属性拼写就是如此
              }
              else if (recommend[k].suggestId == 2) {
                  this.PromptList[0].Analytical_method.push(recommend[k].suggustContent);
              }
              else if (recommend[k].suggestId == 3) {
                  this.PromptList[0].Solution.push(recommend[k].suggustContent);
              }
          }
      },
    async getDataOffload () {
      const res = await this.api[this.type].getDataFlow(this.paramId)
      if (res.code !== 0) return false
      const data = res.data
      const list = [ ...(data.left || []).map(item => {
        return {
          name: item,
          depth: 0
        }
      }), ...(data.right || []).map(item => {
        return {
          name: item,
          depth: 2
        }
      }) ]
      const links = (data.links || []).map(item => {
        let color = ''
        if (item.source.substring(5) === item.target.substring(6)) {
          color = 'green'
        } else {
          color = 'red'
        }
        return {
          ...item,
          emphasis: {
            lineStyle: {
              color
            }
          }
        }
      })
      this.dataOffloadOption = {//配置传给echart的数据
        color: ["#c12e34", "#e6b600", "#0098d9", "#2b821d", "#005eaa", "#339ca8", "#cda819", "#32a487"],
        tooltip: {
          show: true,
          formatter: (params) => {
            if (params.dataType === 'edge') {
              const left = params.data.source
              const right = params.data.target
              return left.substring(5, left.length) + ' > ' + right.substring(6, right.length) + '：' + params.value
            } else {
              return params.name.substring(params.name.indexOf('-') + 1) + '：' + params.value
            }
          }
        },
        series: {
          type: 'sankey',
          left: '40',
          right: '60',//原为50
          focusNodeAdjacency: true,
          data: list,
          links,
          draggable: false,
          emphasis: {
            lineStyle: {
              color: '#1d262d'
            }
          },
          label: {
            formatter: (params) => {
              const name = params.name
              if (params.data.depth === 0) {
                return name.substring(5, name.length)
              } else {
                return name.substring(6, name.length)
              }
            }
          }
        }
        }
    },
    handleChange (e) {
        this.value = e.target.value
    },
    handleChange_1(e) {
        this.matrix_value = e.target.value;
        this.img_pagination.current = 1;
        if (this.matrix_value == 1) {
            this.imgparams = {
                item: this.groundTruth,
                row: this.foreCast,
                type: 1
            }
            this.showimg();
        }  
        else if (this.matrix_value == 2) {
            this.imgparams = {
                item: this.foreCast,
                row: "",
                type: 4
            }
            this.showimg();//foreCast
        }
        else if (this.matrix_value == 3) {
            this.imgparams = {
                item: this.groundTruth,
                row: "",
                type: 4
            }
            this.showimg();//groundTruth
        }     
        else if(this.matrix_value == 4) { // 大图
            this.imgparams = {
                item: this.groundTruth,
                row: this.foreCast,
                type: 1
            }
            // console.log("大图：", this.matrix_value)
            this.showimg();
            // this.getOriginPic(this.imgparams);
        }
    },
    async getOriginPic(params) {
        if (this.type == "model") {
            const urlparams = "?groundTrue=" + params.groundTrue + "&predictCode=" + params.predictCode + "&modelId=" + params.modelId + "&limit=" + params.limit + "&pageNo=" + params.pageNo;
            const res = await modelApi.getMatrixImgListMOriginPic(urlparams);//调用api，混淆矩阵详情跳转
            
            //console.log(res);
            this.totalpictureIds.push.apply(this.totalpictureIds, res.data.records);
        }
    },
    async downloadExcel () {//结果详情导出
      const params = {
        groundTrue: this.record.category,
        [this.idName[this.type]]: this.paramId,
        resultType: this.resultType
      }
      const res = await this.api[this.type].downloadErrorDetail(params)
      await downloadFile(res)
      this.$message.success('导出成功')
    },
    getCustomRow (record) {
      return {
        on: {
          click: () => {
            this.clickRowId = record.id
            this.record = record
            this.getErrorDetailList()
            this.getSampleDetailList()
            this.sampleTableData = []
            this.$set(this.pagination, 'current', 1)
          }
        }
      }
    },
    getRowClassName (record) {
      return this.clickRowId === record.id && 'row-selection'
    },
    // 点击分页等
    handleTableChange (pagination, filter, sorter) {
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
      const type = this.codeType === 1 ? 'groundTrue' : 'predictCode'
      if (filter[type] && filter[type].length > 0) {
        this.filterCode = filter[type][0]
        this.getSampleDetailList(filter[type][0])
      } else {
        this.filterCode = ''
        this.getSampleDetailList()
      }
    },
      async imagePreviewPageChange(data, callback) {
          if (data === 'prev') {//若已经是第一页则调用回调并返回空数组，否则分页-1
              if (this.pagination.current === 1) {
                  return callback([])
              }
              this.$set(this.pagination, 'current', this.pagination.current - 1)
          }
          else {//若已经是最后一页则调用函数并分页+1
              if (this.pagination.current === Math.ceil(this.pagination.total / this.pagination.pageSize)) {
                  return callback([])
              }
              this.$set(this.pagination, 'current', this.pagination.current + 1)
          }
          await this.getSampleDetailList(this.filterCode, callback)//调用函数获取数据，传递回调函数
      },
      async matriximagePreviewPageChange(data, callback) {//混淆矩阵大图展示切换图片
          this.matrixTableImage = null;
          if (data === 'prev') {//若已经是第一页则调用回调并返回空数组，否则分页-1
              if (this.img_pagination.current === 1) {
                  return callback([])
              }
              this.$set(this.img_pagination, 'current', this.img_pagination.current - 1)
          }
          else {//若已经是最后一页则调用函数并分页+1
              if (this.img_pagination.current === Math.ceil(this.img_pagination.total / this.img_pagination.pageSize)) {
                  return callback([])
              }
              this.$set(this.img_pagination, 'current', this.img_pagination.current + 1)
          }
          this.showimg().then(result => {//异步函数
              this.matrixTableImage = this.pictureIds[0].id;//重新设置翻页后大图展示的图片
          })
      },
      getImage(id) {
          return this.type === 'model' ? modelApi.getImage(id) : offlineApi.getImage(id);
      },
      // 样本详情导出
      handleExport() {
          this.$refs['exportDataSet'].showDialog();
      },
      // 矩阵导出 混淆矩阵右上角的导出按钮
      exportExcel() {
          const url = `${this.exportExcelUrl[this.type]}${this.paramId}`;
          downloadFile(url);
      },
    //打开大图预览
    openImagePreview (id) {
        this.sampleTableImage = id;
        console.log(this.sampleTableImage,this.sampleTableImageList,this.imageList)
    },
    openMatrixImagePreview(id) {
        this.matrixTableImage = id;
    },
    //关闭大图预览
    closePreview () {
        this.sampleTableImage = null;
        this.matrixTableImage = null;
    },
    changeZoom (value) {
      this.$refs.offload.resize()
    }
  },
}
</script>
<style lang="less" scoped>
@import "~@/views/train/model/components/Result.less";
    .table-matrix {
        /deep/ .ant-table-tbody > tr > td  {
            padding: 10px 12px;
        }
    }
    .img-item {
        width: 25%;
        height: calc(25% - 10px);
        padding: 0 10px;
        margin-bottom: 10px;
        min-width: 200px;
        float: left;
        position: relative;
        cursor: pointer;
        z-index: -1;
    }
    .img-item img {
        width: 100%;
        height: 100%;
        user-select: none;
    }
    .title3{
        margin-top:10px;
        margin-bottom:10px;
        font-family: '微软雅黑', sans-serif;
        display:block;
    }
    .pagation-image {
        float: right;
        padding: 5px 10px;
    }
    

</style>