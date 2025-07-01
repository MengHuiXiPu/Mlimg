/*
 * @Author: lichao.sun 
 * @Date: 2024-04-10 11:00:24 
 * @Last Modified by: lichao.sun
 * @Last Modified time: 2024-04-18 18:01:47
 * @description: tag输入框，因a-select tag模式下不支持输入重复值开发
 */
<template>
  <div :class="['custom-tag-input', { disabled }]" ref="inputWrapRef" @click="focusInput" :tabindex="disabled ? -1 : 0">
    <div class="tags-container">
      <a-tag
        v-for="tag in tags"
        :key="tag.id"
        :closable="!disabled"
        @close="removeTag(tag.id)"
      >
        {{ tag.text }}
      </a-tag>
      <div
        v-if="!disabled"
        class="input-tag"
        contenteditable="true"
        ref="inputRef"
        @keydown="handleKeydown"
        @input="handleInput"
        @blur="resetInput"
      ></div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, nextTick } from 'vue';
import { message as $message } from '@/utils/resetMessgae'

export default {
  name: 'TagInput',
  props: {
    // 显示的值 支持v-model
    value: {
      type: Array,
      default: () => []
    },
    // 
    disabled: {
      type: Boolean,
      default: false
    },
    // 输入类型，默认是string，支持number类型校验
    inputType: {
      validator: function (value) {
        return ['string', 'number'].includes(value)
      },
      default: 'string'
    }
  },
  setup(props, { emit }) {
    // 为values数组添加id
    const tags = ref(props.value.map(text => ({ id: Date.now() + Math.random(), text })));
    const inputRef = ref(null);
    const inputWrapRef = ref(null);
    let tagIdCounter = tags.value.length;

    const addTag = () => {
      const inputValue = inputRef.value.innerText.trim();
      if(!inputValue) return
      if(props.inputType ==='string') {
        tags.value.push({ id: tagIdCounter++, text: inputValue });
        emit('input', tags.value.map(tag => tag.text)); // 触发 v-model 更新
        emit('change', tags)
        inputRef.value.innerText = ''; // 清空输入框
      }
      if(props.inputType ==='number') { //必须校验是number类型才添加到tags里
        if(isNaN(Number(inputValue))) {
          $message.info("该参数只能为数值")
          return
        }
        tags.value.push({ id: tagIdCounter++, text: Number(inputValue) });
        emit('input', tags.value.map(tag => tag.text)); // 触发 v-model 更新
        emit('change', tags)
        inputRef.value.innerText = ''; // 清空输入框
      }
    };

    const removeTag = (id) => {
      tags.value = tags.value.filter(tag => tag.id !== id);
      emit('input', tags.value.map(tag => tag.text)); // 触发 v-model 更新
      emit('change', tags)
    };

    const handleInput = () => {
      // 动态调整输入框宽度或其他处理
    };
    // blur
    const resetInput = () => {
      addTag()
      inputRef.value.innerText = '';
      inputWrapRef.value.classList.remove('focused');
      // emit blur使得表单等可以校验
      emit('blur')
    };

    const focusInput = () => {
      if(props.disabled) return
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus();
          inputWrapRef.value.classList.add('focused');
        }
      });
    };
    const handleKeydown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addTag();
      } else if (event.key === 'Backspace' && inputRef.value.innerText === '') {
        event.preventDefault();
        if (tags.value.length > 0) {
          removeTag(tags.value[tags.value.length - 1].id);
        }
      }
    };

    watch(() => props.value, (newValue) => {
      tags.value = newValue.map(text => ({ id: Date.now() + Math.random(), text }));
      tagIdCounter = tags.value.length;
    });

    onMounted(() => {
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.addEventListener('paste', (event) => {
            event.preventDefault();
            const text = (event.clipboardData || window.clipboardData).getData('text');
            document.execCommand('insertText', false, text);
          });
        }
      });
    });

    return {
      tags,
      inputRef,
      inputWrapRef,
      addTag,
      removeTag,
      handleKeydown,
      handleInput,
      resetInput,
      focusInput,
    };
  },
};
</script>

<style scoped>
.custom-tag-input {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  border: 1px solid #d9d9d9;
  background-color: #fff;
  padding: 4px;
  border-radius: 4px;
  cursor: text;
}
.custom-tag-input.disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}
.custom-tag-input.focused {
  border: 1px solid #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
.tags-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.input-tag {
  display: inline-block;
  min-width: 100px;
  margin-left: 8px;
  outline: none;
  white-space: nowrap;
}
.input-tag[contenteditable]:empty:before {
  content: attr(placeholder);
  color: #ccc;
}
</style>
