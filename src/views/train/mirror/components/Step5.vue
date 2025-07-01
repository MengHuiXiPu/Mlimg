<template>
    <div style="position: relative;">
        <div style="height:850px;overflow:hidden;margin-top: 2px;">
            <split-pane :min-percent="15" :max-percent="22" :default-percent="22" split="vertical" @resize="resizeLeft" ref="splitLeft">
                <template slot="paneL">
                    <split-pane :min-percent="13" :max-percent="36" :default-percent="36" split="horizontal" @resize="resizeTop" ref="splitTop">
                        <template slot="paneL">
                            <a-card style="margin: 2px;">
                                <div class="unit" style="margin: 10px;">
                                    <span style="font-size: 14px; padding-right: 10px;">选择站点:</span>
                                    <a-select v-model="currentEqpId" class="select"    @change="findStepColorPictureInfoListByTemplateIdNodeIdClassIdEqpIdStart" style="width: 200px;">
                                        <a-select-option v-for="option in eqpId" :key="option" placeholder="选择站点" :value="option">
                                            {{ option}}
                                        </a-select-option>
                                    </a-select>
                                </div>
                                <div class="unit">
                                    <span style="font-size: 14px; padding-right: 5px;">选择站点测试彩图目录:</span>
                                    <!--选择图片目录-->
                                    <a-tree-select v-model="imgDir"
                                                showSearch
                                                allowClear
                                                :dropdown-style="{ maxHeight: '200px', overflow: 'auto' }"
                                                style="width:100%; margin-top: 5px;"
                                                :tree-data="treeData"
                                                placeholder="选择站点测试彩图目录"
                                                @select="onSelect" />
                                    <div style="height: 180px; overflow:scroll; margin-top: 5px;">
                                        <div v-for="img in this.imglist" class="imgname" @click="myOpen(img.imageWebUrl)" :title="img.imageName">
                                            {{img.imageName}}
                                        </div>
                                    </div>
                                </div>
                            </a-card>
                        </template>
                        <template slot="paneR">
                            <div style="height:520px;overflow:auto;margin:2px">
                                <a-card title="参数配置(所有站点)">
                                    <a-table :scroll="{ x: hidden, y:true }"
                                            :pagination="false"
                                            :columns="columns"
                                            :data-source="datasource"
                                            rowKey="id"
                                            style="margin:5px"
                                            v-if="this.datasource.length > 0">
                                        <template slot="input" slot-scope="text, record">
                                            <a-select v-model="currentIdentify" @change="selCompObj(1)" @click="selCompObj(1)"  style="width: 100%;" v-if="record.params=='comp_path'">
                                                <template v-for="unit in units">
                                                    <!--#87d068 成功 #108ee9 进行中 #f50 失败-->
                                                    <a-select-option v-for="tag in unit.childList" :key="tag.id" placeholder="请选择对应部件模板" :value="tag.id">
                                                        {{unit.compName}}-{{tag.indImageName}}
                                                    </a-select-option>
                                                </template>
                                            </a-select>
                                            <a-select v-model="currentIdentify1" @change="selCompObj(2)" @click="selCompObj(2)" style="width: 100%;" v-if="record.params=='comp_path2'">
                                                <a-select-option value="">--请选择--</a-select-option>
                                                <template v-for="unit in units">
                                                    <!--#87d068 成功 #108ee9 进行中 #f50 失败-->
                                                    <a-select-option v-for="tag in unit.childList" :key="tag.id" placeholder="请选择对应部件模板" :value="tag.id" >
                                                        {{unit.compName}}-{{tag.indImageName}}
                                                    </a-select-option>
                                                </template>
                                            </a-select>
                                            <a-input v-model="text" @change="(event)=>onTabelChange(event,record)" v-if="record.params!='comp_path'&&record.params!='comp_path2'"></a-input>
                                        </template>
                                    </a-table>
                                </a-card>
                                <!--占位，为了让table完全显示-->
                                <div style="height:20px;background-color:white"></div>
                            </div>
                        </template>
                    </split-pane>
                    <!--
                <div class="unit">
                    <span style="font-size: 16px;padding-right: 5px;">选择部件1模板图:</span>
                    <a-select v-model="currentIdentify" @select="selCompObj(1)" style="width: 200px;">
                        <template v-for="unit in units">
                            <a-select-option v-for="tag in unit.childList" :key="tag.id" placeholder="请选择对应部件模板" :value="tag.id">
                                {{unit.compName}}-{{tag.indImageName}}
                            </a-select-option>
                        </template>
                    </a-select>
                    <span v-show="this.comp1ImgUrl" @click="myIndOpen(1)" style="margin: 10px;font-size: 14px; cursor: pointer ;" title="查看部件模板图">打开(comp_path)</span>
                </div>
                <div class="unit">
                    <span style="font-size: 16px;padding-right: 5px;">选择部件2模板图:</span>
                    <a-select v-model="currentIdentify1" @select="selCompObj(2)" style="width: 200px;">
                        <a-select-option value="">--请选择--</a-select-option>
                        <template v-for="unit in units">
                            <a-select-option v-for="tag in unit.childList" :key="tag.id" placeholder="请选择对应部件模板" :value="tag.id">
                                {{unit.compName}}-{{tag.indImageName}}
                            </a-select-option>
                        </template>
                    </a-select>
                    <span v-show="this.comp2ImgUrl" @click="myIndOpen(2)" style="margin: 10px;font-size: 14px; cursor: pointer ;" title="查看部件模板图">打开(comp_path2)</span>
                </div>
                -->
                    
                </template>
                <template slot="paneR">
                    <div style="width:100%;height: 800px;overflow-y: auto;" :loading="makeloading">
                        <!--生成的彩图-->
                        <img :src="outputpath" v-if="outputpath" style="height:760px;margin:2px auto;border: 1px solid white" />
                        <!--单张结果图-->
                        <img :src="sgImageUrl" v-if="sgImageUrl" style="height:760px;margin-left: 20px; margin:2 auto;border-width:1px;border-color:white" />
                    </div>
                </template>
            </split-pane>
        </div>
        <div style="text-align:center;height:50px;width:100%;position:relative">
            <div class="buttonlist">
                <div>
                    <!-- <span class="tips">
                        输出总目录:
                    </span> -->
                    <a-button type="primary" style="margin: 10px" @click="createImg" :loading="makeloading">生成彩图</a-button>
                    <a-input v-model="outputDir" style="width:360px" disabled placeholder="输出总目录:"/>
                </div>
                <div>
                    <!-- <span class="tips">
                        全图Zip文件:
                    </span> -->
                    <div>
                        <!-- <a-label style="width:60px;height:30px;line-height: 30px;font-size: 14px;margin-right: 25px;" class="">全图展示：</a-label> -->
                        <a-button type="primary" style="margin: 10px; height: 30px;" @click="myOpenZip" :disabled="makeloading">下载全图Zip文件</a-button>
                        <a-select v-model="currentImgValue" @change="selectImage" style="width: 360px;">
                            <a-select-option value="">--请选择图片--</a-select-option>
                            <a-select-option v-for="(opt, index) in markedImageList" :key="index" :value="opt.imageWebUrl">
                                {{ opt.imageName }}
                            </a-select-option>
                        </a-select>
                        
                    </div>
                    <div>
                        <a-label style="width:120px;height:30px;line-height: 30px;font-size: 12px;text-align: center;" class="">Debug图查看：</a-label>
                        <a-select v-model="currentImgValueDebug" @change="selectDebugImage" style="width: 360px;">
                            <a-select-option value="">--请选择图片--</a-select-option>
                            <a-select-option v-for="(opt, index) in markedDebugImageList" :key="index" :value="opt.imageWebUrl">
                                {{ opt.imageName }}
                            </a-select-option>
                        </a-select>
                    </div>
                    
                    <!-- <a-input v-model="eqpFileZip" style="width:360px" @click="myOpenZip()" /> -->
                </div>
            </div>
        </div>
        <div style="float: left; margin-bottom: 10px">
            <a-button @click="prevStep">上一步</a-button>
            <a-button type="primary" style="margin-left: 10px" @click="nextStep">下一步</a-button>
            <!-- <a-button style="margin-left: 10px;" @click="cancel">返回列表</a-button> -->
        </div>
        <div v-if="loadImage" class="mask"></div>
        <a-spin :spinning="loadImage" :indicator="indicator" style="position:absolute;top: 50%;left: 50%;"></a-spin>
    </div>
</template>

<script>
    import configSystem from "@/config/system";
    import splitPane from "vue-splitpane"
    import { axios } from '@/utils/request'
    import {
      getTemplateMakeinfo,
      getDirTreeDataList,
      getTemplateById,
      findDirZipFileList,
      findDirImageList,
      getComplabelNodeListData,
      getComplabelByPkId,
      findStepColorPictureInfoListByTemplateIdNodeIdClassIdEqpId, findStepComplabelObjByNodeClassIdEqmIdIndName
    } from '@/api/imageManage'
    import { getDataSetListById } from "@/api/dataCenter";
    import { mapState } from "vuex";
    import template from "@/store/modules/template";
    import { getPictureFilePath } from "@/api/modelManage";

    //import {templateFullMakeDo, templateFullMakeDo} from "../../../../api/imageManage";
    export default {
        name: 'Step4',
        components: {//引用的其他组件
            splitPane,
        },
        props: {//从父组件传来数据

        },
        data() {
            return {
                indicator: <a-icon type="loading" style="font-size: 32px" spin />,
                id:'',
                colorPictureObj: null,
                tplDatalistId: '',
                templateInput: this.templateId, //当前主模板ID
                nodeIdInput: this.nodeId, //当前主模板节点ID（T9，T10）
                classIdInput: this.classId, //当前产品
                eqpIdInput: this.eqpId,  // 当前模板站点列表
                eqmIdArr:[],
                currentEqpId: null,//当前选中站点
                currentIdentify: null,//当前选中部件标识
                currentIdentify1: null,//1
                currentIdentify2: null,//2
                comp1ImgUrl: null,//1
                comp2ImgUrl: "",//2
                compId: null,//1
                compId2: null ,//2
                imglist: [],//用于无缺陷站点图
                markedImageList: "", // 输出总目录的图片
                markedDebugImageList: "",
                currentImgValue: "",
                currentImgValueDebug: "",
                originalpath: '',
                fullMakeData: {
                    "templateId": 120,
                    "nodeId": "T9",
                    "classId": "28110",
                    "eqpId": "018R0",
                    "stepNum": 32,
                    "indImageName": "M1",
                    "configJson": {
                        "pt_h": 450,
                        "pt_w": 150,
                        "angle_rotate_to_template": 0,
                        "real_cell_long_side": 1618,
                        "real_cell_short_side": 540,
                        "bound": 15,
                        "p_width": 540,
                        "mask_text_percentage": 5,
                        "mask_text_side": "down",
                        "adjust_height_if_estimate_error": 1,
                        "height_estimate_error": 0.2,
                        "m1_erode": 3,
                        "max_samples": 3000,
                        "min_max": "min",
                        "img_dir": "/nas/182/t9/template/23.8FHD/TSFAS/013R0",
                        "comp_path": "/nas/182/t9/template/23.8FHD/tpl_out/compmake/T9_23.80D_01R30_M1/T9_23.8FHD_900_M2_ind_2700x2700.png",
                        "comp_path2": "",
                        "no_good_dir": "",
                        "h_sg": 900,
                        "w_sg": 900,
                        "edge_whole": "edge",
                        "contrast": 1,
                        "brighten_component": "[[0,255,255]]",
                        "gaussian_blur": "[[0,0]]",
                        "save_debug": 1,
                        "match_score_threshold": 0,
                        "use_color_to_match": 0,
                        "site_name":""
                    }
                },
                resizedpath: null,//Resize后原图地址
                outputpath: null,//处理后图
                sgImageUrl: null,//处理后单张图
                outputDir: null, //处理后图目录
                outputDebugDir: null, // debug图目录
                eqpFileZip: null, //处理后图目录
                imgDir: null,//选中无缺陷图的目录值
                columns: [//组件参数表头
                    {
                        title: "编号",
                        dataIndex: "id",
                        key: "id",
                        width: '10%',
                    },
                    {
                        title: "参数",
                        dataIndex: "params",
                        key: "params",
                        width: '52%',
                    },
                    {
                        title: "值",
                        dataIndex: "data",
                        key: "data",
                        width: '38%',
                        scopedSlots: { customRender: "input" },
                        customCell: (row) => {
                            return this.clickEvent(row)//为混淆矩阵添加点击事件
                        },
                    },
                ],
                datasource: [],
                form: {
                    Eqm: null,
                    Unit: null,
                },
                unitname: '013RO',
                unitlist: [
                    {
                        unitname: 'M1',
                        unitstatus: '#87d068'
                    },
                    {
                        unitname: 'M2',
                        unitstatus: '#108ee9'
                    },
                    {
                        unitname: 'M3',
                        unitstatus: '#f50'
                    },
                ],
                units: [

                ],
                treeData: [
                ],
                fullmaked: false,//是否制作完毕
                makeloading: false,//是否正在生成彩图
                loadImage: false,
            }
        },
        computed: {
            ...mapState({
                id: state => template.state.step.id,
                templateId: state => template.state.step.templateId,
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
            // this.id =this.id;
            this.templateInput = this.templateId;
            this.nodeIdInput = this.nodeId;
            this.classIdInput = this.classId;
            this.eqpIdInput = this.eqpId;

            // if(this.eqpId){
            //   this.eqmIdArr   = this.eqpId.split(",");
            // }

            // alert( this.id+"----"+this.templateInput+"--------"+this.nodeIdInput+"----------"+this.classIdInput+"------"+this.eqpIdInput);
            // this.findStepColorPictureInfoListByTemplateIdNodeIdClassIdEqpIdStart();
            this.getComplabelNodeListInit(this.templateId);
            this.getMakeInfo();
            //ID取自于上一步当前主模板ID
            this.getTemplateObjById(this.templateId).then(response => {
                this.getDataSetById(this.tplDatalistId);
            }).catch(error => {
                // 请求失败的回调
            });
        },
        methods: {
            selectImage() {
            // console.log(this.currentImgValue);
                this.loadImage = true;
                getPictureFilePath(this.currentImgValue).then(res => {
                    // 将图片文件流blob转换为url
                    const url = window.URL.createObjectURL(res)
                    // console.log(url);
                    // picId.url = url;
                    this.$hevueImgPreview({
                        url: url,
                        mainBackground: 'rgba(0,0,0,.5)', // 整体背景颜色
                        clickMaskCLose: open,
                    });
                    this.loadImage = false;
                });
            },
            selectDebugImage() {
            // console.log(this.currentImgValue);
                this.loadImage = true;
                getPictureFilePath(this.currentImgValueDebug).then(res => {
                    // 将图片文件流blob转换为url
                    const url = window.URL.createObjectURL(res)
                    // console.log(url);
                    // picId.url = url;
                    this.$hevueImgPreview({
                        url: url,
                        mainBackground: 'rgba(0,0,0,.5)', // 整体背景颜色
                        clickMaskCLose: open,
                    });
                    this.loadImage = false;
                });
            },
            async getComplabelByPkId(num, params) { //86
                const ans = await getComplabelByPkId(params);
                if (ans.code != 0)
                    return;
                //alert(JSON.stringify(ans));
                //回写左边参数（comp_path)
                if (num === 1) {
                  this.compId=params;
                    for (let i = 0; i < this.datasource.length; i++) {
                        if (this.datasource[i]["params"] == "comp_path"){
                            this.datasource[i].data = ans.data.indImageUrl;
                        }
                    }
                  this.comp1ImgUrl = ans.data.indImageUrl;
                }
                if (num === 2) {
                   this.compId2=params;
                    for (let i = 0; i < this.datasource.length; i++) {
                        if (this.datasource[i]["params"] == "comp_path2"){
                            this.datasource[i].data = ans.data.indImageUrl;

                            }
                    }
                  this.comp2ImgUrl = ans.data.indImageUrl;

                }
            //   this.$message.info('部件模板设置为：'+ans.data.indImageUrl);
            },
            selCompObj(num) {
                if (1 === num) {
                // alert(num+"num"+this.currentIdentify)
                    this.getComplabelByPkId(num, this.currentIdentify)
                }
                if (2 === num) {
                  // alert(num+"num"+this.currentIdentify1)
                    if (this.currentIdentify1 == ""){
                        this.comp2ImgUrl = "";
                        return;
                    }
                    this.getComplabelByPkId(num, this.currentIdentify1)
                }
            },
            getcolor(stepNum) {
                if (stepNum == 32)
                    return "#87d068";
                else
                    return "#108ee9";
            },
            changeimg(url) {
                this.originalpath = url;
                // this.$message.info('换图浏览');
                // this.instance.setImage(this.originalpath);
            },
            resizeLeft() {//左侧分割面板比例变化处理函数,实现控制最大分割比例
                const splitPane = this.$refs.splitLeft;
                if (splitPane.percent > 40)
                    splitPane.percent = 40;
            },
            resizeTop(){
                const splitPane = this.$refs.splitTop;
                if (splitPane.percent > 36)
                    splitPane.percent = 36;
            },
            async getComplabelNodeListInit(templateIdVal) {//获取组件图片列表
                const res = await getComplabelNodeListData(templateIdVal);
                if (res.code != 0)
                    return;
                this.units = res.data;
            },
            async getImageList(pathValue) {//读取用于resize的图片地址
                // const params = "?dirPath=" + pathValue;
                 const params = {"dirPath": pathValue};
                const ans = await findDirImageList(params);
                if (ans.code != 0)
                    return;
                for (let i = 0; i < ans.data.length; i++) {
                    ans.data.id = i;
                }
                this.imglist = ans.data;
            },
           async findStepColorPictureInfoListByTemplateIdNodeIdClassIdEqpIdStart() {
            if(this.currentEqpId){

                const params = {
                  templateId: this.templateInput,
                  nodeId: this.nodeIdInput,
                  classId: this.classIdInput,
                  eqpId: this.currentEqpId
                };
                const ans = await findStepColorPictureInfoListByTemplateIdNodeIdClassIdEqpId(params);
                if (ans.code != 0)
                  return;
                 this.id = ans.data.id;
                 // 20230717
                 // this.outputpath = "http://10.120.200.35:8008/web"+ans.data.imageUrl;
                 //
                 // this.sgImageUrl = "http://10.120.200.35:8008/web"+ans.data.sgImageUrl;
                //  console.log("ans: ", ans);

                 this.eqpFileZip=ans.data.eqpFileZip;
                 if(ans.data.imageUrl){
                    this.outputpath = configSystem.webUrl +ans.data.imageUrl;
                 }else {
                   this.outputpath="";
                 }
                 if( ans.data.sgImageUrl){
                   this.sgImageUrl =  configSystem.webUrl+  ans.data.sgImageUrl;
                 }else{
                   this.sgImageUrl="";
                 }


                 this.outputDir=ans.data.outPath;
                 this.outputDebugDir=ans.data.debugOut

               // console.info("JJJJJJJJJJJJJ===="+JSON.stringify( ans.data));
                 let confJsonObj = ans.data.configJson;
                  //回写配置参的设置的内容
                  if (confJsonObj) {
                    for (let i = 0; i < this.datasource.length; i++) {
                      if (this.datasource[i]["params"] == "pt_h") {
                        this.datasource[i].data = confJsonObj.pt_h;
                      } else if (this.datasource[i]["params"] == "pt_w") {
                        this.datasource[i].data = confJsonObj.pt_w;
                      } else if (this.datasource[i]["params"] == "angle_rotate_to_template") {
                        this.datasource[i].data = confJsonObj.angle_rotate_to_template;
                      } else if (this.datasource[i]["params"] == "real_cell_long_side") {
                        this.datasource[i].data = confJsonObj.real_cell_long_side;
                      } else if (this.datasource[i]["params"] == "real_cell_short_side") {
                        this.datasource[i].data = confJsonObj.real_cell_short_side;
                      }
                      else if (this.datasource[i]["params"] == "bound") {
                        this.datasource[i].data = confJsonObj.bound;
                      } else if (this.datasource[i]["params"] == "p_width") {
                        this.datasource[i].data = confJsonObj.p_width;
                      } else if (this.datasource[i]["params"] == "mask_text_percentage") {
                        this.datasource[i].data = confJsonObj.mask_text_percentage;
                      } else if (this.datasource[i]["params"] == "mask_text_side") {
                        this.datasource[i].data = confJsonObj.mask_text_side;
                      } else if (this.datasource[i]["params"] == "adjust_height_if_estimate_error") {
                        this.datasource[i].data = confJsonObj.adjust_height_if_estimate_error;
                      }
                      else if (this.datasource[i]["params"] == "height_estimate_error") {
                        this.datasource[i].data = confJsonObj.height_estimate_error;
                      } else if (this.datasource[i]["params"] == "m1_erode") {
                        this.datasource[i].data = confJsonObj.m1_erode;
                      } else if (this.datasource[i]["params"] == "max_samples") {
                        this.datasource[i].data = confJsonObj.max_samples;
                      } else if (this.datasource[i]["params"] == "min_max") {
                        this.datasource[i].data = confJsonObj.min_max;
                      } else if (this.datasource[i]["params"] == "img_dir") {
                        this.datasource[i].data = confJsonObj.img_dir;
                      }
                      else if (this.datasource[i]["params"] == "comp_path") {
                       // this.datasource[i].data = confJsonObj.comp_path;
                       //  this.currentIdentify= confJsonObj.comp_path;
                        this.compId= ans.data.compId;
                      } else if (this.datasource[i]["params"] == "comp_path2") {
                        // this.datasource[i].data = confJsonObj.comp_path2;
                        // this.currentIdentify1= confJsonObj.comp_path2;
                        this.compId= ans.data.compId2;
                      } else if (this.datasource[i]["params"] == "out_dir") {
                        this.datasource[i].data = confJsonObj.out_dir;
                      } else if (this.datasource[i]["params"] == "no_good_dir") {
                        this.datasource[i].data = confJsonObj.no_good_dir;
                      } else if (this.datasource[i]["params"] == "h_sg") {
                        this.datasource[i].data = confJsonObj.h_sg;
                      }
                      else if (this.datasource[i]["params"] == "w_sg") {
                        this.datasource[i].data = confJsonObj.w_sg;
                      } else if (this.datasource[i]["params"] == "edge_whole") {
                        this.datasource[i].data = confJsonObj.edge_whole;
                      } else if (this.datasource[i]["params"] == "contrast") {
                        this.datasource[i].data = confJsonObj.contrast;
                      } else if (this.datasource[i]["params"] == "brighten_component") {
                        this.datasource[i].data = confJsonObj.brighten_component;
                      } else if (this.datasource[i]["params"] == "gaussian_blur") {
                        this.datasource[i].data = confJsonObj.gaussian_blur;
                      }
                      else if (this.datasource[i]["params"] == "save_debug") {
                        this.datasource[i].data = confJsonObj.save_debug;
                      } else if (this.datasource[i]["params"] == "match_score_threshold") {
                        this.datasource[i].data = confJsonObj.match_score_threshold;
                      } else if (this.datasource[i]["params"] == "use_color_to_match") {
                        this.datasource[i].data = confJsonObj.use_color_to_match;
                      } else if (this.datasource[i]["params"] == "site_name") {
                        this.datasource[i].data = confJsonObj.site_name;
                      }
                    }
                  }

               //查历史已设置的
              const imageList = await findDirImageList({"dirPath": this.outputDir});
              const imageDebugList = await findDirImageList({"dirPath": this.outputDebugDir});
              if(imageList.data &&    imageList.data.length >0){
              this.markedImageList = imageList.data;
              }else {
                //清空
                this.markedImageList="";
              }
              if(imageDebugList.data && imageDebugList.data.length>0){
              this.markedDebugImageList = imageDebugList.data;
              }else{
                //清空
                this.markedImageList="";
              }


            }else{


            }
          },
            onLoadData() {

            },
            prevStep() {
              let eqmIdTemp = "";
              if (this.eqpId && this.eqpId.length > 0) {
                //console.log(this.eqpId)
                eqmIdTemp = this.eqpId.join(",");
              }
              let body = {
                id: this.templateId,//模板主键id
                templateId: this.templateId,//模板ID
                templateName: this.templateName,//模板名称
                nodeId: this.nodeId,//节点名称
                classId: this.classId,//产品id
                eqpId: eqmIdTemp,//站点id
                tplDatalistId: this.tplDatalistId,//resize前原图目录
                tplDatalistPath: this.tplDatalistPath,//resize前原图目录
                rawImageDir: this.rawImageDir,//resize前原图目录
              };
              this.$store.commit('setBasicData', body)
                this.$emit('prevStep');
            },
            cancel() {
                this.$emit('cancel');
            },
            nextStep() {//下一步
                this.$emit('nextStep');
                /*
                if (this.fullmaked) {
                    this.$emit('nextStep');
                }
                else {
                    this.$message.error('彩图尚未生成')
                }
                */
            },
            clickEvent(row) {//表格点击事件
                return {
                    style: {
                        'cursor': 'pointer',
                    },
                    on: {
                        click: (event) => {
                            //this.cur_edit = row.id;//选取参数时更新当前选中的参数，然后处理input改变事件时同步更新参数
                        },
                    },
                }
            },
            onTabelChange(e, record) {
                // console.log(record);
                this.datasource[record.id].data = e.target.value;
            },
            async getDataSetById(datasetId) {
                const data = await getDataSetListById(datasetId)
                this.loading = false
                if (data.code !== 0) return false
                let dlRealDir = data.data.dlRealDir
                //查原图目录树
                const ans = await getDirTreeDataList(dlRealDir);
                if (ans.code != 0)
                    return;
                for (let i = 0; i < ans.data.length; i++) {
                    ans.data.id = i;
                }
                this.treeData = ans.data.children;
            },
            async getTemplateObjById(params) { //通查模板ID=1， 查数据库集ID（1069）
                const ans = await getTemplateById(params);
                if (ans.code != 0)
                    return;
                this.tplDatalistId = ans.data.tplDatalistId;
            },
            checkparam(col) {
                for (let i = 0; i < this.datasource.length; i++) {
                    if (this.datasource[i]["params"] == col) {
                        return this.datasource[i]["data"];
                    }
                }
            },
            async tbCreateImage(params) {
                const ans = await this.createFullPicture(params)
                //生成彩图接口调用完成。
                this.loading = false
                console.log("ans: ", ans);
                console.log("ans.data: ", ans.data);
                if (ans.code != 0)
                    return;
                let imageUrl = ans.data.indImageUrl;
                this.eqpFileZip = ans.data.eqpFileZip;
                let path = ans.data.path;
                let imageWebUrl = configSystem.webUrl + imageUrl;
                this.outputpath = imageWebUrl;

                // console.log("I am test");
                // console.log("outputpath: ", this.outputpath);

                //let sgImageWebUrl = "http://10.120.200.35:8008/web" + ans.data.sgImageUrl;
                let sgImageWebUrl = configSystem.webUrl+  ans.data.sgImageUrl;
                this.sgImageUrl = sgImageWebUrl;


                this.outputDir = path;
                this.outputDebugDir = ans.data?.debugOut
                // const getZip_param = {dirPath: path};
                // await findDirZipFileList(getZip_param).then(res => {
                //     console.log("下载链接返回结果："+res);
                //     this.$message.success('获取下载链接成功');
                //     this.makeloading = false;
                // }).catch(error => {
                //     this.$message.error('获取下载链接失败');
                // });
              let body = {
                "templateId": this.templateInput,
                "nodeId": this.nodeIdInput,
                "classId": this.classIdInput,
                "eqpId": this.currentEqpId,
                "sgImageUrl":  ans.data.sgImageUrl,
              };

               // this.updateStepColorPicture(body)
            //    this.makeloading = false;
            },
            createFullPicture(jsonparams) {
                return axios.post(`/api/v1/dataanalysis/aiTemplateMakeinfo/httpReqTemplateFullMake`, jsonparams, {
                    headers: {
                        'Content-Type': 'application/json',

                    }
                });

            },
            createImg() {//生成彩图
                //const params = this.fullMakeData;
                let no_good_dirVal = this.checkparam("no_good_dir");
                let comp_path2Val = this.checkparam("comp_path2");
                const params = {
                    "templateId": this.templateInput,
                    "nodeId": this.nodeIdInput,
                    "classId": this.classIdInput,
                    "eqpId": this.currentEqpId,
                    "stepNum": 32,
                    "compId": this.compId,
                    "compId2":this.compId2,
                    "indImageName": this.checkparam("indImageName"),
                    "configJson": {
                        "templateId": this.checkparam("templateId"),
                        "nodeId": this.checkparam("nodeId"),
                        "classId": this.checkparam("classId"),
                        "eqpId": this.checkparam("eqpId"),
                        "stepNum": this.checkparam("stepNum"),
                        "pt_h": this.checkparam("pt_h"),
                        "pt_w": this.checkparam("pt_w"),
                        "angle_rotate_to_template": this.checkparam("angle_rotate_to_template"),
                        "real_cell_long_side": this.checkparam("real_cell_long_side"),
                        "real_cell_short_side": this.checkparam("real_cell_short_side"),
                        "bound": this.checkparam("bound"),
                        "p_width": this.checkparam("p_width"),
                        "mask_text_percentage": this.checkparam("mask_text_percentage"),
                        "mask_text_side": this.checkparam("mask_text_side"),
                        "adjust_height_if_estimate_error": this.checkparam("adjust_height_if_estimate_error"),
                        "height_estimate_error": this.checkparam("height_estimate_error"),
                        "m1_erode": this.checkparam("m1_erode"),
                        "max_samples": this.checkparam("max_samples"),
                        "min_max": this.checkparam("min_max"),
                        "img_dir": this.checkparam("img_dir"), //站点选一目录,
                        "comp_path": this.checkparam("comp_path"), //一般M1部件模板图,
                        "comp_path2": comp_path2Val ? comp_path2Val : "", //其他部件模板选一图,
                        "no_good_dir": no_good_dirVal ? no_good_dirVal : "",
                        "h_sg": this.checkparam("h_sg"),
                        "w_sg": this.checkparam("w_sg"),
                        "edge_whole": this.checkparam("edge_whole"),
                        "contrast": this.checkparam("contrast"),
                        "brighten_component": this.checkparam("brighten_component"),
                        "gaussian_blur": this.checkparam("gaussian_blur"),
                        "save_debug": this.checkparam("save_debug"),
                        "match_score_threshold": this.checkparam("match_score_threshold"),
                        "use_color_to_match": this.checkparam("use_color_to_match"),
                        "site_name":this.currentEqpId
                    }
                };
                // console.log("this.currentIdentify:", this.currentIdentify);
                if(this.currentIdentify === null) {
                    this.$message.info("comp_path不能为空！")
                    return ;
                }
                let messageContent = "请设置好各参数据，确认要生成彩图模板吗？";
                this.$confirm({
                    title: '彩图制作',
                    content: messageContent,
                    cancelText: '取消',
                    okText: '确定',
                    width: 600,
                    okButtonProps: {
                        props: { disabled: false },
                    },
                    onOk: async () => {
                        this.makeloading = true;
                        const jsonparams = JSON.stringify(params);
                        axios.post(`/api/v1/dataanalysis/aiTemplateMakeinfo/httpReqTemplateFullMake`, jsonparams, {
                            headers: {
                                'Content-Type': 'application/json',

                            }
                        }).then(async ans => {
                            //生成彩图接口调用完成。
                            this.loading = false
                            console.log("ans: ", ans);
                            console.log("ans.data: ", ans.data);
                            if (ans.code != 0)
                                return;
                            let imageUrl = ans.data.indImageUrl;
                            this.eqpFileZip = ans.data.eqpFileZip;
                            let path = ans.data.path;
                            let imageWebUrl = configSystem.webUrl + imageUrl;
                            this.outputpath = imageWebUrl;

                            let sgImageWebUrl = configSystem.webUrl+  ans.data.sgImageUrl;
                            this.sgImageUrl = sgImageWebUrl;

                            this.outputDir = path;
                            this.outputDebugDir = ans.data?.debugOut
                            let body = {
                                "templateId": this.templateInput,
                                "nodeId": this.nodeIdInput,
                                "classId": this.classIdInput,
                                "eqpId": this.currentEqpId,
                                "sgImageUrl":  ans.data.sgImageUrl,
                            };
                           // this.updateStepColorPicture(body)
                            // this.tbCreateImage(jsonparams)
                            console.log("this.outputDir: ", this.outputDir);
                            console.log("this.outputDebugDir: ", this.outputDebugDir);
                            const imageList = await findDirImageList({"dirPath": this.outputDir});
                            const imageDebugList = await findDirImageList({"dirPath": this.outputDebugDir});
                            
                            this.markedImageList = imageList.data;
                            this.markedDebugImageList = imageDebugList.data;
                            console.log("imageList: ", imageList);
                            console.log("imageDebugList: ", imageDebugList)
                            this.makeloading = false;
                            this.$message.success('彩图制作成功');
                        }).catch(error => {
                            // 请求失败的回调
                        });
                        // console.log("====" + jsonparams)
                        // await this.tbCreateImage(jsonparams)
                       
                    },
                    onCancel() { }
                })
            },
            async getMakeInfo() {//获取配置参数
                await getTemplateMakeinfo("colorpicture").then(ans => {
                    if (ans.code != 0)
                        return;
                    this.datasource = [];
                    let i = 0;
                    for (const key in ans.data) {
                        if (key != "id" && key != "templateId" && key != "nodeId" && key != "classId" && key != "eqpId" && key != "stepNum") { //不需求这些字段参数展示

                            let dataVal = ans.data[key];
                            // alert("==="+dataVal)
                            if (key == "pt_h") {
                                dataVal = 600;
                            } else if (key == "pt_w") {
                                dataVal = 200;
                            } else if (key == "angle_rotate_to_template") {
                                dataVal = 0;
                            } else if (key == "real_cell_long_side") {
                                dataVal = 924;
                            } else if (key == "real_cell_short_side") {
                                dataVal = 308;
                            } else if (key == "bound") {
                                dataVal = 15;
                            } else if (key == "p_width") {
                                dataVal = 308;
                            }
                            else if (key == "mask_text_percentage") { //默认值
                                dataVal = 10;
                            }
                            else if (key == "mask_text_side") { //默认值
                                dataVal = "down";
                            } else if (key == "adjust_height_if_estimate_error") { //默认值
                                dataVal = 1;
                            } else if (key == "height_estimate_error") { //默认值
                                dataVal = 0.2;
                            } else if (key == "m1_erode") { //默认值
                                dataVal = 5;
                            } else if (key == "max_samples") { //默认值
                                dataVal = 5;
                            } else if (key == "min_max") { //默认值
                                dataVal = "min";
                            } else if (key == "h_sg") { //默认值
                                dataVal = 1200;
                            } else if (key == "w_sg") { //默认值
                                dataVal = 600;
                            } else if (key == "edge_whole") { //默认值
                                dataVal = "edge";
                            } else if (key == "contrast") { //默认值
                                dataVal = 1;
                            } else if (key == "brighten_component") { //默认值
                                dataVal = "[[0,255,255]]";
                            } else if (key == "gaussian_blur") { //默认值
                                dataVal = "[[0,0]]";
                            } else if (key == "save_debug") { //默认值
                                dataVal = 1;
                            } else if (key == "match_score_threshold") { //默认值
                                dataVal = 0;
                            } else if (key == "use_color_to_match") { //默认值
                                dataVal = 0;
                            }
                            this.datasource.push({
                                id: i,
                                params: key,
                                data: dataVal
                            })
                            i++;
                        }
                    }
                })
            },
          updateStepColorPicture(body) {//修改全图
            // let params = JSON.stringify(body);
            // // alert("params="+params)
            // //添加
            // axios.put(`/api/v1/dataanalysis/aiTemplateMakeinfo/stepColorPicture`, params, {
            //   headers: {
            //     'Content-Type': 'application/json',
            //
            //   }
            // }).then(response => {
            //   //alert(JSON.stringify(response))
            //   console.log("response: ", response)
            //   if (response.code == 0) {
            //     this.$message.success('修改全图成功');
            //   }
            //   else {
            //     // this.$message.error('修改全图失败');
            //     // return false;
            //   }
            // }).catch(error => {
            //   // 请求失败的回调
            // });
          },
            onSelect(checkedKeys, node) {
                //this.resizedpath = value;

                // this.$message.info('选择站点测试彩图片目录设置为：' + node.value);
                //回写设置项
                for (let i = 0; i < this.datasource.length; i++) {
                    if (this.datasource[i]["params"] == "img_dir") {
                        this.datasource[i].data = node.value;
                    }
                }
                this.getImageList(node.value)
                this.$nextTick(() => {

                })
            },
            myIndOpen(num) {
                let goURl = "";
                if (num == 2) {
                    goURl = configSystem.webUrl+ this.comp2ImgUrl;
                } else {
                    goURl = configSystem.webUrl+ this.comp1ImgUrl;
                }
                window.open(goURl);
            },
            myOpen(url){
              let goURl = configSystem.webUrl+ url;
              window.open(goURl);
            },
            myOpenZip() {
                let goURl =configSystem.webUrl+ this.eqpFileZip;
                window.open(goURl);
            },
        }
    }
</script>

<style scoped>
    .imgname {
        text-align: center;
        background-color: rgba(240,240,240,0.5);
        border-radius: 15px;
        height: 40px;
        line-height: 40px;
        margin: 10px;
        cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -khtml-user-select: none;
        -ms-user-select: none;
        user-select: none;
        overflow-y: hidden;
    }

    .buttonlist {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        margin: auto;
        right: 0;
    }

    .tips {
        display: inline-block;
        height: 30px;
        line-height: 30px;
        font-size: 14px;
        margin: 10px
    }

    .unit {
        margin: 10px;
    }

    h3 {
        display: inline-block;
    }
    .mark-list {
        display: flex;
        justify-content: center;
        height:30px;
        width:100%;
        position:relative;
        margin-top: 5px;
    }
</style>
