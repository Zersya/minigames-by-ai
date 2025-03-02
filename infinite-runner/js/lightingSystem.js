import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';

export class LightingSystem {
    constructor(scene) {
        this.scene = scene;

        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(this.ambientLight);

        // Directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;

        // Configure shadow properties
        const shadowSize = 50;
        this.sunLight.shadow.camera.left = -shadowSize;
        this.sunLight.shadow.camera.right = shadowSize;
        this.sunLight.shadow.camera.top = shadowSize;
        this.sunLight.shadow.camera.bottom = -shadowSize;
        this.sunLight.shadow.camera.near = 1;
        this.sunLight.shadow.camera.far = 200;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        
        this.scene.add(this.sunLight);
    }

    updateTimeOfDay(time) {
        // time is in 24-hour format (0-24)
        const daylight = Math.sin((time - 6) * Math.PI / 12); // Peak at noon (12)
        
        // Update ambient light
        this.ambientLight.intensity = THREE.MathUtils.lerp(0.1, 0.3, Math.max(0, daylight));
        
        // Update sun light
        this.sunLight.intensity = THREE.MathUtils.lerp(0.1, 1, Math.max(0, daylight));
        
        // Update sun position
        const angle = (time - 6) * Math.PI / 12; // Start at -90 degrees at 6AM
        const height = Math.sin(angle) * 100;
        const distance = Math.cos(angle) * 100;
        this.sunLight.position.set(distance, height, 50);
        
        // Update sky color
        const skyColor = new THREE.Color();
        if (daylight > 0) {
            // Day sky (blue)
            skyColor.setRGB(0.5 + 0.2 * daylight, 0.7 + 0.3 * daylight, 1);
        } else {
            // Night sky (dark blue)
            skyColor.setRGB(0.1, 0.1, 0.2);
        }
        this.scene.background = skyColor;
    }
}
