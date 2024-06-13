import { Game } from '../js/game';
import $ from 'jquery';
import 'jest-canvas-mock';  // Mock for canvas used in animations

/**
 * @jest-environment jsdom
 */

test('use jsdom in this test file', () => {
  const element = document.createElement('div');
  expect(element).not.toBeNull();
});

document.body.innerHTML = `
  <div class="grid"></div>
  <div class="tile-container"></div>
  <script type="text/html" id="template_grid_cell">
    <div class="grid_cell"></div>
  </script>
  <script type="text/html" id="template_tile">
    <div class="tile">
      <span class="tile_number"></span>
    </div>
  </script>
  <span data-js="score"></span>
`;

describe('Game Class', () => {
  let game;

  beforeEach(() => {
    game = new Game(4);
    game.initialize();
  });

  test('initializes the board correctly', () => {
    expect(game.board.length).toBe(4);
    expect(game.board[0].length).toBe(4);
  });

  test('adds a tile to a random empty cell', () => {
    const initialEmptyCells = game.getEmptyCells().length;
    game.initTile();
    const currentEmptyCells = game.getEmptyCells().length;
    expect(currentEmptyCells).toBe(initialEmptyCells - 1);
  });

  test('resets the game state', () => {
    game.score = 100;
    game.initialize();
    expect(game.score).toBe(0);
    expect(game.board.length).toBe(4);
    expect(game.board[0].length).toBe(4);
  });

  test('detects game over condition', () => {
    game.board = game.board.map(row =>
      row.map(cell => ({ ...cell, tilesArray: [{ valueProp: 2 }] }))
    );
    expect(game.isGameOver()).toBe(true);
  });
});
