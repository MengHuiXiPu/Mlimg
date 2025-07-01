<template>
  <a-select 
    :value="value" 
    @change="handleChange"
    v-bind="$attrs"
    v-on="$listeners"
    showSearch
    :filter-option="filterOption"
    :style="{'width': width }"
    placeholder="请选择镜像"
  >
    <a-select-option v-for="item in imageLists" :key="item.id">{{ item.name }}</a-select-option>
  </a-select>
</template>

<script>
/**
 * 镜像下拉选择，数据源来自菜单镜像管理列表, 镜像数量有限，暂不做懒加载
 */
import { newImage } from '@/api/imageManage.js'
export default {
  name: 'image-select',
  data() {
    return {
      // 镜像列表
      imageLists: []
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
    // 查询镜像列表的过滤参数
    searchParams: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    loadData() {
      newImage.getImageList({
        limit: 999,
        pageNo: 1,
        ...this.searchParams,
        
      }).then(res => {
        if(res.code == 0) {
          this.imageLists = res.data?.records || []
        }
      })
    },
    // 使支持v-model
    handleChange(value) {
      this.$emit('input', value)
      const target = this.imageLists.find(image => image.id === value)
      this.$emit('getAllData', target || {})
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