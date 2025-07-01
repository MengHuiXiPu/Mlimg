<template>
  <div class="dashboard-container"
      v-resize="containerResize"
      onselectstart="return false">
      <!--右键菜单-->
      <e-vue-contextmenu
        ref="contextShow"
        class="newFileMenu"
        :class="menuTriangle"
        @ctx-show="show"
        @ctx-hide="hide"
      >
        <div class="popper-arrow"></div>
        <ul v-for="(item, index) in menus" :key="item.label">
          <li
            v-if="
              item.operation === 'unFavorite' || item.operation === 'favorite'
            "
            class="menu-option"
            @click="menusOperations(item.operation)"
            @mouseover.prevent.stop="
              menuFavoriteOver(index, rowContextData.isFavorite)
            "
            @mouseleave.prevent.stop="
              menuFavoriteLeave(index, rowContextData.isFavorite)
            "
          >
            <label class="menuitem">
              <svg-icon :icon-class="item.iconClass" />
              <span class="menuitem text">{{ item.label }}</span>
            </label>
          </li>
          <li v-else @click="menusOperations(item.operation)">
            <label class="menuitem">
              <svg-icon :icon-class="item.iconClass" />
              <span class="menuitem text">{{ item.label }}</span>
            </label>
          </li>
        </ul>
      </e-vue-contextmenu>
      
    <!--list 和 grid布局-->
    <div
      v-show="fileList.length > 0"
      id="v-draw-rectangle"
    >
      <!--list布局-->
      <pl-table
        ref="fileListTable"
        v-show="!grid"
        v-loading="tableLoading"
        :max-height="clientHeight"
        :default-sort="sortable"
        :highlight-current-row="false"
        empty-text="无文件"
        :use-virtual="false"
        :row-height="51.5"
        :border="false"
        :excess-rows="10"
        :pagination-show="false"
        style="width: 100%; margin: 20px 0 0 0"
        stripe
        :cell-style="rowStyle"
        :height-change="false"
        :row-class-name="tableRowClassName"
        element-loading-text="文件加载中"
        element-loading-spinner="el-icon-loading"
        element-loading-background="#f6f7fa88"
        @selection-change="handleSelectionChange"
      >
        <template v-for="(item, index) in tableHead">
          <pl-table-column
            v-if="index === 1"
            :key="index"
            :index="index"
            align="center"
            header-align="center"
            width="80"
          >
            <template slot-scope="scope">
              <icon-file
                :item="scope.row"
                :image-url="imageUrl"
                :audio-cover-url="audioCoverUrl"
              ></icon-file>
            </template>
          </pl-table-column>
          <!--名称-->
          <pl-table-column
            v-if="index === 2"
            :key="index"
            :show-overflow-tooltip="true"
            max-width="200"
            :index="index"
            :prop="item.name"
            :label="item.label"
            :sort-orders="['ascending', 'descending']"
            :sortable="item.sortable ? (orderCustom ? 'custom' : true) : false"
          >
            <template slot-scope="scope">
              <el-input
                v-if="scope.row.index === editingIndex"
                :span="10"
                v-focus
                v-model="renameFileName"
                placeholder=""
                size="small"
                @focus="
                  renameInputFocus($event.currentTarget, scope.row.suffix)
                "
                @blur="setInputBlur()"
                @keyup.enter.native="rowRename(renameFileName, scope.row)"
              >
              </el-input>
              <div v-else class="table-file-name">
                {{ scope.row.name }}
                <el-tag
                  v-if="scope.row.ossPlatform"
                  size="small"
                  class="pc list oss-folder"
                  >{{ scope.row.ossPlatform }}
                </el-tag>
              </div>
            </template>
          </pl-table-column>
          <!--分享-->
          <pl-table-column
            v-if="index === 3 && showShareItem"
            :key="index"
            width="50"
            :index="index"
            align="center"
            header-align="center"
            tooltip-effect="dark"
          >
            <template slot-scope="scope">
              <el-tooltip
                v-if="
                  scope.row.index === cellMouseIndex &&
                  (!scope.row.isShare || scope.row.shareBase)
                "
                class="item"
                effect="light"
                content="分享"
                placement="top"
              >
                <svg-icon
                  title="分享"
                  class="button-class"
                  icon-class="share"
                  @click.stop="share(scope.row)"
                />
              </el-tooltip>
            </template>
          </pl-table-column>
          <!--更多-->
          <pl-table-column
            v-if="index === 4 && showMoreItem"
            :key="index"
            width="50"
            :prop="item.name"
            :label="item.label"
            :index="index"
            class="el-icon-more"
            align="center"
            header-align="center"
          >
            <!-- 使用组件, 并传值到组件中 -->
            <template slot="header">
              <svg-icon
                v-if="item.name !== ''"
                class="button-class"
                icon-class="more"
                @click.stop="moreOperation($event)"
              />
            </template>
            <template slot-scope="scope">
              <svg-icon
                v-if="scope.row.index === cellMouseIndex"
                class="button-class"
                icon-class="more"
                @click.stop="moreClick(scope.row, $event)"
              />
            </template>
          </pl-table-column>
          <!--文件大小-->
          <pl-table-column
            v-if="index === 5 && showSizeItem"
            :key="index"
            width="200"
            :prop="item.name"
            :index="index"
            :label="item.label"
            :sort-orders="['ascending', 'descending']"
            :sortable="item.sortable ? (orderCustom ? 'custom' : true) : false"
            :show-overflow-tooltip="true"
            align="left"
            header-align="left"
          >
            <template slot-scope="scope">
              <span>{{ formatSize(scope.row.size) }}</span>
            </template>
          </pl-table-column>
          <!--修改时间-->
          <pl-table-column
            v-if="index === 6 && showUpdateDateItem"
            :key="index"
            width="250"
            :prop="item.name"
            :index="index"
            :label="item.label"
            :sort-orders="['ascending', 'descending']"
            :sortable="item.sortable ? (orderCustom ? 'custom' : true) : false"
            :show-overflow-tooltip="true"
            align="left"
            header-align="left"
          >
            <template slot-scope="scope">
              <el-tooltip
                class="item"
                effect="light"
                :content="scope.row.updateDate"
                placement="top"
              >
                <span
                  >&nbsp;&nbsp;&nbsp;{{ formatTime(scope.row.agoTime) }}</span
                >
              </el-tooltip>
            </template>
          </pl-table-column>
        </template>
      </pl-table>
      <!--grid布局-->
      <div
        v-show="grid"
        v-loading="tableLoading"
        class="grid-file"
        element-loading-text="文件加载中"
        element-loading-spinner="el-icon-loading"
        element-loading-background="#f6f7fa88"
      >
        <div
          v-for="item in fileList"
          ref="gridItem"
          :key="item.id"
          class="gridItem"
          @click="gridItemClick(item)"
          @dblclick="fileClick(item)"
          @contextmenu.prevent="rowContextmenu(item)"
        >
          <div class="grid-item-icon">
            <icon-file
              :item="item"
              :image-url="imageUrl"
              :audio-cover-url="audioCoverUrl"
              :grid="true"
              :grid-width="gridColumnWidth"
            ></icon-file>
          </div>
          <el-input
            v-if="item.index === editingIndex"
            v-focus
            v-model="renameFileName"
            class="grid-item-text"
            placeholder=""
            type="textarea"
            autosize
            size="small"
            @focus="
              renameInputFocus($event.currentTarget, item.suffix)
            "
            @blur="setInputBlur()"
            @keyup.enter.prevent.native="
              rowRename(renameFileName, item)
            "
          >
          </el-input>
          <div class="filename-style">
            {{ gridFilename(item) }}
          </div>
        </div>
      </div>
    </div>
    
    <!--文件详细信息-->
    <el-drawer :title="rowContextData.name" :visible.sync="drawer">
      <div class="drawer-icon">
        <icon-file
          class="drawer-icon-font"
          :grid="true"
          :details="true"
          :item="rowContextData"
          :image-url="imageUrl"
          :audio-cover-url="audioCoverUrl"
        ></icon-file>
      </div>
      <el-form class="details-form">
        <el-form-item label="名称:">
          <span>{{ rowContextData.dlName }}</span>
        </el-form-item>
        <el-form-item label="类型:" class="details-name">
          <span>{{
            rowContextData.isFolder ? "文件夹" : rowContextData.contentType
          }}</span>
        </el-form-item>
        <div v-if="rowContextData.music">
          <el-form-item label="🎵 歌手:">
            <span>{{ rowContextData.music.singer }}</span>
          </el-form-item>
          <el-form-item label="🎵 专辑:">
            <span>{{ "《" + rowContextData.music.album + "》" }}</span>
          </el-form-item>
          <el-form-item label="🎵 歌名:">
            <span>{{ "《" + rowContextData.music.songName + "》" }}</span>
          </el-form-item>
        </div>
        <el-form-item
          v-show="rowContextData.w && rowContextData.h"
          label="分辨率:"
          class="details-resolution"
        >
          <span>{{ rowContextData.w + " x " + rowContextData.h }}</span>
        </el-form-item>
        <el-form-item label="大小:">
          <span>
            {{ rowContextData.size }}字节
            {{
              rowContextData.size > 0
                ? "(" + formatSize(rowContextData.size) + ")"
                : ""
            }}</span
          >
        </el-form-item>
        <el-form-item label="位置:" class="details-position">
          <a :href="'/?path=' + rowContextData.path + '&highlight=' + rowContextData.name">{{
            rowContextData.path
          }}</a>
        </el-form-item>
        <el-form-item label="创建时间:">
          <span>{{ rowContextData.uploadDate }}</span>
        </el-form-item>
        <el-form-item label="修改时间:">
          <span>{{ rowContextData.updateDate }}</span>
        </el-form-item>
      </el-form>
    </el-drawer>
  </div>
</template>

<script>
import { CheckboxGroup, Grid } from "vant";
import { formatSize, formatTime } from "./utils/number";
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
// import fileApi from "@/api/file-api";
// import Bus from "./assets/js/bus";
import "vant/lib/index.css";
import "vant/lib/index.js";
import IconFile from "./components/Icon/IconFile";
// import ButtonUpload from "./components/button/ButtonUpload";
import IconComponent from "./icons/index.js";
// import SimTextPreview from "./components/preview/SimTextPreview";
// import OfficePreview from "./components/preview/OfficePreview";
// import ImageViewer from "./components/preview/ImageViewer";

// import Bus from "./assets/js/bus";
export default {
  mixins: [IconComponent],
  components: {
    "van-checkbox-group": CheckboxGroup,
    "van-grid": Grid,
    "icon-file": IconFile,
    // ButtonUpload,
    // ImageViewer,
    // SimTextPreview,
    // OfficePreview
  },
  props: {
    selectFile: {
      // 是否为选择文件模式
      type: Boolean,
      defalut: false,
    },
    lessClientHeight: {
      type: Number,
      default: 106,
    },
    showUploadButton: {
      type: Boolean,
      default: true,
    },
    showSearchButton: {
      type: Boolean,
      default: true,
    },
    showShareItem: {
      type: Boolean,
      default: true,
    },
    showMoreItem: {
      type: Boolean,
      default: true,
    },
    isCollectView: {
      type: Boolean,
      default: false,
    },
    emptyStatus: {
      type: String,
      default: "空空如也~",
    },
    singleFileType: {
      type: String,
      default: "",
    },
    showNavigation: {
      type: Boolean,
      default: true,
    },
    queryFileType: {
      type: String,
      default: null,
    },
    defaultGrid: {
      type: Boolean,
      default: true,
    },
    orderCustom: {
      type: Boolean,
      default: false,
    },
    sortable: {
      type: Object,
      default: function () {
        return { prop: "", order: null };
      },
    },
    queryCondition: {
      type: Object,
      default: function () {
        return { isFolder: null };
      },
    },
    singleMenus: {
      type: Array,
      default: function () {
        return [
          { iconClass: "menu-open", label: "打开", operation: "open" },
          { iconClass: "share", label: "分享", operation: "share" },
          // { iconClass: "menu-favorite", label: "收藏", operation: "favorite" },
          {
            iconClass: "menu-details",
            label: "详细信息",
            operation: "details",
          },
          { iconClass: "menu-rename", label: "重命名", operation: "rename" },
          // { iconClass: "menu-copy", label: "移动或复制", operation: "copy" },
          { iconClass: "menu-download", label: "下载", operation: "download" },
          { iconClass: "menu-remove", label: "删除", operation: "remove" },
        ];
      },
    },
    multipleMenus: {
      type: Array,
      default: function () {
        return [
          { iconClass: "menu-copy", label: "移动或复制", operation: "copy" },
          { iconClass: "menu-download", label: "下载", operation: "download" },
          { iconClass: "menu-remove", label: "删除", operation: "remove" },
        ];
      },
    },
    multipleRightMenus: {
      type: Array,
      default: function () {
        return [
          {
            iconClass: "menu-deselect",
            label: "取消选定",
            operation: "deselect",
          },
          { iconClass: "menu-copy", label: "移动或复制", operation: "copy" },
          { iconClass: "menu-download", label: "下载", operation: "download" },
          { iconClass: "menu-remove", label: "删除", operation: "remove" },
        ];
      },
    },
    contextMenus: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      //组件参数
      grid: true,
      imageUrl: `https://demo.zhujunhao.top/api/view/thumbnail?jmal-token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJXRUIiLCJpc3MiOiJTZXJ2aWNlIiwiZXhwIjoxNzAwMDQzNDMyLCJ1c2VybmFtZSI6ImRlbW8ifQ.UQc7q5h867eb1cp8Vaj7A40-Wpei4r2nL5JrkPbEZEc&name=demo&id=`,
      audioCoverUrl: `https://demo.zhujunhao.top/api/view/cover?jmal-token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJXRUIiLCJpc3MiOiJTZXJ2aWNlIiwiZXhwIjoxNzAwMDQzNDMyLCJ1c2VybmFtZSI6ImRlbW8ifQ.UQc7q5h867eb1cp8Vaj7A40-Wpei4r2nL5JrkPbEZEc&name=demo&id=`,
      path: this.$route.query.path,
      pathList: [{ folder: "" }],
      isShowNewFolder: false,
      listModeSearch: false,
      inputting: false, // 是否正在输入
      searchFileName: "",
      isCmd: false, // 是否按住了command(control)键
      menus: [],
      drawer: false, // 详情抽屉
      rowContextData: {},  //详情抽屉数据
      editingIndex: -1,  //控制是否打开重命名输入框
      renameFileName: "",
      textPreviewVisible: false,
      textPreviewRow: {},
      imagePreviewRow: {},
      imagePreviewVisible: false,
      videoPreviewRow: {},
      videoPreviewVisible: false,
      officePreviewRow: {},
      officePreviewVisible: false,
      // 表头数据
      tableHead: [
        {
          name: "",
          label: "",
          index: 0,
        },
        {
          name: "",
          label: "",
          index: 1,
        },
        {
          name: "name",
          label: "名称",
          sortable: true,
          index: 2,
        },
        {
          name: "",
          label: "",
          index: 3,
        },
        {
          name: "",
          label: "",
          more: true,
          index: 4,
        },
        {
          name: "size",
          label: "大小",
          sortable: true,
          index: 5,
        },
        {
          name: "updateDate",
          label: "修改日期",
          sortable: true,
          index: 6,
        },
      ],
      // fileList: [
      //   {
      //     id: "64e819362afa1c5c936c279e",
      //     isFolder: true,
      //     name: "1111",
      //     size: 95198287,
      //     uploadDate: "2023-08-25 11:00:06",
      //     updateDate: "2023-08-25 11:00:06",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 7020136030,
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: true,
      //     shareBase: true,
      //     expiresAt: 9223372036854775807,
      //   },
      //   {
      //     id: "64fe7e7b2afa1c5c93719c1e",
      //     isFolder: true,
      //     name: "112233",
      //     size: 6399161,
      //     uploadDate: "2023-09-11 10:42:03",
      //     updateDate: "2023-11-03 10:08:52",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 975209873,
      //     suffix: "",
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: false,
      //     shareBase: true,
      //     expiresAt: 9223372036854775807,
      //   },
      //   {
      //     id: "64a7c44b58e2a37152041e44",
      //     isFolder: true,
      //     name: "256px",
      //     size: 226747,
      //     uploadDate: "2023-06-12 11:41:48",
      //     updateDate: "2023-07-07 15:52:43",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 11236178758,
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: true,
      //     shareBase: true,
      //     expiresAt: 1714505460000,
      //     operationPermissionList: [],
      //   },
      //   {
      //     id: "64c739942afa1c5c93645179",
      //     isFolder: true,
      //     name: "dasda",
      //     size: 1204,
      //     uploadDate: "2023-07-31 12:33:24",
      //     updateDate: "2023-07-31 12:33:24",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 9174538279,
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: false,
      //     shareBase: true,
      //     expiresAt: 9223372036854775807,
      //   },
      //   {
      //     id: "647d9d03f12065d38176017d",
      //     isFolder: true,
      //     name: "Document",
      //     size: 88412,
      //     uploadDate: "2023-06-05 16:29:55",
      //     updateDate: "2023-07-28 15:25:03",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 9423438696,
      //     suffix: "",
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: false,
      //     shareBase: true,
      //     expiresAt: 9223372036854775807,
      //   },
      //   {
      //     id: "64ec10302afa1c5c936d1954",
      //     isFolder: true,
      //     name: "faustodemartini",
      //     size: 0,
      //     uploadDate: "2023-08-28 11:10:40",
      //     updateDate: "2023-08-28 11:10:40",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 6760302128,
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: true,
      //     shareBase: true,
      //     expiresAt: 1696260420000,
      //   },
      //   {
      //     id: "647e981af12065d381763cec",
      //     isFolder: true,
      //     name: "Image",
      //     size: 1654536,
      //     uploadDate: "2023-06-06 10:21:14",
      //     updateDate: "2023-06-06 10:21:14",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 13934468093,
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: false,
      //     shareBase: true,
      //     expiresAt: 9223372036854775807,
      //   },
      //   {
      //     id: "64883783a20e6ab7b23e89ef",
      //     isFolder: true,
      //     name: "jakubkowalczyk",
      //     size: 5097343,
      //     uploadDate: "2023-06-13 17:31:47",
      //     updateDate: "2023-06-13 17:31:47",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 13303835299,
      //     isFavorite: false,
      //   },
      //   {
      //     id: "648834cea20e6ab7b23e8863",
      //     isFolder: true,
      //     name: "LLM",
      //     size: 384,
      //     uploadDate: "2023-06-13 17:20:14",
      //     updateDate: "2023-06-13 17:20:14",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 13304528236,
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: false,
      //     shareBase: true,
      //     expiresAt: 9223372036854775807,
      //   },
      //   {
      //     id: "64cb0d6d2afa1c5c936548ec",
      //     isFolder: true,
      //     name: "Native-release",
      //     size: 585,
      //     uploadDate: "2023-08-03 10:14:05",
      //     updateDate: "2023-08-03 10:14:05",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 8923696888,
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: false,
      //     shareBase: true,
      //     expiresAt: 9223372036854775807,
      //     operationPermissionList: [],
      //   },
      //   {
      //     id: "64ec11172afa1c5c936d21b1",
      //     isFolder: true,
      //     name: "navicat16激活工具和安装包",
      //     size: 101518024,
      //     uploadDate: "2023-08-28 11:09:23",
      //     updateDate: "2023-08-28 11:09:23",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 6760378589,
      //     isFavorite: false,
      //   },
      //   {
      //     id: "64c9e00a2afa1c5c9364f503",
      //     isFolder: false,
      //     name: ".DS_Store",
      //     md5: "0/.DS_Store",
      //     size: 12292,
      //     contentType: "application/octet-stream",
      //     uploadDate: "2023-08-02 12:48:07",
      //     updateDate: "2023-08-04 16:14:02",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 8815700315,
      //     suffix: "DS_Store",
      //     isFavorite: false,
      //   },
      //   {
      //     id: "65533110b64e2f23d3959bcf",
      //     isFolder: false,
      //     name: "#745-3.png.webp",
      //     md5: "13260/#745-3.png.webp",
      //     size: 13260,
      //     contentType: "image/webp",
      //     uploadDate: "2023-11-14 16:34:23",
      //     updateDate: "2023-11-14 16:34:23",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 1678347,
      //     suffix: "webp",
      //     isFavorite: false,
      //     w: "1248",
      //     h: "535",
      //   },
      //   {
      //     id: "64d069b558e2a37152049d51",
      //     isFolder: false,
      //     name: "03-PDF.png.webp",
      //     md5: "3076/Png/256px/03-PDF.png.webp",
      //     size: 3076,
      //     contentType: "image/webp",
      //     uploadDate: "2023-06-12 11:47:09",
      //     updateDate: "2023-08-07 11:49:09",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 8572393143,
      //     suffix: "webp",
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: false,
      //     shareBase: true,
      //     expiresAt: 9223372036854775807,
      //     w: "65280",
      //     h: "0",
      //   },
      //   {
      //     id: "64c3565b2afa1c5c93635da7",
      //     isFolder: false,
      //     name: "1.7z",
      //     md5: "164894/1.7z",
      //     size: 164894,
      //     contentType: "application/x-7z-compressed",
      //     uploadDate: "2023-07-28 13:47:07",
      //     updateDate: "2023-07-28 13:47:07",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 9429314986,
      //     suffix: "7z",
      //     isFavorite: false,
      //   },
      //   {
      //     id: "651293642afa1c5c93767262",
      //     isFolder: false,
      //     name: "111.txt",
      //     md5: "0/111.txt",
      //     size: 8,
      //     contentType: "text/plain;charset=utf-8",
      //     uploadDate: "2023-09-26 16:16:36",
      //     updateDate: "2023-10-18 11:45:21",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 2351821279,
      //     suffix: "txt",
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: true,
      //     shareBase: true,
      //     expiresAt: 1700114280000,
      //   },
      //   {
      //     id: "6513c07e2afa1c5c9376befc",
      //     isFolder: false,
      //     name: "5000 Level Exam.pdf",
      //     md5: "1087111/5000 Level Exam.pdf",
      //     size: 1087111,
      //     contentType: "application/pdf",
      //     uploadDate: "2023-09-27 13:41:18",
      //     updateDate: "2023-09-27 13:41:18",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 4159263804,
      //     suffix: "pdf",
      //     isFavorite: false,
      //   },
      //   {
      //     id: "6544dda9b64e2f23d39238ec",
      //     isFolder: false,
      //     name: "aaaaaa.md",
      //     md5: "0/aaaaaa.md",
      //     size: 0,
      //     contentType: "text/markdown",
      //     uploadDate: "2023-11-03 19:46:49",
      //     updateDate: "2023-11-03 19:46:49",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 940533034,
      //     suffix: "md",
      //     isFavorite: false,
      //     contentText: "",
      //   },
      //   {
      //     id: "64ed97ea2afa1c5c936d92b7",
      //     isFolder: false,
      //     name: "Advanced Archive Password Recovery 4.54.zip",
      //     md5: "4129753/Advanced Archive Password Recovery 4.54.zip",
      //     size: 4129753,
      //     contentType: "application/zip",
      //     uploadDate: "2023-08-29 15:02:02",
      //     updateDate: "2023-08-29 15:02:02",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 6660020223,
      //     suffix: "zip",
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: false,
      //     shareBase: true,
      //     expiresAt: 9223372036854775807,
      //   },
      //   {
      //     id: "65152b9103fe8b6557cd319c",
      //     isFolder: false,
      //     name: "BOM.xlsx",
      //     md5: "13873/BOM.xlsx",
      //     size: 13873,
      //     contentType:
      //       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      //     uploadDate: "2023-09-28 15:30:25",
      //     updateDate: "2023-10-18 01:05:52",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 2390190060,
      //     suffix: "xlsx",
      //     isFavorite: false,
      //   },
      //   {
      //     id: "649d14b32afa1c5c9359ab26",
      //     isFolder: false,
      //     name: "get-mcc-mnc-table-json.py",
      //     md5: "1040/get-mcc-mnc-table-json.py",
      //     size: 1041,
      //     contentType: "text/x-python;charset=utf-8",
      //     uploadDate: "2023-06-29 13:20:51",
      //     updateDate: "2023-10-15 12:23:11",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 2608750351,
      //     suffix: "py",
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: true,
      //     shareBase: true,
      //     expiresAt: 9223372036854775807,
      //   },
      //   {
      //     id: "649d14b32afa1c5c9359ab37",
      //     isFolder: false,
      //     name: "get-mcc-mnc-table-xml.py",
      //     md5: "1523/get-mcc-mnc-table-xml.py",
      //     size: 1523,
      //     contentType: "text/x-python;charset=utf-8",
      //     uploadDate: "2023-06-29 13:20:51",
      //     updateDate: "2023-06-29 13:20:51",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 11936490723,
      //     suffix: "py",
      //     isFavorite: false,
      //   },
      //   {
      //     id: "64d0dbcf2afa1c5c9366ab53",
      //     isFolder: false,
      //     name: "index.vue",
      //     md5: "1555/index.vue",
      //     size: 1486,
      //     contentType: "application/octet-stream;charset=utf-8",
      //     uploadDate: "2023-08-07 19:55:59",
      //     updateDate: "2023-08-08 22:49:59",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 8446342338,
      //     suffix: "vue",
      //     isFavorite: false,
      //   },
      //   {
      //     id: "64899601a20e6ab7b23ee375",
      //     isFolder: false,
      //     name: "jsconfig.json",
      //     md5: "158/jsconfig.json",
      //     size: 157,
      //     contentType: "application/json;charset=utf-8",
      //     uploadDate: "2023-06-14 18:27:13",
      //     updateDate: "2023-06-21 22:33:01",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 12594560893,
      //     suffix: "json",
      //     isFavorite: false,
      //   },
      //   {
      //     id: "649d14b32afa1c5c9359ab32",
      //     isFolder: false,
      //     name: "LICENSE",
      //     md5: "1084/LICENSE",
      //     size: 1084,
      //     contentType: "application/octet-stream;charset=utf-8",
      //     uploadDate: "2023-06-29 13:20:51",
      //     updateDate: "2023-06-29 13:20:51",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 11936490735,
      //     suffix: "",
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: true,
      //     shareBase: true,
      //     expiresAt: 9223372036854775807,
      //   },
      //   {
      //     id: "64882a12a20e6ab7b23e825e",
      //     isFolder: false,
      //     name: "LLM.py",
      //     md5: "388/LLM.py",
      //     size: 386,
      //     contentType: "text/x-python;charset=utf-8",
      //     uploadDate: "2023-06-13 16:34:26",
      //     updateDate: "2023-10-21 09:46:47",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 2099734411,
      //     suffix: "py",
      //     isFavorite: false,
      //   },
      //   {
      //     id: "6525a8b7b64e2f23d38ae6bf",
      //     isFolder: false,
      //     name: "MBSE介绍.pdf",
      //     md5: "317265/MBSE介绍.pdf",
      //     size: 317265,
      //     contentType: "application/pdf",
      //     uploadDate: "2023-10-11 03:40:39",
      //     updateDate: "2023-10-11 03:40:39",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 2985703183,
      //     suffix: "pdf",
      //     isFavorite: false,
      //   },
      //   {
      //     id: "649d14b32afa1c5c9359ab3e",
      //     isFolder: false,
      //     name: "mcc-mnc-table.csv",
      //     md5: "61/mcc-mnc-table.csv",
      //     size: 61,
      //     contentType: "text/csv;charset=utf-8",
      //     uploadDate: "2023-06-29 13:20:51",
      //     updateDate: "2023-06-29 13:20:51",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 11936490711,
      //     suffix: "csv",
      //     isFavorite: false,
      //   },
      //   {
      //     id: "649d14b32afa1c5c9359ab5e",
      //     isFolder: false,
      //     name: "mcc-mnc-table.xml",
      //     md5: "0/mcc-mnc-table.xml",
      //     size: 2,
      //     contentType: "application/xml;charset=utf-8",
      //     uploadDate: "2023-06-29 13:20:51",
      //     updateDate: "2023-08-07 21:01:11",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 8539270862,
      //     suffix: "xml",
      //     isFavorite: false,
      //   },
      //   {
      //     id: "64df8ec82afa1c5c936a32b5",
      //     isFolder: false,
      //     name: "navicat16激活工具和安装包.zip",
      //     md5: "100555511/navicat16激活工具和安装包.zip",
      //     size: 100555511,
      //     contentType: "application/zip",
      //     uploadDate: "2023-08-18 23:31:19",
      //     updateDate: "2023-08-18 23:31:19",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 7579863234,
      //     suffix: "zip",
      //     isFavorite: false,
      //   },
      //   {
      //     id: "65479814b64e2f23d392d295",
      //     isFolder: false,
      //     name: "NavicatCracker v16.0.7.0 .exe",
      //     md5: "5270528/NavicatCracker v16.0.7.0 .exe",
      //     size: 5270528,
      //     contentType: "application/x-ms-dos-executable;charset=utf-8",
      //     uploadDate: "2023-11-05 21:26:44",
      //     updateDate: "2023-11-05 21:26:44",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 761738158,
      //     suffix: "exe",
      //     isFavorite: false,
      //   },
      //   {
      //     id: "64b8f24a2afa1c5c9360d79a",
      //     isFolder: false,
      //     name: "QQ图片20210420101820.jpg.webp",
      //     md5: "50706/QQ图片20210420101820.jpg.webp",
      //     size: 50706,
      //     contentType: "image/webp",
      //     uploadDate: "2023-07-20 16:37:30",
      //     updateDate: "2023-07-20 16:37:30",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 10110291945,
      //     suffix: "webp",
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: false,
      //     shareBase: true,
      //     expiresAt: 9223372036854775807,
      //     w: "976",
      //     h: "615",
      //   },
      //   {
      //     id: "648ba843a20e6ab7b23f6b61",
      //     isFolder: false,
      //     name: "Redis-x64-3.2.100.msi",
      //     md5: "6082560/Redis-x64-3.2.100.msi",
      //     size: 6082560,
      //     contentType: "application/x-msi",
      //     uploadDate: "2023-06-16 08:09:39",
      //     updateDate: "2023-06-16 08:09:39",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 13078362487,
      //     suffix: "msi",
      //     isFavorite: false,
      //   },
      //   {
      //     id: "65127b972afa1c5c93766828",
      //     isFolder: false,
      //     name: "Snipaste_2023-09-24_20-54-38.jpg",
      //     md5: "72659/Snipaste_2023-09-24_20-54-38.jpg",
      //     size: 72659,
      //     contentType: "image/jpeg",
      //     uploadDate: "2023-09-26 14:35:03",
      //     updateDate: "2023-09-26 14:35:03",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 4242439151,
      //     suffix: "jpg",
      //     isFavorite: false,
      //     isShare: true,
      //     isPrivacy: true,
      //     shareBase: true,
      //     expiresAt: 9223372036854775807,
      //     w: "880",
      //     h: "878",
      //   },
      //   {
      //     id: "652538c0b64e2f23d38ac436",
      //     isFolder: false,
      //     name: "Snipaste_2023-09-24_20-54-38.jpg.webp",
      //     md5: "25716/Snipaste_2023-09-24_20-54-38.jpg.webp",
      //     size: 25716,
      //     contentType: "image/webp",
      //     uploadDate: "2023-10-10 19:42:56",
      //     updateDate: "2023-10-10 19:42:56",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 3014365914,
      //     suffix: "webp",
      //     isFavorite: false,
      //     w: "880",
      //     h: "878",
      //   },
      //   {
      //     id: "65152c1003fe8b6557cd3241",
      //     isFolder: false,
      //     name: "TECH.docx",
      //     md5: "2074992/TECH.docx",
      //     size: 2074992,
      //     contentType:
      //       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      //     uploadDate: "2023-09-28 15:32:32",
      //     updateDate: "2023-10-18 11:46:38",
      //     userId: "640e8e3339c92d5dc41ccb5d",
      //     path: "/",
      //     agoTime: 2351743528,
      //     suffix: "docx",
      //     isFavorite: false,
      //   },
      // ],
      fileList:[],
      num: 0,
      //是否已经拿取了文件列表数据
      getFileListed: false,
      pageLoadCompleteList: [],
      pagination: {
        pageIndex: 1,
        pageSize: 50,
        total: 0,
        pageSizes: [10, 20, 30, 40, 50],
      },
      showUpdateDateItem: true, // 列表模式下是否显示修改时间
      showSizeItem: true, // 列表模式下是否显示文件大小
    };
  },
  computed: {
    gridFilename() {
      // 优化文件名，如果文件名过长，则进行截取
      return function (item) {
        let filename = item.dlName;

        // 如果是文件夹，直接返回文件夹名
        if (item.isFolder) {
          return filename;
        }

        // 分离文件名和后缀
        let parts = filename.split(".");
        let suffix = parts.length > 1 ? parts.pop() : "";
        let base = parts.join(".");

        // 获取文件名的有效长度
        let effectiveLength = this.getEffectiveLength(base, suffix);

        // 如果有效长度小于或等于14，则直接返回文件名
        if (effectiveLength <= 14) {
          return filename;
        }

        // 根据是否有后缀来确定需要截取的长度
        let sliceLength = 14 - (suffix ? suffix.length + 1 + 1 : 0); // 加1是为了“…”

        let prev = "";
        let currentLength = 0;

        // 截取字符串，确保不会在中文字符中间断开
        for (let char of Array.from(base)) {
          let charLength = this.getCharLength(char);

          if (currentLength + charLength > sliceLength) {
            break;
          }

          currentLength += charLength;
          prev += char;
        }

        // 根据是否有后缀返回相应的格式
        if (suffix) {
          return prev + "…" + suffix;
        }

        return prev + "…";
      };
    },
  },
  mounted() {
    // 加载url上的path
    if (this.$route.query.path !== "/") {
      const path = decodeURI(this.$route.query.path);
      this.pathList.splice(1, 1);
      path.split("/").forEach((pathName, index) => {
        if (index > 0) {
          const item = {};
          item["folder"] = pathName;
          this.pathList.push(item);
        }
      });
    }

    //给pl-table填充数据
    setTimeout(() => {
      if (!this.getFileListed) {
        this.getFileList({ isFirst: true });
      }
    }, 50);
  },

  methods: {
    // 选取输入框部分内容
    renameInputFocus(doc, suffix) {
      console.log(doc,suffix,'重命名')
      this.setInputFocus();
      doc.focus();
      doc.selectionStart = 0;
      doc.selectionEnd = doc.value.length;
      if (suffix) {
        doc.selectionEnd -= suffix.length + 1;
      }
    },
    // 重命名
    rowRename(newFileName, row) {
      //去掉回车换行
      newFileName = newFileName.replace(/[\r\n]/g, "");
      if (newFileName) {
        if (/[\[\]\/\\"<>\?\*]/gi.test(newFileName)) {
          this.$message({
            message: "文件名不能包含以下字符:<,>,|,*,?,,/,[,]",
            type: "warning"
          });
          return;
        }
        let strFileName = newFileName.replace(/(.*\/)*([^.]+).*/gi, "$2");
        let newExt = newFileName.replace(/.+\./, "");
        if (!row.isFolder) {
          if (row.suffix !== newExt) {
            this.$confirm(
              `您确定要将扩展名“.${row.suffix}”更改为“.${newExt}”吗？`,
              "提示",
              {
                type: "warning",
                showClose: false,
                closeOnClickModal: false,
                confirmButtonText: `保持.${row.suffix}`,
                cancelButtonText: `使用.${newExt}`
              }
            )
              .then(() => {
                newFileName = strFileName + "." + row.suffix;
              })
              .catch(() => {})
              .then(() => {
                this.rename(row, newFileName);
              });
          } else {
            this.rename(row, newFileName);
          }
        } else {
          this.rename(row, newFileName);
        }
      } else {
        this.editingIndex = -1;
      }
    },
    rename(row, newFileName) {
      if (row.name === newFileName) {
        this.editingIndex = -1;
        return;
      }
      this.renameLoading = true;
      const findIndex = this.fileList.findIndex(item => {
        if (newFileName === item.name) {
          return item;
        }
      });
      if (findIndex > -1) {
        let msg = "该文件已存在";
        if (row.isFolder) {
          msg = "该文件夹已存在";
        }
        this.$message({
          message: msg,
          type: "warning"
        });
        this.renameLoading = false;
        return;
      }
      this.editingIndex = -1;
      // api
      //   .rename({
      //     newFileName: encodeURI(newFileName),
      //     username: this.$store.state.user.name,
      //     folder: this.$route.query.folder,
      //     id: row.id
      //   })
      //   .then(res => {
      //     this.renameLoading = false;
      //     row.name = newFileName;
      //     row.suffix = newFileName.replace(/.+\./, "");
      //     this.fileList[row.index] = row;
      //     this.editingIndex = -1;
      //   })
      //   .then(() => {
      //     this.$refs.fileListTable.clearSelection();
      //     this.setOnCreateFilename(newFileName)
      //   })
      //   .catch(() => {
      //     this.renameLoading = false;
      //     this.editingIndex = -1;
      //   });
    },
    //打开文件夹
    openDir(row, onLoad) {
      this.beforeLoadData(onLoad);
      // api
      //   .searchFileAndOpenDir({
      //     userId: this.$store.state.user.userId,
      //     username: this.$store.getters.name,
      //     id: row.mountFileId || row.id,
      //     currentDirectory: encodeURI(this.$route.query.path),
      //     pageIndex: this.pagination.pageIndex,
      //     pageSize: this.pagination.pageSize,
      //     folder: this.$route.query.folder
      //   })
      //   .then(res => {
      //     this.loadData(res, onLoad);
      //   });
      this.path = row.path + row.name;
      this.path = this.path.replace(/\\/g, "/");
    },
    // 点击文件或文件夹
    fileClick(row) {
      if (this.editingIndex === row.index) {
        return;
      }
      this.openingFile = row;
      if (row.isFolder) {
        this.editingIndex = -1;
        // 打开文件夹
        if (this.listModeSearch) {
          const item = {};
          item["folder"] = row.name;
          item["search"] = true;
          item["row"] = row;
          this.pathList.push(item);
          this.pagination.pageIndex = 1;
          this.$router.push(`?vmode=${this.vmode}&search-file=${row.id}`);
          this.searchFileAndOpenDir(row);
        } else {
          if (this.path) {
            this.path += "/" + row.name;
          } else {
            this.path = "/" + row.name;
          }
          const item = { folder: row.name, shareBase: row.shareBase };
          this.pathList.push(item);
          this.pagination.pageIndex = 1;
          const path = encodeURI(this.path);
          if (this.$store.getters.userId !== row.userId) {
              row.mountFileId = row.id
          }
          if (row.mountFileId) {
            localStorage.setItem(this.path, row.mountFileId)
          }
          this.$router.push(`?vmode=${this.vmode}&path=${path}${row.mountFileId ? '&folder='+row.mountFileId : ''}`);
          this.openDir(row);
        }
      } else {
        console.log(this.selectFile)
        // if (this.selectFile) {
        //   let selectFile = row;
        //   const selectData = this.$refs.fileListTable.tableSelectData;
        //   if (selectData.length < 1 || selectData[0].id !== row.id) {
        //     this.$refs.fileListTable.clearSelection();
        //     this.$refs.fileListTable.toggleRowSelection([{ row: row }]);
        //     this.pinSelect(null, row);
        //   } else {
        //     this.$refs.fileListTable.clearSelection();
        //     selectFile = {};
        //   }
        //   this.$emit("selectedFile", selectFile);
        //   return;
        }
        if (row.contentType.startsWith("image")) {
          console.log("image")
          // 图片
          this.imagePreviewVisible = true;
          this.imagePreviewRow = row;
          return;
        }
        if (suffix.simText.includes(row.suffix)) {
          // 文本文件
          this.textPreviewRow = row;
          this.textPreviewVisible = true;
          return;
        }
        if (row.contentType.indexOf("video") > -1) {
          // 视频文件
          this.videoPreviewVisible = true;
          this.videoPreviewRow = row;
          return;
        }
        if (row.contentType.indexOf("audio") > -1) {
          // 音频文件
          Bus.$emit("onAddAudio", row, this.audioCoverUrl);
          return;
        }
        if (suffix.compressedFile.includes(row.suffix)) {
          // 压缩文件
          this.openCompressionVisible = true;
          return;
        }
        if (
          row.contentType.indexOf("office") > -1 ||
          ["pdf", "csv", "drawio", "mind"].includes(row.suffix)
        ) {
          // office文件
          this.officePreviewVisible = true;
          this.officePreviewRow = row;
          return;
        }
        if (row.contentType.indexOf("utf-8") > -1) {
          // 文本文件
          this.textPreviewRow = row;
          this.textPreviewVisible = true;
          return;
        }
        this.notPreviewDialogVisible = true;
    },
    // 列表右键菜单操作
    menusOperations(operation) {
      switch (operation) {
        case "share":
          // 分享
          this.share();
          break;
        case "favorite":
          // 收藏
          this.favoriteOperating(true);
          break;
        case "edit":
          // 编辑
          window.open(
            `/setting/website/manager-articles?operation=editor&id=${
              this.rowContextData.id
            }`,
            "_blank"
          );
          break;
        case "open":
          // 打开
          this.fileClick(this.rowContextData);
          break;
        case "deselect":
          // 取消选定
          this.$refs.fileListTable.clearSelection();
          break;
        case "unFavorite":
          // 取消收藏
          this.favoriteOperating(false);
          break;
        case "details":
          this.drawer = true;
          break;
        case "rename":
          // 重命名
          this.renameFileName = this.rowContextData.name;
          this.editingIndex = this.rowContextData.index;
          console.log(this.editingIndex)
          break;
        case "duplicate":
          // 创建副本
          this.duplicate();
          break;
        case "copy":
          // 移动或复制
          this.moveOrCopy();
          break;
        case "download":
          // 下载
          this.downloadFile();
          break;
        case "copyDownloadLink":
          // 复制下载链接
          this.copyDownloadLink(this.rowContextData)
          break;
        case "remove":
          // 删除
          this.deleteFile();
          break;
      }
      this.$refs.contextShow.hideMenu();
    },
    //点解单个grid
    gridItemClick(row) {
      if (this.selectFile) {
        this.fileClick(row);
      }
      if (this.isCmd) {
        this.pinSelect(null, row);
        this.$refs.fileListTable.toggleRowSelection([{ row: row }]);
        return;
      }
      // this.pinSelect(null, row);
    },
    // 是否高亮收藏图标
    highlightFavorite(isFavorite, isHover) {
      const item_menu = this.menus.find(item => {
        if (item.operation === "favorite" || item.operation === "unFavorite") {
          return item;
        }
      });
      if (item_menu) {
        if (isFavorite) {
          item_menu.label = "取消收藏";
          item_menu.iconClass = "menu-unfavorite-hover";
          item_menu.operation = "unFavorite";
        } else {
          if (isHover) {
            item_menu.iconClass = "menu-favorite-hover";
          } else {
            item_menu.iconClass = "menu-favorite";
          }
          item_menu.label = "收藏";
          item_menu.operation = "favorite";
        }
        // this.$set(this.menus, 0, item_menu)
      }
    },
    // 选择某行预备数据#e0f3fc !important;
    preliminaryRowData(row) {
      if (row) {
        // this.$refs.fileListTable.tableSelectData[0] = row
        this.rowContextData = row;
      }
      const isFavorite = this.rowContextData.isFavorite;
      this.highlightFavorite(this.isCollectView ? true : isFavorite, false);
    },
    //右键菜单
    setMenus(row) {
      console.log(this.singleMenus,'右键菜单')
      this.menus = JSON.parse(JSON.stringify(this.singleMenus));
      console.log(this.menus,'右键菜单')
      console.log(this.$route.query.folder,'文件夹')
      // 挂载的文件
      // if (this.$route.query.folder) {
      //   // 根据权限设置菜单
      //   this.setMenusByPermission(row);
      // } else {
      //   if (row.suffix && row.suffix === "md") {
      //     this.menus.splice(2, 0, { iconClass: "menu-edit1", label: "编辑", operation: "edit" })
      //   }
      //   if (row.isFolder && row.mountFileId) {
      //     const indicesToDelete = [6, 5, 4, 3, 1];
      //     for(let i of indicesToDelete) {
      //       this.menus.splice(i, 1);
      //     }
      //   }
      //   if (!row.isFolder) {
      //     this.menus.splice(-2, 0, { iconClass: "duplicate", label: "创建副本", operation: "duplicate" })
      //   }
      //   if ((row.isShare && !row.shareBase) || row.ossFolder) {
      //     // 删除分享选项
      //     let index = this.menus.findIndex(item => item.operation === "share")
      //     if (index > -1) {
      //       this.menus.splice(index, 1)
      //     }
      //   }
      //   if (row.isShare && !row.isPrivacy) {
      //     // 添加复制下载链接选项
      //     this.menus.splice(-2, 0, { iconClass: "menu-fuzhi", label: "复制下载链接", operation: "copyDownloadLink" })
      //   }
      // }
      this.preliminaryRowData(row);
    },
    //根据权限设置菜单
    setMenusByPermission(file) {
      console.log(file,'setMenusByPermission')
      // const indicesToDelete = [7, 5, 4, 3, 2, 1];
      // for(let i of indicesToDelete) {
      //   this.menus.splice(i, 1);
      // }
      if (file.operationPermissionList && file.operationPermissionList.length > 0) {
        if (file.operationPermissionList.indexOf('PUT') > -1) {
          this.menus.splice(this.menus.length - 1, 0, { iconClass: "menu-rename", label: "重命名", operation: "rename" })
        }
        if (file.operationPermissionList.indexOf('UPLOAD') > -1 && !file.isFolder) {
          this.menus.splice(this.menus.length - 1, 0, { iconClass: "duplicate", label: "创建副本", operation: "duplicate" })
        }
        if (file.operationPermissionList.indexOf('DELETE') > -1) {
          this.menus.splice(this.menus.length, 0, { iconClass: "menu-remove", label: "删除", operation: "remove" })
        }
      }
    },
    // 鼠标右击单个grid
    rowContextmenu(row) {
      if (this.selectFile) {
        return;
      }
      if (
        this.$refs.fileListTable.tableSelectData.length > 1 &&
        this.$refs.fileListTable.tableSelectData.findIndex(
          item => item.index === row.index
        ) > -1
      ) {
        this.menusIsMultiple = true;
        this.menus = this.multipleRightMenus;
        this.highlightFavorite(this.isCollectView, false);
      } else {
        this.$refs.fileListTable.clearSelection();
        this.$refs.fileListTable.toggleRowSelection([{ row: row }]);
        this.menusIsMultiple = false;
        this.setMenus(row)
      }
      event.preventDefault();
      this.menuTriangle = "";
      const e = {};
      e.pageX = event.pageX + 5;
      e.pageY = event.pageY + 2;
      e.clientX = event.clientX + 5;
      e.clientY = event.clientY + 2;
      this.$refs.contextShow.showMenu(e);
      this.cellMouseIndex = -1;
    },
    formatSize(size) {
      if (size === 0) {
        return "";
      } else if (size < 1024) {
        return size + "B";
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(1) + "k";
      } else if (size < 1024 * 1024 * 1024) {
        return (size / (1024 * 1024)).toFixed(1) + "M";
      } else {
        return (size / (1024 * 1024 * 1024)).toFixed(1) + "G";
      }
    },
    // 判断给定的字符是否是中文
    isChineseChar(char) {
      return char.charCodeAt(0) > 255;
    },
    // 获取字符的长度。中文字符长度为2，其他字符长度为1
    getCharLength(char) {
      return this.isChineseChar(char) ? 2 : 1;
    },
    // 获取有效长度。如果有后缀，则包括后缀和点的长度；否则是基础名称和后7位的长度
    getEffectiveLength(base, suffix) {
      let chineseLength = Array.from(base).reduce(
        (count, char) => count + this.getCharLength(char),
        0
      );

      return suffix ? chineseLength + suffix.length + 1 : chineseLength;
    },
    hideNewFolderName() {
      console.log("Hide");
      this.showNewFolder = false;
      this.isShowNewFolder = false;
    },
    showNewFolderClick() {
      this.isShowNewFolder = true;
    },
    setInputFocus() {
      this.inputting = true;
    },
    setInputBlur() {
      this.inputting = false;
    },
    // 新建文件夹
    // newFolderNameClick() {
    //   if (this.newFolderName) {
    //     if (/[\[\]\/\\"<>\?\*]/gi.test(this.newFolderName)) {
    //       this.$message({
    //         message: "文件名不能包含以下字符:<,>,|,*,?,,/,[,]",
    //         type: "warning"
    //       });
    //       return;
    //     }
    //     this.newFolderLoading = true;
    //     this.createFileLoading = true;
    //     api
    //       .uploadFolder({
    //         isFolder: true,
    //         filename: encodeURI(this.newFolderName),
    //         currentDirectory: encodeURI(this.path),
    //         folder: this.$route.query.folder,
    //         username: this.$store.state.user.name,
    //         userId: this.$store.state.user.userId
    //       })
    //       .then(res => {
    //         if (res.data === 1) {
    //           this.newFolderLoading = false;
    //           this.$message({
    //             message: "该文件夹已存在",
    //             type: "warning"
    //           });
    //         } else {
    //           this.createFileLoading = false;
    //           this.newCreateFileDialog = false;
    //           this.newFolderLoading = false;
    //           this.showNewFolder = false;
    //           this.isShowNewFolder = false;
    //           this.$notify({
    //             title: "新建文件夹成功",
    //             type: "success",
    //             duration: 1000
    //           });
    //           if (this.listModeSearch) {
    //             this.getFileListBySearchMode();
    //           } else {
    //             this.getFileList();
    //           }
    //         }
    //       })
    //       .catch(() => {
    //         this.newFolderLoading = false;
    //         this.createFileLoading = false;
    //       });
    //   } else {
    //     this.newFolderLoading = false;
    //     this.$message({
    //       message: "请输入文件夹名称",
    //       type: "warning"
    //     });
    //   }
    // },
    // 格式化最近时间
    formatTime(time) {
      return formatTime(time);
    },
    // 格式化文件大小
    formatSize(size) {
      return formatSize(size);
    },
    //上传文件
    upload() {
      // 打开文件选择框
      console.log(this.$route.query.folder)
      console.log(this.path)
      console.log(this.$store.state.user.name)
      console.log(this.$store.state.user.userId)
      Bus.$emit("openUploader", {
        // 传入的参数
        folder: this.$route.query.folder,
        currentDirectory: this.path,
        username: this.$store.state.user.name,
        userId: this.$store.state.user.userId,
      });
    },
    //上传文件夹
    uploadFolder() {
      if (window.uploader.supportDirectory) {
        // 打开文件夹选择框
        Bus.$emit("uploadFolder", {
          // 传入的参数
          folder: this.$route.query.folder,
          currentDirectory: this.path,
          username: this.$store.state.user.name,
          userId: this.$store.state.user.userId
        });
      } else {
        //有可能会报错
        this.$message({
          message: "该浏览器不支持上传文件夹",
          type: "warning"
        });
      }
    },
    // 收集选中的index值作为数组 传递给rowRed判断变换样式
    // handleSelectionChange(rows) {
    //   // 起点
    //   if (rows.length > 0) {
    //     if (!this.selectPin) {
    //       this.selectOrgin = rows[0].index;
    //     }
    //     if (this.selectPin) {
    //       return;
    //     }
    //     this.rowContextData = rows[0];
    //   }
    //   this.$refs.fileListTable.tableSelectData = rows;
    //   this.selectRowData = rows;
    //   this.changeSelectedStyle(rows);
    // },
    // changeSelectedStyle(rows) {
    //   if (this.stopSortChange) {
    //     return;
    //   }
    //   let selectTotalSize = 0;
    //   rows.forEach((item) => {
    //     selectTotalSize += item.size;
    //   });
    //   const item_name = this.tableHead[2];
    //   const item_more = this.tableHead[4];
    //   const item_size = this.tableHead[5];
    //   const item_date = this.tableHead[6];
    //   if (rows.length > 0) {
    //     const sumFileAndFolder = this.getShowSumFileAndFolder(rows);
    //     const sizeSum = this.getShowSumSize(selectTotalSize);
    //     item_name.label = sumFileAndFolder;
    //     item_name.sortable = false;
    //     item_more.name = "more";
    //     item_size.label = sizeSum;
    //     item_size.sortable = false;
    //     item_date.label = "";
    //     item_date.sortable = false;
    //   } else {
    //     item_name.label = "名称";
    //     item_name.sortable = true;
    //     item_more.name = "";
    //     item_size.label = "大小";
    //     item_size.sortable = true;
    //     item_date.label = "修改日期";
    //     item_date.sortable = true;
    //   }
    //   if (this.selectRowData.length === this.fileList.length) {
    //     this.allChecked = true;
    //   } else {
    //     this.allChecked = false;
    //   }
    // },
    // 切换布局
    changeVmode() {
      this.grid = !this.grid;
      this.vmode = "list";
      if (this.grid) {
        this.vmode = "grid";
        this.lessClientHeight = 106;
      } else {
        this.lessClientHeight = 140;
        this.$refs.fileListTable.setHeight();
      }
      this.clientHeight =
        document.documentElement.clientHeight - this.lessClientHeight;
      if (!this.path) {
        this.path = "";
      }
      this.editingIndex = -1;
      this.$router.push(
        `?vmode=${this.vmode}&path=${this.path}${
          this.$route.query.folder ? "&folder=" + this.$route.query.folder : ""
        }`
      );
      // 改变拖拽目标
      // this.rowDrop();
      // 画矩形选取
      // this.darwRectangle();
      // this.loadContextMenus();
      // 使列表滑到顶部
      if (!this.grid) {
        if (this.fileListScrollTop > 0) {
          this.$refs.fileListTable.pagingScrollTopLeft();
        }
      }
      this.fileListScrollTop = 0;
    },
    
    // 全局右键菜单操作 排序处理
    contextmenuClick(operation) {
      switch (operation) {
        case "vmode-list":
          this.grid = true;
          this.changeVmode();
          break;
        case "vmode-grid":
          this.grid = false;
          this.changeVmode();
          break;
        case "orderName":
          this.sortChangeOfMenu("name", 2);
          break;
        case "orderSize":
          this.sortChangeOfMenu("size", 5);
          break;
        case "orderUpdateDate":
          this.sortChangeOfMenu("updateDate", 6);
          break;
        case "refresh":
          this.getFileList();
          break;
        case "createTextFile":
          this.newCreateFileDialogTitle = "新建文本文件";
          this.createNewFile("txt");
          break;
        case "createFolder":
          this.newCreateFileDialogTitle = "新建文件夹";
          this.createNewFile("");
          break;
        case "createDrawioFile":
          this.newCreateFileDialogTitle = "新建流程图";
          this.createNewFile("drawio");
          break;
        case "createMinderFile":
          this.newCreateFileDialogTitle = "新建思维导图";
          this.createNewFile("mind");
          break;
        case "createWordFile":
          this.newCreateFileDialogTitle = "新建Word文档";
          this.createNewFile("docx");
          break;
        case "createExcelFile":
          this.newCreateFileDialogTitle = "新建Excel工作表";
          this.createNewFile("xlsx");
          break;
        case "createPPTFile":
          this.newCreateFileDialogTitle = "新建PPT演示文档";
          this.createNewFile("pptx");
          break;
        case "createMarkdownFile":
          this.newDocument();
          break;
      }
    },

    //排序后菜单的变化？
    sortChangeOfMenu(prop, headerIndex) {
      let tableHeader = document.querySelector(".el-table__header thead tr");
      console.log(tableHeader.childNodes)
      // 去掉table-header上所有排序高亮
      tableHeader.childNodes.forEach(el => {
        if (el.className.indexOf("is-sortable") > -1) {
          this.removeClass(el, "descending");
          this.removeClass(el, "ascending");
        }
      });
      // 重新加上排序高亮
      let order =
        this.sortable.order === "ascending" ? "descending" : "ascending";
      this.addClass(tableHeader.children[headerIndex], order);
      this.orderCustom = true;
      this.sortChange({ prop: prop, order: order });
    },

    sortChange(column) {
      console.log(column)
      console.log(this.listModeSearch)
      let { prop, order } = column;
      if (this.orderCustom || this.listModeSearch) {
        this.sortable.prop = prop;
        this.sortable.order = order;
        this.pagination.pageIndex = 1;
        if (this.listModeSearch) {
          this.searchFile(this.searchFileName);
        } else {
          this.getFileList();
        }
      }
    },

    removeClass(el, className) {
      const str = el.className;
      if (str.indexOf(className) > -1) {
        el.className = str.replace(className, "");
      }
    },
    addClass(el, className) {
      if (el) {
        const str = el.className;
        el.className = el.className + " " + className;
      }
    },

    // 请求之前的准备
    beforeLoadData(onLoad) {
      if (onLoad) {
        this.pagination.pageIndex++;
      } else {
        this.pagination.pageIndex = 1;
      }
      this.pageLoadCompleteList[this.pagination.pageIndex] = false;
      this.tableLoading = true;
      this.finished = false;
    },

    // 填充pl-table数据
    loadData(res, onLoad) {
      // if (!this.$refs.fileListTable) {
      //   return;
      // }
      if (onLoad) {
        res.data.forEach((file, number) => {
          file["index"] =
            (this.pagination.pageIndex - 1) * this.pagination.pageSize + number;
          this.fileList.push(file);
        });
      } else {
        // this.fileList = res.data;
        this.fileList = res.data.records;
        this.fileList.map((item, index) => {
          item.index = index;
          item.contentType = "image";
        });
        console.log(this.fileList,'数据在这里');
        // this.$refs.fileListTable.reloadData(this.fileList);
        // setTimeout(() => {
        //   this.$refs.fileListTable.reloadData(this.fileList);
        // }, 0);
      }
      // 数据全部加载完成
      // if (this.fileList.length >= res.count) {
      //   this.finished = true;
      // }
      // this.tableLoading = false;
      // this.clientHeight =
      //   document.documentElement.clientHeight - this.lessClientHeight;
      // this.listModeSearch = false;
      // this.pagination["total"] = res.count;
      // this.$nextTick(() => {
      //   this.containerResize();
      //   this.tableLoading = false;
      //   this.pageLoadCompleteList[this.pagination.pageIndex] = true;
      // });
      // // 加载菜单状态
      // this.loadContextMenus()
      // // 高亮新增的文件
      // this.highlightNewFile()
      // // 设置挂载文件的用户名(文件的所有者)
      // this.setMountFileOwner()
    },
    //获取文件数据列表
    async getFileList(params,onLoad) {
      const responseData = await getDataSetList(params)//调用api获取数据
      console.log("responseData dataMrg++++++: ", responseData)
      // this.getFileListed = true;
      // this.beforeLoadData(onLoad);
      // fileApi
      //   .getfileList({
      //     // userId: this.$store.state.user.userId,
      //     // username: this.$store.state.user.name,
      //     // currentDirectory: encodeURI(this.$route.query.path),
      //     // folder: this.$route.query.folder,
      //     // queryFileType: this.queryFileType,
      //     // sortableProp: this.sortable.prop,
      //     // order: this.sortable.order,
      //     // isFolder: this.queryCondition.isFolder,
      //     // isFavorite: this.queryCondition.isFavorite,
      //     // queryCondition: this.queryCondition,
      //     // pageIndex: this.pagination.pageIndex,
      //     // pageSize: this.pagination.pageSize
      //     filePath: ''
      //   })
      //   .then(res => {
      //     console.log(res.data,'result'); 
      //     this.loadData(res.data, onLoad);
      //   });
      this.loadData(responseData, onLoad);
    },
    // cell-style 通过返回值可以实现样式变换利用传递过来的数组index循环改变样式
    rowStyle({ row, column, rowIndex, columnIndex }) {
      if (
        this.$refs.fileListTable.tableSelectData.findIndex(
          (item) => item.index === rowIndex
        ) > -1
      ) {
        if (columnIndex === 0) {
          return {
            backgroundColor: "#e0f3fc !important",
            borderRadius: "3px 0 0 3px",
            borderLeft: "1px solid #409eff",
            borderTop: "1px solid #409eff",
            borderBottom: "1px solid #409eff",
          };
        }
        if (columnIndex === 5) {
          return {
            backgroundColor: "#e0f3fc !important",
            borderRadius: "0 3px 3px 0",
            borderRight: "1px solid #409eff",
            borderTop: "1px solid #409eff",
            borderBottom: "1px solid #409eff",
          };
        }
        return {
          backgroundColor: "#e0f3fc !important",
          borderTop: "1px solid #409eff",
          borderBottom: "1px solid #409eff",
        };
      }
    },
    //搜索文件
    searchFile(key, onLoad) {
      if (key) {
        this.beforeLoadData(onLoad);
        this.pathList = [{ folder: "" }];
        const item1 = {};
        item1["folder"] = "搜索: " + '"' + key + '"';
        item1["search"] = true;
        item1["searchKey"] = key;
        this.pathList.push(item1);
        this.$router.push(`?vmode=${this.vmode}&search-file=${key}`);
        // api
        //   .searchFile({
        //     userId: this.$store.state.user.userId,
        //     username: this.$store.state.user.name,
        //     keyword: key,
        //     sortableProp: this.sortable.prop,
        //     order: this.sortable.order,
        //     currentDirectory: encodeURI(this.$route.query.path),
        //     pageIndex: this.pagination.pageIndex,
        //     pageSize: this.pagination.pageSize
        //   })
        //   .then(res => {
        //     this.loadData(res, onLoad);
        //     this.path = "";
        //     this.listModeSearch = true;
        //     this.listModeSearchOpenDir = false;
        //   });
      }
    },
  },
}
</script>

<style lang="scss" scoped>
@import "./styles/index.scss";
@import "./styles/home-index.scss";
/*overflow: hidden;*/
/*white-space: nowrap;*/
/*text-overflow: ellipsis;*/

.menuitem {
  margin-bottom: 0;
}

::v-deep .el-input--small .el-input__inner {
  height: 40px;
  line-height: 40px;
}

.dashboard-container {
  // min-width: 498px;
  position: relative;
  margin: 0;
  height: 100%;
}
::v-deep .grid-item-icon>span>svg{
  width: 5em;
  height: 5em;
}
::v-deep .grid-item-icon .image-slot svg{
  width: 5em;
  height: 5em;
}
//上面都是自己加的样式

::v-deep .app-wrapper {
  overflow-y: hidden;
}

::v-deep :focus {
  outline: 0;
}

::v-deep .el-drawer__header {
  color: #000000;

  span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.details-form {
  margin: 20px 10px 0 20px;

  ::v-deep .el-form-item__content {
    white-space: normal;
    word-break: break-all;
    word-wrap: break-word;
  }

  ::v-deep .el-form-item {
    margin-bottom: 0;
  }

  ::v-deep .details-position {
    margin: 10px 0;

    .el-form-item__content {
      line-height: 20px;
    }

    .el-form-item__label {
      line-height: 20px;
    }
  }

  a:hover {
    color: #409eff;
  }
}

.drawer-icon {
  text-align: center;
  position: relative;
  ::v-deep .icon-favorite {
    display: none;
  }
  ::v-deep .icon-share {
    display: none;
  }
}

.drawer-icon-font ::v-deep .svg-icon {
  font-size: 8rem;
}

.list-item {
  height: 50px;
}

.table-file-name:hover {
  cursor: default;
}

::v-deep .plTableBox .el-table .el-table__header {
  th {
    background-color: #ffffff;
  }

  .is-sortable:hover {
    background-color: #e0f3fc;
  }
}

::v-deep table {
  border-collapse: separate;
  border-spacing: 0 1px;
}

::v-deep .el-table td {
  padding: 0;
  height: 50px !important;
  border: 0;
}

.home-link:hover {
  color: #409eff;
}

.info-statistics {
  // padding: 5px 15px;
  // width: 30%;
  display: flex;
  justify-content: flex-end;

  span {
    font-size: 12px;
    line-height: 16px;
    color: #666;
  }
}

#v-draw-rectangle {
  width: 100%;
  height: calc(100% - 16px);
  overflow: auto;
  .grid-file {
    display: grid;
    /* 设置间距 */
    grid-gap: 18px;
    grid-template-columns: repeat(auto-fit, minmax(124px, 1fr));
    & > div:hover {
      border-radius: 6px;
      background: #ffffff;
    }
  }
}

.gridItem{
  position: relative;
  display: flex;
  flex-direction: column;
}
.grid-item-icon {
  text-align: center;
  margin-bottom: 12px;
}
.filename-style {
  text-align: center;
  width: 100%;
  white-space: nowrap;         /* 防止文本换行 */
  overflow: hidden;            /* 隐藏溢出部分 */
  text-overflow: ellipsis;      /* 显示省略号 */
}

::v-deep .el-input-tree {
  width: 50% !important;
}

::v-deep .el-input-tree-button {
  margin-left: 5px !important;
}

::v-deep .open-file-dialog {
  .el-dialog {
    width: 420px;
  }

  .svg-icon {
    font-size: 20px;
  }

  .dialog-msg {
    margin-left: 10px;
  }
}

::v-deep .v-contextmenu-item {
  .svg-icon {
    font-size: 14px;
  }
}

::v-deep .new-text-file-dialog {
  height: 350px;
  top: calc(50% - 175px);

  .el-dialog {
    width: 420px;

    .el-dialog__header {
      padding: 15px 20px 15px;
    }

    .dialog-footer {
      .el-loading-spinner {
        margin-top: -13px;

        .circular {
          height: 26px;
          width: 26px;
        }
      }
    }
  }
}

::v-deep .van-grid-item__content {
  background-size: cover;
  background-position: center;
  padding: 0;
  border-radius: 5px !important;
}

.vmode {
  padding: 5px 10px;
  margin-left: -5px;
}

.number-files {
  position: absolute;
  top: -42px;
  left: 0;
  height: 40px;
  line-height: 40px;
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  background: #d2eefa66;
  border-radius: 5px;
  display: flex;

  .icon {
    padding: 5px;
    width: 40px;
  }

  span {
    font-weight: 500;
  }

  .number {
    padding: 0 15px 0 15px;
  }

  .target {
    .folder {
      background-color: #1d8cff;
      color: #ffffff;
      padding: 8px;
      border-radius: 2px;
      margin-right: 5px;
      font-weight: 600;
    }
  }
}

::v-deep .el-table--enable-row-hover {
  .el-table__body tr:hover > td {
    background-color: #e0f3fc;
  }
}

::v-deep .el-table::before {
  height: 0;
}

::v-deep .el-table {
  th.gutter {
    display: table-cell !important;
  }
}
</style>
