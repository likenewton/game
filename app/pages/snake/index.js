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
    this.data = {
      rows: new Array(40),
      cols: new Array(60),
      snakeColor: '#333',
      foodColor: '#e92322',
      speed: 70, // 小蛇的速度
      foodLocation: null, // 食物生成的坐标
      direction: 'RIGHT', // 小蛇移动的方向(初始向右)
      snake: [1, 2, 3, 4, 5], // 蛇身所占的位置
      isDeath: false
    }
    this.pixel_w = this.data.cols.length
    this.pixel_h = this.data.rows.length
    this.$pixel = null // 像素点dom
    this.Timer = null // 定时器
    this._fn()
    this.renderPage()
  }

  initEvent() {
    $(document).keypress((event) => {
      const code = event.keyCode
      const direction = this.data.direction

      clearInterval(this.Timer);
      if (code == 115 && direction != "UP") {
        this.fn.toDown();
        this.Timer = setInterval(this.fn.toDown.bind(this.fn), this.data.speed);
      }
      if (code == 100 && direction != "LEFT") {
        this.fn.toRight();
        this.Timer = setInterval(this.fn.toRight.bind(this.fn), this.data.speed);
      }
      if (code == 119 && direction != "DOWN") {
        this.fn.toUp();
        this.Timer = setInterval(this.fn.toUp.bind(this.fn), this.data.speed);
      }
      if (code == 97 && direction != "RIGHT") {
        this.fn.toLeft();
        this.Timer = setInterval(this.fn.toLeft.bind(this.fn), this.data.speed);
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
    this.$pixel = $('li')
    this.fn.getFoodLocation()
    this.fn.setSnakeColor()
    this.fn.setFoodColor()
    this.Timer = setInterval(this.fn.toRight.bind(this.fn), this.data.speed)

  }

  _fn() {
    let _this = this;

    this.fn = {
      toRight() {
        _this.data.direction = 'RIGHT'
        this.getNextStepSnakeArr('RIGHT')
        this.getJudge('RIGHT')
      },
      toLeft() {
        _this.data.direction = 'LEFT'
        this.getNextStepSnakeArr('LEFT')
        this.getJudge('LEFT')
      },
      toUp() {
        _this.data.direction = 'UP'
        this.getNextStepSnakeArr('UP')
        this.getJudge('UP')
      },
      toDown() {
        _this.data.direction = 'DOWN'
        this.getNextStepSnakeArr('DOWN')
        this.getJudge('DOWN')
      },
      // 渲染snake
      setSnakeColor() {
        _this.data.snake.forEach((v) => {
          _this.$pixel[v - 1].style.backgroundColor = _this.data.snakeColor
        })
      },
      // 渲染食物
      setFoodColor() {
        _this.$pixel[_this.data.foodLocation - 1].style.backgroundColor = _this.data.foodColor
      },
      // 获取下一步的snake数组
      getNextStepSnakeArr(DIR) {
        let snake = _this.data.snake
        const lastIndexOfSnake = snake[snake.length - 1]

        if (DIR === 'RIGHT') {
          snake.push(lastIndexOfSnake + 1)
        } else if (DIR === 'LEFT') {
          snake.push(lastIndexOfSnake - 1)
        } else if (DIR === 'UP') {
          snake.push(lastIndexOfSnake - _this.pixel_w)
        } else if (DIR === 'DOWN') {
          snake.push(lastIndexOfSnake + _this.pixel_w)
        }
        return snake
      },
      // 下一步移动判定
      getJudge(DIR) {
        let snake = _this.data.snake

        if (_this.data.isDeath) return

        if (this.judgeDeath()) {
          clearInterval(_this.Timer);
          _this.data.isDeath = true
          popup.alert({
            body: '游戏结束<div>刷新页面再来一局吧！</div>'
          })
          return
        }

        // snake是否吃到了food
        if (snake[snake.length - 1] === _this.data.foodLocation) {
          // 有
          this.getFoodLocation()
        } else {
          // 没有
          snake.shift()
        }

        _this.$pixel.css('backgroundColor', 'white')
        this.setSnakeColor()
        this.setFoodColor()

      },
      // 死亡判定
      judgeDeath() {
        let snake = _this.data.snake
        let last = snake[snake.length - 1]

        // 撞自己判定
        for (var i = 0; i < snake.length - 1; i++) {
          if (snake[i] === last) {
            return true
          }
        }

        // 撞墙判定
        if (_this.data.direction === 'RIGHT') {
          if (last % _this.pixel_w === 1) {
            return true
          }
        } else if (_this.data.direction === 'LEFT') {
          if (last % _this.pixel_w === 0) {
            return true
          }
        } else if (_this.data.direction === 'UP') {
          if (last < 0) {
            return true
          }
        } else if (_this.data.direction === 'DOWN') {
          if (last > _this.pixel_w * _this.pixel_h) {
            return true
          }
        }

      },
      // 获取食物的坐标
      getFoodLocation() {
        let totalPixel = _this.pixel_w * _this.pixel_h
        let foodLocation = Math.ceil(Math.random() * totalPixel)

        // 确保食物不能出现在snake之中
        if (_this.data.snake.includes(foodLocation)) {
          return this.getFoodLocation()
        } else {
          _this.data.foodLocation = foodLocation
        }
      }
    }
  }

  static start() {
    return new Game()
  }

}

Game.start()