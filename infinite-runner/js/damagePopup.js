import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';

export class DamagePopup {
    constructor(scene) {
        this.scene = scene;
        this.popups = [];
        
        // Create canvas for damage numbers
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.width = 512; // Increased canvas size
        this.canvas.height = 512; // Increased canvas size
    }

    createDamageNumber(position, damage, isCritical = false) {
        // Configure text style
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Different colors for normal and critical hits
        this.context.fillStyle = isCritical ? '#ff0000' : '#ffff00'; // Red for critical, yellow for normal
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 8;
        this.context.font = `bold ${isCritical ? 172 : 144}px Arial`; // Bigger font for critical hits
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        
        // Draw the damage number
        const text = Math.round(damage).toString();
        // Draw the stroke (outline)
        this.context.strokeText(text, this.canvas.width/2, this.canvas.height/2);
        // Draw the fill
        this.context.fillText(text, this.canvas.width/2, this.canvas.height/2);

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(this.canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });

        // Create sprite
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.position.y += 2;
        
        // Larger scale for critical hits
        const baseScale = isCritical ? 5 : 4;
        sprite.scale.set(baseScale, baseScale, 1);

        // Add animation properties
        sprite.userData = {
            velocity: new THREE.Vector3(0, 3, 0),
            age: 0,
            maxAge: isCritical ? 1.5 : 1.2, // Critical hits stay longer
            initialY: position.y + 2,
            isCritical
        };

        this.scene.add(sprite);
        this.popups.push(sprite);
    }

    update(delta) {
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const popup = this.popups[i];
            popup.userData.age += delta;

            // Update position
            popup.position.add(popup.userData.velocity.clone().multiplyScalar(delta));

            // Update opacity and scale based on age
            const lifePercent = popup.userData.age / popup.userData.maxAge;
            const opacity = 1 - lifePercent;
            popup.material.opacity = opacity;

            // Scale up slightly as it rises
            const scaleMultiplier = 1 + (lifePercent * 0.3);
            const baseScale = popup.userData.isCritical ? 5 : 4;
            popup.scale.set(
                baseScale * scaleMultiplier, 
                baseScale * scaleMultiplier, 
                1
            );

            // Remove when animation is complete
            if (popup.userData.age >= popup.userData.maxAge) {
                this.scene.remove(popup);
                this.popups.splice(i, 1);
                popup.material.dispose();
                popup.material.map.dispose();
            }
        }
    }
}
