import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';

export class EnemySystem {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 0.25;
        this.lanes = [-4, 0, 4];
        this.currentScore = 0;
        
        // Enemy spawn control
        this.maxEnemies = 50;
        this.minSpawnInterval = 0.5;
        this.maxSpawnInterval = 1.5;
        this.lastSpawnLane = null;
        this.minSpawnDistance = 30;
        this.maxSpawnDistance = 100;

        // Enhanced difficulty scaling parameters
        this.difficultyScaling = {
            EASY: { 
                score: 0,
                multiplier: 1,
                maxEnemies: 20,
                spawnInterval: 1.5,
                minSpawnDistance: 30,
                maxSpawnDistance: 100,
                baseSpeed: 5
            },
            MEDIUM: { 
                score: 10000,
                multiplier: 1.5,
                maxEnemies: 30,
                spawnInterval: 1.2,
                minSpawnDistance: 25,
                maxSpawnDistance: 90,
                baseSpeed: 7
            },
            HARD: { 
                score: 20000,
                multiplier: 2,
                maxEnemies: 35,
                spawnInterval: 1.0,
                minSpawnDistance: 20,
                maxSpawnDistance: 80,
                baseSpeed: 9
            },
            EXPERT: { 
                score: 50000,
                multiplier: 2.5,
                maxEnemies: 40,
                spawnInterval: 0.8,
                minSpawnDistance: 15,
                maxSpawnDistance: 70,
                baseSpeed: 11
            },
            MASTER: { 
                score: 100000,
                multiplier: 3,
                maxEnemies: 50,
                spawnInterval: 0.5,
                minSpawnDistance: 10,
                maxSpawnDistance: 60,
                baseSpeed: 13
            }
        };

        // Initialize with EASY difficulty
        this.currentDifficultyLevel = this.difficultyScaling.EASY;
        
        // Base enemy types
        this.baseEnemyTypes = {
            WEAK: {
                health: 200,
                color: 0xff0000,
                scale: 1,
                probability: 0.4,
                name: "Scout"
            },
            MEDIUM: {
                health: 400,
                color: 0xff6600,
                scale: 1.2,
                probability: 0.3,
                name: "Soldier"
            },
            STRONG: {
                health: 800,
                color: 0xff3300,
                scale: 1.4,
                probability: 0.15,
                name: "Elite"
            },
            TANK: {
                health: 1500,
                color: 0x990000,
                scale: 1.6,
                probability: 0.1,
                name: "Tank"
            },
            BOSS: {
                health: 3000,
                color: 0x660066,
                scale: 2.0,
                probability: 0.05,
                name: "Boss"
            }
        };

        // Initialize enemy types with base values
        this.enemyTypes = this.getScaledEnemyTypes(0);
        
        // Enemy movement properties
        this.baseMovementSpeed = 5;
        this.speedVariation = 1;
        
        // Create shared geometry
        this.enemyGeometry = new THREE.BoxGeometry(1, 2, 1);
        
        // Store material configurations instead of material instances
        this.materialConfigs = {};
        for (const [type, data] of Object.entries(this.baseEnemyTypes)) {
            this.materialConfigs[type] = {
                color: data.color,
                metalness: 0.7,
                roughness: 0.3,
                emissive: data.color,
                emissiveIntensity: 0.3
            };
        }
        
        // Health bar geometries
        this.healthBarGeometry = new THREE.PlaneGeometry(1, 0.2); // Made health bar thicker
        this.healthBarMaterials = {
            background: new THREE.MeshBasicMaterial({ color: 0x660000 }), // Darker red background
            health: new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        };
    }

    createEnemyMaterial(type) {
        // Create a new material instance with the stored configuration
        return new THREE.MeshStandardMaterial({ 
            color: type.color,
            metalness: 0.7,
            roughness: 0.3,
            emissive: type.color,
            emissiveIntensity: 0.3
        });
    }

    getCurrentDifficultyLevel(score) {
        let currentLevel = this.difficultyScaling.EASY;
        for (const [_, data] of Object.entries(this.difficultyScaling)) {
            if (score >= data.score) {
                currentLevel = data;
            } else {
                break;
            }
        }
        return currentLevel;
    }

    getScaledEnemyTypes(score) {
        const difficulty = this.getCurrentDifficultyLevel(score);
        const scaledTypes = {};

        for (const [type, baseData] of Object.entries(this.baseEnemyTypes)) {
            scaledTypes[type] = {
                ...baseData,
                health: Math.round(baseData.health * difficulty.multiplier)
            };
        }

        // Adjust probabilities based on score
        if (score >= this.difficultyScaling.MEDIUM.score) {
            scaledTypes.WEAK.probability = 0.35;
            scaledTypes.MEDIUM.probability = 0.35;
        }
        if (score >= this.difficultyScaling.HARD.score) {
            scaledTypes.WEAK.probability = 0.3;
            scaledTypes.MEDIUM.probability = 0.3;
            scaledTypes.STRONG.probability = 0.2;
        }
        if (score >= this.difficultyScaling.EXPERT.score) {
            scaledTypes.WEAK.probability = 0.25;
            scaledTypes.MEDIUM.probability = 0.25;
            scaledTypes.STRONG.probability = 0.25;
            scaledTypes.TANK.probability = 0.15;
        }
        if (score >= this.difficultyScaling.MASTER.score) {
            scaledTypes.WEAK.probability = 0.2;
            scaledTypes.MEDIUM.probability = 0.2;
            scaledTypes.STRONG.probability = 0.25;
            scaledTypes.TANK.probability = 0.2;
            scaledTypes.BOSS.probability = 0.15;
        }

        return scaledTypes;
    }

    updateDifficulty(score) {
        this.currentScore = score;
        const newDifficulty = this.getCurrentDifficultyLevel(score);
        
        // Update enemy types with new multiplier
        this.enemyTypes = this.getScaledEnemyTypes(score);
        
        // Smoothly interpolate between difficulty levels
        const progressToNextLevel = this.calculateProgressToNextLevel(score);
        
        // Update spawn parameters
        this.maxEnemies = Math.round(this.interpolateValue(
            this.currentDifficultyLevel.maxEnemies,
            newDifficulty.maxEnemies,
            progressToNextLevel
        ));

        this.spawnInterval = this.interpolateValue(
            this.currentDifficultyLevel.spawnInterval,
            newDifficulty.spawnInterval,
            progressToNextLevel
        );

        this.minSpawnDistance = this.interpolateValue(
            this.currentDifficultyLevel.minSpawnDistance,
            newDifficulty.minSpawnDistance,
            progressToNextLevel
        );

        this.maxSpawnDistance = this.interpolateValue(
            this.currentDifficultyLevel.maxSpawnDistance,
            newDifficulty.maxSpawnDistance,
            progressToNextLevel
        );

        this.baseMovementSpeed = this.interpolateValue(
            this.currentDifficultyLevel.baseSpeed,
            newDifficulty.baseSpeed,
            progressToNextLevel
        );

        this.currentDifficultyLevel = newDifficulty;
    }

    calculateProgressToNextLevel(score) {
        const levels = Object.values(this.difficultyScaling);
        for (let i = 0; i < levels.length - 1; i++) {
            if (score >= levels[i].score && score < levels[i + 1].score) {
                return (score - levels[i].score) / (levels[i + 1].score - levels[i].score);
            }
        }
        return 1;
    }

    interpolateValue(start, end, progress) {
        return start + (end - start) * progress;
    }

    getRandomEnemyType() {
        const random = Math.random();
        let cumulative = 0;
        
        for (const [typeName, typeData] of Object.entries(this.enemyTypes)) {
            cumulative += typeData.probability;
            if (random <= cumulative) {
                return {
                    name: typeName,
                    health: typeData.health,
                    color: typeData.color,
                    scale: typeData.scale,
                    probability: typeData.probability,
                    displayName: typeData.name
                };
            }
        }
        
        // Fallback to WEAK type
        const weakType = this.enemyTypes.WEAK;
        return {
            name: 'WEAK',
            health: weakType.health,
            color: weakType.color,
            scale: weakType.scale,
            probability: weakType.probability,
            displayName: weakType.name
        };
    }

    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;

        let lane;
        do {
            lane = Math.floor(Math.random() * this.lanes.length);
        } while (this.lanes.length > 1 && lane === this.lastSpawnLane);
        
        this.lastSpawnLane = lane;

        const enemyType = this.getRandomEnemyType();
        
        // Create a new material instance for each enemy
        const material = this.createEnemyMaterial(enemyType);
        const enemy = new THREE.Mesh(this.enemyGeometry, material);
        
        const spawnDistance = this.minSpawnDistance + 
            Math.random() * (this.maxSpawnDistance - this.minSpawnDistance);
        
        enemy.position.set(
            this.lanes[lane],
            1,
            spawnDistance
        );
        
        enemy.scale.set(enemyType.scale, enemyType.scale, enemyType.scale);
        enemy.castShadow = true;
        
        // Add speed variation based on current difficulty
        const speedVariation = this.baseMovementSpeed * 0.2;
        enemy.userData = {
            type: enemyType.name,
            enemyName: enemyType.displayName,
            maxHealth: enemyType.health,
            currentHealth: enemyType.health,
            speed: this.baseMovementSpeed + (Math.random() * speedVariation - speedVariation/2),
            enemySystem: this,
            originalMaterialProps: {
                color: enemyType.color,
                emissive: enemyType.color,
                emissiveIntensity: 0.3
            }
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
        
        // Position health bars higher above enemies
        backgroundBar.position.y = 2.5;
        healthBar.position.y = 2.5;
        
        // Make health bars larger for bigger enemies
        const barScale = enemy.userData.type === 'BOSS' ? 2 : 
                        enemy.userData.type === 'TANK' ? 1.5 : 1;
        
        backgroundBar.scale.x = barScale;
        
        backgroundBar.rotation.x = -Math.PI / 2;
        healthBar.rotation.x = -Math.PI / 2;
        
        enemy.add(backgroundBar);
        enemy.add(healthBar);
        enemy.userData.healthBar = healthBar;
        
        // Add enemy type label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = '#ffffff';
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(enemy.userData.enemyName, canvas.width/2, canvas.height/2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.SpriteMaterial({ map: texture });
        const label = new THREE.Sprite(labelMaterial);
        label.position.y = 3;
        label.scale.set(2, 0.5, 1);
        enemy.add(label);
    }

    updateHealthBar(enemy) {
        if (enemy.userData.healthBar) {
            const healthPercent = enemy.userData.currentHealth / enemy.userData.maxHealth;
            enemy.userData.healthBar.scale.x = Math.max(0, healthPercent) * 
                (enemy.userData.type === 'BOSS' ? 2 : 
                 enemy.userData.type === 'TANK' ? 1.5 : 1);
            enemy.userData.healthBar.position.x = -(1 - healthPercent) * 0.5;
        }
    }

    damageEnemy(enemy, damage) {
        if (!enemy.parent) return false;

        enemy.userData.currentHealth -= damage;
        this.updateHealthBar(enemy);
        
        // Flash effect using the enemy's own material instance
        const originalProps = enemy.userData.originalMaterialProps;
        
        // Apply flash effect
        enemy.material.color.setHex(0xff0000);
        enemy.material.emissive.setHex(0xff0000);
        enemy.material.emissiveIntensity = 1.0;
        
        // Reset to original properties
        setTimeout(() => {
            if (enemy.parent) {
                enemy.material.color.setHex(originalProps.color);
                enemy.material.emissive.setHex(originalProps.emissive);
                enemy.material.emissiveIntensity = originalProps.emissiveIntensity;
            }
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
        const collisionThreshold = 0.8; // Adjust this value to fine-tune collision detection

        for (const enemy of this.enemies) {
            // Skip if enemy is already destroyed
            if (!enemy.parent) continue;

            // Update enemy bounds
            enemyBounds.setFromObject(enemy);
            
            // Slightly shrink the bounds for more precise collision
            enemyBounds.min.multiplyScalar(collisionThreshold);
            enemyBounds.max.multiplyScalar(collisionThreshold);

            if (playerBounds.intersectsBox(enemyBounds)) {
                onCollision(enemy);
                return;
            }
        }
    }

    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index !== -1) {
            // Dispose of the individual material
            enemy.material.dispose();
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
