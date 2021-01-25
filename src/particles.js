// import {
//     TextureLoader,
//     SpriteMaterial,
//     Sprite
// } from 'three'
import * as THREE from 'three';

import ParticleSystem, {
  Body,
  BoxZone,
  CrossZone,
  Emitter,
  Gravity,
  Life,
  Mass,
  Position,
  RadialVelocity,
  Radius,
  RandomDrift,
  Rate,
  Rotate,
  ScreenZone,
  Span,
  SpriteRenderer,
  Vector3D,
} from 'three-nebula';

const createSnow = () => {
  var map = new THREE.TextureLoader().load('./models/textures/snow.png');
  var material = new THREE.SpriteMaterial({
    map: map,
    transparent: true,
    opacity: 0.5,
    color: 0xffffff,
  });
  return new THREE.Sprite(material);
};

export function createEmitter(camera, renderer) {
    const emitter = new Emitter();
    const position = new Position();
  
    position.addZone(new BoxZone(300, 10, 300));
  
    return emitter
      .setRate(new Rate(new Span(34, 48), new Span(0.2, 0.5)))
      .addInitializers([
        new Mass(1),
        new Radius(new Span(10, 20)),
        position,
        new Life(5, 10),
        new Body(createSnow()),
        new RadialVelocity(0, new Vector3D(0, -1, 0), 90),
      ])
      .addBehaviours([
        new RandomDrift(10, 1, 10, 0.05),
        new Rotate('random', 'random'),
        new Gravity(2),
        new CrossZone(new ScreenZone(camera, renderer, 20, '234'), 'dead'),
      ])
      .setPosition({ y: 800 })
      .emit();
};

