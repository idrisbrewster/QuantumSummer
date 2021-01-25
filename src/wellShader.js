import {createSculptureWithGeometry} from './shader-park-core.esm.js';
import {
    CylinderBufferGeometry
  } from "three";



export function createWellShader(params) {
    let spCode = `
    let n1Scale = 300;
    let width = .1;
    let coneAngle = .1;
    setStepSize(.99);
        
    let size = max(n1Scale * abs(sin(time*.01)), 2800);
    let s = getSpace();
    
    let movement = vec3(cos(time * .1) * 3, -1 * time * 5, sin(time * .1) * 3);
    let n = noise(getRayDirection() * size * .1 + movement);
    let baseCol = vec3(153/255, 190/255, 197/255);
    let col = pow(n, 2) + baseCol;
    color(col);
    noLighting();
    displace(0, -.2, 0);
    cylinder(width + s.y * coneAngle + n * .2, n * 1);
    
    `;
    const geometry = new CylinderBufferGeometry( 8, .88, 40, 32 );
    const mesh = createSculptureWithGeometry(geometry, spCode, () => ({
        'time': params.time,
    }));
    return mesh;
}
