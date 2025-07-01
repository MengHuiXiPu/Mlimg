import Vue from 'vue';
import UploadBoxComponent from './uploadBox.vue';

const UploadBoxConstructor = Vue.extend(UploadBoxComponent);

let boxInstance = null
function showUploadBox(data) {
  if(boxInstance) {
    // 存在实例，且存在data，则只添加任务到任务队列
    if(data) {
      boxInstance.createTask(data)
    }
    return boxInstance
  }
  const instance = new UploadBoxConstructor({
    el: document.createElement('div'),
  });

  document.body.appendChild(instance.$el);

  instance.show(data);

  instance.$close = function () {
    instance.visible = false;
    instance.$nextTick(() => {
      document.body.removeChild(instance.$el);  // 从DOM中移除元素
      instance.$destroy();  // 销毁Vue实例
      boxInstance = null
    });
  }
  boxInstance = instance
  return instance
}

const UploadBoxPlugin = {
  install(Vue) {
    Vue.prototype.$uploadBox = showUploadBox;
  },
};

export default UploadBoxPlugin;
