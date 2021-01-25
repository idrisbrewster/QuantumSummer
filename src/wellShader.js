import {createSculptureWithGeometry} from './shader-park-core.esm.js';
import {
    BoxBufferGeometry,
    MeshBasicMaterial,
    SphereBufferGeometry,
    MeshStandardMaterial,
    Mesh,
  } from "three";



export function createWellShader(params) {
    let spCode = `
    let n1Scale = 300
    let width = .1
    let height = 1
    let offset = .001
    let start = 100.;
    
    let size = max(n1Scale * abs(sin(time*.01)), 300);
    let m = vec3(0, -1*time*8 + start, 0);
    let n = noise(getRayDirection() * size + m);
    let col = pow(abs(n), 3);
    n = abs(n);
    color(vec3(0, 1, col)+normal*.5)
    cylinder(width, height*n);
    
    difference();
    cylinder(width-offset, height);
    
    `;
    const geometry = new BoxBufferGeometry(1.3, 10, 1.3);
    // const mat = new MeshStandardMaterial();
    // const mesh = new Mesh(geometry, mat);
    const mesh = createSculptureWithGeometry(geometry, spCode, () => ({
        'time': params.time,
    }));
    return mesh;
}
