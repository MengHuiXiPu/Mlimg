<template>
  <div>
    <template v-for="(tag) in tags">
      <a-tag
        :key="tag.id"
        :closable="true"
        :class="tag.judgeStatus === judgeStatus && 'selected'"
        @close="handleClose(tag)"
        @click="reviewCode(tag)"
      >
        {{ tag.judgeStatus }}
      </a-tag>
    </template>
    <a-input
      v-if="inputVisible"
      v-model="inputValue"
      ref="input"
      type="text"
      size="small"
      :style="{ width: '78px' }"
      @change="handleInputChange"
      @keyup.enter="handleInputConfirm"
    />
    <a-tag v-else style="background: #fff; borderStyle: dashed;" @click="showInput">
      <a-icon type="plus" /> 添加Code
    </a-tag>
  </div>
</template>
<script>
import {
  esdReview
} from '@/api/appCenter'
export default {
  props: {
    taskId: {
      type: Number,
      default: 0
    },
    judgeStatus: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      tags: [],
      inputVisible: false,
      inputValue: '',
    };
  },
  computed: {
    taskIds () {
      return this.taskId
    }
  },
  watch: {
    taskIds: {
      handler () {
        this.getReviewCode()
      },
      immediate: true
    }
  },
  methods: {
    async getReviewCode () {
      const params = {
        taskId: this.taskIds
      }
      const res = await esdReview.getReviewCode(params)
      if (res.code !== 0) return false
      this.tags = res.data
    },
    async handleClose (removedTag) {
      const res = await esdReview.delReviewCode(removedTag.id)
      if (res.code !== 0) return false
      this.$message.success('删除成功')
      this.getReviewCode()
    },
    showInput () {
      this.inputVisible = true
      this.$nextTick(function() {
        this.$refs.input.focus()
      })
    },
    handleInputChange (e) {
      this.inputValue = e.target.value
    },
    async handleInputConfirm () {
      const inputValue = this.inputValue
      if (this.tags.filter(tag => tag.judgeStatus === inputValue).length > 0) return false
      const params = {
        taskId: this.taskIds,
        judgeStatus: this.inputValue
      }
      const res = await esdReview.addReviewCode(params)
      if (res.code !== 0) return false
      this.getReviewCode()
      this.inputValue = ''
      this.inputVisible = false
    },
    reviewCode (tag) {
      console.log(tag)
      this.$emit('reviewCode', tag.judgeStatus)
    }
  },
}
</script>

<style lang="less" scoped>
.ant-tag{
  cursor: pointer;
  background: #fff;
  margin-bottom: 10px;
  padding: 5px 10px;
  &.selected{
    background: #0072C6;
    color: #fff;
    /deep/ i{
      color: #fff;
    }
  }
}
</style>
