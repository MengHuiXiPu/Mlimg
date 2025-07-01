<template>
  <a-select 
    :value="value" 
    @change="handleChange"
    v-bind="$attrs"
    showSearch
    :filter-option="filterOption"
    :style="{'width': width }"
    placeholder="请选择算法"
  >
    <a-select-option v-for="item in algorithmLists" :key="item.id">{{ `${item.imageName}-${item.tagType}` }}</a-select-option>
  </a-select>
</template>

<script>
/**
 * 镜像下拉选择，数据源来自菜单镜像管理列表, 镜像数量有限，暂不做懒加载
 */
import { getImageManageList } from '@/api/imageManage.js'
export default {
  name: 'image-select',
  data() {
    return {
      // 算法列表
      algorithmLists: []
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
    }
  },
  methods: {
    loadData() {
      getImageManageList({
        limit: 9999,
        pageNo: 1,
        addType: 1,
      }).then(res => {
        if(res.code == 0) {
          this.algorithmLists = res.data?.records || []
        }
      })
    },
    // 使支持v-model
    handleChange(value) {
      this.$emit('input', value)
      const allData = this.algorithmLists.find(algorithm => algorithm.id ==value) || {}
      this.$emit('change', allData);
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