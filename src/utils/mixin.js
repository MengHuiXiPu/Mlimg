// import Vue from 'vue'
import { deviceEnquire, DEVICE_TYPE } from '@/utils/device'
import { mapState } from 'vuex'
import PHeader from '@/components/PHeader'
const mixin = {
  computed: {
    ...mapState({
      layoutMode: state => state.app.layout,
      navTheme: state => state.app.theme,
      primaryColor: state => state.app.color,
      colorWeak: state => state.app.weak,
      fixedHeader: state => state.app.fixedHeader,
      fixSiderbar: state => state.app.fixSiderbar,
      contentWidth: state => state.app.contentWidth,
      autoHideHeader: state => state.app.autoHideHeader,
      multiTab: state => state.app.multiTab
    })
  },
  methods: {
    isTopMenu() {
      return this.layoutMode === 'topmenu'
    },
    isSideMenu() {
      return !this.isTopMenu()
    }
  }
}

const mixinDevice = {
  computed: {
    ...mapState({
      device: state => state.app.device
    })
  },
  methods: {
    isMobile() {
      return this.device === DEVICE_TYPE.MOBILE
    },
    isDesktop() {
      return this.device === DEVICE_TYPE.DESKTOP
    },
    isTablet() {
      return this.device === DEVICE_TYPE.TABLET
    }
  }
}

const AppDeviceEnquire = {
  mounted() {
    const { $store } = this
    deviceEnquire(deviceType => {
      switch (deviceType) {
        case DEVICE_TYPE.DESKTOP:
          $store.commit('TOGGLE_DEVICE', 'desktop')
          $store.dispatch('setSidebar', true)
          break
        case DEVICE_TYPE.TABLET:
          $store.commit('TOGGLE_DEVICE', 'tablet')
          $store.dispatch('setSidebar', false)
          break
        case DEVICE_TYPE.MOBILE:
        default:
          $store.commit('TOGGLE_DEVICE', 'mobile')
          $store.dispatch('setSidebar', true)
          break
      }
    })
  }
}

const mixinHeader = {
  data() {
    return {
      timer: null,
      resizeDom: null,
      resizeParentDom: null,
      resize: false,
      resizeMax: 1000,
      search: ''
    }
  },
  components: {
    'p-header': PHeader,
  },
  beforeRouteEnter (to, from, next) {
    next((vm) => {
      // vm.activeResize()
    }) 
  },
  methods: {
    setTimer(callBack = () => { }, params, time = 3000) {
      clearInterval(this.timer)
      callBack(params)
      this.timer = setInterval(() => {
        callBack(params)
      }, time)
    },
    setTimeOut(callBack = () => { }, params, time = 3000) {
      if(params && Object.keys(params).length > 0) {
        params.noLoading = true
      }
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        callBack(params)
      }, time)
    },
    tabOnChange(key) {
      this.tabActiveKey = key
    },
    handCreate() { },
    handReload() {
      this.getDataList()
    },
    handSearch(value) {
      this.search = value
      this.getDataList({ search: value })
    },
  },
  computed: {
    imageName: function () {
      return this.tabList.find(item => item.key === this.tabActiveKey).name || ''
    }
  },
  destroyed() {
    if (this.resizeDom) this.deleteResize()
    clearInterval(this.timer)
  },
  beforeRouteLeave(to, from, next) {
    if (this.resizeDom) this.deleteResize()
    clearInterval(this.timer)
    next()
  }
}

export { mixin, AppDeviceEnquire, mixinDevice, mixinHeader }