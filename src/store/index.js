import Vue from 'vue'
import Vuex from 'vuex'
import app from './modules/app'
import user from './modules/user'
import model from './modules/model'
import offline from './modules/offline'
import template from './modules/template'
import request from './modules/request'
//simport permission from './modules/permission'
import getters from './getters'

Vue.config.devtools = true
Vue.use(Vuex)

// https://webpack.js.org/guides/dependency-management/#requirecontext
const modulesFiles = require.context('./modules', true, /\.js$/);

// you do not need `import app from './modules/app'`
// it will auto require all vuex module from modules file
const modules = modulesFiles.keys().reduce((modules, modulePath) => {
    // set './app.js' => 'app'
    const moduleName = modulePath.replace(/^\.\/(.*)\.\w+$/, '$1');
    const value = modulesFiles(modulePath);
    modules[moduleName] = value.default;
    return modules;
}, {});

export default new Vuex.Store({
    state: {

    },
    mutations: {

    },
    actions: {

    },
    // modules: {
    //     user,
    //     app,
    //     model,
    //     offline,
    //     //permission,
    //     getters,
    //     template,
    //     request
    // }
    modules,
    getters,
})

