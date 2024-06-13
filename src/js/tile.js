import $ from 'jquery';

class Tile {
  constructor(x, y, game) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.valueProp = 2;
    this.canMove = false;
    this.initialize();
  }

  initialize() {
    const getTile = $.parseHTML($("#template_tile").html());
    this.el = $(getTile);
    this.el.find(".tile_number").html(this.valueProp).attr("data-value", 2);
    this.setPosition(this.x, this.y);
    this.animatePosition(true);
    this.el.appendTo(".tile-container");
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.game.board[x][y].tilesArray.push(this);
  }

  removeOldPosition(x, y) {
    const index = this.game.board[x][y].tilesArray.indexOf(this);
    if (index > -1) {
      this.game.board[x][y].tilesArray.splice(index, 1);
    }
  }

  animatePosition(initializeFlag) {
    const self = this;
    const fromLeft = this.x * (100 / this.game.rows);
    const fromTop = this.y * (100 / this.game.columns);
    const animationDuration = 175;
    const getPromise = $.Deferred();

    if (initializeFlag) {
      this.el.addClass("initialize");
    } else {
      this.el.removeClass("initialize");
    }

    function resolvePromise() {
      getPromise.resolve();
      self.el.removeClass("animate");
      self.el.removeClass("initialize");
    }

    function setPosition() {
      self.el.addClass("animate");
      self.el.attr({ "data-x": fromLeft, "data-y": fromTop });
    }

    if (initializeFlag) {
      setPosition();
      setTimeout(resolvePromise, animationDuration + 50);
    } else {
      setPosition();
      setTimeout(resolvePromise, animationDuration);
    }

    return getPromise;
  }

  moveCheck() {
    return (
      this.move("up", true) ||
      this.move("right", true) ||
      this.move("down", true) ||
      this.move("left", true)
    );
  }

  move(direction, checkFlag) {
    checkFlag = checkFlag ? true : false;
    direction = direction.toLowerCase();
    let getNext;
    let isNextMatch;
    let isNextEmpty;
    const nextPositionArray = [];

    if (direction === "up") {
      getNext = this.y > 0 ? this.game.board[this.x][this.y - 1] : false;
      nextPositionArray.push(this.x, this.y - 1);
    } else if (direction === "right") {
      getNext = this.x < this.game.columns - 1 ? this.game.board[this.x + 1][this.y] : false;
      nextPositionArray.push(this.x + 1, this.y);
    } else if (direction === "down") {
      getNext = this.y < this.game.rows - 1 ? this.game.board[this.x][this.y + 1] : false;
      nextPositionArray.push(this.x, this.y + 1);
    } else if (direction === "left") {
      getNext = this.x > 0 ? this.game.board[this.x - 1][this.y] : false;
      nextPositionArray.push(this.x - 1, this.y);
    }

    isNextMatch =
      getNext &&
      getNext.tilesArray.length === 1 &&
      getNext.tilesArray[0].valueProp === this.valueProp;
    isNextEmpty = getNext && getNext.tilesArray.length === 0;

    if (checkFlag) {
      return isNextEmpty || isNextMatch ? true : false;
    } else if (isNextEmpty || isNextMatch) {
      this.setPosition(nextPositionArray[0], nextPositionArray[1]);
      this.removeOldPosition(this.x, this.y);
      if (!isNextMatch) {
        this.move(direction);
      }
    }
  }
}

export { Tile };
