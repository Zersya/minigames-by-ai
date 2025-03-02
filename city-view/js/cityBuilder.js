import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

export class CityBuilder {
    constructor(scene, params) {
        this.scene = scene;
        this.params = params;
        
        this.buildings = [];
        this.roads = [];
        this.sidewalks = [];
        this.crosswalks = [];
        this.streetElements = [];
        
        this.roadNetwork = {
            horizontal: [],
            vertical: [],
            intersections: []
        };
        
        // Materials
        this.materials = {
            building: new THREE.MeshStandardMaterial({ 
                color: 0xaaaaaa, 
                roughness: 0.7,
                metalness: 0.2
            }),
            glass: new THREE.MeshStandardMaterial({ 
                color: 0x88ccff, 
                roughness: 0.2, 
                metalness: 0.8
            }),
            road: new THREE.MeshStandardMaterial({ 
                color: 0x333333, 
                roughness: 0.9,
                metalness: 0.1
            }),
            sidewalk: new THREE.MeshStandardMaterial({ 
                color: 0x999999, 
                roughness: 0.8,
                metalness: 0.1
            }),
            crosswalk: new THREE.MeshStandardMaterial({ 
                color: 0xffffff, 
                roughness: 0.8,
                metalness: 0.1
            }),
            grass: new THREE.MeshStandardMaterial({ 
                color: 0x33aa33, 
                roughness: 0.9,
                metalness: 0.0
            }),
            lamppost: new THREE.MeshStandardMaterial({ 
                color: 0x111111, 
                roughness: 0.8,
                metalness: 0.2
            }),
            tree: new THREE.MeshStandardMaterial({ 
                color: 0x228B22, 
                roughness: 0.9,
                metalness: 0.0
            }),
            trunk: new THREE.MeshStandardMaterial({ 
                color: 0x8B4513, 
                roughness: 0.9,
                metalness: 0.1
            })
        };
    }
    
    // Add these getter methods to provide access to the road network, sidewalks, and crosswalks
    getRoadNetwork() {
        return this.roadNetwork;
    }
    
    getSidewalks() {
        return this.sidewalks;
    }
    
    getCrosswalks() {
        return this.crosswalks;
    }
    
    buildCity() {
        // Create ground
        this.createGround();
        
        // Create road network
        this.createRoadNetwork();
        
        // Create buildings in each block
        this.createBuildings();
        
        // Add street elements
        this.addStreetElements();
        
        return {
            buildings: this.buildings,
            roads: this.roads,
            sidewalks: this.sidewalks,
            crosswalks: this.crosswalks,
            streetElements: this.streetElements
        };
    }
    
    createGround() {
        const { gridSize, blockSize, roadWidth } = this.params;
        const totalSize = gridSize * (blockSize + roadWidth) + roadWidth;
        
        const groundGeometry = new THREE.PlaneGeometry(totalSize * 1.5, totalSize * 1.5);
        const groundMaterial = this.materials.grass;
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        ground.userData.isGround = true; // Add this flag to identify the ground
        this.scene.add(ground);
    }
    
    createRoadNetwork() {
        const { gridSize, blockSize, roadWidth } = this.params;
        const totalSize = gridSize * (blockSize + roadWidth) + roadWidth;
        const halfSize = totalSize / 2;
        
        // Create horizontal roads
        for (let i = 0; i <= gridSize; i++) {
            const posZ = -halfSize + roadWidth / 2 + i * (blockSize + roadWidth);
            
            const roadGeometry = new THREE.PlaneGeometry(totalSize, roadWidth);
            const road = new THREE.Mesh(roadGeometry, this.materials.road);
            road.rotation.x = -Math.PI / 2;
            road.position.set(0, 0, posZ);
            road.receiveShadow = true;
            this.scene.add(road);
            this.roads.push(road);
            
            this.roadNetwork.horizontal.push({
                z: posZ,
                width: roadWidth,
                length: totalSize
            });
            
            // Create sidewalks along horizontal roads
            const sidewalkWidth = 2;
            
            // North sidewalk
            const northSidewalkGeometry = new THREE.PlaneGeometry(totalSize, sidewalkWidth);
            const northSidewalk = new THREE.Mesh(northSidewalkGeometry, this.materials.sidewalk);
            northSidewalk.rotation.x = -Math.PI / 2;
            northSidewalk.position.set(0, 0.05, posZ - roadWidth / 2 - sidewalkWidth / 2);
            northSidewalk.receiveShadow = true;
            this.scene.add(northSidewalk);
            this.sidewalks.push({
                mesh: northSidewalk,
                direction: 'horizontal',
                position: posZ - roadWidth / 2 - sidewalkWidth / 2
            });
            
            // South sidewalk
            const southSidewalkGeometry = new THREE.PlaneGeometry(totalSize, sidewalkWidth);
            const southSidewalk = new THREE.Mesh(southSidewalkGeometry, this.materials.sidewalk);
            southSidewalk.rotation.x = -Math.PI / 2;
            southSidewalk.position.set(0, 0.05, posZ + roadWidth / 2 + sidewalkWidth / 2);
            southSidewalk.receiveShadow = true;
            this.scene.add(southSidewalk);
            this.sidewalks.push({
                mesh: southSidewalk,
                direction: 'horizontal',
                position: posZ + roadWidth / 2 + sidewalkWidth / 2
            });
        }
        
        // Create vertical roads
        for (let i = 0; i <= gridSize; i++) {
            const posX = -halfSize + roadWidth / 2 + i * (blockSize + roadWidth);
            
            const roadGeometry = new THREE.PlaneGeometry(roadWidth, totalSize);
            const road = new THREE.Mesh(roadGeometry, this.materials.road);
            road.rotation.x = -Math.PI / 2;
            road.position.set(posX, 0, 0);
            road.receiveShadow = true;
            this.scene.add(road);
            this.roads.push(road);
            
            this.roadNetwork.vertical.push({
                x: posX,
                width: roadWidth,
                length: totalSize
            });
            
            // Create sidewalks along vertical roads
            const sidewalkWidth = 2;
            
            // West sidewalk
            const westSidewalkGeometry = new THREE.PlaneGeometry(sidewalkWidth, totalSize);
            const westSidewalk = new THREE.Mesh(westSidewalkGeometry, this.materials.sidewalk);
            westSidewalk.rotation.x = -Math.PI / 2;
            westSidewalk.position.set(posX - roadWidth / 2 - sidewalkWidth / 2, 0.05, 0);
            westSidewalk.receiveShadow = true;
            this.scene.add(westSidewalk);
            this.sidewalks.push({
                mesh: westSidewalk,
                direction: 'vertical',
                position: posX - roadWidth / 2 - sidewalkWidth / 2
            });
            
            // East sidewalk
            const eastSidewalkGeometry = new THREE.PlaneGeometry(sidewalkWidth, totalSize);
            const eastSidewalk = new THREE.Mesh(eastSidewalkGeometry, this.materials.sidewalk);
            eastSidewalk.rotation.x = -Math.PI / 2;
            eastSidewalk.position.set(posX + roadWidth / 2 + sidewalkWidth / 2, 0.05, 0);
            eastSidewalk.receiveShadow = true;
            this.scene.add(eastSidewalk);
            this.sidewalks.push({
                mesh: eastSidewalk,
                direction: 'vertical',
                position: posX + roadWidth / 2 + sidewalkWidth / 2
            });
        }
        
        // Create crosswalks at intersections
        for (let h of this.roadNetwork.horizontal) {
            for (let v of this.roadNetwork.vertical) {
                // Add intersection to network
                this.roadNetwork.intersections.push({
                    x: v.x,
                    z: h.z
                });
                
                // Create crosswalks
                this.createCrosswalk(v.x, h.z, roadWidth, 'horizontal');
                this.createCrosswalk(v.x, h.z, roadWidth, 'vertical');
            }
        }
    }
    
    createCrosswalk(x, z, roadWidth, direction) {
        const stripeWidth = 0.5;
        const stripeLength = roadWidth * 0.8;
        const stripeCount = 5;
        const stripeSpacing = 0.5;
        const totalWidth = stripeCount * stripeWidth + (stripeCount - 1) * stripeSpacing;
        
        const crosswalkGroup = new THREE.Group();
        crosswalkGroup.position.set(x, 0.01, z); // Slightly above road to prevent z-fighting
        
        for (let i = 0; i < stripeCount; i++) {
            const stripeGeometry = new THREE.PlaneGeometry(
                direction === 'horizontal' ? stripeWidth : stripeLength,
                direction === 'horizontal' ? stripeLength : stripeWidth
            );
            
            const stripe = new THREE.Mesh(stripeGeometry, this.materials.crosswalk);
            stripe.rotation.x = -Math.PI / 2;
            
            if (direction === 'horizontal') {
                stripe.position.set(
                    -totalWidth / 2 + i * (stripeWidth + stripeSpacing) + stripeWidth / 2,
                    0,
                    0
                );
            } else {
                stripe.position.set(
                    0,
                    0,
                    -totalWidth / 2 + i * (stripeWidth + stripeSpacing) + stripeWidth / 2
                );
            }
            
            stripe.receiveShadow = true;
            crosswalkGroup.add(stripe);
        }
        
        this.scene.add(crosswalkGroup);
        this.crosswalks.push({
            mesh: crosswalkGroup,
            x: x,
            z: z,
            direction: direction
        });
    }
    
    createBuildings() {
        const { gridSize, blockSize, roadWidth, maxBuildingHeight, minBuildingHeight } = this.params;
        const totalSize = gridSize * (blockSize + roadWidth) + roadWidth;
        const halfSize = totalSize / 2;
        
        // For larger cities, use a more efficient approach to determine block types
        // Create a pattern of different district types
        const blockTypes = [];
        
        // Create a 2D array to store block types
        for (let i = 0; i < gridSize; i++) {
            blockTypes[i] = [];
            for (let j = 0; j < gridSize; j++) {
                // Determine block type based on position
                // Create distinct districts
                const distanceFromCenter = Math.sqrt(
                    Math.pow((i - gridSize/2) / gridSize, 2) + 
                    Math.pow((j - gridSize/2) / gridSize, 2)
                );
                
                if (distanceFromCenter < 0.2) {
                    // Downtown - mostly skyscrapers
                    blockTypes[i][j] = Math.random() < 0.8 ? 'skyscrapers' : 'shops';
                } else if (distanceFromCenter < 0.5) {
                    // Mixed use area
                    const rand = Math.random();
                    if (rand < 0.4) blockTypes[i][j] = 'skyscrapers';
                    else if (rand < 0.7) blockTypes[i][j] = 'apartments';
                    else blockTypes[i][j] = 'shops';
                } else {
                    // Outer areas - mostly residential
                    const rand = Math.random();
                    if (rand < 0.7) blockTypes[i][j] = 'apartments';
                    else if (rand < 0.9) blockTypes[i][j] = 'shops';
                    else blockTypes[i][j] = 'skyscrapers';
                }
            }
        }
        
        // Create buildings for each block
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const blockX = -halfSize + roadWidth + blockSize / 2 + i * (blockSize + roadWidth);
                const blockZ = -halfSize + roadWidth + blockSize / 2 + j * (blockSize + roadWidth);
                
                // Create different types of blocks
                switch (blockTypes[i][j]) {
                    case 'skyscrapers':
                        this.createSkyscraperBlock(blockX, blockZ, blockSize);
                        break;
                    case 'apartments':
                        this.createApartmentBlock(blockX, blockZ, blockSize);
                        break;
                    case 'shops':
                        this.createShopBlock(blockX, blockZ, blockSize);
                        break;
                }
            }
        }
    }
    
    createSkyscraperBlock(blockX, blockZ, blockSize) {
        const buildingCount = Math.floor(Math.random() * 3) + 1; // 1-3 buildings per block
        const buildingPositions = [];
        
        // Place buildings
        for (let i = 0; i < buildingCount; i++) {
            const width = Math.random() * 5 + 5; // 5-10 units wide
            const depth = Math.random() * 5 + 5; // 5-10 units deep
            const posX = blockX + (Math.random() - 0.5) * (blockSize - width);
            const posZ = blockZ + (Math.random() - 0.5) * (blockSize - depth);
            
            // Check if position is valid (not overlapping with other buildings)
            let validPosition = true;
            for (const pos of buildingPositions) {
                const dx = Math.abs(posX - pos.x);
                const dz = Math.abs(posZ - pos.z);
                
                if (dx < (width + pos.width) / 2 + 1 && dz < (depth + pos.depth) / 2 + 1) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                buildingPositions.push({ x: posX, z: posZ, width, depth });
            }
        }
        
        // Create skyscrapers
        for (const pos of buildingPositions) {
            const height = Math.random() * 30 + 20; // 20-50 units tall
            this.createSkyscraper(pos.x, pos.z, pos.width, pos.depth, height);
        }
        
        // Add some trees and benches between buildings
        const streetElementCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < streetElementCount; i++) {
            const posX = blockX + (Math.random() - 0.5) * blockSize * 0.8;
            const posZ = blockZ + (Math.random() - 0.5) * blockSize * 0.8;
            
            // Check if position is valid (not overlapping with buildings)
            let validPosition = true;
            for (const pos of buildingPositions) {
                const dx = Math.abs(posX - pos.x);
                const dz = Math.abs(posZ - pos.z);
                
                if (dx < pos.width / 2 + 1 && dz < pos.depth / 2 + 1) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                if (Math.random() > 0.5) {
                    this.createTree(posX, posZ);
                } else {
                    this.createBench(posX, posZ, Math.random() * Math.PI * 2);
                }
            }
        }
    }
    
    createSkyscraper(x, z, width, depth, height) {
        // Create main building
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(buildingGeometry, this.materials.building);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        this.buildings.push(building);
        
        // Add glass windows
        const windowSpacing = 2;
        const windowSize = 1;
        
        // Add windows to front and back
        for (let wx = -width / 2 + windowSpacing; wx < width / 2 - windowSpacing; wx += windowSpacing) {
            for (let wy = windowSpacing; wy < height - windowSpacing; wy += windowSpacing) {
                // Front windows
                this.createWindow(x + wx, wy, z + depth / 2 + 0.1, windowSize, 'z');
                
                // Back windows
                this.createWindow(x + wx, wy, z - depth / 2 - 0.1, windowSize, 'z');
            }
        }
        
        // Add windows to left and right
        for (let wz = -depth / 2 + windowSpacing; wz < depth / 2 - windowSpacing; wz += windowSpacing) {
            for (let wy = windowSpacing; wy < height - windowSpacing; wy += windowSpacing) {
                // Left windows
                this.createWindow(x - width / 2 - 0.1, wy, z + wz, windowSize, 'x');
                
                // Right windows
                this.createWindow(x + width / 2 + 0.1, wy, z + wz, windowSize, 'x');
            }
        }
        
        // Add roof details
        this.createRoofDetails(x, height, z, width, depth);
    }
    
    createWindow(x, y, z, size, direction) {
        const windowGeometry = new THREE.PlaneGeometry(size, size);
        const window = new THREE.Mesh(windowGeometry, this.materials.glass);
        
        if (direction === 'z') {
            window.position.set(x, y, z);
            window.rotation.y = (z > 0) ? Math.PI : 0;
        } else {
            window.position.set(x, y, z);
            window.rotation.y = (x > 0) ? -Math.PI / 2 : Math.PI / 2;
        }
        
        this.scene.add(window);
    }
    
    createRoofDetails(x, height, z, width, depth) {
        // Add a simple roof structure
        const roofHeight = 2;
        const roofGeometry = new THREE.BoxGeometry(width * 0.5, roofHeight, depth * 0.5);
        const roof = new THREE.Mesh(roofGeometry, this.materials.building);
        roof.position.set(x, height + roofHeight / 2, z);
        roof.castShadow = true;
        this.scene.add(roof);
        
        // Add antenna or water tower
        if (Math.random() > 0.5) {
            // Antenna
            const antennaHeight = 5;
            const antennaGeometry = new THREE.CylinderGeometry(0.1, 0.1, antennaHeight, 8);
            const antenna = new THREE.Mesh(antennaGeometry, this.materials.lamppost);
            antenna.position.set(x, height + roofHeight + antennaHeight / 2, z);
            antenna.castShadow = true;
            this.scene.add(antenna);
        } else {
            // Water tower
            const towerHeight = 3;
            const towerRadius = 1;
            const towerGeometry = new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 16);
            const tower = new THREE.Mesh(towerGeometry, this.materials.building);
            tower.position.set(x + width * 0.3, height + towerHeight / 2, z + depth * 0.3);
            tower.castShadow = true;
            this.scene.add(tower);
            
            // Tower legs
            const legHeight = 1;
            const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, legHeight, 8);
            
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const legX = x + width * 0.3 + Math.cos(angle) * towerRadius * 0.8;
                const legZ = z + depth * 0.3 + Math.sin(angle) * towerRadius * 0.8;
                
                const leg = new THREE.Mesh(legGeometry, this.materials.lamppost);
                leg.position.set(legX, height - legHeight / 2, legZ);
                leg.castShadow = true;
                this.scene.add(leg);
            }
        }
    }
    
    createApartmentBlock(blockX, blockZ, blockSize) {
        const buildingCount = Math.floor(Math.random() * 4) + 2; // 2-5 buildings per block
        const buildingPositions = [];
        
        // Place buildings
        for (let i = 0; i < buildingCount; i++) {
            const width = Math.random() * 3 + 5; // 5-8 units wide
            const depth = Math.random() * 3 + 5; // 5-8 units deep
            const posX = blockX + (Math.random() - 0.5) * (blockSize - width);
            const posZ = blockZ + (Math.random() - 0.5) * (blockSize - depth);
            
            // Check if position is valid (not overlapping with other buildings)
            let validPosition = true;
            for (const pos of buildingPositions) {
                const dx = Math.abs(posX - pos.x);
                const dz = Math.abs(posZ - pos.z);
                
                if (dx < (width + pos.width) / 2 + 1 && dz < (depth + pos.depth) / 2 + 1) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                buildingPositions.push({ x: posX, z: posZ, width, depth });
            }
        }
        
        // Create apartment buildings
        for (const pos of buildingPositions) {
            const height = Math.random() * 10 + 10; // 10-20 units tall
            this.createApartmentBuilding(pos.x, pos.z, pos.width, pos.depth, height);
        }
        
        // Add some trees and benches between buildings
        const streetElementCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < streetElementCount; i++) {
            const posX = blockX + (Math.random() - 0.5) * blockSize * 0.8;
            const posZ = blockZ + (Math.random() - 0.5) * blockSize * 0.8;
            
            // Check if position is valid (not overlapping with buildings)
            let validPosition = true;
            for (const pos of buildingPositions) {
                const dx = Math.abs(posX - pos.x);
                const dz = Math.abs(posZ - pos.z);
                
                if (dx < pos.width / 2 + 1 && dz < pos.depth / 2 + 1) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                if (Math.random() > 0.5) {
                    this.createTree(posX, posZ);
                } else {
                    this.createBench(posX, posZ, Math.random() * Math.PI * 2);
                }
            }
        }
    }
    
    createApartmentBuilding(x, z, width, depth, height) {
        // Create main building
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(buildingGeometry, this.materials.building);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        this.buildings.push(building);
        
        // Add windows
        const windowRows = Math.floor(height / 2.5);
        const windowCols = Math.floor(width / 2);
        const windowSize = 0.8;
        
        // Add windows to front and back
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                const windowX = x - width / 2 + 1 + col * 2;
                const windowY = 1.5 + row * 2.5;
                
                // Front windows
                this.createWindow(windowX, windowY, z + depth / 2 + 0.1, windowSize, 'z');
                
                // Back windows
                this.createWindow(windowX, windowY, z - depth / 2 - 0.1, windowSize, 'z');
            }
        }
        
        // Add windows to left and right
        const sideWindowCols = Math.floor(depth / 2);
        
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < sideWindowCols; col++) {
                const windowZ = z - depth / 2 + 1 + col * 2;
                const windowY = 1.5 + row * 2.5;
                
                // Left windows
                this.createWindow(x - width / 2 - 0.1, windowY, windowZ, windowSize, 'x');
                
                // Right windows
                this.createWindow(x + width / 2 + 0.1, windowY, windowZ, windowSize, 'x');
            }
        }
        
        // Add a simple roof
        const roofGeometry = new THREE.BoxGeometry(width, 0.5, depth);
        const roof = new THREE.Mesh(roofGeometry, this.materials.building);
        roof.position.set(x, height + 0.25, z);
        roof.castShadow = true;
        this.scene.add(roof);
        
        // Add balconies to some windows
        for (let row = 0; row < windowRows; row++) {
            if (Math.random() > 0.7) { // Only some rows have balconies
                for (let col = 0; col < windowCols; col++) {
                    if (Math.random() > 0.3) { // Not all windows in the row have balconies
                        const windowX = x - width / 2 + 1 + col * 2;
                        const windowY = 1.5 + row * 2.5;
                        
                        // Front balconies
                        this.createBalcony(windowX, windowY, z + depth / 2 + 0.6, 1.2, 0.5, 'z');
                    }
                }
            }
        }
    }
    
    createBalcony(x, y, z, width, depth, direction) {
        // Create balcony floor
        const floorGeometry = new THREE.BoxGeometry(
            direction === 'z' ? width : depth,
            0.1,
            direction === 'z' ? depth : width
        );
        const floor = new THREE.Mesh(floorGeometry, this.materials.building);
        
        if (direction === 'z') {
            floor.position.set(x, y - 0.45, z);
        } else {
            floor.position.set(x, y - 0.45, z);
        }
        
        floor.castShadow = true;
        this.scene.add(floor);
        
        // Create balcony railing
        const railingHeight = 0.5;
        const railingThickness = 0.05;
        
        // Front railing
        const frontRailingGeometry = new THREE.BoxGeometry(
            direction === 'z' ? width : railingThickness,
            railingHeight,
            direction === 'z' ? railingThickness : width
        );
        const frontRailing = new THREE.Mesh(frontRailingGeometry, this.materials.building);
        
        if (direction === 'z') {
            frontRailing.position.set(x, y - 0.2, z + depth / 2);
        } else {
            frontRailing.position.set(x + depth / 2, y - 0.2, z);
        }
        
        frontRailing.castShadow = true;
        this.scene.add(frontRailing);
        
        // Side railings
        const sideRailingGeometry = new THREE.BoxGeometry(
            direction === 'z' ? railingThickness : depth,
            railingHeight,
            direction === 'z' ? depth : railingThickness
        );
        
        // Left side
        const leftRailing = new THREE.Mesh(sideRailingGeometry, this.materials.building);
        
        if (direction === 'z') {
            leftRailing.position.set(x - width / 2, y - 0.2, z);
        } else {
            leftRailing.position.set(x, y - 0.2, z - width / 2);
        }
        
        leftRailing.castShadow = true;
        this.scene.add(leftRailing);
        
        // Right side
        const rightRailing = new THREE.Mesh(sideRailingGeometry, this.materials.building);
        
        if (direction === 'z') {
            rightRailing.position.set(x + width / 2, y - 0.2, z);
        } else {
            rightRailing.position.set(x, y - 0.2, z + width / 2);
        }
        
        rightRailing.castShadow = true;
        this.scene.add(rightRailing);
    }
    
    createShopBlock(blockX, blockZ, blockSize) {
        const buildingCount = Math.floor(Math.random() * 5) + 3; // 3-7 buildings per block
        const buildingPositions = [];
        
        // Place buildings
        for (let i = 0; i < buildingCount; i++) {
            const width = Math.random() * 3 + 3; // 3-6 units wide
            const depth = Math.random() * 3 + 3; // 3-6 units deep
            const posX = blockX + (Math.random() - 0.5) * (blockSize - width);
            const posZ = blockZ + (Math.random() - 0.5) * (blockSize - depth);
            
            // Check if position is valid (not overlapping with other buildings)
            let validPosition = true;
            for (const pos of buildingPositions) {
                const dx = Math.abs(posX - pos.x);
                const dz = Math.abs(posZ - pos.z);
                
                if (dx < (width + pos.width) / 2 + 1 && dz < (depth + pos.depth) / 2 + 1) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                buildingPositions.push({ x: posX, z: posZ, width, depth });
            }
        }
        
        // Create shop buildings
        for (const pos of buildingPositions) {
            const height = Math.random() * 3 + 3; // 3-6 units tall
            this.createShopBuilding(pos.x, pos.z, pos.width, pos.depth, height);
        }
        
        // Add some trees, benches, and lampposts between buildings
        const streetElementCount = Math.floor(Math.random() * 4) + 2;
        for (let i = 0; i < streetElementCount; i++) {
            const posX = blockX + (Math.random() - 0.5) * blockSize * 0.8;
            const posZ = blockZ + (Math.random() - 0.5) * blockSize * 0.8;
            
            // Check if position is valid (not overlapping with buildings)
            let validPosition = true;
            for (const pos of buildingPositions) {
                const dx = Math.abs(posX - pos.x);
                const dz = Math.abs(posZ - pos.z);
                
                if (dx < pos.width / 2 + 1 && dz < pos.depth / 2 + 1) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                const elementType = Math.random();
                if (elementType < 0.4) {
                    this.createTree(posX, posZ);
                } else if (elementType < 0.7) {
                    this.createBench(posX, posZ, Math.random() * Math.PI * 2);
                } else {
                    this.createLamppost(posX, posZ);
                }
            }
        }
    }
    
    createShopBuilding(x, z, width, depth, height) {
        // Create main building
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(buildingGeometry, this.materials.building);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        this.buildings.push(building);
        
        // Add storefront windows (larger windows at ground level)
        const storefrontHeight = 2;
        
        // Front storefront
        const frontWindowGeometry = new THREE.PlaneGeometry(width * 0.7, storefrontHeight);
        const frontWindow = new THREE.Mesh(frontWindowGeometry, this.materials.glass);
        frontWindow.position.set(x, storefrontHeight / 2, z + depth / 2 + 0.1);
        frontWindow.rotation.y = Math.PI;
        this.scene.add(frontWindow);
        
        // Back storefront
        const backWindowGeometry = new THREE.PlaneGeometry(width * 0.7, storefrontHeight);
        const backWindow = new THREE.Mesh(backWindowGeometry, this.materials.glass);
        backWindow.position.set(x, storefrontHeight / 2, z - depth / 2 - 0.1);
        this.scene.add(backWindow);
        
        // Add smaller windows on upper floors if building is tall enough
        if (height > 3) {
            const windowRows = Math.floor((height - storefrontHeight) / 1.5);
            const windowColsWidth = Math.floor(width / 2);
            const windowColsDepth = Math.floor(depth / 2);
            
            // Add windows to front and back
            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowColsWidth; col++) {
                    const windowX = x - width / 2 + 1 + col * 2;
                    const windowY = storefrontHeight + 1 + row * 1.5;
                    
                    // Front windows
                    this.createWindow(windowX, windowY, z + depth / 2 + 0.1, 0.8, 'z');
                    
                    // Back windows
                    this.createWindow(windowX, windowY, z - depth / 2 - 0.1, 0.8, 'z');
                }
            }
            
            // Add windows to left and right
            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowColsDepth; col++) {
                    const windowZ = z - depth / 2 + 1 + col * 2;
                    const windowY = storefrontHeight + 1 + row * 1.5;
                    
                    // Left windows
                    this.createWindow(x - width / 2 - 0.1, windowY, windowZ, 0.8, 'x');
                    
                    // Right windows
                    this.createWindow(x + width / 2 + 0.1, windowY, windowZ, 0.8, 'x');
                }
            }
        }
        
        // Add a simple roof
        const roofGeometry = new THREE.BoxGeometry(width, 0.5, depth);
        const roof = new THREE.Mesh(roofGeometry, this.materials.building);
        roof.position.set(x, height + 0.25, z);
        roof.castShadow = true;
        this.scene.add(roof);
        
        // Add a sign for the shop
        this.createShopSign(x, z, width, depth, height);
    }
    
    createShopSign(x, z, width, depth, height) {
        // Create a sign that sticks out from the front of the building
        const signWidth = width * 0.4;
        const signHeight = 0.8;
        const signDepth = 0.2;
        
        const signGeometry = new THREE.BoxGeometry(signWidth, signHeight, signDepth);
        const sign = new THREE.Mesh(signGeometry, this.materials.building);
        sign.position.set(x, height * 0.7, z + depth / 2 + signDepth / 2);
        sign.castShadow = true;
        this.scene.add(sign);
    }
    
    addStreetElements() {
        const { gridSize, blockSize, roadWidth } = this.params;
        const totalSize = gridSize * (blockSize + roadWidth) + roadWidth;
        const halfSize = totalSize / 2;
        
        // Add lampposts at regular intervals along roads
        // Use a more systematic approach for larger cities
        const lamppostSpacing = 30; // Distance between lampposts
        
        // Add lampposts along horizontal roads
        for (let i = 0; i <= gridSize; i++) {
            const posZ = -halfSize + roadWidth / 2 + i * (blockSize + roadWidth);
            
            // Add lampposts along the road
            for (let x = -halfSize + 20; x < halfSize - 20; x += lamppostSpacing) {
                // Add lampposts on both sides of the road
                this.createLamppost(x, posZ - roadWidth / 2 + 1);
                this.createLamppost(x, posZ + roadWidth / 2 - 1);
            }
        }
        
        // Add lampposts along vertical roads
        for (let i = 0; i <= gridSize; i++) {
            const posX = -halfSize + roadWidth / 2 + i * (blockSize + roadWidth);
            
            // Add lampposts along the road
            for (let z = -halfSize + 20; z < halfSize - 20; z += lamppostSpacing) {
                // Add lampposts on both sides of the road
                this.createLamppost(posX - roadWidth / 2 + 1, z);
                this.createLamppost(posX + roadWidth / 2 - 1, z);
            }
        }
        
        // Add trees and benches along sidewalks
        for (let i = 0; i < this.sidewalks.length; i++) {
            const sidewalk = this.sidewalks[i];
            
            // Add elements to sidewalks systematically
            const elementsSpacing = 15; // Space between elements
            
            if (sidewalk.direction === 'horizontal') {
                for (let x = -halfSize + 10; x < halfSize - 10; x += elementsSpacing) {
                    if (Math.random() > 0.7) { // Only add elements to some positions
                        if (Math.random() > 0.5) {
                            this.createBench(x, sidewalk.position, Math.PI / 2);
                        } else {
                            this.createTree(x, sidewalk.position);
                        }
                    }
                }
            } else {
                for (let z = -halfSize + 10; z < halfSize - 10; z += elementsSpacing) {
                    if (Math.random() > 0.7) { // Only add elements to some positions
                        if (Math.random() > 0.5) {
                            this.createBench(sidewalk.position, z, 0);
                        } else {
                            this.createTree(sidewalk.position, z);
                        }
                    }
                }
            }
        }
    }
    
    createLamppost(x, z) {
        // Create lamppost
        const poleHeight = 5;
        const poleRadius = 0.1;
        const poleGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight);
        const pole = new THREE.Mesh(poleGeometry, this.materials.lamppost);
        pole.position.set(x, poleHeight / 2, z);
        pole.castShadow = true;
        this.scene.add(pole);
        
        // Create lamp head
        const headRadius = 0.3;
        const headGeometry = new THREE.SphereGeometry(headRadius);
        const head = new THREE.Mesh(headGeometry, this.materials.glass);
        head.position.set(x, poleHeight, z);
        this.scene.add(head);
        
        // Create light
        const light = new THREE.PointLight(0xffffcc, 0, 10); // Start with intensity 0, will be controlled by time of day
        light.position.set(x, poleHeight, z);
        
        // Reduce shadow quality to save on uniforms and texture units
        light.castShadow = false; // Disable shadows for street lights to save texture units
        
        // Add to street elements
        this.streetElements.push({
            type: 'lamppost',
            mesh: pole,
            light: light,
            x: x,
            z: z
        });
        
        // Add to lighting system if available
        if (window.lightingSystem) {
            const added = window.lightingSystem.addStreetLight(light);
            if (added) {
                this.scene.add(light);
            }
        } else {
            // If no lighting system is available yet, add the light to the scene
            // and it will be collected later
            this.scene.add(light);
        }
    }
    
    createTree(x, z) {
        // Create trunk
        const trunkHeight = 1 + Math.random() * 0.5;
        const trunkRadius = 0.2 + Math.random() * 0.1;
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, trunkHeight);
        const trunk = new THREE.Mesh(trunkGeometry, this.materials.trunk);
        trunk.position.set(x, trunkHeight / 2, z);
        trunk.castShadow = true;
        this.scene.add(trunk);
        
        // Create foliage
        const foliageRadius = 1 + Math.random() * 0.5;
        const foliageGeometry = new THREE.SphereGeometry(foliageRadius);
        const foliage = new THREE.Mesh(foliageGeometry, this.materials.tree);
        foliage.position.set(x, trunkHeight + foliageRadius * 0.7, z);
        foliage.castShadow = true;
        this.scene.add(foliage);
        
        // Add to street elements
        this.streetElements.push({
            type: 'tree',
            trunk: trunk,
            foliage: foliage,
            x: x,
            z: z
        });
    }
    
    createBench(x, z, rotation = 0) {
        // Create bench group
        const benchGroup = new THREE.Group();
        benchGroup.position.set(x, 0, z);
        benchGroup.rotation.y = rotation;
        
        // Create bench seat
        const seatWidth = 2;
        const seatDepth = 0.6;
        const seatHeight = 0.5;
        const seatGeometry = new THREE.BoxGeometry(seatWidth, seatHeight, seatDepth);
        const seat = new THREE.Mesh(seatGeometry, this.materials.trunk);
        seat.position.set(0, seatHeight / 2, 0);
        seat.castShadow = true;
        benchGroup.add(seat);
        
        // Create bench backrest
        const backrestHeight = 0.8;
        const backrestGeometry = new THREE.BoxGeometry(seatWidth, backrestHeight, 0.1);
        const backrest = new THREE.Mesh(backrestGeometry, this.materials.trunk);
        backrest.position.set(0, seatHeight + backrestHeight / 2, seatDepth / 2 - 0.05);
        backrest.castShadow = true;
        benchGroup.add(backrest);
        
        // Create bench legs
        const legWidth = 0.1;
        const legDepth = 0.1;
        const legHeight = 0.4;
        
        // Front left leg
        const frontLeftLegGeometry = new THREE.BoxGeometry(legWidth, legHeight, legDepth);
        const frontLeftLeg = new THREE.Mesh(frontLeftLegGeometry, this.materials.lamppost);
        frontLeftLeg.position.set(-seatWidth / 2 + legWidth, legHeight / 2, -seatDepth / 2 + legDepth);
        frontLeftLeg.castShadow = true;
        benchGroup.add(frontLeftLeg);
        
        // Front right leg
        const frontRightLegGeometry = new THREE.BoxGeometry(legWidth, legHeight, legDepth);
        const frontRightLeg = new THREE.Mesh(frontRightLegGeometry, this.materials.lamppost);
        frontRightLeg.position.set(seatWidth / 2 - legWidth, legHeight / 2, -seatDepth / 2 + legDepth);
        frontRightLeg.castShadow = true;
        benchGroup.add(frontRightLeg);
        
        // Back left leg
        const backLeftLegGeometry = new THREE.BoxGeometry(legWidth, legHeight, legDepth);
        const backLeftLeg = new THREE.Mesh(backLeftLegGeometry, this.materials.lamppost);
        backLeftLeg.position.set(-seatWidth / 2 + legWidth, legHeight / 2, seatDepth / 2 - legDepth);
        backLeftLeg.castShadow = true;
        benchGroup.add(backLeftLeg);
        
        // Back right leg
        const backRightLegGeometry = new THREE.BoxGeometry(legWidth, legHeight, legDepth);
        const backRightLeg = new THREE.Mesh(backRightLegGeometry, this.materials.lamppost);
        backRightLeg.position.set(seatWidth / 2 - legWidth, legHeight / 2, seatDepth / 2 - legDepth);
        backRightLeg.castShadow = true;
        benchGroup.add(backRightLeg);
        
        this.scene.add(benchGroup);
        
        // Add to street elements
        this.streetElements.push({
            type: 'bench',
            mesh: benchGroup,
            x: x,
            z: z
        });
    }
    
    createTree(x, z) {
        const trunkHeight = 1 + Math.random() * 0.5;
        const trunkRadius = 0.2 + Math.random() * 0.1;
        const foliageRadius = 1 + Math.random() * 0.5;
        
        // Create trunk
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 8);
        const trunk = new THREE.Mesh(trunkGeometry, this.materials.trunk);
        trunk.position.set(x, trunkHeight / 2, z);
        trunk.castShadow = true;
        this.scene.add(trunk);
        
        // Create foliage
        const foliageGeometry = new THREE.SphereGeometry(foliageRadius, 8, 8);
        const foliage = new THREE.Mesh(foliageGeometry, this.materials.tree);
        foliage.position.set(x, trunkHeight + foliageRadius * 0.7, z);
        foliage.castShadow = true;
        this.scene.add(foliage);
        
        this.streetElements.push({
            type: 'tree',
            elements: [trunk, foliage],
            position: { x, z }
        });
    }
}
