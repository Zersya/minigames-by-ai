import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';

export class Platform {
    constructor(scene) {
        this.scene = scene;
        this.segments = [];
        this.gates = [];
        this.segmentLength = 50;
        this.numSegments = 4;
        this.totalLength = this.segmentLength * this.numSegments;
        
        // Gate properties
        this.gateHeight = 6;
        this.gateWidth = 3;
        this.gateThickness = 0.2;
        this.fixedGateDistance = 5; // Distance in front of player
        
        // Gate spawn control
        this.gateSpawnTimer = 0;
        this.gateSpawnInterval = 1.5; // Spawn new gate every 1.5 seconds
        this.maxGatesPerLane = 3; // Maximum gates that can stack in one lane
        this.gateLifespan = 5000; // Gate lives for 5 seconds
        
        // Create gate frame geometry
        this.gateGeometry = new THREE.Group();
        
        // Create materials with glow effect
        const gateMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.7,
            metalness: 0.8,
            roughness: 0.2
        });

        // Create the outer frame
        const frameGeometry = new THREE.BoxGeometry(this.gateWidth + this.gateThickness, this.gateHeight + this.gateThickness, this.gateThickness);
        const frame = new THREE.Mesh(frameGeometry, gateMaterial);
        
        // Create the inner portal effect
        const portalGeometry = new THREE.PlaneGeometry(this.gateWidth, this.gateHeight);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portal.position.z = this.gateThickness / 2;

        // Side pillars
        const pillarGeometry = new THREE.BoxGeometry(this.gateThickness, this.gateHeight, this.gateThickness);
        const leftPillar = new THREE.Mesh(pillarGeometry, gateMaterial);
        const rightPillar = new THREE.Mesh(pillarGeometry, gateMaterial);
        
        leftPillar.position.x = -(this.gateWidth/2 + this.gateThickness/2);
        rightPillar.position.x = (this.gateWidth/2 + this.gateThickness/2);

        // Add all elements to the gate group
        this.gateGeometry.add(frame);
        this.gateGeometry.add(portal);
        this.gateGeometry.add(leftPillar);
        this.gateGeometry.add(rightPillar);

        this.createPlatform();
    }

    createPlatform() {
        const geometry = new THREE.BoxGeometry(12, 1, this.segmentLength);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.8,
            metalness: 0.2
        });

        for (let i = 0; i < this.numSegments; i++) {
            const segment = new THREE.Mesh(geometry, material);
            segment.position.z = i * this.segmentLength;
            segment.receiveShadow = true;
            this.scene.add(segment);
            this.segments.push(segment);
        }
    }

    spawnGate() {
        const lanes = [-4, 0, 4];
        const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
        
        // Check how many gates are in this lane
        const gatesInLane = this.gates.filter(gate => gate.position.x === randomLane);
        if (gatesInLane.length >= this.maxGatesPerLane) {
            return;
        }

        // Calculate z position based on existing gates in the lane
        let zOffset = this.fixedGateDistance;
        if (gatesInLane.length > 0) {
            // Stack gates with small spacing between them
            zOffset += gatesInLane.length * (this.gateThickness + 0.5);
        }

        const gate = this.gateGeometry.clone();
        gate.position.set(randomLane, 0, zOffset);
        gate.userData = {
            isGate: true,
            spawnTime: Date.now(),
            lane: randomLane,
            multiplier: Math.pow(2, gatesInLane.length + 1) // Multiplier increases with stack
        };
        
        this.scene.add(gate);
        this.gates.push(gate);
    }

    update(delta, gameSpeed) {
        // Update platform segments
        for (let segment of this.segments) {
            segment.position.z -= delta * 20 * gameSpeed;
            if (segment.position.z < -this.segmentLength) {
                segment.position.z += this.totalLength;
            }
        }

        // Spawn new gates
        this.gateSpawnTimer += delta;
        if (this.gateSpawnTimer >= this.gateSpawnInterval) {
            this.gateSpawnTimer = 0;
            this.spawnGate();
        }

        // Update gates - remove expired ones
        const currentTime = Date.now();
        for (let i = this.gates.length - 1; i >= 0; i--) {
            const gate = this.gates[i];
            const age = currentTime - gate.userData.spawnTime;
            
            // Remove gate if it has expired
            if (age >= this.gateLifespan) {
                this.scene.remove(gate);
                this.gates.splice(i, 1);
                
                // Adjust positions of remaining gates in the same lane
                const sameLineGates = this.gates.filter(g => g.position.x === gate.userData.lane);
                sameLineGates.forEach((g, index) => {
                    g.position.z = this.fixedGateDistance + index * (this.gateThickness + 0.5);
                    g.userData.multiplier = Math.pow(2, index + 1); // Update multipliers
                });
            }
        }
    }

    getGates() {
        return this.gates;
    }
}
