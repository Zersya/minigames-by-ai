import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';

export class EnemySystem {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 0.25;
        this.lanes = [-4, 0, 4];
        this.currentScore = 0;
        
        // Enemy spawn control - Adjusted to match fog
        this.maxEnemies = 50;
        this.minSpawnInterval = 0.5;
        this.maxSpawnInterval = 1.5;
        this.lastSpawnLane = null;
        this.minSpawnDistance = 90;  // Increased to spawn within fog
        this.maxSpawnDistance = 120; // Increased to spawn within fog

        // Enhanced difficulty scaling parameters with adjusted spawn distances
        this.difficultyScaling = {
            EASY: { 
                score: 0,
                multiplier: 1,
                maxEnemies: 15,
                spawnInterval: 1.5,
                minSpawnDistance: 90,
                maxSpawnDistance: 120,
                baseSpeed: 5
            },
            MEDIUM: {
                score: 10000,
                multiplier: 1.5,
                maxEnemies: 25,
                spawnInterval: 1.0,
                minSpawnDistance: 90,
                maxSpawnDistance: 120,
                baseSpeed: 15
            },
            HARD: {
                score: 25000,
                multiplier: 2,
                maxEnemies: 40,
                spawnInterval: 0.75,
                minSpawnDistance: 90,
                maxSpawnDistance: 120,
                baseSpeed: 25
            },
            EXPERT: {  // Added missing EXPERT level
                score: 5000,
                multiplier: 2.5,
                maxEnemies: 60,
                spawnInterval: 0.6,
                minSpawnDistance: 90,
                maxSpawnDistance: 120,
                baseSpeed: 35
            },
            MASTER: {  // Added missing MASTER level
                score: 100000,
                multiplier: 3,
                maxEnemies: 80,
                spawnInterval: 0.5,
                minSpawnDistance: 90,
                maxSpawnDistance: 120,
                baseSpeed: 40
            },
            EXTREME: {
                score: 150000,
                multiplier: 3.5,
                maxEnemies: 100,
                spawnInterval: 0.4,
                minSpawnDistance: 90,
                maxSpawnDistance: 120,
                baseSpeed: 45
            }
        };

        // Initialize with EASY difficulty
        this.currentDifficultyLevel = this.difficultyScaling.EASY;
        
        // Base enemy types
        this.baseEnemyTypes = {
            WEAK: {
                health: 200,
                color: 0x41644A,
                scale: 1,
                probability: 0.4,
                name: "Scout"
            },
            MEDIUM: {
                health: 400,
                color: 0x0D4715,
                scale: 1.2,
                probability: 0.3,
                name: "Soldier"
            },
            STRONG: {
                health: 800,
                color: 0xE07A5F,
                scale: 1.4,
                probability: 0.15,
                name: "Elite"
            },
            TANK: {
                health: 1500,
                color: 0x690B22,
                scale: 1.6,
                probability: 0.1,
                name: "Tank"
            },
            BOSS: {
                health: 3000,
                color: 0x7D1C4A,
                scale: 2.0,
                probability: 0.05,
                name: "Boss"
            }
        };

        // Initialize enemy types with base values
        this.enemyTypes = this.getScaledEnemyTypes(0);
        
        // Enemy movement properties
        this.baseMovementSpeed = this.currentDifficultyLevel.baseSpeed;
        this.speedVariation = 0.2; // 20% speed variation
        
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
        
        // Update difficulty progress display
        this.updateDifficultyProgress(score);
        
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

        // Update base movement speed using the difficulty scaling
        this.baseMovementSpeed = this.interpolateValue(
            this.currentDifficultyLevel.baseSpeed,
            newDifficulty.baseSpeed,
            progressToNextLevel
        );

        this.currentDifficultyLevel = newDifficulty;
    }

    updateDifficultyProgress(score) {
        const difficulties = Object.entries(this.difficultyScaling);
        const progressBar = document.getElementById('difficulty-progress-bar');
        const currentDifficultyElement = document.getElementById('current-difficulty');
        const nextDifficultyElement = document.getElementById('next-difficulty');
        
        // Find current and next difficulty levels
        let currentIndex = 0;
        for (let i = 0; i < difficulties.length; i++) {
            if (score >= difficulties[i][1].score) {
                currentIndex = i;
            } else {
                break;
            }
        }
        
        const currentDifficulty = difficulties[currentIndex];
        const nextDifficulty = difficulties[currentIndex + 1];
        
        if (nextDifficulty) {
            // Calculate progress percentage
            const currentScore = score - currentDifficulty[1].score;
            const scoreRange = nextDifficulty[1].score - currentDifficulty[1].score;
            const progress = (currentScore / scoreRange) * 100;
            
            // Update progress bar
            progressBar.style.width = `${Math.min(progress, 100)}%`;
            
            // Update difficulty labels
            currentDifficultyElement.textContent = currentDifficulty[0];
            nextDifficultyElement.textContent = nextDifficulty[0];
        } else {
            // Max difficulty reached
            progressBar.style.width = '100%';
            currentDifficultyElement.textContent = currentDifficulty[0];
            nextDifficultyElement.textContent = 'MAX';
        }
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

    getRandomLane() {
        let newLane;
        do {
            newLane = this.lanes[Math.floor(Math.random() * this.lanes.length)];
        } while (newLane === this.lastSpawnLane);
        
        this.lastSpawnLane = newLane;
        return newLane;
    }

    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;

        // Get a random enemy type based on probabilities
        const enemyType = this.getRandomEnemyType();
        
        // Create enemy mesh with unique material instance
        const enemy = new THREE.Mesh(
            this.enemyGeometry,
            this.createEnemyMaterial(enemyType)
        );

        // Scale enemy based on type
        enemy.scale.set(enemyType.scale, enemyType.scale, enemyType.scale);

        // Position enemy - Spawn in fog area
        const lane = this.getRandomLane();
        const distance = Math.random() * 
            (this.currentDifficultyLevel.maxSpawnDistance - this.currentDifficultyLevel.minSpawnDistance) + 
            this.currentDifficultyLevel.minSpawnDistance;
        
        enemy.position.set(lane, 1, distance);
        
        // Add speed variation based on current difficulty
        const speedVariation = this.baseMovementSpeed * this.speedVariation;
        const randomSpeedOffset = (Math.random() * speedVariation) - (speedVariation / 2);
        
        enemy.userData = {
            type: enemyType.name,
            enemyName: enemyType.displayName,
            maxHealth: enemyType.health,
            currentHealth: enemyType.health,
            speed: this.baseMovementSpeed + randomSpeedOffset,
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
        const heightOffset = enemy.userData.type === 'BOSS' ? 4 : 2.5;
        backgroundBar.position.y = heightOffset;
        healthBar.position.y = heightOffset;
        
        // Make health bars larger for bigger enemies
        const barScale = enemy.userData.type === 'BOSS' ? 2 : 
                        enemy.userData.type === 'TANK' ? 1.5 : 1;
        
        backgroundBar.scale.x = barScale;
        healthBar.scale.x = barScale; // Set initial health bar scale
        
        // Center the health bar properly
        backgroundBar.position.x = 0;
        healthBar.position.x = 0;
        
        backgroundBar.rotation.x = -Math.PI / 2;
        healthBar.rotation.x = -Math.PI / 2;
        
        enemy.add(backgroundBar);
        enemy.add(healthBar);
        enemy.userData.healthBar = healthBar;
        enemy.userData.healthBarBackground = backgroundBar; // Store reference to background
        enemy.userData.healthBarScale = barScale; // Store the initial scale
        
        // Add enemy type label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = '#ffffff';
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(enemy.userData.type, canvas.width/2, canvas.height/2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.SpriteMaterial({ map: texture });
        const label = new THREE.Sprite(labelMaterial);
        label.position.y = heightOffset + 0.5; // Position label above health bar
        label.scale.set(2, 0.5, 1);
        enemy.add(label);
    }

    updateHealthBar(enemy) {
        if (!enemy.userData.healthBar) return;

        const healthPercent = enemy.userData.currentHealth / enemy.userData.maxHealth;
        const barScale = enemy.userData.healthBarScale || 1;
        
        // Update the health bar scale
        enemy.userData.healthBar.scale.x = Math.max(0, healthPercent * barScale);
        
        // Calculate the offset to keep the health bar aligned to the left
        const totalWidth = barScale; // Total width of the background bar
        const currentWidth = healthPercent * barScale; // Current width of the health bar
        const offset = (totalWidth - currentWidth) / 2;
        
        // Update position to maintain left alignment
        enemy.userData.healthBar.position.x = -offset;
    }

    damageEnemy(enemy, damage) {
        if (!enemy.parent) return false;

        const previousHealth = enemy.userData.currentHealth;
        enemy.userData.currentHealth = Math.max(0, enemy.userData.currentHealth - damage);
        
        // Update health bar immediately after damage
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
        // Spawn new enemies
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }

        // Update enemies
        let i = this.enemies.length;
        while (i--) {
            const enemy = this.enemies[i];
            enemy.position.z -= delta * enemy.userData.speed * gameSpeed;

            // Remove enemies that have moved past the player
            if (enemy.position.z < -20) {
                this.scene.remove(enemy);
                this.enemies.splice(i, 1);
            }
        }
    }

    checkCollisions(playerBounds, onCollision) {
        const enemyBounds = new THREE.Box3();
        const collisionThreshold = 0.8; // Adjust this value to fine-tune collision detection
        const forwardOffset = 1.0; // Add forward collision detection

        for (const enemy of this.enemies) {
            // Skip if enemy is already destroyed
            if (!enemy.parent) continue;

            // Update enemy bounds
            enemyBounds.setFromObject(enemy);
            
            // Slightly shrink the bounds for more precise collision
            const center = enemyBounds.getCenter(new THREE.Vector3());
            const size = enemyBounds.getSize(new THREE.Vector3());
            
            // Adjust bounds to be more sensitive at the front
            enemyBounds.min.z = center.z - (size.z * 0.3); // Reduce back collision area
            enemyBounds.max.z = center.z + (size.z * 0.7); // Extend front collision area
            
            // Apply general collision threshold
            enemyBounds.min.x = center.x - (size.x * collisionThreshold * 0.5);
            enemyBounds.max.x = center.x + (size.x * collisionThreshold * 0.5);
            enemyBounds.min.y = center.y - (size.y * collisionThreshold * 0.5);
            enemyBounds.max.y = center.y + (size.y * collisionThreshold * 0.5);

            if (playerBounds.intersectsBox(enemyBounds)) {
                onCollision(enemy);
                return true; // Return true to indicate collision occurred
            }
        }
        return false; // Return false if no collision occurred
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
