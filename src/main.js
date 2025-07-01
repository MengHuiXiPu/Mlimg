import Vue from 'vue'
import App from './App.vue'
import Antd from "ant-design-vue"
import 'ant-design-vue/dist/antd.css';
import router from './router'
import store from './store'
import system from './config/system'
import './assets/icons/icon-font/iconfont.css';
import './filters/filter' // global filter
import './assets/less/global.less'
import './styles/common.less'
import VueTouch from 'vue-touch'
import VTooltip from "v-tooltip";
// import VueSocketIO from "vue-socket.io";
import SvgIcon from '@/components/svg-icon'
import hevueImgPreview from 'hevue-img-preview'
import ElementUI from 'element-ui';
import '@/assets/styles/element-variables.scss';  //引入element-ui改造样式
// import VForm from 'vform-builds'  //引入VForm库
import VForm from './vForm/VFormDesigner.umd.min.js'

import './vForm/VFormDesigner.css'
import AHeader from '@/components/PHeader';
import dict from './components/Dict';
import {MessageBox} from 'element-ui';
import { Message } from 'element-ui';
import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import VueI18n from 'vue-i18n';
import en from './lang/en';
import zh from './lang/zh';
import { message } from './utils/resetMessgae'
import { Loading } from 'element-ui';
import UploadBox from "@/components/business/uploadBox";


// import EVueContextmenu from 'e-vue-contextmenu'

// 表单验证
import { ValidationProvider, ValidationObserver } from './utils/validate';
// import plTable from 'pl-table'
// import 'pl-table/themes/index.css' // 引入样式（必须引入)，vuecli3.0不需要配置，cli2.0请查看webpack是否配置了url-loader对woff，ttf文件的引用,不配置会报错哦
// import 'pl-table/themes/plTableStyle.css' // 默认表格样式很丑 引入这个样式就可以好看啦（如果你不喜欢这个样式，就不要引入，不引入就跟ele表格样式一样）

import Viewer from 'v-viewer' // 全量引入插件
Vue.use(Viewer) // 将插件注册成全局插件(包含指令和组件，都一并注册了)
import 'viewerjs/dist/viewer.css' 
// 注册全局组件
Vue.component('a-header', AHeader);

// import Resize from '@/utils/tableResize'
// Vue.use(Resize)

// paper.install(window);

//注册上传组件
Vue.use(VTooltip);
Vue.use(VueTouch,{name:'v-touch'});
Vue.use(ElementUI);
Vue.use(VForm)
Vue.prototype.$ELEMENT = { size: 'small', zIndex: 3000 };
Vue.component('message', Message);
// Vue.component('message', Message);
// Vue.use(Message);
// Vue.prototype.$message = Message;
Vue.use(Antd);
//确认弹出框
Vue.prototype.$confirmEle = MessageBox.confirm;
Vue.prototype.$message = message
Vue.use(dict);
Vue.use(UploadBox)
// Vue.use(
//   new VueSocketIO({
//     debug: true,
//     connection: window.location.origin
//   })
// );
// 全局统一loading(非局部)
Vue.prototype.$GLoading = function (loadingText) {
  return Loading.service({
    lock: true,
    text: loadingText,
    spinner: 'el-icon-loading',
    background: 'rgba(0, 0, 0, 0.4)'
  });
}


// Vue.use(plTable);
Vue.component('ValidationProvider', ValidationProvider);
Vue.component('ValidationObserver', ValidationObserver);
Vue.config.productionTip = false

Vue.use(hevueImgPreview)
Vue.use(SvgIcon)
Vue.use(VueI18n);
const i18n = new VueI18n({
  locale: localStorage.getItem('lang') ? localStorage.getItem('lang') : 'zh', // 默认语言
  fallbackLocale: 'zh', // 后备语言（如果所选语言缺少翻译文本）
  messages: {
    en,
    zh,
  },
});
new Vue({
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app')
