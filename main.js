// Import Three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Ambient Intensity
const ambientIntensity = 0.452; // Derived from 5025221252

// Central Cube (Point Light Source)
const cubeSize = 0.5;
const centralCube = new THREE.Mesh(
  new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
  new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color('white') } },
    vertexShader: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      void main() {
        gl_FragColor = vec4(glowColor, 1.0);
      }
    `,
  })
);
centralCube.position.set(0, 0, 0);
scene.add(centralCube);

// Point Light
const pointLight = new THREE.PointLight('white', 1, 100);
pointLight.position.copy(centralCube.position);
scene.add(pointLight);

// Shader Material Template
const createShaderMaterial = (isMetallic, baseColor) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      ambientIntensity: { value: ambientIntensity },
      lightPosition: { value: centralCube.position },
      baseColor: { value: new THREE.Color(baseColor) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float ambientIntensity;
      uniform vec3 lightPosition;
      uniform vec3 baseColor;

      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        // Light vector
        vec3 lightDir = normalize(lightPosition - vPosition);
        
        // Ambient
        vec3 ambient = ambientIntensity * baseColor;

        // Diffuse
        float diff = max(dot(vNormal, lightDir), 0.0);
        vec3 diffuse = diff * baseColor;

        // Specular
        vec3 viewDir = normalize(-vPosition);
        vec3 reflectDir = reflect(-lightDir, vNormal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), ${isMetallic ? '128.0' : '64.0'});
        vec3 specular = spec * ${isMetallic ? 'baseColor' : 'vec3(1.0)'};

        // Combine
        vec3 color = ambient + diffuse + specular;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
};

const loader = new FontLoader();
loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
  const textGeometryY = new TextGeometry('Y', {
    font: font,
    size: 1,
    height: 0.2,
  });
  const materialY = createShaderMaterial(false, '#00008B');
  const meshY = new THREE.Mesh(textGeometryY, materialY);
  meshY.position.set(-3, 0, 0);
  scene.add(meshY);

  // Text Geometry for "2"
  const textGeometry2 = new TextGeometry('2', {
    font: font,
    size: 1,
    height: 0.2,
  });
  const material2 = createShaderMaterial(true, 'orange'); // Complementary color
  const mesh2 = new THREE.Mesh(textGeometry2, material2);
  mesh2.position.set(3, 0, 0);
  scene.add(mesh2);
});

// Event Listeners for Interactivity
window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'w':
      centralCube.position.y += 0.1;
      break;
    case 's':
      centralCube.position.y -= 0.1;
      break;
    case 'a':
      camera.position.x -= 0.1;
      break;
    case 'd':
      camera.position.x += 0.1;
      break;
  }
  pointLight.position.copy(centralCube.position);
});

// Animation Loop
const animate = () => {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};
animate();
