import Vue from 'vue'
import { sysInfo } from '@/config/system'
import {
  SIDEBAR_TYPE,
  DEFAULT_THEME,
  DEFAULT_LAYOUT_MODE,
  DEFAULT_COLOR,
  DEFAULT_COLOR_WEAK,
  DEFAULT_FIXED_HEADER,
  DEFAULT_FIXED_SIDEMENU,
  DEFAULT_FIXED_HEADER_HIDDEN,
  DEFAULT_CONTENT_WIDTH_TYPE,
  DEFAULT_MULTI_TAB,
  TABINFO
} from '@/store/mutation-types'

const app = {
  state: {
    sidebar: true,
    device: 'desktop',
    theme: 'dark',
    layout: '',
    contentWidth: '',
    fixedHeader: false,
    fixSiderbar: false,
    autoHideHeader: false,
    color: null,
    weak: false,
    multiTab: true,
    sysInfo: sysInfo,
    tabInfo: {
      fullPathList: [],
      pages: [],
      activeKey: ''
    }, // tabs 信息
    iframeSrc: '', // 菜单作为iframe显示时候，iframe的src地址
    downloadList: [],
    downloadShow: false,
    isMinimized: false,  // 控制右下角“恢复新增数据集”div的显示
    visible: false, //控制“新增数据集”表单弹框的显示

    parentData: {}, //以下为dataMrg中addEditDialog组件的变量
    dataSetTitle: "",
    dlTagTypeOpt: [],
    total: 0,
    pagination: {
      total: 0,
      pageSize: 10,
      current: 1,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "30", "50"],
      showTotal: function (total) {
        return `共 ${total} 条`
      }
    },
    currentProjectId: null,
    optionProjects: []
  },
  mutations: {
    SET_SYSINFO: (state, info) => {
      state.sysInfo = info
      Vue.ls.set('SYSINFO', info)
    },
    SET_SIDEBAR_TYPE: (state, type) => {
      state.sidebar = type
      Vue.ls.set(SIDEBAR_TYPE, type)
    },
    CLOSE_SIDEBAR: (state) => {
      Vue.ls.set(SIDEBAR_TYPE, true)
      state.sidebar = false
    },
    TOGGLE_DEVICE: (state, device) => {
      state.device = device
    },
    TOGGLE_THEME: (state, theme) => {
      // setStore('_DEFAULT_THEME', theme)
      Vue.ls.set(DEFAULT_THEME, theme)
      state.theme = theme
    },
    TOGGLE_LAYOUT_MODE: (state, layout) => {
      Vue.ls.set(DEFAULT_LAYOUT_MODE, layout)
      state.layout = layout
    },
    TOGGLE_FIXED_HEADER: (state, fixed) => {
      Vue.ls.set(DEFAULT_FIXED_HEADER, fixed)
      state.fixedHeader = fixed
    },
    TOGGLE_FIXED_SIDERBAR: (state, fixed) => {
      Vue.ls.set(DEFAULT_FIXED_SIDEMENU, fixed)
      state.fixSiderbar = fixed
    },
    TOGGLE_FIXED_HEADER_HIDDEN: (state, show) => {
      Vue.ls.set(DEFAULT_FIXED_HEADER_HIDDEN, show)
      state.autoHideHeader = show
    },
    TOGGLE_CONTENT_WIDTH: (state, type) => {
      Vue.ls.set(DEFAULT_CONTENT_WIDTH_TYPE, type)
      state.contentWidth = type
    },
    TOGGLE_COLOR: (state, color) => {
      Vue.ls.set(DEFAULT_COLOR, color)
      state.color = color
    },
    TOGGLE_WEAK: (state, flag) => {
      Vue.ls.set(DEFAULT_COLOR_WEAK, flag)
      state.weak = flag
    },
    TOGGLE_MULTI_TAB: (state, bool) => {
      Vue.ls.set(DEFAULT_MULTI_TAB, bool)
      state.multiTab = bool
    },
    SETTABLEINFO: (state, tabInfo) => {
      Vue.ls.set(TABINFO, tabInfo)
      state.tabInfo = tabInfo
    },
    setIframeSrc: (state, src) => {
      state.iframeSrc = src
    },
    SET_DOWNLOAD: (state, download) => {
      let current = null
      state.downloadList.forEach((item, index) => {
        if (item.id === download.id) {
          current = index
        }
      })
      if (current !== null) {
        state.downloadList.splice(current, 1, download)
      } else {
        state.downloadList.push(download)
      }
    },
    SHOW_DOWNLOAD: (state, downloadShow) => {
      state.downloadShow = downloadShow
    },
    CLEAR_DOWNLOAD: (state) => {
      state.downloadList = []
    },
    // 修改值：控制右下角“恢复新增数据集”div的显示
    SET_ISMINIMIZED: (state, isMinimized) => {
      state.isMinimized = isMinimized
    },
    //修改值：控制“新增数据集”表单弹框的显示
    SET_VISIBLE: (state, visible) => {
      state.visible = visible;
    },
    SET_PARENTDATA: (state, parentData) => {
      state.parentData = parentData
    },
    SET_DATASETTITLE: (state, dataSetTitle) => {
      state.dataSetTitle = dataSetTitle
    },
    SET_DLTAGTYPEOPT: (state, dlTagTypeOpt) => {
      state.dlTagTypeOpt = dlTagTypeOpt
    },
    SET_TOTAL: (state, total) => {
      state.total = total
    },
    SET_PAGINATION: (state, pagination) => {
      state.pagination = pagination
    },
    SET_PAGINATION_TOTAL: (state, paginationtotal) => {
      state.pagination.total = paginationtotal
    },
    SET_PAGINATION_PAGESIZE: (state, paginationpageSize) => {
      state.pagination.pageSize = paginationpageSize
    },
    SET_PAGINATION_CURRENT: (state, paginationcurrent) => {
      state.pagination.current = paginationcurrent
    },
    SET_CURRENT_PROJECT: (state, currentProjectId) => {
      state.currentProjectId = currentProjectId
    },
    SET_CURRENT_PROJECT_LIST: (state, optionProjects) => {
      state.optionProjects = optionProjects
    },
  },
  actions: {
    setSidebar ({ commit }, type) {
      commit('SET_SIDEBAR_TYPE', type)
    },
    CloseSidebar ({ commit }) {
      commit('CLOSE_SIDEBAR')
    },
    ToggleDevice ({ commit }, device) {
      commit('TOGGLE_DEVICE', device)
    },
    ToggleTheme ({ commit }, theme) {
      commit('TOGGLE_THEME', theme)
    },
    ToggleLayoutMode ({ commit }, mode) {
      commit('TOGGLE_LAYOUT_MODE', mode)
    },
    ToggleFixedHeader ({ commit }, fixedHeader) {
      if (!fixedHeader) {
        commit('TOGGLE_FIXED_HEADER_HIDDEN', false)
      }
      commit('TOGGLE_FIXED_HEADER', fixedHeader)
    },
    ToggleFixSiderbar ({ commit }, fixSiderbar) {
      commit('TOGGLE_FIXED_SIDERBAR', fixSiderbar)
    },
    ToggleFixedHeaderHidden ({ commit }, show) {
      commit('TOGGLE_FIXED_HEADER_HIDDEN', show)
    },
    ToggleContentWidth ({ commit }, type) {
      commit('TOGGLE_CONTENT_WIDTH', type)
    },
    ToggleColor ({ commit }, color) {
      commit('TOGGLE_COLOR', color)
    },
    ToggleWeak ({ commit }, weakFlag) {
      commit('TOGGLE_WEAK', weakFlag)
    },
    ToggleMultiTab ({ commit }, bool) {
      commit('TOGGLE_MULTI_TAB', bool)
    },
    ToggleCurrentProject ({ commit }, currentProjectId) {
      commit('SET_CURRENT_PROJECT', currentProjectId)
    },
    ToggleOptionProjects ({ commit }, optionProjects) {
      commit('SET_CURRENT_PROJECT_LIST', optionProjects)
    }
  }
}

export default app
