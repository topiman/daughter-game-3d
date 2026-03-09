# P1 测试用例

## 一、可自动化（单元测试）

### 1. 天气系统 (WeatherSystem)
| 用例 | 预期结果 |
|------|----------|
| 初始天气为 clear | currentWeather === 'clear' |
| startRain 后天气为 rain | currentWeather === 'rain' |
| startSnow 后天气为 snow | currentWeather === 'snow' |
| stopWeather 后天气为 clear | currentWeather === 'clear' |
| 天气触发概率约 30% | 跑1000次，触发次数在200-400之间 |
| 天气持续时间到后自动停止 | 超过 WEATHER_DURATION 后 currentWeather === 'clear' |

### 2. 家具交互 (FurnitureSystem)
| 用例 | 预期结果 |
|------|----------|
| 夜晚使用床 → 跳过夜晚 | success=true, action='skip_night' |
| 白天使用床 → 失败 | success=false, message 提示白天不能睡 |
| 使用床恢复 20% HP | HP 从 50 → 70 |
| 使用床 HP 不超过上限 | HP 从 90 → 100（不是110） |
| 使用沙发 → 减缓饥饿 | success=true, action='rest' |
| 使用马桶 → 趣味效果 | success=true, action='toilet' |

### 3. 小狗 (Dog)
| 用例 | 预期结果 |
|------|----------|
| 小狗跟随玩家保持距离 | 距离在 DOG_FOLLOW_DIST ± 1 范围内 |
| 变异人在 8 格内 → 吠叫 | isBarking === true |
| 变异人在 8 格外 → 不吠叫 | isBarking === false |
| 无变异人 → 不吠叫 | isBarking === false |

### 4. 音频系统 (AudioSystem)
| 用例 | 预期结果 |
|------|----------|
| 初始化不报错 | audioCtx 状态正常 |
| setBGMVolume(0.5) 生效 | bgmGain.value === 0.5 |
| setBGMVolume 限制 0-1 | 传入1.5 → 1.0, 传入-1 → 0 |
| setSFXVolume 同上 | 同上 |

### 5. 照明系统 (LightingSystem)
| 用例 | 预期结果 |
|------|----------|
| 添加路灯 → 光照范围 5 格 | isInLight(灯+4, y, z) === true |
| 路灯光照边界外 | isInLight(灯+6, y, z) === false |
| 小夜灯 → 光照范围 3 格 | isInLight(灯+2, y, z) === true |
| 小夜灯边界外 | isInLight(灯+4, y, z) === false |
| 移除灯 → 光照消失 | removeLight 后 isInLight === false |
| 变异人不在光照区生成 | SpawnSystem 检查 isInLight 跳过 |

### 6. 帐篷
| 用例 | 预期结果 |
|------|----------|
| 玩家在帐篷内 | isTentArea === true |
| 玩家在帐篷外 | isTentArea === false |
| 帐篷内变异人不主动攻击 | mutant.canAttack === false（当目标在帐篷内） |

### 7. 收纳家具 (StorageSystem)
| 用例 | 预期结果 |
|------|----------|
| 打开鞋柜 → 返回 4 格 | slots.length === 4 |
| 打开衣柜 → 返回 4 格 | slots.length === 4 |
| 添加物品到收纳 | addToStorage 成功 |
| 收纳满了添加失败 | 第5个物品 addToStorage === false |
| 取出物品 | removeFromStorage 返回正确物品 |
| 打开不存在的收纳 | openStorage === null |

### 8. 新增 BlockType 完整性
| 用例 | 预期结果 |
|------|----------|
| 所有新 BlockType 有纹理 | BLOCK_UVS[type] 存在 |
| 所有新物品有 icon/iconColor | 字段不为空 |
| 所有新物品有正确 category | 家具=FURNITURE |
| 新物品在水方块掉落池中 | weight > 0 的物品在 getRandomItem 池里 |

### 9. 配置完整性
| 用例 | 预期结果 |
|------|----------|
| 所有新增 CONFIG 项存在 | 不为 undefined |
| 数值合理 | BED_HP_RESTORE > 0 且 ≤ 100, LAMP_RADIUS > 0 等 |

---

## 二、人工验收（不可自动化）

| # | 验收项 | 检查方式 |
|---|--------|----------|
| 1 | 太阳/月亮可见且运动轨迹合理 | 目测 |
| 2 | 黄昏/黎明颜色过渡自然 | 目测 |
| 3 | 雨滴/雪花粒子视觉效果可爱 | 目测 |
| 4 | 小狗外观可爱（方块风格） | 目测 |
| 5 | 吠叫提示明显 | 目测 |
| 6 | BGM 风格轻快可爱（8-bit） | 听 |
| 7 | 各音效可辨识、不刺耳 | 听 |
| 8 | 路灯/小夜灯发光视觉效果 | 目测 |
| 9 | 帐篷外观合理 | 目测 |
| 10 | 收纳 UI 操作方便 | 试玩 |
| 11 | 音量滑块操作正常 | 试玩 |
| 12 | 马桶趣味动画好玩 | 试玩 |
