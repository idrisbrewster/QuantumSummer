export class ActivationSite {
  constructor(position, object, gltfScene, animationMixer, audio, autoPlayAnimation=false) {
    this.autoPlayAnimation = autoPlayAnimation;
    this.position = position;
    this.object = object;
    this.animationMixer = animationMixer;
    this.gltfScene = gltfScene;
    this.name = gltfScene.name;
    this.audio = audio;
    this.activated = false;
  }

  update(inputPosition, threshold = 10) {
    if(this.autoPlayAnimation && !this.activated) {

      this.activated = true;
      //auto play animaiton
    }
    let dist = this.position.distanceTo(inputPosition);
    if(dist <= threshold) {
      if(!this.activated) {
        console.log('Activate', this.name, dist);
        //play animation
        //play  audio
        this.activated = true;
      }
    } else {
      if(this.activated) {
        console.log('Deactivating', this.name, dist);
        // pause animation
        // pause audio
      }
      this.activated = false;
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