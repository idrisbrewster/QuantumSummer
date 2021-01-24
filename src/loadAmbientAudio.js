import {
    AudioListener,
    AudioLoader,
    Audio
  } from "three";

const audioLoader = new AudioLoader();
export function asyncLoadAmbientAudio(audioFile, listener, volume) {
    const sound = new Audio( listener );
    audioLoader.load( audioFile, ( buffer ) => {
        sound.setBuffer( buffer );
        sound.setLoop( true );
        sound.setVolume( volume );
        sound.play();
    });
}