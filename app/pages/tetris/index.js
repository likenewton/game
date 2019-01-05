import template from 'art-template/dist/template.js'
import $ from 'jquery/dist/jquery.min'
import Components from '../../components'
import Api from '../../base/api/api.js'
import './style.scss'
import liTpl from './pageTpl/li.tpl'

const popup = Components.Popup.render()
const ajax = Components.Ajax.render({
  domain: 'games',
  errCb(res) {
    popup.alert({
      body: res.msg
    })
  }
})

// ==== INIT ====
class Tetris {

  constructor() {
    this._fn()
    this.data = {
      rows: new Array(20),
      cols: new Array(10),
      blockType: null, // 当前的block类型
      rotateType: 0, // 0, 90, 180, 270 当前的旋转角度、
      isDeath: false,
      singleScoreList: [0, 1, 3, 6, 10], // 一次消0, 1、2、3、4排对应的得分
      highestScore: 0, // 最高得分
      score: 0, // 当前得分
    }
    this.TwoDiArray = this.fn.getTwoDiArray() // 二维数组
    this.DomArray = []
    this.pixel_w = this.data.cols.length
    this.pixel_h = this.data.rows.length
    this.blocks = [
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1]
      ], // 田 0
      [
        [0, 0],
        [1, -1],
        [1, 0],
        [1, 1]
      ], // 土 1
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1]
      ], // L 2
      [
        [0, 0],
        [1, 0],
        [2, -1],
        [2, 0]
      ], // |L 3
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1]
      ], // |z 4
      [
        [0, 0],
        [1, -1],
        [1, 0],
        [2, -1]
      ], // z 5
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3]
      ], // 一
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

    $('.up-btn').click(() => {
      this.fn.toUp()
    })
    $('.left-btn').click(() => {
      this.fn.toLeft()
    })
    $('.right-btn').click(() => {
      this.fn.toRight()
    })
    $('.down-btn').click(() => {
      this.fn.toDown()
    })
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
    // this.Timer = setInterval(this.fn.toDown.bind(this.fn), 300)

    ajax.comAjax({
      URL: ajax.urlData.getGameInfos + `?gameId=2&userId=${10001}`,
      TYPE: 'GET'
    }, (res) => {
      this.data.highestScore = res.data.highestScore
      this.fn.renderScorePanel()
    })

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
        if (_this.data.isDeath) {
          clearInterval(_this.Timer)
          popup.alert({
            body: '游戏结束<div>可以刷新开始下一局哦</div>'
          })
          return
        }
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
          if (_this.data.rotateType === 0) {
            let x = 1
            if (this.canMove('left')) x = 0
            tplArr = [
              [pos[0][0] + 1, pos[0][1] + 1 + x],
              [pos[1][0], pos[1][1] + x],
              [pos[2][0] - 1, pos[2][1] - 1 + x],
              [pos[3][0], pos[3][1] - 2 + x]
            ]
          } else if (_this.data.rotateType === 90) {
            tplArr = [
              [pos[0][0] + 1, pos[0][1] - 1],
              pos[1],
              [pos[2][0] - 1, pos[2][1] + 1],
              [pos[3][0] - 2, pos[3][1]]
            ]
          } else if (_this.data.rotateType === 180) {
            let x = -1
            if (this.canMove('right')) x = 0
            tplArr = [
              [pos[0][0] - 1, pos[0][1] - 1 + x],
              [pos[1][0], pos[1][1] + x],
              [pos[2][0] + 1, pos[2][1] + 1 + x],
              [pos[3][0], pos[3][1] + 2 + x]
            ]
          } else if (_this.data.rotateType === 270) {
            tplArr = [
              [pos[0][0] - 1, pos[0][1] + 1],
              pos[1],
              [pos[2][0] + 1, pos[2][1] - 1],
              [pos[3][0] + 2, pos[3][1]]
            ]
          }
        } else if (type === 3) {
          if (_this.data.rotateType === 0) {
            let x = -1
            if (this.canMove('right')) x = 0
            tplArr = [
              [pos[0][0] + 1, pos[0][1] + 1 + x],
              [pos[1][0], pos[1][1] + x],
              [pos[2][0] - 2, pos[2][1] + x],
              [pos[3][0] - 1, pos[3][1] - 1 + x]
            ]
          } else if (_this.data.rotateType === 90) {
            tplArr = [
              [pos[0][0] + 1, pos[0][1] - 1],
              pos[1],
              [pos[2][0], pos[2][1] + 2],
              [pos[3][0] - 1, pos[3][1] + 1]
            ]
          } else if (_this.data.rotateType === 180) {
            let x = 1
            if (this.canMove('left')) x = 0
            tplArr = [
              [pos[0][0] - 1, pos[0][1] - 1 + x],
              [pos[1][0], pos[1][1] + x],
              [pos[2][0] + 2, pos[2][1] + x],
              [pos[3][0] + 1, pos[3][1] + 1 + x]
            ]
          } else if (_this.data.rotateType === 270) {
            tplArr = [
              [pos[0][0] - 1, pos[0][1] + 1],
              pos[1],
              [pos[2][0], pos[2][1] - 2],
              [pos[3][0] + 1, pos[3][1] - 1]
            ]
          }
        } else if (type === 4) {
          if (_this.data.rotateType === 0) {
            let x = -1
            if (this.canMove('right')) x = 0
            tplArr = [
              [pos[0][0], pos[0][1] + 2 + x],
              [pos[1][0] - 1, pos[1][1] + 1 + x],
              [pos[2][0], pos[2][1] + x],
              [pos[3][0] - 1, pos[3][1] - 1 + x]
            ]
          } else if (_this.data.rotateType === 90) {
            tplArr = [
              [pos[0][0] + 2, pos[0][1]],
              [pos[1][0] + 1, pos[1][1] + 1],
              pos[2],
              [pos[3][0] - 1, pos[3][1] + 1]
            ]
          } else if (_this.data.rotateType === 180) {
            let x = 1
            if (this.canMove('left')) x = 0
            tplArr = [
              [pos[0][0], pos[0][1] - 2 + x],
              [pos[1][0] + 1, pos[1][1] - 1 + x],
              [pos[2][0], pos[2][1] + x],
              [pos[3][0] + 1, pos[3][1] + 1 + x]
            ]
          } else if (_this.data.rotateType === 270) {
            tplArr = [
              [pos[0][0] - 2, pos[0][1]],
              [pos[1][0] - 1, pos[1][1] - 1],
              pos[2],
              [pos[3][0] + 1, pos[3][1] - 1]
            ]
          }
        } else if (type === 5) {
          if (_this.data.rotateType === 0) {
            let x = 1
            if (this.canMove('left')) x = 0
            tplArr = [
              [pos[0][0] + 2, pos[0][1] + x],
              [pos[1][0], pos[1][1] + x],
              [pos[2][0] + 1, pos[2][1] - 1 + x],
              [pos[3][0] - 1, pos[3][1] - 1 + x]
            ]
          } else if (_this.data.rotateType === 90) {
            tplArr = [
              [pos[0][0], pos[0][1] - 2],
              [pos[1][0], pos[1][1]],
              [pos[2][0] - 1, pos[2][1] - 1],
              [pos[3][0] - 1, pos[3][1] + 1]
            ]
          } else if (_this.data.rotateType === 180) {
            let x = -1
            if (this.canMove('right')) x = 0
            tplArr = [
              [pos[0][0] - 2, pos[0][1] + x],
              [pos[1][0], pos[1][1] + x],
              [pos[2][0] - 1, pos[2][1] + 1 + x],
              [pos[3][0] + 1, pos[3][1] + 1 + x]
            ]
          } else if (_this.data.rotateType === 270) {
            tplArr = [
              [pos[0][0], pos[0][1] + 2],
              [pos[1][0], pos[1][1]],
              [pos[2][0] + 1, pos[2][1] + 1],
              [pos[3][0] + 1, pos[3][1] - 1]
            ]
          }
        } else if (type === 6) {
          if (_this.data.rotateType === 0) {
            tplArr = [
              [pos[0][0] - 1, pos[0][1] + 1],
              [pos[1][0], pos[1][1]],
              [pos[2][0] + 1, pos[2][1] - 1],
              [pos[3][0] + 2, pos[3][1] - 2]
            ]
          } else if (_this.data.rotateType === 90) {
            let x = 0
            if (!this.canMove('left')) x = 1
            else if (!this.canMove('right')) x = -2
            else if (!this.canMove('right', 2)) x = -1
            tplArr = [
              [pos[0][0] + 1, pos[0][1] - 1 + x],
              [pos[1][0], pos[1][1] + x],
              [pos[2][0] - 1, pos[2][1] + 1 + x],
              [pos[3][0] - 2, pos[3][1] + 2 + x]
            ]
          } else if (_this.data.rotateType === 180) {
            tplArr = [
              [pos[0][0] - 1, pos[0][1] + 1],
              [pos[1][0], pos[1][1]],
              [pos[2][0] + 1, pos[2][1] - 1],
              [pos[3][0] + 2, pos[3][1] - 2]
            ]
          } else if (_this.data.rotateType === 270) {
            let x = 0
            if (!this.canMove('left')) x = 1
            else if (!this.canMove('right')) x = -2
            else if (!this.canMove('right', 2)) x = -1
            tplArr = [
              [pos[0][0] + 1, pos[0][1] - 1 + x],
              [pos[1][0], pos[1][1] + x],
              [pos[2][0] - 1, pos[2][1] + 1 + x],
              [pos[3][0] - 2, pos[3][1] + 2 + x]
            ]
          }
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
      canMove(dir, step = 1) {
        let bool = true
        if (dir === 'left') {
          _this.curBlockPos.forEach((v) => {
            if (v[1] % _this.pixel_w === 0) {
              bool = false
            } else if (_this.TwoDiArray[v[0]][v[1] - step]) {
              bool = false
            }
          })
        } else if (dir === 'right') {
          _this.curBlockPos.forEach((v) => {
            if ((v[1] + step) % _this.pixel_w === 0) {
              bool = false
            } else if (_this.TwoDiArray[v[0]][v[1] + step]) {
              bool = false
            }
          })
        } else if (dir === 'down') {
          _this.curBlockPos.forEach((v) => {
            if (v[0] + step >= _this.pixel_h) {
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
          // 选择不能超过下边界，也不能与堆积的block重叠
          if (v[0] >= _this.pixel_h || v[0] < 0 || _this.TwoDiArray[v[0]][v[1]]) {
            bool = false
          }
        })
        return bool
      },
      // 获取面板二维数组
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
        _this.data.blockType = Math.floor(Math.random() * _this.blocks.length)
        _this.curBlockPos = _this.blocks[_this.data.blockType].map(v => [v[0], v[1] + x])
        this.judgeDeath()
      },
      // 渲染当前的板块
      renderBlock() {
        if (_this.curBlockPos.length === 0) return
        _this.curBlockPos.forEach((v) => {
          _this.DomArray[v[0]][v[1]].style.backgroundColor = 'blue'
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
        this.judgeGetScore();
        // 然后再出下一个block并初始化
        _this.curBlockPos = []
        _this.data.rotateType = 0
        this.getNewBlock()
        this.renderBlock()
      },
      // 获取得分判定
      judgeGetScore() {
        let level = 0; // 默认消除 0 排
        _this.TwoDiArray.forEach((v, i) => {
          let flag = true
          v.forEach(innerV => {
            if (!innerV) flag = false
          })
          if (flag === true) {
            level++
            let deleteCols = _this.TwoDiArray.splice(i, 1)[0]
            _this.TwoDiArray.unshift(deleteCols.map(v => v = 0))
          }
        })
        if (level > 0) {
          _this.data.score += _this.data.singleScoreList[level]
          _this.data.highestScore = _this.data.score > _this.data.highestScore ? _this.data.score : _this.data.highestScore
        }
        this.renderBackGround()
        this.renderScorePanel()
      },
      // 判断是否已经死亡
      judgeDeath() {
        _this.curBlockPos.forEach((v) => {
          // 选择不能超过下边界，也不能与堆积的block重叠
          if (_this.TwoDiArray[v[0]][v[1]]) {
            _this.data.isDeath = true
            // 将游戏得分发送给后台
            ajax.comAjax({
              URL: ajax.urlData.setScore,
              gameId: 2,
              userId: 10001,
              score: _this.data.score
            }, (res) => {
              console.log(res)
            })
          }
        })
      },
      renderScorePanel() {
        $('#score').text(_this.data.score)
        $('#highest-score').text(_this.data.highestScore)
      }
    }
  }

  static start() {
    return new Tetris()
  }

}

Tetris.start()