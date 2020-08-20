export class ActivationSite {
  constructor(position, object, gltfScene, animationMixer, audio, autoPlayAnimation=false) {
    this.autoPlayAnimation = autoPlayAnimation;
    this.position = position;
    this.object = object;
    this.animationMixer = animationMixer;
    this.gltfScene = gltfScene;
    this.name = gltfScene.name;
    this.audio = audio;
  }

  update(inputPosition, threshold = 10) {
    if(this.autoPlayAnimation) {
      //auto play animaiton
    }
    let dist = this.position.distanceTo(inputPosition);
    if(dist <= threshold) {
      console.log('NEAR', this.name, dist);
      //play / pause animation
      //play / pause audio
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