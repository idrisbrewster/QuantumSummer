import {
  LoopRepeat
} from "three";

import { lerp } from './helpers.js';

export class ActivationSite {
  constructor(position, object, gltfScene, animationMixer, audio, autoPlayAnimation=false, zoneColor, zoneHelper) {
    this.position = position;
    this.object = object;
    this.animationMixer = animationMixer;
    this.gltfScene = gltfScene;
    this.name = gltfScene.name;
    this.audio = audio;
    
    this.autoPlayAnimation = autoPlayAnimation;
    this.audioFade = .05;
    this.activatedAutoPlay = false;
    this.activated = false;
    this.audioAnalyser = null;
    this.fftSize = 32;
    this.zoneColor = zoneColor;
    this.zoneHelper = zoneHelper;
  }

  update(time, inputPosition, threshold = 10) {
    if(this.animationMixer) {
      this.animationMixer.update(time);
    }

    if(this.autoPlayAnimation && !this.activatedAutoPlay) {
      this.shouldPlayAnimation(true)
      this.activatedAutoPlay = true;
      //auto play animaiton
    }
    let dist = this.position.distanceTo(inputPosition);
    if(dist <= threshold) {
      if(this.audio) {
        this.audio.setVolume(lerp(this.audio.getVolume(), 1.0, this.audioFade));
      }
      
      if(!this.activated) {
        console.log('Activate', this.name, dist);
        //play animation
        //play  audio
        if(this.audio) {
          this.audio.play();
        }
        this.shouldPlayAnimation(true)
        this.activated = true;
      }
    } else {
      if(this.activated) {
        // console.log('Deactivating', this.name, dist);
        // pause animation
        // pause audio
        if(this.audio) {
          this.audio.setVolume(lerp(this.audio.getVolume(), 0.0, this.audioFade));
          if(this.audio.getVolume() <= 0.01) {
            this.audio.pause();
            this.activated = false;
            this.audio.setVolume(0.0);
          }
          // this.audio.pause();
        }

        this.shouldPlayAnimation(false)
      }
      
      // this.activated = false;
    }
  }

  shouldPlayAnimation(play) {
    if(this.object && 'animations' in this.object) {
      this.object.animations.forEach(clip => {
        if(play) {
          // console.log(this.animationMixer, clip)
          //Might need to use .existingAction
          let action = this.animationMixer.existingAction( clip )
          
          if(!action) {
            action = this.animationMixer.clipAction( clip );//.fadeIn(2).loop(LoopRepeat);
            action.fadeIn(4);
            //action.play()
          } else {
            action.paused = false;
          }

          console.log(this.name, action)
          action.startAt(8);
          
          // action.loop(LoopRepeat);
        } else {
          let action = this.animationMixer.existingAction( clip )//.fadeOut(2);
          // action.fadeOut(2)
          action.paused = true;
        }
      });
    }
  }

  // toggleAnimations() {
  //   for ( var i = 0; i < gltf.animations.length; i ++ ) {
  //     var clip = gltf.animations[ i ];
  //     var action = mixer.existingAction( clip );
  //     action.play();
  //     state.playAnimation ? action.play() : action.stop();
  //   }
  // }
}