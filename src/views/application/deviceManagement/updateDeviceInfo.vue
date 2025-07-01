<template>
  <div>
    <a-modal v-model="visible" title="更新设备信息" 
      @ok="handleUploadOk" @cancel="closeDialog" destroyOnClose :confirm-loading="confirmLoading"
    >
      <a-form-model
        ref="uploadForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        layout="horizontal"
        :model="formData"
      >
        <a-form-model-item label="设备名称" prop="name">
          <a-input v-model="formData.name"/>
        </a-form-model-item>
        <a-form-model-item label="设备信息" prop="deviceInfo">
          <a-input v-model="formData.deviceInfo"/>
        </a-form-model-item>
        <a-form-model-item label="位置信息" prop="locationInfo">
          <a-input v-model="formData.locationInfo"/>
        </a-form-model-item>
        <a-form-model-item label="心跳时间间隔" prop="heartbeatInterval">
          <a-input-number v-model="formData.heartbeatInterval" :min="1"/>
        </a-form-model-item>
      </a-form-model>
    </a-modal>
  </div>
</template>

<script>
import { updateDeviceInfo } from '@/api/cloud.js'
export default {
  data() {
    return {
      formData: {
        name: '',
        deviceInfo: '',
        locationInfo: '',
        heartbeatInterval: 0, //心跳时间间隔
      },
      confirmLoading: false
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 列表中的某条设备信息
    device: {
      type: Object,
      default: () => ({})
    }
  },
  watch: {
    visible(val) {
      if(val) { //初始化表单数据
        this.formData.name = this.device.name
        this.formData.deviceInfo = this.device.deviceInfo
        this.formData.locationInfo = this.device.locationInfo
        this.formData.heartbeatInterval = this.device.heartbeatInterval
      }
    }
  },
  methods: {
    async handleUploadOk() {
      try {
        const params = {
          "id": this.device.id,
          ...this.formData
        }
        this.confirmLoading = true
        const res = await updateDeviceInfo(params);
        this.confirmLoading = false
        if (res.success) {
          this.closeDialog()
          this.$emit('update-success')
          this.$message.success("更新成功");
        }else {
          this.$message.error("更新失败");
        }
      }catch{
        this.confirmLoading = false
      } 
    },
    closeDialog() {
      this.$emit('update:visible', false)
    }
  },
}
</script>

<style lang="scss" scoped>

</style>