import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';

export class WeaponSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        this.upgrades = [];
        this.fireRate = 2;
        this.lastFireTime = 0;
        this.projectileSpeed = 60; // Base projectile speed
        
        // Projectile properties
        this.projectileGeometry = new THREE.SphereGeometry(0.2);
        this.projectileMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });

        // Debug helpers
        this.debug = false;
        if (this.debug) {
            this.projectileBounds = new THREE.Box3Helper(new THREE.Box3(), 0xff0000);
            this.gateBounds = new THREE.Box3Helper(new THREE.Box3(), 0x00ff00);
            this.scene.add(this.projectileBounds);
            this.scene.add(this.gateBounds);
        }

        this.spawnUpgradeTimer = 0;
        this.upgradeSpawnInterval = 5;

        // Add new power-up related properties
        this.piercingShots = 0; // Number of enemies a projectile can pierce through
        this.permanentMultiplier = 1; // Permanent damage multiplier

        // Spread angle for multiplied projectiles (in radians)
        this.spreadAngle = Math.PI / 60; // Adjust this value to control spread

        // Add base damage range
        this.baseDamageMin = 100;
        this.baseDamageMax = 200;
        this.criticalChance = 0.05; // 20% chance for critical hits
        this.criticalMultiplier = 2.0; // Critical hits do double damage
    }

    shoot(playerPosition) {
        const now = performance.now();
        if (now - this.lastFireTime < 1000 / this.fireRate) return;
        
        this.createProjectile(playerPosition);
        this.lastFireTime = now;
    }

    createProjectile(position, angle = 0) {
        const projectile = new THREE.Mesh(this.projectileGeometry, this.projectileMaterial.clone());
        projectile.position.copy(position);
        projectile.position.y += 0.5;
        projectile.position.z += 2;
        
        projectile.userData = {
            multiplier: 1,
            speedMultiplier: 1,
            remainingPierces: this.piercingShots,
            direction: new THREE.Vector3(
                Math.sin(angle),
                0,
                Math.cos(angle)
            ),
            boundingBox: new THREE.Box3(),
            lastGateHit: null,
            isDuplicated: false // Add this flag for new projectiles
        };
        
        projectile.geometry.computeBoundingBox();
        
        this.scene.add(projectile);
        this.projectiles.push(projectile);
        return projectile;
    }

    multiplyProjectile(projectile, gate) {
        // Don't multiply if we've already hit this gate
        if (projectile.userData.lastGateHit === gate) {
            return [];
        }

        const currentCount = 2; // Double the projectiles each time
        const currentAngle = Math.atan2(projectile.userData.direction.x, projectile.userData.direction.z);
        const angleStep = this.spreadAngle;
        const baseAngle = currentAngle - (angleStep / 2);
        
        const newProjectiles = [];
        
        // Create new projectiles
        for (let i = 0; i < currentCount; i++) {
            const angle = baseAngle + (angleStep * i);
            const newProjectile = this.createProjectile(projectile.position.clone(), angle);
            
            // Copy ALL properties from original projectile
            newProjectile.userData = {
                ...projectile.userData,
                multiplier: projectile.userData.multiplier,
                speedMultiplier: projectile.userData.speedMultiplier,
                remainingPierces: projectile.userData.remainingPierces,
                direction: new THREE.Vector3(
                    Math.sin(angle),
                    0,
                    Math.cos(angle)
                ),
                isDuplicated: true, // Mark as duplicated projectile
                lastGateHit: gate  // Mark this gate as hit
            };
            
            newProjectiles.push(newProjectile);
        }
        
        // Remove the original projectile
        this.removeProjectile(projectile);
        
        return newProjectiles;
    }

    checkGateCollisions(gates) {
        if (!gates || gates.length === 0) return;

        const projectileBounds = new THREE.Box3();
        const gateBounds = new THREE.Box3();
        const projectilesToProcess = new Map(); // Map projectiles to their corresponding gates

        // First pass: collect all projectiles and their corresponding gates
        for (const projectile of this.projectiles) {
            if (!projectile.parent) continue;
            
            projectileBounds.setFromObject(projectile);
            
            for (const gate of gates) {
                if (!gate.parent) continue;

                gateBounds.setFromObject(gate);
                gateBounds.expandByScalar(0.5);

                if (projectileBounds.intersectsBox(gateBounds) && 
                    projectile.userData.lastGateHit !== gate) {
                    projectilesToProcess.set(projectile, gate);
                    break;
                }
            }
        }

        // Second pass: multiply collected projectiles
        for (const [projectile, gate] of projectilesToProcess.entries()) {
            if (projectile.parent) { // Check if projectile still exists
                this.multiplyProjectile(projectile, gate);
            }
        }
    }

    removeProjectile(projectile) {
        const index = this.projectiles.indexOf(projectile);
        if (index > -1) {
            this.scene.remove(projectile);
            this.projectiles.splice(index, 1);
        }
    }

    update(delta, platform) {
        // Check for gate collisions
        if (platform && platform.getGates) {
            const gates = platform.getGates();
            this.checkGateCollisions(gates);
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            if (!projectile.parent) {
                this.projectiles.splice(i, 1);
                continue;
            }

            const speedMultiplier = projectile.userData.speedMultiplier || 1;
            
            // Update position using direction vector
            const movement = projectile.userData.direction.clone()
                .multiplyScalar(delta * this.projectileSpeed * speedMultiplier);
            
            projectile.position.add(movement);

            // Remove projectiles that are too far
            if (projectile.position.z > 100 || 
                projectile.position.z < -20 || 
                Math.abs(projectile.position.x) > 20) {
                this.removeProjectile(projectile);
            }
        }

        // Update upgrades
        this.spawnUpgradeTimer += delta;
        if (this.spawnUpgradeTimer >= this.upgradeSpawnInterval) {
            this.spawnUpgradeTimer = 0;
            if (this.spawnUpgrade) {
                this.spawnUpgrade();
            }
        }

        // Update existing upgrades
        for (let i = this.upgrades.length - 1; i >= 0; i--) {
            const upgrade = this.upgrades[i];
            upgrade.position.z -= delta * 20;
            upgrade.rotation.y += delta * 2;

            if (upgrade.position.z < -20) {
                this.scene.remove(upgrade);
                this.upgrades.splice(i, 1);
            }
        }
    }

    calculateDamage() {
        // Generate random base damage
        const baseDamage = Math.floor(
            Math.random() * (this.baseDamageMax - this.baseDamageMin + 1) + this.baseDamageMin
        );

        // Check for critical hit
        const isCritical = Math.random() < this.criticalChance;
        const criticalMult = isCritical ? this.criticalMultiplier : 1;

        // Apply all multipliers
        const totalDamage = baseDamage * this.permanentMultiplier * criticalMult;

        return {
            damage: Math.round(totalDamage),
            isCritical
        };
    }

    checkCollisions(enemies, onHit) {
        const projectileBounds = new THREE.Box3();
        const enemyBounds = new THREE.Box3();
        const projectilesToRemove = new Set();

        // Process each projectile
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            if (!projectile.parent || projectilesToRemove.has(projectile)) continue;

            projectileBounds.setFromObject(projectile);
            let hitDetected = false;

            for (const enemy of enemies) {
                if (!enemy.parent) continue;
                
                enemyBounds.setFromObject(enemy);
                
                if (projectileBounds.intersectsBox(enemyBounds)) {
                    // Calculate damage using the new damage system
                    const damageResult = this.calculateDamage();
                    const totalDamage = damageResult.damage;
                    
                    // Create damage popup with different colors for critical hits
                    if (this.damagePopup) {
                        const position = enemy.position.clone();
                        this.damagePopup.createDamageNumber(
                            position, 
                            totalDamage,
                            damageResult.isCritical
                        );
                    }
                    
                    const isDefeated = enemy.userData.enemySystem.damageEnemy(enemy, totalDamage);
                    
                    if (isDefeated) {
                        onHit(enemy);
                    }
                    
                    hitDetected = true;
                    
                    if (projectile.userData.remainingPierces > 0) {
                        projectile.userData.remainingPierces--;
                    } else {
                        projectilesToRemove.add(projectile);
                        break;
                    }
                }
            }
            
            if (hitDetected && !projectile.userData.remainingPierces) {
                projectilesToRemove.add(projectile);
            }
        }

        // Remove all marked projectiles
        for (const projectile of projectilesToRemove) {
            this.removeProjectile(projectile);
        }
    }

    checkUpgradeCollisions(playerBounds, onCollect) {
        const upgradeBounds = new THREE.Box3();
        for (let i = this.upgrades.length - 1; i >= 0; i--) {
            const upgrade = this.upgrades[i];
            upgradeBounds.setFromObject(upgrade);
            
            if (playerBounds.intersectsBox(upgradeBounds)) {
                onCollect(upgrade);
                this.scene.remove(upgrade);
                this.upgrades.splice(i, 1);
            }
        }
    }

    applyUpgrade(upgrade) {
        this.fireRate *= 1.5;
        this.fireRate = Math.min(this.fireRate, 10);
    }
}
