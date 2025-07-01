<template>
    <div>
        <div style="height:840px;overflow:auto; margin-top: 2px;">
            <split-pane :min-percent="14" :max-percent="14" :default-percent="14" split="vertical"  @resize="resizeLeft" ref="splitLeft">
                <template slot="paneL">
                    <split-pane :min-percent="11" :max-percent="33" :default-percent="33" split="horizontal" @resize="resizeTop" ref="splitTop">
                        <template slot="paneL">
                            <a-card title="大图选择">
                                <!--选择图片目录-->
                                <a-tree-select v-model="picturelist" showSearch allowClear
                                    :dropdown-style="{ maxHeight: '300px', overflow: 'auto' }"
                                    style="width:calc(100% - 10px); margin: 5px 5px 0;" :tree-data="treeData"
                                    placeholder="请选择大图存放目录" @select="onSelect" />
                                <div style="height: 180px;  overflow:scroll;">
                                    <div v-for="img in this.imglist" class="imgname" @click="loadimg(img.imageWebUrl)"
                                        :title="img.imageName">
                                        {{ img.imageName }}
                                    </div>
                                </div>
                            </a-card>
                        </template>
                        <template slot="paneR">
                            <div style="height:520px;overflow:auto;">
                                <a-card title="参数配置">
                                    <a-table :scroll="{ x: hidden, y: true }" :pagination="false" :columns="columns"
                                        :data-source="datasource" :rowKey="record => record.id" style="margin:5px"
                                        v-if="this.datasource.length > 0">
                                        <template slot="input" slot-scope="text, record">
                                            <a-input v-model="text" @change="(event) => onTabelChange(event, record)"></a-input>
                                        </template>
                                    </a-table>
                                </a-card>
                                <!--占位，为了让table完全显示-->
                                <div style="height:10px;background-color:white"></div>
                            </div>
                            
                        </template>
                    </split-pane>
                </template>
                <template slot="paneR">
                    <!-- <div style="overflow-x: scroll; overflow-y:hidden;height: 960px; width: 100%; "> -->
                    <div style="overflow:auto; height: 960px; width: 100%; ">
                        <canvas class="container" :style="{ 'opacity': cur_img ? '1' : '0' }"></canvas>
                    </div>
                </template>
            </split-pane>
        </div>

        <div style="float: left;">
            <a-button @click="prevStep">上一步</a-button>
            <a-button type="primary" style="margin-left: 5px" @click="nextStep">下一步</a-button>
            <!-- <a-button style="margin-left: 5px;" @click="cancel">返回列表</a-button> -->
        </div>
        <!-- <div style="text-align:center;height:50px;width:100%;position:relative"> -->
        <div style="display: flex; justify-content: center; align-items: center;height:50px; width:100%; position:relative">
            <!-- <span class="tips">
                    处理后图:
            </span>
            <a-input v-model="imgpath" style="width:360px;cursor: pointer;" @click="myOpen(imgpath)" />
            <a-button type="primary" style="margin: 10px" @click="imgResize">Resize处理</a-button> -->
            <a-button type="primary" style="margin: 10px" @click="imgResize" :loading="makeloading">Resize处理</a-button>
            <a-input v-model="imgpath" style="width:360px;cursor: pointer;" @click="myOpen(imgpath)" placeholder="处理后图片的地址"/>
        </div>
    </div>
</template>

<script>
import configSystem from "@/config/system";
import splitPane from "vue-splitpane"
import { axios } from '@/utils/request'
import CanvasSelect from '@/assets/canvas-select.min.js'
import {
    getTemplateMakeinfo,
    findDirImageList,
    getDirTreeDataList,
    getTemplateById, findResizedImageList, findResizedImageObj,
} from '@/api/imageManage'
import {
    getDataSetListById,
} from "@/api/dataCenter";
import debounce from "lodash.debounce";
import { mapState } from "vuex";
import template from "@/store/modules/template";
export default {
    name: 'Step3',
    components: {//引用的其他组件
        splitPane,
    },
    props: {//从父组件传来数据
      "nodeId": "",
      "classId": "",
      "eqpId": [],
    },
    data() {
        return {
            tplDatalistId: '',
            out_dir: '',
            imgpath: "",//处理后图片的地址
            dirTreelist: [],//原图目录树
            imglist: [],//用于resize的图片地址
            resizedObj: null,//用于resizeObj
            rowData: {},
            id: null,
            eqmId:null,
            nasDirectory: null,
            makeloading: false, // Resize处理按钮是否加载中
            columns: [
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
            picturelist: null,//左上角图片列表
            treeData: [],
            cur_img: null,//当前在resize区展示的图片
            cur_img_dir: null,//当前在resize区展示的图片nas目录
            cur_edit: null,//当前编辑的参数
            isresized: false,//是否进行了原图resize
            instance: null,//CanvasSelect实例对象
            option: [],//标注参数,json风格
            point1: {//长方形标注框左下角坐标
                a: null,
                b: null
            },
            point2: {//长方形标注框右上角坐标
                a: null,
                b: null
            },
        }
    },
    computed: {
        ...mapState({
            resizeId: state => template.state.step.resizeId,
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
    created() {
        //主模板ID（前步骤传过来的）

    },

    mounted() {
        this.getMakeInfo();
        this.InitCanvasSelect();//初始化标注组件
        // let tempTemplateId=this.id;
        //resizeId =id;
        this.id = this.resizeId;
        this.eqpId =this.eqpId;
        let tempTemplateId = this.templateId;
        let templateName = this.templateName;
        this.getTemplateObjById(tempTemplateId).then(response => {
            this.getDataSetById(this.tplDatalistId);
        }).catch(error => {
            // 请求失败的回调
        });

        //this.getImageList();//选择目录后触发
    },
    methods: {
        myOpen(url) {
            if (url != null && url != "") {
                let goURl = configSystem.webUrl+ url;
                window.open(goURl);
            }
        },
        nextStep() {
            let body = {
                templateId: this.templateId,//模板ID
                nodeId: this.nodeId,//节点名称
                classId: this.classId,//产品id
                eqpId: this.eqpId,//站点id
                templateName: this.templateName//站点id
            };

          let eqmIdTemp = "";
          // alert(JSON.stringify(this.eqpId))
          if (this.eqpId && this.eqpId.length > 0) {
            eqmIdTemp = this.eqpId.join(",");
            body.eqpId = eqmIdTemp;
          }
          // alert(JSON.stringify(body))
            this.$store.commit('setBasicData', body)
            this.$emit('nextStep')
        },
        prevStep() {
            //回写上一步参数
            let eqmIdTemp = "";
            if (this.eqpId && this.eqpId.length > 0) {
                //console.log(this.eqpId)
                eqmIdTemp = this.eqpId.join(",");
            }
            // alert(JSON.stringify(eqmIdTemp))
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

            this.$emit('prevStep')
            this.$forceUpdate()
        },
        cancel() {
            this.$emit('cancel')
        },
        InitCanvasSelect() {//初始化标注组件
            const script = document.createElement('script');
            script.type = 'text/javascript'
            script.src = '@/assets/canvas-select.min.js';//引入unpkg中的标注库
            // script.src = 'https://unpkg.com/canvas-select@^2/lib/canvas-select.min.js';//引入unpkg中的标注库
            script.async = true;
            script.onload = () => {
                this.instance = new CanvasSelect(".container", this.cur_img);
                this.instance.labelMaxLen = 10;
                this.instance.setData(this.option);
                this.instance.createType = 1;//绘制矩形
                // 图片加载完成
                this.instance.on("load", (src) => {
                });
                // 添加
                this.instance.on("add", (info) => {
                    window.info = info;
                    this.instance.createType = 0;//只能画一个框
                });
                // 删除
                this.instance.on("delete", (info) => {
                    window.info = info;
                    this.instance.createType = 1;
                    this.point1 = {
                        a: null,
                        b: null,
                    };
                    this.point2 = {
                        a: null,
                        b: null,
                    };
                });
                // 选中
                this.instance.on("select", (shape) => {
                    window.shape = shape;
                });
                this.instance.on("updated", (result) => {
                    const list = [...result];
                    list.sort((a, b) => a.index - b.index);
                    this.point1 = {//左下角
                        a: list[0]?.coor[0][0],//x
                        b: list[0]?.coor[1][1],//y
                    };
                    this.point2 = {//右上角
                        a: list[0]?.coor[1][0],
                        b: list[0]?.coor[0][1],
                    };
                    let x = this.point2.a - this.point1.a;
                    let y = this.point1.b - this.point2.b;
                    let long_side = x > y ? x : y;
                    let short_side = x < y ? x : y;
                    //更新长宽信息
                    //this.datasource[0].real_cell_long_side = long_side;
                    //this.datasource[0].real_cell_short_side = short_side;
                    for (let i = 0; i < this.datasource.length; i++) {
                        if (this.datasource[i]["params"] == "real_cell_long_side")
                            this.datasource[i].data = long_side;
                        else if (this.datasource[i]["params"] == "real_cell_short_side")
                            this.datasource[i].data = short_side;
                    }
                });
            }
            try {
              // document.head.appendChild(script);
              document.body.appendChild(script);
            } catch (error) {
              // 处理错误
            }
        },
        loadimg(img) {//加载图片
            //查询当前resize记录之前有没有？
            this.findResizedImageObjInit(this.nodeId, this.classId, img);
            this.$nextTick(() => {

            })
            this.cur_img_dir = img;
            for (let i = 0; i < this.datasource.length; i++) {
                if (this.datasource[i]["params"] == "img_path")
                    this.datasource[i].data = this.cur_img_dir;
            }
            //this.cur_img = "http://10.120.200.35:8008/web" + img;
            this.cur_img = configSystem.webUrl+ img;
            this.instance.setImage(this.cur_img);
            this.instance.setData(this.option);
            this.instance.createType = 1;
        },
        resizeLeft() {//左侧分割面板比例变化处理函数,实现控制最大分割比例
            const splitPane = this.$refs.splitLeft;
            if (splitPane.percent > 30)
                splitPane.percent = 30;
        },
        resizeTop(){
            const splitPane = this.$refs.splitTop;
            if (splitPane.percent > 33)
                splitPane.percent = 33;
        },
        clickEvent(row) {
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
        checkparam(col) {
            for (let i = 0; i < this.datasource.length; i++) {
                if (this.datasource[i]["params"] == col) {
                    return this.datasource[i]["data"];
                }
            }
        },
        imgResize() {//图片resize处理函数
            // if (this.cur_img_dir) {
            //     alert("可以进行Resize处理")
            // }
            if (!this.cur_img_dir) {
                this.$message.info('请选择Resize原始图片');
                return;
            }
            if(isNaN(this.checkparam("real_cell_long_side")) || isNaN(this.checkparam("real_cell_short_side"))) {
                this.$message.info('real_cell_long_side 或 real_cell_short_side不能为空');
                return;
            }
            const params = {
                "id": this.id,
                "templateId": this.templateId,
                "nodeId": this.nodeId,
                "classId": this.classId,
                "stepNum": 22,
                "configJson": {
                    "pt_h": this.checkparam("pt_h"),
                    "pt_w": this.checkparam("pt_w"),
                    "angle_rotate_to_template": this.checkparam("angle_rotate_to_template"),
                    "bias": this.checkparam("bias"),
                    "bound": this.checkparam("bound"),
                    "img_path": this.cur_img_dir,
                    // "out_dir": this.checkparam("out_dir"),
                    "real_cell_long_side": this.checkparam("real_cell_long_side"),
                    "real_cell_short_side": this.checkparam("real_cell_short_side"),
                    "trust_measure": this.checkparam("trust_measure")
                }
            }
            //console.log(params)
            this.makeloading = true;
            // console.log("this.makeloading: ", this.makeloading);
            const jsonparams = JSON.stringify(params);
            axios.post(`/api/v1/dataanalysis/aiTemplateMakeinfo/httpReqTemplateResize`, jsonparams, {
                headers: {
                    'Content-Type': 'application/json',

                }
            }).then(response => {
                // 请求成功的回调，此时返回code===0
                if (response.code != 0)
                    return;
                this.imgpath = response.data.path;
                if (this.imgpath) {
                    this.$message.success('Resize操作成功');
                    this.isresized = true;
                } else {
                    this.$message.error('Resize操作失败');
                    this.isresized = true;
                }
                this.makeloading = false;
                console.log("this.makeloading: ", this.makeloading);
            }).catch(error => {
                // 请求失败的回调
                this.$message.error('Resize操作失败');
            });
        },
        onLoadData() {

        },
        onSelect(checkedKeys, node) {//更新使用的原图目录
            this.getImageList(node.value)
            this.$nextTick(() => {

            })
        },
        async getMakeInfo() {//读取参数配置数据
            await getTemplateMakeinfo("resize").then(ans => {
                if (ans.code != 0)
                    return;
                this.datasource = [];
                let i = 0;
                console.log("ans.data:", ans.data);
                for (const key in ans.data) {
                    if (key != "id" && key != "templateId" && key != "nodeId" && key != "classId" && key != "eqpId" && key != "stepNum" && key != "out_dir" && key!="site_name" ) { //不需求这些字段参数展示
                        let dataVal = ans.data[key];
                        // alert("==="+dataVal)
                        if (key == "angle_rotate_to_template") {
                            dataVal = 0;
                        } else if (key == "pt_h") {
                            dataVal = 600;
                        } else if (key == "pt_w") {
                            dataVal = 200;
                        } else if (key == "bias") {
                            dataVal = 20;
                        } else if (key == "real_cell_long_side") {
                            dataVal = 226;
                        } else if (key == "real_cell_short_side") {
                            dataVal = 76;
                        } else if (key == "bound") {
                            dataVal = 15;
                        } else if (key == "trust_measure") {
                            dataVal = 1;
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
            /*
             * 横版
            let column_list = Object.keys(ans.data);
            for (let i = 0; i < column_list.length; i++) {
                let width = "";
                if (column_list[i].length >= 16)
                    width = '200px';
                else
                    width = '120px';
                this.columns.push({
                    title: column_list[i],//当前列标题
                    ellipsis: true,
                    dataIndex: column_list[i],
                    key: column_list[i],
                    width: width,
                    scopedSlots: { customRender: "input" },
                    customCell: (row) => {
                        return this.clickEvent(column_list[i])//为混淆矩阵添加点击事件
                    },
                });
            }
            ans.data.id = 1;
            this.datasource = new Array();
            this.datasource.push(ans.data);
            */
        },
        async getDataSetById(datasetId) {
            const params = datasetId;
            const data = await getDataSetListById(params)
            this.loading = false
            if (data.code !== 0) return false
            //alert(data.data.dlRealDir);
            let dlRealDir = data.data.dlRealDir.replaceAll("/data/dataList_package/", "/home/nfs/tcl-ai-data-pvc-dfea0a0e-773b-42d6-8cf5-f12209e1d496/dataList_package/") + "";
            //alert(dlRealDir)
            //查原图目录树
            const ans = await getDirTreeDataList("" + dlRealDir);
            if (ans.code != 0)
                return;
            for (let i = 0; i < ans.data.length; i++) {
                ans.data.id = i;
            }
            this.treeData = ans.data.children;
            // console.log("treeData: ", this.treeData);
        },
        async getTemplateObjById(params) { //通查模板ID=1， 查数据库集ID（1069）
            const ans = await getTemplateById(params);
            if (ans.code != 0)
                return;
            this.tplDatalistId = ans.data.tplDatalistId;
            //回写左边参数(out_dir)
            // for (let i = 0; i < this.datasource.length; i++) {
            //    if (this.datasource[i]["params"] == "out_dir")
            //     this.datasource[i].data = ans.data.outPath;
            // }

        },
        async getDirTreeList(params) {
            const ans = await getDirTreeDataList(params);
            if (ans.code != 0)
                return;
            for (let i = 0; i < ans.data.length; i++) {
                ans.data.id = i;
            }
            this.dirTreelist = ans.data;
        },
        async getImageList(pathValue) {//读取用于resize的图片地址
            const params = { "dirPath": pathValue };
            const ans = await findDirImageList(params);
            if (ans.code != 0)
                return;
            for (let i = 0; i < ans.data.length; i++) {
                ans.data.id = i;
            }
            this.imglist = ans.data;
            console.log(this.imglist)
        },
        async findResizedImageObjInit(nodeIdVal, classIdVal, inputImageVal) {
            const params = {
                nodeId: nodeIdVal,
                classId: classIdVal,
                inputImage: inputImageVal,
            };

            const ans = await findResizedImageObj(params);
            if (ans.code != 0) {
                return;
            } else {
                this.resizedObj = ans.data;
                if (this.resizedObj) {
                    // console.info(JSON.stringify(this.resizedObj))
                    this.id = this.resizedObj.id;
                    // this.templateId =this.resizedObj.templateId;
                    // this.nodeId =this.resizedObj.nodeId;
                    // this.classId =this.resizedObj.classId;
                    this.imgpath = this.resizedObj.outImage;
                    let configJsonOjb = JSON.parse(this.resizedObj.configJsonStr);
                    //回写设置项
                    for (let i = 0; i < this.datasource.length; i++) {
                        if (this.datasource[i]["params"] == "pt_h") {
                            this.datasource[i].data = configJsonOjb.pt_h;
                        } else if (this.datasource[i]["params"] == "pt_w") {
                            this.datasource[i].data = configJsonOjb.pt_w;
                        } else if (this.datasource[i]["params"] == "angle_rotate_to_template") {
                            this.datasource[i].data = configJsonOjb.angle_rotate_to_template;
                        } else if (this.datasource[i]["params"] == "bias") {
                            this.datasource[i].data = configJsonOjb.bias;
                        } else if (this.datasource[i]["params"] == "bound") {
                            this.datasource[i].data = configJsonOjb.bound;
                        } else if (this.datasource[i]["params"] == "real_cell_long_side") {
                            this.datasource[i].data = configJsonOjb.real_cell_long_side;
                        } else if (this.datasource[i]["params"] == "real_cell_short_side") {
                            this.datasource[i].data = configJsonOjb.real_cell_short_side;
                        } else if (this.datasource[i]["params"] == "trust_measure") {
                            this.datasource[i].data = configJsonOjb.trust_measure;
                        }
                    }
                }

                // alert(this.templateId)
                // alert(this.nodeId)
                // alert(this.classId)
                // alert(inputImageVal)
            }

        },
        onTabelChange(e, record) {
            this.datasource[record.id].data = e.target.value;
        },
    }
}
</script>

<style scoped>
.imgname {
    text-align: center;
    background-color: rgba(240, 240, 240, 0.5);
    border-radius: 15px;
    padding: 0 10px;
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

.container {
    background-color: #ccc;
    height: 960px;
    width: 100%;
    display: block;
    margin: 0 auto;
    z-index: 99;
}

.outercontainer {
    height: 960px;
    width: 100%;
}
</style>