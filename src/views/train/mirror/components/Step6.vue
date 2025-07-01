<template>
  <div>
    <div style="height:760px;overflow:auto">
      <split-pane :min-percent="15" :max-percent="22" :default-percent="22" split="vertical" @resize="resizeLeft" ref="splitLeft">
        <template slot="paneL">
          <split-pane :min-percent="14" :max-percent="37" :default-percent="37" split="horizontal" @resize="resizeTop" ref="splitTop">
              <template slot="paneL">
                  <a-card style="margin: 2px;">
                    <div class="unit" style="margin: 10px;">
                      <span style="font-size: 14px; padding-right: 5px;">选择站点:</span>
                      <a-select v-model="currentEqpId" class="select" style="width: 200px;"
                        @click="findStepColorPictureInfoListByTemplateIdNodeIdClassIdEqpIdStart"
                        @change="findStepColorPictureInfoListByTemplateIdNodeIdClassIdEqpIdStart">

                        <a-select-option v-for="option in eqpId" :key="option" placeholder="选择站点" :value="option">
                          {{ option }}
                        </a-select-option>
                      </a-select>
                    </div>
                    <div class="unit" style="margin: 10px;">
                      <span style="font-size: 14px; padding-right: 5px;">选择站点测试彩图目录:</span>
                      <!--选择图片目录-->
                      <a-tree-select v-model="imgDir" showSearch allowClear
                        :dropdown-style="{ maxHeight: '200px', overflow: 'auto' }" style="width:100%; margin-top: 5px;" :tree-data="treeData"
                        placeholder="选择站点测试彩图目录" @select="onSelect" />
                      <div style="height: 120px; overflow:scroll; display: none;">
                        <div v-for="img in this.imglist" class="imgname" @click="myOpen(img.imageWebUrl)" :title="img.imageName">
                          {{ img.imageName }}
                        </div>
                      </div>
                    </div>
                    <div class="unit" style="margin: 10px;">
                      <span style="font-size: 14px; padding-right: 5px;">选择验证结果图片浏览目录：</span>
                      <!--选择验证图片目录-->
                      <!-- <a-tree-select v-model="validateImgDir" showSearch allowClear
                        :dropdown-style="{ maxHeight: '200px', overflow: 'auto' }" style="width:30%; margin-top: 5px;" :tree-data="validateTreeData"
                        placeholder="选择验证图片目录" @select="onSelectValidate" /> -->
                      <ul style="width:100%; margin-top: 5px; height: 120px;overflow: scroll;">
                        <a-spin :spinning="makeloading" style="display: flex;justify-content: center; margin-top: 10px;">
                        </a-spin>
                        <li @click="onSelectValidate(item)" :class="{dirName: item.style, dirNameClicked: !item.style}" style="cursor: pointer;" v-for="(item, index) in validateTreeData">{{ item.value }}</li>
                      </ul>
                      <!-- <div style="height: 120px;  overflow:scroll;">
                        <div v-for="img in this.imglist" class="imgname" @click="myOpen(img.imageWebUrl)" :title="img.imageName">
                          {{ img.imageName }}
                        </div>
                      </div> -->
                    </div>
                  </a-card>
              </template>
              <template slot="paneR">
                <div style="height:520px;overflow:auto;margin:5px">
                  <a-card title="参数配置(所有站点)">
                    <a-table :scroll="{ x: hidden, y: true }" :pagination="false" :columns="columns" :data-source="datasource"
                      rowKey="id" style="margin:5px" v-if="this.datasource.length > 0">
                      <template slot="input" slot-scope="text, record">
                        <a-select v-model="currentIdentify" mode="multiple" @change="selCompObj(1)" style="width: 100%;"
                          v-if="record.params == 'main_component_name'">
                          <template v-for="unit in units">
                            <!--#87d068 成功 #108ee9 进行中 #f50 失败-->
                            <a-select-option v-for="tag in unit.childList" :key="tag.indImageName" placeholder="请选择对应部件模板"
                              :value="tag.indImageName">
                              {{ unit.compName }}-{{ tag.indImageName }}
                            </a-select-option>
                          </template>
                        </a-select>
                        <a-select v-model="currentIdentify1" mode="multiple" @change="selCompObj(2)" style="width: 100%;"
                          v-if="record.params == 'dependent_component_name'">
                          <a-select-option value="">--请选择--</a-select-option>
                          <template v-for="unit in units">
                            <!--#87d068 成功 #108ee9 进行中 #f50 失败-->
                            <a-select-option v-for="tag in unit.childList" :key="tag.indImageName" placeholder="请选择对应部件模板"
                              :value="tag.indImageName">
                              {{ unit.compName }}-{{ tag.indImageName }}
                            </a-select-option>
                          </template>
                        </a-select>
                        <a-input v-model="text" @change="(event) => onTabelChange(event, record)"
                          v-if="record.params != 'main_component_name' && record.params != 'dependent_component_name'"></a-input>
                        <!-- <a-input v-model="text"  @change="(event)=>onTabelChange(event,record)" v-if="record.params!='main_component_name'&&record.params!='dependent_component_name' && record.path=='debug_picture_dir'  "></a-input>-->
                      </template>
                    </a-table>
                  </a-card>
                </div>
                <div style="display: flex; justify-content: center; margin-top: 30px; margin-bottom: 30px;">
                  <a-button @click="prevStep">上一步</a-button>
                  <a-button type="primary" style="margin-left: 10px" @click="finish" :loading="makeloading">验证</a-button>
                  <!-- <a-button style="margin-left: 10px;" @click="cancel">返回列表</a-button> -->
                </div>
              </template>
          </split-pane>
        </template>

        <template slot="paneR">
          
          <!--遍历图片数组，以id为key值-->
          <div style="width: 100%; overflow-y:auto;">
            <!--设置等待状态-->
            <div style="text-align:center">
              <a-spin :spinning="imgListLoading" size="large">
                <!--pictureId的参数待验证-->
                <!-- <div v-for="pictureId in pictureIds" :key="pictureId.id" class="imgblock">
                        <img :id="'img_' + pictureId.id" :src="pictureList[pictureId.id]" :title="pictureId.name"
                          class="imgitem" @click="openImagePreview(pictureId.id)" />
                        <a-icon v-if="!pictureList[pictureId.id]" type="loading"
                          style="width: 100%; height: 100%; user-select: none;" />
                      </div> -->
                <!-- <img :id="'img_' + pictureId.id" :src="pictureList[pictureId.id]" :title="pictureId.name" @click="openImagePreview(pictureId.id)" /> -->

                <!-- <div v-for="(pictureId, index) in pictureIds" :key="pictureId.id" class="img-item">
                  <img :id="'img_' + pictureId.id" :src="pictureList[pictureId.id]" :title="pictureId.name"
                    @click="previewImg(index)" />
                  <a-icon v-if="!pictureList[pictureId.id]" type="loading"
                    style="width: 100%; height: 100%; user-select: none;" />
                </div> -->
                <div v-for="(picture, index) in pictureList" class="img-item">
                  <!-- <a-icon v-if="imgLoading" type="loading"
                    style="width: 100%; height: 100%; user-select: none;" /> -->
                    <a-spin :spinning="imgLoading" style="display: flex; justify-content: center;align-items: center;" :indicator="indicator">
                      <img :src="picture" :alt="picture" :title="picture" @click="previewImg(index)" />
                    </a-spin>
                </div>
              </a-spin>
            </div>
          </div>

          <div class="pagation-image">
            <a-pagination v-if="pagination.total" :show-total="() => `共 ${pagination.total} 条`" show-quick-jumper
              :defaultPageSize="pagination.pageSize" :default-current="pagination.current" :current="pagination.current"
              :total="pagination.total" show-less-items @change="pageChange" />
          </div>

        </template>
      </split-pane>
    </div>
    
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
  findDirImageList,
  getComplabelNodeListData,
  setComboxRewriteValue, findStepColorPictureInfoListByTemplateIdNodeIdClassIdEqpId,
} from '@/api/imageManage'
import { getDataSetListById } from "@/api/dataCenter";
import { mapState } from "vuex";
import template from "@/store/modules/template";
import { getPictureFilePath } from "@/api/modelManage";
export default {
  name: 'Step6',
  components: {//引用的其他组件
    splitPane,
  },
  props: {//从父组件传来数据

  },
  data() {
    return {
      indicator: `<a-icon type="loading" style="font-size: 24px" spin />`,
      // 样式切换按钮
      style1: true,
      style2: false,
      tplDatalistId: '',
      templateInput: this.templateId, //当前主模板ID
      nodeIdInput: this.nodeId, //当前主模板节点ID（T9，T10）
      classIdInput: this.classId, //当前产品
      eqpIdInput: this.eqpId,  // 当前模板站点列表
      currentEqpId: null,//当前选中站点
      currentIdentify: [],//当前选中部件标识
      currentIdentify1: [],//1
      currentIdentify2: null,//2
      comp1ImgUrl: null,//1
      comp2ImgUrl: "",//2
      imglist: [],//用于无缺陷站点图
      originalpath: '',
      makeloading: false,
      validateLoading: false,
      imgLoading: false,
      pagination: {
        total: 0,
        pageSize: 16,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["16", "20", "24", "28"]
      },
      validationData: {
        "templateId": 1,
        "nodeId": "T9",
        "classId": "23.80D",
        "eqpId": "01R30",
        "stepNum": 22,
        "indImageName": "M1",
        "configJsonValidation": {
          "test_img_path": "/nas/182/t9/T9_14WU/test/SFA/",
          "run_mode": "current_in_developing",
          "debug_mod": 1,
          "templates_folder": "/nas/182/t9/done_template",
          "pt_w": 200,
          "pt_h": 600,
          "p_lb_w": 298,
          "p_ub_w": 318,
          "p_lb_h": 914,
          "p_ub_h": 934,
          "bias": 20,
          "p_width": 308,
          "full_scale_bg": "full_600_013R0_pt200.png",
          "fine_tune_half": 0,
          "main_component_name": [
            "M1"
          ],
          "dependent_component_name": [
            "pxl"
          ],
          "component_erode": 5,
          "component_matchTemplate_loc": "min",
          //"debug_picture_dir": "/nas/182/t9/validation",
          "rotate_flag": 0,
          "max_samples": 10
        }
      },
      resizedpath: null,//Resize后原图地址
      outputpath: null,//处理后图
      outputDir: null, //处理后图目录
      eqpFileZip: null, //处理后图目录
      imgDir: null,//选中无缺陷图的目录值
      validateImgDir: null, // 选中的验证图片目录
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
      units: [],
      treeData: [],
      validateTreeData: [],
      imgListLoading: false,//是否正在加载结果图列表
      // test测试数据，记得删除lwj
      pictureList: [],// 结果图片对数组
      pictureArray: [
        require("@/assets/img/1.jpg"),
        require("@/assets/img/2.jpg"),
        require("@/assets/img/class.jpg"),
        require("@/assets/img/classTwo.jpg"),
        require("@/assets/img/classTwo1.jpg"),
        require("@/assets/img/example.png"),
        require("@/assets/img/kaidan.png"),
      ],
      PreviewImage: null,//大图浏览地址
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
    this.nodeIdInput = this.nodeId;
    this.classIdInput = this.classId;
    this.eqpIdInput = this.eqpId;

    this.pagination.total = this.pictureList.length;

    // alert(this.templateInput+"--------"+this.nodeIdInput+"----------"+this.classIdInput+"------"+this.eqpIdInput);
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
    previewImg(index) {
      // console.log(this.pictureList[index]);
      this.$hevueImgPreview({
        multiple: true, // 开启多图预览模式
        nowImgIndex: index, // 多图预览，默认展示第一张图片
        imgList: this.pictureList, // 简要预览的多图数组
        mainBackground: 'rgba(0,0,0,.5)', // 整体背景颜色
        clickMaskCLose: open,
      })
    },
    prevStep() {
      this.$emit('prevStep');
    },
    cancel() {
      this.$emit('cancel');
    },
    resizeLeft() {//左侧分割面板比例变化处理函数,实现控制最大分割比例
        const splitPane = this.$refs.splitLeft;
        if (splitPane.percent > 32)
            splitPane.percent = 32;
    },
    resizeTop(){
        const splitPane = this.$refs.splitTop;
        if (splitPane.percent > 37)
            splitPane.percent = 37;
    },
    finish() {//进行验证'
      //调用验证api
      // const params =  {
      //     "templateId": 1,
      //       "nodeId": "T9",
      //       "classId": "23.80D",
      //       "eqpId": "01R30",
      //       "stepNum": 22,
      //       "indImageName": "M1",
      //       "configJsonValidation": {
      //     "test_img_path": "/nas/182/t9/T9_14WU/test/SFA/",
      //         "run_mode": "current_in_developing",
      //         "debug_mod": 1,
      //         "templates_folder": "/nas/182/t9/done_template",
      //         "pt_w": 200,
      //         "pt_h": 600,
      //         "p_lb_w": 298,
      //         "p_ub_w": 318,
      //         "p_lb_h": 914,
      //         "p_ub_h": 934,
      //         "bias": 20,
      //         "p_width": 308,
      //         "full_scale_bg": "full_600_013R0_pt200.png",
      //         "fine_tune_half": 0,
      //         "main_component_name": [
      //       "M1"
      //     ],
      //         "dependent_component_name": [
      //       "pxl"
      //     ],
      //         "component_erode": 5,
      //         "component_matchTemplate_loc": "min",
      //         "debug_picture_dir": "/nas/182/t9/validation",
      //         "rotate_flag": 0,
      //         "max_samples": 10
      //   }
      //   };
      let mcn = this.checkparam("main_component_name");
      let dcn = this.checkparam("dependent_component_name");

      //模板验证
      const params = {
        "templateId": this.templateInput,
        "nodeId": this.nodeIdInput,
        "classId": this.classIdInput,
        "eqpId": this.currentEqpId,
        "stepNum": 41,
        "configJsonValidation": {
          "test_img_path": this.checkparam("test_img_path"),
          "run_mode": this.checkparam("run_mode"),
          "debug_mod": this.checkparam("debug_mod"),
          "templates_folder": this.checkparam("templates_folder"),
          "pt_w": this.checkparam("pt_w"),
          "pt_h": this.checkparam("pt_h"),
          "p_lb_w": this.checkparam("p_lb_w"),
          "p_ub_w": this.checkparam("p_ub_w"),
          "p_lb_h": this.checkparam("p_lb_h"),
          "p_ub_h": this.checkparam("p_ub_h"),
          "bias": this.checkparam("bias"),
          "p_width": this.checkparam("p_width"),
          "full_scale_bg": this.checkparam("full_scale_bg"),
          "fine_tune_half": this.checkparam("fine_tune_half"),
          "main_component_name": mcn,
          "dependent_component_name": dcn,
          "component_erode": this.checkparam("component_erode"),
          "component_matchTemplate_loc": this.checkparam("component_matchTemplate_loc"),
          // "debug_picture_dir": this.checkparam("debug_picture_dir"),
          "rotate_flag": this.checkparam("rotate_flag"),
          "max_samples": this.checkparam("max_samples"),
          "site_name":this.currentEqpId
        }
      };

      let messageContent = "确定要进行模板验证吗？";
      this.$confirm({
        title: '模板验证',
        content: messageContent,
        cancelText: '取消',
        okText: '确定',
        width: 600,
        okButtonProps: {
          props: { disabled: false },
        },
        onOk: () => {
          this.makeloading = true;
          this.validateTreeData = [];
          this.$message.info('验证中，请多等一会儿');
          const jsonparams = JSON.stringify(params);
          // console.info("====" + jsonparams)
          this.validationTemplateStart(jsonparams)
        },
        onCancel() { }
      })
    },
    async setComboxRewriteValue(num, params) {

      //回写左边参数
      if (num == 1) {
        // alert("1111111111params==="+JSON.stringify(params));
        for (let i = 0; i < this.datasource.length; i++) {
          if (this.datasource[i]["params"] == "main_component_name") {
            this.datasource[i].data = params;
          }
        }
      } else if (num == 2) {
        // alert("22222222222params==="+JSON.stringify(params));
        for (let i = 0; i < this.datasource.length; i++) {
          if (this.datasource[i]["params"] == "dependent_component_name") {
            this.datasource[i].data = params;
          }
        }
      }
    },
    selCompObj(num) {

      if (1 == num) {
        this.setComboxRewriteValue(num, this.currentIdentify)
      } else if (2 == num) {
        this.setComboxRewriteValue(num, this.currentIdentify1)
      }
    },
    changeimg(url) {
      this.originalpath = url;
      // this.$message.info('换图浏览');
      // this.instance.setImage(this.originalpath);
    },
    async getComplabelNodeListInit(templateIdVal) {//获取组件图片列表
      const res = await getComplabelNodeListData(templateIdVal);
      if (res.code != 0)
        return;
      this.units = res.data;
    },
    async getImageList(pathValue) {//读取用于resize的图片地址
      // const params = "?dirPath=" + pathValue;
      const params = { "dirPath": pathValue };
      const ans = await findDirImageList(params);
      if (ans.code != 0)
        return;
      for (let i = 0; i < ans.data.length; i++) {
        ans.data.id = i;
      }
      this.imglist = ans.data;
      // console.log(this.imglist)
    },
    async findStepColorPictureInfoListByTemplateIdNodeIdClassIdEqpIdStart() {
      if (this.currentEqpId) {

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
        this.outputpath = configSystem.webUrl+ ans.data.imageUrl;
        this.sgImageUrl = configSystem.webUrl + ans.data.sgImageUrl;
        this.eqpFileZip = ans.data.eqpFileZip;
        this.outputDir = ans.data.outPath;
        // console.info("KKKKK====" + JSON.stringify(ans.data));
        let confJsonObj = ans.data.configJson;
        let configJsonValidation = ans.data.configJsonValidation;
        //alert(JSON.stringify(confJsonObj))
        if (configJsonValidation) {
          //已经做过验证了
          //configJsonValidation已验证后的回写
          // alert(JSON.stringify(configJsonValidation))
          this.currentIdentify = configJsonValidation.main_component_name;
          this.currentIdentify1 = configJsonValidation.dependent_component_name;
          for (let i = 0; i < this.datasource.length; i++) {
            if (this.datasource[i]["params"] == "test_img_path") {
              this.datasource[i].data = configJsonValidation.pt_h;
            } else if (this.datasource[i]["params"] == "max_samples") {
              this.datasource[i].data = configJsonValidation.pt_w;
            } else if (this.datasource[i]["params"] == "run_mode") {
              this.datasource[i].data = configJsonValidation.run_mode;
            } else if (this.datasource[i]["params"] == "debug_mod") {
              this.datasource[i].data = configJsonValidation.debug_mod;
            } else if (this.datasource[i]["params"] == "rotate_flag") {
              this.datasource[i].data = configJsonValidation.rotate_flag;
            } else if (this.datasource[i]["params"] == "templates_folder") {
              this.datasource[i].data = configJsonValidation.templates_folder;
            } else if (this.datasource[i]["params"] == "pt_w") {
              this.datasource[i].data = configJsonValidation.pt_w;
            } else if (this.datasource[i]["params"] == "pt_h") {
              this.datasource[i].data = configJsonValidation.pt_h;
            } else if (this.datasource[i]["params"] == "p_lb_w") {
              this.datasource[i].data = configJsonValidation.p_lb_w;
            } else if (this.datasource[i]["params"] == "p_ub_w") {
              this.datasource[i].data = configJsonValidation.p_ub_w;
            } else if (this.datasource[i]["params"] == "p_lb_h") {
              this.datasource[i].data = configJsonValidation.p_lb_h;
            } else if (this.datasource[i]["params"] == "p_ub_h") {
              this.datasource[i].data = configJsonValidation.p_ub_h;
            } else if (this.datasource[i]["params"] == "bias") {
              this.datasource[i].data = configJsonValidation.bias;
            } else if (this.datasource[i]["params"] == "p_width") {
              this.datasource[i].data = configJsonValidation.p_width;
            } else if (this.datasource[i]["params"] == "full_scale_bg") {
              this.datasource[i].data = configJsonValidation.full_scale_bg;
            } else if (this.datasource[i]["params"] == "fine_tune_half") {
              this.datasource[i].data = configJsonValidation.fine_tune_half;
            } else if (this.datasource[i]["params"] == "main_component_name") {
              this.datasource[i].data = configJsonValidation.main_component_name;
            } else if (this.datasource[i]["params"] == "dependent_component_name") {
              this.datasource[i].data = configJsonValidation.dependent_component_name;
            } else if (this.datasource[i]["params"] == "debug_picture_dir") {
              this.datasource[i].data = configJsonValidation.debug_picture_dir;
            } else if (this.datasource[i]["params"] == "site_name") {
              this.datasource[i].data = this.currentEqpId;
            }
          }

        } else {
          //未作验证，前面有标注及彩图
          let dirLen = ans.data.outPath.length;
          let allPathImageUrl = ans.data.imageUrl;
          //回写配置参的设置的内容
          if (confJsonObj) {
            for (let i = 0; i < this.datasource.length; i++) {
              if (this.datasource[i]["params"] == "test_img_path") {
                this.datasource[i].data = confJsonObj.img_dir;
              } else if (this.datasource[i]["params"] == "templates_folder") {
                this.datasource[i].data = confJsonObj.out_dir;
              } else if (this.datasource[i]["params"] == "full_scale_bg") {
                let full_scale_bgVal = allPathImageUrl.substring(dirLen + 1);
                this.datasource[i].data = full_scale_bgVal;
              }
            }
          }
        }
      }

    },
    onLoadData() {

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
    async getMakeInfo() {//获取配置参数
      await getTemplateMakeinfo("validation").then(ans => {
        if (ans.code != 0)
          return;
        this.datasource = [];
        let i = 0;
        for (const key in ans.data) {
          if (key != "id" && key != "templateId" && key != "nodeId" && key != "classId" && key != "eqpId" && key != "stepNum") { //不需求这些字段参数展示

            let dataVal = ans.data[key];
            // alert("==="+dataVal)
            if (key == "test_img_path") {
              dataVal = "";
            } else if (key == "run_mode") { //默认值
              dataVal = "current_in_developing";
            } else if (key == "debug_mod") { //默认值
              dataVal = 1;
            } else if (key == "templates_folder") { //默认值
              dataVal = "";
            } else if (key == "pt_w") { //默认值
              dataVal = 200;
            } else if (key == "pt_h") { //默认值
              dataVal = 600;
            } else if (key == "p_lb_w") { //默认值
              dataVal = 298;
            } else if (key == "p_ub_w") { //默认值
              dataVal = 318;
            } else if (key == "p_lb_h") { //默认值
              dataVal = 914;
            } else if (key == "p_ub_h") { //默认值
              dataVal = 934;
            } else if (key == "bias") { //默认值
              dataVal = 20;
            } else if (key == "p_width") { //默认值
              dataVal = 308;
            } else if (key == "full_scale_bg") { //默认值
              dataVal = "";
            } else if (key == "fine_tune_half") { //默认值
              dataVal = 0;
            } else if (key == "main_component_name") { //默认值
              dataVal = [];
            } else if (key == "dependent_component_name") { //默认值
              dataVal = [];
            } else if (key == "component_erode") { //默认值
              dataVal = 5;
            } else if (key == "component_matchTemplate_loc") { //默认值
              dataVal = "min";
            }
            // else if (key == "debug_picture_dir") { //默认值
            //   dataVal = "";
            // }
            else if (key == "rotate_flag") { //默认值
              dataVal = "0";
            } else if (key == "max_samples") { //默认值
              dataVal = "10";
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
    onSelect(checkedKeys, node) {
      //this.resizedpath = value;

      // this.$message.info('选择站点测试彩图片目录设置为：' + node.value);
      //回写设置项
      for (let i = 0; i < this.datasource.length; i++) {
        if (this.datasource[i]["params"] == "test_img_path") {
          this.datasource[i].data = node.value;
        }
      }
      this.getImageList(node.value)
      this.$nextTick(() => {

      })
    },
    async onSelectValidate(node) {
      //this.resizedpath = value;
      // if(node.value.split(".").length > 1){
      //   this.$message.error('无效目录：' + node.value);
      //   return ;
      // }
      // this.$message.info('选择验证图片目录设置为：' + node.value);
      this.validateTreeData.forEach((item, index) => {
        this.validateTreeData[index].style = true;     // 排他思想
        if ((node.title == item.title)) {
          this.validateTreeData[index].style = false;
        }
      });
      this.imgLoading = true;
      // 根据图片目录获取图片路径
      const picture = await this.getImageDir(node.value);
      // console.log("picture: ", picture);
      if(picture.code !== 0) {
        this.$message.info('图片加载失败！');
        return ;
      }
      const pic = picture.data;
      // console.log("pic: ", pic);
      this.pictureList = [];
      pic.forEach((picId, index) => {
        getPictureFilePath(picId.imageWebUrl).then(res => {
          // console.log("getPictureFilePath res: ", res);
          // 将图片文件流blob转换为url
          const url = window.URL.createObjectURL(res)
          // console.log(url);
          picId.url = url;
          // this.$set(this.pictureList, picId.id, url)
          this.pictureList.push(picId.url);
          this.pagination.total = this.pictureList.length;
        });
      });
      this.imgLoading = false;
      // console.log(this.pictureList.length);
      // console.log("this.pictureList=", this.pictureList);
    },
    pageChange(page, pageSize) { // 改变后的页码以及每页条数
      this.pagination.pageSize = pageSize
      this.pagination.current = page
    },
    async validationTemplateStart(params) {
      // console.log(params);
      const ans = await this.validationTemplate(params)
      //调用模板验证图接口调用完成。
      this.loading = false
      if (ans.code != 0){
        this.$message.info('验证失败！');
        this.makeloading = false;
        return;
      }
        
      let debugPictureDir = ans.data.debugPictureDir;
      console.log("debugPictureDir=" + debugPictureDir)

      const imgDir = await getDirTreeDataList(debugPictureDir);
      console.log("imgDir=", imgDir);
      if(imgDir.code !== 0) {
        this.$message.info('验证结果目录加载失败，请再次尝试！');
        this.makeloading = false;
        return;
      }
      this.validateTreeData = imgDir.data.children;
      if(this.validateTreeData) {
        this.validateTreeData.map((item) => {
          item.style = true;
        });
      }
      // console.log("validateTreeData filter before: ", this.validateTreeData);
      // this.validateTreeData = this.validateTreeData.filter((item, index) => {
      //   // console.log(item);
      //   // console.log(item.value.split("."))
      //   const arr = item.value.split(".");
      //   return arr[arr.length-1] !== "jpg";
      // });
      // console.log("validateTreeData filter after: ", this.validateTreeData);
      this.makeloading = false;
      this.$message.info('验证成功！');
    },
    getImageDir(debugPictureDir) {
      return axios.get(`/api/v1/dataanalysis/aiTemplateMakeinfo/findDirImageList?dirPath=${debugPictureDir}`);
    },
    validationTemplate(jsonparams) {
      return axios.post(`/api/v1/dataanalysis/aiTemplateMakeinfo/httpReqValidation`, jsonparams, {
        headers: {
          'Content-Type': 'application/json',

        }
      });

    },
    myIndOpen(num) {
      let goURl = "";
      if (num == 2) {
        goURl = configSystem.webUrl+ this.comp2ImgUrl;
      } else {
        goURl = configSystem.webUrl+this.comp1ImgUrl;
      }
      window.open(goURl);
    },
    myOpen(url) {
      let goURl = configSystem.webUrl+ url;
      window.open(goURl);
    },
    openImagePreview(id) {
      this.PreviewImage = id;
    },
    //关闭大图预览
    closePreview() {
      this.PreviewImage = null;
    },
  }
}
</script>

<style scoped lang="less">
.imgblock {
  width: 25%;
  padding: 0 10px;
  margin-top: 10px;
  margin-bottom: 10px;
  min-width: 200px;
  float: left;
  position: relative;
  cursor: pointer;
  z-index: 0;
}

.dirName {
  width: 100%;
  overflow: auto;
  background-color: rgba(240,240,240,.5);
  padding: 5px; 
  border-radius: 15px;
}

.dirNameClicked {
  width: 100%;
  overflow: auto;
  color: white;
  background-color: #1890ff;
  padding: 5px; 
  border-radius: 15px;
}

.imgname {
  text-align: center;
  background-color: rgba(240,240,240,0.5);
  border-radius: 15px;
  height: 40px;
  line-height: 40px;
  margin: 10px;
  padding: 0 10px;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -khtml-user-select: none;
  -ms-user-select: none;
  user-select: none;
  overflow-y: hidden;
}

.img-item {
  width: 50%;
  height: calc(50% - 10px);
  padding: 0 10px;
  margin-top: 10px;
  margin-bottom: 10px;
  min-width: 200px;
  float: left;
  position: relative;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    user-select: none;
    // box-shadow: -2px -2px 0 2px grey;
  }
}

.pagation-image {
  float: right;
  padding: 5px 10px;
}
</style>
