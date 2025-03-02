import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';
import { Player } from './player.js';
import { Platform } from './platform.js';
import { EnemySystem } from './enemySystem.js';
import { WeaponSystem } from './weaponSystem.js';
import { LightingSystem } from './lightingSystem.js';
import { PowerUpSystem } from './powerUpSystem.js';

class Game {
    constructor() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // Set initial background color
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

        // Initialize lighting first
        this.lightingSystem = new LightingSystem(this.scene);

        // Game systems
        this.platform = new Platform(this.scene);
        this.player = new Player(this.scene);
        this.enemySystem = new EnemySystem(this.scene);
        this.weaponSystem = new WeaponSystem(this.scene);
        this.powerUpSystem = new PowerUpSystem(this.scene);

        // Configure enemy parameters with more reasonable initial values
        this.enemySystem.setEnemyParameters({
            maxEnemies: 20,
            baseMovementSpeed: 5,
            speedVariation: 1,
            spawnInterval: 1.0
        });

        // Set the weapon system for the player
        this.player.setWeaponSystem(this.weaponSystem);

        // Game state
        this.score = 0;
        this.gameSpeed = 0.5; // Start with a lower game speed
        this.isGameOver = false;

        // Camera setup
        this.camera.position.set(0, 15, -20);
        this.camera.lookAt(0, 0, 20);

        // Event listeners
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('keydown', (e) => this.handleInput(e));

        // Time controls
        this.setupTimeControls();

        // Set initial time of day
        this.lightingSystem.updateTimeOfDay(12); // Start at noon

        // Gradually increase game speed
        this.setupDifficultyProgression();

        // Start game loop
        this.animate();
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    handleInput(event) {
        if (this.isGameOver) return;

        switch (event.code) {
            case 'ArrowLeft':
                this.player.moveLeft();
                break;
            case 'ArrowRight':
                this.player.moveRight();
                break;
            case 'Space':
                this.weaponSystem.shoot(this.player.position);
                break;
            case 'KeyT': // Add toggle for auto-shoot
                const isEnabled = this.player.toggleAutoShoot();
                console.log(`Auto-shoot ${isEnabled ? 'enabled' : 'disabled'}`);
                break;
        }
    }

    setupTimeControls() {
        const timeSlider = document.getElementById('time-slider');
        const timeDisplay = document.getElementById('time-display');

        timeSlider.addEventListener('input', () => {
            const time = parseFloat(timeSlider.value);
            const hours = Math.floor(time);
            const minutes = Math.floor((time - hours) * 60);
            timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            this.lightingSystem.updateTimeOfDay(time);
        });
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('score-display').textContent = `Score: ${this.score}`;
    }

    checkCollisions() {
        // Check player-enemy collisions
        const playerBounds = this.player.getBounds();
        this.enemySystem.checkCollisions(playerBounds, (enemy) => {
            this.isGameOver = true;
            console.log('Game Over!');
        });

        // Check projectile-enemy collisions
        this.weaponSystem.checkCollisions(this.enemySystem.getEnemies(), (enemy) => {
            // Only remove enemy if it's defeated
            if (enemy.userData.currentHealth <= 0) {
                this.enemySystem.removeEnemy(enemy);
                // Score based on enemy type
                const baseScore = {
                    'WEAK': 100,
                    'MEDIUM': 300,
                    'STRONG': 500
                }[enemy.userData.type] || 100;
                this.updateScore(baseScore);
            }
        });
    }

    setupDifficultyProgression() {
        setInterval(() => {
            if (!this.isGameOver && this.gameSpeed < 2) {
                this.gameSpeed += 0.1;
            }
        }, 10000); // Increase speed every 10 seconds
    }

    animate() {
        if (!this.isGameOver) {
            requestAnimationFrame(() => this.animate());

            const delta = Math.min(0.016, 1/60); // Cap delta time
            
            // Update game systems
            this.player.update(delta);
            this.platform.update(delta, this.gameSpeed);
            this.enemySystem.update(delta, this.gameSpeed);
            this.weaponSystem.update(delta, this.platform);
            this.powerUpSystem.update(delta, this.weaponSystem);
            
            this.powerUpSystem.checkProjectileCollisions(
                this.weaponSystem.projectiles,
                this.weaponSystem
            );
            
            this.checkCollisions();
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Start the game when the window loads
window.addEventListener('load', () => {
    new Game();
});
