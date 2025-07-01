<template>
  <div class="page-content data-mrg page-content-height">
    <el-tabs v-model="tabActiveKey" @tab-click="tabOnChange">
      <el-tab-pane label="图像数据集" name="1">
        <search-form @search="handleSearch" :formData="searchFormData" :cardMode="cardMode"></search-form>
        <div class="main" v-loading="loading" element-loading-text="拼命加载中" element-loading-background="rgba(255, 255, 255, 0.5)">
          <div class="dataCard" v-if="tableData.length || loading">
            <tempalte v-if="cardMode" class="card-wrap">
              <!-- <Card :data="item" :index="index" @toSingleDataDetail="toSingleDataDetail" v-for="(item, index) in tableData" :key="item.id" class="card"></Card> -->
              <Card :dataObj="item" @toSingleDataDetail="toSingleDataDetail" v-for="(item, index) in tableData" :key="item.id"></Card>
            </tempalte>
            <a-table v-resize :columns="columns" :data-source="tableData"  :rowKey="record => record.id" :pagination="false" v-else>
              <span slot="dlName" slot-scope="text,record">
                <a :class="{'action-text': true}" :disabled ="record.status!==2 || record.autoMarkTaskStatus === 1" @click="toSingleDataDetail(record)" :title="text">{{ text }}</a>
              </span>
              <!-- 状态这里是参照card里来写 -->
              <span slot="status" slot-scope="status,record">
                <!-- 异常-->
                <!-- <a-tag v-if="DEFEAT_STATUSLIST.includes(status)" :color="'red'">{{rowDataStatus[status - 1]}}</a-tag> -->
                <span v-if="DEFEAT_STATUSLIST.includes(record.status)" class="defeat-reason">
                  <span style="color: #F56C6C;font-size: 12px;">创建失败</span>
                  <a-popover overlayClassName="modelSchedule" placement="left">
                    <template slot="content">
                      <a-alert message="数据集创建失败" :description="record.message" type="error" show-icon />
                    </template>
                    <svg-icon type="danger" style="font-size: 18px;margin-left: 5px;cursor: pointer;"></svg-icon>
                  </a-popover>
                </span>
                <!-- 转换中 -->
                <!-- <span v-else-if="record.modelSchedule && status === 8">
                  <a-progress :percent="record.modelSchedule" status="active"/>
                </span> -->
                <span v-else-if="CREATING_STATUSLIST.includes(record.status)">
                  <a-tag color="blue">创建中</a-tag>
                  <svg-icon type="spin" class="parseing-icon" ></svg-icon>
                </span>
                <a-tag v-else-if="status == 2" color="green">{{ rowDataStatus[status -1] }}</a-tag>
                <!-- 其他状态 -->
                <a-tag v-else color="blue">{{ rowDataStatus[status -1] }}</a-tag>
              </span>
              <span slot="autoMarkTaskStatus" slot-scope="status,record">
                <a-popover overlayClassName="modelSchedule" placement="left" v-if="record.autoMarkTaskStatus === 1">
                  <template slot="content">
                    <a-alert message="标注任务进行中" :description="record.autoMarkTaskStatusMessage" type="success" show-icon />
                  </template>
                  <a-progress :percent="caclAnnotationPercent(record)" status="active"/>
                </a-popover>
                <a-popover overlayClassName="modelSchedule" placement="left" v-if="record.autoMarkTaskStatus === 3">
                  <template slot="content">
                    <a-alert message="自动标注失败" :description="record.autoMarkTaskStatusMessage" type="error" show-icon />
                  </template>
                  <span style="color: #F56C6C">失败</span>
                  <svg-icon type="danger" style="font-size: 18px;margin-left: 5px;cursor: pointer;"></svg-icon>
                </a-popover>
                <span v-else-if="record.autoMarkTaskStatus === 2" >无</span>
              </span>
              <span slot="customDlTypeHeader"> 标签
                <a-tooltip>
                    <template slot="title">
                      <span>训练集：建议用于模型训练<br>评估集：建议用于模型评估</span>
                      <br><span style="font-size: 12px;">用于标记区分数据集用途，平台不限制实际的使用场景</span>
                    </template>
                    <a-icon type="question-circle" class="table-question-icon" />
                  </a-tooltip>
              </span>
              <span slot="operate" slot-scope="record,text,index">
                <a  @click="() => callAutoAnnotation(record)" :disabled="disabledItem(record) || record.status !== 2 || record.autoMarkTaskStatus === 1 || record.sampleNum === 0">自动标注</a>
                <a  @click="() => stopAutoAnnotation(record)" :disabled="disabledItem(record) || record.autoMarkTaskStatus !== 1" style="margin: 0 10px;">停止标注</a>
                <!-- <a  @click="() => doConvert(record)" :disabled="disabledItem(record) || record.status !== 2 || record.autoMarkTaskStatus == 1" style="margin: 0 10px;">转换数据集</a> -->
                <a-dropdown>
                  <a @click="e => e.preventDefault()">更多</a>
                  <a-menu slot="overlay">
                    <!-- <a-menu-item @click="showPushData(record)" :disabled="record.status !== 2 || disabledItem(record)"> 追加数据</a-menu-item> -->
                    <a-menu-item @click="handleEdit(record)" 
                      :disabled="record.forecastId !== null || disabledItem(record)|| record.autoMarkTaskStatus ===1 || CREATING_STATUSLIST.includes(record.status)">
                    编辑</a-menu-item>
                    <a-menu-item @click="handleDelete(record, index)" :disabled="disabledItem(record)|| ![2,3,10].includes(record.status) || record.autoMarkTaskStatus ===1">删除</a-menu-item>
                    <a-menu-item @click="doConvert(record)" :disabled="disabledItem(record) || record.status !== 2 || record.autoMarkTaskStatus == 1">转换数据集</a-menu-item>
                    <a-menu-item @click="shareModel(record)" :disabled="disabledItem(record) || record.status !== 2">设置共享</a-menu-item>
                    <a-menu-item @click="callDatasetTypeSet(record)" :disabled="record.dlTagType !== '其他'|| disabledItem(record) || record.status !== 2">类型设置</a-menu-item>
                  </a-menu>
                </a-dropdown>
              </span>
            </a-table>
          </div>
          <el-empty :image-size="200" v-else></el-empty>
        </div>
        <a-pagination v-model="pagination.current" @change="changePage" :total="pagination.total" :pageSize="pagination.pageSize" 
          :showTotal="pagination.showTotal" show-less-items
          :page-size-options="pagination.pageSizeOptions"
          show-size-changer
          @showSizeChange="onShowSizeChange"
          style="text-align: right;margin: 10px 20px 0 0"
          v-if="pagination.total"
        />
      </el-tab-pane>
      <el-tab-pane label="数值数据集" name="2">
        <a-empty></a-empty>
      </el-tab-pane>
      <el-tab-pane label="文本数据集" name="3">
        <a-empty></a-empty>
      </el-tab-pane>
    </el-tabs>
    <!-- table显示分页的话  要写在这里 -->
    <!-- <addEditDialog
      ref="addEditDialog"
      :parentData.sync="parentData"
      :dataSetTitle="dataSetTitle"
      :dlTagTypeOpt.sync="dlTagTypeOpt"
      :pagination="pagination"
      @getDataList="getDataList"
    ></addEditDialog> -->
    <push-data
      ref="pushData"
      :parentData.sync="parentData"
      :dataSetTitle="dataSetTitle"
      :dlTagTypeOpt.sync="dlTagTypeOpt"
      :pagination="pagination"
      @getDataList="getDataList"
    ></push-data>
    <!-- 设置共享 -->
    <share-modal ref="refShareModal" v-if="showShareDialog" :visible.sync="showShareDialog"></share-modal>
    <!-- 数据集转换 -->
    <transformer :visible.sync ="showTransformerModal" v-if="showTransformerModal" @refreshList="getDataList" ref="refSegToCls"></transformer>
    <!-- 自动标注 -->
    <auto-annotation v-if="showAutoAnnotationModal" :visible.sync="showAutoAnnotationModal" @refreshList="getDataList" ref="refAutoAnnotation"></auto-annotation>
    <!-- 数据集类型设置，只对其他类型数据集有效 -->
    <a-modal title="数据集类型设置" v-model="dtTypeSetData.showDatasetTypeSet"  @ok="doDatasetTypeSet" :confirm-loading="dtTypeSetData.loading">
      <a-radio-group v-model="dtTypeSetData.targetType">
        <a-radio :value="item.nodeName" v-for="item in dtTypeSetData.targetTypeList || []" :key="item.id"> {{ item.nodeName }}</a-radio>
      </a-radio-group>
    </a-modal>
  </div>
</template>
<script>
import { mixinHeader } from "@/utils/mixin"
// import Card from '@/components/Card/index'
import Card from "./components/card.vue"
import {
  getDataSetList,
  removeAllLabel,
  deleteDataSetList,
  getTargetType,
  getDataSetListById,
  // autoLabel,
  dataListChangeType,
  getPictureIdPageList
} from "@/api/dataCenter"
import pushData from './components/pushData.vue'
import BlurModal from './components/genrateBlurModal'
// import TransformModal from "./components/TransformModal";
import { refreshToken } from "@/api/auth";
import { mapGetters } from 'vuex'
import bus from "@/utils/bus.js"
import shareModal from "@/components/business/share/index.vue";
import transformer from "./components/transformer.vue"
import AutoAnnotation from "./components/autoAnnotation.vue";
import { stopAutoAnnotation } from "@/api/dataCenter.js";
import searchForm from './searchForm.vue'
import { DLTYPELIST, CREATING_STATUSLIST, DEFEAT_STATUSLIST } from "./enum.js"
import moment from 'moment'
// 本次提交移除了moveNode(应该是在目录树中使用).vue，万一后续再使用，可以翻看本次git记录

export default {
  name: "DataSetMrg",
  mixins: [mixinHeader],
  inject: ['addEditInstance'],
  components: {
    Card,
    addEditDialog: () => ({ component: import('./addEditDialog') }),
    AutoAnnotation,
    pushData,
    BlurModal,
    // TransformModal,
    shareModal,
    transformer,
    searchForm,
  },
  provide() {
    return {
      parentInstance: this,
    };
  },
  data() {
    return {
      // indicator: <a-icon type="loading" style="font-size: 32px" spin />,
      rowDataStatus: ['解析中', '正常', '解析失败', '创建中', '复制中', '拆分中', '解析图片...', '转换中', '上传中', '转换失败'],
      loading: false,
      // dlTagTypeOpt: [],
      tableData: [],
      columns: [],
      CREATING_STATUSLIST,
      DEFEAT_STATUSLIST,

      pagination: {
        total: 0,
        pageSize: 10,
        current: 1,
        showSizeChanger: false,
        pageSizeOptions: ["10", "20", "30", "50"],
        showTotal: function (total) {
          return `共 ${total} 条`
        }
      },
      // pagination: this.$store.getters.pagination,

      tabActiveKey: "1",
      search: "",
      currentTreeData: null,
      defaultColumns: [
        {
          title: '数据集名称',
          dataIndex: "dlName",
          key: "dlName",
          ellipsis: true,
          scopedSlots: { customRender: "dlName" },
          width: '12%'
        }, {
          title: "类型",
          dataIndex: "dlTagType",
        }, {
          title: "样本量",
          dataIndex: "sampleNum",
          key: "sampleNum",
          // width: 60
        }, {
          title: "标注比例",
          dataIndex: "tagRatio",
          key: "tagRatio",
          width: "100px"
        }, {
          title: "状态",
          dataIndex: "status",
          key: "status",
          scopedSlots: { customRender: "status" },
          width: "110px"
        }, {
          // title: "标签",
          dataIndex: "dlType",
          key: "dlType",
          slots: { title: 'customDlTypeHeader' },
          customRender: (text, record) => {
            const cr = DLTYPELIST.find(item => item.value === record.dlType);
            return cr?.label || ""
          },
          // width: 70
        }, {
          title: "标注状态",
          dataIndex: "autoMarkTaskStatus",
          key: "autoMarkTaskStatus",
          align: 'center',
          scopedSlots: { customRender: "autoMarkTaskStatus" },
          width: "100px",
          // ellipsis: true,
        }, {
          title: "创建人",
          dataIndex: "createBy",
          // key: "createTime",
          // width: 70,
          ellipsis: true,
        }, {
          title: "创建时间",
          dataIndex: "createTime",
          key: "createTime",
          customRender: (text) => {
            return moment(text).format('YYYY-MM-DD HH:mm:ss')
          },
          ellipsis: true,
        }, {
          title: "操作",
          dataIndex: "",
          key: "x",
          // fixed: "right",
          scopedSlots: { customRender: "operate" },
          width: "200px"
          // width: "290px"

        }
      ],
      cardMode: true, //卡片显示模式/列表显示模式
      refreshTimer: null, //定时刷新列表的timer
      showShareDialog: false,  //设置共享modal
      showTransformerModal: false,
      showAutoAnnotationModal: false, //自动标注modal
      dtTypeSetData: { //类型设置需要采集/配置的信息集合
        showDatasetTypeSet: false, //
        targetType: '', //要转换的目标类型
        targetTypeList: [],
        curDataset: {}, //要设置的数据集data
        loading: false,
      },
      searchFormData: {
        dlName: '',
        dlTagType: "", //数据集类型
        dlType: "", //标签
        status: "",
        createBy: "",
      }
    }
  },
  mounted() {
    bus.$on("refreshDataList", (data) => {
      if (data) {
        this.getDataList(data);
      }
    })
  },
  created() {
    this.columns = [...this.defaultColumns]
    this.getTargetTypeData()
    this.getDataList({ isFirst: true })
  },
  beforeDestroy() {
    bus.$off("refreshDataList")
  },
  destroyed() {
    this.refreshTimer && clearTimeout(this.refreshTimer)
  },
  computed: {
    // 接收值
    ...mapGetters([
      'parentData',
      'dataSetTitle',
      'dlTagTypeOpt',
      'total',
      'pagination',
      'visible',
      'isMinimized'
    ]),
  },
  methods: {
    onShowSizeChange(current, pageSize) {
      this.pagination.pageSize = pageSize;
      this.pagination.current = 1;
      this.getDataList();
    },
    // 计算标注进度的百分比
    caclAnnotationPercent(data) {
      if (data.autoMarkImgFinishCount == null || data.autoMarkImgFinishCount == 0) {
        return 0;
      }
      return parseFloat((data.autoMarkImgFinishCount / data.autoMarkImgCount * 100).toFixed(2));
    },
    // 基于目标检测数据集创建新的分类数据集
    async doConvert(record) {
      this.showTransformerModal = true
      await this.$nextTick()
      this.$refs.refSegToCls.initState(record)
    },
    // 调用自动标注
    async callAutoAnnotation(record) {
      this.showAutoAnnotationModal = true
      await this.$nextTick()
      this.$refs.refAutoAnnotation.initState(record)
    },
    callDatasetTypeSet(record = {}) {
      this.dtTypeSetData.showDatasetTypeSet = true
      this.dtTypeSetData.curDataset = record
    },
    // 为未知类型的数据集设置数据集类型
    async doDatasetTypeSet() {
      const { targetType = '', curDataset = {} } = this.dtTypeSetData;
      if (!targetType) return this.$message.warning("请选择目标类型")
      try {
        this.dtTypeSetData.loading = true
        const res = await dataListChangeType({
          dlId: curDataset.id,
          dlTagType: targetType
        })
        this.dtTypeSetData.loading = this.dtTypeSetData.showDatasetTypeSet = false
        if (res.code !== 0) return false
        this.$message.success('操作成功')
        this.getDataList({
          pageNo: this.pagination.current,
          pageSize: this.pagination.pageSize,
          dlType: this.tabActiveKey
        })
      } catch (e) {
        console.log(e)
        this.dtTypeSetData.loading = false
      }
    },
    // 表格操作栏是否可用逻辑判断(参考card里的)
    disabledItem(data) {
      return false
      if (data.createBy === this.$store.state.user.user.username || this.$store.state.user.user.username === "admin") {
        return false
      }
      return true
    },
    // 查询数据集类型列表(分类，分割，检测)，这个是否后端返回的
    async getTargetTypeData() {
      const data = await getTargetType()
      if (data.code === 0) {
        // this.dlTagTypeOpt = data.data.map(element => {
        //   return {
        //     text: element.nodeName,
        //     value: element.nodeName
        //   }
        // })
        this.$store.commit("SET_DLTAGTYPEOPT", data.data.map(element => {
          return {
            text: element.nodeName,
            value: element.nodeName
          }
        }))
        this.dtTypeSetData.targetTypeList = data.data.filter(val => val.nodeName !== '其他')
      }
    },
    // 终止标注
    stopAutoAnnotation(record) {
      this.$confirm({
        content: `数据集正在进行自动标注,若强行终止,将导致部分数据未被标注,确定终止吗?`,
        cancelText: '取消',
        okText: '确定',
        onOk: async () => {
          const res = await stopAutoAnnotation(record.markTaskId)
          if (res.code !== 0) return false
          this.$message.success('任务已停止')
          this.getDataList()
        },
        onCancel() { }
      })

    },
    toSingleDataDetail(rowData) {//点击某行时跳转到详情页
      // 非正常状态或者在标注中时，不能进入详情页
      if (rowData.status !== 2 || rowData.autoMarkTaskStatus === 1) return false
      let bread = {
        ...this.$route.meta,
        path: this.$route.path
      }
      localStorage.setItem("bread", JSON.stringify(bread))
      this.$router.push({
        path: "/dataCenter/dataMrg/detail",
        query: { id: rowData.id, dlType: rowData.dlType }//跳转到对应路径并传递参数
      })
    },
    tabOnChange(tab) {
      // this.getDataList({ dlType: this.tabActiveKey, isFirst: true })
    },
    handCreate() {
      // 判断是否存在最小化的新建框
      if (this.isMinimized) {
        this.$store.commit("SET_ISMINIMIZED", false)
        this.$store.commit("SET_VISIBLE", !this.visible)
        return
      }
      refreshToken().finally(() => {
        this.$store.commit("SET_PARENTDATA", {
          dlName: "",
          dlRealDir: "",
          // dlTagType: this.dlTagTypeOpt[0].value,
          dlTagType: this.$store.getters.dlTagTypeOpt[0].value,
          dlDescribe: "",
          dsType: 1,
          dsChildType: 1,
          dlType: parseInt(this.tabActiveKey) || 1,
          parseType: 0,  //设置默认值
          nasId: '',
        })
        // console.log("$store改的parentData值", this.$store.getters.parentData);

        // this.parentData = {
        //   dlName: "",
        //   dlRealDir: "",
        //   dlTagType: this.dlTagTypeOpt[0].value,
        //   dlDescribe: "",
        //   dsType: 1,
        //   storedDirId: "",
        //   storedDirName: "",
        //   dsChildType: 1,
        //   dlType: this.tabActiveKey
        // }

        this.$store.commit("SET_DATASETTITLE", "新建数据集")
        // this.dataSetTitle = "新建数据集"
        this.$nextTick(() => {
          // this.$refs.addEditDialog.showDialog()
          // 获取App.vue的引用
          const appComponent = this.$root;
          const addEditDialogInstance = appComponent._routerRoot.$children[0].$refs.addEditDialog;
          // console.log("addEditDialogInstance: ", addEditDialogInstance)
          if (addEditDialogInstance) {
            addEditDialogInstance.showDialog();
          }
        })
      });
    },
    // attach
    async getDataList(attachParam = {}, needLoading = true) {
      this.refreshTimer && clearTimeout(this.refreshTimer)

      const { pageSize, current } = this.pagination
      const { dlName, status, dlType, dlTagType, createBy } = this.searchFormData
      const params = {
        limit: pageSize,
        pageNo: current,
        dlName,
        dlType,
        dlTagType,
        createBy,
        status,
        ...attachParam
      }
      // 转换status给后台(因为标注状态和数据集状态在系统是两个字段信息，而原型都设计统称为状态一个查询量)
      if (status === "MARKING") { //查询标注中的数据集
        params.status = ""; //清空status，写入autoMarkTaskStatus
        params.autoMarkTaskStatus = 1;
      }
      needLoading && (this.loading = true)
      const responseData = await getDataSetList(params)//调用api获取数据
      if (responseData.code === 0) {
        this.loading = false
        this.tableData = responseData.data.records//设置数据集列表的内容
        this.pagination.total = responseData.data.total

        // 存在状态为1，4, 5, 6, 7, 8, 9的记录，或自动标注状态为1的记录，则15秒后刷新页面
        for (var item of this.tableData) {
          if (item.autoMarkTaskStatus === 1 || [1, 4, 5, 6, 7, 8, 9].includes(item.status)) {
            this.refreshTimer = setTimeout((param) => {
              this.getDataList(param, false)
            }, 15000);
            break;
          }
        }
      }
    },
    tableDataChange(pagination, filters) {
      this.getDataList({
        pageSize: pagination.pageSize,
        pageIndex: pagination.current,
        dlTagType: filters?.dlTagType ? filters.dlTagType[0] : "",
        search: this.search
      })
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
    },
    async handleEdit(rowData) {
      this.loading = true
      const data = await getDataSetListById(rowData.id)
      this.loading = false
      if (data.code !== 0) return false
      // this.parentData = JSON.parse(JSON.stringify(data.data))
      this.$store.commit("SET_PARENTDATA", JSON.parse(JSON.stringify(data.data)))
      // this.dataSetTitle = "编辑数据集"
      this.$store.commit("SET_DATASETTITLE", "编辑数据集")
      this.$nextTick(() => {
        // this.$refs.addEditDialog.showDialog()
        // this.addEditInstance.showDialog()
        // 获取App.vue的引用
        const appComponent = this.$root;
        const addEditDialogInstance = appComponent._routerRoot.$children[0].$refs.addEditDialog;
        // console.log("addEditDialogInstance: ", addEditDialogInstance)
        if (addEditDialogInstance) {
          addEditDialogInstance.showDialog();
        }
      })
    },
    handleDelete(rowData, index) {
      const that = this
      this.$confirm({
        content: `确定要删除 ${rowData.dlName} 吗?`,
        cancelText: '取消',
        okText: '确定',
        onOk() {
          that.loading = true
          deleteDataSetList(rowData.id)
            .then(res => {
              if (res.code === 0) {
                that.$message.success("删除成功!")
                if (that.tableData.length === 1 && that.pagination.total !== 1) that.pagination.current--
                that.getDataList({
                  pageNo: that.pagination.current,
                  pageSize: that.pagination.pageSize,
                  dlType: that.tabActiveKey
                })
                // that.total--
                // that.$refs.tree.reloadData(that.currentTreeData)
              }
            }).finally(() => { that.loading = false })
        },
        onCancel() { }
      })
    },
    async showPushData(record) {
      this.loading = true
      const res = await getDataSetListById(record.id)
      this.loading = false
      if (res.code !== 0) return false
      // this.parentData = res.data
      this.$store.commit("SET_PARENTDATA", res.data)
      this.$store.commit("SET_DATASETTITLE", "追加数据")
      // this.dataSetTitle = "追加数据"
      this.$nextTick(() => {
        this.$refs.pushData.showDialog()
      })
    },
    removeAllLabel(record) {
      this.$confirm({
        content: '确定要清空该数据集的所有标注么？',
        cancelText: '取消',
        okText: '确定',
        onOk: async () => {
          const params = {
            dlId: record.id,
            requestType: 1,
            reviewRange: 0
          }
          this.loading = true
          const res = await removeAllLabel(params)
          this.loading = false
          if (res.code !== 0) return false
          this.$message.success('操作成功')
          this.getDataList({
            pageNo: this.pagination.current,
            pageSize: this.pagination.pageSize,
            dlType: this.tabActiveKey
          })
        }
      })
    },
    changeDataType(record, markFileType, dlTagType) {
      this.$confirm({
        content: '确定转换该数据集类型么？',
        cancelText: '取消',
        okText: '确定',
        onOk: async () => {
          const params = {
            dlId: record.id,
            // markFileType,
            dlTagType
          }
          try {
            this.loading = true
            const res = await dataListChangeType(params)
            this.loading = false
            if (res.code !== 0) return false
            this.$message.success('操作成功')
            this.getDataList({
              pageNo: this.pagination.current,
              pageSize: this.pagination.pageSize,
              dlType: this.tabActiveKey
            })
          } catch (e) {
            console.log(e)
            this.loading = false
          }
        }
      })
    },
    showTransformModal(record) {
      this.form.currentDir = record.dlRealDir;
      this.visible = true;
      // console.log(record);
    },
    handleChange() {
      console.log(this.blurForm);
    },
    // 切换卡片/列表显示
    toggleStyle(flag) {
      if (this.loading) return;
      this.cardMode = flag;
      // to do.. 如果table方式需要显示分页，而不用与card一样的滚动加载的话，这里每次切换还需要重新设置分页及数据
    },
    // 解析进度计算
    parseNum(data) {
      if (data.parseTotalPictures == null || data.totalPictures == null || data.totalPictures == 0 || data.parseTotalPictures == 0) return 0;
      return parseFloat((data.parseTotalPictures / data.totalPictures * 100).toFixed(2))
    },
    // 设置共享
    async shareModel(record) {
      this.showShareDialog = true
      await this.$nextTick()
      await this.$refs.refShareModal.invokeModal({ data: record, type: 'dataSet' })
      // 刷新列表数据
      this.getDataList()
    },
    handleSearch(reset) {
      this.pagination.current = 1;
      this.getDataList()
    },
    changePage(page, pageSize) {
      this.getDataList()
    }
  }
}
</script>


<style scoped lang="less">
.page-content {
  // height: calc(100% - 90px);   //不设置高度将导致懒加载不可用（改为使用page-content-height类设置）
  display: flex;
  flex-direction: column;
  &::v-deep .el-tabs__nav-wrap {
    width: 295px;
  }
}
.content {
  display: flex;
  flex: 1;
  .left {
    width: 200px;
    border-right: 2px solid #e6e7ea;
    padding-left: 12px;
    padding-right: 12px;
    max-height: calc(100vh - 160px);
    overflow: auto;
  }
  .right {
    flex: 1;
  }
}
.main {
  background: #fff;
  overflow: auto;
  width: 100%;
  flex: 1;
  border-radius: 16px;
  min-height: 30vh; //便于显示loading
  .card-wrap {
    flex: 1;
    // justify-content: space-between;
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    padding: 12px;
    // flex-direction: row;
  }
}
.dataCard {
  // padding:12px;
  // background: #fff;
  // width: 100%;
  // border-radius: 16px;
  // display: flex;
  // flex-wrap: wrap;
  // justify-content: space-between;
  .card {
    margin: 4px 4px 12px 4px;
    width: 24%;
  }
  // @media (max-width: 1400px) {
  //   .card {
  //     width: 32% !important;
  //   }
  // }
}

/deep/ .ant-table-row.isPrivate {
  td {
    color: rgb(204, 204, 204);
    cursor: no-drop;
    .dataList-name {
      cursor: no-drop;
    }
    /deep/ .ant-tag {
      background-color: rgb(204, 204, 204) !important;
      color: #fff;
    }
    a {
      color: rgb(204, 204, 204);
      cursor: no-drop;
    }
  }
}
.new-row {
  position: absolute;
  top: 0px;
  right: 0px;
}
.search-header {
  margin-bottom: 10px;
}
.red-color {
  color: red;
}
.mask {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: rgba(255, 255, 255, 0.5);
}
</style>
