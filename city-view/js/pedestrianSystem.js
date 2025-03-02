import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';

export class PedestrianSystem {
    constructor(scene, sidewalks, crosswalks) {
        this.scene = scene;
        this.sidewalks = sidewalks;
        this.crosswalks = crosswalks;
        this.pedestrians = [];
        
        // Pedestrian materials
        this.pedestrianMaterials = [
            new THREE.MeshStandardMaterial({ color: 0x2244aa }), // Blue
            new THREE.MeshStandardMaterial({ color: 0xaa4422 }), // Red
            new THREE.MeshStandardMaterial({ color: 0x22aa44 }), // Green
            new THREE.MeshStandardMaterial({ color: 0xaaaa22 }), // Yellow
            new THREE.MeshStandardMaterial({ color: 0x882288 }), // Purple
            new THREE.MeshStandardMaterial({ color: 0x228888 }), // Cyan
            new THREE.MeshStandardMaterial({ color: 0x555555 }), // Gray
            new THREE.MeshStandardMaterial({ color: 0xaa88aa })  // Pink
        ];
        
        // Initialize pedestrians
        this.initPedestrians();
    }
    
    initPedestrians() {
        // Create a much larger number of pedestrians
        const pedestrianCount = 200; // 10x more than before
        
        // Create pedestrians in batches to avoid freezing the browser
        const createBatch = (start, batchSize) => {
            for (let i = start; i < start + batchSize && i < pedestrianCount; i++) {
                this.createRandomPedestrian();
            }
            
            // If there are more pedestrians to create, schedule the next batch
            if (start + batchSize < pedestrianCount) {
                setTimeout(() => createBatch(start + batchSize, batchSize), 10);
            }
        };
        
        // Start creating pedestrians in batches of 20
        createBatch(0, 20);
    }
    
    createRandomPedestrian() {
        // Randomly choose a sidewalk
        if (this.sidewalks.length === 0) return;
        
        const sidewalkIndex = Math.floor(Math.random() * this.sidewalks.length);
        const sidewalk = this.sidewalks[sidewalkIndex];
        
        // Create a pedestrian
        const pedestrian = this.createPedestrian(sidewalk);
        this.pedestrians.push(pedestrian);
    }
    
    createPedestrian(sidewalk) {
        const height = 1.7 + Math.random() * 0.3;
        const bodyWidth = 0.4;
        const bodyDepth = 0.2;
        
        // Create pedestrian group
        const pedestrian = new THREE.Group();
        
        // Create body
        const bodyGeometry = new THREE.BoxGeometry(bodyWidth, height * 0.6, bodyDepth);
        const bodyMaterial = this.pedestrianMaterials[Math.floor(Math.random() * this.pedestrianMaterials.length)];
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = height * 0.3;
        body.castShadow = true;
        pedestrian.add(body);
        
        // Create head
        const headGeometry = new THREE.SphereGeometry(bodyWidth * 0.4);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = height * 0.6 + bodyWidth * 0.4;
        head.castShadow = true;
        pedestrian.add(head);
        
        // Create legs
        const legGeometry = new THREE.BoxGeometry(bodyWidth * 0.3, height * 0.4, bodyDepth * 0.8);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-bodyWidth * 0.2, -height * 0.2, 0);
        leftLeg.castShadow = true;
        pedestrian.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(bodyWidth * 0.2, -height * 0.2, 0);
        rightLeg.castShadow = true;
        pedestrian.add(rightLeg);
        
        // Set initial position on sidewalk
        if (sidewalk.direction === 'horizontal') {
            // For horizontal sidewalks, position along the x-axis
            const x = Math.random() * 200 - 100; // Random position along the sidewalk
            pedestrian.position.set(x, 0, sidewalk.position);
            pedestrian.rotation.y = (Math.random() > 0.5) ? 0 : Math.PI; // Face either direction
        } else {
            // For vertical sidewalks, position along the z-axis
            const z = Math.random() * 200 - 100; // Random position along the sidewalk
            pedestrian.position.set(sidewalk.position, 0, z);
            pedestrian.rotation.y = (Math.random() > 0.5) ? Math.PI / 2 : -Math.PI / 2; // Face either direction
        }
        
        // Add to scene
        this.scene.add(pedestrian);
        
        // Store additional properties for movement
        return {
            mesh: pedestrian,
            speed: 0.5 + Math.random() * 0.5, // Random speed between 0.5 and 1.0
            direction: (Math.random() > 0.5) ? 1 : -1, // Random direction
            sidewalk: sidewalk,
            height: height,
            legs: {
                left: leftLeg,
                right: rightLeg,
                phase: Math.random() * Math.PI * 2 // Random starting phase for leg animation
            },
            state: 'walking', // Initial state
            waitTime: 0,
            crosswalkTarget: null
        };
    }
    
    update(delta) {
        // Update each pedestrian
        for (let i = 0; i < this.pedestrians.length; i++) {
            const pedestrian = this.pedestrians[i];
            
            // Skip update if pedestrian is too far from camera (optimization)
            const camera = this.scene.getObjectByName('camera');
            if (camera) {
                const distanceToCamera = camera.position.distanceTo(pedestrian.mesh.position);
                if (distanceToCamera > 150) {
                    continue; // Skip updating pedestrians that are far away
                }
                
                // Handle different states
                switch (pedestrian.state) {
                    case 'walking':
                        this.updateWalking(pedestrian, delta);
                        break;
                    case 'waiting':
                        this.updateWaiting(pedestrian, delta);
                        break;
                    case 'crossing':
                        this.updateCrossing(pedestrian, delta);
                        break;
                }
                
                // Animate legs while walking - only animate if close to camera
                if ((pedestrian.state === 'walking' || pedestrian.state === 'crossing') && distanceToCamera < 50) {
                    this.animateLegs(pedestrian, delta);
                }
            } else {
                // If camera not found, update all pedestrians
                switch (pedestrian.state) {
                    case 'walking':
                        this.updateWalking(pedestrian, delta);
                        break;
                    case 'waiting':
                        this.updateWaiting(pedestrian, delta);
                        break;
                    case 'crossing':
                        this.updateCrossing(pedestrian, delta);
                        break;
                }
            }
        }
    }
    
    updateWalking(pedestrian, delta) {
        const speed = pedestrian.speed * delta * 5;
        const direction = pedestrian.direction;
        
        // Move along the sidewalk
        if (pedestrian.sidewalk.direction === 'horizontal') {
            pedestrian.mesh.position.x += speed * direction;
            
            // Check if reached the end of the sidewalk
            if (Math.abs(pedestrian.mesh.position.x) > 100) {
                // Either turn around or try to cross the road
                if (Math.random() > 0.7 && this.crosswalks.length > 0) {
                    // Find nearest crosswalk
                    let nearestCrosswalk = null;
                    let minDistance = Infinity;
                    
                    for (const crosswalk of this.crosswalks) {
                        if (crosswalk.direction === 'vertical') { // Need a vertical crosswalk to cross from horizontal sidewalk
                            const distance = Math.abs(pedestrian.mesh.position.x - crosswalk.x);
                            if (distance < minDistance) {
                                minDistance = distance;
                                nearestCrosswalk = crosswalk;
                            }
                        }
                    }
                    
                    if (nearestCrosswalk && minDistance < 20) {
                        // Head to the crosswalk
                        pedestrian.state = 'waiting';
                        pedestrian.waitTime = Math.random() * 2 + 1; // Wait 1-3 seconds
                        pedestrian.crosswalkTarget = nearestCrosswalk;
                        
                        // Turn towards the crosswalk
                        if (nearestCrosswalk.x > pedestrian.mesh.position.x) {
                            pedestrian.mesh.rotation.y = 0; // Face right
                            pedestrian.direction = 1;
                        } else {
                            pedestrian.mesh.rotation.y = Math.PI; // Face left
                            pedestrian.direction = -1;
                        }
                    } else {
                        // Turn around
                        pedestrian.direction *= -1;
                        pedestrian.mesh.rotation.y = (pedestrian.direction > 0) ? 0 : Math.PI;
                    }
                } else {
                    // Turn around
                    pedestrian.direction *= -1;
                    pedestrian.mesh.rotation.y = (pedestrian.direction > 0) ? 0 : Math.PI;
                }
            }
        } else {
            pedestrian.mesh.position.z += speed * direction;
            
            // Check if reached the end of the sidewalk
            if (Math.abs(pedestrian.mesh.position.z) > 100) {
                // Either turn around or try to cross the road
                if (Math.random() > 0.7 && this.crosswalks.length > 0) {
                    // Find nearest crosswalk
                    let nearestCrosswalk = null;
                    let minDistance = Infinity;
                    
                    for (const crosswalk of this.crosswalks) {
                        if (crosswalk.direction === 'horizontal') { // Need a horizontal crosswalk to cross from vertical sidewalk
                            const distance = Math.abs(pedestrian.mesh.position.z - crosswalk.z);
                            if (distance < minDistance) {
                                minDistance = distance;
                                nearestCrosswalk = crosswalk;
                            }
                        }
                    }
                    
                    if (nearestCrosswalk && minDistance < 20) {
                        // Head to the crosswalk
                        pedestrian.state = 'waiting';
                        pedestrian.waitTime = Math.random() * 2 + 1; // Wait 1-3 seconds
                        pedestrian.crosswalkTarget = nearestCrosswalk;
                        
                        // Turn towards the crosswalk
                        if (nearestCrosswalk.z > pedestrian.mesh.position.z) {
                            pedestrian.mesh.rotation.y = Math.PI / 2; // Face forward
                            pedestrian.direction = 1;
                        } else {
                            pedestrian.mesh.rotation.y = -Math.PI / 2; // Face backward
                            pedestrian.direction = -1;
                        }
                    } else {
                        // Turn around
                        pedestrian.direction *= -1;
                        pedestrian.mesh.rotation.y = (pedestrian.direction > 0) ? Math.PI / 2 : -Math.PI / 2;
                    }
                } else {
                    // Turn around
                    pedestrian.direction *= -1;
                    pedestrian.mesh.rotation.y = (pedestrian.direction > 0) ? Math.PI / 2 : -Math.PI / 2;
                }
            }
        }
    }
    
    updateWaiting(pedestrian, delta) {
        pedestrian.waitTime -= delta;
        
        if (pedestrian.waitTime <= 0) {
            // Start crossing
            pedestrian.state = 'crossing';
            
            // Set direction based on crosswalk orientation
            if (pedestrian.crosswalkTarget.direction === 'horizontal') {
                pedestrian.mesh.rotation.y = (pedestrian.direction > 0) ? Math.PI / 2 : -Math.PI / 2;
            } else {
                pedestrian.mesh.rotation.y = (pedestrian.direction > 0) ? 0 : Math.PI;
            }
        }
    }
    
    updateCrossing(pedestrian, delta) {
        const speed = pedestrian.speed * delta * 5;
        const direction = pedestrian.direction;
        
        // Move across the crosswalk
        if (pedestrian.crosswalkTarget.direction === 'horizontal') {
            pedestrian.mesh.position.z += speed * direction;
            
            // Check if reached the other side
            const targetZ = pedestrian.crosswalkTarget.z + direction * 10; // Other side of the road
            if ((direction > 0 && pedestrian.mesh.position.z >= targetZ) ||
                (direction < 0 && pedestrian.mesh.position.z <= targetZ)) {
                
                // Find a sidewalk on the other side
                for (const sidewalk of this.sidewalks) {
                    if (sidewalk.direction === 'vertical' && 
                        Math.abs(sidewalk.position - pedestrian.mesh.position.x) < 2 &&
                        Math.sign(sidewalk.position - pedestrian.crosswalkTarget.x) === direction) {
                        
                        // Switch to the new sidewalk
                        pedestrian.sidewalk = sidewalk;
                        pedestrian.state = 'walking';
                        
                        // Randomly choose a new direction along the sidewalk
                        pedestrian.direction = (Math.random() > 0.5) ? 1 : -1;
                        pedestrian.mesh.rotation.y = (pedestrian.direction > 0) ? Math.PI / 2 : -Math.PI / 2;
                        break;
                    }
                }
            }
        } else {
            pedestrian.mesh.position.x += speed * direction;
            
            // Check if reached the other side
            const targetX = pedestrian.crosswalkTarget.x + direction * 10; // Other side of the road
            if ((direction > 0 && pedestrian.mesh.position.x >= targetX) ||
                (direction < 0 && pedestrian.mesh.position.x <= targetX)) {
                
                // Find a sidewalk on the other side
                for (const sidewalk of this.sidewalks) {
                    if (sidewalk.direction === 'horizontal' && 
                        Math.abs(sidewalk.position - pedestrian.mesh.position.z) < 2 &&
                        Math.sign(sidewalk.position - pedestrian.crosswalkTarget.z) === direction) {
                        
                        // Switch to the new sidewalk
                        pedestrian.sidewalk = sidewalk;
                        pedestrian.state = 'walking';
                        
                        // Randomly choose a new direction along the sidewalk
                        pedestrian.direction = (Math.random() > 0.5) ? 1 : -1;
                        pedestrian.mesh.rotation.y = (pedestrian.direction > 0) ? 0 : Math.PI;
                        break;
                    }
                }
            }
        }
    }
    
    animateLegs(pedestrian, delta) {
        const legSpeed = 10; // Speed of leg animation
        
        // Update leg phase
        pedestrian.legs.phase += legSpeed * delta;
        
        // Calculate leg positions based on phase
        const leftLegAngle = Math.sin(pedestrian.legs.phase) * 0.5;
        const rightLegAngle = Math.sin(pedestrian.legs.phase + Math.PI) * 0.5;
        
        // Apply rotation to legs
        pedestrian.legs.left.rotation.x = leftLegAngle;
        pedestrian.legs.right.rotation.x = rightLegAngle;
    }
}
