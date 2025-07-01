<template>
  <a-select 
    :value="value" 
    @change="handleChange"
    v-bind="$attrs"
    v-on="$listeners"
    showSearch
    :filter-option="filterOption"
    :style="{'width': width }"
  >
    <a-select-option v-for="item in datasetLists" :key="item.id">{{ item.dlName }}</a-select-option>
  </a-select>
</template>

<script>
/**
 * 数据集下拉选择，整理自原有模型训练step5中的方式，暂不做懒加载, 默认加载分类数据集
 */
 import { getDataSetList } from "@/api/dataCenter.js";
export default {
  name: 'dataset-select',
  data() {
    return {
      // 数据集列表
      datasetLists: []
    }
  },
  props: {
    // v-model的值
    value: {
      type: [String, Number],
      default: ""
    },
    width: {
      type: String,
      default: '200px'
    },
    // 分类/目标检测/分割 
    dlTagType: {
      type: String,
      default: ''
    }
  },
  methods: {
    /**
     * @public 
     * @param {*} param 
     */
    loadData(param = {}) {
      const params = {
        limit: 9999999,
        pageNo: 1,
        dlType: 1,
        dlTagType: this.dlTagType || "",
        source: 'traincenter',
        ...param
      }
      getDataSetList(params).then(res => {
        if(res.code == 0) {
          this.datasetLists = res.data?.records || []
        }
      })
    },
    // 使支持v-model
    handleChange(value) {
      this.$emit('input', value)
      const selectObj = this.datasetLists.find(dataset => dataset.id == value)
      this.$emit('getSelectObj', selectObj || {})
    },
    // 检索关键字
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    }
  },
  created () {
    this.loadData();
  },
}
</script>

<style lang="less" scoped>

</style>