export class PowerUpUI {
    constructor() {
        this.speedMultiplierElement = document.getElementById('speed-multiplier');
        this.pierceLevelElement = document.getElementById('pierce-level');
        this.damageMultiplierElement = document.getElementById('damage-multiplier');
        this.notificationElement = document.getElementById('power-up-notification');
        
        this.notificationTimeout = null;
    }

    updateStats(weaponSystem) {
        // Calculate effective speed multiplier
        const speedMultiplier = (weaponSystem.projectileSpeed / 60).toFixed(1);
        this.speedMultiplierElement.textContent = speedMultiplier;
        
        // Update pierce level
        this.pierceLevelElement.textContent = weaponSystem.piercingShots;
        
        // Update damage multiplier
        this.damageMultiplierElement.textContent = 
            weaponSystem.permanentMultiplier.toFixed(1);
    }

    showNotification(powerUpType) {
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