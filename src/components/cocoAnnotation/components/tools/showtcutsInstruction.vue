<template>
  <div class="tool-btn-wrap">
    <el-popover
      placement="right"
      title="快捷键说明"
      width="400"
      trigger="click"
    >
      <ul class="menu">
        <li>
          {{ $t("dataCenter.selectTool")
          }}<span class="shortcut"><kbd>Q</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.magicWand")
          }}<span class="shortcut"><kbd>E</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.brush")
          }}<span class="shortcut"><kbd>T</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.bboxTool")
          }}<span class="shortcut"><kbd>W</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.polygonTool")
          }}<span class="shortcut"><kbd>R</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.eraserTool")
          }}<span class="shortcut"><kbd>Y</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.centerButton")
          }}<span class="shortcut"><kbd>Shift</kbd> + <kbd>C</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.increaseRadius")
          }}<span class="shortcut"><kbd>1</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.decreaseRadius")
          }}<span class="shortcut"><kbd>2</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.removePolygonBBox")
          }}<span class="shortcut"><kbd>ESC</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.previousPhoto")
          }}<span class="shortcut"><kbd>A</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.nextPhoto")
          }}<span class="shortcut"><kbd>D</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.save") }}<span class="shortcut"><kbd>S</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.showHideAnnotations")
          }}<span class="shortcut"><kbd>C</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.zoomCanvas")
          }}<span class="shortcut"><kbd>Ctrl</kbd> + <kbd>Wheel</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.scrollPhotoUpDown")
          }}<span class="shortcut"><kbd>Alt</kbd> + <kbd>Wheel</kbd></span>
        </li>
        <li>
          {{ $t("dataCenter.scrollPhotoLeftRight")
          }}<span class="shortcut"><kbd>Shift</kbd> + <kbd>Wheel</kbd></span>
        </li>
        <!-- 添加更多快捷键说明 -->
      </ul>
      <div class="reder" slot="reference">
        <a-icon type="question-circle" theme="filled" />
        <span class="text-desc">{{ $t("dataCenter.shortcutKeys") }}</span>
      </div>
    </el-popover>
  </div>
</template>
<script>
import button from "../../mixins/toolBar/button";
export default {
  mixins: [button],
};
</script>
<style lang="less" scoped>
.tool-btn-wrap {
  position: absolute;
  bottom: 0;
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
.reder {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  cursor: pointer;
  color: #1890ff;
}
.text-desc {
  font-size: 12px;
  margin-left: 5px;
}
</style>
