import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import getStarfield from "./src/getStarfield.js";

let paused = false;
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = -40;
camera.position.y = 40;
camera.position.x = 40;

let mouseX = 0;
let mouseY = 0;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

let textures = [
  'tex/earthmap1k.jpg', 
  'tex/moonmap1k.jpg',
  'tex/jupitermap.jpg',
];

const loader = new THREE.TextureLoader();

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.03;
controls.update();

const lights = new THREE.DirectionalLight(0xffffff, 3);
scene.add(lights);
const ambiLights = new THREE.AmbientLight('lightblue', 1);
scene.add(ambiLights);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(); // Stores normalized mouse coordinates

const stars = getStarfield({ numstars: 500 });
scene.add(stars);

// Create a plane geometry
const planeGeometry = new THREE.PlaneGeometry(500, 500);
const planeMaterial = new THREE.MeshBasicMaterial({ wireframe: true , visible: false});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// Create the outline for the plane
const edges = new THREE.EdgesGeometry(planeGeometry);
const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
const outline = new THREE.LineSegments(edges, outlineMaterial);
outline.rotation.x = -Math.PI / 2; // Same rotation as the plane
scene.add(outline);

// Function to create balls and apply physics
function getBall(ballX, ballY, ballZ) {
  const randomNumber = THREE.MathUtils.randInt(0, 2);
  const randomTexture = textures[randomNumber];

  let radius;
  switch(randomNumber) {
    case 0: radius = 10; break;
    case 1: radius = 5; break;
    case 2: radius = 20; break;
  }

  const material = new THREE.MeshStandardMaterial({
    flatShading: true,
    map: loader.load(randomTexture),
  });

  const geometry = new THREE.IcosahedronGeometry(radius, 20);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(ballX, ballY, ballZ);
  mesh.rotation.x = THREE.MathUtils.randFloatSpread(Math.PI);

  const velocity = {
    x: THREE.MathUtils.randFloatSpread(0.1),
    z: THREE.MathUtils.randFloatSpread(0.1),
  };

  let dampingMult;
  let repelStrength;
  let pullSpeed;

  repelStrength = 0.4; dampingMult = 0.95; pullSpeed = 0.001

  function update(allBalls) {
    velocity.x *= dampingMult;
    velocity.z *= dampingMult;

    mesh.position.x += velocity.x;
    mesh.position.z += velocity.z;

    const movementVector = new THREE.Vector3(velocity.x, 0, velocity.z);
    const rollingSpeed = movementVector.length();
    const rollAngle = rollingSpeed / radius;

    // Compute axis of rotation (perpendicular to movement direction)
    const rollAxis = new THREE.Vector3(-velocity.z, 0, velocity.x).normalize();
    mesh.rotateOnAxis(rollAxis, -rollAngle);
 
    const planeWidth = 500;
    const planeHeight = 500;

    if (mesh.position.x <= -planeWidth + radius || mesh.position.x >= planeWidth - radius) {
      velocity.x *= -1;
    }

    if (mesh.position.z <= -planeHeight + radius || mesh.position.z >= planeHeight - radius) {
      velocity.z *= -1;
    }

    const direction = new THREE.Vector3(0, 0, 0);
    allBalls.forEach((b) => {
      const distance = b.mesh.position.distanceTo(mesh.position);
      if (distance < b.radius + radius) {
        direction.subVectors(b.mesh.position, mesh.position)
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
    radius,
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
    const intersects = raycaster.intersectObjects([plane]);

    if (intersects.length > 0) {
      formBall(intersects[0].point);
    }
  }
}

window.addEventListener("keydown", handleKeyDown);

window.addEventListener("mousemove", function (e) {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  mouse.set(mouseX, mouseY);
});
