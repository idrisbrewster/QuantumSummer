import {
  Raycaster,
  Vector3,
  ArrowHelper
} from "three";
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export class PointerLockControlsHandler {
  constructor(camera, domElement) {
    this.moveForward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveBackward = false;
    this.canJump = false;
    this.raycaster = new Raycaster( new Vector3(), new Vector3( 0, - 1, 0 ), 0, 10 );
    this.velocity = new Vector3();
    this.direction = new Vector3();
    this.prevTime = 0.0;
    this.controls = new PointerLockControls(camera, domElement);
    this.arrow;

    document.addEventListener( 'keydown', this.onKeyDown.bind(this), false );
    document.addEventListener( 'keyup', this.onKeyUp.bind(this), false );
    // return this.controls;
  }

  onKeyDown(event) {
    console.log('pressed', event.keyCode)
    switch ( event.keyCode ) {
      case 38: // up
      case 87: // w
        this.moveForward = true;
        break;
      case 37: // left
      case 65: // a
        this.moveLeft = true;
        break;
      case 40: // down
      case 83: // s
        this.moveBackward = true;
        break;
      case 39: // right
      case 68: // d
        this.moveRight = true;
        break;
      case 32: // space
        if ( this.canJump === true ) this.velocity.y += 100;
        this.canJump = false;
        break;
    }
  }

  onKeyUp(event) {
    console.log('released', event.keyCode)
    switch ( event.keyCode ) {
      case 38: // up
      case 87: // w
        this.moveForward = false;
        break;
      case 37: // left
      case 65: // a
        this.moveLeft = false;
        break;
      case 40: // down
      case 83: // s
        this.moveBackward = false;
        break;
      case 39: // right
      case 68: // d
        this.moveRight = false;
        break;
    }
  }


  update(time, objects, scene) {
    // if ( this.controls.isLocked ) {
    // console.log('updaing', this.velocity)
    

    this.raycaster.ray.origin.copy( this.controls.getObject().position );
    this.raycaster.ray.origin.y -= 10;

    let intersections = this.raycaster.intersectObjects( objects );

    scene.remove(this.arrow);
    this.arrow = new ArrowHelper( this.raycaster.ray.direction, this.raycaster.ray.origin, 100, Math.random() * 0xffffff );
    scene.add(this.arrow);

    let onObject = intersections.length > 0;
    let flag = false;
    intersections.forEach(el => {
      if(el.distance < 3) {
        flag = true;
        // this.velocity.y += 1;
      }
    })
    
    if(flag) {
      this.velocity.y += 1;
    }
    // let time = performance.now();
    let delta = ( time - this.prevTime ) ;

    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    this.velocity.y -= .8 * 100.0 * delta; // 100.0 = mass

    this.direction.z = Number( this.moveForward ) - Number( this.moveBackward );
    this.direction.x = Number( this.moveRight ) - Number( this.moveLeft );
    this.direction.normalize(); // this ensures consistent movements in all directions

    if ( this.moveForward || this.moveBackward ) {
      console.log('move forward / backward')
      this.velocity.z -= this.direction.z * 400.0 * delta
    };
    if ( this.moveLeft || this.moveRight ) this.velocity.x -= this.direction.x * 400.0 * delta;

    if ( onObject) {
      console.log(intersections)
      console.log('onObject')

      this.velocity.y = Math.max( 0, this.velocity.y );
      this.canJump = true;

    }

    this.controls.moveRight( - this.velocity.x * delta );
    // console.log(this.velocity)
    this.controls.moveForward( - this.velocity.z * delta );

    this.controls.getObject().position.y += ( this.velocity.y * delta ); // new behavior

    if ( this.controls.getObject().position.y < 0 ) {

      this.velocity.y = 0;
      this.controls.getObject().position.y = 0;

      this.canJump = true;

    }

    this.prevTime = time;

  }
  // }
}
