<template>
  <div>
    <div class="box" style="margin-top: 2px;">
    <split-pane :min-percent="0" :max-percent="15" :default-percent="defaultValue" split="vertical" @resize="resizeLeft" ref="splitLeft">
      <template slot="paneL">
        <split-pane :min-percent="11" :max-percent="26" :default-percent="26" split="horizontal" @resize="resizeTop" ref="splitTop">
          <template slot="paneL">
            <p-card title="Resize后原图" style="margin: 2px;">
              <p-select v-model="resizedImageUrl" @change="setResizedimg" class="select" >
                <p-select-option value="">--请选择图片--</p-select-option>
                <p-select-option v-for="img in this.resizeDatalist" :value="img.outImage" placeholder="切换底板图" :title="img.outImage">
                  {{img.outImage}}
                </p-select-option>
              </p-select>
              <!--
                <div ref="selectBox" class="selectdrop">
                    <p-select :getPopupContainer="()=>this.$refs.selectBox" class="select" v-model="checkSelect" @change="setResizedimg">
                        <p-select-option v-for="img in this.resizeDatalist" :value="img.outImage" placeholder="切换底板图">
                            {{img.outImage}}
                        </p-select-option>
                    </p-select>
                </div>
                -->
                <div class="sitelist">
                  <div v-for="unit in units" class="unit">
                    <h3>{{ unit.compName }}</h3>
                    <hr width="100%" color="MediumBlue" size=10 style="margin-bottom:10px;" />
                    <template v-for="tag in unit.childList">
                      <!--#87d068 成功 #108ee9 进行中 #f50 失败-->
                      <p-tag style="margin-top: 5px;" :color="getcolor(tag.stepNum)" @click="changeimg(unit.compName, tag.indImageName,tag.resizedImageUrl)">{{tag.indImageName}}</p-tag>
                    </template>
                  </div>
                </div>
            </p-card>
          </template>
          <template slot="paneR">
            <div style="height:645px;overflow:auto;">
              <p-card title="组件参数" style="margin:2px;">
                <p-table :scroll="{ x: hidden, y:true }"
                        :pagination="false"
                        :columns="columns"
                        :data-source="datasource"
                        :rowKey="record => record.id"
                        style="margin:5px"
                        v-if="this.datasource.length > 0">
                  <template slot="input" slot-scope="text, record">
                    <p-input v-model="text" @change="(event)=>onTabelChange(event,record)"></p-input>
                  </template>
                </p-table>
              </p-card>
            </div>
          </template>
        </split-pane>
      </template>
      <template slot="paneR">
        <split-pane :min-percent="80" :max-percent="26" :default-percent="86" split="vertical" @resize="resizeRight" ref="splitRight">
          <template slot="paneL">
            <div style="position: relative;overflow: auto;">
              <p-popover title="标注组件操作指南" class="tipsbutton" placement="leftTop">
                <template slot="content">
                  <div class="bottom">
                    <pre>1.设置 instance.createType 指定需要创建形状类型。

2.创建矩形时，按住鼠标左键拖动完成创建。

3.创建多边形时，鼠标左键单击添加点，双击闭合完成创建，Escape退出创建，Backspace退一步删除选择点。

4.创建折线时，鼠标左键单击添加点，双击完成创建，Escape退出创建，Backspace退一步删除选择点。

5.按住鼠标右键拖动画布。

6.鼠标滚轮缩放画布。

7.选中形状，Delete删除。
                    </pre>
                  </div>
                </template>
                <p-icon type="question-circle" class="icon"></p-icon>
              </p-popover>
              <div style="position: absolute; top: 40px; right: 15px;">
                <p-icon v-if="isAmplify" type="scan" class="icon" @click="shrinkCanvas"/>
                <p-icon v-if="!isAmplify" type="zoom-in" class="icon" @click="amplifyCanvas" style="font-size: 23px;margin-right: -2px;"/>
              </div>
              <div style="overflow: auto;">
                <canvas id="container" class="container" style="cursor: default;margin: 0px auto;"></canvas>
                <div style="position: relative; text-align: center;margin:5px 10px 30px;">
                  <div class="buttonlist">
                    <p-button type="primary" @click="change(1)" class="littlebutton">矩形</p-button>
                    <p-button type="primary" @click="change(2)" class="littlebutton">多边形</p-button>
                    <p-button type="primary" @click="change(3)" class="littlebutton">点</p-button>
                    <p-button type="primary" @click="change(4)" class="littlebutton">折线</p-button>
                    <p-button type="primary" @click="change(5)" class="littlebutton">圆</p-button>
                    <p-button type="primary" @click="copy()" style="margin: 5px">复制</p-button>
                    <p-button type="primary" @click="upsideDown()" style="margin: 5px">上下翻转</p-button>
                    <p-button type="primary" @click="leftAndRight()" style="margin: 5px">左右翻转</p-button>
                    <p-button type="primary" @click="change(0)" class="littlebutton">取消</p-button>
                    <p-button type="primary" @click="zoom(true)" class="littlebutton">+</p-button>
                    <p-button type="primary" @click="zoom(false)" class="littlebutton">-</p-button>
                    <p-button type="primary" @click="fitting()" class="littlebutton">图片自适应大小</p-button>
                    <p-button type="primary" @click="onFocus()" class="littlebutton">仅显示当前选中标注</p-button>
                    <p-button type="primary" @click="update()" class="littlebutton">更新</p-button>
                    <p-button type="primary" @click="clearAll()" style="margin: 5px">清除标注</p-button>
                  </div>
                </div>
                <p-label class="label-position">x：{{this.mousepoint.x}},  y：{{this.mousepoint.y}}</p-label>
              </div>
            </div>
          </template>
          <template slot="paneR">
            <p-card title="输出的json格式文件" class="rightcard" style="min-width: 200px;">
              <p-switch-form :model="form"
                            :col="1"
                            :row="20"
                            :gutter="10"
                            layout="horizontal"
                            style="margin: 5px auto 0;">
                <p-switch-form-item label="站点:">
                  <p-select v-model="currentEqpId" @change="selEqpfn" style="width: 120px;margin-left:-63px">
                    <p-select-option v-for="opt in eqpIdArr" :key="opt" placeholder="选择站点:" :value="opt">
                      {{ opt }}
                    </p-select-option>
                  </p-select>
                </p-switch-form-item>
                <p-switch-form-item label="部件标识:">
                  <p-input v-model="currentIdentify" @keyup="selIdentifyfn" style="width: 120px; margin-left: -63px"
                          placeholder="请输入部件标识" allow-clear/>
                </p-switch-form-item>
              </p-switch-form>
              <p-label style="display:block;margin-top:5px;font-size: 14px;">Label重命名：</p-label>
              <div class="labellist">
                <ul>
                  <li v-if='index!=flagShowLabelIndex' v-for="(item,index) in labelLi" @click = "selectLabelClick(item, index)"  v-on:dblclick="editLabel(index)" :class='index==selectedLabel?"selected":"labelDefaultColor"' :key="index">{{item.label}}</li>
                  <li v-else @keyup='inputLabelText(item.uuid,item.label,"inputing")'><p-input style="margin-bottom: 3px;" type="text" v-model="item.label" @keyup.enter='inputLabelText(item.uuid,item.label,"end")'/></li>
                </ul>
              </div>
              <div style="position: absolute; left: 50%;bottom: 10%;">
                <div style="position: relative;">
                  <textarea id="output" @change="changeData" ref="output"
                          :style="{'display':openjson?'block':'none'}" class="textareaStyle"></textarea>
                  <p-button type="primary" shape="circle" @click="OpenorClosejson" :title="jsontitle" size="middle" style="padding:5px;border-radius: 50%;margin-top: 20px;">
                    <p-icon type="up" style="font-size: 16px; color:white;" v-if="openjson"></p-icon>
                    <p-icon type="down" style="font-size: 16px; color:white;" v-if="openjson==false"></p-icon>
                  </p-button>
                </div>
              </div>
            </p-card>
          </template>
        </split-pane>
      </template>
    </split-pane>
    <!-- <div class="left" >
      
    </div>
    
    <div class="right">
                     <p-checkbox :indeterminate="indeterminate" :checked="checkAll" @change="onCheckAllChange">
                         全选
                     </p-checkbox>
                     <br />
      显示标注组件的复选框列表
                     <p-checkbox-group v-model="LabelList"
                                       :options="selectedLabelList"
                                       @change="onChange">
                     </p-checkbox-group>
                     {{LabelList}}
                     {{labelTitleList}}
    </div> -->
  </div>
  <div v-if="!isAmplify">
    <div style="float: left; margin-top:50px; background-color: #fff;">
      <p-button @click="prevStep">上一步</p-button>
      <p-button type="primary" style="margin-left: 10px" @click="nextStep">下一步</p-button>
      <p-button style="margin-left: 10px;" @click="cancel">返回列表</p-button>
    </div>
    <div style="max-width: 720px; margin: 30px auto 30px;">
      <div class="mark-list">
        <p-button size="middle"
                  style="width:120px"
                  class="addNode"
                  @click="confirmMark"
                  type="primary">
          确认标注
        </p-button>
        <p-input v-model="jsonPath" style="width: calc(100% - 140px); margin-left: 10px;" disabled placeholder="标注后文件"/>
      </div>
      <div class="mark-list">
        <p-button size="middle"
                  style="width:120px"
                  class="addNode"
                  @click="confirmComponentMake"
                  type="primary"
                  :loading="makeloading">
          部件模板制作
        </p-button>
        <p-input v-model="outputpath" style="width: calc(100% - 140px); margin-left: 10px;" disabled placeholder="输出总目录"/>
      </div>
      <div class="mark-list">
        <p-label style="width:120px;height:30px;line-height: 30px;font-size: 12px;text-align: center;" class="">部件模板制作图展示：</p-label>
        <p-select v-model="currentImgValue" @change="selectImage" style="width: calc(100% - 140px);margin-left: 10px;">
          <p-select-option value="">--请选择图片--</p-select-option>
          <p-select-option v-for="(opt, index) in markedImageList" :key="index" placeholder="选择图片:" :value="opt.imageWebUrl">
            {{ opt.imageName }}
          </p-select-option>
        </p-select>
        <!-- <p-input v-model="outputpath" style="width: calc(100% - 140px); margin-left: 10px;" disabled placeholder="输出总目录"/> -->
      </div>
      <!-- <div class="mark-list" style="margin-left: 65px;">
        <p-input v-model="indImageUrl" style="width: calc(100% - 140px) ;cursor: pointer" @click="myOpen(indImageUrl)" placeholder="部件模板图"/>
      </div> -->
    </div>
  </div>
    <!-- <p-switch-form :model="form"
                   :col="1"
                   :row="20"
                   layout="horizontal"
                   >
      <p-switch-form-item label="">
        
      </p-switch-form-item>
      <p-switch-form-item label="">
        
      </p-switch-form-item>
      <p-switch-form-item label="">
        
      </p-switch-form-item>
    </p-switch-form> -->
  </div>
</template>
<script>
import configSystem from "@/config/system";
import splitPane from "vue-splitpane"
import {axios} from '@/utils/request'
// import CanvasSelect from '@/assets/canvas-select2.14.min.js'
import CanvasSelect from '@/assets/canvas-select.min.js'
import {
  getComplabelNodeListData,
  getTemplateMakeinfo,
  findResizedImageList,
  findDirImageList,
  findStepComplabelObjByNodeClassIdEqmIdIndName, 
  findResizedImageObj,
} from '@/api/imageManage'
import { getPictureFilePath } from "@/api/modelManage";
import {mapState} from "vuex";
import template from "@/store/modules/template";
import {messageSource} from "@/api/appCenter";
import systemConfig from "@/views/system/systemConfig/index.vue";
// import CanvasSelect from "canvasSelect"

export default {
  name: 'CanvasSelect',
  components: {//引用的其他组件
    splitPane,
  },
  props: {//从父组件传来数据
    "nodeId": "",
    "classId": "",
    "eqpId": [],
    "stepNum": 22,
    "indImageName": "M1",
  },
  data() {
    return {
      defaultValue: 15,
      isAmplify: false,
      complabelObj: null, //
      templateInput: this.templateId, //当前主模板任务
      nodeIdInput: this.nodeId,
      classIdInput: this.classId,
      eqpIdInput: '',
      eqpIdArr :[],
      indImageNameInput: 'M1',
      jsonContentInput: [],
      originalpath: "",//标注底图
      instance: null,//CanvasSelect实例对象
      saveloading: false,//记录正在完成设置
      makeloading: false,//部件模板制作
      imgpath: "",//标注后图的地址
      jsonPath: "",//标注后图的地址
      outputpath: "",//输出总目录的地址
      markedImageList: "", // 输出总目录的图片
      indImageUrl: "",//输出总目录的地址
      resizeDatalist: [],
      resizedImageUrl: "", //Resized图
      units: [],
      currentEqpId: null,//当前站点
      currentIdentify: null,//当前部件标识
      columns: [//组件参数表头
        {
          title: "编号",
          dataIndex: "id",
          key: "id",
          width: '15%',
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
          width: '33%',
          scopedSlots: {customRender: "input"},
          customCell: (row) => {
            return this.clickEvent(row)//为混淆矩阵添加点击事件
          },
        },
      ],
      datasource: [],
      iscomponentmaked: false,
      indeterminate: false,//多选框部分选取
      checkAll: false,
      LabelList: ['1', '2', '3'],//标注框列表
      selectedLabelList: ['1', '2'],//被选中的标注框列表
      labelTitleList: [],
      labelLi: [],
      flagShowLabelIndex: -1,
      selectedLabel: -1,
      openjson: false,//右侧标注json是否显示
      jsontitle: "展开标注json",
      mousepoint: {
        x: null,
        y: null
      },
      timer: null,
      iseditlabel: false,
      currentImgValue: "",
      canvasWidth: (window.innerWidth - 500),
      canvasHeight: (window.innerHeight - 60),
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
    this.templateInput = this.templateId;
    this.templateName = this.templateName;
    // alert(this.templateInput)
    this.nodeIdInput = this.nodeId;
    this.classIdInput = this.classId;
    this.eqpIdArr = this.eqpId.split(",");
    this.getMakeInfo();
    this.useCanvas();

    //alert(this.templateId+"===NodeId=="+this.nodeId+"ClassId=="+this.classId);
    //暂时固定传参数，测试用
    this.getComplabelNodeListInit(this.templateId);
    //alert(this.nodeId+"==="+this.classId);
    this.findResizedImageListInit(this.nodeId, this.classId);

    

    document.addEventListener('DOMContentLoaded', function () {//禁用鼠标手势
      var element = document.documentElement;

      element.addEventListener('MSPointerDown', function (e) {
        if (e.pointerType === 'touch') {
          e.preventDefault();
        }
      }, false);

      element.addEventListener('MSPointerMove', function (e) {
        if (e.pointerType === 'touch') {
          e.preventDefault();
        }
      }, false);

      element.addEventListener('MSPointerUp', function (e) {
        if (e.pointerType === 'touch') {
          e.preventDefault();
        }
      }, false);
    });
    
    const canvas = document.getElementById("container");
    
    this.changeCanvas(canvas);


    let timer = null; // timer用来控制事件的触发
    let _this = this;
    // window.addEventListener('resize', function(){
    //   if(timer !== null) {
    //     return ;
    //   }
    //   timer = setTimeout(() => {
    //     console.log("okkk!")
    //     _this.changeCanvas(canvas);
    //     clearTimeout(timer);
    //     timer = null;
    //     // console.log("timer: ", timer);
    //   }, 100);
    // });
  },
  methods: {
    changeCanvas(canvas) {
      console.log(canvas);
      // canvas.width = (window.innerWidth * 0.9);
      // canvas.height = (window.innerHeight - 60);
      canvas.style.width = (window.innerWidth * 0.9) + 'px';
      canvas.style.height = (window.innerHeight * 0.8) + 'px';
      console.log("changeCanvas: ", window.innerWidth * 0.9, " ", window.innerHeight * 0.8);
    },
    amplifyCanvas() {
      this.defaultValue = 0;
      this.isAmplify = true;
    },
    shrinkCanvas() {
      this.defaultValue = 15;
      this.isAmplify = false;
    },
    useCanvas() {
      const option = [];
      
      // const script = document.createElement('script');
      // /*
      // script.setAttribute('src', 'https://unpkg.com/canvas-select@^2/lib/canvas-select.min.js');
      // document.head.appendChild(script);
      // */
      // script.type = 'text/javascript'
      // script.src = '@/assets/canvas-select.min.js';
      // // script.src = 'https://unpkg.com/canvas-select@^2/lib/canvas-select.min.js';
      // script.async = true;
      // script.onload = () => {

      // }
      // document.body.appendChild(script);

      //获取container元素
      let canvasContainer = document.getElementById("container");
        // document.getElementById("container").width = "90%";
        // document.getElementById("container").height = "90%";

      this.instance = new CanvasSelect(
          ".container",
          this.originalpath
      );
      this.instance.labelMaxLen = 10;
      this.instance.setData(option);

      // 图片加载完成
      this.instance.on("load", (src) => {
        // console.log("image loaded", src);
        this.debounce(100);
      });
      // 添加
      this.instance.on("add", (info) => {
        // console.log("add", info);
        window.info = info;
        this.debounce(100);
      });

      // 删除
      this.instance.on("delete", (info) => {
        // console.log("delete", info);
        window.info = info;
        this.debounce(100);
      });
      // 选中
      this.instance.on("select", (shape) => {
        // console.log("select", shape);
        window.shape = shape;
        this.debounce(100);
      });
      //鼠标形状
      this.instance.on('mouseCursorShape', (info) => {
        if (info === "default") {
          canvasContainer.style.cursor = "default"  //默认
        } else if (info === "dragging") {
          canvasContainer.style.cursor = "pointer"  //拖拽
        } else if (info === "enterShape") {
          canvasContainer.style.cursor = "pointer"  //进入标注图
        }
      });
      //鼠标在画布上的坐标
      this.instance.on('pixelCoordinates', (info) => {
        this.mousepoint.x = info[0]
        this.mousepoint.y = info[1]
        // console.log('像素坐标：：：：：：：', info)
      });

      this.instance.on("updated", (result) => {
        const list = [...result];
        list.sort((a, b) => a.index - b.index);
        this.labelLi = list
        this.selectedLabel = -1
        this.labelLi.forEach((item, i) => {
          if (item.active) {
            this.selectedLabel = i;
          }
        });
        this.$refs.output.value = JSON.stringify(list, null, 2);
        if (this.iseditlabel)
          this.debounce(0);
        else
          this.debounce(100);
        //this.selectedLabelList = this.selectedLabelList.filter(function (item) {//过滤B中不存在的元素
        //    return this.LabelList.indexOf(item) !== -1;
        //});
      });
      /*
      //显示鼠标坐标
      window.addEventListener('mousemove', function (event) {
          const rect = this.instance.getBoundingClientRect();
          this.mousepoint.x = event.clientX - rect.left;
          this.mousepoint.y = event.clientY - rect.top;

          // 在控制台打印鼠标的横纵坐标
          console.log("x:", +this.mousepoint.x + " y:" + this.mousepoint.y);
      });
      */
    },
    resizeLeft() {//左侧分割面板比例变化处理函数,实现控制最大分割比例
            const splitPane = this.$refs.splitLeft;
            if (splitPane.percent > 25)
                splitPane.percent = 25;
    },
    resizeTop(){
        const splitPane = this.$refs.splitTop;
        if (splitPane.percent > 26)
            splitPane.percent = 26;
    },
    resizeRight(){
        const splitPane = this.$refs.splitRight;
        if (splitPane.percent > 100)
            splitPane.percent = 100;
    },
    updateLabelList() {//更新标注列表
      this.jsonContentInput = JSON.parse(this.$refs.output.value);
      this.LabelList = [];
      this.labelTitleList = [];
      for (let i = 0; i < this.jsonContentInput.length; i++) {
        this.LabelList[i] = this.jsonContentInput[i].uuid;
        this.labelTitleList[i] = this.jsonContentInput[i].label;
      }
    },
    debounce(delay) {//防抖执行函数，延迟为delay(ms)
      if (this.timer !== null) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.updateLabelList();
      }, delay);
    },
    OpenorClosejson() {
      this.openjson = !this.openjson;
      if (this.openjson == true)
        this.jsontitle = "收起标注json";
      else
        this.jsontitle = "展开标注json";
    },
    myOpen(url) {
      if (url != null && url != "") {
        let goURl = configSystem.webUrl + url;
        window.open(goURl);
      }
    },
    async findStepComplabelObjByNodeClassIdEqmIdIndNameInit(nodeIdVal, classIdVal, eqpIdVal, indNameVal) {
      const params = {
        nodeId: nodeIdVal,
        classId: classIdVal,
        eqpId: eqpIdVal,
        indImageName: indNameVal
      };
      const ans = await findStepComplabelObjByNodeClassIdEqmIdIndName(params);
      if (ans.code != 0) {
        return;
      } else {
        this.complabelObj = ans.data;
        this.jsonPath = this.complabelObj.jsonPath;
        if (this.jsonPath == "" | this.jsonPath == null) {
          this.jsonPath = ans.data.jsonPath;
        }
        this.outputpath = this.complabelObj.outPath;
        this.indImageUrl = this.complabelObj.indImageUrl;
        let confJsonObj = JSON.parse(this.complabelObj.configJsonStr);
        // console.log(confJsonObj)
        let jsonContentArrObj = this.complabelObj.jsonContentStr;
        this.$refs.output.value = eval(jsonContentArrObj);

        this.instance.setData(eval(this.$refs.output.value));

        if (confJsonObj) {
          for (let i = 0; i < this.datasource.length; i++) {
            if (this.datasource[i]["params"] == "template_cell_horizontal_length") {
              this.datasource[i].data = confJsonObj.template_cell_horizontal_length;
            } else if (this.datasource[i]["params"] == "template_cell_vertical_length") {
              this.datasource[i].data = confJsonObj.template_cell_vertical_length;
            } else if (this.datasource[i]["params"] == "num_cells_horizontally_in_unit") {
              this.datasource[i].data = confJsonObj.num_cells_horizontally_in_unit;
            } else if (this.datasource[i]["params"] == "num_cells_vertically_in_unit") {
              this.datasource[i].data = confJsonObj.num_cells_vertically_in_unit;
            } else if (this.datasource[i]["params"] == "num_units_horizontally") {
              this.datasource[i].data = confJsonObj.num_units_horizontally;
            } else if (this.datasource[i]["params"] == "num_units_more_in_large_template") {
              this.datasource[i].data = confJsonObj.num_units_more_in_large_template;
            } else if (this.datasource[i]["params"] == "num_units_vertically") {
              this.datasource[i].data = confJsonObj.num_units_vertically;
            } else if (this.datasource[i]["params"] == "startC") {
              this.datasource[i].data = confJsonObj.startC;
            } else if (this.datasource[i]["params"] == "startR") {
              this.datasource[i].data = confJsonObj.startR;
            } else if (this.datasource[i]["params"] == "flip_horizontally") {
              this.datasource[i].data = confJsonObj.flip_horizontally;
            } else if (this.datasource[i]["params"] == "flip_horizontal_offset") {
              this.datasource[i].data = confJsonObj.flip_horizontal_offset;
            } else if (this.datasource[i]["params"] == "index_same") {
              this.datasource[i].data = confJsonObj.index_same;
            } else if (this.datasource[i]["params"] == "main_comp_ind") {
              this.datasource[i].data = confJsonObj.main_comp_ind;
            } else if (this.datasource[i]["params"] == "color_direction") {
              this.datasource[i].data = confJsonObj.color_direction;
            } else if (this.datasource[i]["params"] == "color") {
              this.datasource[i].data = confJsonObj.color ? eval(confJsonObj.color) : "";
            } else if (this.datasource[i]["params"] == "factory_product") {
              this.datasource[i].data = confJsonObj.factory_product;
            } else if (this.datasource[i]["params"] == "ind_image_name") {
              this.datasource[i].data = confJsonObj.ind_image_name;
            } else if (this.datasource[i]["params"] == "generate_pxl") {
              this.datasource[i].data = confJsonObj.generate_pxl;
            } else if (this.datasource[i]["params"] == "json_path") {
              //jsonpath
              this.datasource[i].data = ans.data.jsonPath;
            }
          }
        }
      }
    },
    selEqpfn() {//选择站点
      let factoryproduct = this.nodeIdInput + "_" + this.currentEqpId;
      //alert(factoryproduct);
      for (let i = 0; i < this.datasource.length; i++) {
        if (this.datasource[i]["params"] == "factory_product")
          this.datasource[i].data = factoryproduct;
      }
    },
    selectImage() {
      // console.log(this.currentImgValue);
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
      });
    },
    selIdentifyfn() {
      // alert(this.currentIdentify);
      for (let i = 0; i < this.datasource.length; i++) {
        if (this.datasource[i]["params"] == "ind_image_name")
          this.datasource[i].data = this.currentIdentify;
      }
    },
    getcolor(stepNum) {
      if (stepNum == 32)
        return "#87d068";
      else
        return "#108ee9";
    },
    async getComplabelNodeListInit(templateIdVal) {//获取组件图片列表
      const res = await getComplabelNodeListData(templateIdVal);
      if (res.code != 0)
        return;
      this.units = res.data;
    },
    async findResizedImageListInit(nodeIdVal, classIdVal) {//获取已resized原图列表
      const params = {
        nodeId: nodeIdVal,
        classId: classIdVal,
      };
      let resizedDataArr = [];
      const ans = await findResizedImageList(params);
      if (ans.code != 0)
        return;
      for (let i = 0; i < ans.data.length; i++) {
        ans.data.id = i;
      }
      this.resizeDatalist = ans.data;
    },
    change(num) {
      this.instance.createType = num;
      this.iseditlabel = false;
    },
    zoom(type) {
      this.instance.setScale(type);
    },
    fitting() {
      this.instance.fitZoom();
    },
    changeData() {
      const data = JSON.parse(this.$refs.output.value);
      this.instance.setData(data);
    },
    onFocus() {
      this.instance.setFocusMode(!this.instance.focusMode);
    },
    update() {
      this.instance.updateData();
    },
    copy() {
      this.instance.transformShape('copy')
    },
    upsideDown() {
      this.instance.transformShape('upsideDown')
    },
    leftAndRight() {
      this.instance.transformShape('leftAndRight')
    },
    clearAll() {
      this.instance.clearAllMark()
    },
    nextStep() {
      let body = {
        templateId: this.templateId,//模板ID
        templateName: this.templateName,//站点id
        nodeId: this.nodeId,//节点名称
        classId: this.classId,//产品id
        eqpId: this.eqpId,//站点id
      };

      let eqmIdTemp = "";
      if (this.eqpId && this.eqpId.length > 0) {
        eqmIdTemp = this.eqpId.split(",");
        body.eqpId = eqmIdTemp;
      }

      this.$store.commit('setBasicData', body);
      this.$emit('nextStep');
      // if (this.iscomponentmaked) {//若满足下一步条件
      //     this.$emit('nextStep');
      // }
      // else {
      //     this.$message.error('部件模板未制作');
      // }
    },
    prevStep() {
      let body = {
        // id: this.templateId,//模板主键id
        templateId: this.templateId,//模板ID
        templateName: this.templateName,//模板名称
        nodeId: this.nodeId,//节点名称
        classId: this.classIdInput,//产品id
        eqpId: this.eqpId,//站点id

      };
      let eqmIdTempArr=[]
      // alert(JSON.stringify(body))
      if (body.eqpId) {
        eqmIdTempArr = body.eqpId.split(",");
        body.eqpId=eqmIdTempArr;
      }
      this.$store.commit('setBasicData', body);
      this.$emit('prevStep');
    },
    cancel() {
      this.$emit('cancel');
    },
    checkdebounce() {
      this.iseditlabel = true;
    },
    blur() {//失去焦点
      this.iseditlabel = false;
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
      this.datasource[record.id].data = e.target.value;
    },
    onCheckAllChange(e) {//改变全选复选框状态时，更新类别复选框状态
      this.$set(this.form, 'selectedType', e.target.checked ? this.selectedTypeList.map(item => item.value) : [])
      Object.assign(this, {//赋值更新全选框状态
        indeterminate: false,
        checkAll: e.target.checked,
      });
    },
    onChange(checkedList) {//改变类别复选框状态时，更新全选复选框状态
      this.indeterminate = !!checkedList.length && checkedList.length < this.selectedLabelList.length;
      this.checkAll = checkedList.length === this.selectedLabelList.length;
    },
    // changeLabelTitleVal(index, labelNewTitle) {
    //     let dataArr = JSON.parse(this.$refs.output.value);
    //     for (let i = 0; i < dataArr.length; i++) {
    //         if (index == i) {
    //             dataArr[i].label = labelNewTitle;
    //         }
    //     }
    //     // alert(JSON.stringify(dataArr));
    //     this.instance.setData(dataArr);
    // },

    selectLabelClick(item, index) {
      this.flagShowLabelIndex = -1
      this.selectedLabel = index;
      this.instance.selectByUUID(item.uuid)
    },

    editLabel(index) {
      this.flagShowLabelIndex = index
    },
    inputLabelText(shapeUuid, newLabel, state) {
      if (state == "end") {
        this.flagShowLabelIndex = -1
      }
      this.instance.setLabelByUUID(shapeUuid, newLabel)
    },
    confirmMark() {//确认标注
      if (this.resizedImageUrl == null || this.resizedImageUrl == "") {
        this.$message.warn('请选择Resize后的大图!');
        return;
      }
      this.jsonContentInput = JSON.parse(this.$refs.output.value);
      if (this.currentEqpId == null || this.currentEqpId == "") {
        this.$message.warn('请输入当前站点!');
        return;
      }

      if (this.currentIdentify == null || this.currentIdentify == "") {
        this.$message.warn('请输入当前部件标识!');
        return;
      }
      if (this.jsonContentInput == null || this.jsonContentInput == "" || this.jsonContentInput == "[]") {
        this.$message.warn('请标注内容!');
        return;
      }
      let complabelMarkConfirmDataTemp = {
        "templateId": this.templateInput,
        "nodeId": this.nodeIdInput,
        "classId": this.classIdInput,
        "eqpId": this.currentEqpId,
        "resizedImageUrl": this.resizedImageUrl,
        "indImageName": this.currentIdentify,
        "jsonContent": this.jsonContentInput
      };
      let messageContent = "确认标注无误？";
      this.$confirm({
        title: '部件标注操作',
        content: messageContent,
        cancelText: '取消',
        okText: '确定',
        width: 600,
        okButtonProps: {
          props: {disabled: false},
        },
        onOk: () => {
          axios.post(`/api/v1/dataanalysis/aiTemplateMakeinfo/stepComplabel/markConfirmation`, complabelMarkConfirmDataTemp, {
            headers: {
              'Content-Type': 'application/json',

            }
          }).then(response => {
            // 请求成功的回调，此时返回code===0
            this.$message.success('标注确认完成');
            this.getComplabelNodeListInit(this.templateId);
            this.findResizedImageListInit(this.nodeId, this.classId);
            this.jsonPath = response.data.jsonPath;
            //this.$forceUpdate();//刷新
            //回写jsonPath
            for (let i = 0; i < this.datasource.length; i++) {
              if (this.datasource[i]["params"] == "json_path")
                this.datasource[i].data = response.data.jsonPath;
            }
          }).catch(error => {
            // 请求失败的回调
          });
        },
        onCancel() {
        }
      })
    },
    checkparam(col) {
      for (let i = 0; i < this.datasource.length; i++) {
        if (this.datasource[i]["params"] == col) {
          return this.datasource[i]["data"];
        }
      }
    },
    confirmComponentMake() { //部件模板制作
      this.jsonContentInput = JSON.parse(this.$refs.output.value);
      if (this.currentEqpId == null || this.currentEqpId == "") {
        this.$message.warn('请输入当前站点!');
        return;
      }
      if (this.currentIdentify == null || this.currentIdentify == "") {
        this.$message.warn('请输入当前部件标识!');
        return;
      }
      // if (this.jsonPath == null || this.jsonPath == "") {
      //   this.$message.warn('无标注文件,请先确认标注!');
      //   return;
      // }
      let fpIsNull = 1;
      for (let i = 0; i < this.datasource.length; i++) {
        if (this.datasource[i]["params"] == "factory_product")
          if (this.datasource[i].data === null || this.datasource[i].data == "") {
            fpIsNull = 1;
          } else {
            fpIsNull = 0;
          }
      }
      if (1 == fpIsNull) {
        this.$message.warn('factory_product参数不可为空!');
        return;
      }
      let tempFactoryProduct = this.nodeId + "_" + this.classId;
      let colorVal = this.checkparam("color");
      let componentMakeDataInput = {
        "stepNum": 22,
        "templateId": this.templateInput,
        "nodeId": this.nodeIdInput,
        "classId": this.classIdInput,
        "eqpId": this.currentEqpId,
        "indImageName": this.currentIdentify,
        "configJson":  //参数设置内容在这块设置
            {
              "template_cell_horizontal_length": this.checkparam("template_cell_horizontal_length"),
              "template_cell_vertical_length": this.checkparam("template_cell_vertical_length"),
              "num_cells_horizontally_in_unit": this.checkparam("num_cells_horizontally_in_unit"),
              "num_cells_vertically_in_unit": this.checkparam("num_cells_vertically_in_unit"),
              "num_units_horizontally": this.checkparam("num_units_horizontally"),
              "num_units_more_in_large_template": this.checkparam("num_units_more_in_large_template"),
              "num_units_vertically": this.checkparam("num_units_vertically"),
              "startC": this.checkparam("startC"),
              "startR": this.checkparam("startR"),
              "flip_horizontally": this.checkparam("flip_horizontally"),
              "flip_horizontal_offset": this.checkparam("flip_horizontal_offset"),
              "index_same": this.checkparam("index_same"),
              "main_comp_ind": this.checkparam("main_comp_ind"),
              "color_direction": this.checkparam("color_direction"),
              "color": eval(colorVal),
              "factory_product": this.checkparam("factory_product"),
              "ind_image_name": this.checkparam("ind_image_name"),
              "generate_pxl": this.checkparam("generate_pxl"),
              "out_dir": ''
            }
      };
      this.$confirm({
        title: '部件模板制作',
        content: '请设置好各参数据，确认要生成部件模板吗?',
        cancelText: '取消',
        okText: '确定',
        width: 600,
        okButtonProps: {
          props: {disabled: false},
        },
        onOk: () => {
          this.makeloading = true;
          //const jsonparams = JSON.stringify(componentMakeDataInput);
          axios.post(`/api/v1/dataanalysis/aiTemplateMakeinfo/httpReqTemplateComponentMake`, componentMakeDataInput, {
            headers: {
              'Content-Type': 'application/json',

            }
          }).then(async response => {
            // 请求成功的回调，此时返回code===0
            //this.$forceUpdate();//刷新
            // console.log(response);
            if (response.code != 0 || response.data.path == null) {
              this.$message.error('部件模板制作失败');
              this.makeloading = false;
              return;
            }
            this.getComplabelNodeListInit(this.templateId);
            this.findResizedImageListInit(this.nodeId, this.classId);
            this.$message.success('部件模板制作完成');

            this.makeloading = false;
            this.outputpath = response.data.path;
            this.indImageUrl = response.data.indImageUrl;
            this.iscomponentmaked = true;

            const imageList = await findDirImageList({"dirPath": this.outputpath});
            console.log("imageList: ", imageList);
            this.markedImageList = imageList.data;

          }).catch(error => {
            // 请求失败的回调
          });
        },
        onCancel() {
        }
      })
    },
    async getImageList() {
      const imageList = await findDirImageList({"dirPath": this.outputpath});
      console.log("imageList: ", imageList);
      this.markedImageList = imageList.data;
    },
    resize() {//左侧分割面板比例变化处理函数,实现控制最大分割比例
      const splitPane = this.$refs.splitleft;
      if (splitPane.percent > 26)
        splitPane.percent = 26;
    },
    changeimg(eqpIdInput, indImageNameInput, resizedImageUrl) {
      // this.originalpath = url;
      // this.$message.info('换图浏览');
      // this.instance.setImage("http://10.120.200.35:8008/web" +this.originalpath);
      //回写右边当前站点及标注ID
      for (let i = 0; i < this.datasource.length; i++) {
        if (this.datasource[i]["params"] == "factory_product")
          this.datasource[i].data = this.classIdInput + "_" + eqpIdInput;
      }
      this.currentEqpId = eqpIdInput;
      this.currentIdentify = indImageNameInput;
      this.originalpath = configSystem.webUrl+ resizedImageUrl;
      this.instance.setImage(this.originalpath);

      this.findStepComplabelObjByNodeClassIdEqmIdIndNameInit(this.nodeIdInput, this.classIdInput, this.currentEqpId, this.currentIdentify)
      //回写ind_name
      this.selIdentifyfn();
    },
    setResizedimg(img) {//更换新的resize后的图作为标注打开的底板图
      if (img == null || img == "") {
        this.originalpath = null
        const data = [];
        this.$refs.output.value = data;
        this.instance.setData(data);
        this.instance.setImage(this.originalpath);
        this.currentIdentify = "";
      } else {
        // this.$message.info('切换标注工具底板图');
        this.originalpath= configSystem.webUrl + img;
        this.instance.setImage(this.originalpath);
      }
    },
    async getMakeInfo() {
      await getTemplateMakeinfo("complabel").then(ans => {
        console.log(ans);
        if (ans.code != 0)
          return;
        this.datasource = [];
        let i = 0;
        for (const key in ans.data) {
          if (key != "id" && key != "templateId" && key != "nodeId" && key != "classId" && key != "eqpId" && key != "stepNum" && key != "out_dir" && key != "save_debug") { //不需求这些字段参数展示
            let dataVal = ans.data[key];
            //alert("==="+dataVal)
            if (key == "template_cell_horizontal_length") {
              dataVal = 200;
            } else if (key == "template_cell_vertical_length") {
              dataVal = 600;
            } else if (key == "num_cells_horizontally_in_unit") {
              dataVal = 3;
            } else if (key == "num_cells_vertically_in_unit") {
              dataVal = 2;
            } else if (key == "num_units_horizontally") {
              dataVal = 6;
            } else if (key == "num_units_vertically") {
              dataVal = 3;
            } else if (key == "num_units_more_in_large_template") {
              dataVal = 2;
            } else if (key == "startC") { //默认值
              dataVal = 926;
            } else if (key == "startR") { //默认值
              dataVal = 325;
            } else if (key == "flip_horizontally") { //默认值
              dataVal = 0;
            } else if (key == "flip_horizontal_offset") { //默认值
              dataVal = 0;
            } else if (key == "index_same") { //默认值
              dataVal = 1;
            } else if (key == "main_comp_ind") { //默认值
              dataVal = 3;
            } else if (key == "color_direction") {
              dataVal = "horizontal";
            } else if (key == "color") { //默认值
              dataVal = '["R","G","B"]';
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
  },
  watch: {
    canvasWidth: function(newValue, oldValue){
      this.changeCanvas();
    },
  }
}
</script>
<style scoped>
.box {
  min-height: 840px;
  height: 100%;
  width: 100%;
  /* display: flex; */
}

.container {
  background-color: #ccc;
  display: block;
  /* width: 1000px;
  height: 900px; */
  /* margin: 0 20px; */
  /* margin-top: 10px; */
}

.left {
  flex: 0 0 auto;
  height: 100%;
  /* width: 22%; */
  width: 15%;
  /* background-color: rgba(153,204,255,0.25); */
}

.middle {
  flex: 0 0 auto;
  height: 100%;
  width: 75%;
  margin: 2px;
  background-color: rgba(204,255,255,0.25);
  position: relative;
}

.right {
  flex: 0 0 auto;
  /* min-height: 960px; */
  height: 100%;
  width: 10%;
  margin: 2px;
}

.rightcard {
  position: relative;
  text-align: center;
  /* height: 840px; */
  min-height: 840px;
  height: 100%;
  background-color: rgba(102, 153, 204, 0.25);
}

/* .tcl-input {
  padding: 0 10px;
  color: red;
  font-size: 10px;
} */

/* .bottom {
} */

#output {
  height: 200px;
  width: 200px;
  margin: 10px auto;
}

.buttonlist {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  margin: auto;
  right: 0;
}

.littlebutton {
  margin: 3px;
}

.tipsbutton {
  top: 10px;
  right: 15px;
  position: absolute;
}

.unit {
  margin: 10px;
}

.label-position {
  display:block;
  margin-bottom:2px;
  position: absolute;
  left: 5%;
  bottom: 6%;
  font-size: 16px;
  background-color: green;
  color: white;
  padding: 5px 8px;
  border-radius: 20px;
}

.label {
  height: 30px;
  line-height: 30px;
  margin: 5px;
  display: inline-block;
}

.select {
  width: 98%;
  left: 1%;
  right: 1%;
  margin-top: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.icon {
  font-size: 20px;
  color: rgb(22, 119, 255)
}

.textareaStyle {
  height: 200px;
  position: absolute;
  /* left: 15px; */
  top: -200px;
}

.icon:hover {
  cursor: pointer;
}

.labellist {
  /* height: 18%; */
  height: 70%;
  overflow-y: auto;
  width: 100%;
  padding: 0 10px;
  margin-right: 0px;
}
.labellist ul li {
  height: 30px;
  line-height: 30px;
  margin-bottom: 3px;
  border-radius: 5px;
}

.labellist::-webkit-scrollbar-track {
  /* -webhit-box-shadow: inset 0 0 5px transparent; */
  border-radius: 0;
  background: rgba(102, 153, 204, 0.25);
}

.sitelist {
  width: 100%;
  height: 120px;
  overflow: scroll;
  padding: 0;
  scrollbar-base-color: black;
}

.sitelist::-webkit-scrollbar-track {
  box-shadow: inset 0 0 5px transparent;
  -webhit-box-shadow: inset 0 0 5px transparent;
  border-radius: 0;
  /* background: rgba(153,204,255,0.25); */
}

.selected {
  color:white;
  background-color: green;
}

.labelDefaultColor {
  color:black;
  background-color: rgba(240,240,240,0.5);
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
