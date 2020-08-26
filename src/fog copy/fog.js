import {
    SphereBufferGeometry,
    MeshBasicMaterial,
    Color,
    UniformsUtils,
    Mesh,
    BackSide
  } from "three";

import { fogParsVert, fogVert, fogParsFrag, fogFrag } from "./fogReplace.js";
import {fogParams} from '../helpers.js';

const geometry = new SphereBufferGeometry(150, 100, 100);

let fogShader;

let fogMesh = new Mesh( geometry,
    new MeshBasicMaterial({ color: new Color(0xefd1b5), side: BackSide, }));
// fogMesh.position.set(0, 0, 0);
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
        time: { value: 0 }
    });

    shader.uniforms = UniformsUtils.merge([shader.uniforms, uniforms]);
    fogShader = shader;
}

export {fogMesh, fogShader};