export class PowerUpUI {
    constructor() {
        // Get UI elements
        this.speedMultiplierElement = document.getElementById('speed-multiplier');
        this.pierceLevelElement = document.getElementById('pierce-level');
        this.damageMultiplierElement = document.getElementById('damage-multiplier');
        this.notificationElement = document.getElementById('power-up-notification');
        
        // Initialize values
        if (this.speedMultiplierElement) this.speedMultiplierElement.textContent = '1.0';
        if (this.pierceLevelElement) this.pierceLevelElement.textContent = '0';
        if (this.damageMultiplierElement) this.damageMultiplierElement.textContent = '1.0';
        
        this.notificationTimeout = null;
    }

    updateStats(weaponSystem) {
        if (!weaponSystem) return;

        // Calculate effective speed multiplier
        if (this.speedMultiplierElement) {
            const speedMultiplier = (weaponSystem.projectileSpeed / 60).toFixed(1);
            this.speedMultiplierElement.textContent = speedMultiplier;
        }
        
        // Update pierce level
        if (this.pierceLevelElement) {
            this.pierceLevelElement.textContent = weaponSystem.piercingShots;
        }
        
        // Update damage multiplier
        if (this.damageMultiplierElement) {
            this.damageMultiplierElement.textContent = 
                weaponSystem.permanentMultiplier.toFixed(1);
        }
    }

    showNotification(powerUpType) {
        if (!this.notificationElement) return;

        const messages = {
            'speed': '🚀 Speed Boost: Bullet speed increased!',
            'pierce': '⚔️ Pierce Power: Bullets now pierce through enemies!',
            'multiplier': '💥 Damage Boost: Permanent damage multiplier increased!'
        };

        // Clear existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        // Show notification
        this.notificationElement.textContent = messages[powerUpType];
        this.notificationElement.style.opacity = '1';

        // Hide after 2 seconds
        this.notificationTimeout = setTimeout(() => {
            this.notificationElement.style.opacity = '0';
        }, 2000);
    }
}
