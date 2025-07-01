<template>
  <a-modal
    :visible="visible"
    title="选择预测Code"
    @ok="updateSelectCode"
    @cancel="cancel"
    :maskClosable="false"
    centered
    wrapClassName="selectPredictCode"
  >
    <a-spin :spinning="loading">
      <div class="selectPredictCode-top">
        <span>选择Code:</span>
        <a-select
          v-model="selectCode"
          showSearch
          :filter-option="filterOption"
          mode="multiple"
          :maxTagCount="4"
          @deselect="delCode"
          @select="addCoode"
        >
          <a-select-option v-for="item in codeList" :key="item.code" :value="item.code">
            {{ item.code }}
          </a-select-option>
        </a-select>
      </div>
      <div class="selectPredictCode-content">
        <span>Code数量:</span>
        <div class="content">
          <div
            v-for="item in code"
            :key="item"
            class="content-item"
          >
            <span :title="item.code">{{ item.code }}</span>
            <a-input-number
              v-model="item.value"
              :min="0"
              :max="item.max"
              :precision="0"
            />
            <span style="margin-left: 20px;color: #ccc">最大：{{ item.max }}</span>
          </div>
        </div>
      </div>
    </a-spin>
  </a-modal>
</template>

<script>
import {
  OPCode
} from '@/api/appCenter'
export default {
  name: 'selectPredictCode',
  props: {
    opCodeFooterForm: {
      default: {},
      type: Object
    }
  },
  data () {
    return {
      codeList: [],
      loading: false,
      code: [],
      visible: false,
      selectCode: []
    }
  },
  watch: {
    'opCodeFooterForm.startTime': {
      handler () {
        this.code === []
      },
      deep: true
    }
  },
  methods: {
    async showModal () {
      this.selectCode = []
      this.code = []
      await this.getCodeList()
      const codeCount = this.opCodeFooterForm.codeCount
      if ( codeCount && codeCount.length > 0) {
        this.selectCode = codeCount.map(item => {
          return item.split(':')[0]
        })
        this.code = codeCount.map(item => {
          const max = this.codeList.filter(d => d.code === item.split(':')[0])[0]
          return {
            code: item.split(':')[0],
            value: Number(item.split(':')[1]),
            max: max ? max.value : ''
          }
        })
      }
      this.visible = true
    },
    async getCodeList () {
      const { taskId, setCount, type: taskType, startTime, endTime } = this.opCodeFooterForm  
      this.loading = true
      const res = await OPCode.getPredictCodeList({
        taskId,
        setCount,
        taskType,
        startTime,
        endTime
      })
      this.loading = false
      if (res.code !== 0) return false
      console.log(res)
      this.codeList = res.data.map(item => {
        return {
          code: item.split('#')[0],
          value: Number(item.split('#')[1])
        }
      })
    },
    updateSelectCode () {
      if (this.code.length === 0) {
        this.$message.warning('请设置至少一个Code')
        return false
      }
      if (this.code.filter(item => !item.value && item.value !== 0).length) {
        this.$message.warning('当前还有Code数量为空，请重试')
        return false
      }
      this.$emit('updateSelectCode', this.code.map(item => `${item.code}:${item.value}`))
      this.$emit('updatePredictCodes', this.code.map(item => item.code))
      this.visible = false
    },
    cancel () {
      this.visible = false
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    addCoode (val, option) {
      const code = this.codeList.filter(item => item.code === val)[0]
      this.code.push({
        code: val,
        value: null,
        max: code ? code.value : null
      })
    },
    delCode (val, option) {
      console.log(val, this.code.filter(item => item.code !== val))
      this.code = this.code.filter(item => item.code !== val)
    }
  }
}
</script>

<style lang="less" scoped>
.selectPredictCode{
  &-top{
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    &>span{
      margin-right: 20px;
    }
    .tcl-select{
      flex: auto
    }
  }
  &-content{
    display: flex;
    align-items: baseline;
    &>span{
      margin-right: 20px;
    }
    .content{
      &>*{
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        &>span{
          margin-right: 10px;
          width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>