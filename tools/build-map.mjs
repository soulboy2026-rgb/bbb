// Sample the Natural Earth land polygons (world-atlas) on a lon/lat grid and
// write the land points used by the dotted globe and flat map.
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";

const STEP = 2; // degrees
const topo = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/land-110m.json", import.meta.url)));
const land = feature(topo, topo.objects.land);

// geoContains works on the sphere, so Antarctica (whose ring wraps the pole) is handled correctly.
const dots = [];
for (let lat = -89; lat <= 89; lat += STEP) {
  for (let lon = -179; lon <= 179; lon += STEP) {
    if (geoContains(land, [lon, lat])) dots.push([lon, lat]);
  }
}
writeFileSync(new URL("../web/data/land-dots.json", import.meta.url), JSON.stringify(dots));
console.log(`wrote ${dots.length} land dots`);
