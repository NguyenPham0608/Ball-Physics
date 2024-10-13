import * as THREE from "three";
import {OrbitControls} from "jsm/controls/OrbitControls.js"

let paused=false
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 1;
camera.position.y = 60;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const controls=new OrbitControls(camera, renderer.domElement)
controls.target.set(0,0,0)
controls.enableDamping=true
controls.dampingFactor=0.03
controls.update()

const radius=2


const geometry = new THREE.IcosahedronGeometry(radius,1);
const material = new THREE.MeshNormalMaterial({
  flatShading: true
});

function getBall(){
  const mesh = new THREE.Mesh(geometry, material);
  let x=THREE.MathUtils.randFloatSpread(10)
  let z=THREE.MathUtils.randFloatSpread(10)
  mesh.position.x=x
  mesh.position.z=z
  mesh.rotation.x=THREE.MathUtils.randFloatSpread(Math.PI)
  const velocity={
    x:THREE.MathUtils.randFloatSpread(0.1),
    z:THREE.MathUtils.randFloatSpread(0.1)
  }

  const dampingMult=0.98
  const repelStrength=0.007
  
  function update(allBalls){
    velocity.x*=dampingMult
    velocity.z*=dampingMult

    x+=velocity.x
    z+=velocity.z
    mesh.position.x=x
    mesh.position.z=z

    const direction=new THREE.Vector3(0,0,0)
    allBalls.forEach(b=>{
      const distance=b.mesh.position.distanceTo(mesh.position)

      if(distance<radius*2){
        direction.subVectors(b.mesh.position, mesh.position).normalize().multiplyScalar(repelStrength)
        b.velocity.x+=direction.x
        b.velocity.z+=direction.z
      }
    })
  }

  return{
    update,
    mesh,
    velocity
  } 
}

const balls=[]
let numBalls=30
for(let i=0;i<numBalls;i++){
  let ball=getBall()
  scene.add(ball.mesh)
  balls.push(ball)
}

renderer.setPixelRatio(window.devicePixelRatio);

function animate() {
  requestAnimationFrame(animate);
  if(paused===false){
    balls.forEach(b => b.update(balls));
  }
  renderer.render(scene, camera);
  controls.update()

}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);

function handleKeyDown(e){
  const {key}=e
  const ESC='Escape'
  if(key===ESC){
    paused=!paused
  }
}
window.addEventListener('keydown', handleKeyDown)