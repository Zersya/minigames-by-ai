import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';
import { PowerUpUI } from './powerUpUI.js';

export class PowerUpSystem {
    constructor(scene) {
        this.scene = scene;
        this.powerUps = [];
        this.spawnTimer = 0;
        this.spawnInterval = 5;
        this.ui = new PowerUpUI();

        this.powerUpTypes = {
            SPEED: {
                color: 0x00ff00,
                probability: 0.33,
                effect: 'speed'
            },
            PIERCE: {
                color: 0xff00ff,
                probability: 0.33,
                effect: 'pierce'
            },
            MULTIPLIER: {
                color: 0xffff00,
                probability: 0.34,
                effect: 'multiplier'
            }
        };

        this.powerUpGeometry = new THREE.OctahedronGeometry(0.5);
    }

    createPowerUpMaterial(color) {
        return new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
        });
    }

    spawnPowerUp() {
        const lanes = [-4, 0, 4];
        const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
        
        // Random power-up type based on probability
        const random = Math.random();
        let cumulative = 0;
        let selectedType;
        
        for (const [type, data] of Object.entries(this.powerUpTypes)) {
            cumulative += data.probability;
            if (random <= cumulative) {
                selectedType = { type, ...data };
                break;
            }
        }

        const material = this.createPowerUpMaterial(selectedType.color);
        const powerUp = new THREE.Mesh(this.powerUpGeometry, material);
        
        powerUp.position.set(
            randomLane,
            1,
            50 // Spawn ahead of player
        );

        powerUp.userData = {
            type: selectedType.type,
            effect: selectedType.effect
        };

        this.scene.add(powerUp);
        this.powerUps.push(powerUp);
    }

    update(delta, weaponSystem) {
        // Regular update logic
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnPowerUp();
        }

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.position.z -= delta * 20;
            powerUp.rotation.y += delta * 2;

            if (powerUp.position.z < -20) {
                this.scene.remove(powerUp);
                this.powerUps.splice(i, 1);
            }
        }

        // Update UI stats
        this.ui.updateStats(weaponSystem);
    }

    checkProjectileCollisions(projectiles, weaponSystem) {
        const powerUpBounds = new THREE.Box3();
        const projectileBounds = new THREE.Box3();

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUpBounds.setFromObject(powerUp);

            for (const projectile of projectiles) {
                projectileBounds.setFromObject(projectile);
                
                if (powerUpBounds.intersectsBox(projectileBounds)) {
                    this.applyPowerUp(powerUp.userData.effect, weaponSystem);
                    this.scene.remove(powerUp);
                    this.powerUps.splice(i, 1);
                    break;
                }
            }
        }
    }

    applyPowerUp(effect, weaponSystem) {
        switch (effect) {
            case 'speed':
                weaponSystem.projectileSpeed *= 1.2;
                break;
            case 'pierce':
                weaponSystem.piercingShots += 1;
                break;
            case 'multiplier':
                weaponSystem.permanentMultiplier *= 1.5;
                break;
        }
        
        // Update UI
        this.ui.showNotification(effect);
        this.ui.updateStats(weaponSystem);
    }
}
