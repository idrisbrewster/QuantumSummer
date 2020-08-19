varying vec3 N;

void main() {
  N = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}