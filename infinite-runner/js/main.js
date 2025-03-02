import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';
import { Player } from './player.js';
import { Platform } from './platform.js';
import { EnemySystem } from './enemySystem.js';
import { WeaponSystem } from './weaponSystem.js';
import { LightingSystem } from './lightingSystem.js';
import { PowerUpSystem } from './powerUpSystem.js';
import { DamagePopup } from './damagePopup.js';

class Game {
    constructor() {
        // Loading manager setup
        this.loadingManager = new THREE.LoadingManager();
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.loadingProgressBar = document.getElementById('loading-progress-bar');
        
        // Counter for tracking initialization steps
        this.initStepsCompleted = 0;
        this.totalInitSteps = 8; // Adjust based on your initialization steps
        
        this.initGame();

        // Add time tracking
        this.startTime = Date.now();
        this.timeDisplay = document.getElementById('time-display');
        
        // Start time update interval
        setInterval(() => this.updatePlayTime(), 1000);
    }

    updateLoadingProgress() {
        this.initStepsCompleted++;
        const progress = (this.initStepsCompleted / this.totalInitSteps) * 100;
        this.loadingProgressBar.style.width = `${progress}%`;
        
        if (this.initStepsCompleted >= this.totalInitSteps) {
            setTimeout(() => {
                this.loadingOverlay.classList.add('fade-out');
                setTimeout(() => {
                    this.loadingOverlay.style.display = 'none';
                }, 500);
            }, 100);
        }
    }

    initGame() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        this.updateLoadingProgress(); // Step 1

        // Set initial background color
        this.scene.background = new THREE.Color(0x87CEEB);
        this.updateLoadingProgress(); // Step 2

        // Initialize lighting first
        this.lightingSystem = new LightingSystem(this.scene);
        this.updateLoadingProgress(); // Step 3

        // Game systems
        this.platform = new Platform(this.scene);
        this.updateLoadingProgress(); // Step 4

        this.player = new Player(this.scene);
        this.updateLoadingProgress(); // Step 5

        this.enemySystem = new EnemySystem(this.scene);
        this.weaponSystem = new WeaponSystem(this.scene);
        this.powerUpSystem = new PowerUpSystem(this.scene);
        this.damagePopup = new DamagePopup(this.scene);
        this.updateLoadingProgress(); // Step 6

        // Configure systems
        this.weaponSystem.damagePopup = this.damagePopup;
        this.player.setWeaponSystem(this.weaponSystem);
        this.updateLoadingProgress(); // Step 7

        // Game state initialization
        this.score = 0;
        this.gameSpeed = 0.5;
        this.isGameOver = false;

        // Camera setup
        this.camera.position.set(0, 15, -20);
        this.camera.lookAt(0, 0, 20);

        // Event listeners
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('keydown', (e) => this.handleInput(e));
        this.updateLoadingProgress(); // Step 8

        // Start animation
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
        // Update enemy system difficulty based on new score
        this.enemySystem.updateDifficulty(this.score);
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
            this.damagePopup.update(delta);
            
            this.powerUpSystem.checkProjectileCollisions(
                this.weaponSystem.projectiles,
                this.weaponSystem
            );
            
            this.checkCollisions();
            this.renderer.render(this.scene, this.camera);
        }
    }

    updatePlayTime() {
        if (this.isGameOver) return;
        
        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        
        this.timeDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Start the game when the window loads
window.addEventListener('load', () => {
    new Game();
});
