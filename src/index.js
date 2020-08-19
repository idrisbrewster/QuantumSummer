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
  FogExp2
} from "three";
import * as dat from 'dat.gui';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { promisifyLoader } from './helpers.js';

import fragmentShader from "./shaders/fragment.glsl";
import vertexShader from "./shaders/vertex.glsl";

const modelFolderNames = ['house1', 'island1', 'well1', 'ship1', 'tree1'];
const modelPath = './models/';
const GLTFPromiseLoader = promisifyLoader( new GLTFLoader() );
const debug = true;
let container, scene, camera, renderer, controls, models, gui, animations;
let time;
let params, fog;


function init() {
  time = 0;
  models = [];
  animations = [];

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
  createGeometries();
  createControls();
  initGui();

  scene.background = new Color("skyblue");
  scene.background = new Color(fog.fogHorizonColor);
  scene.fog = new FogExp2(fog.fogHorizonColor, fog.fogDensity);

  renderer.setAnimationLoop(() => {
    update();
    render();
  });
}

function createSkyBox() {
  let pmremGenerator = new PMREMGenerator( renderer );
  pmremGenerator.compileEquirectangularShader();
}

function loadGLTFs() {
  modelFolderNames.forEach(folderName => {
    let filePath = `${modelPath}${folderName}/scene.gltf`;
    GLTFPromiseLoader.load( filePath )
    .then((loadedObject) => {
      let gltf = loadedObject.scene;
      gltf.name = folderName;
      console.log(gltf);
      scene.add(gltf);
      models.push(loadedObject);
      // let mixer = mixer = new AnimationMixer( object );
      animations.push(loadedObject);
    })

    .catch( (err) => console.error( err ) );
  });
  window.models = models;
}

function initGui() {
  params = {
    test : 1.0
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
  gui.add(params, 'test', 0.0, 100.0);
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
  directionalLight.position.set(-65, 12, 75);

  const directionalLightHelper = new DirectionalLightHelper(directionalLight, 5);

  const hemisphereLight = new HemisphereLight(0xddeeff, 0x202020, 3);
  // scene.add(directionalLight, directionalLightHelper, hemisphereLight);
}

function createRenderer() {
  renderer = new WebGLRenderer({ antialias: true });
  if(debug) {
    window.render = renderer;
  }
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
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

function createGeometries() {
  const geometry = new SphereBufferGeometry(1, 30, 30);
  const material = createMaterials();

  const mesh = new Mesh(geometry, material);
  // scene.add(mesh);
}

function createControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new Vector3(15, 0, 75);
  controls.update();
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

function toggleAnimations() {
  for ( var i = 0; i < gltf.animations.length; i ++ ) {
    var clip = gltf.animations[ i ];
    var action = mixer.existingAction( clip );
    action.play();
    state.playAnimation ? action.play() : action.stop();
  }
}

function update() {
  time += 0.1;
  // controls.target.z = params.test
}

function render() {
  renderer.render(scene, camera);
}

init();

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
window.addEventListener("resize", onWindowResize, false);


