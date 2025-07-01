<template>

  <div id="app" :class="{ 'iframe-open': isIframeOpen }">
    <a-config-provider :locale="locale" style="height:100%">
      <router-view />
    </a-config-provider>
    <MiniDataset :is-minimized="isMinimized" @openAddEdit="openAddEditDialog" />
    <addEditDialog
      ref="addEditDialog"
      :parentData.sync="parentData"
      :dataSetTitle="dataSetTitle"
      :dlTagTypeOpt.sync="dlTagTypeOpt"
      :pagination="pagination"
    ></addEditDialog>
  </div>

</template>

<script>
import zh_CN from 'ant-design-vue/lib/locale-provider/zh_CN'
import { isIframeOpen } from '@/utils'
import MiniDataset from '@/views/dataCenter/dataMrg/components/MiniDataset';
import {mapGetters} from 'vuex'
// import AddEditDialog from '@/views/dataCenter/dataMrg/addEditDialog'
export default {
  components: {
    MiniDataset,
    // AddEditDialog
    addEditDialog: () => ({ component: import('@/views/dataCenter/dataMrg/addEditDialog') }),
  },
  computed: {
    // ...mapState({
    //   // 从state里面接收isMinimized的值
    //   isMinimized: state => state.app.isMinimized
    // })
    ...mapGetters([
      'visible',
      'isMinimized',
      'parentData',
      'dataSetTitle',
      'dlTagTypeOpt',
      'total',
      'pagination',
    ]),
  },
  // provide() {
  //   return {
  //     addEditInstance: this.addEditInstance,
  //   };
  // },
  data () {
    return {
      locale: zh_CN,
      isIframeOpen,
      // isMinimized: false,
    }
  },
  // beforeMount() {
  //   this.addEditInstance = this.$refs.addEditDialog,
  //   this.$nextTick(() => {
  //     // this.addEditInstance = this.$refs.addEditDialog;
  //     this.$provide('addEditInstance', this.addEditInstance);
  //   });
  // },
  methods: {
    // 恢复最小化
    openAddEditDialog() {
      // this.isMinimized = false;
      this.$store.commit("SET_ISMINIMIZED", false)
      // this.visible - true;
      // this.visible = !this.visible;
      // 
      this.$store.commit("SET_VISIBLE", !this.visible)
      this.$router.push({
        path: "/dataCenter/dataMrg/index",
        // query: { id: rowData.id, dlType: rowData.dlType }//跳转到对应路径并传递参数
      })
    }
  }
}
</script>

<style lang="less">
#app {
  width: 100%;
  height: 100%;
  display: flex;
  font-family: '微软雅黑', sans-serif;
  &.iframe-open {
    padding: 20px 16px 0;
  }
}
</style>
