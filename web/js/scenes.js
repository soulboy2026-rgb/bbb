// Scene registry: timeline scene id → draw function, plus chapter labels.

import { hook, title, laureate, ghost, couriers, bigdoor } from "./scenes-a.js";
import { build, detect, discover, why, future, outro } from "./scenes-b.js";

export const SCENES = { hook, title, laureate, ghost, couriers, bigdoor, build, detect, discover, why, future, outro };

export const CHAPTERS = {
  laureate: "01 获奖的是谁",
  ghost: "02 幽灵粒子",
  couriers: "03 为什么要抓它",
  bigdoor: "04 疯狂的点子",
  build: "05 建造冰立方",
  detect: "06 怎么抓幽灵",
  discover: "07 重大发现",
  why: "08 厉害在哪",
  future: "09 未来",
};
