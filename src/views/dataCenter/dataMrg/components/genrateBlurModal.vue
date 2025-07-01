<template>
    <a-modal ref="transformBlurModal" title="模糊阈值计算" :visible="blurVisible" centered @ok="handleOk" @cancel="handleCancel"
        :maskClosable="false" :destroyOnClose="true" :closable="!confirmLoading" :keyboard="!confirmLoading"
        :cancel-button-props="{ props: { disabled: confirmLoading } }"
        :ok-button-props="{ props: { disabled: confirmLoading } }" style="position: relative;">
        <a-form-model ref="ruleForm" :model="form" :rules="rules" :label-col="labelCol" :wrapper-col="wrapperCol">
            <a-form-model-item ref="imagePath" label="图片文件路径" prop="imagePath">
                <a-input v-model="form.imagePath" disabled />
            </a-form-model-item>
            <a-form-model-item label="模糊文件名" prop="blurName">
                <a-input v-model="form.blurName" />
            </a-form-model-item>
            <a-form-model-item label="非模糊文件名" prop="noBlurName" size="small">
                <a-input v-model="form.noBlurName" />
            </a-form-model-item>
            <a-form-model-item label="输出结果" prop="outputResult">
                <a-input v-model="form.outputResult" type="textarea" style="width:400px;height:320px;" />
            </a-form-model-item>
        </a-form-model>
        <div v-if="confirmLoading" class="mask" ></div>
        <a-spin :spinning="confirmLoading" :indicator="indicator" style="position:absolute;top: 50%;left: 50%;">
        </a-spin>
    </a-modal>
</template>

<script>
export default {
    props: ["blurVisible", "curImagePath"],
    data() {
        return {
            indicator: <a-icon type="loading" style="font-size: 32px" spin />,
            visible: false,
            confirmLoading: false,
            labelCol: { span: 8 },
            wrapperCol: { span: 14 },
            form: {
                imagePath: "",
                blurName: "SDF",
                noBlurName: "SFA",
                outputResult: "",
            },
            rules: {
                imagePath: [{ required: true, message: '请输入图片文件路径', trigger: 'blur' }],
                blurName: [{ required: true, message: '请输入模糊文件名', trigger: 'blur' }],
                noBlurName: [{ required: true, message: '请输入非模糊文件名', trigger: 'change' }],
                // outputResult: [{ required: true, message: '请输入输出结果', trigger: 'blur' }],
            },
        }
    },
    mounted(){
        this.visible = this.blurVisible;
        this.form.imagePath = this.curImagePath;
        console.log(this.blurVisible);
        console.log(this.curImagePath);
    },
    methods: {
        handleOk(e) {
            this.$refs.ruleForm.validate(valid => {
                if (valid) {
                    this.confirmLoading = true;
                    // setTimeout(()=>{
                    //   this.confirmLoading = false;
                    //   this.visible = false;
                    //   this.$message.success("测试集目录结构转换成功！");
                    // }, 2000);

                    // 在这里调用接口
                } else {
                    this.$message.info("必填项不能为空！");
                    return false;
                }
            });
        },
        handleCancel(e) {
            this.form.imagePath = "";
            this.form.blurName = "";
            this.form.noBlurName = "";
            this.confirmLoading = false;
            this.form.outputResult = "";
            this.visible = false;
        },
    }
}
</script>
<style scoped>
.mask {
    position: absolute;
    width: 100%;
    height: 100%;
    top:0;
    left:0;
    background-color: rgba(255, 255, 255, .5);
}
</style>