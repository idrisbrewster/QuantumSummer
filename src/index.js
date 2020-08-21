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
} from "three";

import 'regenerator-runtime/runtime'
//TODO: Remove THREE import on production
import * as THREE from 'three';
window.THREE = THREE;

import * as dat from 'dat.gui';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';

import {asyncLoadAudio} from './loadAudio.js';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { promisifyLoader } from './helpers.js';
import {ActivationSite} from "./ActivationSite.js";

import fragmentShader from "./shaders/fragment.glsl";
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
let params, fog;
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
  createControls();
  scene.background = new Color("skyblue");
  scene.background = new Color(fog.fogHorizonColor);
  scene.fog = new FogExp2(fog.fogHorizonColor, fog.fogDensity);

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
        site.gltfScene.add(audio);
      }
    });
  }
}

function createSkyBox() {
  let pmremGenerator = new PMREMGenerator( renderer );
  pmremGenerator.compileEquirectangularShader();
}

function getGLTFPosition(gltf) {
  try {
    if(!gltf) {
      return new Vector3(0);
    }
    let position = gltf.position;
    if(!position) {
      return new Vector3(0);
    }
    if(position.x === 0 && position.y === 0 && position.z ===0) {
      return getGLTFPosition(gltf.children[0]);
    } else {
      return gltf.position;
    }
  }
  catch (e) {
    console.error('tried getting position from GLTF', e);
  }
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
  params = {
    activationDistance : 10.0,
    useOrbitControls: debug
    // useOrbitControls: false
  };

  fog = {
    fogNearColor: 0xfc4848,
    fogHorizonColor: 0x7d,
    fogDensity: 0.0074,
    fogNoiseSpeed: 100,
    fogNoiseFreq: .0012,
    fogNoiseImpact: .5
  };

  gui = new dat.GUI();
  document.querySelector('.dg').style.zIndex = 99; //fig dat.gui hidden
  gui.add(params, 'activationDistance', 0.0, 100.0);
  gui.add(params, 'useOrbitControls').onChange(() => {
    createControls();
  });
  let fogFolder = gui.addFolder('Fog');
  fogFolder.add(fog, "fogDensity", 0, 0.01).onChange(function() {
    scene.fog.density = fog.fogDensity;
  });
  fogFolder.addColor(fog, "fogHorizonColor").onChange(function() {
    scene.fog.color.set(fog.fogHorizonColor);
    scene.background = new Color(fog.fogHorizonColor);
  });
  // fogFolder.addColor(fog, "fogNearColor").onChange(function() {
  //   terrainShader.uniforms.fogNearColor = {
  //     value: new Color(fog.fogNearColor)
  //   };
  // });
  // fogFolder.add(fog, "fogNoiseFreq", 0, 0.01, 0.0012).onChange(function() {
  //   terrainShader.uniforms.fogNoiseFreq.value = fog.fogNoiseFreq;
  // });
  // fogFolder.add(fog, "fogNoiseSpeed", 0, 1000, 100).onChange(function() {
  //   terrainShader.uniforms.fogNoiseSpeed.value = fog.fogNoiseSpeed;
  // });
  // fogFolder.add(fog, "fogNoiseImpact", 0, 1).onChange(function() {
  //   terrainShader.uniforms.fogNoiseImpact.value = fog.fogNoiseImpact;
  // });
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

function createMaterials() {
  //const material = new MeshStandardMaterial({ wireframe: true });
  const material = new ShaderMaterial({
    fragmentShader: fragmentShader,
    vertexShader: vertexShader
  });

  return material;
}

function createGeometries(position) {
  const geometry = new SphereBufferGeometry(10, 30, 30);
  const material = createMaterials();

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
  time += 0.001;
  activationSites.forEach(site => site.update(animationTime, camera.position, params.activationDistance));
  if(controls.update){
    controls.update(animationTime+.15);
  }
  
  renderer.shadowMap.needsUpdate = true;
  // controls.target.z = params.test
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