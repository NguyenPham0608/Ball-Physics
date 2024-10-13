import * as THREE from "three";
import {OrbitControls} from "jsm/controls/OrbitControls.js";

let paused = false;
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 10; // Adjust z position to see the whole scene.
camera.position.y = 60;

let mouseX = 0;
let mouseY = 0;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.03;
controls.update();

const radius = 2;

const geometry = new THREE.IcosahedronGeometry(radius, 1);
const material = new THREE.MeshNormalMaterial({
  flatShading: true,
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(); // Stores normalized mouse coordinates

function getBall(ballX, ballY, ballZ) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(ballX, ballY, ballZ);
  mesh.rotation.x = THREE.MathUtils.randFloatSpread(Math.PI);

  const velocity = {
    x: THREE.MathUtils.randFloatSpread(0.1),
    z: THREE.MathUtils.randFloatSpread(0.1),
  };

  const dampingMult = 0.98;
  const repelStrength = 0.007;

  function update(allBalls) {
    velocity.x *= dampingMult;
    velocity.z *= dampingMult;

    mesh.position.x += velocity.x;
    mesh.position.z += velocity.z;

    const direction = new THREE.Vector3(0, 0, 0);
    allBalls.forEach((b) => {
      const distance = b.mesh.position.distanceTo(mesh.position);

      if (distance < radius * 2) {
        direction
          .subVectors(b.mesh.position, mesh.position)
          .normalize()
          .multiplyScalar(repelStrength);
        b.velocity.x += direction.x;
        b.velocity.z += direction.z;
      }
    });
  }

  return {
    update,
    mesh,
    velocity,
  };
}

const balls = [];

function formBall(intersectionPoint) {
  const ball = getBall(
    intersectionPoint.x,
    intersectionPoint.y,
    intersectionPoint.z
  );
  scene.add(ball.mesh);
  balls.push(ball);
}

renderer.setPixelRatio(window.devicePixelRatio);

function animate() {
  requestAnimationFrame(animate);
  if (paused === false) {
    balls.forEach((b) => b.update(balls));
  }
  renderer.render(scene, camera);
  controls.update();
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", handleWindowResize, false);

function handleKeyDown(e) {
  const { key } = e;
  const ESC = "Escape";
  if (key === ESC) {
    paused = !paused;
  }
  if (key === " ") {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([plane]); // Intersect with a ground plane

    if (intersects.length > 0) {
      formBall(intersects[0].point); // Pass the intersection point
    }
  }
}

// Create a plane to act as a ground for raycasting
const planeGeometry = new THREE.PlaneGeometry(200, 200);
const planeMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Make the plane invisible
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal
scene.add(plane);

window.addEventListener("keydown", handleKeyDown);

window.addEventListener("mousemove", function (e) {
  // Normalize mouse coordinates
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  mouse.set(mouseX, mouseY); // Update normalized mouse coordinates
});
