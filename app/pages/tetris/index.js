import template from 'art-template/dist/template.js'
import $ from 'jquery/dist/jquery.min'
import Components from '../../components'
import Api from '../../base/api/api.js'
import './style.scss'
import liTpl from './pageTpl/li.tpl'

const popup = Components.Popup.render()

// ==== INIT ====
class Game {

  constructor() {
    this._fn()
    this.data = {
      rows: new Array(10),
      cols: new Array(10),
      blockType: null, // 当前的block类型
      rotateType: 0, // 0, 90, 180, 270 当前的旋转角度
    }
    this.TwoDiArray = this.fn.getTwoDiArray() // 二维数组
    this.DomArray = [],
      this.pixel_w = this.data.cols.length
    this.pixel_h = this.data.rows.length
    this.blocks = [
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1]
      ], // 田
      [
        [0, 0],
        [1, -1],
        [1, 0],
        [1, 1]
      ], // 土
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1]
      ], // L
    ]
    this.curBlockPos = [] // 当前模块的位置
    this.Timer = null // 定时器
    this.renderPage()
  }

  initEvent() {
    $(document).keypress((e) => {

      const [code] = [e.keyCode]

      if (code == 115) {
        this.fn.toDown()
      }
      if (code == 100) {
        this.fn.toRight()
      }
      if (code == 119) {
        this.fn.toUp()
      }
      if (code == 97) {
        this.fn.toLeft()
      }
    });
  }

  renderPage() {

    $('.game-wrapper').html(template.compile(liTpl)({
      data: this.data
    }))

    this.created()
  }

  created() {

    this.initEvent()
    this.DomArray = this.fn.getDomArray() // 像素点dom
    this.fn.getNewBlock()
    this.fn.renderBlock()
  }

  _fn() {
    // 这样会形成一个闭包，对性能影响较大
    let _this = this;

    this.fn = {
      toLeft() {
        if (this.canMove('left')) {
          _this.curBlockPos = _this.curBlockPos.map(v => [v[0], v[1] - 1])
          this.nextStep()
        }
      },
      toRight() {
        if (this.canMove('right')) {
          _this.curBlockPos = _this.curBlockPos.map(v => [v[0], v[1] + 1])
          this.nextStep()
        }
      },
      toDown() {
        if (this.canMove('down')) {
          _this.curBlockPos = _this.curBlockPos.map(v => [v[0] + 1, v[1]])
          this.nextStep()
        } else {
          this.judgeStep()
        }
      },
      toUp() {
        // 向上为旋转block
        let type = _this.data.blockType
        let pos = _this.curBlockPos
        // 生成一个临时的数组用来保存旋转之后的pos
        let tplArr = [
          [0, 0],
          [0, 0],
          [0, 0],
          [0, 0]
        ]
        if (type === 0) {
          return
        } else if (type === 1) {
          if (_this.data.rotateType === 0) {
            tplArr = [
              [pos[0][0] + 1, pos[0][1] + 1],
              [pos[1][0] - 1, pos[1][1] + 1],
              pos[2],
              [pos[3][0] + 1, pos[3][1] - 1]
            ]
          } else if (_this.data.rotateType === 90) {
            let x = 1
            if (this.canMove('left')) x = 0
            tplArr = [
              [pos[0][0] + 1, pos[0][1] - 1 + x],
              [pos[1][0] + 1, pos[1][1] + 1 + x],
              [pos[2][0], pos[2][1] + x],
              [pos[3][0] - 1, pos[3][1] - 1 + x]
            ]
          } else if (_this.data.rotateType === 180) {
            tplArr = [
              [pos[0][0] - 1, pos[0][1] - 1],
              [pos[1][0] + 1, pos[1][1] - 1],
              pos[2],
              [pos[3][0] - 1, pos[3][1] + 1]
            ]
          } else if (_this.data.rotateType === 270) {
            let x = -1
            if (this.canMove('right')) x = 0
            tplArr = [
              [pos[0][0] - 1, pos[0][1] + 1 + x],
              [pos[1][0] - 1, pos[1][1] - 1 + x],
              [pos[2][0], pos[2][1] + x],
              [pos[3][0] + 1, pos[3][1] + 1 + x]
            ]
          }
        } else if (type === 2) {

        }
        if (this.canRotate(tplArr)) {
          // 如果可以旋转就保存起来
          _this.curBlockPos = tplArr
          _this.data.rotateType = _this.data.rotateType + 90 === 360 ? 0 : _this.data.rotateType + 90
        }
        this.renderBackGround()
        this.renderBlock()
      },
      // 判定是否可以朝某个方向移动一格
      canMove(dir) {
        let bool = true
        if (dir === 'left') {
          _this.curBlockPos.forEach((v) => {
            if (v[1] % _this.pixel_w === 0) {
              bool = false
            } else if (_this.TwoDiArray[v[0]][v[1] - 1]) {
              bool = false
            }
          })
        } else if (dir === 'right') {
          _this.curBlockPos.forEach((v) => {
            if ((v[1] + 1) % _this.pixel_w === 0) {
              bool = false
            } else if (_this.TwoDiArray[v[0]][v[1] + 1]) {
              bool = false
            }
          })
        } else if (dir === 'down') {
          _this.curBlockPos.forEach((v) => {
            if (v[0] + 1 >= _this.pixel_h) {
              bool = false
            } else if (_this.TwoDiArray[v[0] + 1][v[1]]) {
              bool = false
            }
          })
        }
        return bool
      },
      // 是否能旋转
      canRotate(tplArr) {
        let bool = true
        tplArr.forEach((v) => {
          if (_this.TwoDiArray[v[0]][v[1]]) {
            bool = false
          }
        })
        return bool
      },
      // 
      getTwoDiArray() {
        let arr = []

        for (var i = 0; i < _this.data.rows.length; i++) {
          arr.push([])
        }
        arr.forEach(v => {
          for (var i = 0; i < _this.data.cols.length; i++) {
            v.push(0)
          }
        })
        return arr
      },
      // 获取dom二维数组
      getDomArray() {
        let arr = []

        for (var i = 0; i < _this.data.rows.length; i++) {
          arr.push([])
        }
        arr.forEach((v, i) => {
          $('ul').eq(i).find('li').each((index, e) => {
            arr[i].push(e)
          })
        })
        return arr
      },
      // 获取一个新的板块
      getNewBlock() {
        const x = Math.floor(_this.pixel_w / 2) - 1
        _this.data.blockType = 1 || Math.floor(Math.random() * _this.blocks.length)
        _this.curBlockPos = _this.blocks[_this.data.blockType].map(v => [v[0], v[1] + x])
      },
      // 渲染当前的板块
      renderBlock() {
        if (_this.curBlockPos.length === 0) return
        let DomArray = _this.DomArray
        _this.curBlockPos.forEach((v) => {
          DomArray[v[0]][v[1]].style.backgroundColor = 'blue'
        })
      },
      // 渲染面板
      renderBackGround() {
        let arr = _this.TwoDiArray
        let DomArray = _this.DomArray

        for (var i = 0; i < arr.length; i++) {
          for (var j = 0; j < arr[i].length; j++) {
            let count = i * arr[i].length + j
            if (arr[i][j]) {
              DomArray[i][j].style.backgroundColor = 'blue'
            } else {
              DomArray[i][j].style.backgroundColor = 'white'
            }
          }
        }
      },
      // block下一步的移动
      nextStep() {
        this.renderBackGround()
        this.renderBlock()
      },
      // 结算该step
      judgeStep() {
        // 将block数据记录到面板
        _this.curBlockPos.forEach((v) => {
          _this.TwoDiArray[v[0]][v[1]] = 1
        })
        // 先看是否可以得分
        this.getScore();
        // 然后再出下一个block并初始化
        _this.curBlockPos = []
        _this.data.rotateType = 0
        this.getNewBlock()
        this.renderBlock()
      },
      getScore() {
        _this.TwoDiArray.forEach((v, i) => {
          let flag = true
          v.forEach(innerV => {
            if (!innerV) {
              flag = false
            }
          })
          if (flag === true) {
            let deleteCols = _this.TwoDiArray.splice(i, 1)[0]
            _this.TwoDiArray.unshift(deleteCols.map(v => v = 0))
          }
        }) 
        this.renderBackGround()
      }
    }
  }

  static start() {
    return new Game()
  }

}

Game.start()