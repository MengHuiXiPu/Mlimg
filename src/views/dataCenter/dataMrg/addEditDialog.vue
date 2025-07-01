<template>
<div>
  <a-modal
    :visible="visible"
    :title="dataSetTitle"
    @ok="handleOk"
    @cancel="handleCancel"
    width="800px"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    :loading="loading"
    :maskClosable="false"
    :getContainer="getModalContainer"
    destroyOnClose
    centered
  >
    <a-spin :spinning="loading">
      <a-form-model
        :label-col="{ span: 5 }"
        :wrapper-col="{ span: 18 }"
        ref="ruleForm"
        layout="horizontal"
        :model="rowData"
        :rules="rules"
      >
        <a-form-model-item label="数据集名称" prop="dlName">
          <a-input :maxLength="50" v-model="rowData.dlName" />
        </a-form-model-item>
        <a-form-model-item label="描述" prop="dlDescribe" v-if="rowData.dsType !== 7">
          <a-input v-model="rowData.dlDescribe" type="textarea" maxlength ="512" />
        </a-form-model-item>
        <a-form-model-item label="数据集类型" prop="dlTagType" v-if="rowData.dlType != '3' && rowData.dlType != '9' && rowData.dsType !== 7">
          <a-select v-model="rowData.dlTagType" :disabled="Boolean(rowData.id)" @change="getParentDlList">
            <a-select-option
              v-for="(item,key) in dlTagTypeOpt"
              :key="key"
              :value="item.value"
            >{{ item.text }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="新建方式" prop="dsType">
          <a-radio-group
            v-model="rowData.dsType"
            :disabled="Boolean(rowData.id)"
            @change="changeDsType"
          >
            <a-radio :value="1">本地文件源</a-radio>
            <a-radio :value="2">NAS文件源</a-radio>
            <a-radio :value="3">NFS文件源</a-radio>
            <a-radio v-if="rowData.dsType === 4" :value="4">转换数据集</a-radio>
            <a-radio :value="5">已存在数据集</a-radio>
            <a-radio v-if="rowData.dsType === 6" :value="4">转换数据集</a-radio>
            <a-radio :value="7">数据集转换</a-radio>
          </a-radio-group>
        </a-form-model-item>

        <!--  this.parentData.dlType :9 模板的"-->
         <!-- 先注释掉 -->
          <!-- :disabled="Boolean(rowData.id) || rowData.dsType === 5" -->
        <!-- <a-form-model-item label="是否包含业务信息" prop="containSpecial" v-if="this.parentData.dlType != 9 && rowData.dsType !== 7" >
          <a-radio-group
            v-model="rowData.containSpecial"
            disabled
          >
            <a-radio :value="true">是</a-radio>
            <a-radio :value="false">否</a-radio>
          </a-radio-group>
        </a-form-model-item> -->

        <template v-if="rowData.dsType === 1 || rowData.dsType === 4 || rowData.dsType === 6">
          <!-- 本地上传数据集且为创建新的非编辑场景 -->
          <a-form-model-item label="上传文件" required v-if="isLocalUpload" prop="localFileName">
            <a-input v-model="rowData.localFileName" disabled style="width:200px;margin-right:10px;" />
            <a-upload  :showUploadList="false" :before-upload="uploadLocalFile" accept=".zip" :multiple="false">
              <a-button type="default"><a-icon type="upload"></a-icon>上传文件</a-button>
            </a-upload>
            <div style="color:#E6A23C;font-size: 13px;">
              数据集的目录结构请务必符合
              <a-popover title="结构目录规范" destroyTooltipOnHide trigger="hover">
                <template slot="content" >
                  <!-- <div class="scrollbar intro-wrapper"> -->
                    <p class="example">
                      <template v-if="rowData.dlType == '3'  ">
                        文件仅支持（1）zip格式的压缩包，压缩包大小请控制在2GB以内；（2）指定网盘共享目录的文件夹路径；
                      </template>
                      <template v-else>
                        上传本地zip或选择NAS共享存储数据源来创建图像数据集，数据集的文件结构需要符合如下两种规范格式；
                        <br/>其中规范1：图片标签文件来自JSON文件
                        <br/>其中规范2：支持从label文件夹解析标签信息或从JSON文件解析标签信息。
                        <br/>
                        <br/>注意事项：
                        <br/>1. 图片文件的名称与JSON文件的名称必须一致；
                        <br/>2. json文件为图像的标注信息，非必须文件；
                        <br/>3. 本地上传限制请控制在10GB以下，更大数量量的数据集建议通过NAS共享存储数据源方式创建；
                      </template>
                    </p>
                    <div class="div-img">
                      <img :src="require('@/assets/img/kaidan.png')" class="example-img" v-if="rowData.dlType == '3'"/>
                      <img :src="require('@/assets/images/datasetIntro.png')" class="example-img" v-else>
                    </div>
                  <!-- </div> -->
                </template>
                <a href="#">结构目录规范</a>
              </a-popover>
            </div>
          </a-form-model-item>
          <!-- 否则 -->
          <a-form-model-item label="文件路径" required v-else>
            <a-input v-model="rowData.dlRealDir" disabled style="width:200px;margin-right:10px;" />
            <a-upload  :timeout="86400000"
              name="file"
              :showUploadList="false"
              :multiple="false"
              :headers="headers"
              :fileList="downloadFiles"
              :action="this.parentData.dlType==9 ?actionTpl:action"
              @change="handleChange"
              :beforeUpload="uploadError"
              accept=".zip"
              :customRequest="uploadFilesCustomRequest"
            >
              <template v-if="!dlRealDirDisable">
                <a-button :disabled="Boolean(rowData.id) || dlRealDirDisable">
                  <a-icon type="upload" />
                  {{ dlRealDirText }}
                  <!-- <a-spin size="small" style="margin-left: 5px" v-if="dlRealDirDisable" /> -->
                </a-button>
              </template>
            </a-upload>
            <div v-if="dlRealDirDisable" style="display: inline-block;width: 200px">
              <a-progress :percent="progress.val" size="small" :status="progress.status" />
            </div>
          </a-form-model-item>
          
        </template>
        <template v-else-if="rowData.dsType === 2 || rowData.dsType === 3">
          <a-form-model-item label="选择数据源" prop="nasId">
            <a-select
              v-model="rowData.nasId"
              :disabled="Boolean(rowData.id)"
              @change="changeNasSource()">
              <a-select-option
                v-for="(item,key) in nasSourceList"
                :key="key"
                :value="item.id"
              >{{ item.dsName }}</a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item label="文件路径" prop="dlRealDir">
            <a-tree-select
              v-model="rowData.dlRealDir"
              show-search
              :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
              placeholder="请选择文件路径"
              allow-clear
              :tree-data="nasDirectory"
              :load-data="onLoadDirectory"
              :disabled="Boolean(rowData.id)"
            >
            </a-tree-select>
          </a-form-model-item>
          <!-- <a-form-model-item label="是否拷贝" prop="deepCopy">
            <a-select v-model="rowData.deepCopy" :disabled="Boolean(rowData.id)">
              <a-select-option :value="1">是</a-select-option>
              <a-select-option :value="0">否</a-select-option>
            </a-select>
            <span style="font-size: 12px;color:#ccc">选择【是】：该数据集将会备份到平台存储；选择【否】: 该数据集只读，无编辑权限</span>
          </a-form-model-item> -->
        </template>
        <template v-else-if="rowData.dsType === 5">
          <a-form-model-item label="父数据集" prop="parentDlId">
            <a-select v-model="rowData.parentDlId" :disabled="Boolean(rowData.id)" @change="getCodeList" showSearch :filter-option="filterOption">
              <a-select-option v-for="item in parentDlList" :key="item?.dlId" :value="item?.dlId">
                {{ item.dlName }}
              </a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item label="生成方式" prop="dsChildType">
            <a-radio-group
              v-model="rowData.dsChildType"
              :disabled="Boolean(rowData.id)">
              <a-radio :value="1">子数据集</a-radio>
              <a-radio :value="2" :disabled="showSplit" title="浅拷贝数据集不可以进行拆分">拆分数据集</a-radio>
            </a-radio-group>
          </a-form-model-item>
          <a-form-model-item label="抽取方式" prop="pickType">
            <a-radio-group
              v-model="rowData.pickType"
              :disabled="Boolean(rowData.id)">
              <a-radio :value="1">随机抽取</a-radio>
            </a-radio-group>
          </a-form-model-item>
          <a-form-model-item label="抽取条件" prop="pickCountType">
            <a-radio-group
              v-model="rowData.pickCountType"
              :disabled="Boolean(rowData.id)">
              <a-radio :value="1">数量</a-radio>
              <a-radio :value="2">占比</a-radio>
            </a-radio-group>
            <a-input-number
              :min="0"
              :precision="0"
              :step="1"
              :disabled="Boolean(rowData.id)"
              @change="changeAllValue"
              placeholder="设置全部样本数量"
              style="width: 100px;margin-right: 10px"></a-input-number>
            <span class="hideCodeList" v-if="hideCodeList === false" @click="hideCodeList = true">
              <a-icon type="plus-square" /><span>显示Code列表</span>
            </span>
            <span class="hideCodeList" v-else @click="hideCodeList = false">
              <a-icon type="minus-square" /><span>隐藏Code列表</span>
            </span>
          </a-form-model-item>
          <div class="code-list" v-show="hideCodeList">
            <div class="code-list-title" v-if="rowData.dsChildType === 2">
              <span>新数据集</span>
              <span>父数据集</span>
            </div>
            <a-form-model-item
              v-for="(item, index) in rowData.codeFilterList"
              :key="index"
              :label="item.categoryName"
              :prop="'codeFilterList.' + index + '.categoryValue'"
              :rules="{
                required: true,
                message: '请输入样本数量',
                trigger: 'blur',
              }"
              :class="['code', rowData.dsChildType === 2 && 'show-parent']"
              >
              <a-input-number
                v-model="item.categoryValue"
                :min="0"
                :max="rowData.pickCountType === 1 ? item.number : 100"
                :precision="0"
                :step="1"
                @change="codeNumberChange($event, 'categoryValue', item)"
                :disabled="Boolean(rowData.id)"/>
              <span class="number">{{ rowData.pickCountType === 1 ?
                `${item.number ? Math.ceil(item.categoryValue / item.number * 100) : 0}%` :
                `${item.number ? Math.ceil(item.categoryValue * item.number / 100) : 0}` }}</span>
              <template v-if="rowData.dsChildType === 2">
                <a-input-number
                  v-model="item.parentValue"
                  :min="0"
                  :max="rowData.pickCountType === 1 ? item.number : 100"
                  :precision="0"
                  :step="1"
                  @change="codeNumberChange($event, 'parentValue', item)"
                  :disabled="Boolean(rowData.id)"/>
                <span class="number">{{ rowData.pickCountType === 1 ?
                  `${item.number ? Math.floor(item.parentValue / item.number * 100) : 0}%` :
                  `${item.number ? Math.floor(item.parentValue * item.number / 100) : 0}` }}</span>
              </template>
              <span class="number">最大值：{{ item.number }}</span>
            </a-form-model-item>
          </div>
        </template>
        <form-model-item 
          v-if="rowData.dsType === 7" 
          ref="formModelItem" 
          :dlType="rowData.dlType"
          :modelSelect.sync="rowData.modelSelect" 
          :datasetSelect.sync="rowData.datasetSelect"
        />
        <!-- <a-form-model-item label="标注格式" prop="markFileType" v-if="rowData.dlTagType === '目标检测' && rowData.dsType !== 5"> -->
        <a-form-model-item label="标注格式" prop="markFileType" v-if="rowData.dsType !== 5 && rowData.dsType !== 7">
          <a-select v-model="rowData.markFileType" :defaultValue="1" disabled>
            <a-select-option :value="1">JSON</a-select-option>
            <a-select-option :value="2">XML</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="标注信息解析来源" prop="parseType" v-if="[1,2,3].includes(rowData.dsType)">
          <a-radio-group v-model="rowData.parseType" :disabled="Boolean(rowData.id)">
            <a-radio :value="0">通过JSON标注文件解析</a-radio>
            <a-radio :value="1">通过文件目录文件夹解析</a-radio>
          </a-radio-group>
          <div style="font-size: 12px;line-height: 20px;color:#E6A23C">请根据数据集实际目录结构选择对应的解析来源，若选择错误，标签信息将无法获取</div>
        </a-form-model-item>
        <a-form-model-item label="数据集标签" prop="dlType">
          <a-select v-model="rowData.dlType" >
            <a-select-option :value="1">训练集</a-select-option>
            <a-select-option :value="2">评估集</a-select-option>
          </a-select>
        </a-form-model-item>
      </a-form-model>
    </a-spin>

    <template slot="footer">
      <a-button key="minimize" @click="minimizeModal">
        最小化
      </a-button>
      <a-button key="Ok" @click="handleOk" type="primary">
        确定
      </a-button>
      <a-button key="cancel" @click="handleCancel">
        取消
      </a-button>
    </template>
  </a-modal>

  <!-- 最小化弹框 -->
  <!-- <div v-if="isMinimized" class="minimized-view" @click="restoreModal">
      恢复新建数据集
  </div> -->
  <!-- <MiniDataset :is-minimized="isMinimized" @restore-modal="restoreModal" /> -->

</div>
</template>

<script>
// import img1 from "@/assets/img/class.jpg"
// import img2 from "@/assets/img/classTwo.jpg"
// import img3 from '@/assets/img/kaidan.png'
import Cookie from "js-cookie"
import { rootDomain } from "@/utils/util"
import {
  saveDataSetList,
  editDataSetList,
  getAllNasList,
  getSelectedNasDirectoryNew,
  checkDataListNameAvl,
  getDataListByDlTag,
} from "@/api/dataCenter"
import { addDataListServer } from '@/api/offlineForecast.js'
import { getFileCategoryAndCount } from '@/api/modelManage'
import debounce from 'lodash.debounce'
import createTree from '@/components/tree/createTree'
import { axios } from '@/utils/request'
import { mapGetters } from 'vuex'
// import MiniDataset from '@/views/dataCenter/dataMrg/components/MiniDataset';
import formModelItem from './components/formModelItem'
import bus from "@/utils/bus.js"

export default {
  name: "AddEditDialog",
  components: {
    createTree,
    formModelItem,
    // MiniDataset
  },
  props: {
    dataSetTitle: {
      type: String,
      default: ""
    },
    dlTagTypeOpt: {
      type: Array,
      default: () => []
    },
    parentData: {
      type: Object,
      default: () => ({})
    },
    pagination: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    const checkName = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        return callback(new Error('当前值不能为空'))
      } else if (!/^[a-zA-Z0-9-_\u4e00-\u9fa5.]+$/.test(value)) {
        return callback(new Error('只能输入字母、数字、汉字、下划线、.和中杠'))
      } else {
        if (value === this.parentData.dlName) return callback()
        const checkData = await checkDataListNameAvl({
          dataListName: value,
          dlType: this.parentData.dlType
        })
        if (checkData.data) {
          callback()
        } else {
          callback(new Error('当前名称已存在，请重新输入'))
        }
      }
    }
    return {
      rules: {
        dlName: [
          {
            required: true,
            message: "请输入数据集名称",
            trigger: "blur"
          }, {
            required: true,
            validator: checkName,
            trigger: "blur"
          }
        ],
        dsType: [
          {
            required: true,
            message: "请选择数据集类型",
            trigger: "change"
          }
        ],
        localFileName: [
          {
            required: true,
            message: "请选择上传文件",
            trigger: "change"
          }
        ],
        dlTagType: [
          {
            required: true,
            message: "请选择数据集类型",
            trigger: "change"
          }
        ],
        parseType: [{ required: true, message: "请指定标注信息解析来源", }],
        // dlDescribe: [
        //   {
        //     required: true,
        //     message: "请输入备注",
        //     trigger: "blur"
        //   }
        // ],
        fileList: [
          {
            required: true,
            message: "请上传文件",
            trigger: "change"
          }
        ],
        // deepCopy: [
        //   { required: true, message: "请选择拷贝方式", trigger: "change" }
        // ],
        containSpecial: [{
          required: true,
          message: "请选择是否包含业务信息",
          trigger: "change"
        }],
        markFileType: [
          {
            required: true,
            message: "请选择标注格式",
            trigger: "change"
          }
        ],
        datasetSelect: [
          { required: true, message: "请选择数据集", trigger: "change" }
        ],
        modelSelect: [
          { required: true, message: "请选择模型", trigger: "change" }
        ],
        dlType: [
          { required: true, message: "请选择数据集标签", trigger: "change" }
        ],
        dlRealDir: [
          { required: true, message: "请选择文件路径", trigger: "change" }
        ],
        nasId: [
          { required: true, message: "请选择数据源", trigger: "change" }
        ],
      },
      rowData: {
        containSpecial: false,
        markFileType: 1,  // 默认JSON
        parseType: 0,
      },
      // visible: false,
      loading: false,
      // exampleImg: [img1, img2, img3],
      headers: {},
      dlRealDirText: "",
      dlRealDirDisable: false,
      action: "/api/v1/datacenter/file/upload",
      actionTpl: "/api/v1/datacenter/file/uploadTpl",
      nasSourceList: [],
      nasDirectory: null,
      progress: {
        val: 0,
        status: 'active'
      },
      parentDlList: [],
      hideCodeList: true,
      searchValue: '',
      dataSetVisible: false,
      createTreeData: {},
      showSplit: false,
      downloadFiles: [],
      isMinimized: false,
      uploadFile: null,
    }
  },
  mounted() {
    window._env_ = window._env_ || {}
    const tokenType = Cookie.get(
      window._env_.COOKIE_TOKENTYPE_KEY || "token_type",
      { domain: rootDomain() }
    )
    const token = Cookie.get(window._env_.COOKIE_TOKEN_KEY || "access_token", {
      domain: rootDomain()
    })
    if (token && tokenType) {
      this.headers["Authorization"] = tokenType + " " + token
    }

    if (9 == this.parentData.dlType) {
      this.action = this.actionTpl;
    } else {
      this.action = "/api/v1/datacenter/file/upload";
    }

  },
  computed: {
    // 从 Vuex store 获取表单数据
    storeRowData() {
      console.log("storeRowData", this.$store.state.rowData)
      return this.$store.state.rowData;
    },
    ...mapGetters([
      'visible',
      'isMinimized'
    ]),
    // 本地新建（上传方式）数据集
    isLocalUpload() {
      return !this.rowData.id && this.rowData.dsType == 1
    },
    // visible() {
    //   console.log(this.$store)
    //   return this.$store.state.visible;
    // },
    // ...mapState(() => {
    //   visible: state => state.app.visible;
    // })
  },
  watch: {
    // 监听 Vuex store 的表单数据变化，同步更新组件的表单数据
    storeFormData(newValue) {
      this.rowData = newValue;
    },
  },
  methods: {
    showDialog() {
      // this.visible = true
      this.$store.commit("SET_VISIBLE", true)
      console.log("$store改的visible值", this.$store.getters.visible);
      // this.$store.commit("SET_ISMINIMIZED", false)
      // console.log("$store改的isMinimized值", this.$store.state.isMinimized);
      this.progress = {
        val: 0,
        status: 'active'
      }
      if (this.$refs.ruleForm) {
        this.$refs.ruleForm.resetFields()
      }
      // this.rowData = { ...this.rowData, ...this.parentData }
      // 之前的写法是this.rowData = { ...this.parentData}，世宽增加containSpecial后导致的该问题
      this.rowData = { ...this.parentData, containSpecial: false }
      if (!this.rowData.markFileType) {  //默认标注格式为JSON，且不能修改
        this.$set(this.rowData, 'markFileType', 1)
      }
      if (!this.parentData.id || this.parentData.dsType === 5) {
        this.getParentDlList()
      }
      if (this.parentData.id && this.parentData.dsType === 5) {
        this.$set(this.rowData, 'codeFilterList', JSON.parse(this.rowData.pickCodeDetail))
      }
      this.changeDsType()
      this.dlRealDirText = this.rowData.dlRealDir ? "替换文件" : "上传文件"
    },
    handleOk() {
      const that = this
      this.$refs.ruleForm.validate(valid => {
        if (!valid) {
          return false
        } else {
          this.rowData.deepCopy = 1  //现在页面不再需要配置是否深拷贝，但是后端仍然需要这个字段，所以先写死1
          if (that.isLocalUpload) {  //本地上传文件来新建数据集时
            // delete this.rowData.localFileName
            if (!that.rowData.markFileType) that.rowData.markFileType = 1;
            that.rowData.shareType = 1;
            this.$uploadBox({
              type: 'uploadDataset',
              data: this.rowData,
              fileList: [this.uploadFile]
            })
            this.handleCancel()
            return
          }
          if (!that.rowData.dlRealDir && that.rowData.dsType === 1) {
            that.$message.error("请上传文件！")
            return false
          } else {
            if (this.rowData.dsType !== 7) {
              if (!that.rowData.markFileType) that.rowData.markFileType = 1
              if (this.rowData.dsType === 5) {
                this.rowData.pickCodeDetail = JSON.stringify(this.rowData.codeFilterList.map(item => {
                  return {
                    ...item,
                    pickCountType: this.rowData.pickCountType
                  }
                }))
              }
              that.rowData.shareType = 1
              that.loading = true
              const getData = that.rowData.id ? editDataSetList : saveDataSetList
              // console.log("  that.rowData="+ JSON.stringify(that.rowData))
              getData(that.rowData).then(data => {
                that.loading = false
                if (data.code === 0) {
                  // 新增成功后刷新数据集列表
                  bus.$emit("refreshDataList", {
                    pageSize: that.rowData.id ? that.pagination.pageSize : 10,
                    pageIndex: that.rowData.id ? that.pagination.current : 1,
                    isFirst: false,
                    dataType: 'add'
                  });
                  // this.visible = false
                  this.$store.commit("SET_VISIBLE", false)
                  that.$message.success(
                    that.rowData.id ? "修改成功！" : "新增成功！"
                  )
                }
              }).catch(err => {
                that.loading = false;
                this.$message.error(
                  err?.response?.data?.msg || err?.response?.data?.message
                );
              })
            } else {
              const params = {
                "modelId": this.rowData.modelSelect.id,
                "dlId": this.rowData.datasetSelect.id,
                "modelType": this.rowData.modelSelect.modelType,
                "dlName": this.rowData.dlName,
                "dsType": this.rowData.dsType,
                "dlType": this.rowData.datasetSelect.dlType,
                "dlRealDir": this.rowData.datasetSelect.dlRealDir,
                "dlTagType": this.rowData.datasetSelect.dlTagType,
                "dlDescribe": this.rowData.datasetSelect.dlDescribe || "",
                "markFileType": this.rowData.datasetSelect.markFileType,
                // "storedDirId": this.rowData.storedDirId,
                // "storedDirName": this.rowData.storedDirName,
              }
              that.loading = true;
              addDataListServer(params).then(res => {
                that.loading = false
                if (res?.code === 0) {
                  // 新增成功后刷新数据集列表
                  bus.$emit("refreshDataList", {
                    pageSize: that.rowData.id ? that.pagination.pageSize : 10,
                    pageIndex: that.rowData.id ? that.pagination.current : 1,
                    isFirst: false,
                    dataType: 'add'
                  });
                  // 目前没用，不知道后面有没有用
                  const datasetID = res.data;
                  this.$store.commit("SET_VISIBLE", false)
                  that.$message.success("新增转换任务成功！")
                }
              }).catch(err => {
                that.loading = false;
                this.$message.error(
                  err?.response?.data?.msg || err?.response?.data?.message
                );
              })
            }
          }
        }
      })
    },

    fileFormatter(data) {
      let file = {
        // uid: data.uuid,    // 文件唯一标识，建议设置为负数，防止和内部产生的 id 冲突
        name: data.data,   // 文件名
        status: 'done', // 状态有：uploading done error removed
        response: '{"status": "success"}', // 服务端响应内容
      }
      return file
    },
    uploadFilesCustomRequest(data) {
      this.dlRealDirDisable = true
      const formData = new FormData();
      formData.append('file', data.file);
      axios.post(this.action, formData, {
        onUploadProgress: progressEvent => {
          let percent = (progressEvent.loaded / progressEvent.total * 100 | 0);
          this.progress.val = Number(percent.toFixed(2))
        }
      }).then((response) => {
        console.log(response)
        if (response.code === 0) {
          let file = this.fileFormatter(response);
          this.downloadFiles.push(file);
          this.rowData.dlRealDir = file.name;
          this.dlRealDirDisable = false
          this.dlRealDirText = "替换文件"
        } else {
          this.$message.error(response.msg);
          this.$message.error("上传错误")
          this.dlRealDirDisable = false
          this.dlRealDirText = "上传文件"
        }
      })
        .catch((error) => {
          console.error('Upload Error:', error);
          this.$message.error("上传错误")
          this.dlRealDirDisable = false
          this.dlRealDirText = "上传文件"
        });
    },
    handleChange(file) {
      if (9 == this.parentData.dlType) {
        this.action = this.actionTpl;
      }

      this.progress.status = 'active'
      if (file.event) {
        this.progress.val = Number(file.event.percent.toFixed(2))
        if (file.event.percent === 100) {
          this.progress.status = 'success'
        }
      }
      if (file.file.status === "done") {
        this.rowData.dlRealDir = file.file.response.data
        this.dlRealDirDisable = false
        this.dlRealDirText = "替换文件"
      }
      if (file.file.status === "error") {
        this.$message.error("上传错误")
        this.dlRealDirDisable = false
        this.dlRealDirText = "上传文件"
      }
      if (file.file.status === "uploading") {
        this.dlRealDirDisable = true
        // this.dlRealDirText = `文件上传中(${this.progress}%)`
      }
    },
    handleCancel() {
      this.dlRealDirDisable = false
      this.nasDirectory = []
      this.progress = {
        val: 0,
        status: 'active'
      }
      // this.visible = false
      this.$store.commit("SET_VISIBLE", false)
    },
    changeDsType() {
      if (this.rowData.dsType === 1) return false
      if (this.rowData.dsType === 2 || this.rowData.dsType === 3) {
        // 切换时会请求对应的数据源列表,所以需要清除
        if (!this.rowData.id) {
          this.rowData.nasId = ''
          this.rowData.dlRealDir = ''
        }
        const params = {
          protocolType: this.rowData.dsType === 2 ? 1 : 0
        }
        getAllNasList(params).then(res => {
          this.nasSourceList = res.data
        })
      }
      if (!this.parentData.id && this.rowData.dsType === 5) {
        this.rowData = {
          ...this.rowData,
          pickType: 1,
          pickCountType: 1
        }
        // 触发查询父数据集列表
        this.getParentDlList()
      }

      //alert("parentData.dlType:"+this.parentData.dlType);
    },
    async changeNasSource(val) {
      const params = {
        id: this.rowData.nasId,
        selectedPath: val
      }
      const res = await getSelectedNasDirectoryNew(params)
      if (res.code !== 0) return false
      const data = res.data
      this.rowData.dlRealDir = ''
      this.nasDirectory = this.traverseObject(data.children, '/')
    },
    searchDirectory: debounce(function (val) {
      if (!this.rowData.nasId) {
        this.$message.warning('请先选择一个数据源')
        return false
      }
      // this.changeNasSource(val)
      return false
    }, 300),
    async onLoadDirectory(treeNode) {
      const { children, key } = treeNode.dataRef
      const params = {
        id: this.rowData.nasId,
        path: key
      }
      const res = await getSelectedNasDirectoryNew(params)
      if (res.code !== 0) return false
      treeNode.dataRef.children = this.genDirectoryTreeNode(res.data.children, key)
      this.nasDirectory = [...this.nasDirectory]
    },
    genDirectoryTreeNode(data, key) {
      return data.map(item => {
        const { name, children } = item
        return {
          key: key + name + '/',
          value: key + name + '/',
          title: name,
          isLeaf: children
        }
      })
    },
    traverseObject(data, parentKey) {
      return data.map((key, index) => {
        const currentKey = parentKey + key.name + '/'
        return {
          key: currentKey,
          value: key.name,
          title: key.name,
          parentKey: parentKey,
          children: key.children ? this.traverseObject(key.children, currentKey) : undefined
        }
      })
    },
    uploadError(file) {
      if (file.name.substring(file.name.lastIndexOf('.') + 1) !== 'zip') {
        this.$message.error('请上传zip格式文件')
        return false
      }
      // if (file.size > (1024 * 1024 * 10240)) {
      //   this.$message.error('文件大小不能超过10GB')
      //   return false
      // }
    },
    uploadLocalFile(file) {
      if (file.name.substring(file.name.lastIndexOf('.') + 1) !== 'zip') {
        this.$message.error('请上传zip格式文件')
        return false
      }
      this.uploadFile = file
      this.$set(this.rowData, 'localFileName', file.name)
      this.$refs.ruleForm.clearValidate(['localFileName'])
      return false
    },
    async getParentDlList() {
      if (this.rowData.dsType !== 5) return //不是通过已存在数据集创建，不需要请求下面的接口信息
      const params = {
        dlTagType: this.rowData.dlType == 5 ? '' : this.rowData.dlTagType,
        dlType: this.rowData.dlType
      }
      this.loading = true
      const res = await getDataListByDlTag(params)
      this.loading = false
      if (res.code !== 0) return false
      this.parentDlList = res.data

      if (!this.parentData.id && this.parentDlList.length > 0) {
        this.$set(this.rowData, 'parentDlId', res.data[0]?.dlId)
        this.$set(this.rowData, 'containSpecial', res.data[0]?.containSpecial || false)
        this.getCodeList(res.data[0]?.dlId)
      }
    },
    async getCodeList(id) {
      const item = this.parentDlList.filter(item => item?.dlId === id)
      if (item.length > 0) {
        this.showSplit = item[0].deepCopy === 0 && item[0].remoteWritePermissionFlag === 0
        this.$set(this.rowData, 'containSpecial', item[0]?.containSpecial || false)
      }
      this.loading = true
      const res = await getFileCategoryAndCount({
        id,
        markRange: 0,
        reviewRange: 0
      })
      this.loading = false
      if (res.code !== 0) return false
      if (!this.parentData.id && res.data?.DataListCategory) {
        this.$set(this.rowData, 'codeFilterList', res.data.DataListCategory.map((item, index) => {
          return {
            categoryName: item,
            number: res.data.DataListCategoryNum[index],
            categoryValue: res.data.DataListCategoryNum[index],
            parentValue: 0
          }
        }))
      }
    },
    codeNumberChange(val, type, item) {
      const _type = type === 'categoryValue' ? 'parentValue' : 'categoryValue'
      const number = this.rowData.pickCountType === 1 ? item.number : 100
      item[_type] = number - item[type]
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    changeAllValue(val) {
      this.rowData.codeFilterList.forEach((item, index) => {
        const number = this.rowData.pickCountType === 1 ? item.number : 100
        item.categoryValue = val > number ? number : val
        item.parentValue = number - item.categoryValue
        this.$refs.ruleForm.validateField('codeFilterList.' + index + '.categoryValue')
      })
    },
    // 最小化
    minimizeModal() {
      // 最小化时保存表单数据到 Vuex store
      this.$store.dispatch('saveFormData', this.rowData);
      // this.visible = false;
      this.$store.commit("SET_VISIBLE", false)
      // this.isMinimized = true;
      this.$store.commit("SET_ISMINIMIZED", true)
    },
    // 将Modal的数据挂在body上，实现跨页面
    getModalContainer() {
      // 返回渲染 Modal 的父节点，这里是 body
      return document.body;
    }
  }
}
</script>

<style scoped lang="less">
.intro-wrapper {
  height: 350px;
  overflow: auto;
}
.example {
  width: 700px;
  font-size: 13px;
}
.example-img {
  width: 700px;
  height: 300px;
  display: inline-block;
  margin: auto;
}
.ant-row-flex {
  display: block;
}
.code-list {
  &-title {
    margin: 0 0 5px 160px;
    span {
      width: 36%;
      display: inline-block;
    }
  }
  .code {
    padding-left: 50px !important;
    .number {
      margin: 0 15px 0 5px;
      color: #ccc;
      width: 60px;
      display: inline-block;
      &:last-child {
        display: inline;
      }
    }
    .ant-input-number {
      width: 50%;
    }
    &.show-parent {
      .ant-input-number {
        width: 20%;
      }
    }
  }
}
.div-img {
  width: 100%;
  display: flex;
}
.ant-select-tree-node-content-wrapper {
  .create {
    float: right;
    display: none;
  }
  &:hover {
    .treeName {
      .create {
        display: inline;
      }
    }
  }
}

.minimized-view {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background-color: #1890ff;
  color: #fff;
  padding: 5px;
  cursor: pointer;
}
</style>
