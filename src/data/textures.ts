// Canvas API 生成纹理图集 — 不依赖外部图片
import * as THREE from 'three';
import { BlockType } from './items';

const TILE_SIZE = 16;
const ATLAS_TILES = 8; // 8x8 grid — 64 tiles max
const ATLAS_SIZE = TILE_SIZE * ATLAS_TILES;

// 纹理在图集中的位置 [col, row]
// 每个方块有 top, side, bottom 三种面
export const BLOCK_UVS: Record<number, { top: [number, number]; side: [number, number]; bottom: [number, number] }> = {
  [BlockType.BEDROCK]: { top: [0, 0], side: [0, 0], bottom: [0, 0] },
  [BlockType.GRASS]:   { top: [1, 0], side: [2, 0], bottom: [3, 0] },
  [BlockType.DIRT]:    { top: [3, 0], side: [3, 0], bottom: [3, 0] },
  [BlockType.WOOD]:    { top: [4, 0], side: [5, 0], bottom: [4, 0] },
  [BlockType.WATER_BLOCK]: { top: [6, 0], side: [6, 0], bottom: [6, 0] },
  [BlockType.BED]:   { top: [7, 0], side: [7, 1], bottom: [3, 0] },
  [BlockType.SOFA]:  { top: [0, 1], side: [1, 1], bottom: [3, 0] },
  [BlockType.TOILET]:      { top: [2, 1], side: [3, 1], bottom: [3, 0] },
  [BlockType.LAMP]:        { top: [4, 1], side: [5, 1], bottom: [3, 0] },
  [BlockType.NIGHTLIGHT]:  { top: [6, 1], side: [6, 1], bottom: [3, 0] },
  [BlockType.TENT]:        { top: [7, 2], side: [0, 2], bottom: [3, 0] },
  [BlockType.SHOE_CABINET]:{ top: [1, 2], side: [2, 2], bottom: [3, 0] },
  [BlockType.WARDROBE]:    { top: [3, 2], side: [4, 2], bottom: [3, 0] },
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

  // 7,0 - 床顶面（白色枕头+红色被子）
  drawTile(ctx, 7, 0, (ctx, x, y) => {
    // 被子（红色）
    drawNoise(ctx, x, y, [200, 60, 60], 15);
    // 枕头（白色，左上角）
    drawPixelRect(ctx, x + 1, y + 1, 6, 4, '#fff');
    drawPixelRect(ctx, x + 2, y + 2, 4, 2, '#eee');
    // 被子折痕
    for (let px = 0; px < TILE_SIZE; px++) {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(x + px, y + 8, 1, 1);
    }
  });

  // 7,1 - 床侧面（木框+红色）
  drawTile(ctx, 7, 1, (ctx, x, y) => {
    // 上部红色（被子侧面）
    for (let py = 0; py < 10; py++) {
      for (let px = 0; px < TILE_SIZE; px++) {
        const v = (Math.random() - 0.5) * 10;
        ctx.fillStyle = `rgb(${180 + v|0},${50 + v|0},${50 + v|0})`;
        ctx.fillRect(x + px, y + py, 1, 1);
      }
    }
    // 下部木框
    for (let py = 10; py < TILE_SIZE; py++) {
      for (let px = 0; px < TILE_SIZE; px++) {
        const v = (Math.random() - 0.5) * 10;
        ctx.fillStyle = `rgb(${160 + v|0},${120 + v|0},${60 + v|0})`;
        ctx.fillRect(x + px, y + py, 1, 1);
      }
    }
    // 木框边线
    drawPixelRect(ctx, x, y + 10, TILE_SIZE, 1, '#8B6914');
  });

  // 0,1 - 沙发顶面（蓝绿色坐垫）
  drawTile(ctx, 0, 1, (ctx, x, y) => {
    drawNoise(ctx, x, y, [70, 150, 160], 15);
    // 坐垫缝线
    drawPixelRect(ctx, x + 7, y, 2, TILE_SIZE, 'rgba(0,0,0,0.15)');
    // 扶手
    drawPixelRect(ctx, x, y, 2, TILE_SIZE, '#4a9ea8');
    drawPixelRect(ctx, x + 14, y, 2, TILE_SIZE, '#4a9ea8');
  });

  // 1,1 - 沙发侧面（蓝绿色+木腿）
  drawTile(ctx, 1, 1, (ctx, x, y) => {
    // 靠背（上部深色）
    for (let py = 0; py < 5; py++) {
      for (let px = 0; px < TILE_SIZE; px++) {
        const v = (Math.random() - 0.5) * 10;
        ctx.fillStyle = `rgb(${50 + v|0},${120 + v|0},${130 + v|0})`;
        ctx.fillRect(x + px, y + py, 1, 1);
      }
    }
    // 坐垫
    for (let py = 5; py < 12; py++) {
      for (let px = 0; px < TILE_SIZE; px++) {
        const v = (Math.random() - 0.5) * 10;
        ctx.fillStyle = `rgb(${70 + v|0},${150 + v|0},${160 + v|0})`;
        ctx.fillRect(x + px, y + py, 1, 1);
      }
    }
    // 木腿
    drawPixelRect(ctx, x + 1, y + 12, 2, 4, '#8B6914');
    drawPixelRect(ctx, x + 13, y + 12, 2, 4, '#8B6914');
    // 底部空隙
    for (let py = 12; py < TILE_SIZE; py++) {
      for (let px = 3; px < 13; px++) {
        ctx.fillStyle = '#000';
        ctx.fillRect(x + px, y + py, 1, 1);
      }
    }
  });

  // 2,1 - 马桶顶面（白色瓷器+水）
  drawTile(ctx, 2, 1, (ctx, x, y) => {
    drawNoise(ctx, x, y, [230, 230, 235], 8);
    // 水面
    drawPixelRect(ctx, x + 4, y + 4, 8, 8, '#aaddff');
    drawPixelRect(ctx, x + 5, y + 5, 6, 6, '#88ccee');
  });

  // 3,1 - 马桶侧面（白色+底座）
  drawTile(ctx, 3, 1, (ctx, x, y) => {
    drawNoise(ctx, x, y, [230, 230, 235], 8);
    drawPixelRect(ctx, x, y + 12, TILE_SIZE, 4, '#ddd');
    drawPixelRect(ctx, x + 2, y + 0, 12, 3, '#eee'); // 水箱
  });

  // 4,1 - 路灯顶面（发光黄色）
  drawTile(ctx, 4, 1, (ctx, x, y) => {
    drawNoise(ctx, x, y, [255, 200, 50], 20);
    drawPixelRect(ctx, x + 5, y + 5, 6, 6, '#fff8dc');
  });

  // 5,1 - 路灯侧面（灯杆+灯罩）
  drawTile(ctx, 5, 1, (ctx, x, y) => {
    // 灯罩（上部，暖黄色）
    for (let py = 0; py < 6; py++) {
      for (let px = 2; px < 14; px++) {
        const v = (Math.random() - 0.5) * 15;
        ctx.fillStyle = `rgb(${255},${200 + v|0},${50 + v|0})`;
        ctx.fillRect(x + px, y + py, 1, 1);
      }
    }
    // 灯杆（下部，深灰色）
    drawPixelRect(ctx, x + 6, y + 6, 4, 10, '#555');
    drawPixelRect(ctx, x + 7, y + 7, 2, 9, '#666');
  });

  // 6,1 - 小夜灯（柔白发光）
  drawTile(ctx, 6, 1, (ctx, x, y) => {
    drawNoise(ctx, x, y, [255, 240, 220], 10);
    // 中心发光
    drawPixelRect(ctx, x + 4, y + 3, 8, 10, '#fff8e8');
    drawPixelRect(ctx, x + 5, y + 4, 6, 8, '#fffff0');
  });

  // 7,2 - 帐篷顶面（橙棕色三角帆布）
  drawTile(ctx, 7, 2, (ctx, x, y) => {
    drawNoise(ctx, x, y, [210, 140, 60], 15);
    // 交叉线
    for (let i = 0; i < TILE_SIZE; i++) {
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(x + i, y + i, 1, 1);
      ctx.fillRect(x + TILE_SIZE - 1 - i, y + i, 1, 1);
    }
  });

  // 0,2 - 帐篷侧面（三角形帆布）
  drawTile(ctx, 0, 2, (ctx, x, y) => {
    drawNoise(ctx, x, y, [190, 120, 50], 15);
    // 入口（深色倒三角）
    for (let py = 4; py < TILE_SIZE; py++) {
      const w = Math.floor((py - 4) * 0.8);
      drawPixelRect(ctx, x + 8 - w, y + py, w * 2, 1, '#2a1a0a');
    }
  });

  // 1,2 - 鞋柜顶面（木色）
  drawTile(ctx, 1, 2, (ctx, x, y) => {
    drawNoise(ctx, x, y, [160, 120, 70], 12);
  });

  // 2,2 - 鞋柜侧面（木色+格子）
  drawTile(ctx, 2, 2, (ctx, x, y) => {
    drawNoise(ctx, x, y, [140, 100, 55], 12);
    // 格子隔板
    drawPixelRect(ctx, x, y + 7, TILE_SIZE, 1, '#8B6914');
    drawPixelRect(ctx, x + 7, y, 1, TILE_SIZE, '#8B6914');
    // 把手
    drawPixelRect(ctx, x + 12, y + 3, 2, 2, '#aaa');
    drawPixelRect(ctx, x + 12, y + 11, 2, 2, '#aaa');
  });

  // 3,2 - 衣柜顶面（深木色）
  drawTile(ctx, 3, 2, (ctx, x, y) => {
    drawNoise(ctx, x, y, [110, 70, 40], 10);
  });

  // 4,2 - 衣柜侧面（深木色+门）
  drawTile(ctx, 4, 2, (ctx, x, y) => {
    drawNoise(ctx, x, y, [100, 60, 30], 10);
    // 门缝
    drawPixelRect(ctx, x + 7, y + 1, 1, 14, '#3a2210');
    // 把手
    drawPixelRect(ctx, x + 5, y + 7, 2, 2, '#c0a060');
    drawPixelRect(ctx, x + 9, y + 7, 2, 2, '#c0a060');
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
