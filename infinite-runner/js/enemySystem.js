import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';

export class EnemySystem {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 0.25; // Increased initial spawn interval
        this.lanes = [-4, 0, 4];
        
        // Enemy spawn control - reduced initial values
        this.maxEnemies = 50; // Reduced from 100
        this.minSpawnInterval = 0.5; // Increased minimum interval
        this.maxSpawnInterval = 1.5; // Increased maximum interval
        this.lastSpawnLane = null;
        this.minSpawnDistance = 30; // Minimum spawn distance from player
        this.maxSpawnDistance = 100; // Maximum spawn distance from player
        
        // Enemy types with adjusted health and probabilities
        this.enemyTypes = {
            WEAK: {
                health: 1,
                color: 0xff0000,
                scale: 1,
                probability: 0.6 // Increased probability of weak enemies
            },
            MEDIUM: {
                health: 2, // Reduced from 3
                color: 0xff6600,
                scale: 1.2,
                probability: 0.3
            },
            STRONG: {
                health: 3, // Reduced from 5
                color: 0xff3300,
                scale: 1.4,
                probability: 0.1 // Reduced probability of strong enemies
            }
        };
        
        // Enemy movement properties
        this.baseMovementSpeed = 5;
        this.speedVariation = 1; // Reduced variation
        
        // Create shared geometry and materials
        this.enemyGeometry = new THREE.BoxGeometry(1, 2, 1);
        this.materials = {};
        for (const [type, data] of Object.entries(this.enemyTypes)) {
            this.materials[type] = this.createEnemyMaterial(data);
        }
        
        // Health bar geometries
        this.healthBarGeometry = new THREE.PlaneGeometry(1, 0.1);
        this.healthBarMaterials = {
            background: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
            health: new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        };
    }

    createEnemyMaterial(type) {
        return new THREE.MeshStandardMaterial({ 
            color: type.color,
            metalness: 0.5,
            roughness: 0.5,
            emissive: type.color,
            emissiveIntensity: 0.2
        });
    }

    getRandomEnemyType() {
        const random = Math.random();
        let cumulative = 0;
        
        for (const [typeName, typeData] of Object.entries(this.enemyTypes)) {
            cumulative += typeData.probability;
            if (random <= cumulative) {
                return { name: typeName, ...typeData };
            }
        }
        
        return { name: 'WEAK', ...this.enemyTypes.WEAK };
    }

    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;

        let lane;
        do {
            lane = Math.floor(Math.random() * this.lanes.length);
        } while (this.lanes.length > 1 && lane === this.lastSpawnLane);
        
        this.lastSpawnLane = lane;

        const enemyType = this.getRandomEnemyType();
        const enemy = new THREE.Mesh(this.enemyGeometry, this.materials[enemyType.name]);
        
        const spawnDistance = this.minSpawnDistance + 
            Math.random() * (this.maxSpawnDistance - this.minSpawnDistance);
        
        enemy.position.set(
            this.lanes[lane],
            1,
            spawnDistance
        );
        
        enemy.scale.set(enemyType.scale, enemyType.scale, enemyType.scale);
        enemy.castShadow = true;
        
        enemy.userData = {
            type: enemyType.name,
            maxHealth: enemyType.health,
            currentHealth: enemyType.health,
            speed: this.baseMovementSpeed + (Math.random() * this.speedVariation - this.speedVariation/2),
            enemySystem: this
        };

        this.addHealthBar(enemy);
        this.scene.add(enemy);
        this.enemies.push(enemy);
    }

    addHealthBar(enemy) {
        const backgroundBar = new THREE.Mesh(
            this.healthBarGeometry,
            this.healthBarMaterials.background
        );
        const healthBar = new THREE.Mesh(
            this.healthBarGeometry,
            this.healthBarMaterials.health
        );
        
        backgroundBar.position.y = 2;
        healthBar.position.y = 2;
        
        backgroundBar.rotation.x = -Math.PI / 2;
        healthBar.rotation.x = -Math.PI / 2;
        
        enemy.add(backgroundBar);
        enemy.add(healthBar);
        enemy.userData.healthBar = healthBar;
    }

    updateHealthBar(enemy) {
        if (enemy.userData.healthBar) {
            const healthPercent = enemy.userData.currentHealth / enemy.userData.maxHealth;
            enemy.userData.healthBar.scale.x = Math.max(0, healthPercent);
            enemy.userData.healthBar.position.x = -(1 - healthPercent) * 0.5; // Keep bar centered
        }
    }

    damageEnemy(enemy, damage) {
        enemy.userData.currentHealth -= damage;
        this.updateHealthBar(enemy);
        
        // Flash enemy red when hit
        const originalColor = enemy.material.color.getHex();
        enemy.material.color.setHex(0xff0000);
        setTimeout(() => {
            enemy.material.color.setHex(originalColor);
        }, 100);

        return enemy.userData.currentHealth <= 0;
    }

    update(delta, gameSpeed) {
        // Gradually decrease spawn interval as game progresses
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
            
            // Gradually increase difficulty
            this.spawnInterval = Math.max(
                this.minSpawnInterval,
                this.spawnInterval * 0.999
            );
            this.maxEnemies = Math.min(50, this.maxEnemies + 0.1);
        }

        // Update enemies with optimized removal
        let i = this.enemies.length;
        while (i--) {
            const enemy = this.enemies[i];
            enemy.position.z -= delta * enemy.userData.speed * gameSpeed;

            if (enemy.position.z < -20) {
                this.scene.remove(enemy);
                this.enemies.splice(i, 1);
            }
        }
    }

    checkCollisions(playerBounds, onCollision) {
        const enemyBounds = new THREE.Box3();
        for (const enemy of this.enemies) {
            enemyBounds.setFromObject(enemy);
            if (playerBounds.intersectsBox(enemyBounds)) {
                onCollision(enemy);
                return;
            }
        }
    }

    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index !== -1) {
            this.scene.remove(enemy);
            this.enemies.splice(index, 1);
        }
    }

    getEnemies() {
        return this.enemies;
    }

    setEnemyParameters(params) {
        if (params.maxEnemies !== undefined) this.maxEnemies = params.maxEnemies;
        if (params.baseMovementSpeed !== undefined) this.baseMovementSpeed = params.baseMovementSpeed;
        if (params.speedVariation !== undefined) this.speedVariation = params.speedVariation;
        if (params.spawnInterval !== undefined) {
            this.minSpawnInterval = params.spawnInterval * 0.8;
            this.maxSpawnInterval = params.spawnInterval * 1.2;
        }
    }
}
