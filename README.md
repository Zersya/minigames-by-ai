# Game Catalog

A collection of interactive 3D web games built with Three.js. Currently featuring two immersive games: City View and Infinite Runner.

## 🎮 Games

### 1. City View
An interactive 3D city exploration experience featuring:
- Procedurally generated city with dynamic buildings
- Day/night cycle with realistic lighting
- First-person controls (WASD + Mouse)
- Vehicle and pedestrian AI systems
- Dynamic weather effects

**Controls:**
- WASD: Move around
- Mouse: Look around
- Q/E or Arrow Up/Down: Adjust height
- Time Slider: Control time of day

### 2. Infinite Runner
A fast-paced endless runner game with:
- Dynamic obstacle generation
- Power-up system
- Score tracking
- Auto-shooting mechanics
- Progressive difficulty

**Features:**
- Score tracking
- Play time display
- Power-up collection
- Enemy systems
- Weapon systems

## 🚀 Technologies Used

- Three.js - 3D graphics library
- JavaScript (ES6+)
- HTML5
- CSS3
- Vercel - Deployment platform

## 🚦 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Zersya/minigames-by-ai.git
```

2. No build process required! Simply serve the files using any HTTP server. For example:
```bash
# Using Python
python -m http.server 8000

# Or using Node.js's http-server
npx http-server
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

## 📝 Development Notes

- The project uses ES6 modules and requires a modern browser
- Three.js is loaded via CDN (Skypack)
- All games are optimized for performance with features like:
  - Shadow mapping optimization
  - Object pooling
  - Frustum culling
  - Limited draw distance

## 🔧 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires WebGL support and modern JavaScript features.

## 📜 License

MIT License - feel free to use this code for your own projects!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ✨ Future Enhancements

- [ ] Mobile support and touch controls
- [ ] More game modes
- [ ] Multiplayer support
- [ ] Save/load game progress
- [ ] Customizable characters
- [ ] Sound effects and background music
- [ ] Achievement system