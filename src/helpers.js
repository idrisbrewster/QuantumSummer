import {
  Vector3,
} from "three";


export let params = {
  activationDistance : 50.0,
  useOrbitControls: true
  // useOrbitControls: false
};

export let fogParams = {
  fogNearColor: 0xfc4848,
  fogHorizonColor: 0x7d,
  fogDensity: 0.0074,
  fogNoiseSpeed: 100,
  fogNoiseFreq: .0012,
  fogNoiseImpact: .5
};

export let audioParams = {
  fftSize: 32
};

export function promisifyLoader ( loader, onProgress ) {

    function promiseLoader ( url ) {
  
      return new Promise( ( resolve, reject ) => {
  
        loader.load( url, resolve, onProgress, reject );
  
      } );
    }
  
    return {
      originalLoader: loader,
      load: promiseLoader,
    };
}

export function getGLTFPosition(gltf) {
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

export function lerp (start, end, amt){
  return (1-amt)*start+amt*end
}