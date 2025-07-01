import { reactive, computed, onBeforeUnmount } from "vue";
import { axios } from '@/utils/request';
import { useWebSocket } from '@vueuse/core';
import { message as $message } from '@/utils/resetMessgae';
import { PLRUNSTATUS } from "@pipeline/Editor/common/enums";
// import Emitter from "@pipeline/Editor/util/channel.js";

const state = reactive({
  pipelineId: null,
  pipelineType: "",  // group/scheme: 对应算子组和方案
  debuging: false,  // 标识当前pipeline是否处在运行调试状态之中
  loadingText: "",  //存在时，会显示覆盖pipeline编辑器的loading
  debugResult: [], //调试结果
  envConfig: {  //运行环境配置项
    customImageId: '',
    pipelineInferTaskConfigId: '', //方案关联的配置id
    computeEngineType: 1,
    coreSize: 2,
    memorySize: 4,
    gpuSize: 1,
    videoMemorySize: 4,
  },
  /**
   * 根据图片路径加载图片
   * key: path
   * value: 
   */
  uploadImgMap: {},
  podInfo: {},  //服务逻辑修改为： 每开始一次调试，都需要动态启动容器，前端根据返回的容器信息，动态创建websocket，并拉取该容器的日志
})
// websocket 实例
let socketInstance = null

export function useSetState(key, value) {
  if (key === "envConfig") {
    Object.assign(state.envConfig, value)
    return
  }
  state[key] = value
}
// export function resetEnvConf() {
//   Object.assign(state.envConfig, {
//     customImageId: '',
//     pipelineInferTaskConfigId: '', //方案关联的配置id
//     computeEngineType: 1,
//     coreSize: 2,
//     memorySize: 4,
//     gpuSize: 1,
//     videoMemorySize: 4,
//   })
// }

export function useGetState(key) {
  return computed(() => state[key])
}

export function useSocketInstance() {
  return socketInstance
}

export function useSetSocketInstance(instance) {
  socketInstance = instance
}
/**
 * @decription 调用启动websocket pod的接口，启动后后端会返回port，此时再创建socket连接，并返回socket实例
 */
export async function useInitWebsocket() {
  // if (socketInstance && socketInstance.status == "OPEN") { //socket连接已创建，且是open状态
  //   return socketInstance
  // }
  const noop = () => { }
  let onMessageCallback = noop
  let url = null
  // const urlDev = 'ws://10.120.200.35:30053'
  useSetState('loadingText', "正在启动调试服务...")
  // 清空podInfo
  useSetState('podInfo', {})
  return new Promise(async (resolve, reject) => {
    try {
      // 先启动pod
      const podRes = await axios({
        url: `/api/v1/pipelinecenter/pipelineInstance/start/${state.pipelineId}`,
        method: 'post',
      })
      if (!podRes || podRes.code != 0) {
        useSetState('loadingText', "")
        reject()
        return
      }
      useSetState('podInfo', {
        ...podRes.data?.podInfo,
        // name: podRes.data?.podInfo?.name, //目前使用到name来获取日志，port来创建webscoket连接
        port: podRes.data?.port
      })
      // 开发环境使用urlDev
      if (process.env.NODE_ENV === 'development') {
        url = `ws://10.120.200.35:${podRes.data?.port}`
      } else {
        url = `ws://${location.hostname}:${podRes.data?.port}`
      }
      // 创建socket连接
      const { status, data, send, open, close, ws } = useWebSocket(url, {
        onMessage(ws, event) {
          // console.log('接收到消息eventdata:', event.data);
          // console.log('接收到消息data:', data);
          const res = JSON.parse(event.data);
          // 处理通用异常
          if (res.status === "error" || res.status < PLRUNSTATUS.END) {
            // 搞了专项，但错误码错误信息仍然毫无规范
            $message.error(res.message || res.msg)
            // 引擎端运行出现异常，代表本次调试已结束
            decoratorClose() //关闭socket连接
          }
          // 处理通用完成
          if (res.status === PLRUNSTATUS.END) {
            $message.success("pipeline运行结束")
            decoratorClose()
          }
          onMessageCallback(res)
        },
        onError(ws, event) {
          $message.error("useInitWebsocket Error")
          console.log('WebSocket error:', ws, event);
          useSetState('loadingText', "")
          reject()
        },
        // 因为建立连接是异步的，需要在确保连接建立后，resolve
        onConnected(ws) {
          useSetState('loadingText', "")
          resolve()
        }
      })
      // 封装的send，带有回调函数，会被ws的onMessage事件回调执行
      let decoratorSend = function (params, callback = noop) {
        onMessageCallback = callback || noop
        send(params)
      }
      let decoratorClose = function (callback) {
        // 关闭socket
        close()
        // 监听 WebSocket 的 onclose 事件,在关闭事件触发后,执行回调函数
        // 但是目前执行发现，在执行close方法后就拿不到ws对象了，暂时使用settimeout延时
        // if (ws.value && callback) {
        //   ws.value.onclose = (event) => {
        //     callback && callback(event); // 执行回调
        //   };
        // }
        setTimeout(() => {
          // 全局状态改为非调试中，延时是因为日志那里watch到debuging为false后会再最后请求一遍日志，以保证能拿到全部日志（包含容器被关闭的日志）
          useSetState("debuging", false)
          // Emitter.on("wsClosed")
          callback && callback()
        }, 500)

      }
      // 暴露给store
      useSetSocketInstance({
        status,
        response: data,
        send,   //ws的原始send
        decoratorSend,
        open,
        close,
        decoratorClose,
      })
      // 部署后发现websocket没有断开的情况出现，这里手动调用关闭
      onBeforeUnmount(() => {
        close()
      })
    } catch (error) {
      $message.error("Connect WebSocket Error")
      console.log(error)
      reject(error)
    }
  })
}

// run pipeline结果相关
export function useProvideDebugResult(debugResult = []) {
  state.debugResult = debugResult
  // [{
  //   "version": "1.0.0",
  //   "guid": "215",
  //   "descriptors": "TVM_DATAS_CALLBACK",
  //   "timestamp": 15,

  //   "msg": "sucess",
  //   "status": 1,
  //   "tvm_modules": {
  //     "134_imread": {
  //       "run_status": 0,
  //       "run_step": 0,
  //       "runtime_ms": 248,
  //       "output": {
  //         "dst": {
  //           "data": "/data/pipeline/template/templateId215/debug/pipeline/dump/modu_134/15_1716963262283.jpg",
  //           "shape[0]": 3672,
  //           "shape[1]": 5496,
  //           "shape[2]": 3,
  //           "data_width": 2
  //         }
  //       },
  //       "input": {
  //         "filename": "/data/pipeline/template/templateId215/debug/pipeline/upload/1716963262283_input.jpg",
  //         "flag": 1
  //       },
  //       "init": {}
  //     },
  //     "1400_segmentation": {
  //       "output": {
  //         "imgOut": {
  //           "data": "templateId343/debug/pipeline/dump/modu_1400/54bdb4cb-d8a4-4cc2-8a1e-e99e5641e92c_1726022447909.jpg",
  //           "shape[1]": 623,
  //           "shape[0]": 779,
  //           "shape[2]": 3,
  //           "data_width": 2
  //         },
  //         "imgclass": {
  //           "data": "templateId343/debug/pipeline/dump/modu_1400/54bdb4cb-d8a4-4cc2-8a1e-e99e5641e92c_1726022447907.jpg",
  //           "shape[1]": 224,
  //           "shape[0]": 224,
  //           "shape[2]": 3,
  //           "data_width": 2
  //         },
  //         "iModuStatus": 2899
  //       },
  //       "run_status": 0,
  //       "runtime_ms": 80,
  //       "run_step": 4
  //     },
  //   }
  // },
  // {
  //   "version": "1.0.0",
  //   "guid": "215_10",
  //   "descriptors": "TVM_DATAS_CALLBACK",
  //   "timestamp": 15,

  //   "msg": "sucess",
  //   "status": 1,
  //   "tvm_modules": {
  //     "134_imread": {
  //       "run_status": 0,
  //       "run_step": 0,
  //       "runtime_ms": 248,
  //       "output": {
  //         "dst": {
  //           "data": "/data/pipeline/template/templateId215/debug/pipeline/dump/modu_134/15_1716963262283.jpg",
  //           "shape[0]": 3672,
  //           "shape[1]": 5496,
  //           "shape[2]": 3,
  //           "data_width": 2
  //         }
  //       },
  //       "input": {
  //         "filename": "/data/pipeline/template/templateId215/debug/pipeline/upload/1716963262283_input.jpg",
  //         "flag": 1
  //       },
  //       "init": {}
  //     }
  //   }
  // },]
}
export function useDebugResult() {
  return computed(() => state.debugResult)
}

/**
 * 只读状态，目前仅在调试中一种情况适用，后续可扩展该方法
 */
export const readOnly = computed(() => state.debuging)