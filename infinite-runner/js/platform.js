import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';

export class Platform {
    constructor(scene) {
        this.scene = scene;
        this.segments = [];
        this.gates = [];
        this.segmentLength = 50;
        this.numSegments = 6;  // Increased number of segments to ensure smooth transition
        this.totalLength = this.segmentLength * this.numSegments;
        
        // Platform movement properties
        this.baseSpeed = 20;
        this.currentSpeed = this.baseSpeed;
        this.maxSpeed = 40;
        this.acceleration = 0.1;
        
        // Gate properties
        this.gateHeight = 6;
        this.gateWidth = 3;
        this.gateThickness = 0.2;
        this.fixedGateDistance = 2; // Distance from player start position
        this.gateStackSpacing = 8;  // Space between stacked gates
        
        // Gate spawn control
        this.gateSpawnTimer = 0;
        this.gateSpawnInterval = 1.5;
        this.maxGatesPerLane = 2;
        this.gateLifespan = 5000;
        
        // Visual effects
        this.platformTexture = this.createPlatformTexture();
        this.gateGeometry = this.createGateGeometry();
        
        // New platform properties
        this.platformWidth = 12;
        this.platformHeight = 1;
        
        // Rail properties
        this.railHeight = 0.8;
        this.railWidth = 0.3;
        this.rails = [];
        
        // Light strip properties
        this.lightStrips = [];
        this.stripSpacing = 5;
        this.stripWidth = 0.2;
        this.stripColors = [0x00ff00, 0x00ffff, 0xff00ff];
        
        // Decorative element properties
        this.decorations = [];
        this.decorSpacing = 10;
        
        // Bright daytime fog settings
        this.fogColor = 0xFBFBFB;  // Sky blue color
        this.fogNear = 80;  // Start of fog further away
        this.fogFar = 150;  // End of fog further away for smoother transition
        
        // Add fog to scene
        scene.fog = new THREE.Fog(this.fogColor, this.fogNear, this.fogFar);
        
        // Add bright sky background color
        scene.background = new THREE.Color(this.fogColor);

        // Adjust materials for daylight environment
        this.materials = {
            platform: new THREE.MeshStandardMaterial({ 
                map: this.platformTexture,
                roughness: 0.6,
                metalness: 0.3,
                bumpMap: this.platformTexture,
                bumpScale: 0.02,
                fog: true
            }),
            rail: new THREE.MeshStandardMaterial({
                color: 0x666666,
                metalness: 0.8,
                roughness: 0.2,
                fog: true
            }),
            glow: new THREE.MeshStandardMaterial({
                transparent: true,
                opacity: 0.5,
                emissive: 0x00ffff,
                emissiveIntensity: 0.3,
                fog: true
            })
        };

        // Create sun
        this.createSun(scene);

        // Initialize platform elements
        this.createPlatform();
        this.createRails();
        this.createLightStrips();
        this.createDecorations();
    }

    createSun(scene) {
        // Create sun light
        // const sunLight = new THREE.DirectionalLight(0xffffff, 0.1);
        // sunLight.position.set(50, 100, 50);
        // sunLight.castShadow = true;

        // Configure shadow properties
        // sunLight.shadow.mapSize.width = 2048;
        // sunLight.shadow.mapSize.height = 2048;
        // sunLight.shadow.camera.near = 0.5;
        // sunLight.shadow.camera.far = 500;
        // sunLight.shadow.bias = -0.0001;

        // Adjust shadow camera frustum
        // const shadowSize = 100;
        // sunLight.shadow.camera.left = -shadowSize;
        // sunLight.shadow.camera.right = shadowSize;
        // sunLight.shadow.camera.top = shadowSize;
        // sunLight.shadow.camera.bottom = -shadowSize;

        // scene.add(sunLight);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
    }

    createPlatformTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Create softer grid pattern
        ctx.fillStyle = '#787878'; // Slightly darker base color
        ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = '#898989'; // Softer grid lines
        ctx.lineWidth = 1; // Thinner lines

        // Draw horizontal lines
        for (let i = 0; i < 512; i += 32) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(512, i);
            ctx.stroke();
        }

        // Draw vertical lines
        for (let i = 0; i < 512; i += 32) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 512);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 10);
        
        return texture;
    }

    createGateGeometry() {
        const gateGroup = new THREE.Group();
        
        const gateMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xE5D0AC,
            emissive: 0xE5D0AC,
            emissiveIntensity: 0.7,
            metalness: 0.8,
            roughness: 0.2,
            fog: true  // Enable fog for gates
        });

        // Enhanced frame with beveled edges
        const frameGeometry = new THREE.BoxGeometry(
            this.gateWidth + this.gateThickness,
            this.gateHeight + this.gateThickness,
            this.gateThickness,
            4, 4, 1
        );
        const frame = new THREE.Mesh(frameGeometry, gateMaterial);

        // Animated portal effect
        const portalGeometry = new THREE.PlaneGeometry(this.gateWidth, this.gateHeight, 32, 32);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portal.position.z = this.gateThickness / 2;
        portal.userData.isPortal = true;

        // Enhanced pillars
        const pillarGeometry = new THREE.CylinderGeometry(
            this.gateThickness / 2,
            this.gateThickness / 2,
            this.gateHeight,
            8
        );
        const leftPillar = new THREE.Mesh(pillarGeometry, gateMaterial);
        const rightPillar = new THREE.Mesh(pillarGeometry, gateMaterial);
        
        leftPillar.position.x = -(this.gateWidth/2 + this.gateThickness/2);
        rightPillar.position.x = (this.gateWidth/2 + this.gateThickness/2);

        gateGroup.add(frame);
        gateGroup.add(portal);
        gateGroup.add(leftPillar);
        gateGroup.add(rightPillar);

        return gateGroup;
    }

    createPlatform() {
        const geometry = new THREE.BoxGeometry(this.platformWidth, this.platformHeight, this.segmentLength);

        for (let i = 0; i < this.numSegments; i++) {
            const segment = new THREE.Mesh(geometry, this.materials.platform);
            segment.position.z = i * this.segmentLength;
            segment.receiveShadow = true;
            this.scene.add(segment);
            this.segments.push(segment);
        }
    }

    createRails() {
        const railGeometry = new THREE.BoxGeometry(this.railWidth, this.railHeight, this.segmentLength);
        const railOffset = (this.platformWidth / 2) + (this.railWidth / 2);

        for (let i = 0; i < this.numSegments; i++) {
            // Left rail
            const leftRail = new THREE.Mesh(railGeometry, this.materials.rail);
            leftRail.position.set(-railOffset, this.railHeight/2, i * this.segmentLength);
            this.scene.add(leftRail);
            this.rails.push(leftRail);

            // Right rail
            const rightRail = new THREE.Mesh(railGeometry, this.materials.rail);
            rightRail.position.set(railOffset, this.railHeight/2, i * this.segmentLength);
            this.scene.add(rightRail);
            this.rails.push(rightRail);
        }
    }

    createLightStrips() {
        const stripGeometry = new THREE.BoxGeometry(this.stripWidth, 0.1, 1);
        const stripsPerSegment = Math.floor(this.segmentLength / this.stripSpacing);

        for (let i = 0; i < this.numSegments; i++) {
            for (let j = 0; j < stripsPerSegment; j++) {
                // Left strip
                const leftStrip = new THREE.Mesh(stripGeometry, this.materials.glow.clone());
                leftStrip.material.emissive.setHex(this.stripColors[j % this.stripColors.length]);
                leftStrip.position.set(
                    -(this.platformWidth/2 - 0.5),
                    0.01,
                    i * this.segmentLength + j * this.stripSpacing
                );
                this.scene.add(leftStrip);
                this.lightStrips.push(leftStrip);

                // Right strip
                const rightStrip = new THREE.Mesh(stripGeometry, this.materials.glow.clone());
                rightStrip.material.emissive.setHex(this.stripColors[j % this.stripColors.length]);
                rightStrip.position.set(
                    (this.platformWidth/2 - 0.5),
                    0.01,
                    i * this.segmentLength + j * this.stripSpacing
                );
                this.scene.add(rightStrip);
                this.lightStrips.push(rightStrip);
            }
        }
    }

    createDecorations() {
        const decorGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8);
        const decorMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.9,
            roughness: 0.1
        });

        for (let i = 0; i < this.numSegments; i++) {
            for (let j = 0; j < Math.floor(this.segmentLength / this.decorSpacing); j++) {
                const decor = new THREE.Mesh(decorGeometry, decorMaterial);
                decor.position.set(
                    0,
                    0.35,
                    i * this.segmentLength + j * this.decorSpacing
                );
                this.scene.add(decor);
                this.decorations.push(decor);
            }
        }
    }

    spawnGate() {
        const lanes = [-4, 0, 4];
        const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
        
        const gatesInLane = this.gates.filter(gate => gate.position.x === randomLane);
        if (gatesInLane.length >= this.maxGatesPerLane) return;

        // Calculate fixed position based on existing gates in the lane
        const zPosition = this.fixedGateDistance + 
            (gatesInLane.length * (this.gateThickness + this.gateStackSpacing));

        const gate = this.gateGeometry.clone();
        gate.position.set(randomLane, 0, zPosition);
        gate.userData = {
            isGate: true,
            spawnTime: Date.now(),
            lane: randomLane,
            multiplier: Math.pow(2, gatesInLane.length + 1)
        };
        
        this.scene.add(gate);
        this.gates.push(gate);
    }

    updateSpeed(gameSpeed, score) {
        // Adjust platform speed based on game speed and score
        const targetSpeed = this.baseSpeed * gameSpeed;
        const scoreMultiplier = 1 + (score / 10000); // Gradual speed increase with score
        this.currentSpeed = Math.min(
            this.maxSpeed,
            targetSpeed * scoreMultiplier
        );
    }

    update(delta, gameSpeed) {
        // Update platform texture animation
        this.platformTexture.offset.y += delta * gameSpeed * 0.5;

        // Update platform segments and associated elements
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            segment.position.z -= delta * this.currentSpeed * gameSpeed;
            
            // Update rails
            this.rails[i*2].position.z = segment.position.z;
            this.rails[i*2+1].position.z = segment.position.z;

            // Wrap around before becoming visible in fog
            if (segment.position.z < -this.segmentLength) {
                segment.position.z += this.totalLength;
                this.rails[i*2].position.z += this.totalLength;
                this.rails[i*2+1].position.z += this.totalLength;
            }
        }

        // Update light strips with fog consideration
        for (let strip of this.lightStrips) {
            strip.position.z -= delta * this.currentSpeed * gameSpeed;
            if (strip.position.z < -this.segmentLength) {
                strip.position.z += this.totalLength;
            }
        }

        // Update decorations with fog consideration
        for (let decor of this.decorations) {
            decor.position.z -= delta * this.currentSpeed * gameSpeed;
            if (decor.position.z < -this.segmentLength) {
                decor.position.z += this.totalLength;
            }
        }

        // Update gates
        this.gateSpawnTimer += delta;
        if (this.gateSpawnTimer >= this.gateSpawnInterval / gameSpeed) {
            this.gateSpawnTimer = 0;
            // Only spawn gates within visible range
            if (this.gates.length < this.maxGatesPerLane * 3) {  // 3 lanes
                this.spawnGate();
            }
        }

        // Check for expired gates
        const currentTime = Date.now();
        for (let i = this.gates.length - 1; i >= 0; i--) {
            const gate = this.gates[i];
            const age = currentTime - gate.userData.spawnTime;
            
            if (age >= this.gateLifespan) {
                this.scene.remove(gate);
                this.gates.splice(i, 1);
                
                // Readjust remaining gates in the same lane
                const sameLineGates = this.gates.filter(g => g.position.x === gate.userData.lane);
                sameLineGates.forEach((g, index) => {
                    g.position.z = this.fixedGateDistance + index * (this.gateThickness + this.gateStackSpacing);
                    g.userData.multiplier = Math.pow(2, index + 1);
                });
            }
        }
    }

    getGates() {
        return this.gates;
    }
}
