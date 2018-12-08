import template from 'art-template/dist/template.js';
import $ from 'jquery/dist/jquery.min';
import tpl from './popup.tpl';
import './index.scss';

export default class Popup {

    constructor(paraObj) {
        // 优先级 params(调用alert等函数所传对象) > tipData == alertData == confirmData > data
        this.data = {
            componentName: 'Popup',
            dom: '.js-Popup',
            version_dom: `.js-Popup-${new Date().getTime()}_${parseInt(Math.random() * 1000)}`, // 不同的popup 实例会有不同的version_dom 类名，这样每一个实例都会有属于自己的事件以及参数
            equipment: 'COMPUTER', // 默认是pc端样式 MOBILE(移动端)
            backBtn: true, // 默认点击弹框背景执行cancal 按钮
            okBtn: '确定', // ok 按钮文案
            cancelBtn: '取消', // cancel 按钮文案
            status: false, // 成功与失败的状态
            // 部件的显示
            isShowCloseBtn: true, // 默认弹框有关闭的 x
            isShowOkBtn: true, // 是否显示 ok 按钮
            isShowCancelBtn: true, // 是否显示 cancal 按钮
            isShowFooter: true, // 是否显示底部按钮
            isShowBackground: true, // 是否显示弹框背景
            // 动画
            timeout: 0, // 弹框默认不会自动消失  (>0 会自动消失)
            animateIn: 'bounceInDown', // 默认进入动画
            animateOut: 'bounceOutUp', // 默认消失动画
            animateTime: 1000, // 动画持续时间
            // 回调函数 ↓         
            okHide: null, // 对话框消失前触发(确定)， return fasle 对话框将不会消失
            okHiden: null, // 对话框消失后触发(确定)，
            cancelHide: null, // 对话框消失前触发(取消)， return fasle 对话框将不会消失
            cancelHiden: null, // 对话框消失后触发(取消)，
            shown: null, // 对话框展示后触发
            // other
            tplData: null, // 当body传入的是template模板时，此数据用于渲染该模板
        }
        this.tipData = {
            type: 'TIP', // 弹框类型
            isShowFooter: false, // tip 没有底部按钮
            isShowCloseBtn: false, // tip 没有close 按钮
            timeout: 2000,
            animateIn: 'fadeIn',
            animateOut: 'fadeOut', // 默认消失动画
            isShowBackground: false,
        }
        this.alertData = {
            type: 'ALERT',
            isShowCancelBtn: false, // alert没有 cancel 按钮 
        }
        this.confirmData = {
            type: 'CONFIRM',
        }

        this.setData(paraObj);

        this.concatData = {}; // 合并后数据
        this.addEvents();

    }

    setData(data, info) {
        let oldData = this[info || 'data'];
        let newData = $.extend(oldData, data);
        this[info || 'data'] = newData;
    }

    _render(data) {

        if (data.tplData) {
            // 如果在弹窗前需要对传入的模板进行渲染
            data.body = template.compile(data.body)({
                data: data.tplData,
            })

            console.log(data.body);
        }

        this.$box = $(template.compile(tpl)({
            data
        }));
        if (this.$box) {
            this.$box.remove();
        }

        if ($(data.version_dom).length == 0) {
            let oDiv = document.createElement('div');
            $(oDiv).addClass(data.dom.substr(1)).addClass(data.version_dom.substr(1));
            document.body.appendChild(oDiv);
            $(data.version_dom).html(this.$box);
        } else {
            $(data.version_dom).html(this.$box);
        }

    }

    addEvents() {
        let self = this;
        let $doc = $(document);

        // ok按钮
        $doc.on('click', `${self.data.version_dom} .ok-btn`, () => {
            let data = self.concatData;

            if (!data.okHide) {
                self._animateOut('OK');
            } else {
                if (data.okHide() !== false) {
                    self._animateOut('OK');
                }
            }
        })

        // cancel按钮
        $doc.on('click', `${self.data.version_dom} .cancel-btn`, () => {
            let data = self.concatData;

            if (!data.cancelHide) {
                self._animateOut('CANCEL');
            } else {
                if (data.cancelHide() !== false) {
                    self._animateOut('CANCEL');
                }
            }
        })

        // 点击背景执行取消操作
        $doc.on('click', `${self.data.version_dom}`, (e) => {
            let $target = $(e.target);
            let data = self.concatData;

            if (e.target.className.includes('background')) {
                if (data.backBtn) {
                    $(`${self.data.version_dom} .cancel-btn`).trigger('click');
                }
            }
        })

        // 点击close执行取消操作
        $doc.on('click', `${self.data.version_dom} .close`, () => {
            let data = self.concatData;

            if (data.isShowCloseBtn) {
                $(`${self.data.version_dom} .cancel-btn`).trigger('click');
            }
        })

    }


    // 警告框
    alert(params = {}) {
        let paraObj = $.extend({}, this.data, this.alertData, params);
        this.concatData = {}; // 将concatData清空是保证params参数不会对data中的数据产生永久性的影响，只会对本次的弹框产生影响
        this.setData(paraObj, 'concatData');
        this._render(paraObj);
        this._animateIn(paraObj);

    }

    // 提示框
    confirm(params = {}) {

        let paraObj = $.extend({}, this.data, this.confirmData, params);
        this.concatData = {};
        this.setData(paraObj, 'concatData');
        this._render(paraObj);
        this._animateIn(paraObj);

    }

    // tip
    tip(params = {}) {

        let paraObj = $.extend({}, this.data, this.tipData, params);
        this.concatData = {};
        this.setData(paraObj, 'concatData');
        this._render(paraObj);
        this._animateIn(paraObj);

    }


    // === 动画 === (默认弹窗动画 bounceInDown)
    // 进入动画
    _animateIn(data) {
        let self = this;

        $(data.version_dom).css({
            'animationDuration': `${data.animateTime / 1000}s`,
            'zIndex': 888, // 如果是tip 层级要降低
        });
        $(data.version_dom).removeClass('animated fadeIn fadeOut').addClass('animated fadeIn');
        $(data.version_dom).find('.inner').removeClass().addClass(`inner animated ${data.animateIn}`);
        $(data.version_dom).fadeIn(data.animateTime, function() {
            data.shown && data.shown();
        });
        
        if (data.timeout) {
            setTimeout(() => {
                self._animateOut('CANCEL');
            }, data.timeout)
        }
    }

    // 消失动画
    _animateOut(flag) {
        let self = this;
        let data = self.concatData;
        let $version_dom = $(data.version_dom);

        $version_dom.removeClass('animated fadeIn fadeOut').addClass('animated fadeOut');
        $version_dom.find('.inner').removeClass().addClass(`inner animated ${data.animateOut}`);
        $version_dom.fadeOut(data.animateTime, function() {
            // 以下的回调函数是在弹框消失后出发
            if (flag === 'OK') {
                data.okHiden && data.okHiden();
            } else if (flag === 'CANCEL') {
                data.cancelHiden && data.cancelHiden();
            }
        });

    }

};


Popup.render = function(paraObj) {
    return Popup.obj = new Popup(paraObj);
}

Popup.isFirstLoad = true;