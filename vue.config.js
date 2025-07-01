const path = require('path')
const webpack = require('webpack')
const CompressionPlugin = require('compression-webpack-plugin')
const system = require('./src/config/system')
const modifyVars = require('./src/config/theme')

const name = system.name; // 网址标题

function resolve(dir) {
  return path.join(__dirname, dir)
}
const isDev = process.env.NODE_ENV === 'development'
const assetsCDN = {
  // webpack build externals
  externals: {
    vue: 'Vue',
    'vue-router': 'VueRouter',
    vuex: 'Vuex',
    axios: 'axios'
  },
  css: [],
  // https://unpkg.com/browse/vue@2.6.10/
  js: [
    isDev ? '//cdn.jsdelivr.net/npm/vue@2.6.10/dist/vue.js' : '//cdn.jsdelivr.net/npm/vue@2.6.10/dist/vue.min.js',
    '//cdn.jsdelivr.net/npm/vue-router@3.1.3/dist/vue-router.min.js',
    '//cdn.jsdelivr.net/npm/vuex@3.1.1/dist/vuex.min.js',
    '//cdn.jsdelivr.net/npm/axios@0.19.0/dist/axios.min.js'
  ]
}
module.exports = {
  lintOnSave: false,
  productionSourceMap: process.env.NODE_ENV === 'development',
  //publicPath: isDev ? '/' : system.baseUrl,
  publicPath: '/',
  configureWebpack: {
    // devtool: process.env.NODE_ENV === 'development' ? 'cheap-module-source-map' : undefined,
    devtool: "cheap-module-source-map",
    plugins: [
      new webpack.DllReferencePlugin({
        context: process.cwd(),
        manifest: require('./public/vendor/vendor-manifest.json')
      }),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.ProvidePlugin({
        process: require.resolve('process/browser')
      }),
    ],
    resolve: {
      // fallback: {
      //   "crypto": require.resolve("crypto-browserify"),
      //   "querystring": require.resolve("querystring-es3"),
      //   "stream": require.resolve("stream-browserify"),
      //   "fs": false,
      //   "path": require.resolve("path-browserify"),
      //   "http": require.resolve("stream-http"),
      //   "https": require.resolve("https-browserify"),
      //   "url": require.resolve("url/"),
      //   "timers": require.resolve("timers-browserify"),
      //   "buffer": require.resolve("buffer/"),
      //   "process": require.resolve('process/browser'),
      // },
      alias: {
        '@': resolve('src'),
        '@crud': resolve('src/components/Crud'),
        '@pipeline': resolve('src/views/pipelineCenter')
      },
    }
    // resolve: {
    //   extensions: ['.js', '.vue', '.json'],
    //   alias: {
    //     'canvasSelect': resolve('./public/canvasSelect.min.js')
    //   }
    // }
  },
  chainWebpack(config) {
    config.plugins.delete('preload')
    config.plugins.delete('prefetch')

    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => {
        options.compilerOptions.preserveWhitespace = true;
        return options;
      })
      .end()

    config.plugin('html').tap(args => {
      args[0].title = system.name
      args[0].baseUrl = isDev ? '' : system.baseUrl
      args[0].isDev = isDev
      return args
    })
    config.plugins.delete('prefetch')
    // ie兼容
    config.entry('main').add('babel-polyfill')
    // 处理svg图片
    config.module.rule('svg').exclude.add(resolve('src/svgs')).end();
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/svgs'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]',
      })
      .end();
    config.module
      .rule('svg')
      .exclude.add([resolve('src/assets/svgs')])
      .end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add([resolve('src/assets/svgs')])
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()
    if (!isDev) {
      // 开启gzip
      config.plugin('compressionPlugin')
        .use(new CompressionPlugin({
          test: /\.js$|\.html$|\.css/, // 匹配文件名
          threshold: 10240, // 对超过10k的数据压缩
          deleteOriginalAssets: false // 不删除源文件
        }))
        .end()
      config.plugin('html').tap(args => {
        args[0].cdn = assetsCDN
        return args
      })
    }
  },
  css: {
    loaderOptions: {
      less: {
        modifyVars,
        additionalData: `
          @import "~@/assets/styles/variables.less";
          @import "~@/config/theme.less";
        `, // 引入通用变量，这样使用公用变量时不需要在每个vue中单独引入
        // 怎么能有那么多的样式变量定义文件啊，比他妈屎还屎的项目
        // DO NOT REMOVE THIS LINE
        javascriptEnabled: true
      }
    }
  },
  devServer: {
    host: '0.0.0.0',
    port: 8008,
    https: false,
    // client: {
    //   overlay: false
    // },
    proxy: {
      // '/autoannotator': {
      //   target: 'http://10.120.200.56:32668/',
      //   changeOrigin: true,
      //   pathRewrite: { '^/autoannotator': '/autoannotator' }
      // },
      // '/api/v1/alert/notify/detail': {
      //   target: 'http://10.110.167.11:30009/',
      //   changeOrigin: true,
      //   pathRewrite: { '^/api/v1/alert/notify/detail': '/api/v1/alert/notify/detail' },
      //   onproxyreq(proxyreq, req, res) {
      //     // 移除请求头
      //     proxyreq.removeheader("authorization");
      //   }
      // },
      '/api': {
        // target: 'https://testai.csot.tcl.com/',
        // target: 'http://10.110.167.101:30018/',
        target: 'http://10.120.200.35:30008/',
        // target: 'http://10.120.200.35:32488/tcl-gateway/',
        // target: 'http://10.120.200.35:32488/tcl-gateway/',
        //target:'http://localhost:3000',
        //secure: false,

        // target: 'http://10.8.4.92:8030/',
        changeOrigin: true,
        pathRewrite: { '^/api': '/api' }
      },
      '/algorithm': {
        // target: 'http://10.120.200.35:32488/',
        target: 'http://10.120.200.29:8030',

        //target: 'http://10.120.200.35/',
        // target: 'http://10.8.4.92:8030/',
        changeOrigin: true,
        pathRewrite: { '^/algorithm': '/' }
      },
      '/py': {
        target: 'http://10.120.200.56:30888/',
        // logLevel: 'debug',
        changeOrigin: true,
        pathRewrite: { '^/py': '/' }
      },
      '/data': {
        target: 'http://10.120.200.35:30008/',
        // logLevel: 'debug',
        changeOrigin: true,
        // pathRewrite: { '^/': '/' }
      }
    }
  },

}
