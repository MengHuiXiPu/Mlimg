<template>
  <div class="step3-container">
    <p style= "color: #E6A23C;margin-bottom:0;">请提前与MES约定队列配置信息，消息内容格式参考TIbcoRV的格式示例，协商约定后，去
      <el-link  type="primary" size="mini" @click="golink">创建RV数据源</el-link></p>
    <el-row class="step3-content">
      <el-col :span="11" class="panel left-panel">
        <a-form-model
          class="step4-form"
          ref="refLeftForm"
          :label-col="{ span: 10 }"
          :wrapper-col="{ span: 12 }"
          layout="horizontal"
          :model="state"
          labelAlign="left"
          :colon="false"
          :rules="leftFormRules">
          <a-form-model-item prop="receiveDataSourceId">
            <span slot="label">Tibco-RV消息接收队列源&nbsp;
              <a-tooltip title="点击刷新RV数据源列表">
                <a-icon type="reload" @click="getRVSoureList"/>
              </a-tooltip>
            </span>
            <a-select v-model="state.receiveDataSourceId" :disabled="readOnly">
              <a-select-option :value="resource.id" v-for="resource in rvResourceList" :key="resource.id" :title="resource.remark">{{ resource.name }}</a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item prop="messageTypeKey">
            <span slot="label">
              RV消息类型格式设置&nbsp;
              <a-tooltip title="">
                <a-icon type="question-circle-o" />
              </a-tooltip>
            </span>
            <a-input v-model = "state.messageTypeKey" placeholder="请输入" :disabled="readOnly"></a-input>
          </a-form-model-item>
          <a-form-model-item prop="nasDataSourceId">
            <span slot="label">
              NAS文件源配置&nbsp;
              <a-tooltip title="请配置nas数据源，以便可找到检测站点对应的图片与csv文件">
                <a-icon type="question-circle-o" />
              </a-tooltip>
            </span>
            <a-select v-model="state.nasDataSourceId" :disabled="readOnly">
              <a-select-option :value="resource.id" v-for= "resource in nasDataSourceList" :key="resource.id">{{resource.dsName}}</a-select-option>
            </a-select>
          </a-form-model-item>
        </a-form-model>
        <!-- TibcoRV消息格式接收格式示例 -->
        <p>TibcoRV消息格式回复格式示例</p>
        <div class="example-content scrollbar">
          <pre class="line-numbers"><code class="language-xml" > {{ leftExampleText }}</code></pre>
        </div>
      </el-col>
      <el-col :span="1" style="height: 100%;"></el-col>
      <el-col :span="11" class="panel right-panel">
        <a-form-model
          class="step4-form"
          ref="refRightForm"
          :label-col="{ span: 10 }"
          :wrapper-col="{ span: 12 }"
          layout="horizontal"
          :model="state"
          :colon="false"
          labelAlign="left"
          :rules="rightFormRules">
          <a-form-model-item label="Tibco-RV消息返回队列源" prop="sendDataSourceId">
            <a-select v-model="state.sendDataSourceId" :disabled="readOnly">
              <a-select-option :value="resource.id" v-for="resource in rvResourceList" :key="resource.id">{{ resource.name }}</a-select-option>
            </a-select>
          </a-form-model-item>
          <div style="height: 55px;color:#333;"><i style="color: #f5222d">*&nbsp;</i>RV消息特定参数设置</div>
          <a-form-model-item label="MESSAGENAME参数配置" prop="messageName" class="padding-left-20">
            <a-input v-model = "state.messageName" placeholder="请输入" :disabled="readOnly"></a-input>
          </a-form-model-item>
        </a-form-model>
        <!-- TibcoRV消息格式接收格式示例 -->
        <p>TibcoRV消息格式接收格式示例</p>
        <div class="example-content scrollbar">
          <pre class="line-numbers"><code class="language-xml" > {{ leftExampleText }}</code></pre>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import Prism from 'prismjs';
// 需要单独引入你所需的语言支持
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-xml-doc';
// 引入主题样式
// import 'prismjs/themes/prism-okaidia.css';
import { getRVSoureList } from "@/api/dataCenter.js";
import { getDataSoureList } from '@/api/dataCenter';
import { validateAlphabetNumHyphenUnderline } from '@/utils';
export default {
  name: "step3",
  props: {
    state: {
      type: Object,
      default: () => ({})
    },
    setState: {
      type: Function,
      default: () => { }
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      rvResourceList: [], //rv数据源列表
      nasDataSourceList: [], //nas文件源列表
      // leftFormData: {
      //   receiveDataSourceId: '', //接收消息队列源id
      //   nasDataSourceId: '', //nas文件源id
      //   messageTypeKey: '',   //消息类型格式设置
      // },
      leftExampleText: `
xmlData="<?xml version="1.0" encoding="utf-8"?>
  <MESSAGE>
    <HEADER>
      <MESSAGENAME>CFJUDGE</MESSAGENAME>
      <TRANSACTIONID>20230721142651760</TRANSACTIONID> 
      <REPLYSUBJECTNAME>CSOT.G85.CF.PROD</REPLYSUBJECTNAME>
      <LISTENER>CSOTListener</LISTENER> 
    </HEADER>
    <BODY> 全部保留
      <SITE>T1</SITE>
      <FACTORYNAME>ARRAY</FACTORYNAME>
      <PRODUCTNAME>TA332955AA</PRODUCTNAME>
      <PRODUCTSPECNAME>TA5461JAJH01</PRODUCTSPECNAME>
      <EQPTYPE>TAAOL</EQPTYPE>  FBIAO / FBQAO
      <PROCESSOPERATIONNAME>5300</PROCESSOPERATIONNAME> CSV名字
      <PRODUCTSPECGROUP>SL546BD12</PRODUCTSPECGROUP>
      <CAMERAMACHINENAME>TAAOL6C0</CAMERAMACHINENAME>
    </BODY>
    <RETURN>
      <RETURNCODE>0</RETURNCODE>
      <RETURNMESSAGE />
    </RETURN>
  </MESSAGE>
      `,
      // rightFormData: {
      //   sendDataSourceId: "", //发送消息队列源id
      //   messageName: "", //消息名称
      // },
      rightExampleText: `
xmlData="<?xml version="1.0" encoding="utf-8"?>
<MESSAGE>
  <HEADER>
    <MESSAGENAME>AIDataReport</MESSAGENAME>
    <TRANSACTIONID>20180809002419439</TRANSACTIONID>
    <REPLYSUBJECTNAME></REPLYSUBJECTNAME>  MES发过来的subjectname
    <LISTENER>…</LISTENER> MES发过来的LISTENER
  </HEADER>
  <BODY>
    <SITE>T10</SITE>
    <FACTORYNAME>G10B</FACTORYNAME>
    <PRODUCTNAME>TB880818BC</PRODUCTNAME>
    <PRODUCTSPECNAME>TB546AHAB200</PRODUCTSPECNAME>
    <EQPTYPE>TBAOH</EQPTYPE>
    <PROCESSOPERATIONNAME>3850</PROCESSOPERATIONNAME>
    <FILENAME>3850_TB880818BC_20180809_002357.csv</FILENAME>
    <PRODUCTGRADE>OK</PRODUCTGRAD>
    <PANELGRADES>OX</ PANELGRADES >
  </BODY>
  <RETURN>
    <RETURNCODE>0</RETURNCODE>
    <RETURNMESSAGE />
  </RETURN>
</MESSAGE>      
      `,

      leftFormRules: {
        receiveDataSourceId: [
          { required: true, message: '请选择Tibco-RV消息接收队列源', trigger: ['blur', 'change'] },
        ],
        nasDataSourceId: [
          { required: true, message: '请选择NAS文件源配置', trigger: ['blur', 'change'] },
        ],
        messageTypeKey: [
          { required: true, message: '请输入消息类型格式设置', trigger: ['blur', 'change'] },
          { validator: validateAlphabetNumHyphenUnderline, trigger: ["blur", "change"] }
        ],
      },
      rightFormRules: {
        sendDataSourceId: [
          { required: true, message: '请选择Tibco-RV消息返回队列源', trigger: ['blur', 'change'] },
        ],
        // messageName: [
        //   { required: true, message: '请输入MESSAGENAME参数配置', trigger: 'blur' },
        // ],
      }
    }
  },
  methods: {
    golink() {
      window.open(`${location.origin}/dataCenter/dataSoure/index`)
    },
    highlight() {
      this.$nextTick(() => {
        Prism.highlightAll();
        // this.html = Prism.highlight(code, Prism.languages.xml, 'xml');
      });
    },
    /**
     * 获取v数据源列表
     */
    getRVSoureList() {
      getRVSoureList({
        pageNo: 1,
        limit: 999,
        status: 1,
      }).then(res => {
        if (res.code !== 0) return
        // 当前接口还不支持根据status过滤掉连接异常的数据源,这里手动过滤
        this.rvResourceList = (res.data?.records || []).filter(item => item.status === 1)
      })
    },
    // 获取nas文件源列表
    getNasSourceList() {
      getDataSoureList({
        pageNo: 1,
        limit: 999,
        dsType: "NAS",
      }).then(res => {
        if (res.code !== 0) return
        this.nasDataSourceList = res.data?.records || []
      })
    },
    /**
     * @public
     */
    async next({ resolve, reject }) {
      try {
        const validLeft = await this.$refs.refLeftForm.validate()
        const validRight = await this.$refs.refRightForm.validate()
        resolve()
      } catch (err) {
        reject(err)
      }
    }
  },
  mounted() {
    this.getRVSoureList();
    this.getNasSourceList();
    this.highlight();
  }
}
</script>

<style lang="less" scoped>
// @import "~prismjs/themes/prism-okaidia.css";
.step3-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  &::v-deep .el-alert {
    width: fit-content;
    overflow: unset;
  }
  .step3-content {
    flex: 1;
    padding-top: 10px;
    .panel {
      border-radius: 5px;
      height: 100%;
      background-color: #ffffff;
      padding: 10px 25px;
      .example-content {
        width: 100%;
      }
    }
    &::v-deep .ant-form-item {
      margin-bottom: 10px;
    }
  }
}
.padding-left-20 {
  padding-left: 20px;
}
</style>