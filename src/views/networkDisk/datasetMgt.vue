<template>
  <div>
    <show-data-set
      :defaultGrid="true"
      :orderCustom="true"
      :contextMenus="contextMenus"
      :sortable="sortable">
    </show-data-set>
  </div>
</template>

<script>
import ShowDataSet from "@/components/ShowDataSet/ShowDataSet";

export default {
  name: 'File',
  components: {ShowDataSet},
  data() {
    return {
      sortable: {
        prop: 'name', order: 'ascending'
      },
      contextMenus: [ // contextmenuClick
        { label: '查看', operation: 'viewMode' ,child: [
            { iconClass: this.grid?'':'menu-point', label: '列表', operation: 'vmode-list'},
            { iconClass: this.grid?'menu-point':'', label: '缩略图', operation: 'vmode-grid'},
          ]
        },
        { label: '排列方式', operation: 'arrangement' ,child: [
            { label: '名称', operation: 'orderName', orderProp: 'name'},
            { label: '大小', operation: 'orderSize', orderProp: 'size'},
            { label: '日期', operation: 'orderUpdateDate', orderProp: 'updateDate'},
          ]
        },
        { label: '刷新', operation: 'refresh'},
        { divider: true, operation: 'divider' },
        { label: '新建', operation: 'create' ,child: [
            { label: '文件夹', operation: 'createFolder', iconClass: 'folder'},
            { divider: true, operation: 'divider' },
            { label: '文本', operation: 'createTextFile', iconClass: 'file-txt'},
            { label: '思维导图', operation: 'createMinderFile', iconClass: 'file-mind'},
            { label: '流程图', operation: 'createDrawioFile', iconClass: 'file-drawio'},
            { label: 'Word', operation: 'createWordFile', iconClass: 'file-word'},
            { label: 'Excel', operation: 'createExcelFile', iconClass: 'file-excel'},
            { label: 'PPT', operation: 'createPPTFile', iconClass: 'file-ppt'},
          ]
        },
        { divider: true, operation: 'divider' },
        { label: '写文章', operation: 'createMarkdownFile'},
      ]
    }
  },
}
</script>

<style lang="scss" scoped>

</style>
