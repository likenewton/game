import $ from 'jquery/dist/jquery.min';

export default class Ajax {
  constructor(param) {

    this.data = {
      domain: 'default',
      jsonpCb: 'callback',
    }

    this.urlData = {
      // 存放ajax地址
      getPhone: '/h5/agent/getphone', // 保存手机号码
      getSmsCode: '/h5/agent/getSmsCode', // 获取验证码
      getBase: '/h5/agent/getbase', // 获取基本信息
      getInfos: '/h5/agent/getinfo', // 获取资料
      showList: '/h5/agent/showList', // 展示信息
    }

    this.domain = {
      default: '', // 默认使用的域名
      localhost: 'http://192.168.30.213:8080',
      test: 'http://test.api.msdk.51738.com',
      pre: 'http://pre-apimsdk.wcsdk.poker3a.com',
      product: 'https://apimsdk.wcsdk.poker3a.com',
    }

    this.setData(param);

  }

  setData(data, info) {
    let oldData = this[info || 'data'];
    let newData = $.extend(oldData, data);
    this[info || 'data'] = newData;
  }

  /**
   *
   * @param paraObj = {
   * url: ajax地址(必需)，
   * }
   * @param callback
   */
  comAjax(paraObj, sucCb, errCb) {
    let _this = this;
    // 将不需要的参数去掉
    let deepCopy = $.extend(true, {}, paraObj);
    // ['URL', 'TYPE', 'dataType', 'async', 'contentType', 'timeOut'].forEach((attr) => {
    //   Reflect.deleteProperty(deepCopy, attr);
    // })
    // 因兼容性问题，暂时使用下面的写法
    let arr = ['URL', 'TYPE', 'dataType', 'async', 'contentType', 'timeOut'];
    for(var i = 0; i < arr.length; i++) {
      delete deepCopy[arr[i]]
    }

    $.ajax({
      url: `${_this.domain[_this.data.domain]}${paraObj.URL}`,
      type: paraObj.TYPE || 'POST',
      dataType: paraObj.dataType || 'json',
      contentType: paraObj.contentType || "application/json",     
      async: paraObj.async || true,
      timeout: paraObj.timeOut || 10000,
      data: JSON.stringify(deepCopy),
      success: (res) => {
        _this.validate(res, sucCb, errCb);
      },
    })
  }

  jsonp(paraObj, sucCb, errCb) {
    let _this = this;
    // 将不需要的参数去掉
    let deepCopy = $.extend(true, {}, paraObj);

    // ['URL', 'dataType', 'async', 'contentType', 'timeOut'].forEach((attr) => {
    //   Reflect.deleteProperty(deepCopy, attr);
    // })
    let arr = ['URL', 'dataType', 'async', 'contentType', 'timeOut'];
    for(var i = 0; i < arr.length; i++) {
      delete deepCopy[arr[i]]
    }

    $.ajax({
      url: _this.getJsonpUrl(paraObj.URL, deepCopy),
      type: 'GET',
      dataType: 'jsonp',
      contentType: paraObj.contentType || "application/x-www-form-urlencoded; charset=UTF-8",
      jsonp: _this.data.jsonpCb, //服务端用于接收callback调用的function名的参数  
      async: paraObj.async || true,
      timeout: paraObj.timeOut || 10000,
      success: (res) => {
        _this.validate(res, sucCb, errCb);
      },
      error: (res) => {
        console.log(res);
      }
    })
  }

  /**
   * 数据验证
   */
  validate(res, sucCb, errCb) {

    if (typeof res == 'string') res = JSON.parse(res);

    if (res.result === 0) {
      sucCb && sucCb(res);
    } else {
      if (errCb) { // 单独类型的错误回调优先级高于实例化参数中的错误回调
        errCb(res);
      } else if(this.data.errCb) {
        this.data.errCb(res);
      } else {
        alert(res.msg);
      }
    }
  }

  getJsonpUrl(path, data, isClearNull) {
    let url = `${this.domain[this.data.domain]}${path}`;
    let searchStr = '';

    for (let key in data) {
      if (isClearNull && !data[key]) continue;
      searchStr += '&' + key + '=' + data[key];
    }

    if (searchStr.length > 0) {
      searchStr = '?' + searchStr.substr(1);
    }
  
    return url + searchStr;
  }


  static render(param) {
    return new Ajax(param);
  }


}

