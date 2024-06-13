import $ from 'jquery';
import _ from 'lodash';
import Hammer from 'hammerjs';
import { Tile } from './tile';

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
    this.board = []; // Clear the board array
    this.initBoard();
    this.initTile();
    this.initEventListeners();
    $('[data-js="score"]').html(this.score.toString());
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

    $('[data-js="newGame"]').off("click.newGame").on("click.newGame", startNewGame);
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
      gameBoard = _.orderBy(this.boardFlatten(), "x", "asc");
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

function startNewGame() {
  window.game.initialize();
}

$(document).ready(gameStart);

export { Game };
