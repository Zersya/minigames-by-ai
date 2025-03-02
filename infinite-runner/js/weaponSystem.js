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
    }

    shoot(playerPosition) {
        const now = performance.now();
        if (now - this.lastFireTime < 1000 / this.fireRate) return;
        
        this.createProjectile(playerPosition);
        this.lastFireTime = now;
    }

    createProjectile(position) {
        const projectile = new THREE.Mesh(this.projectileGeometry, this.projectileMaterial);
        projectile.position.copy(position);
        projectile.position.y += 0.5;
        projectile.position.z += 2;
        
        projectile.userData = {
            multiplier: this.permanentMultiplier,
            speedMultiplier: 1,
            remainingPierces: this.piercingShots,
            boundingBox: new THREE.Box3()
        };
        
        projectile.geometry.computeBoundingBox();
        
        this.scene.add(projectile);
        this.projectiles.push(projectile);
        return projectile;
    }

    checkGateCollisions(gates) {
        if (!gates || gates.length === 0) return;

        const projectileBounds = new THREE.Box3();
        const gateBounds = new THREE.Box3();
        const projectilesToRemove = new Set();
        const newProjectiles = [];

        // First pass: collect all collisions and plan new projectiles
        for (const projectile of this.projectiles) {
            if (projectilesToRemove.has(projectile)) continue;
            
            projectileBounds.setFromObject(projectile);
            
            if (this.debug) {
                this.projectileBounds.box.copy(projectileBounds);
            }

            for (const gate of gates) {
                gateBounds.setFromObject(gate);
                gateBounds.expandByScalar(0.5);

                if (projectileBounds.intersectsBox(gateBounds)) {
                    projectilesToRemove.add(projectile);
                    
                    // Calculate new projectiles
                    const currentMultiplier = projectile.userData.multiplier || 1;
                    const spreadFactor = 0.15 * currentMultiplier;
                    
                    // Create two new projectiles with wider spread
                    const positions = [
                        projectile.position.x - spreadFactor,
                        projectile.position.x + spreadFactor
                    ];

                    for (const xPos of positions) {
                        newProjectiles.push({
                            position: new THREE.Vector3(xPos, projectile.position.y, projectile.position.z),
                            multiplier: currentMultiplier * 2,
                            speedMultiplier: projectile.userData.speedMultiplier || 1
                        });
                    }
                    break;
                }
            }
        }

        // Second pass: remove old projectiles and create new ones
        for (const projectile of projectilesToRemove) {
            this.scene.remove(projectile);
            const index = this.projectiles.indexOf(projectile);
            if (index > -1) {
                this.projectiles.splice(index, 1);
            }
        }

        // Create all new projectiles
        for (const newProjectile of newProjectiles) {
            const projectile = new THREE.Mesh(this.projectileGeometry, this.projectileMaterial);
            projectile.position.copy(newProjectile.position);
            projectile.userData = {
                multiplier: newProjectile.multiplier,
                speedMultiplier: newProjectile.speedMultiplier,
                boundingBox: new THREE.Box3()
            };
            
            this.scene.add(projectile);
            this.projectiles.push(projectile);
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
            const speedMultiplier = projectile.userData.speedMultiplier || 1;
            
            // Update position - now moving straight forward
            projectile.position.z += delta * this.projectileSpeed * speedMultiplier;

            // Update bounding box
            projectile.userData.boundingBox.setFromObject(projectile);

            // Remove projectiles that are too far
            if (projectile.position.z > 100 || 
                projectile.position.z < -20 || 
                Math.abs(projectile.position.x) > 20) {
                this.scene.remove(projectile);
                this.projectiles.splice(i, 1);
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

    checkCollisions(enemies, onHit) {
        const projectileBounds = new THREE.Box3();
        const enemyBounds = new THREE.Box3();

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectileBounds.setFromObject(projectile);

            for (const enemy of enemies) {
                enemyBounds.setFromObject(enemy);
                if (projectileBounds.intersectsBox(enemyBounds)) {
                    // Calculate damage based on multiplier
                    const baseDamage = 1;
                    const totalDamage = baseDamage * projectile.userData.multiplier;
                    
                    // Apply damage and check if enemy is defeated
                    const isDefeated = enemy.userData.enemySystem.damageEnemy(enemy, totalDamage);
                    
                    if (isDefeated) {
                        onHit(enemy);
                    }
                    
                    // Handle piercing shots
                    if (projectile.userData.remainingPierces > 0) {
                        projectile.userData.remainingPierces--;
                    } else {
                        this.scene.remove(projectile);
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
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
