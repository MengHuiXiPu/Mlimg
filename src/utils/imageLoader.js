
/**
 * @description: 将base64转换为blob对象
 * @param {*} base64 
 * @type {string} MIME 类型
 * @returns 
 */
import { Message } from 'element-ui';
export function base64toBlob(base64, type = "image/jpeg") {
  const binaryString = window.atob(base64);
  const length = binaryString.length;
  const arrayBuffer = new ArrayBuffer(length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  return new Blob([arrayBuffer], { type:  type}); // 根据实际情况设置 MIME 类型
}
/**
 * 
 */
export default class ImageLoader {
  constructor() {
    this.catch = new Map()
  }
  /**
   * 
   * @param {Promise} request : 加载图片的方法调用，返回Promise
   * @param {Object} params 
   * @param {string} catchKey : 作为缓存的key
   */
  async loadImage(request, params = {}, catchKey) {
    if(!catchKey) {
      catchKey = Object.values(params).join('_')
    }
    if(this.catch.has(catchKey)){
      const catchValue = this.catch.get(catchKey)
      // return window.URL.createObjectURL(catchValue);
      return catchValue
    }
    try {
      const resoponse = await request(params)
      if(resoponse.code !== 0) {
        return Message.error(response.msg || response.message)
      }
      // 转为二进制
      // const blobObject = base64toBlob(resoponse.data)
      // 加入catch
      // this.catch.set(catchKey, blobObject)
      // 创建url
      // const url = window.URL.createObjectURL(blobObject);
      const url = `data:image/png;base64,${resoponse.data}`
      this.catch.set(catchKey, url)
      
      return url
    } catch (error) {
      console.log(error)
    }
  }
}