<template>
  <div class="content-box">
    <div class="toolbar space-between">
      <el-form :inline="true"  size="small" ref="refSearchForm" @submit.native.prevent>
        <el-form-item label="名称" prop="name">
          <el-input v-model="keyword" placeholder="请输入" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handSearch($event)">查询</el-button>
          <el-button type="primary" plain @click="handSearch($event, true)">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin-bottom: 18px;">
        <el-button type="primary" @click="dialogUploadVisible = true">上传数据</el-button>
        <el-button type="primary" @click="dialogNewFolderVisible = true">新建目录</el-button>
        <el-button type="primary" @click="lastStep" :disabled="currentId === 0">上一级</el-button>
        <el-button type="danger" @click="batchDelete" v-show="selectedItems.length > 1" icon="el-icon-delete">删除</el-button>
      </div>
    </div>
    <el-dialog title="上传数据" :visible.sync="dialogUploadVisible">
      <el-form ref="uploadFormRef" enctype="multipart/form-data">
        <el-form-item>
          <el-upload
            :on-change="checkFile"
            :on-remove="del_file"
            v-model="uploadFileList"
            :file-list="uploadFileList"
            ref="upload"
            multiple
            :auto-upload="false"
            :http-request="uploadfiles"
            drag
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-input v-model="desc" placeholder="请输入描述"></el-input>
        </el-form-item>
        <div
          style="
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: center;
          "
        >
          <el-form-item>
            <el-button type="primary" @click="submitFile">上传</el-button>
          </el-form-item>
        </div>
      </el-form>
    </el-dialog>
    <a-table
      :columns="columns"
      :data-source="fileList"
      :pagination="pagination"
      :row-selection="{
        selectedRowKeys: selectedKeys,
        onChange: onSelectChange,
      }"
      :rowKey="(record) => record.id"
      :loading="loading"
      @change="handleTableChange"
    >
      <template slot="name" slot-scope="text, record">
        <div v-if="editId === record.id" class="flex vertical-center">
          <a-input
            :value="reNameVal"
            class="mr-8"
            @change="handleChange"
            @pressEnter="check(record)"
          /><a-icon type="check" class="mr-8" @click="check(record)" />
          <a-icon type="close" @click="editId = ''" />
        </div>
        <div v-else class="flex vertical-center">
          <a-icon
            v-if="record.isFolder"
            type="folder"
            class="mr-8"
            style="font-size: 22px; color: #ffca28"
          />
          <a-icon
            v-else
            type="file-text"
            class="mr-8"
            style="font-size: 22px; color: #4d97ff"
          />
          <el-tooltip effect="dark" :content="record.name" placement="top">
            <span class="name-ellipsis" @click="openItem(record)"
              >{{ record.name }}
            </span>
          </el-tooltip>
        </div>
        <div v-if="editId === record.id" class="error">{{ errorText }}</div>
      </template>
      <template slot="isFolder" slot-scope="text, record">
        <span>{{ record.isFolder ? "目录" : "文件" }}</span>
      </template>
      <template slot="updateTime" slot-scope="text, record">
        <span>{{ text|moment }}</span>
      </template>
      <template slot="fileDescribe" slot-scope="text, record">
        <span>{{ record.fileDescribe || "--" }}</span>
      </template>
      <template slot="action" slot-scope="text, record">
        <div style="display: flex; align-items: center">
          <a
            type="link"
            :class="{
              'aButton-style': true,
              'mr-8': true,
            }"
            @click="reName(record)"
            >重命名</a
          >
          <a
            type="link"
            :class="{
              'aButton-style': true,
              'mr-8': true,
            }"
            @click="moveOrCopy(record)"
            >复制/移动</a
          >
          <a-popover trigger="click">
            <template slot="content">
              <div>
                文件大小：{{
                  (record.fileSize || 0) + "KB"
                }}
              </div>
              <div>目录：{{ record.isFolder ? "是" : "否" }}</div>
              <div>修改时间：{{ record.updateTime | moment}}</div>
            </template>
            <a
              type="link"
              :class="{
                'aButton-style': true,
                'mr-8': true,
              }"
              >文件大小</a
            >
          </a-popover>
          <a
            type="link"
            :class="{
              'aButton-style': true,
              'mr-8': true,
            }"
            @click="setSharing(record)"
            >设置共享</a
          >
          <a-popconfirm
            placement="top"
            ok-text="Yes"
            cancel-text="No"
            @confirm="deleteItem(record.id)"
          >
            <template slot="title">
              <div>确定要删除此条记录么？</div>
            </template>
            <a type="link" :class="{'aButton-style': true, }">删除</a>          
          </a-popconfirm>
        </div>
      </template>
    </a-table>
    <el-dialog
      title="新建目录"
      :visible.sync="dialogNewFolderVisible"
      @close="cancelNewFolder"
    >
      <el-form ref="newFolderForm" :model="newFolderForm" label-width="120px" @submit.native.prevent="newFolderNameClick">
        <el-form-item
          label="文件夹名称"
          prop="folderName"
          :rules="rules"
        >
          <el-input v-model="newFolderForm.folderName"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <a-button type="primary" class="mr-8" @click="newFolderNameClick">
          确 认
        </a-button>
      </div>
    </el-dialog>
    <!-- 设置分享 -->
    <el-dialog title="分享" :visible.sync="dialogShareVisible" @close="cancelSharing">
      <div class="user-search">
        <a-input-search
          placeholder="input search username"
          v-model="userNameKeyword"
        />
        <a-button type="primary" @click="confirmPublicSharing" >{{publicButtonText}}</a-button>
      </div>
      <a-table
        size="mini"
        :columns="userColumns"
        :data-source="filterUserList"
        :row-selection="rowSelection"
        :rowKey="(record) => record.id"
      >
        <template slot="roles" slot-scope="text, record">
          <span>{{ getUserRoles(record) }}</span>
        </template>
        <template slot="enabled" slot-scope="text, record">
          <span>{{ record.enabled ? "激活" : "锁定" }}</span>
        </template>
      </a-table>
      <template slot="footer">
        <a-button
          type="primary"
          class="mr-8"
          :disabled="selectedUsers.length === 0"
          @click="confirmSharing"
        >
          确 认
        </a-button>
        <a-button @click="dialogShareVisible = false"> 取 消 </a-button>
      </template>
    </el-dialog>

    <!--移动或复制弹出框-->
    <el-dialog
      :title="titlePrefix + selectTreeNode.showName"
      :visible.sync="dialogMoveOrCopyVisible"
      @close="clearTreeNode"
    >
      <el-tree
        v-if="dialogMoveOrCopyVisible"
        ref="directoryTree"
        :data="directoryTreeData"
        node-key="id"
        :props="directoryTreeProps"
        :load="directoryTreeLoadNode"
        :highlight-current="true"
        :default-expanded-keys="['0']"
        :render-content="renderContent"
        hight="100"
        lazy
        @node-click="treeNodeClick"
        @node-expand="treeNodeExpand"
      >
      </el-tree>
      <div slot="footer" class="dialog-footer">
        <a-button type="primary" class="mr-8" @click="copyOrMove('move')">
          移 动
        </a-button>
        <a-button type="primary" class="mr-8" @click="copyOrMove('copy')">
          复 制
        </a-button>
        <a-button
          @click="(dialogMoveOrCopyVisible = false), (rowContextData = null)"
        >
          取 消
        </a-button>
      </div>
    </el-dialog>

    <image-viewer
      :file-list="fileList"
      :status="showImage"
      ref="imageview"
      :initial-index="imageViewerIndex"
      @hideImageViewer="hideImageViewer"
    ></image-viewer>
    <el-dialog title="预览" :visible.sync="dialogPreviewVisible">
      <VueDocPreview
        :value="docValue"
        :type="docType"
        :mdStyle="mdStyle"
        :language="language"
        :url="docUrl"
      />
    </el-dialog>
    <el-dialog
      title="预览PDF"
      :visible.sync="dialogPreviewPDFVisible"
      fullscreen="true"
    >
      <iframe :src="pdfUrl" width="100%" height="100%" />
    </el-dialog>
    <el-dialog
      title="预览Word"
      :visible.sync="dialogPreviewWordVisible"
      fullscreen="true"
    >
      <div ref="file"></div>
    </el-dialog>
    <el-dialog
      title="预览Excel"
      :visible.sync="dialogPreviewExcelVisible"
      fullscreen="true"
    >
      <div
        id="luckysheet"
        style="margin: 0px; padding: 0px; width: 100%; height: 100%"
      ></div>
      <!-- <vue-office-excel
        :src="excel"
        style="height: 100vh;"
        @rendered="renderedHandler"
        @error="errorHandler"
      /> -->
      <!-- <vue-excel-viewer
        ref="excelView"
        :height="300"
      /> -->
    </el-dialog>
  </div>
</template>

<script>
import fileApi from "@/api/file-api";
import ImageViewer from "./components/imgViewer";
import VueDocPreview from "vue-doc-preview";
import crudUser from "@/api/system/user";
import { renderAsync } from "docx-preview";
import { read, utils } from "xlsx";
import {
  checkDataListNameAvl
} from "@/api/dataCenter"

export default {
  name: "Sharing",
  props: {
    sortable: {
      type: Object,
      default: function () {
        return { prop: "", order: "" };
      },
    },
  },
  components: {
    ImageViewer,
    VueDocPreview,
  },
  data() {
    const checkName = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        return callback(new Error('当前值不能为空'))
      } else if (!/^[a-zA-Z0-9-_\u4e00-\u9fa5.]+$/.test(value)) {
        return callback(new Error('只能输入字母、数字、汉字、下划线、.和中杠'))
      }
    }
    return {
      publicButtonText:"", //公共分享按钮文本
      desc:"", // description
      searchTimeout: null,
      uploadFileList: [],
      dialogUploadVisible: false,
      dialogPreviewExcelVisible: false,
      dialogPreviewWordVisible: false,
      dialogPreviewPDFVisible: false,
      dialogPreviewVisible: false, //预览窗口
      showImage: false,
      pdfUrl: "",
      docValue: "",
      docType: "",
      docUrl: "",
      mdStyle: {
        pre: {
          "background-color": "rgb(248, 248, 248)",
        },
        code: {
          "background-color": "rgb(248, 248, 248)",
          "line-height": "28px",
        },
      },
      language: "javascript",
      keyword: "",
      loading: false,
      currentId: 0, //当前文件/文件夹id
      columns: [
        {
          title: "名称",
          dataIndex: "name",
          key: "name",
          scopedSlots: { customRender: "name" },
        },
        {
          title: "类型",
          dataIndex: "isFolder",
          key: "isFolder",
          width: 80,
          scopedSlots: { customRender: "isFolder" },
        },
        {
          title: "创建用户",
          dataIndex: "createBy",
          key: "createBy",
        },
        {
          title: "修改时间",
          dataIndex: "updateTime",
          key: "updateTime",
          scopedSlots: { customRender: "updateTime" },
        },
        {
          title: "描述",
          dataIndex: "fileDescribe",
          key: "fileDescribe",
          scopedSlots: { customRender: "fileDescribe" },
          ellipsis: true,
        },
        {
          title: "操作",
          dataIndex: "action",
          key: "action",
          width: "330px",
          scopedSlots: { customRender: "action" },
        },
      ],
      fileList: [],
      pathList: [],
      imageViewerIndex: 0, // 初始预览的图片 index
      imageViewerList: [], // 预览图片列表
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: [10, 20, 30, 40, 50],
      },
      titlePrefix: "",
      selectTreeNode: {},
      dialogMoveOrCopyVisible: false, //控制移动或复制弹框的显隐
      dialogNewFolderVisible: false,
      dialogShareVisible: false,
      directoryTreeData: [], //树形控件数据
      //树形组件的props
      directoryTreeProps: {
        label: "name",
        children: "children",
        isLeaf: "isLeaf",
      },
      newFolderForm: {
        folderName: "",
      },
      rowContextData: null,
      uploadApiUrl: fileApi.simpleUploadURL, // 单个文件上传的api的url
      errorText: "",
      editId: "",
      reNameVal: "",
      // docFileList: [],
      selectedItems: [],
      selectedKeys: [],
      selectedUsers: [],
      userList: [],
      shareUsers: [],
      userColumns: [
        {
          title: "用户名",
          dataIndex: "username",
          key: "username",
          width: 120,
          ellipsis: true,
        },
        {
          title: "昵称",
          dataIndex: "nickName",
          key: "nickName",
          width: 80,
          ellipsis: true,
        },
        {
          title: "角色",
          dataIndex: "roles",
          key: "roles",
          width: 80,
          scopedSlots: { customRender: "roles" },
        },
        {
          title: "状态",
          dataIndex: "enabled",
          key: "enabled",
          width: 80,
          scopedSlots: { customRender: "enabled" },
        },
      ],
      userNameKeyword: "",
      rules:[
            {
              required: true,
              message: '请输入文件夹名称',
              trigger: ['blur', 'change'],
            },
            {
              required: true,
              validator: checkName,
              trigger: ['blur', 'change'],
            },
          ]
    };
  },
  computed: {
    rowSelection() {
      return {
        selectedRowKeys: this.shareUsers,
        onChange: (selectedRowKeys, selectedRows) => {
          this.shareUsers = selectedRowKeys;
          this.selectedUsers = selectedRows;
        },
      };
    },
    filterUserList() {
      // const modeMap = {
      //   segment: "目标检测",
      //   label: "分类",
      // };
      return this.userList.filter(
        (item) => item.username.indexOf(this.userNameKeyword) > -1
      );
    },
  },
  methods: {
    submitFile() {
      const enctypeOpt = {
        "Content-Type": "multipart/form-data",
      };
      const fileForm = new FormData();
      for (let i = 0; i < this.uploadFileList.length; i++) {
        fileForm.append("file", this.uploadFileList[i]);
      }
      fileForm.append("id", this.currentId);
      fileForm.append("desc",this.desc);
      // console.log(fileForm,'check fileForm');
      fileApi.uploadFile(fileForm,enctypeOpt).then(res=>{
        console.log(res,'上传结果')
        const condition = (item) => !item.status;
        const result = res.data.some(condition);
        if (!result){
          this.$message.success("上传成功");
          this.getData(this.currentId, this.pagination);
          this.desc = "";
        }
        else{
          res.data.map(item=>{
            if(!item.status){
              this.$message.error(item.message); 
            }
          })    
        } 
        this.dialogUploadVisible = false;
        this.uploadFileList = [];
        
      })
    },
    getUserRoles(record) {
      const roles = record.roles || [];
      const names = roles.map((role) => role.name);
      return names.join("<br/>") || "-";
    },
    checkFile(file) {
      const rawFile = file.raw;
      this.uploadFileList = this.uploadFileList.filter((item) => {
        return item.name !== rawFile.name;
      });
      this.uploadFileList.push(rawFile);
      console.log(this.uploadFileList, "Checking");
    },
    del_file(file) {
      const rawFile = file;
      this.uploadFileList = this.uploadFileList.filter((item) => {
        return item.uid !== rawFile.uid;
      });
      console.log(this.uploadFileList, "del_file");
    },
    // addFileToList(file, fileList) {
    //   const rawFile = file.raw;
    //   fileList = fileList.filter((t) => {
    //     return t.name !== rawFile.name;
    //   });
    //   fileList.push(rawFile);
    //   return [...fileList];
    // },

    renderedHandler() {
      console.log("渲染完成");
    },
    errorHandler() {
      console.log("渲染失败");
    },

    uploadfiles() {
      console.log(this.docFileList);
      let fd = new FormData(); // 新建一个FormData()对象，这就相当于你新建了一个表单
      this.docFileList.forEach((file) => {
        fd.append("file", file);
      });
      fd.append("id", this.currentId);
      console.log(fd.get("file"));
      fileApi.uploadFile(fd).then((res) => {
        this.$message.success("上传成功");
        this.docFileList = [];
        this.getData(this.currentId, this.pagination);
      });
    },
    hideImageViewer() {
      this.showImage = false;
    },
    //处理列数
    strToNum(str) {
      let result = 0;
      for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        console.log(code);
        result = result * 26 + (parseInt(code) - 65);
      }
      return result;
    },

    //转换数据格式
    convertSheetData(sheetData) {
      const luckysheetData = [];

      // 解析数据范围
      // const refMatch = sheetData["!ref"].match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
      // const startCol = refMatch[1];
      // const startRow = parseInt(refMatch[2]);
      // const startCol = 0;
      const startRow = 1;

      // 遍历每个单元格
      for (const cell in sheetData) {
        if (cell !== "!ref" && cell !== "!margins") {
          // console.log(cell);
          const match = cell.match(/([A-Z]+)(\d+)/);
          // console.log(match,'匹配结果');
          const col = match[1];
          const row = parseInt(match[2]);
          // console.log(match,'匹配结果')
          const rowIndex = row - startRow;
          const colIndex = this.strToNum(col) - 1;
          // 构建 Luckysheet 格式数据
          luckysheetData.push({
            r: rowIndex,
            c: colIndex,
            v: {
              ct: { fa: "General", t: "g" },
              m: sheetData[cell].w,
              v: sheetData[cell].w,
            },
          });
        }
      }

      return luckysheetData;
    },
    openItem(record) {
      let that = this;
      if (record.isFolder) {
        this.pathList.push(this.currentId);
        this.currentId = record.id;
        this.pagination.current = 1;
        this.getData(this.currentId, this.pagination);
      } else {
        if (["jpg", "jpeg", "png"].includes(record?.suffix?.toLowerCase())) {
          this.showImage = true;
          this.imageViewerIndex = this.getImageClickIndex(record);
          this.imageViewerIndex = this.imageViewerIndex === -1 ? 0 : this.imageViewerIndex;
        } else if (["txt"].includes(record.suffix)) {
          console.log("txt文件");
          fileApi
            .getPreviewFile({
              id: record.id,
            })
            .then((res) => {
              console.log(res, "预览txt的结果");
              const blob = new Blob([res], { type: "text/plain" });
              // 创建一个FileReader对象
              const reader = new FileReader();
              // 定义一个回调函数，当读取操作完成时触发
              reader.onload = function (event) {
                // event.target.result 就是转化后的文本内容
                that.docValue = event.target.result;
                that.docType = "text";
                console.log(that.docValue);
                that.dialogPreviewVisible = true;
              };

              // 使用readAsText方法将blob对象转化为文本
              reader.readAsText(blob);
            });
        } else if (["doc", "docx"].includes(record.suffix)) {
          console.log(record.suffix);
          fileApi
            .getPreviewFile({
              id: record.id,
            })
            .then((res) => {
              // const file = new Blob([res], { type: 'application/octet-stream' });
              // const fileUrl = window.URL.createObjectURL(file);
              console.log(res, "doc");
              this.dialogPreviewWordVisible = true;
              renderAsync(res, this.$refs.file); // 渲染到页面
            });
        } else if (["xlsx"].includes(record.suffix)) {
          fileApi
            .getPreviewFile({
              id: record.id,
            })
            .then((res) => {
              this.dialogPreviewExcelVisible = true;
              const excelBlob = new Blob([res], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              });
              const reader = new FileReader();
              reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                const workbook = read(arrayBuffer, { type: "array" });
                console.log(workbook);
                const sheetData = workbook.Sheets[workbook.SheetNames[0]];
                const convertedData = this.convertSheetData(sheetData);
                const luckysheetData = utils.sheet_to_json(convertedData, {
                  header: 1,
                });
                console.log(convertedData, luckysheetData, "查看表格数据");

                this.$nextTick(() => {
                  $(function () {
                    luckysheet.create({
                      container: "luckysheet", // 设定DOM容器的id
                      title: "Luckysheet Demo", // 设定表格名称
                      lang: "zh", // 设定表格语言
                      row: 36,
                      col: 18,
                      data: [
                        {
                          name: "Cell", //工作表名称
                          color: "", //工作表颜色
                          index: 0, //工作表索引
                          status: 1, //激活状态
                          order: 0, //工作表的下标
                          hide: 0, //是否隐藏
                          row: 36, //行数
                          column: 18, //列数
                          defaultRowHeight: 19, //自定义行高
                          defaultColWidth: 100, //自定义列宽
                          celldata: convertedData, //初始化使用的单元格数据
                          config: {
                            merge: {}, //合并单元格
                            rowlen: {}, //表格行高
                            columnlen: {}, //表格列宽
                            rowhidden: {}, //隐藏行
                            colhidden: {}, //隐藏列
                            borderInfo: {}, //边框
                            authority: {}, //工作表保护
                          },
                          data: [],
                          scrollLeft: 0, //左右滚动条位置
                          scrollTop: 0, //上下滚动条位置
                          luckysheet_select_save: [], //选中的区域
                          calcChain: [], //公式链
                          isPivotTable: false, //是否数据透视表
                          pivotTable: {}, //数据透视表设置
                          filter_select: {}, //筛选范围
                          filter: null, //筛选配置
                          luckysheet_alternateformat_save: [], //交替颜色
                          luckysheet_alternateformat_save_modelCustom: [], //自定义交替颜色
                          luckysheet_conditionformat_save: {}, //条件格式
                          frozen: {}, //冻结行列配置
                          chart: [], //图表配置
                          zoomRatio: 1, // 缩放比例
                          image: [], //图片
                          showGridLines: 1, //是否显示网格线
                          dataVerification: {}, //数据验证配置
                        },
                      ],
                    });
                  });
                });
                // luckysheet.create(options);
                // luckysheet.loadData(luckysheetData);
              };
              reader.readAsArrayBuffer(excelBlob);
            });
        } else if (["json"].includes(record.suffix)) {
          console.log("json文件");
          fileApi
            .getPreviewFile({
              id: record.id,
            })
            .then((res) => {
              console.log(res, "预览json的结果");
              const blob = new Blob([res], { type: "application/json" });
              // 创建一个FileReader对象
              const reader = new FileReader();
              // 定义一个回调函数，当读取操作完成时触发
              reader.onload = function (event) {
                // event.target.result 就是转化后的文本内容
                that.docValue = event.target.result;
                that.docType = "code";
                that.language = "json";
                that.dialogPreviewVisible = true;
              };

              // 使用readAsText方法将blob对象转化为文本
              reader.readAsText(blob);
            });
        } else if (["pdf"].includes(record.suffix)) {
          console.log("json文件");
          fileApi
            .getPreviewFile({
              id: record.id,
            })
            .then((res) => {
              console.log(res, "预览json的结果");
              const blob = new Blob([res], { type: "application/pdf" });
              this.pdfUrl = window.URL.createObjectURL(blob);
              this.dialogPreviewPDFVisible = true;
            });
        }
      }
    },
    newFolderNameClick() {
      console.log(this.newFolderForm);
      this.$refs["newFolderForm"].validate((valid) => {
        if (valid) {
          fileApi
            .uploadFolder({
              id: this.currentId,
              folderName: this.newFolderForm.folderName,
            })
            .then((res) => {
              console.log(res, "新建文件夹的结果");
              if (res.code != 0) {
                this.$message.warning(res.data.message);
              } else {
                this.$message.success("新建成功");
                this.cancelNewFolder();
                this.getData(this.currentId, this.pagination);
              }
            });
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    cancelNewFolder() {
      this.$refs["newFolderForm"].resetFields();
      this.dialogNewFolderVisible = false;
    },
    setSharing(record) {
      this.rowContextData = record;
      if(this.rowContextData.isPublicShare){
        this.publicButtonText='取消公共分享'
      }else{
        this.publicButtonText='设置公共分享'
      }
      this.getShareUser();
    },
    getShareUser() {
      fileApi
        .getShareUser({
          id: this.rowContextData.id,
        })
        .then((res) => {
          const temp = this.filterUserList.filter((item) =>
            res.data.includes(item.username)
          );
          this.selectedUsers = [...temp]
          this.shareUsers = this.selectedUsers.map((item) => item.id);
          this.dialogShareVisible = true;
        });
    },
    confirmPublicSharing(){
      fileApi
        .setPublicSharing({
          id: this.rowContextData.id,
          isPublic: !this.rowContextData.isPublicShare,
        })
        .then((res) => {
          console.log(res,'设置公共数据结果');
          this.cancelSharing();
          this.$message.success("设置成功");
        });
    },
    confirmSharing() {
      if (this.selectedUsers.length === 0) {
        return;
      }
      fileApi
        .setSharing({
          users: this.selectedUsers.map((ele) => ele.username).join(), //分享的用户名
          id: this.rowContextData.id,
        })
        .then(() => {
          this.cancelSharing();
          this.$message.success("分享成功");
        });
    },
    cancelSharing() {
      this.userNameKeyword = ''
      this.dialogShareVisible = false;
      this.rowContextData = null;
    },
    //点击移动或复制
    moveOrCopy(record) {
      this.dialogMoveOrCopyVisible = true;
      this.rowContextData = record;
      this.titlePrefix = "移动或复制到: ";
      const that = this;
      setTimeout(function () {
        that.selectTreeNode = that.$refs.directoryTree.getCurrentNode();
        that.selectTreeNode.showName = ' "' + that.selectTreeNode.name + '"';
      }, 100);
    },
    // 加载下一级文件树
    directoryTreeLoadNode(node, resolve) {
      console.log(node, "node的信息");
      let fileId = null;
      if (node.level === 0) {
        const that = this;
        setTimeout(function () {
          that.$refs.directoryTree.setCurrentKey("0");
        }, 0);
        console.log(fileId, "查看fileId1");
        return resolve([{ id: "0", name: "全部文件" }]);
      }
      if (node.level > 0) {
        fileId = node.data.id;
      }
      fileApi
        .getFolderList({
          id: fileId,
        })
        .then((res) => {
          const nextNodes = res.data;
          return resolve(nextNodes);
        });
    },
    //加载树形组件布局
    renderContent(h, { node, data, store }) {
      if (node.expanded) {
        return (
          <span class="custom-tree-node">
            <a-icon
              type="folder-open"
              style="font-size: 22px; color: #ffca28"
            />
            <span style="margin-left: 5px;">{node.label}</span>
          </span>
        );
      } else { 
        return (
          <span class="custom-tree-node">
            <a-icon type="folder" style="font-size: 22px; color: #ffca28" />
            <span style="margin-left: 5px;">{node.label}</span>
          </span>
        );
      }
    },
    // 点击文件树
    treeNodeClick(row, node, event) {
      console.log(row, "点击文件树");
      // this.fileTreeAndNewFolderDisabled = row.hasOwnProperty("newFolder");
      this.selectTreeNode = row;
      this.selectTreeNode.showName = ' "' + row.name + '"';
    },
    // 复制或粘贴
    copyOrMove(operating) {
      let operation = "复制";
      if (operating === "move") {
        operation = "移动";
      }
      console.log(this.selectTreeNode, this.rowContextData, "compare");
      if (this.selectTreeNode.id == this.rowContextData.id) {
        this.$message.warning("不能将文件" + operation + "到自身目录下");
        return;
      }
      if (this.selectTreeNode.id == this.rowContextData.parentId) {
        this.$message.warning("不能将文件" + operation + "到原来的目录下");
        return;
      }
      // 移动
      if (operating == "move") {
        fileApi
          .move({
            sourceId: this.rowContextData.id, //原始文件或文件夹的相对路径id
            targetId: this.selectTreeNode.id, //目的地址相对路径id
          })
          .then((res) => {
            if (res.code == 0) {
              this.$message.success(res.data.message);
              this.dialogMoveOrCopyVisible = false;
              this.getData(this.currentId, this.pagination);
            } else {
              this.$message.error(res.data.message);
              this.dialogMoveOrCopyVisible = false;
            }
          });
      } else if (operating == "copy") {
        fileApi
          .copy({
            sourceId: this.rowContextData.id, //原始文件或文件夹的相对路径id
            targetId: this.selectTreeNode.id, //目的地址相对路径id
          })
          .then((res) => {
            if (res.code == 0) {
              this.$message.success(res.data.message);
              this.dialogMoveOrCopyVisible = false;
              this.getData(this.currentId, this.pagination);
            } else {
              this.$message.error(res.data.message);
              this.dialogMoveOrCopyVisible = false;
            }
          });
      }
      this.rowContextData = null;
      // this.copyOrMoveApi(operating, fileIds, this.selectTreeNode.id);
    },
    // 上一步
    lastStep() {
      this.currentId = this.pathList.pop();
      this.pagination.current = 1;
      this.getData(this.currentId, this.pagination);
    },
    onSelectChange(selectedRowKeys, selectedRows) {
      this.selectedKeys = selectedRowKeys;
      this.selectedItems = selectedRows;
    },
    handleTableChange(pagination, filters, sorter) {
      // 处理分页变化的逻辑
      console.log("Pagination change:", pagination);
      this.pagination.current = pagination.current;
      // 这里可以调用后端接口获取新的数据
      this.getData(this.currentId, this.pagination);
    },
    handSearch(event,reset) {
      if(reset) {
        this.keyword = ''
      }
      this.pagination.current = 1;
      this.getData(this.currentId, this.pagination, this.keyword);
    },
    getData(currentId, pagination, keyword) {
      this.loading = true;
      const method = keyword ? "searchFile" : "getfileList";
      const params = {
        id: currentId,
        pageNo: pagination.current,
        limit: pagination.pageSize,
        order: "ascending",
        sortableProp: "name",
      };
      if (keyword) {
        params.fileName = keyword;
      }
      fileApi[method](params)
        .then((res) => {
          this.loading = false;
          this.fileList = res.data.records;
          this.pagination.total = res.data.total;
          this.getImageViewerList();
        })
        .finally(() => {
          this.loading = false;
        });
    },
    // uploadSuccess() {
    //   // console.log(325346746357)
    //   this.getData(this.currentId, this.pagination);
    // },
    deleteItem(id) {
      this.loading = true
      fileApi.delete({ id: id,}).then((res) => {
        if(res.code == 0) {
          this.$message.success("删除成功");
          // 刷新列表
          this.getData(this.currentId, this.pagination);
        }
      }).finally(() => { this.loading = false })
    },
    batchDelete() {
      const deleteFn = () => {
        fileApi
          .batchDelete({
            ids: this.selectedItems.map((ele) => ele.id).join(),
          })
          .then((res) => {
            // "data": [{ "0a004.jpg": true},{ "222.pptx": true}], 删除结果格式
            const resultList = res.data || []
            const deleteFailedFiles = []
            resultList.forEach(file => {
              const deleteResult = Object.values(file || {})[0]
              const deleteFileName = Object.keys(file || {})[0]
              if(deleteResult == false) {
                deleteFailedFiles.push(deleteFileName)
              }
            })
            if(deleteFailedFiles.length) {  //存在删除失败的文件
              this.$message.warning(`文件${deleteFailedFiles.join()}及目录不支持删除，请联系管理员。`)
            }else {
              this.$message.success("删除成功");
            }
            // 刷新列表
            this.getData(this.currentId, this.pagination);
          });
      };
      this.$confirm({
        title: "Warning",
        content: "确认删除？",
        okText: "确认",
        cancelText: "取消",
        onOk: deleteFn,
      });
    },
    reName(record) {
      this.editId = record.id;
      this.reNameVal = record.name;
    },
    handleChange(e) {
      this.reNameVal = e.target.value;
      this.errorText = "";
    },
    check(record) {
      // 英文字母、数字和下划线不超过8位的字符串，且不能以下划线结尾
      const regex = /^[^\\/:\*\?"<>\|]+$/;
      if (this.reNameVal === "") {
        this.errorText = "输入不得为空";
        return;
      } else if (!regex.test(this.reNameVal)) {
        this.errorText = "请输入正确的文件名格式";
        return;
      }
      fileApi
        .rename({
          newName: this.reNameVal,
          id: record.id,
        })
        .then((res) => {
          if(res.data.status){
            this.$message.success(res.data.message);
            this.getData(this.currentId, this.pagination);
          }else{
            this.$message.error(res.data.message);
          }
        });
      this.editId = "";
    },
    // 获取图片预览列表
    getImageViewerList(){
      this.imageViewerList = this.fileList.filter(item => ["jpg", "jpeg", "png"].includes(item?.suffix?.toLowerCase()));
    },
    // 获取到当前图片在预览图片列表中index下标
    getImageClickIndex(record){
      return this.imageViewerList.findIndex(item => item.id === record.id);
    },
  },
  async mounted() {
    this.getData(this.currentId, this.pagination);
    const res = await crudUser.list({ current: 1, size: 100 });
    this.userList = res.result;
  },
};
</script>

<style lang="scss" scoped>
::v-deep .is-fullscreen {
  .el-dialog__body {
    height: 100%;
  }
}
::v-deep .ant-pagination-item-active a {
  color: #1890ff;
  background-color: #fff;
}
::v-deep .ant-table-pagination.ant-pagination {
    float: right;
    margin: 10px 0;
}
.content-box {
  position: relative;
  //.table-header {
  //   position: absolute;
  //   top: -56px;
  //   right: 0;
  // }
}
.flex {
  display: flex;
}
.vertical-center {
  align-items: center;
}
.name-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px; /* 根据需要设置最大宽度 */
  cursor: pointer;
}
a.aButton-style {
  // color: #1890ff !important;
  font-size: 14px;
  &.disabled-link {
    color: rgba(0, 0, 0, 0.25) !important; /* 改变颜色表示禁用状态 */
    text-decoration: none; /* 移除下划线 */
    cursor: not-allowed; /* 禁用点击事件 */
  }
}
.btn-style {
  border-radius: 8px;
  padding: 0 24px;
  height: 42px;
}
.mr-8 {
  margin-right: 8px;
}
.error {
  font-size: 12px;
  color: red;
}
.user-search {
  display: flex;
  width: 100%;
  text-align: right;
  margin-bottom: 8px;
  ::v-deep .ant-input-affix-wrapper {
    margin-right: 8px;
  }
}
</style>