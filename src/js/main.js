// game.js
import '../scss/styles.scss';
import * as bootstrap from 'bootstrap';
import Hammer from 'hammerjs';
import _ from 'lodash';
import $ from 'jquery';

class Game {
  constructor(size) {
    this.rows = size;
    this.columns = size;
    this.board = [];
    this.score = 0;
    this.moveInProgress = false;
  }

  initialize() {
    $(".grid").empty();
    $(".tile-container").empty();
    this.initBoard();
    this.initTile();
    this.initEventListeners();
  }

  initBoard() {
    const initGridCell = (x, y) => {
      const getGridCell = $.parseHTML($("#template_grid_cell").html());
      $(getGridCell).appendTo(".grid");
      return { x, y, tilesArray: [] };
    };

    for (let x = 0; x < this.rows; x++) {
      const newArray = [];
      this.board.push(newArray);
      for (let y = 0; y < this.columns; y++) {
        const gridObj = initGridCell(x, y);
        newArray.push(gridObj);
      }
    }
  }

  initTile() {
    if (this.isGameOver()) return;
    const emptyCell = this.getRandomEmptyCell();
    new Tile(emptyCell.x, emptyCell.y, this);
    this.isGameOver();
  }

  initEventListeners() {
    const self = this;
    const getGameboard = document.getElementById("touchGameboard");

    window.hammertime && window.hammertime.destroy();
    window.hammertime = new Hammer(getGameboard, {
      recognizers: [[Hammer.Swipe, { direction: Hammer.DIRECTION_ALL }]],
    });

    window.hammertime
      .on("swipeleft", () => self.move("left"))
      .on("swiperight", () => self.move("right"))
      .on("swipedown", () => self.move("down"))
      .on("swipeup", () => self.move("up"));

    $(document).off("keydown.move").on("keydown.move", (event) => {
      event.preventDefault();
      switch (event.which) {
        case 37: self.move("left"); break;
        case 38: self.move("up"); break;
        case 39: self.move("right"); break;
        case 40: self.move("down"); break;
      }
    });

    $('[data-js="newGame"]').off("click.newGame").on("click.newGame", () => gameStart());
  }

  isGameOver() {
    const gameBoard = this.boardFlatten();
    let is2048 = false;
    let canAnyTileMove = false;
    let hasEmptyCells = false;

    gameBoard.forEach(val => {
      val.tilesArray.forEach(tile => {
        if (tile.valueProp === 2048) is2048 = true;
      });
    });

    if (this.getEmptyCells().length > 0) hasEmptyCells = true;
    gameBoard.forEach(val => {
      val.tilesArray.forEach(tile => {
        tile.moveCheck();
        if (tile.canMove) canAnyTileMove = true;
      });
    });

    if (is2048) {
      this.gameWon();
      return true;
    } else if (!hasEmptyCells && !canAnyTileMove) {
      this.gameLost();
      return true;
    }
    return false;
  }

  getEmptyCells() {
    return _.filter(this.boardFlatten(), val => !val.tilesArray.length);
  }

  getRandomEmptyCell() {
    const emptyGridCells = this.getEmptyCells();
    const randomIndex = Math.floor(Math.random() * emptyGridCells.length);
    return emptyGridCells[randomIndex];
  }

  TileMerge() {
    const gameBoard = this.boardFlatten();
    let newScore = this.score;

    gameBoard.forEach(val => {
      if (val.tilesArray.length === 2) {
        const currentValue = val.tilesArray[0].valueProp;
        val.tilesArray[0].value = currentValue * 2;
        val.tilesArray.pop().el.remove();
        newScore += currentValue;
      }
    });

    this.score = newScore;
    $('[data-js="score"]').html(this.score.toString());
  }

  moveAnimations(gameBoard) {
    if (this.moveInProgress) return false;

    this.moveInProgress = true;
    const promiseArray = [];

    gameBoard.forEach(val => {
      val.tilesArray.forEach(tile => {
        promiseArray.push(tile.animatePosition());
      });
    });

    $.when.apply($, promiseArray).then(() => {
      this.moveInProgress = false;
      this.TileMerge();
      this.initTile();
    });

    if (promiseArray.length === 0) {
      this.moveInProgress = false;
      this.TileMerge();
      this.initTile();
    }
  }

  move(direction) {
    if (this.moveInProgress) return false;

    let gameBoard;
    let hasAnyTileMoved = false;

    direction = direction.toLowerCase();
    if (direction === "up") {
      gameBoard = _.orderBy(this.boardFlatten(), "y", "asc");
    } else if (direction === "right") {
      gameBoard = _.orderBy(this.boardFlatten(), "x", "desc");
    } else if (direction === "down") {
      gameBoard = _.orderBy(this.boardFlatten(), "y", "desc");
    } else if (direction === "left") {
      gameBoard = _.orderBy(this.boardFlatten(), "y", "asc");
    }

    gameBoard.forEach(val => {
      if (val.tilesArray.length) {
        val.tilesArray.forEach(tile => {
          if (tile.move(direction, true)) {
            hasAnyTileMoved = true;
            tile.move(direction);
          }
        });
      }
    });

    if (hasAnyTileMoved) this.moveAnimations(gameBoard);
  }

  boardFlatten() {
    return _.flatten(this.board);
  }

  gameWon() {
    alert("You won!");
  }

  gameLost() {
    alert("Game over!");
  }
}

function gameStart() {
  window.game = new Game(4);
  window.game.initialize();
}

$(document).ready(gameStart);

// tile.js
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
    this.game.board[x][y].tilesArray.pop();
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
      getNext = this.x < 3 ? this.game.board[this.x + 1][this.y] : false;
      nextPositionArray.push(this.x + 1, this.y);
    } else if (direction === "down") {
      getNext = this.y < 3 ? this.game.board[this.x][this.y + 1] : false;
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


document.addEventListener("DOMContentLoaded", function() {
  const newGameButton = document.getElementById('start_new_game');

  newGameButton.addEventListener('click', function() {
    startNewGame();
  });

  function startNewGame() {
    console.log('New game started');
    const scoreElement = document.querySelector('[data-js="score"]');
    scoreElement.textContent = '0';
    clearGameboard();
    initializeGameState();
  }

  function clearGameboard() {
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => tile.remove());
  }

  function initializeGameState() {
    window.game = new Game(4);
    window.game.initialize();
    console.log('Game state initialized');
  }

  initializeGameState(); // Automatically start a new game when the page loads
});