import {
  Raycaster,
  Vector3
} from "three";

let pControls = {
  moveForward: false,
  moveLeft: false,
  moveRight: false,
  moveBackward: false,
  canJump: false
}

let raycaster = new Raycaster( new Vector3(), new Vector3( 0, - 1, 0 ), 0, 10 );


document.addEventListener( 'keydown', onKeyDown, false );
document.addEventListener( 'keyup', onKeyUp, false );

let onKeyDown = ( event ) => {

  switch ( event.keyCode ) {

    case 38: // up
    case 87: // w
      pControls.moveForward = true;
      break;

    case 37: // left
    case 65: // a
      pControls.moveLeft = true;
      break;

    case 40: // down
    case 83: // s
      pControls.moveBackward = true;
      break;

    case 39: // right
    case 68: // d
      pControls.moveRight = true;
      break;

    case 32: // space
        // if ( canJump === true ) velocity.y += 350;
      pControls.canJump = false;
      break;

  }

};

let onKeyUp = ( event ) => {
  switch ( event.keyCode ) {
    case 38: // up
    case 87: // w
      pControls.moveForward = false;
      break;

    case 37: // left
    case 65: // a
      pControls.moveLeft = false;
      break;

    case 40: // down
    case 83: // s
      pControls.moveBackward = false;
      break;

    case 39: // right
    case 68: // d
      pControls.moveRight = false;
      break;
  }
};

