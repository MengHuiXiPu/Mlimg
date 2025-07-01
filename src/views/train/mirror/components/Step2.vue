<template>
    <div>
        <a-form-model :model="form"
                       ref="ruleForm"
                       :label-col="{ span: 6 }"
                       :wrapper-col="{ span: 18 }"
                       :rules="rules"
                       layout="horizontal"
                       style="max-width: 700px; margin: 20px auto 0;">
            <a-form-model-item label="模板名称:" prop="modelName">
                <a-input v-model="form.templateName" />
            </a-form-model-item>
            <a-form-model-item label="当前节点:" prop="Node">
                <a-input v-model="form.Node" />
            </a-form-model-item>
            <a-form-model-item label="当前产品:" prop="Product">
                <a-input v-model="form.Product" />
            </a-form-model-item>
            <a-form-model-item label="当前站点:" prop="Site">
                <a-select v-model="form.Site" mode="multiple">
                    <a-select-option v-for="(item,key) in eqpDataList"
                                     :key="key"
                                     :value="item.value">
                        {{ item.text }}
                    </a-select-option>
                </a-select>
            </a-form-model-item>
            <a-form-model-item label="原图目录:" prop="tplDatalistId">
                <a-tree-select v-model="form.tplDatalistId"
                               showSearch
                               allowClear
                               @change="getDataSetList"
                               :dropdown-style="{ maxHeight: '300px', overflow: 'auto' }"
                               :tree-data="treeData"
                               placeholder="请选择存放目录"
                               @select="onSelect" />
                <!--
                    :load-data="onLoadData" // 这是a-tree-select的属性
                    <a-button size="small"
                              @click="addpath"
                              class="addNode"
                              type="primary">
                        添加目录
                    </a-button>
                -->
            </a-form-model-item>
        </a-form-model>
        <div style="display: flex; justify-content: center;">
            <!-- <a-button @click="prevStep">上一步</a-button> -->
            <a-button type="primary" style="margin-left: 10px" @click="nextStep">下一步</a-button>
            <!-- <a-button style="margin-left: 10px;" @click="cancel">返回列表</a-button> -->
        </div>
    </div>
</template>

<script>
    import { getDataSetList } from "@/api/dataCenter"
    import { mapState } from 'vuex'
    import {
        deleteTemplate,
        editTemplate,
    } from '@/api/imageManage'
    import { axios } from "@/utils/request";
    import template from "@/store/modules/template";
    import { rgbToHsl } from "webpack-theme-color-replacer/client/varyColor";
    export default {
        name: 'Step2',
        components: {//引用的其他组件

        },
        props: {//从父组件传来数据
          "nodeId": "",
          "classId": "",
          "eqpId": [],
        },
        data() {
            return {
                siteValue: ["023R0"],
                eqpDataList: [
                    { "text": "013R0", value: "013R0" },
                    { "text": "023R0", value: "023R0" },
                    { "text": "033R0", value: "033R0" },
                    { "text": "018R0", value: "018R0" },
                    { "text": "038R0", value: "038R0" },
                    { "text": "053R0", value: "053R0" },
                    { "text": "058R0", value: "058R0" },
                    { "text": "063R0", value: "063R0" },
                    { "text": "133R0", value: "133R0" },
                    { "text": "138R0", value: "138R0" },
                    { "text": "PTC", value: "PTC" },
                    { "text": "ARRAY", value: "ARRAY" },
                    { "text": "CF", value: "CF" },
                ],//产品列表
                templateId: null,//模板id
                form: {
                    templateName: 'T9_23.8FHD',
                    Node: 'T9',
                    Product: '23.8FHD',
                    Site: null,
                    tplDatalistId: null,
                    tplDatalistPath: null,
                    rawImageDir: null,
                    templateId: null

                },//表单数据
                rules: {
                    templateName: [{
                        required: true, message: '请选择模板名称!', trigger: 'blur'
                    }],
                    Node: [{
                        required: true, message: '请选择节点!', trigger: 'blur'//触发校验实际为失焦时
                    }],
                    Product: [{
                        required: true, message: '请选择产品!', trigger: 'blur'
                    }],
                    Site: [{
                        required: true, message: '请选择站点!', trigger: 'blur'
                    }],
                    tplDatalistId: [{
                        required: true, message: '请选择原图目录!', trigger: 'change'
                    }]
                },
                treeData: [

                ],
            }
        },
        computed: {
            ...mapState({
                id: state => template.state.step.id,
                templateId: state => template.state.step.id,
                templateName: state => template.state.step.templateName,
                nodeId: state => template.state.step.nodeId,
                classId: state => template.state.step.classId,
                eqpId: state => template.state.step.eqpId,
                tplDatalistId: state => template.state.step.tplDatalistId,
                tplDatalistPath: state => template.state.step.tplDatalistPath,
                rawImageDir: state => template.state.step.rawImageDir
            }),


        },
        mounted() {
            this.form.id = this.id;
            this.templateId = this.id;
            this.form.templateName = this.templateName;
            this.form.Node = this.nodeId;
            this.form.Product = this.classId;
            let eqmIdTempArr = [];
            if (this.eqpId) {
                eqmIdTempArr = this.eqpId.split(",");
            }
            this.form.Site = eqmIdTempArr;
            this.form.tplDatalistId = this.tplDatalistId;
            this.form.tplDatalistPath = this.tplDatalistPath;
            this.form.rawImageDir = this.rawImageDir;
            this.getDataSetList();
        },
        methods: {
            nextStep() {
                let id_ = this.id;
                this.$refs.ruleForm.validate(valid => {
                    if (valid == false) {//校验未通过
                        this.$message.error('请填入正确的数据')
                    }
                    else {
                        let body = {
                            id: this.templateId,//模板主键id
                            templateId: this.templateId,//模板ID
                            templateName: this.form.templateName,//模板名称
                            nodeId: this.form.Node,//节点名称
                            classId: this.form.Product,//产品id
                            eqpId: this.form.Site,//站点id
                            tplDatalistId: this.form.tplDatalistId,//resize前原图目录
                            tplDatalistPath: this.form.tplDatalistPath,//resize前原图目录
                            rawImageDir: this.form.rawImageDir,//resize前原图目录
                        };
                        this.$store.commit('setBasicData', body)
                        let eqmIdTemp = "";
                        if (this.eqpId) {
                            eqmIdTemp = body.eqpId.join(",");
                            body.eqpId = eqmIdTemp;
                        }

                        if (this.id) {
                            this.updateMainTemplate(body)
                        } else {
                            this.addMainTemplate(body);
                        }

                    }
                })
            },
            prevStep() {
              let body = {
                templateId: this.templateId,//模板ID
                nodeId: this.nodeId,//节点名称
                classId: this.classId,//产品id
                eqpId: this.eqpId,//站点id
                templateName: this.templateName//站点id
              };

                let eqmIdTemp = "";
                if (this.eqpId && this.eqpId.length > 0) {
                  eqmIdTemp = this.eqpId.join(",");
                  body.eqpId = eqmIdTemp;
                }
                 this.$store.commit('setBasicData', body)
                this.$emit('prevStep');

            },
            cancel() {
                this.getTreeNodeParent();
                this.$emit('cancel');


            },
            addpath() {//上传目录

            },
            onLoadData() {

            },
            onSelect(checkedKeys, node) {//更新使用的原图目录
                if (node && node.title) {
                    let strList = node.title.split("=>");
                    this.form.tplDatalistId = node.value;
                    this.form.tplDatalistPath = strList[0];
                    this.form.rawImageDir = strList[1];
                    // this.$nextTick(() => {
                    //
                    // })
                }
            },
            getTreeNodeParent() {
                this.$emit('getTreeNode');
            },
            addMainTemplate(body) {//添加
                let tempBody = body;
                let params = JSON.stringify(body);
                // alert("params="+params)
                //添加
                axios.post(`/api/v1/dataanalysis/aiTemplateMakeinfo/add`, params, {
                    headers: {
                        'Content-Type': 'application/json',

                    }
                }).then(response => {
                    // 请求成功的回调，此时返回code===0
                    if (response.code === 0) {
                        // console.log(response.msg)
                        // alert(JSON.stringify(body))
                        tempBody.templateId = response.data.id;
                        tempBody.id = response.data.id;
                        let eqmIdTempArr = [];
                        if (tempBody.eqpId) {
                          eqmIdTempArr = tempBody.eqpId.split(",");
                          tempBody.eqpId=eqmIdTempArr;
                        }

                        this.$store.commit('setBasicData', tempBody)
                        this.$emit('nextStep');
                        this.$message.success('添加模板基本信息成功');
                        this.getTreeNodeParent()

                    } else {
                        this.$message.error('添加模板基本信息失败');
                        return false;
                    }
                    //this.$forceUpdate();//刷新
                }).catch(error => {
                    // 请求失败的回调
                });
            },
            updateMainTemplate(body) {//修改主表模板

                let params = JSON.stringify(body);
                // alert("params="+params)
                //添加
                axios.put(`/api/v1/dataanalysis/aiTemplateMakeinfo`, params, {
                    headers: {
                        'Content-Type': 'application/json',

                    }
                }).then(response => {
                    // 请求成功的回调，此时返回code===0
                    //console.log(response);
                    if (response.code === 0) {

                        this.$emit('nextStep');
                        this.$message.success('修改模板基本信息成功');

                    } else {
                        this.$message.error('修改模板基本信息失败');
                        return false;
                    }
                    //this.$forceUpdate();//刷新
                }).catch(error => {
                    // 请求失败的回调
                });
            },
            async getDataSetList() {
                //查模板数据集
                const responseData = await getDataSetList({
                    limit: 9999,
                    dlType: 9
                })
                if (responseData.code === 0) {
                    this.ImgPathlist = responseData.data.records.filter(item => item.status === 2);
                    this.treeData = [];
                    this.ImgPathlist.forEach((item) => {
                        let dlRealDirTemp = item.dlRealDir.replace("/data/dataList_package/", "/home/nfs/tcl-ai-data-pvc-dfea0a0e-773b-42d6-8cf5-f12209e1d496/dataList_package/");
                        this.treeData.push({
                            value: item.id,
                            title: item.dlName + "=>" + dlRealDirTemp,
                            path: dlRealDirTemp

                        })
                    })
                }
            },
            filterOption(input, option) {
                return (
                    option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
                );
            },

        }
    }
</script>

<style scoped>
    .buttonlist {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        margin: auto;
        right: 0;
    }
</style>