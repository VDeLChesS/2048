import { Tile } from '../src/js/tile';
import { Game } from '../src/js/game';
import $ from 'jquery';
import 'jest-canvas-mock';  

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

describe('Tile Class', () => {
  let game;
  let tile;

  beforeEach(() => {
    game = new Game(4);
    game.initialize();
    const emptyCell = game.getRandomEmptyCell();
    tile = new Tile(emptyCell.x, emptyCell.y, game);
  });

  test('initializes tile correctly', () => {
    expect(tile.x).toBeGreaterThanOrEqual(0);
    expect(tile.x).toBeLessThan(4);
    expect(tile.y).toBeGreaterThanOrEqual(0);
    expect(tile.y).toBeLessThan(4);
    expect(tile.valueProp).toBe(2);
  });

  test('sets position correctly', () => {
    tile.setPosition(1, 1);
    expect(tile.x).toBe(1);
    expect(tile.y).toBe(1);
  });

  test('removes old position correctly', () => {
    const { x, y } = tile;
    tile.setPosition(1, 1);
    tile.removeOldPosition(x, y);
    expect(game.board[x][y].tilesArray.length).toBe(0);
  });

  test('animates position correctly', () => {
    const promise = tile.animatePosition(true);
    expect(promise).toBeInstanceOf(Promise);
  });

  test('checks if tile can move', () => {
    const canMove = tile.moveCheck();
    expect(canMove).toBe(true);
  });

  test('moves tile correctly', () => {
    const initialX = tile.x;
    const initialY = tile.y;
    tile.move('right');
    expect(tile.x).not.toBe(initialX);
    expect(tile.y).toBe(initialY);
  });
});
