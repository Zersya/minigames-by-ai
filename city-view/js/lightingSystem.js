import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';

export class LightingSystem {
    constructor(scene) {
        this.scene = scene;
        
        // Store lights that will be affected by time of day
        this.sunLight = null;
        this.ambientLight = null;
        this.streetLights = [];
        this.buildingLights = [];
        
        // Maximum number of street lights to avoid uniform limit
        this.maxStreetLights = 15; // Reduced from 50 to stay under texture unit limit
        
        // Initialize lighting
        this.setupLighting();
    }
    
    setupLighting() {
        // Create ambient light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(this.ambientLight);
        
        // Create directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;
        
        // Configure shadow properties - reduced shadow map size for performance
        this.sunLight.shadow.mapSize.width = 1024; // Reduced from 2048
        this.sunLight.shadow.mapSize.height = 1024; // Reduced from 2048
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        
        // Set shadow camera frustum
        const shadowSize = 150;
        this.sunLight.shadow.camera.left = -shadowSize;
        this.sunLight.shadow.camera.right = shadowSize;
        this.sunLight.shadow.camera.top = shadowSize;
        this.sunLight.shadow.camera.bottom = -shadowSize;
        
        this.scene.add(this.sunLight);
        
        // Find and collect all street lights in the scene
        this.collectStreetLights();
    }
    
    collectStreetLights() {
        // This method would ideally be called after all street elements are added
        // For now, we'll just set up a timer to collect them after a short delay
        setTimeout(() => {
            this.scene.traverse((object) => {
                if (object instanceof THREE.PointLight && 
                    object !== this.sunLight && 
                    object !== this.ambientLight) {
                    // Only add lights up to the maximum to avoid exceeding uniform limits
                    if (this.streetLights.length < this.maxStreetLights) {
                        this.streetLights.push(object);
                        // Initially turn off street lights during day
                        object.intensity = 0;
                    } else {
                        // If we've reached the maximum, remove excess lights from the scene
                        this.scene.remove(object);
                    }
                }
            });
            console.log(`Collected ${this.streetLights.length} street lights (max: ${this.maxStreetLights})`);
        }, 1000); // Delay to ensure all lights are added to the scene
    }
    
    // Method to add a street light directly (used by CityBuilder)
    addStreetLight(light) {
        if (this.streetLights.length < this.maxStreetLights) {
            // Reduce shadow quality for street lights
            if (light.shadow) {
                light.shadow.mapSize.width = 512; // Reduced shadow map size
                light.shadow.mapSize.height = 512;
                light.shadow.camera.near = 0.5;
                light.shadow.camera.far = 30; // Reduced shadow distance
            }
            
            this.streetLights.push(light);
            // Initially turn off street lights during day
            light.intensity = 0;
            return true;
        } else {
            // If we've reached the maximum, remove the light from the scene
            this.scene.remove(light);
            return false;
        }
    }
    
    updateTimeOfDay(time) {
        // time is in 24-hour format (0-24)
        
        // Calculate sun position based on time
        // Sunrise at 6:00, sunset at 18:00
        const sunAngle = ((time - 6) / 12) * Math.PI;
        const sunHeight = Math.sin(sunAngle);
        const sunDistance = 100;
        
        // Update sun position
        this.sunLight.position.x = Math.cos(sunAngle) * sunDistance;
        this.sunLight.position.y = Math.max(sunHeight * sunDistance, -20); // Keep sun not too far below horizon
        this.sunLight.position.z = Math.sin(sunAngle + Math.PI/4) * sunDistance; // Offset angle for better shadows
        
        // Update sun color and intensity based on time
        if (time >= 6 && time <= 18) {
            // Daytime
            const dayProgress = Math.min(Math.abs(time - 12) / 6, 1);
            
            // Midday is bright white, sunrise/sunset is more orange
            const sunColor = new THREE.Color();
            sunColor.setHSL(0.1 - dayProgress * 0.1, 0.7, 0.5 + 0.5 * (1 - dayProgress));
            
            this.sunLight.color = sunColor;
            this.sunLight.intensity = 1 - dayProgress * 0.3; // Slightly dimmer at sunrise/sunset
            
            // Ambient light is brighter during the day
            this.ambientLight.intensity = 0.3 - dayProgress * 0.1;
        } else {
            // Nighttime
            const nightProgress = (time < 6) ? time / 6 : (24 - time) / 6;
            
            // Night sun (moon) is dim and bluish
            const moonColor = new THREE.Color();
            moonColor.setHSL(0.6, 0.2, 0.5);
            
            this.sunLight.color = moonColor;
            this.sunLight.intensity = 0.1 + nightProgress * 0.1; // Dimmer at midnight
            
            // Ambient light is dimmer at night
            this.ambientLight.intensity = 0.1;
        }
        
        // Update street lights
        this.updateStreetLights(time);
    }
    
    updateStreetLights(time) {
        // Street lights turn on at night (after 18:00 or before 6:00)
        const streetLightIntensity = (time >= 18 || time <= 6) ? 1.0 : 0;
        
        // If it's dawn or dusk, gradually change the intensity
        if (time > 5 && time < 7) {
            // Dawn - gradually turn off lights
            const dawnProgress = (time - 5) / 2;
            this.streetLights.forEach(light => {
                light.intensity = 1.0 - dawnProgress;
            });
        } else if (time > 17 && time < 19) {
            // Dusk - gradually turn on lights
            const duskProgress = (time - 17) / 2;
            this.streetLights.forEach(light => {
                light.intensity = duskProgress;
            });
        } else {
            // Either fully on or fully off
            this.streetLights.forEach(light => {
                light.intensity = streetLightIntensity;
            });
        }
    }
    
    // Method to add building lights that will turn on at night
    addBuildingLight(light) {
        this.buildingLights.push(light);
        // Initially set intensity based on current time
        const time = parseFloat(document.getElementById('time-slider').value);
        light.intensity = (time >= 18 || time <= 6) ? 1.0 : 0;
    }
}

