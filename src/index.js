import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  MeshStandardMaterial,
  Mesh,
  Color,
  SphereBufferGeometry,
  HemisphereLight,
  DirectionalLight,
  DirectionalLightHelper,
  ShaderMaterial,
  sRGBEncoding,
  ACESFilmicToneMapping,
  PMREMGenerator,
  AnimationMixer,
  Vector3,
  FogExp2,
  Clock,
  AudioListener,
  AudioAnalyser,
  DoubleSide,
  MeshBasicMaterial,
  AdditiveBlending,
  BackSide,
  Vector2
} from "three";

import 'regenerator-runtime/runtime'
//TODO: Remove THREE import on production
import * as THREE from 'three';
window.THREE = THREE;

import * as dat from 'dat.gui';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';

import {fogMesh, fogShader} from './fog/fog.js';
import {initWater} from './water.js';

import {asyncLoadAudio} from './loadAudio.js';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { promisifyLoader, getGLTFPosition, lerp, fogParams, params, audioParams, waterParams } from './helpers.js';
import {ActivationSite} from "./ActivationSite.js";

import fragmentShader from "./shaders/starsfragment.glsl";
import vertexShader from "./shaders/vertex.glsl";

const modelFolderNames = ['house2', 'island1', 'well2', 'ship2', 'tree2'];
// const modelFolderNames = ['house_old', 'island_old', 'well_old', 'ship_old', 'tree_old'];
const modelPath = './models/';
const audioPath = './models/audio/';
const audioTrackNames = ['house', 'ship'];
const GLTFPromiseLoader = promisifyLoader( new GLTFLoader() );

const debug = true;

let container, scene, camera, renderer, controls, gui, clock;
let animationTime;
let time;
let water;
let activationSites;

let audioListener;





function init() {
  animationTime = 0;
  time = 0;
  activationSites = [];
  window.activationSite = activationSites;
  clock = new Clock(true);

  container = document.querySelector(".container");
  scene = new Scene();
  
  if(debug) {
    window.scene = scene;
  }
  
  loadGLTFs();
  createCamera();
  createLights();
  createRenderer();
  createSkyBox();
  
  
  
  initGui();
  // console.log(skyFogShader)
  // scene.add(fogMesh);
  
  water = initWater();
  scene.add(water);

  let pmremGenerator = new PMREMGenerator( renderer );
  pmremGenerator.compileEquirectangularShader();
  scene.environment = pmremGenerator.fromScene( fogMesh ).texture;

  createControls();
  // scene.background = new Color("skyblue");
  scene.background = new Color(fogParams.fogHorizonColor);
  scene.fog = new FogExp2(fogParams.fogHorizonColor, fogParams.fogDensity);

  renderer.setAnimationLoop(() => {
    update();
    render();
  });
}

function initAudioTracks() {
  audioListener = new AudioListener();
  camera.add(audioListener);
  for(let name of audioTrackNames) {
    let path = `${audioPath}${name}.wav`;
    asyncLoadAudio(audioListener, path).then((audio) => {
      audio.setLoop( true );
      audio.setRefDistance(5);
      let site = activationSites.filter(site => site.name.includes(name));
      if(site && site.length) {
        site = site[0];
        site.audio = audio;
        site.audioAnalyser = new AudioAnalyser(audio, audioParams.fftSize);
        site.gltfScene.add(audio);
      }
    });
  }
}

function createSkyBox() {
  // let pmremGenerator = new PMREMGenerator( renderer );
  // pmremGenerator.compileEquirectangularShader();
  const geometry = new SphereBufferGeometry(500, 100, 100);
  geometry.rotateX(Math.PI/2);
  geometry.rotateZ(Math.PI/2);
  const material = createSkyMaterial();
  const mesh = new Mesh(geometry, material);
  
  mesh.position.set(15, -50, 75);
  mesh.name = 'sky';
  scene.add(mesh);
}

function loadGLTFs() {
  modelFolderNames.forEach(folderName => {
    let filePath = `${modelPath}${folderName}/scene.gltf`;
    // let filePath = `${modelPath}${folderName}/scene.glb`;
    GLTFPromiseLoader.load( filePath )
    .then((loadedObject) => {
      
      let gltfScene = loadedObject.scene;
      gltfScene.name = folderName;
      // if(name.includes('island')){
      //   gltfScene.receiveShadow = true;
      //   loadedObject.receiveShadow = true;
      // }
      let position = getGLTFPosition(gltfScene);
      console.log(gltfScene, loadedObject, position);
      scene.add(gltfScene);
      gltfScene.traverse( function ( node ) {
        if ( node.isMesh || node.isLight ) node.castShadow = true;
      } );
      

      let mixer = new AnimationMixer( gltfScene );
      

      let activationSite = new ActivationSite(position,loadedObject, gltfScene, mixer, null, false);
      activationSites.push(activationSite);
      createGeometries(position);
    })
    .catch( (err) => console.error( err ) );
  });
}



function initGui() {

  gui = new dat.GUI();
  window.gui = gui;
  document.querySelector('.dg').style.zIndex = 99; //fig dat.gui hidden
  gui.add(params, 'activationDistance', 0.0, 100.0);
  gui.add(params, 'useOrbitControls').onChange(() => {
    createControls();
  });
  let fogFolder = gui.addFolder('Fog');
  fogFolder.add(fogParams, "fogDensity", 0, 0.01).onChange(function() {
    scene.fog.density = fogParams.fogDensity;
  }).listen();
  fogFolder.addColor(fogParams, "fogHorizonColor").onChange(function() {
    scene.fog.color.set(fogParams.fogHorizonColor);
    scene.background = new Color(fogParams.fogHorizonColor);
  });
  fogFolder.addColor(fogParams, "fogNearColor").onChange(function() {
    fogShader.uniforms.fogNearColor = {
      value: new Color(fogParams.fogNearColor)
    };
  });
  fogFolder.add(fogParams, "fogNoiseFreq", 0, 0.01, 0.0012).onChange(function() {
    fogShader.uniforms.fogNoiseFreq.value = fogParams.fogNoiseFreq;
  });
  fogFolder.add(fogParams, "fogNoiseSpeed", 0, 1000, 100).onChange(function() {
    fogShader.uniforms.fogNoiseSpeed.value = fogParams.fogNoiseSpeed;
  });
  fogFolder.add(fogParams, "fogNoiseImpact", 0, 1).onChange(function() {
    fogShader.uniforms.fogNoiseImpact.value = fogParams.fogNoiseImpact;
  });


}

function createCamera() {
  const aspect = container.clientWidth / container.clientHeight;
  camera = new PerspectiveCamera(35, aspect, 0.1, 1000);
  if(debug) {
    window.camera = camera;
  }
  
  camera.position.set(-50, 6, 105);
}

function createLights() {
  const directionalLight = new DirectionalLight(0xffffff, 5);
  directionalLight.position.set(-50, 6, 105);

  const directionalLightHelper = new DirectionalLightHelper(directionalLight, 5);

  const hemisphereLight = new HemisphereLight(0xddeeff, 0x202020, 3);
  // hemisphereLight.castShadow = true;
  // scene.add(directionalLight, directionalLightHelper, hemisphereLight);
}

function createRenderer() {
  renderer = new WebGLRenderer({ antialias: true });
  if(debug) {
    window.render = renderer;
  }
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  // renderer.shadowMap.enabled = true;
  // renderer.shadowMap.type = PCFSoftShadowMap;

  // renderer.outputEncoding = sRGBEncoding;
  // renderer.toneMapping = ACESFilmicToneMapping;
  // renderer.toneMappingExposure = 1.0;
  renderer.physicallyCorrectLights = true;

  container.appendChild(renderer.domElement);
}

function createSkyMaterial() {
  //const material = new MeshStandardMaterial({ wireframe: true });
  const material = new ShaderMaterial({
    uniforms: {
      iTime: { value: 1.0 },
      iMouse: { value: new Vector2(.5, .5) },
      iResolution: { value: new THREE.Vector3(container.clientWidth, container.clientHeight, 1) }
    },
    blending: AdditiveBlending,
    transparent: true,
    // fog: true,
    fragmentShader: fragmentShader,
    vertexShader: vertexShader,
    side: BackSide,
  });

  return material;
}

function createGeometries(position) {
  const geometry = new SphereBufferGeometry(10, 30, 30);
  const material = new MeshBasicMaterial();
  // const material = createSkyMaterial();
  
  const mesh = new Mesh(geometry, material);
  mesh.position.set(position.x, position.y, position.z)
  scene.add(mesh);
}

function createControls() {
  if(controls) {
    controls.dispose();
  }
  if(params.useOrbitControls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target = new Vector3(15, 0, 75);
    controls.update();
  } else {
    controls = new FirstPersonControls(camera, renderer.domElement);
    // controls = new PointerLockControls(camera, renderer.domElement);
  }
  if(debug) {
    window.controls = controls;
  }
  /*
  controls = new PointerLockControls( camera, document.body );
  let blocker = document.getElementById( 'blocker' );
  let instructions = document.getElementById( 'instructions' );

  instructions.addEventListener( 'click', () => controls.lock(), false);

  controls.addEventListener( 'lock', () => {
    instructions.style.display = 'none';
    blocker.style.display = 'none';
  } );

  controls.addEventListener( 'unlock', () => {
    blocker.style.display = 'block';
    instructions.style.display = '';
  } );  
  scene.add(controls.getObject());
  */
}



function update() {
  animationTime = clock.getDelta();
  time += 0.01;
  activationSites.forEach(site => site.update(animationTime, camera.position, params.activationDistance));
  if(controls.update){
    controls.update(animationTime+.15);
  }
  let sky = scene.getObjectByName('sky');
  let avgFreq;
  activationSites.forEach(site => {
    if(site && site.audio && site.audio.isPlaying){
      avgFreq = site.audioAnalyser.getAverageFrequency();
      
    }
  });

  if(water) {
    water.material.uniforms.time.value += 1.0 / 60.0;
    water.material.uniforms.alpha.value = waterParams.alpha;
    water.material.uniforms.distortionScale.value = waterParams.distortionScale;
    water.material.uniforms.size.value = waterParams.size;
  }
  
  
  if(sky) {
    let mouse = sky.material.uniforms.iMouse.value;
    sky.material.uniforms.iTime.value = time;
    if(avgFreq){
      // if(scene.fog) {
      //   scene.fog.density = lerp(scene.fog.density, Math.max(.018 - avgFreq/10000), 0.98);
      // }
      
      sky.material.uniforms.iMouse.value = new Vector2(mouse.x, mouse.y+avgFreq/1000);
    }
    
    
    // sky.material.uniforms.iTime.value += .01 + avgFreq/1000;
  }
  if(fogShader) {
    fogShader.uniforms.time.value += 0.01;
    let mouse = fogShader.uniforms.iMouse.value;
    if(avgFreq){
      fogShader.uniforms.iMouse.value = new Vector2(mouse.x, mouse.y+avgFreq/1000);
    }
  }
  
}

function render() {
  renderer.render(scene, camera);
}

// we have to initialize the audio on a click action
let instructions = document.querySelector('.instructions');
let blocker = document.querySelector('.blocker');
console.log(instructions)
let loadPage = () => {
  console.log('click')
  initAudioTracks();
  instructions.removeEventListener('click', loadPage, false);
  instructions.removeEventListener('touch', loadPage, false);
  blocker.style.display = 'none';
  instructions.style.display = 'none';
}
instructions.addEventListener('click', loadPage ,false);
instructions.addEventListener('touch', loadPage ,false);


function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
  if(controls.handleResize) {
    controls.handleResize();
  }
  
}
window.addEventListener("resize", onWindowResize, false);


init();