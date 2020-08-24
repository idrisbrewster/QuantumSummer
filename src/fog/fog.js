import {
    SphereBufferGeometry,
    BoxBufferGeometry,
    MeshBasicMaterial,
    Color,
    UniformsUtils,
    Mesh,
    BackSide,
    Vector2,
    Vector3
  } from "three";

import { fogParsVert, fogVert, fogParsFrag, fogFrag } from "./fogReplace.js";
import {fogParams} from '../helpers.js';

const geometry = new SphereBufferGeometry(400, 100, 100);
geometry.rotateX(Math.PI/2);
geometry.rotateZ(Math.PI/2);
// const geometry = new BoxBufferGeometry( 1, 1, 1 )
window.geom = geometry;
let fogShader;

let container = document.querySelector(".container");
let fogMesh = new Mesh( geometry,
    new MeshBasicMaterial({ color: new Color(0xefd1b5), side: BackSide, depthWrite: true }));
fogMesh.position.set(15, -50, 75);
fogMesh.material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace(
        `#include <fog_pars_vertex>`,
        fogParsVert
    );
    shader.vertexShader = shader.vertexShader.replace(
        `#include <fog_vertex>`,
        fogVert
    );
    shader.fragmentShader = shader.fragmentShader.replace(
        `#include <fog_pars_fragment>`,
        fogParsFrag
    );
    shader.fragmentShader = shader.fragmentShader.replace(
        `#include <fog_fragment>`,
        fogFrag
    );

    const uniforms = ({
        fogNearColor: { value: new Color(fogParams.fogNearColor) },
        fogNoiseFreq: { value: fogParams.fogNoiseFreq },
        fogNoiseSpeed: { value: fogParams.fogNoiseSpeed },
        fogNoiseImpact: { value: fogParams.fogNoiseImpact },
        time: { value: .25 },
        iMouse:  { value: new Vector2(.5, .5) },
        iResolution: { value:  new Vector3(container.clientWidth, container.clientHeight, 1) }
    });

    shader.uniforms = UniformsUtils.merge([shader.uniforms, uniforms]);
    fogShader = shader;
}
export {fogMesh, fogShader};