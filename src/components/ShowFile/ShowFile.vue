<template>
  <div class="dashboard-container"
      v-resize="containerResize"
      onselectstart="return false">
    <el-breadcrumb class="app-breadcrumb" separator="">
      <!-- <transition-group name="breadcrumb" v-if="showNavigation">
        <el-breadcrumb-item
          v-for="(item, index) in pathList"
          :key="item.folder + index"
        >
          <el-tooltip
            v-if="index === 0 && pathList.length > 1"
            class="item"
            effect="dark"
            content="返回上一级"
            placement="top"
          >
            <a @click.prevent="lastLink()">
              <svg-icon
                icon-class="back"
                style="font-size: 24px; margin-left: 20px"
              />&nbsp;</a
            >
          </el-tooltip>
          <el-tooltip
            v-if="index === 0 && pathList.length > 2"
            class="item"
            effect="dark"
            content="根目录"
            placement="top"
          >
            <a class="home-link" @click.prevent="handleLink(item, index)">
              <svg-icon icon-class="home" style="font-size: 24px" />
            </a>
          </el-tooltip>
          <breadcrumb-file-path
            :pathList="pathList"
            :item="item"
            :index="index"
            @clickLink="handleLink"
          ></breadcrumb-file-path>
        </el-breadcrumb-item>
      </transition-group> -->
      <div class="search-content">
        <div class="search-class">
          <el-popover
            v-show="showUploadButton"
            v-model="isShowNewFolder"
            placement="bottom"
            trigger="hover"
            @click="showNewFolderClick"
            @after-leave="hideNewFolderName"
          >
            <div class="newFileMenu" style="display: block">
              <ul>
                <li @click="upload">
                  <label class="menuitem">
                    <svg-icon icon-class="file-upload" />
                    <el-upload
                      class="upload-demo"
                      style="display: inline-block"
                      :data="{'id':currentId}"
                      multiple
                      :action="uploadApiUrl"
                      :on-success="uploadSuccess"
                      :on-error="xxxx"
                      :before-remove="beforeRemove">
                      <el-button size="small" type="text">点击上传</el-button>
                    </el-upload>
                    <!-- <span class="menuitem text">{{
                      singleFileType !== "" ? singleFileType : "上传文件"
                    }}</span> -->
                  </label>
                </li>
                <li v-if="singleFileType === ''" @click="uploadFolder">
                  <label class="menuitem">
                    <svg-icon icon-class="folder-upload" />
                    <span class="menuitem text">上传文件夹</span>
                  </label>
                </li>
                <li v-if="singleFileType === ''" @click.prevent="newFolder">
                    <a href="#" class="menuitem">
                      <svg-icon icon-class="folder-add" />
                      <span class="menuitem text">新建文件夹</span>
                    </a>
                  </li>
                  <div v-show="showNewFolder" class="folder-name-form">
                    <el-input
                      ref="newFolderName"
                      v-model="newFolderName"
                      placeholder="请输入文件夹名称"
                      :clearable="true"
                      @keyup.enter.native="newFolderNameClickEnter"
                      @focus="setInputFocus"
                      @blur="setInputBlur()"
                    >
                      <el-button
                        slot="append"
                        v-loading="newFolderLoading"
                        element-loading-spinner="el-icon-loading"
                        element-loading-background="#f6f7fa88"
                        class="el-icon-right"
                        @click="newFolderNameClick"
                      >
                      </el-button>
                    </el-input>
                  </div>
              </ul>
            </div>
            <el-button slot="reference" :name="''" type="primary" style="margin-right: 5px"><i class="el-icon-upload el-icon--right"></i></el-button>
            <!-- <button-upload
              slot="reference"
              :name="''"
              @click.native="upload"
              style="margin-right: 5px"
            ></button-upload> -->
          </el-popover>

          <el-input
            v-show="showSearchButton"
            placeholder="搜索"
            v-model="searchFileName"
            :clearable="true"
            @keyup.enter.native="searchFile(searchFileName)"
            @focus="setInputFocus"
            @blur="setInputBlur()"
          >
            <el-button slot="prepend" @click="searchFile(searchFileName)">
              <svg-icon icon-class="search" style="font-size: 22px" />
            </el-button>
          </el-input>

          <el-dropdown
            size="medium"
            style="height: 40px"
            @command="contextmenuClick"
          >
            <el-button type="text" class="sort">
              <svg-icon icon-class="sort" />
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="orderName">
                <span
                  :class="{
                    'al-file-sort-item': true,
                    active: sortable.prop === 'name',
                  }"
                >
                  <i
                    :class="{
                      'al-file-sort-item-icon': true,
                      'el-icon-top': sortable.order === 'ascending',
                      'el-icon-bottom': sortable.order === 'descending',
                    }"
                  ></i>
                  <span>名称</span>
                </span>
              </el-dropdown-item>
              <el-dropdown-item command="orderSize">
                <span
                  :class="{
                    'al-file-sort-item': true,
                    active: sortable.prop === 'size',
                  }"
                >
                  <i
                    :class="{
                      'al-file-sort-item-icon': true,
                      'el-icon-top': sortable.order === 'ascending',
                      'el-icon-bottom': sortable.order === 'descending',
                    }"
                  ></i>
                  <span>大小</span>
                </span>
              </el-dropdown-item>
              <el-dropdown-item command="orderUpdateDate">
                <span
                  :class="{
                    'al-file-sort-item': true,
                    active: sortable.prop === 'updateDate',
                  }"
                >
                  <i
                    :class="{
                      'al-file-sort-item-icon': true,
                      'el-icon-top': sortable.order === 'ascending',
                      'el-icon-bottom': sortable.order === 'descending',
                    }"
                  ></i>
                  <span>日期</span>
                </span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-button type="text" class="vmode" @click="changeVmode">
            <svg-icon :icon-class="grid ? 'file-list' : 'grid'" />
          </el-button>
          <el-tooltip
            v-if="pathIdList.length > 1"
            class="item vmode"
            effect="dark"
            content="返回上一级"
            placement="top"
          >
            <a @click.prevent="lastLink()">
              <svg-icon
                icon-class="back"
              />&nbsp;</a
            >
          </el-tooltip>
        </div>
      </div>
    </el-breadcrumb>
    <!--统计信息-->
    <div class="info-statistics">
      <span v-if="tableLoading">获取更多数据...</span>
      <span v-if="!tableLoading">{{
        !finished ? "已加载 " + getSummaries3 : "已全部加载 " + getSummaries3
      }}</span>
    </div>
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
        @row-contextmenu="rowContextmenu"
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
        ref="gridFile"
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
      <!-- <div
        v-show="grid"
        v-loading="tableLoading"
        element-loading-text="文件加载中"
        element-loading-spinner="el-icon-loading"
        element-loading-background="#f6f7fa88"
      >
        <van-checkbox-group
          v-model="selectRowData"
          @change="handleSelectionChange"
          ref="checkboxGroup"
        >
          <van-grid
            square
            :center="true"
            :column-num="gridColumnNum"
            :gutter="10"
            :border="false"
            :style="{
              width: '100%',
              'max-height': clientHeight - 25 + 'px',
              overflow: 'auto',
              'box-shadow':
                fileListScrollTop > 0
                  ? '#a5a7a8 0px 0px 3px'
                  : '#ffffff 0px 0px 0px',
            }"
          >
            <van-grid-item
              v-for="(item, index) in fileList"
              ref="gridItem"
              :key="item.id"
              :title="
                '大小：' +
                formatSize(item.size) +
                '\r\n' +
                (item.w && item.h
                  ? '分辨率：' + item.w + 'x' + item.h + '\r\n'
                  : '') +
                '名称：' +
                item.name +
                '\r\n' +
                '创建时间：' +
                item.uploadDate +
                '\r\n' +
                '修改时间：' +
                item.updateDate +
                '\r\n' +
                '路径：' +
                item.path
              "
              style="
                flex-basis: 14.2857%;
                padding-top: 14.2857%;
                position: relative;
              "
            >
              <div
                class="grid-item van-grid-item__content van-grid-item__content--center van-grid-item__content--square"
                @click="gridItemClick(item)"
                @dblclick="fileClick(item)"
                @contextmenu.prevent="rowContextmenu(item)"
              >
                <div
                  class="grid-hover-back grid-hover van-grid-item__content van-grid-item__content--center van-grid-item__content--square"
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
                    @focus="renameInputFocus($event.currentTarget, item.suffix)"
                    @blur="setInputBlur()"
                    @keyup.enter.prevent.native="
                      rowRename(renameFileName, item)
                    "
                  >
                  </el-input> -->
                  <!-- <div>
                    <div class="grid-item-text">
                      <span>{{ gridFilename(item) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </van-grid-item>
          </van-grid>
        </van-checkbox-group> -->
      <!-- </div> -->
      <!-- <table class="drag-table" id="drag-table"></table> -->
    </div>
    
    <!--为了不受右键区域的影响, 把弹窗之类的提取出来-->
    <sim-text-preview
      :file.sync="textPreviewRow"
      :status.sync="textPreviewVisible"
    ></sim-text-preview>
    <image-viewer
      :fileList="fileList"
      :file="imagePreviewRow"
      :status.sync="imagePreviewVisible"
    ></image-viewer>
    <office-preview
      :file="officePreviewRow"
      :status.sync="officePreviewVisible"
    ></office-preview>
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
          <span>{{ rowContextData.name }}</span>
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

    <!--展示压缩文件-->
    <el-dialog
      :title="'预览:' + compressedFileName"
      :visible.sync="compressedFileVisible"
    >
      <file-tree
        :directoryTreeData="compressedFileData"
        :tempDir="compressedFileTempDir"
      ></file-tree>
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
        <!-- <el-button
          size="small"
          @click="fileTreeAndNewFolder"
          :disabled="fileTreeAndNewFolderDisabled"
          ><i class="el-icon-folder-add"></i>&nbsp;&nbsp;新建文件夹
        </el-button> -->
        <el-button
          v-if="!unzipOperating"
          size="small"
          type="primary"
          @click="moveFileTree"
          >移 动</el-button
        >
        <el-button
          v-if="!unzipOperating"
          size="small"
          type="primary"
          @click="copyFileTree"
          >复制</el-button
        >
        <!-- <el-button
          v-if="unzipOperating"
          size="small"
          type="primary"
          @click="confirmUnzip"
          >解压</el-button
        > -->
        <el-button size="small" @click="dialogMoveOrCopyVisible = false"
          >取 消</el-button
        >
      </div>
    </el-dialog>

    <el-dialog
      title="预览"
      :visible.sync="dialogPreviewVisible"
    >
      <!-- <VueDocPreview
        :value="docValue"
        :type="docType"
        :mdStyle="mdStyle"
        :language="language"
        :url="docUrl"
      /> -->
    </el-dialog>
  </div>
</template>

<script>
import { CheckboxGroup, Grid } from "vant";
import { Notification } from 'element-ui';
import { formatSize, formatTime } from "./utils/number";
import { suffix } from "./utils/file-type";
import fileApi from "@/api/file-api";
import Bus from "./assets/js/bus";
import "vant/lib/index.css";
import "vant/lib/index.js";
import IconFile from "@/components/ShowFile/components/Icon/IconFile";
import ButtonUpload from "./components/button/ButtonUpload";
import IconComponent from "./icons/index.js";
// import SimTextPreview from "./components/preview/SimTextPreview";
// import OfficePreview from "./components/preview/OfficePreview";
import ImageViewer from "./components/preview/ImageViewer";
import { saveAs } from 'file-saver';
import VueDocPreview from "vue-doc-preview";

// import Bus from "./assets/js/bus";
export default {
  mixins: [IconComponent],
  components: {
    "van-checkbox-group": CheckboxGroup,
    "van-grid": Grid,
    "icon-file": IconFile,
    ButtonUpload,
    ImageViewer,
    VueDocPreview
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
          { iconClass: "menu-copy", label: "移动或复制", operation: "copy" },
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
      grid: this.defaultGrid,
      vmode: this.defaultGrid ? "grid" : "list",
      imageUrl: `https://demo.zhujunhao.top/api/view/thumbnail?jmal-token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJXRUIiLCJpc3MiOiJTZXJ2aWNlIiwiZXhwIjoxNzAwMDQzNDMyLCJ1c2VybmFtZSI6ImRlbW8ifQ.UQc7q5h867eb1cp8Vaj7A40-Wpei4r2nL5JrkPbEZEc&name=demo&id=`,
      audioCoverUrl: `https://demo.zhujunhao.top/api/view/cover?jmal-token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJXRUIiLCJpc3MiOiJTZXJ2aWNlIiwiZXhwIjoxNzAwMDQzNDMyLCJ1c2VybmFtZSI6ImRlbW8ifQ.UQc7q5h867eb1cp8Vaj7A40-Wpei4r2nL5JrkPbEZEc&name=demo&id=`,
      path: this.$route.query.path,
      // pathList: [{ folder: "" }],
      uploadApiUrl: fileApi.simpleUploadURL,  // 单个文件上传的api的url
      pathIdList : [0],
      isShowNewFolder: false,
      listModeSearch: false,
      inputting: false, // 是否正在输入
      searchFileName: "",
      isCmd: false, // 是否按住了command(control)键
      menus: [],
      drawer: false, // 详情抽屉
      rowContextData: {},  //详情抽屉数据
      editingIndex: -1,  //控制是否打开重命名输入框
      renameFileName: "",  //重命名的值
      textPreviewVisible: false,
      textPreviewRow: {},
      imagePreviewRow: {},
      imagePreviewVisible: false,
      videoPreviewRow: {},
      videoPreviewVisible: false,
      officePreviewRow: {},
      officePreviewVisible: false,
      currentId: 0, //当前文件/文件夹id
      showNewFolder: false, //新建文件夹input
      newFolderName: '', //新建文件夹名字
      dialogMoveOrCopyVisible: false, //控制移动或复制弹框的显隐
      directoryTreeData: [], //树形控件数据
      selectTreeNode: {},
      //树形组件的props
      directoryTreeProps: {
        label: "name",
        children: "children",
        isLeaf: "isLeaf"
      },
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
      fileList:[],
      //  {
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
      num: 0,//是否已经拿取了文件列表数据
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
        let filename = item.name;

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
    getSummaries3() {
      let totalSize = 0;
      this.fileList.forEach(file => {
        totalSize += file.size;
        // console.log(totalSize)
      });
      return this.fileList.length > 0 ? this.fileList.length + "项": "";
      // return totalSize > 0
      //   ? this.fileList.length + "项 "
      //   : "";
    }
  },
  watch: {
    'fileList.length': {
      handler() {
        this.handleDataRendered()
      }
    }
  },
  mounted() {
    // 监听返回
    if (window.history && window.history.pushState) {
      history.pushState(null, null, document.URL);
      window.addEventListener("popstate", this.goBack, false);
    }
    // 加载布局
    // if (this.$route.query.vmode) {
    //   this.vmode = this.$route.query.vmode;
    // } else {
    //   if (this.defaultGrid) {
    //     this.vmode = "grid";
    //   } else {
    //     this.vmode = "list";
    //   }
    // }
    // if (this.vmode === "list") {
    //   this.grid = false;
    //   if (!this.selectFile) {
    //     this.lessClientHeight = 140;
    //   }
    // } else {
    //   this.grid = true;
    //   if (!this.selectFile) {
    //     this.lessClientHeight = 106;
    //   }
    //   this.containerResize();
    // }
    // 加载url上的path
    // if (this.$route.query.path !== "/") {
    //   const path = decodeURI(this.$route.query.path);
    //   console.log(path,'path')
    //   this.pathList.splice(1, 1);
    //   path.split("/").forEach((pathName, index) => {
    //     if (index > 0) {
    //       const item = {};
    //       item["folder"] = pathName;
    //       this.pathList.push(item);
    //     }
    //   });
    // }
    // if (this.$route.query.folder && this.path) {
    //   localStorage.setItem(this.path, this.$route.query.folder)
    // }
    // if (this.$route.query.highlight) {
    //   this.onCreateFilename = this.$route.query.highlight
    //   this.clearOnCreateFilename()
    // }
    //给pl-table填充数据
    setTimeout(() => {
      if (!this.getFileListed) {
        this.getFileList();
      }
    }, 50);
  },

  methods: {
    // 复制或粘贴
    copyOrMove(operating) {
      let operation = "复制";
      if (operating === "move") {
        operation = "移动";
      }
      console.log(this.selectTreeNode,this.rowContextData,'compare')
      if(this.selectTreeNode.id == this.rowContextData.id){
        this.$message.warning("不能将文件" + operation + "到自身或其子目录下");
        return
      }
      // let selectNodePath = "/";
      // if (this.selectTreeNode.path) {
      //   selectNodePath =
      //     this.selectTreeNode.path + this.selectTreeNode.name + "/";
      // }

      // let fileIds = [];
      // if (this.menusIsMultiple || this.selectRowData.length > 1) {
      //   const exits = this.$refs.fileListTable.tableSelectData.some(value => {
      //     fileIds.push(value.id);
      //     const thisParentPath = value.path;
      //     if (thisParentPath === selectNodePath) {
      //       this.$message({
      //         message: "不能将文件" + operation + "到自身或其子目录下",
      //         type: "warning"
      //       });
      //       return true;
      //     }
      //   });
      //   if (exits) {
      //     return;
      //   }
      // } else {
      //   if (this.rowContextData.id) {
      //     fileIds.push(this.rowContextData.id);
      //   } else {
      //     fileIds.push(this.rowContextData[0].id);
      //   }
      // }

      // 移动
      if(operating == 'move'){
        fileApi.move({
          sourceId: this.rowContextData.id, //原始文件或文件夹的相对路径id
	        targetId: this.selectTreeNode.id, //目的地址相对路径id
        }).then(res=>{
          if(res.code == 0){
            this.$message.success(res.data.message);
            this.dialogMoveOrCopyVisible = false;
            this.getFileList();
          }else{
            this.$message.error(res.data.message);
            this.dialogMoveOrCopyVisible = false;
          }
        })
      }else if(operating == 'copy'){
        fileApi.copy({
          sourceId: this.rowContextData.id, //原始文件或文件夹的相对路径id
	        targetId: this.selectTreeNode.id, //目的地址相对路径id
        }).then(res=>{
          if(res.code == 0){
            this.$message.success(res.data.message);
            this.dialogMoveOrCopyVisible = false;
            this.getFileList();
          }else{
            this.$message.error(res.data.message);
            this.dialogMoveOrCopyVisible = false;
          }
        })
      }
      // this.copyOrMoveApi(operating, fileIds, this.selectTreeNode.id);
    },
    // 移动文件
    moveFileTree() {
      this.copyOrMove("move");
    },
    // 复制文件
    copyFileTree() {
      this.copyOrMove("copy");
    },
    // 上传成功
    uploadSuccess(){
      console.log("uploadSuccess");
    },
    //加载树形组件布局
    renderContent(h, { node, data, store }) {
      if (data.newFolder) {
        return (
          <span class="custom-tree-node">
            <span>
              <svg-icon icon-class="folder" />
            </span>
            <span>
              <div class="el-input el-input--mini el-input-tree">
                <input
                  type="text"
                  autocomplete="on"
                  value="新建文件夹"
                  id="treeInput"
                  class="el-input__inner"
                />
              </div>
              <button
                type="button"
                on-click={() => {
                  let path = "/";
                  let parentData = node.parent.data;
                  if (parentData.path) {
                    path = parentData.path + parentData.name + path;
                  }
                  let newFolderName = document.getElementById("treeInput")
                    .value;
                  api
                    .newFolder({
                      isFolder: true,
                      filename: encodeURI(newFolderName),
                      currentDirectory: encodeURI(path),
                      folder: this.$route.query.folder,
                      username: this.$store.state.user.name,
                      userId: this.$store.state.user.userId
                    })
                    .then(res => {
                      data.newFolder = false;
                      data.name = newFolderName;
                      data.id = res.data;
                    })
                    .catch(() => {
                      window.event.preventDefault();
                      window.event.stopPropagation();
                    });
                }}
                class="el-button el-icon-check el-button--mini el-input-tree-button"
                element-loading-spinner="el-icon-loading"
                element-loading-background="#f6f7fa88"
              />
              <button
                type="button"
                on-click={() => {
                  this.$refs.directoryTree.remove(node);
                  window.event.preventDefault();
                  window.event.stopPropagation();
                }}
                class="el-button el-icon-close el-button--mini el-input-tree-button"
                element-loading-spinner="el-icon-loading"
                element-loading-background="#f6f7fa88"
              />
            </span>
          </span>
        );
      }
      if (node.expanded) {
        console.log('node.expanded=true')
        return (
          <span class="custom-tree-node">
            <svg-icon icon-class="open-folder" />
            <span style="margin-left: 5px;">{node.label}</span>
          </span>
        );
      } else {
        console.log('node.expanded=false')
        return (
          <span class="custom-tree-node">
            <svg-icon icon-class="folder" />
            <span style="margin-left: 5px;">{node.label}</span>
          </span>
        );
      }
    },
    //下载文件
    downloadFile() {
      console.log(this.rowContextData,'downloaded file')
      // let totalSize = 0;
      // if (this.$refs.fileListTable.tableSelectData.length > 0) {
      //   this.$refs.fileListTable.tableSelectData.forEach(item => {
      //     totalSize += item.size;
      //   });
      // } else {
      //   totalSize += this.rowContextData.size;
      // }
      // if (totalSize > 0) {
      //   var fileIds = [];
      //   if (this.$refs.fileListTable.tableSelectData.length > 0) {
      //     this.$refs.fileListTable.tableSelectData.forEach(value => {
      //       fileIds.push(value.id);
      //     });
      //   } else {
      //     fileIds.push(this.rowContextData.id);
      //   }
      //   if (fileIds.length > 1 || this.rowContextData.isFolder) {
      //     fileConfig.packageDownload(
      //       fileIds,
      //       this.$store.state.user.token,
      //       this.$store.state.user.name
      //     );
      //     return;
      //   }
      //   fileConfig.download(
      //     this.$store.state.user.name,
      //     this.rowContextData,
      //     this.$store.getters.token
      //   );
      // } else {
      //   this.$message({
      //     message: "所选文件为空",
      //     type: "warning"
      //   });
      // }
      if(this.rowContextData.isFolder) {
        fileApi.downloadFolder({
          id: this.rowContextData.id
        }).then(res =>{
          console.log(res,'打包下载的结果')
          const blob = new Blob([res], { type: 'application/zip' });
          saveAs(blob, this.rowContextData.nameeditable-cell);
        })
      }else{
        fileApi.downloadFile({
        id: this.rowContextData.id
      }).then((res)=>{
          // const fileName = response.headers['content-disposition'].split('filename=')[1];
          // const fileData = res.data;
          // console.log(fileData)
          // // 创建一个 Blob 对象，用于存储文件数据
          // const blob = new Blob([res], { type: 'application/octet-stream' });
          // console.log(blob,'blob对象')
          if ("download" in document.createElement("a")) {
          // 不是IE浏览器
          let url = window.URL.createObjectURL(res);
          console.log(url,'下载的url')
          let link = document.createElement("a");
          link.style.display = "none";
          link.href = url;
          link.setAttribute("download", this.rowContextData.name);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link); // 下载完成移除元素
          window.URL.revokeObjectURL(url); // 释放掉blob对象
        } else {
          // IE 10+
          window.navigator.msSaveBlob(res, fileName);
        } 
      })
      }
      
    },
    // 加载下一级文件树
    directoryTreeLoadNode(node, resolve) {
      console.log(node,'node的信息')
      let fileId = null;
      if (node.level === 0) {
        const that = this;
        setTimeout(function() {
          that.$refs.directoryTree.setCurrentKey("0");
        }, 0);
        console.log(fileId,'查看fileId1')
        return resolve([{ id: "0", name: "全部文件" }]);
      }
      if (node.level > 0) {
        fileId = node.data.id;
      }
      // if(node.data.id == this.rowContextData.id){
      //   this.$message.warning("不可以移动到自身目录")
      //   return resolve([]);
      // }
      fileApi 
        .getFolderList({
          // userId: this.$store.state.user.userId,
          // username: this.$store.state.user.name,
          // fileId: fileId
          id: fileId
        })
        .then(res => {
          const nextNodes = res.data;
          return resolve(nextNodes);
        });
    },
    // 点击文件树
    treeNodeClick(row, node, event) {
      console.log(row, '点击文件树')
      this.fileTreeAndNewFolderDisabled = row.hasOwnProperty("newFolder");
      this.selectTreeNode = row;
      this.selectTreeNode.showName = ' "' + row.name + '"';
    },
    //控制移动或复制弹框的显隐
    showDialogMoveOrCopyVisible() {
      this.dialogMoveOrCopyVisible = true;
    },
    //点击移动或复制
    moveOrCopy() {
      this.showDialogMoveOrCopyVisible();
      this.titlePrefix = "移动或复制到: ";
      this.unzipOperating = false;
      const that = this;
      setTimeout(function() {
        that.selectTreeNode = that.$refs.directoryTree.getCurrentNode();
        console.log(that.selectTreeNode,'xxxxxxxxxxxxx')
        that.selectTreeNode.showName = ' "' + that.selectTreeNode.name + '"';
      }, 100);
    },
    //点击新建文件夹
    newFolderNameClick() {
      if (this.newFolderName) {
        if (/[\[\]\/\\"<>\?\*]/gi.test(this.newFolderName)) {
          this.$message.warning("文件名不能包含以下字符:<,>,|,*,?,,/,[,]")
          // this.$message({
          //   message: "文件名不能包含以下字符:<,>,|,*,?,,/,[,]",
          //   type: "warning"
          // });
          return;
        }
        this.newFolderLoading = true;
        this.createFileLoading = true;
        fileApi
          .uploadFolder({
            id: this.currentId,
            folderName: this.newFolderName
            // isFolder: true,
            // filename: encodeURI(this.newFolderName),
            // currentDirectory: encodeURI(this.path),
            // folder: this.$route.query.folder,
            // username: this.$store.state.user.name,
            // userId: this.$store.state.user.userId
          })
          .then(res => {
            console.log(res,'新建文件夹的结果')
            if (res.code != 0) {
              this.newFolderLoading = false;
              this.$message.warning(res.data.message);
              // this.$message({
              //   message: "该文件夹已存在",
              //   type: "warning"
              // });
            } else {
              this.createFileLoading = false;
              this.newCreateFileDialog = false;
              this.newFolderLoading = false;
              this.showNewFolder = false;
              this.isShowNewFolder = false;
              this.$message.success("新建成功")
              // this.$notify({
              //   title: "新建文件夹成功",
              //   type: "success",
              //   duration: 1000
              // });
              this.getFileList();
              // if (this.listModeSearch) {
              //   this.getFileListBySearchMode();
              // } else {
              //   this.getFileList();
              // }
            }
          })
          .catch(() => {
            this.newFolderLoading = false;
            this.createFileLoading = false;
          });
      } else {
        this.newFolderLoading = false;
        this.$message({
          message: "请输入文件夹名称",
          type: "warning"
        });
      }
    },
    //获取新的文件夹名
    getNewFileName(fileList, newFileName) {
      let append = 0;
      let filenameList = [];
      fileList.forEach(file => {
        let fileName = file.name || file.label;
        filenameList.push(fileName);
      });
      const newName = newFileName;
      while (filenameList.includes(newFileName)) {
        append += 1;
        if (newName.indexOf(".") > 0) {
          const name = newName.substring(0, newName.lastIndexOf("."));
          const suffix = newName.substring(newName.lastIndexOf("."));
          newFileName = `${name}${append}${suffix}`;
        } else {
          newFileName = `${newName}${append}`;
        }
      }
      return newFileName;
    },
    //新建文件夹
    newFolder() {
      this.newFolderName = this.getNewFileName(this.fileList, "新建文件夹");
      this.showNewFolder = true;
      this.$nextTick(() => {
        this.$refs.newFolderName.focus();
        this.$refs.newFolderName.select();
      });
    },
    //实际删除前的提示信息
    getShowSumFileAndFolder(fileList) {
      if(this.rowContextData.isFolder) {
        return "1个文件夹"
      }else{
        return "1个文件"
      }
      // let folderSize = 0;
      // let fileSize = 0;
      // fileList.forEach(fileInfo => {
      //   if (fileInfo.isFolder) {
      //     folderSize += 1;
      //   } else {
      //     fileSize += 1;
      //   }
      // });
      // let folderSum = "";
      // if (folderSize > 0) {
      //   folderSum = folderSize + "个文件夹";
      // }
      // let fileSum = "";
      // if (fileSize > 0) {
      //   fileSum = fileSize + "个文件";
      // }
      // return folderSum + " " + fileSum;
    },

    // 删除
    deleteFile() {
      let fileList = [];
      const fileIds = [];
      if (this.menusIsMultiple) {
        fileList = this.$refs.fileListTable.tableSelectData;
        this.$refs.fileListTable.tableSelectData.forEach(value => {
          fileIds.push(value.id);
        });
      } else {
        fileIds.push(this.rowContextData.id);
      }
      console.log(this.menusIsMultiple,fileIds,'cccccccccc')
      // fileIds.push(this.rowContextData.id);
      const str = this.getShowSumFileAndFolder(fileList);
      console.log(str,this.rowContextData.id, '整理后的信息')
      this.$confirmEle("此操作将永久删除" + str + ", 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        fileApi
          .delete({
            // currentDirectory: this.rowContextData.path,
            // username: this.$store.state.user.name,
            // fileIds: fileIds
            id : this.rowContextData.id
          })
          .then(() => {
            // 刷新列表
            console.log(this.rowContextData,"xxxxx")
            this.getFileList()
          })
          .then(() => {
            this.$message.success("删除成功")
            // this.$notify({
            //   title: "删除成功",
            //   type: "success",
            //   duration: 1000
            // });
          });
      });
    },

    // 处理grid布局。
    handleDataRendered() {
      this.$nextTick(() => {
        const gridFile = this.$refs.gridFile;
        const divs = gridFile.children; // 获取所有子元素（即 div）
        const containerWidth = gridFile.clientWidth;
        const divWidth = divs.length > 0 ? 124 : 0;
        const gap = 18
        // 判断是否足够一行
        const isNotEnoughForRow  = (divs.length * divWidth + (divs.length - 1) * gap) <= containerWidth
        const val = isNotEnoughForRow ? `repeat(${divs.length}, 124px)` : 'repeat(auto-fit, minmax(124px, 1fr))'
        gridFile.style.gridTemplateColumns = val;
        console.log(gridFile.style)
      })
    },
    // 浏览器的返回事件
    goBack() {
      if (this.pathList.length <= 1) {
        this.$router.push(`/?vmode=${this.vmode}&path=${encodeURI(this.path)}`);
        return;
      }
      this.lastLink();
    },
    //点击返回
    lastLink() {
      // this.handleLink(
      //   this.pathList[this.pathList.length - 2],
      //   this.pathList.length - 2
      // )
      this.pathIdList.pop()
      this.currentId = this.pathIdList[this.pathIdList.length -1]
      this.pagination.pageIndex = 1;
      this.getFileList();
    },
    // handleLink(item, index, unPushLink, unRefresh) {
    //   // console.log(item,'kankanitem是什么')

    //   // if (item && item.search) {
    //   //   if (item.searchKey) {
    //   //     this.searchFileByKeyWord(item.searchKey);
    //   //   } else if (item.row) {
    //   //     this.searchFileAndOpenDir(item.row);
    //   //   }
    //   //   this.pathList.splice(
    //   //     this.pathList.findIndex((v, i) => i === index + 1),
    //   //     this.pathList.length - (index + 1)
    //   //   );
    //   // } else {
    //   //   this.pathList.splice(
    //   //     this.pathList.findIndex((v, i) => i === index + 1),
    //   //     this.pathList.length - (index + 1)
    //   //   );
    //   //   this.pathList.forEach((p, number) => {
    //   //     if (number === 0) {
    //   //       this.path = "";
    //   //     } else if (number === this.pathList.length) {
    //   //     } else {
    //   //       this.path += "/" + this.pathList[number].folder;
    //   //     }
    //   //     this.path = this.path.replace(/\\/g, "/");
    //   //   })

    //   //   let queryFolder = localStorage.getItem(this.path)

    //   //   if (!unPushLink) {
    //   //     if (!this.$route.query.path) {
    //   //       this.$router.push(
    //   //         `?vmode=${this.vmode}&path=${encodeURI(this.path)}${queryFolder ? '&folder='+queryFolder : ''}`
    //   //       );
    //   //     } else {
    //   //       this.$router.push(
    //   //         `?vmode=${this.vmode}&path=${encodeURI(this.path)}${queryFolder ? '&folder='+queryFolder : ''}`
    //   //       );
    //   //     }
    //   //   }
    //   //   if (!unRefresh) {
    //   //     this.pagination.pageIndex = 1;
    //   //     this.getFileList();
    //   //   }
    //   // }
    // },
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
          this.$message.warning("文件名不能包含以下字符:<,>,|,*,?,,/,[,]")
          // this.$message({
          //   message: "文件名不能包含以下字符:<,>,|,*,?,,/,[,]",
          //   type: "warning"
          // });
          return;
        }
        let strFileName = newFileName.replace(/(.*\/)*([^.]+).*/gi, "$2");
        let newExt = newFileName.replace(/.+\./, "");
        if (!row.isFolder) {
          if (row.suffix !== newExt) {
            this.$confirmEle(
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
                this.renameFileName = strFileName + "." + row.suffix;
                console.log(newFileName,'选择后的名字')
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
      console.log(row,newFileName);
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
        this.$message.warning(msg);
        // this.$message({
        //   message: msg,
        //   type: "warning"
        // });
        this.renameLoading = false;
        return;
      }
      this.editingIndex = -1;
      fileApi
        .rename({
          // newFileName: encodeURI(newFileName),
          // username: this.$store.state.user.name,
          // folder: this.$route.query.folder,
          // sourcePath: row.path,
          newName: newFileName,
          id: row.id
        })
        .then(res => {
          console.log(res,'重命名结果')
          this.renameLoading = false;
          this.getFileList()
          // row.name = newFileName;
          // row.suffix = newFileName.replace(/.+\./, "");
          // this.fileList[row.index] = row;
          this.editingIndex = -1;
        })
        .then(() => {
          // this.$refs.fileListTable.clearSelection();
          // this.setOnCreateFilename(newFileName)
        })
        .catch(() => {
          this.renameLoading = false;
          this.editingIndex = -1;
        });
    },
    //打开文件夹
    openDir(row, onLoad) {
      this.beforeLoadData(onLoad);
      console.log(row,'点击对应的数据')
      fileApi
        .getSortedFileList({
          sortableProp: this.sortable.prop,
          order: this.sortable.order,
          // userId: this.$store.state.user.userId,
          // username: this.$store.getters.name,
          id: row.id,
          // currentDirectory: encodeURI(this.$route.query.path),
          pageNo: this.pagination.pageIndex, 
          limit: this.pagination.pageSize,
          // pageIndex: this.pagination.pageIndex,
          // pageSize: this.pagination.pageSize,
          // folder: this.$route.query.folder
        })
        .then(res => {
          this.loadData(res, onLoad);
        });
      // this.path = row.path + row.name;
      this.path = this.path.replace(/\\/g, "/");
    },
    //双击
    dblclick(row) {
      this.fileClick(row);
    },
    // 点击文件或文件夹
    fileClick(row) {
      console.log(row,'cccccccccccccccccccc')
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
          // this.pathList.push(item);
          this.pathIdList.push(row.id)
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
          // this.pathList.push(item);
          this.pathIdList.push(row.id)
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
        if (row.contentType.indexOf("json") > -1){
          console.log("json");
        }
        if (row.contentType.startsWith("image")) {
          console.log("image")
          // 图片
          this.imagePreviewVisible = true;
          this.imagePreviewRow = row;
          return;
        }
        if (suffix.simText.includes(row.suffix)) {
          console.log("simText")
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
          console.log('文本文件')
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
      this.menus = JSON.parse(JSON.stringify(this.singleMenus));
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
      // console.log(this.$route.query.folder)
      // console.log(this.path)
      // console.log(this.$store.state.user.name)
      // console.log(this.$store.state.user.userId)
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

    sortChange(column,onLoad) {
      console.log(column)
      console.log(this.listModeSearch)
      let { prop, order } = column;
      if (this.orderCustom || this.listModeSearch) {
        this.sortable.prop = prop;
        this.sortable.order = order;
        this.pagination.pageIndex = 1;

        // if (this.listModeSearch) {
        //   this.searchFile(this.searchFileName);
        // } else {
        //   this.getFileList();
        // }
        let that = this
        fileApi
        .getSortedFileList({
          sortableProp: this.sortable.prop,
          order: this.sortable.order,
          id: this.currentId,
          pageNo: this.pagination.pageIndex, 
          limit: this.pagination.pageSize,
        })
        .then(res => {
          console.log(res.data.records,'result'); 
          that.loadData(res, onLoad);
        });
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
      if (!this.$refs.fileListTable) {
        return;
      }
      if (onLoad) {
        res.data.records.forEach((file, number) => {
          file["index"] =
            (this.pagination.pageIndex - 1) * this.pagination.pageSize + number;
          this.fileList.push(file);
        });
      } else {
        this.fileList = res.data.records;
        // this.fileList = res;
        this.fileList.map((item, index) => {
          item.index = index;
        });
        this.$refs.fileListTable.reloadData(this.fileList);
        setTimeout(() => {
          this.$refs.fileListTable.reloadData(this.fileList);
        }, 0);
      }
      // 数据全部加载完成
      if (this.fileList.length >= res.count) {
        this.finished = true;
      }
      this.tableLoading = false;
      this.clientHeight =
        document.documentElement.clientHeight - this.lessClientHeight;
      this.listModeSearch = false;
      this.pagination["total"] = res.count;
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
    getFileList(onLoad) {
      this.getFileListed = true;
      this.beforeLoadData(onLoad);
      console.log(this.$route.query.path,'xxxxx')
      fileApi
        .getSortedFileList({
          // userId: this.$store.state.user.userId,
          // username: this.$store.state.user.name,
          // currentDirectory: encodeURI(this.$route.query.path),
          // folder: this.$route.query.folder,
          // queryFileType: this.queryFileType,
          // sortableProp: this.sortable.prop,
          // order: this.sortable.order,
          // isFolder: this.queryCondition.isFolder,
          // isFavorite: this.queryCondition.isFavorite,
          // queryCondition: this.queryCondition,
          sortableProp: this.sortable.prop,
          order: this.sortable.order,
          id: this.currentId,
          pageNo: this.pagination.pageIndex, 
          limit: this.pagination.pageSize,
        })
        .then(res => {
          console.log(res.data.records,'result'); 
          this.loadData(res, onLoad);
          this.fileList = res.data.records
        });
      // this.loadData(this.fileList, onLoad);
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
      console.log(key, '查看key是什么')
      if (key) {
        this.beforeLoadData(onLoad);
        // this.pathList = [{ folder: "" }];
        // const item1 = {};
        // item1["folder"] = "搜索: " + '"' + key + '"';
        // item1["search"] = true;
        // item1["searchKey"] = key;
        // this.pathList.push(item1);
        this.$router.push(`?vmode=${this.vmode}&search-file=${key}`);
        fileApi
          .searchFile({
            // userId: this.$store.state.user.userId,
            // username: this.$store.state.user.name,
            id: this.currentId,
            fileName: key,
            // sortableProp: this.sortable.prop,
            // order: this.sortable.order,
            // currentDirectory: encodeURI(this.$route.query.path),
            pageNo: this.pagination.pageIndex, 
            limit: this.pagination.pageSize,
            // pageIndex: this.pagination.pageIndex,
            // pageSize: this.pagination.pageSize
          })
          .then(res => {
            this.loadData(res, onLoad);
            // this.path = "";
            this.listModeSearch = true;
            this.listModeSearchOpenDir = false;
          });
      }else{
        fileApi
        .getSortedFileList({
          sortableProp: this.sortable.prop,
          order: this.sortable.order,
          id: this.currentId,
          pageNo: this.pagination.pageIndex, 
          limit: this.pagination.pageSize,
        })
        .then(res => {
          this.loadData(res, onLoad);
        });
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
    // grid-template-columns: repeat(auto-fit, minmax(auto, 1fr));
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
