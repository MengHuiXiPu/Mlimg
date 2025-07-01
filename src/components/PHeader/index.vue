<template>
  <div class="head">
    <div class="bread" v-if="isShowBread">
      <el-breadcrumb separator="/" v-if="!$route.meta.three">
        <el-breadcrumb-item :to="{ path: '/home/index' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="$route.meta.parentName"><a style="color:#333!important;">{{$route.meta.parentName ?? ''}}</a></el-breadcrumb-item>
        <el-breadcrumb-item v-if="$route.meta.title">{{$route.meta.title ?? ''}}</el-breadcrumb-item>
      </el-breadcrumb>
      <el-breadcrumb separator="/" v-else>
        <el-breadcrumb-item :to="{ path: '/home/index' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="breadInfo.parentName"><a style="color:#333!important;">{{breadInfo.parentName ?? ''}}</a></el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: breadInfo.path }" v-if="breadInfo.title"><a style="color:#333!important;">{{breadInfo.title ?? ''}}</a></el-breadcrumb-item>
        <el-breadcrumb-item v-if="pageTitle">{{pageTitle}}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <page-title v-if="isShowPageTitle" class="page-title" :pageTitle="pageTitle ? pageTitle : $route.meta.title" />
    <div :class="{'page-header': true, 'threePage': $route.meta.three}" v-if="showPageHeader">
      <a-tabs v-if="tabList.length > 1" v-model="value"  @change="onChange">
          <!--主要部分上方导航栏，选中的标签为蓝色-->
          <a-tab-pane v-for="(item) in tabList.filter(tab => !tab.auth || ($store.state.request.btnAuth && $store.state.request.btnAuth !== null && $store.state.request.btnAuth.includes(tab.auth)) )" :key="item.key" :tab="item.name" :disabled="loading && value != item.key">
          </a-tab-pane>
      </a-tabs>
      <div v-else></div>

      <div class="footer">
        <div class="search" v-if="showSearch">
          <a-select
            class="select"
            v-if="showSearchType"
            v-model="searchType"
            @change="changeSearchType"
            style="width: 100px"
          >
            <a-select-option value="task">任务</a-select-option>
            <a-select-option value="model">模型</a-select-option>
          </a-select>
          <!-- 算法分类 -->
          <a-select
            class="select"
            v-if="showAlgorithmType"
            v-model="algorithmType"
            @change="changeAlgorithmType"
            style="width: 100px"
          >
            <a-select-option value="全部">全部</a-select-option>
            <a-select-option :value="item.nodeName" v-for="item in algorithmTypeList" :key="item.id">{{ item.nodeName }}</a-select-option>
          </a-select>
          <dict-select-tree  @change="handleDictChange" v-if="showDict" allowClear ref="dictSelectTree" style="display: inline-block;"></dict-select-tree>
          <!--主要内容右侧搜索栏-->
          <a-input-search
            :placeholder="placeholderText"
            v-model="searchValue"
            @search="onSearch"
            @change="onSearchChange" />
        </div>
        <!--搜索栏右侧额外功能-->
        <div class="extra"> 
          <a-button type="primary" class="creat" @click="onMake" v-if="$store.state.request.btnAuth && $store.state.request.btnAuth !== null && $store.state.request?.btnAuth?.includes(auth.makeAll) && showAll">
            一键上下线
          </a-button>
          <a-button type="primary" class="creat" @click="onCreate" v-if="$store.state.request?.btnAuth && $store.state.request.btnAuth !== null && $store.state.request?.btnAuth?.includes(auth.add) || showNew">
            新建
          </a-button>
          <a-button type="danger" class="delete" @click="ondelete" :disabled="disabled" v-if="showdelete">
            删除
          </a-button>
          <a-button type="primary" class="creat" @click="onModelImport" v-if="$store.state.request?.btnAuth && $store.state.request.btnAuth !== null && $store.state.request?.btnAuth?.includes(auth.modelImport) && showModelImport">
            模型导入
          </a-button>
          <a-button type="primary" class="creat" @click="onModelExport" v-if="$store.state.request?.btnAuth && $store.state.request.btnAuth !== null && $store.state.request?.btnAuth?.includes(auth.modelImport) && showModelExport">
            Excel导出
          </a-button>
          <a-button icon="reload" class="creat reload" v-if="showReload" @click="onReload" />
          <a-button icon="upload"  class="creat reload" @click="onUpload" v-if="showUpload">导入</a-button>
          <a-button icon="download" class="creat reload" v-if="showDownload" @click="onDownload">导出</a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import Breadcrumb from '@/components/tools/Breadcrumb'
import PageTitle from '@/components/tools/PageTitle'
import debounce from 'lodash.debounce'
import dictSelectTree from "@/components/business/dictSelectTree/index.vue"
import { getTargetType } from "@/api/dataCenter"
export default {
  name: 'PHeader',
  components: {
    // 's-breadcrumb': Breadcrumb,
    'page-title': PageTitle,
    dictSelectTree
  },
  inject: ['reload'],
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    isShowBread: {
      type: Boolean,
      default: true
    },
    isShowPageTitle: {
      type: Boolean,
      default: true
    },
    faName: {
      type: String,
      default: ''
    },
    tabList: {
      type: Array,
      default: () => {
        return []
      },
    },
    tabActiveKey: {
      type: String,
      default: '',
    },
    placeholderText: {
      type: String,
      default: '请输入名称',
    },
    pageTitle: {
      type: String,
      default: '',
    },
    showNew: {
      type: Boolean,
      default: true,
    },
    showUpload: {
      type: Boolean,
      default: false
    },
    auth: {
      type: Object,
      default: () => {
        return {
        }
      },
    },
    showSearch: {
      type: Boolean,
      default: true
    },
    showAll: {
      type: Boolean,
      default: false
    },
    showReload: {
      type: Boolean,
      default: true
    },
    showModelImport: {
      type: Boolean,
      default: false
    },
    showDownload: {
      type: Boolean,
      default: false
    },
    showSearchType: {
      type: Boolean,
      default: false
    },
    showAlgorithmType: {
      type: Boolean,
      default: false
    },
    showModelExport: {
      type: Boolean,
      default: false
    },
    newText: {
      type: String,
      default: "新建"
    },
    showPageHeader: {
      type: Boolean,
      default: true
    },
    showdelete: {
      type: Boolean,
      default: false
    },
    // 显示目录选择
    showDict: {
      type: Boolean,
      default: false
    },
    // 当有接口正在响应时，禁止进行tab页切换
    loading: {
      type: Boolean,
      default: false
    },
  },
  created () {
    this.breadInfo = localStorage.getItem('bread') ? JSON.parse(localStorage.getItem('bread')) : {}
    if(this.showAlgorithmType) {  //获取算法分类列表
      getTargetType().then(res => {
        this.algorithmTypeList = res.data || []
      })
    }
  },
  data () {
    return {
      breadInfo: {},
      value: this.tabActiveKey,
      searchValue: '',
      searchType: 'task',
      algorithmType: '全部',
      // queryDictObj: {}, //筛选目录对象
      algorithmTypeList: [],    //算法分类列表
    }
  },
  mounted() {
    // console.log("auth====================: ", this.auth);
    // console.log("tabList=================: ", this.tabList)
    // console.log("showReload=========faName", this.faName, this.showReload)
  },
  methods: {
    // 获取选择的目录列表
    handleDictChange(dictObj) {
      // this.queryDictObj = dictObj
      this.$emit('dictChanged', dictObj)
    },
    // tabs切换
    onChange (e) {
      // 清除选择的目录
      this.$refs.dictSelectTree && this.$refs.dictSelectTree.clearValue()
      this.$emit('tab-change', e)
    },
    ondelete (e) {
      this.$emit('delete', e)
    },

    // 点击搜索 || enter键
    onSearch (value) {
      this.$emit('search', value.trim())
    },

    // 输入触发，防抖
    onSearchChange:
      debounce(function () {
        this.$emit('search', this.searchValue.trim())
      }, 300),

    // 触发创建按钮，防抖
    onCreate:
      debounce(function () {
        this.$emit('create')
      }, 300),

    // 触发刷新按钮,防抖
    onReload:
      debounce(function () {
        // console.log(this.reload)
        this.$emit('reload')
        // this.reload()
      }, 300),
    
    onUpload:
      debounce(function () {
        this.$emit('upload')
      }, 300),

    onModelImport:
      debounce(function () {
        this.$emit('modelImport')
      }, 300),

    onModelExport:
      debounce(function () {
        this.$emit('modelExport')
      }, 300),

    onMake: debounce(function () {
      this.$emit('makeAll')
    }, 300),
    
    onDownload: debounce(function () {
      this.$emit('download')
    }, 300),

    changeSearchType () {
      this.$emit('searchTypeChange', this.searchType)
      if (this.searchValue) this.onSearch(this.searchValue)
    },
    changeAlgorithmType () {
      this.$emit('algorithmTypeChange', this.algorithmType)
    }
  },
  watch: {
    'tabActiveKey' (val) {
      this.value = val
    }
  }
}
</script>
<style lang="less">
body {
  font-family: '微软雅黑', sans-serif;
}
// .ant-input {
//   border-radius: 8px;
//   height: 42px;
// }
// .search {
  // .ant-select-selection {
  //   margin-right: 10px;
  //   height: 32px;
  //   line-height: 32px;
  //   .ant-select-selection__rendered {
  //     height: 32px;
  //     line-height: 32px;
  //   }
  // }
// }
</style>
<style lang="less" scoped>
@import "~@/config/theme.less";
.head {
  overflow: hidden;
  /deep/ .ant-page-header-heading {
    margin-left: 0 !important;
    padding-bottom: 8px;
    .ant-page-header-heading-title {
      font-size: 24px;
      font-weight: 500;
    }
  }
}
.bread {
  padding: 4px 20px;
  padding-left: 0;
  margin-top: 20px;
}
.page-header {
  margin-top: 16px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  //border-bottom: 2px solid #e6e7ea;
  overflow: hidden;
  &.threePage {
    margin-bottom: 0;
  }
  .ant-tabs{
    float: left;
  }
  /deep/ .ant-tabs-bar {
    display: flex;
    align-items: center;
    height: 100%;
  }
  /deep/ .ant-tabs-nav .ant-tabs-tab {/*主要内容标签样式*/
    // padding: 20px 0 4px 20px;
    margin-right: 0;
    font-size: 14px;
    line-height: 42px;
    font-weight: 500;
    font-family: "微软雅黑", sans-serif;
    padding: unset;
    background: #f2f2f2;
    padding: 0px 16px;
    height: 42px;
    margin-right: 16px;
    border-radius: 8px;
    min-width: 116px;
    text-align: center;
    &.ant-tabs-tab-active {
      background: #1990ff;
      color: #fff;
    }
  }
  /deep/ .ant-tabs-bar {
    border-bottom: 0;
  }
  /deep/ .ant-tabs-ink-bar {
    display: none !important;
    width: 0 !important;
  }
  .footer {
    height: 44px;
    float: right;
    line-height: 44px;
    .select
    .ant-btn-danger {
      border-radius: 4px;
    }
    // display: flex;
    // display: flex;
    // align-items: center;
    // justify-content: space-between;
    .search {
      width: 400px;
      margin-right: 10px;
      float: left;
      text-align: right;
      .ant-input-search{
        width: 200px;
      }
      ::v-deep .ant-select-selection {
                margin-right: 10px;
                height: 32px;
                line-height: 32px;
                border-radius: 4px;
                .ant-select-selection__rendered {
                  height: 32px;
                  line-height: 32px;
                }
              }
    }
    .extra {
      text-align: center;
      display: flex;
      align-items: center;
      height: 100%;
      .delete {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 10px;
        font-size: @headerBtnFontSize;
        border-radius: 8px;
        padding: 0 24px;
        height: 42px;
      }
      .creat {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 10px;
        background-color: @headerBtnBgc;
        color: @headerBtnColor;
        font-size: @headerBtnFontSize;
        border-radius: 8px;
        padding: 0 24px;
        height: 42px;
      }
      // .reload {
      //   vertical-align: -1px;
      // }
    }
  }
}
</style>
