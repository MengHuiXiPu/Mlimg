// import Vue from 'vue'
import SvgIcon from '../components/SvgIcon/index.vue'// svg component
// import svgIcon from '../components/Icon/Icon.vue'// svg component
// register globally
// Vue.component('svg-icon', SvgIcon)

const req = require.context('./svg', false, /\.svg$/)
console.log(req)
const requireAll = requireContext => requireContext.keys().map(requireContext)
requireAll(req)

export default{
  components:{
    'svg-icon':SvgIcon,
  }
}
