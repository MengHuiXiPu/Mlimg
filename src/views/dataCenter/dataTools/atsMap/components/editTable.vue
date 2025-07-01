<template>
  <div class="edit-table-wrapper">
    <div class="action-btns">
      <a-button type="primary" class="btn-item" size="medium" @click = "doUpload" v-show="!editable">重新上传</a-button>
      <a-button type="primary" class="btn-item" size="medium" @click = "doEditTable" v-show="!editable">编辑</a-button>
      <a-button type="primary" class="btn-item" size="medium" @click = "doSave" v-show="editable" :loading="saving">保存</a-button>
      <a-button  class="btn-item" size="medium" @click = "doCancel" v-show="editable">取消</a-button>
    </div>
    <a-table :columns="columns" :data-source="tableData" :pagination="false" bordered>
      <div :slot="col.dataIndex" slot-scope="text, record, index"  v-for="col in columns" :key="col.key">
        <!-- 自定义单元格内容 -->
        <template v-if="editable">
          <a-input  :value="text" @change="e => updateTableData(e.target.value, record,index, col)"/>
        </template>
        <template v-else>
          {{ text }}
        </template>
      </div>
    </a-table>
  </div>
  
</template>

<script>
import { Empty } from 'ant-design-vue';
import { saveCsv, getTaskDeteil, uploadCsv } from "@/api/atsMap.js";
import { saveAs } from "file-saver";
import cloneDeep from "lodash/cloneDeep";

export default {
  data() {
    return {
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
      columns: [],
      tableData: [],
      // 是否可变编辑标志位
      editable: false,
      saving: false,
      backupTableData: null, // 备份原始表格数据, 用于在取消编辑时还原
    }
  },
  props: {
    taskId: {
      type: Number | String,
      default: 0
    },
    /**
     * 当前激活的tab页
     * 21: 产品规则 22: panel-white配置 23: panel-black配置
     */
    activeKey: {
      type: String,
      default: ''
    },
    csvData: {
      type: Object,
      default: () => ({})
    },
  },
  methods: {
    /**
     * 触发编辑，cell change后，更新表格数据
     * index: 行索引
     */
    updateTableData(val, row, index, col) {
      // console.log(val, row, index, col)
      // this.tableData[index][col.dataIndex] = val
      row[col.dataIndex] = val
      // console.log('tableData', this.tableData)
    },
    // 重新上传
    doUpload() {
      // console.log('重新上传')
      this.$emit('reUpload')
    },
    // 保存编辑后的数据
    doSave() {
      this.saving = true
      // 参考 initTable 方法，逆向将 columns，tableData 转为 csvData，即包含 rows 和 header
      const csvData = {
        header: this.columns.map(item => item.title),
        rows: this.tableData.map(row => {
          const rowData = [];
          this.columns.forEach(column => {
            rowData.push(row[column.dataIndex]);
          });
          return rowData;
        })
      }
      saveCsv(this.taskId, {
        csv: csvData,
        step: this.activeKey
      }).then(res => {
        this.saving = false
        if (res.code == 0) {
          this.editable = false
          this.$message.success('保存成功')
          // 备份 tableData
          this.backupTableData = Object.freeze(JSON.parse(JSON.stringify(this.tableData)))
        }
      }).catch(err => {
        this.saving = false
        console.err('saveCsv', err)
        // this.$message.error('保存失败')
      })
    },
    doEditTable() {
      this.editable = true
    },
    doCancel() {
      // this.tableData = cloneDeep(backupTableData)
      this.tableData = JSON.parse(JSON.stringify(this.backupTableData))
      this.editable = false
    },
    /**
     * @public
     * @description 从 csvdata 中解析出表格的列和行数据，从而初始化渲染表格
     */
    initTable() {
      // 先备份原始csvData，取消编辑时还原
      this.columns = this.csvData.header.map((item, index) => {
        return {
          title: item,
          dataIndex: item,
          key: item + index,
          scopedSlots: { customRender: item },
        }
      })
      this.tableData = this.csvData.rows.map(row => {
        const rowData = {};
        this.csvData.header.forEach((header, index) => {
          rowData[header] = row[index];
        });
        return rowData;
      })
      // this.backupTableData = cloneDeep(this.tableData)
      this.backupTableData = Object.freeze(JSON.parse(JSON.stringify(this.tableData)))
    }
  },
  created() {
    this.initTable();
  }
}
</script>

<style lang="less" scoped>
.edit-table-wrapper {
  .action-btns {
    margin-bottom: 10px;
    text-align: right;
    .btn-item {
      margin-left: 10px;
    }
  }
}
</style>