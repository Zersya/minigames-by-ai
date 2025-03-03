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
            // SPEED: {
            //     color: 0x00ff00,
            //     probability: 0.25,
            //     effect: 'speed'
            // },
            PIERCE: {
                color: 0xff00ff,
                probability: 0.25,
                effect: 'pierce'
            },
            MULTIPLIER: {
                color: 0xffff00,
                probability: 0.25,
                effect: 'multiplier'
            },
            FIRE_RATE: {
                color: 0x00ffff, // Cyan color for fire rate
                probability: 0.25,
                effect: 'fireRate'
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
        const powerUpsToRemove = new Set();
        const collisionExpansion = 1.5; // Increase collision box size

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (!powerUp.parent) continue;
            
            // Set and expand the power-up bounds
            powerUpBounds.setFromObject(powerUp);
            const size = new THREE.Vector3();
            powerUpBounds.getSize(size);
            powerUpBounds.expandByVector(size.multiplyScalar(collisionExpansion));

            for (const projectile of projectiles) {
                if (!projectile.parent || powerUpsToRemove.has(powerUp)) continue;

                projectileBounds.setFromObject(projectile);
                
                if (powerUpBounds.intersectsBox(projectileBounds)) {
                    // Apply power-up effect
                    this.applyPowerUp(powerUp.userData.effect, weaponSystem);
                    
                    // Mark power-up for removal
                    powerUpsToRemove.add(powerUp);

                    // Handle multiplication for both original and duplicated projectiles
                    if (projectile.userData.lastGateHit) {
                        this.multiplyProjectileAfterPowerUp(projectile, weaponSystem);
                    }
                    break;
                }
            }
        }

        // Remove collected power-ups
        for (const powerUp of powerUpsToRemove) {
            const index = this.powerUps.indexOf(powerUp);
            if (index > -1) {
                this.scene.remove(powerUp);
                this.powerUps.splice(index, 1);
            }
        }
    }

    multiplyProjectileAfterPowerUp(projectile, weaponSystem) {
        const currentAngle = Math.atan2(
            projectile.userData.direction.x,
            projectile.userData.direction.z
        );
        
        // Get the gate multiplier from the projectile
        const gateMultiplier = projectile.userData.lastGateHit.userData.multiplier || 2;
        
        // Create new projectiles based on the gate multiplier
        const spreadAngle = Math.PI / 95;
        const numProjectiles = gateMultiplier;
        const baseAngle = currentAngle - (spreadAngle * (numProjectiles - 1) / 2);

        for (let j = 0; j < numProjectiles; j++) {
            const newAngle = baseAngle + (spreadAngle * j);
            const direction = new THREE.Vector3(
                Math.sin(newAngle),
                0,
                Math.cos(newAngle)
            );

            // Create new projectile with the same properties
            const newProjectile = projectile.clone();
            newProjectile.position.copy(projectile.position);
            
            // Preserve all important properties
            newProjectile.userData = {
                ...projectile.userData,
                direction: direction,
                isDuplicated: true,
                lastGateHit: null // Reset gate hit to allow new multiplications
            };

            weaponSystem.scene.add(newProjectile);
            weaponSystem.projectiles.push(newProjectile);
        }

        // Remove the original projectile
        weaponSystem.removeProjectile(projectile);
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
            case 'fireRate':
                weaponSystem.fireRate *= 1.2; // Increase fire rate by 20%
                weaponSystem.fireRate = Math.min(weaponSystem.fireRate, 10); // Cap at 10 shots per second
                break;
        }
        
        // Update UI
        this.ui.showNotification(effect);
        this.ui.updateStats(weaponSystem);
    }
}
