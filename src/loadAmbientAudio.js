import {
    AudioListener,
    AudioLoader,
    Audio
  } from "three";

export function asyncLoadAmbientAudio(audioFile, camera, volume) {
    const listener = new AudioListener();
    camera.add( listener );
    const sound = new Audio( listener );
    const audioLoader = new AudioLoader();
    audioLoader.load( audioFile, ( buffer ) => {
        sound.setBuffer( buffer );
        sound.setLoop( true );
        sound.setVolume( volume );
        sound.play();
    });
}