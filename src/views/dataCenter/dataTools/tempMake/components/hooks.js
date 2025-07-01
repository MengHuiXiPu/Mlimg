import { useMagicKeys, useActiveElement } from '@vueuse/core';
import { watch, ref } from "vue";
import { PointerEvent } from 'leafer-ui';
/**
 * @description 监听键盘delete,backspace，删除画布上的元素
 * @param {*} app  leafer app 实例 
 */
export const useDeleteEle = (callback) => {
  const keys = useMagicKeys();
  const isFocusOnInput = () => {
    // const activeElement = useActiveElement()
    const activeElement = document.activeElement;
    return (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    );
  };
  const removeTarget = () => {
    if (isFocusOnInput()) {
      return; // 如果焦点在输入框中，不执行删除操作
    }
    callback && callback()
  }
  // 监听键盘事件
  watch([keys.delete, keys.backspace], removeTarget)
}

/**
 * 鼠标移动显示x，y 坐标的 tooltip
 * @param {*} frame 
 */
export const usePointerPosTooltip = (frame) => {
  // 是否显示 tootip
  const showTooltip = ref(false);
  const tooltipX = ref(0);
  const tooltipY = ref(0);
  // 控制位置
  const tooltipStyle = ref({});
  // 监听鼠标移动事件
  const throttledMouseMove = (event) => {
    const { x, y } = event // 获取鼠标在 Frame 上的坐标
    // 获取鼠标在画布上的坐标
    const localPos = event.getLocalPoint();
    // console.log('Frame 局部坐标:', localPos.x, localPos.y)
    // 更新 Tooltip 的坐标
    tooltipX.value = localPos.x.toFixed();
    tooltipY.value = localPos.y.toFixed();

    // 更新 Tooltip 的位置
    tooltipStyle.value = {
      left: `${x + 10}px`, // 稍微偏移，避免 Tooltip 遮挡鼠标
      top: `${y + 10}px`,
    };
  }
  frame.on(PointerEvent.ENTER, () => {
    // 显示 Tooltip
    showTooltip.value = true;
  })
  frame.on(PointerEvent.MOVE, throttledMouseMove)
  // 当鼠标移出 Frame 时隐藏 Tooltip
  frame.on(PointerEvent.LEAVE, () => {
    showTooltip.value = false;
  });
  return {
    showTooltip,
    tooltipX,
    tooltipY,
    tooltipStyle
  }
}