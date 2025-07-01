<template>
  <div class="toolbar-wrappper">
    <a-tooltip title="视口居中">
      <el-button class="toolbar-btn" icon="el-icon-aim" size="mini" type="plain" @click="zoomChange('fit')"></el-button>
    </a-tooltip>
    <a-tooltip title="画布缩放比例设置">
      <el-input-number size="mini" v-model="zoomValue" :step="0.1" @change="zoomChange"></el-input-number>
    </a-tooltip>
  </div>
</template>

<script>
import { useGetApp } from "../store.js";
import { ZoomEvent } from 'leafer-ui'
export default {
  data() {
    return {
      zoomValue: 100,
    }
  },
  methods: {
    zoomChange(value) {
      const app = useGetApp()
      if (value === 'fit') {
        app.tree.zoom('fit', 50, null, true)
      } else {
        app.tree.zoom(this.zoomValue / 100, null, null, true)
      }
      app.tree.emit(ZoomEvent.ZOOM)
    },
    bindZoomEventListener() {
      const app = useGetApp()
      this.zoomValue = Math.round(app.tree.scale * 100) //设置初始值
      // 不知道为何，这里是监听不到 app.tree.zoom("fit")的缩放事件的,只能监听到鼠标滚轮触发的 zoom 事件
      app.tree.on(ZoomEvent.ZOOM, (event) => {
        // console.log('zoom', event)
        // console.log('zoom', app.tree.scale * 100)
        this.zoomValue = Math.round(app.tree.scale * 10000) / 100
      })
    },
  },
  created() {
    this.bindZoomEventListener()
  }
}
</script>

<style lang="less" scoped>
.toolbar-wrappper {
  // border: 1px solid #ccc;
  // box-shadow: 0 0 5px #ccc;
  height: 50px;
  padding: 10px;
  .toolbar-btn {
    padding: 7px;
    margin: 0 5px;
  }
}
</style>