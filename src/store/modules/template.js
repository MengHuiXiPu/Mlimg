const template = {
    state: {
        step: {
            id: null,//模板主键id
            templateName: '',//模板名称
            nodeId: '',//节点名称
            classId: '',//产品id
            eqpId: '',//站点id
            stem_num: null,//步骤号
            tplDatalistId: '',//resize前原图目录
            tplDatalistPath: '',//resize前原图目录
            rawImageDir: '',//resize前原图目录
            resize_raw_image_path: '',//resize后原图地址
            out_path: '',//总输出目录
            ref_flag: null,//模板是否被引用
            create_by: '',//创建人
            create_time: null,//创建时间
            update_by: '',//更新人
            update_time: null,//更新时间
            remark: '',//备注
            tpl_datalist_id: '',//模板原目录数据集id
            config_json_str: '',//配置key-value json串
            version: null,//版本
            resizeId:null, //reszie表id
            templateId:null, //reszie表id
        },
        
    },
    mutations: {
        setBasicData: (state, BasicData) => {
            state.step.resizeId = BasicData.resizeId;
            state.step.id = BasicData.id;
            state.step.templateName = BasicData.templateName;
            state.step.nodeId = BasicData.nodeId;
            state.step.classId = BasicData.classId;
            state.step.eqpId = BasicData.eqpId;
            state.step.tplDatalistId = BasicData.tplDatalistId;
            state.step.tplDatalistPath = BasicData.tplDatalistPath;
            state.step.rawImageDir = BasicData.rawImageDir;
            state.step.templateId = BasicData.templateId;
        },
    },
    actions: {

    }
}

export default template