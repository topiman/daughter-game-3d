// Canvas API 生成纹理图集 — 不依赖外部图片
import * as THREE from 'three';
import { BlockType } from './items';

const TILE_SIZE = 16;
const ATLAS_TILES = 8; // 8x8 grid
const ATLAS_SIZE = TILE_SIZE * ATLAS_TILES;

// 纹理在图集中的位置 [col, row]
// 每个方块有 top, side, bottom 三种面
export const BLOCK_UVS: Record<number, { top: [number, number]; side: [number, number]; bottom: [number, number] }> = {
  [BlockType.BEDROCK]: { top: [0, 0], side: [0, 0], bottom: [0, 0] },
  [BlockType.GRASS]:   { top: [1, 0], side: [2, 0], bottom: [3, 0] },
  [BlockType.DIRT]:    { top: [3, 0], side: [3, 0], bottom: [3, 0] },
  [BlockType.WOOD]:    { top: [4, 0], side: [5, 0], bottom: [4, 0] },
  [BlockType.WATER_BLOCK]: { top: [6, 0], side: [6, 0], bottom: [6, 0] },
};

function drawPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawNoise(ctx: CanvasRenderingContext2D, ox: number, oy: number, baseColor: [number, number, number], variation: number) {
  for (let py = 0; py < TILE_SIZE; py++) {
    for (let px = 0; px < TILE_SIZE; px++) {
      const v = (Math.random() - 0.5) * variation;
      const r = Math.min(255, Math.max(0, baseColor[0] + v));
      const g = Math.min(255, Math.max(0, baseColor[1] + v));
      const b = Math.min(255, Math.max(0, baseColor[2] + v));
      ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
      ctx.fillRect(ox + px, oy + py, 1, 1);
    }
  }
}

function drawTile(ctx: CanvasRenderingContext2D, col: number, row: number, drawer: (ctx: CanvasRenderingContext2D, x: number, y: number) => void) {
  drawer(ctx, col * TILE_SIZE, row * TILE_SIZE);
}

export function createTextureAtlas(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const ctx = canvas.getContext('2d')!;
  
  // 填充黑色背景
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);

  // 0,0 - 基岩
  drawTile(ctx, 0, 0, (ctx, x, y) => {
    drawNoise(ctx, x, y, [60, 60, 60], 30);
    // 一些浅灰色斑点
    for (let i = 0; i < 8; i++) {
      const px = (Math.random() * 14) | 0;
      const py = (Math.random() * 14) | 0;
      drawPixelRect(ctx, x + px, y + py, 2, 2, '#555');
    }
  });

  // 1,0 - 草顶（绿色）
  drawTile(ctx, 1, 0, (ctx, x, y) => {
    drawNoise(ctx, x, y, [76, 153, 0], 25);
    // 几个深色点
    for (let i = 0; i < 6; i++) {
      const px = (Math.random() * 14) | 0;
      const py = (Math.random() * 14) | 0;
      drawPixelRect(ctx, x + px, y + py, 2, 1, '#3a7a00');
    }
  });

  // 2,0 - 草侧面（上绿下棕）
  drawTile(ctx, 2, 0, (ctx, x, y) => {
    // 上部绿色（3像素）
    for (let py = 0; py < 3; py++) {
      for (let px = 0; px < TILE_SIZE; px++) {
        const v = (Math.random() - 0.5) * 20;
        ctx.fillStyle = `rgb(${76 + v|0},${153 + v|0},${v|0})`;
        ctx.fillRect(x + px, y + py, 1, 1);
      }
    }
    // 过渡
    for (let px = 0; px < TILE_SIZE; px++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#4c9900' : '#8B6914';
      ctx.fillRect(x + px, y + 3, 1, 1);
    }
    // 下部棕色
    for (let py = 4; py < TILE_SIZE; py++) {
      for (let px = 0; px < TILE_SIZE; px++) {
        const v = (Math.random() - 0.5) * 15;
        ctx.fillStyle = `rgb(${139 + v|0},${105 + v|0},${20 + v|0})`;
        ctx.fillRect(x + px, y + py, 1, 1);
      }
    }
  });

  // 3,0 - 干土地（全棕色）
  drawTile(ctx, 3, 0, (ctx, x, y) => {
    drawNoise(ctx, x, y, [139, 105, 20], 15);
  });

  // 4,0 - 木头顶/底（年轮）
  drawTile(ctx, 4, 0, (ctx, x, y) => {
    drawNoise(ctx, x, y, [160, 120, 60], 10);
    // 简单年轮
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + 8, y + 8, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 8, y + 8, 6, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 5,0 - 木头侧面（树皮）
  drawTile(ctx, 5, 0, (ctx, x, y) => {
    drawNoise(ctx, x, y, [120, 80, 30], 15);
    // 竖向纹理线
    for (let lx = 0; lx < TILE_SIZE; lx += 3) {
      for (let ly = 0; ly < TILE_SIZE; ly++) {
        if (Math.random() > 0.3) {
          ctx.fillStyle = `rgb(${100 + (Math.random() * 20)|0},${65 + (Math.random() * 15)|0},${20})`;
          ctx.fillRect(x + lx, y + ly, 1, 1);
        }
      }
    }
  });

  // 6,0 - 水方块（发光蓝色）
  drawTile(ctx, 6, 0, (ctx, x, y) => {
    drawNoise(ctx, x, y, [50, 150, 255], 30);
    // 中心高光
    drawPixelRect(ctx, x + 5, y + 5, 6, 6, 'rgba(200,230,255,0.6)');
    drawPixelRect(ctx, x + 6, y + 6, 4, 4, 'rgba(230,245,255,0.8)');
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 获取UV坐标（返回 [u0, v0, u1, v1]）
export function getTileUV(col: number, row: number): [number, number, number, number] {
  const u0 = col / ATLAS_TILES;
  const v0 = 1 - (row + 1) / ATLAS_TILES;
  const u1 = (col + 1) / ATLAS_TILES;
  const v1 = 1 - row / ATLAS_TILES;
  return [u0, v0, u1, v1];
}
