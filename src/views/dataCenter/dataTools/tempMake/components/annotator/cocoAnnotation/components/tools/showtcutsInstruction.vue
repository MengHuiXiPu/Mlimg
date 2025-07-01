<template>
  <div class="tool-btn-wrap">
    <el-popover placement="right" title="快捷键说明" width="400" trigger="click">
      <ul class="menu">
        <li>Select Tool <span class="shortcut"><kbd>S</kbd></span></li>
        <li>Brush Tool <span class="shortcut"><kbd>B</kbd></span></li>
        <li>Line Tool <span class="shortcut"><kbd>A</kbd></span></li>
        <!-- <li>BBox Tool <span class="shortcut"><kbd>R</kbd></span></li> -->
        <li>Polygon Tool <span class="shortcut"><kbd>V</kbd></span></li>
        <li>Eraser Tool <span class="shortcut"><kbd>E</kbd></span></li>
        <li>Center Image <span class="shortcut"><kbd>C</kbd></span></li>
        <li>Increase Radius <span class="shortcut"><kbd>[</kbd></span></li>
        <li>Decrease Radius <span class="shortcut"><kbd>]</kbd></span></li>
        <li>Remove Polygon/BBox <span class="shortcut"><kbd>ESC</kbd></span></li>
        <li>copy annotation <span class="shortcut"><kbd>Ctrl</kbd> + <kbd>c</kbd></span></li>
        <li>Save <span class="shortcut"><kbd>Ctrl</kbd> + <kbd>S</kbd></span></li>
        <li>Zoom Canvas <span class="shortcut"><kbd>Ctrl</kbd> + <kbd>Wheel</kbd></span></li>
        <li>Scroll Photo up and down <span class="shortcut"><kbd>Alt</kbd> + <kbd>Wheel</kbd></span></li>
        <li>Scroll Photo left and right <span class="shortcut"><kbd>Shift</kbd> + <kbd>Wheel</kbd></span></li>
        <!-- 添加更多快捷键说明 -->
      </ul>
      <i class="el-icon-discover" :style="{ color: iconColor, fontSize: '22px', marginBottom: '8px' }" slot="reference"
        v-tooltip.right="'快捷键说明'" />
    </el-popover>
  </div>
</template>
<script>
import button from "../../mixins/toolBar/button";
export default {
  mixins: [button],
  data() {
    return {

    }
  },
  methods: {

  },
}
</script>
<style lang="less" scoped>
.tool-btn-wrap {
  i {
    cursor: pointer;
  }
}

.menu {
  list-style-type: none;
  padding: 0;
  margin: 0;

  li {
    padding: 3px;
    display: flex;
    justify-content: space-between;
  }

  .shortcut kbd {
    background-color: #ddd;
    padding: 3px 5px;
    border-radius: 3px;
  }
}
</style>