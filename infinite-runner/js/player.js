import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.lanes = [-4, 0, 4]; // Left, center, right lanes
        this.currentLane = 1; // Start in center lane
        
        // Auto-shooting properties
        this.weaponSystem = null; // Will be set from main game
        this.autoShootEnabled = true;
        this.lastShootTime = 0;
        this.shootInterval = 500; // Shoot every 500ms (0.5 seconds)
        
        this.createPlayer();
    }

    createPlayer() {
        // Create player mesh
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
            metalness: 0.5,
            roughness: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 1, -10);
        this.mesh.castShadow = true;
        
        // Add player to scene
        this.scene.add(this.mesh);
    }

    setWeaponSystem(weaponSystem) {
        this.weaponSystem = weaponSystem;
    }

    moveLeft() {
        if (this.currentLane < this.lanes.length - 1) {
            this.currentLane++;
            this.targetX = this.lanes[this.currentLane];
        }
    }

    moveRight() {
        if (this.currentLane > 0) {
            this.currentLane--;
            this.targetX = this.lanes[this.currentLane];
        }
    }

    update(delta) {
        // Smooth lane transition
        if (this.targetX !== undefined) {
            const diff = this.targetX - this.mesh.position.x;
            if (Math.abs(diff) > 0.1) {
                this.mesh.position.x += Math.sign(diff) * delta * 10;
            } else {
                this.mesh.position.x = this.targetX;
            }
        }

        // Auto-shooting logic - simplified and always shoots when enabled
        if (this.autoShootEnabled && this.weaponSystem) {
            const currentTime = performance.now();
            if (currentTime - this.lastShootTime >= this.shootInterval) {
                this.weaponSystem.shoot(this.position);
                this.lastShootTime = currentTime;
            }
        }
    }

    getBounds() {
        const bounds = new THREE.Box3().setFromObject(this.mesh);
        return bounds;
    }

    get position() {
        return this.mesh.position;
    }

    toggleAutoShoot() {
        this.autoShootEnabled = !this.autoShootEnabled;
        return this.autoShootEnabled;
    }
}
