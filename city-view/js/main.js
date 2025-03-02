import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/FirstPersonControls.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';

import { CityBuilder } from './cityBuilder.js';
import { VehicleSystem } from './vehicleSystem.js';
import { PedestrianSystem } from './pedestrianSystem.js';
import { LightingSystem } from './lightingSystem.js';

// Loading manager setup
const loadingManager = new THREE.LoadingManager();
const loadingOverlay = document.getElementById('loading-overlay');
const loadingProgressBar = document.getElementById('loading-progress-bar');

// Counter for tracking initialization steps
let initStepsCompleted = 0;
const totalInitSteps = 5; // Adjust based on your initialization steps

function updateLoadingProgress() {
    initStepsCompleted++;
    const progress = (initStepsCompleted / totalInitSteps) * 100;
    loadingProgressBar.style.width = `${progress}%`;
    
    if (initStepsCompleted >= totalInitSteps) {
        setTimeout(() => {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        }, 100);
    }
}

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: false,
    powerPreference: "high-performance" 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);
updateLoadingProgress(); // Step 1

// Add pixel ratio limiter for high-DPI displays
const pixelRatio = Math.min(window.devicePixelRatio, 2); // Cap at 2x
renderer.setPixelRatio(pixelRatio);

// Controls setup
let controls = new FirstPersonControls(camera, renderer.domElement);
controls.movementSpeed = 10;
controls.lookSpeed = 0.1;
controls.lookVertical = true;
controls.constrainVertical = true;
controls.verticalMin = Math.PI / 4;
controls.verticalMax = Math.PI / 2.1;
updateLoadingProgress(); // Step 2

// Initial camera position
camera.position.set(0, 5, 20);
camera.lookAt(0, 0, 0);

// City parameters - reduce complexity
const cityParams = {
    gridSize: 8, // Reduced from 10 to 8
    blockSize: 20,
    roadWidth: 10,
    maxBuildingHeight: 50,
    minBuildingHeight: 5
};

// Initialize systems
const lightingSystem = new LightingSystem(scene);
window.lightingSystem = lightingSystem;
updateLoadingProgress(); // Step 3

const cityBuilder = new CityBuilder(scene, cityParams);
const vehicleSystem = new VehicleSystem(scene, cityBuilder.getRoadNetwork());
const pedestrianSystem = new PedestrianSystem(scene, cityBuilder.getSidewalks(), cityBuilder.getCrosswalks());
updateLoadingProgress(); // Step 4

// Build the city
cityBuilder.buildCity();
updateLoadingProgress(); // Step 5

// Update shadow maps once after city is built
renderer.shadowMap.needsUpdate = true;

// Adjust camera position for the larger city
camera.position.set(0, 30, 100);
camera.lookAt(0, 0, 0);

// Add fog to the scene for better performance with larger cities
scene.fog = new THREE.Fog(0xccccff, 80, 250); // Reduced fog distance

// Performance optimization for larger cities
function updateVisibility() {
    // Get camera position
    const cameraPosition = camera.position.clone();
    
    // Update visibility of objects based on distance from camera
    scene.traverse((object) => {
        if (object.isMesh && !object.userData.isGround) {
            const distance = cameraPosition.distanceTo(object.position);
            
            // Only show objects within a certain distance - reduced viewing distance
            if (distance > 200) { // Reduced from 300
                object.visible = false;
            } else {
                object.visible = true;
                
                // Reduce shadow quality for distant objects
                if (distance > 100) { // Reduced from 150
                    object.castShadow = false;
                } else {
                    // Only enable shadows for some objects to maintain performance
                    object.castShadow = object.userData.castsShadow === true;
                }
            }
        }
    });
}

// Call updateVisibility more frequently for better performance
setInterval(updateVisibility, 500); // Reduced from 1000ms to 500ms

// Time of day control
const timeSlider = document.getElementById('time-slider');
const timeDisplay = document.getElementById('time-display');

timeSlider.addEventListener('input', () => {
    const time = parseFloat(timeSlider.value);
    const hours = Math.floor(time);
    const minutes = Math.floor((time - hours) * 60);
    timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    lightingSystem.updateTimeOfDay(time);
    
    // Update shadow maps when time of day changes significantly
    if (Math.abs(time - lastShadowUpdateTime) > 1) {
        renderer.shadowMap.needsUpdate = true;
        lastShadowUpdateTime = time;
    }
});

// Track last time shadows were updated
let lastShadowUpdateTime = parseFloat(timeSlider.value);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
});

// Keyboard controls for camera height
const keyState = {};
window.addEventListener('keydown', (e) => {
    keyState[e.code] = true;
});
window.addEventListener('keyup', (e) => {
    keyState[e.code] = false;
});

// Animation loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Update controls
    controls.update(delta);
    
    // Handle camera height adjustment
    if (keyState['ArrowUp']) camera.position.y += 0.5;
    if (keyState['ArrowDown']) camera.position.y -= 0.5;
    if (keyState['KeyQ']) camera.position.y += 0.5; // Move up with Q
    if (keyState['KeyE']) camera.position.y -= 0.5; // Move down with E
    
    // Update systems
    vehicleSystem.update(delta);
    pedestrianSystem.update(delta);
    
    renderer.render(scene, camera);
}

// Start animation only after everything is loaded
animate();

