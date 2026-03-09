// Greedy Meshing 实现 — 合并相邻同类面，减少 draw call
import * as THREE from 'three';
import { VoxelWorld } from './VoxelWorld';
import { BlockType } from '../data/items';
import { BLOCK_UVS, getTileUV } from '../data/textures';

// 六个面方向：右左上下前后
const FACES = [
  { dir: [1, 0, 0], corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], uvFace: 'side' as const },   // +X
  { dir: [-1, 0, 0], corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], uvFace: 'side' as const },  // -X
  { dir: [0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], uvFace: 'top' as const },    // +Y
  { dir: [0, -1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], uvFace: 'bottom' as const },// -Y
  { dir: [0, 0, 1], corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], uvFace: 'side' as const },   // +Z
  { dir: [0, 0, -1], corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]], uvFace: 'side' as const },  // -Z
];

export class ChunkMesher {
  // 生成整个世界的 mesh（Greedy Meshing 简化版：面合并）
  static buildMesh(world: VoxelWorld, material: THREE.Material): THREE.Mesh {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    let vertexCount = 0;

    for (let y = 0; y < world.height; y++) {
      for (let z = 0; z < world.depth; z++) {
        for (let x = 0; x < world.width; x++) {
          const block = world.getBlock(x, y, z);
          if (block === BlockType.AIR) continue;

          const blockUV = BLOCK_UVS[block];
          if (!blockUV) continue;

          for (const face of FACES) {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];

            // 只在相邻方块为空（或出界）时绘制该面
            const neighbor = world.getBlock(nx, ny, nz);
            if (neighbor !== BlockType.AIR) continue;

            const uvPos = blockUV[face.uvFace];
            const [u0, v0, u1, v1] = getTileUV(uvPos[0], uvPos[1]);

            // 添加4个顶点
            for (const corner of face.corners) {
              positions.push(x + corner[0], y + corner[1], z + corner[2]);
              normals.push(face.dir[0], face.dir[1], face.dir[2]);
            }

            // UV
            uvs.push(u0, v0, u1, v0, u1, v1, u0, v1);

            // 两个三角形
            indices.push(
              vertexCount, vertexCount + 1, vertexCount + 2,
              vertexCount, vertexCount + 2, vertexCount + 3
            );
            vertexCount += 4;
          }
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    return new THREE.Mesh(geometry, material);
  }

  // Greedy Meshing — 按面方向合并同类型方块的面
  static buildGreedyMesh(world: VoxelWorld, material: THREE.Material): THREE.Mesh {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    let vertexCount = 0;

    // 对每个面方向做 greedy meshing
    for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
      const face = FACES[faceIdx];
      const [dx, dy, dz] = face.dir;

      // 确定扫描方向
      // 主轴是 face.dir 指向的轴
      // 另外两个轴是我们要合并的面
      let d: number, u_axis: number, v_axis: number;
      if (dx !== 0) { d = 0; u_axis = 2; v_axis = 1; }
      else if (dy !== 0) { d = 1; u_axis = 0; v_axis = 2; }
      else { d = 2; u_axis = 0; v_axis = 1; }

      const dims = [world.width, world.height, world.depth];
      const q = [0, 0, 0];
      q[d] = face.dir[d];

      // 扫描每个切片
      for (let slice = 0; slice < dims[d]; slice++) {
        // 构建 mask: 在这个切片上，每个位置是否需要渲染面
        const maskW = dims[u_axis];
        const maskH = dims[v_axis];
        const mask: (BlockType | 0)[] = new Array(maskW * maskH).fill(0);

        for (let v = 0; v < maskH; v++) {
          for (let u = 0; u < maskW; u++) {
            const pos = [0, 0, 0];
            pos[d] = slice;
            pos[u_axis] = u;
            pos[v_axis] = v;

            const block = world.getBlock(pos[0], pos[1], pos[2]);
            if (block === BlockType.AIR) continue;

            const npos = [pos[0] + q[0], pos[1] + q[1], pos[2] + q[2]];
            const neighbor = world.getBlock(npos[0], npos[1], npos[2]);
            if (neighbor === BlockType.AIR) {
              mask[v * maskW + u] = block;
            }
          }
        }

        // Greedy merge
        for (let v = 0; v < maskH; v++) {
          for (let u = 0; u < maskW; ) {
            const blockType = mask[v * maskW + u];
            if (blockType === 0) { u++; continue; }

            // 向右扩展
            let w = 1;
            while (u + w < maskW && mask[v * maskW + u + w] === blockType) w++;

            // 向上扩展
            let h = 1;
            let canExtend = true;
            while (v + h < maskH && canExtend) {
              for (let k = 0; k < w; k++) {
                if (mask[(v + h) * maskW + u + k] !== blockType) {
                  canExtend = false;
                  break;
                }
              }
              if (canExtend) h++;
            }

            // 清除已合并区域
            for (let dv = 0; dv < h; dv++) {
              for (let du = 0; du < w; du++) {
                mask[(v + dv) * maskW + u + du] = 0;
              }
            }

            // 生成面片
            const blockUV = BLOCK_UVS[blockType];
            if (!blockUV) { u += w; continue; }
            const uvPos = blockUV[face.uvFace];
            const [tu0, tv0, tu1, tv1] = getTileUV(uvPos[0], uvPos[1]);

            // 四个角的世界坐标
            const pos = [0, 0, 0];
            pos[d] = slice;
            pos[u_axis] = u;
            pos[v_axis] = v;

            // 根据面方向偏移到正确侧
            const offset = face.dir[d] > 0 ? 1 : 0;
            
            const du_vec = [0, 0, 0];
            const dv_vec = [0, 0, 0];
            du_vec[u_axis] = w;
            dv_vec[v_axis] = h;

            const x0 = pos[0] + (d === 0 ? offset : 0);
            const y0 = pos[1] + (d === 1 ? offset : 0);
            const z0 = pos[2] + (d === 2 ? offset : 0);

            // 根据面方向确定顶点顺序（保证法线朝外）
            let corners: number[][];
            if (face.dir[d] > 0) {
              corners = [
                [x0, y0, z0],
                [x0 + du_vec[0], y0 + du_vec[1], z0 + du_vec[2]],
                [x0 + du_vec[0] + dv_vec[0], y0 + du_vec[1] + dv_vec[1], z0 + du_vec[2] + dv_vec[2]],
                [x0 + dv_vec[0], y0 + dv_vec[1], z0 + dv_vec[2]],
              ];
            } else {
              corners = [
                [x0 + du_vec[0], y0 + du_vec[1], z0 + du_vec[2]],
                [x0, y0, z0],
                [x0 + dv_vec[0], y0 + dv_vec[1], z0 + dv_vec[2]],
                [x0 + du_vec[0] + dv_vec[0], y0 + du_vec[1] + dv_vec[1], z0 + du_vec[2] + dv_vec[2]],
              ];
            }

            for (const c of corners) {
              positions.push(c[0], c[1], c[2]);
              normals.push(face.dir[0], face.dir[1], face.dir[2]);
            }

            // UV tiling
            const uRepeat = w;
            const vRepeat = h;
            const uSize = tu1 - tu0;
            const vSize = tv1 - tv0;
            
            if (face.dir[d] > 0) {
              uvs.push(tu0, tv0);
              uvs.push(tu0 + uSize * uRepeat, tv0);
              uvs.push(tu0 + uSize * uRepeat, tv0 + vSize * vRepeat);
              uvs.push(tu0, tv0 + vSize * vRepeat);
            } else {
              uvs.push(tu0 + uSize * uRepeat, tv0);
              uvs.push(tu0, tv0);
              uvs.push(tu0, tv0 + vSize * vRepeat);
              uvs.push(tu0 + uSize * uRepeat, tv0 + vSize * vRepeat);
            }

            indices.push(
              vertexCount, vertexCount + 1, vertexCount + 2,
              vertexCount, vertexCount + 2, vertexCount + 3
            );
            vertexCount += 4;

            u += w;
          }
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    return new THREE.Mesh(geometry, material);
  }
}
