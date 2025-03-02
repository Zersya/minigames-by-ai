import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';

export class VehicleSystem {
    constructor(scene, roadNetwork) {
        this.scene = scene;
        this.roadNetwork = roadNetwork;
        this.vehicles = [];
        
        // Vehicle materials
        this.materials = {
            body: new THREE.MeshStandardMaterial({ 
                color: 0x2244aa, 
                roughness: 0.5,
                metalness: 0.7
            }),
            window: new THREE.MeshStandardMaterial({ 
                color: 0x88ccff, 
                roughness: 0.2, 
                metalness: 0.8,
                transparent: true,
                opacity: 0.7
            }),
            wheel: new THREE.MeshStandardMaterial({ 
                color: 0x222222, 
                roughness: 0.9,
                metalness: 0.1
            }),
            light: new THREE.MeshStandardMaterial({ 
                color: 0xffffcc, 
                roughness: 0.5,
                metalness: 0.2,
                emissive: 0xffffcc,
                emissiveIntensity: 0.5
            })
        };
        
        // Initialize vehicles
        this.initVehicles();
    }
    
    initVehicles() {
        // Create some initial vehicles
        const vehicleCount = 10;
        
        for (let i = 0; i < vehicleCount; i++) {
            this.createRandomVehicle();
        }
    }
    
    createRandomVehicle() {
        // Randomly choose a road
        const isHorizontal = Math.random() > 0.5;
        const roads = isHorizontal ? this.roadNetwork.horizontal : this.roadNetwork.vertical;
        
        if (roads.length === 0) return;
        
        const roadIndex = Math.floor(Math.random() * roads.length);
        const road = roads[roadIndex];
        
        // Create a car or truck
        const isCarNotTruck = Math.random() > 0.3;
        
        let vehicle;
        if (isCarNotTruck) {
            vehicle = this.createCar(isHorizontal, road);
        } else {
            vehicle = this.createTruck(isHorizontal, road);
        }
        
        this.vehicles.push(vehicle);
    }
    
    createCar(isHorizontal, road) {
        const width = 2;
        const height = 1.5;
        const length = 4;
        
        // Create car group
        const car = new THREE.Group();
        
        // Create car body
        const bodyGeometry = new THREE.BoxGeometry(width, height, length);
        const body = new THREE.Mesh(bodyGeometry, this.materials.body);
        body.castShadow = true;
        body.receiveShadow = true;
        car.add(body);
        
        // Create car roof
        const roofGeometry = new THREE.BoxGeometry(width * 0.8, height * 0.5, length * 0.6);
        const roof = new THREE.Mesh(roofGeometry, this.materials.body);
        roof.position.set(0, height * 0.75, 0);
        roof.castShadow = true;
        car.add(roof);
        
        // Create windows
        const windshieldGeometry = new THREE.PlaneGeometry(width * 0.7, height * 0.4);
        const windshield = new THREE.Mesh(windshieldGeometry, this.materials.window);
        windshield.position.set(0, height * 0.5, length * 0.3 - 0.01);
        windshield.rotation.x = Math.PI * 0.1;
        car.add(windshield);
        
        const rearWindowGeometry = new THREE.PlaneGeometry(width * 0.7, height * 0.4);
        const rearWindow = new THREE.Mesh(rearWindowGeometry, this.materials.window);
        rearWindow.position.set(0, height * 0.5, -length * 0.3 + 0.01);
        rearWindow.rotation.x = -Math.PI * 0.1;
        rearWindow.rotation.y = Math.PI;
        car.add(rearWindow);
        
        // Create wheels
        const wheelRadius = 0.4;
        const wheelThickness = 0.2;
        const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 16);
        
        // Front left wheel
        const frontLeftWheel = new THREE.Mesh(wheelGeometry, this.materials.wheel);
        frontLeftWheel.position.set(-width / 2 - wheelThickness / 2, -height / 2 + wheelRadius, length / 3);
        frontLeftWheel.rotation.z = Math.PI / 2;
        frontLeftWheel.castShadow = true;
        car.add(frontLeftWheel);
        
        // Front right wheel
        const frontRightWheel = new THREE.Mesh(wheelGeometry, this.materials.wheel);
        frontRightWheel.position.set(width / 2 + wheelThickness / 2, -height / 2 + wheelRadius, length / 3);
        frontRightWheel.rotation.z = Math.PI / 2;
        frontRightWheel.castShadow = true;
        car.add(frontRightWheel);
        
        // Rear left wheel
        const rearLeftWheel = new THREE.Mesh(wheelGeometry, this.materials.wheel);
        rearLeftWheel.position.set(-width / 2 - wheelThickness / 2, -height / 2 + wheelRadius, -length / 3);
        rearLeftWheel.rotation.z = Math.PI / 2;
        rearLeftWheel.castShadow = true;
        car.add(rearLeftWheel);
        
        // Rear right wheel
        const rearRightWheel = new THREE.Mesh(wheelGeometry, this.materials.wheel);
        rearRightWheel.position.set(width / 2 + wheelThickness / 2, -height / 2 + wheelRadius, -length / 3);
        rearRightWheel.rotation.z = Math.PI / 2;
        rearRightWheel.castShadow = true;
        car.add(rearRightWheel);
        
        // Add headlights
        const headlightGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        
        // Left headlight
        const leftHeadlight = new THREE.Mesh(headlightGeometry, this.materials.light);
        leftHeadlight.position.set(-width / 3, 0, length / 2 + 0.05);
        car.add(leftHeadlight);
        
        // Right headlight
        const rightHeadlight = new THREE.Mesh(headlightGeometry, this.materials.light);
        rightHeadlight.position.set(width / 3, 0, length / 2 + 0.05);
        car.add(rightHeadlight);
        
        // Position the car on the road
        const roadPosition = isHorizontal ? road.z : road.x;
        const roadLength = road.length;
        
        // Random position along the road
        const positionAlongRoad = Math.random() * roadLength - roadLength / 2;
        
        if (isHorizontal) {
            car.position.set(positionAlongRoad, height / 2 + 0.2, roadPosition);
            car.rotation.y = Math.random() > 0.5 ? 0 : Math.PI;
        } else {
            car.position.set(roadPosition, height / 2 + 0.2, positionAlongRoad);
            car.rotation.y = Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2;
        }
        
        this.scene.add(car);
        
        return {
            mesh: car,
            type: 'car',
            speed: 2 + Math.random() * 3,
            isHorizontal: isHorizontal,
            direction: car.rotation.y,
            roadIndex: isHorizontal ? road.z : road.x
        };
    }
    
    createTruck(isHorizontal, road) {
        const width = 2.5;
        const cabHeight = 2;
        const cabLength = 2;
        const trailerHeight = 2.5;
        const trailerLength = 6;
        const totalLength = cabLength + trailerLength;
        
        // Create truck group
        const truck = new THREE.Group();
        
        // Create cab
        const cabGeometry = new THREE.BoxGeometry(width, cabHeight, cabLength);
        const cab = new THREE.Mesh(cabGeometry, this.materials.body);
        cab.position.set(0, cabHeight / 2, totalLength / 2 - cabLength / 2);
        cab.castShadow = true;
        cab.receiveShadow = true;
        truck.add(cab);
        
        // Create trailer
        const trailerGeometry = new THREE.BoxGeometry(width, trailerHeight, trailerLength);
        const trailer = new THREE.Mesh(trailerGeometry, new THREE.MeshStandardMaterial({ 
            color: 0xdddddd, 
            roughness: 0.7,
            metalness: 0.3
        }));
        trailer.position.set(0, trailerHeight / 2, -trailerLength / 2 + 0.5);
        trailer.castShadow = true;
        trailer.receiveShadow = true;
        truck.add(trailer);
        
        // Create windshield
        const windshieldGeometry = new THREE.PlaneGeometry(width * 0.7, cabHeight * 0.5);
        const windshield = new THREE.Mesh(windshieldGeometry, this.materials.window);
        windshield.position.set(0, cabHeight * 0.7, totalLength / 2 - 0.01);
        windshield.rotation.x = Math.PI * 0.05;
        truck.add(windshield);
        
        // Create wheels
        const wheelRadius = 0.5;
        const wheelThickness = 0.3;
        const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 16);
        
        // Cab wheels
        const frontLeftWheel = new THREE.Mesh(wheelGeometry, this.materials.wheel);
        frontLeftWheel.position.set(-width / 2 - wheelThickness / 2, -cabHeight / 2 + wheelRadius, totalLength / 2 - cabLength / 4);
        frontLeftWheel.rotation.z = Math.PI / 2;
        frontLeftWheel.castShadow = true;
        truck.add(frontLeftWheel);
        
        const frontRightWheel = new THREE.Mesh(wheelGeometry, this.materials.wheel);
        frontRightWheel.position.set(width / 2 + wheelThickness / 2, -cabHeight / 2 + wheelRadius, totalLength / 2 - cabLength / 4);
        frontRightWheel.rotation.z = Math.PI / 2;
        frontRightWheel.castShadow = true;
        truck.add(frontRightWheel);
        
        // Trailer wheels (multiple pairs)
        const trailerWheelPairs = 3;
        const trailerWheelSpacing = trailerLength / (trailerWheelPairs + 1);
        
        for (let i = 1; i <= trailerWheelPairs; i++) {
            const wheelZ = -trailerLength / 2 + i * trailerWheelSpacing;
            
            const leftWheel = new THREE.Mesh(wheelGeometry, this.materials.wheel);
            leftWheel.position.set(-width / 2 - wheelThickness / 2, -trailerHeight / 2 + wheelRadius, wheelZ);
            leftWheel.rotation.z = Math.PI / 2;
            leftWheel.castShadow = true;
            truck.add(leftWheel);
            
            const rightWheel = new THREE.Mesh(wheelGeometry, this.materials.wheel);
            rightWheel.position.set(width / 2 + wheelThickness / 2, -trailerHeight / 2 + wheelRadius, wheelZ);
            rightWheel.rotation.z = Math.PI / 2;
            rightWheel.castShadow = true;
            truck.add(rightWheel);
        }
        
        // Add headlights
        const headlightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        
        // Left headlight
        const leftHeadlight = new THREE.Mesh(headlightGeometry, this.materials.light);
        leftHeadlight.position.set(-width / 3, cabHeight / 4, totalLength / 2 + 0.05);
        truck.add(leftHeadlight);
        
        // Right headlight
        const rightHeadlight = new THREE.Mesh(headlightGeometry, this.materials.light);
        rightHeadlight.position.set(width / 3, cabHeight / 4, totalLength / 2 + 0.05);
        truck.add(rightHeadlight);
        
        // Position the truck on the road
        const roadPosition = isHorizontal ? road.z : road.x;
        const roadLength = road.length;
        
        // Random position along the road
        const positionAlongRoad = Math.random() * roadLength - roadLength / 2;
        
        if (isHorizontal) {
            truck.position.set(positionAlongRoad, trailerHeight / 2 + 0.2, roadPosition);
            truck.rotation.y = Math.random() > 0.5 ? 0 : Math.PI;
        } else {
            truck.position.set(roadPosition, trailerHeight / 2 + 0.2, positionAlongRoad);
            truck.rotation.y = Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2;
        }
        
        this.scene.add(truck);
        
        return {
            mesh: truck,
            type: 'truck',
            speed: 1 + Math.random() * 2,
            isHorizontal: isHorizontal,
            direction: truck.rotation.y,
            roadIndex: isHorizontal ? road.z : road.x
        };
    }
    
    update(delta) {
        // Update vehicle positions
        for (const vehicle of this.vehicles) {
            const { mesh, speed, isHorizontal, direction } = vehicle;
            
            // Skip update if vehicle is too far from camera
            const distanceToCamera = camera.position.distanceTo(mesh.position);
            if (distanceToCamera > 150) {
                continue; // Skip updating vehicles that are far away
            }
            
            // Calculate movement based on direction
            let moveX = 0;
            let moveZ = 0;
            
            if (isHorizontal) {
                // Moving along X axis
                moveX = direction === 0 ? speed * delta : -speed * delta;
            } else {
                // Moving along Z axis
                moveZ = direction === Math.PI / 2 ? speed * delta : -speed * delta;
            }
            
            // Update position
            mesh.position.x += moveX;
            mesh.position.z += moveZ;
            
            // Check if vehicle is out of bounds and reset position
            const roadLength = isHorizontal ? this.roadNetwork.horizontal[0].length : this.roadNetwork.vertical[0].length;
            const halfRoadLength = roadLength / 2;
            
            if (isHorizontal) {
                if (mesh.position.x > halfRoadLength || mesh.position.x < -halfRoadLength) {
                    mesh.position.x = -Math.sign(mesh.position.x) * halfRoadLength;
                }
            } else {
                if (mesh.position.z > halfRoadLength || mesh.position.z < -halfRoadLength) {
                    mesh.position.z = -Math.sign(mesh.position.z) * halfRoadLength;
                }
            }
        }
    }
    
    getRoadNetwork() {
        return this.roadNetwork;
    }
}
