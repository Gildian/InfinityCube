# Realistic 3D Infinity Cube

A realistic 3D recreation of the popular infinity cube fidget toy, built with Three.js. This project features physically accurate lighting, realistic materials, and interactive animations that mimic the real-world behavior of an infinity cube.

## Features

- **Realistic 3D Graphics**: Physically-based rendering with proper lighting and shadows
- **Interactive Controls**: Mouse controls for rotation and zoom
- **Folding Animation**: Simulate the folding action of a real infinity cube
- **Customizable Settings**: Adjust animation speed, cube size, and visual style
- **Multiple Materials**: Each face has different colors like a real Rubik's cube
- **Smooth Animations**: Fluid rotations and transformations
- **Responsive Design**: Works on different screen sizes

## How to Use

1. Open `index.html` in a web browser
2. Use your mouse to rotate and zoom the view
3. Use the control panel to:
   - Adjust animation speed
   - Change cube size
   - Toggle wireframe mode
   - Control folding animations
   - Pause/resume animations

## Controls

- **Mouse Drag**: Rotate the view around the cube
- **Mouse Wheel**: Zoom in and out
- **Click Cubes**: Highlight individual cubes
- **Control Panel**: Various settings and animations

## Technical Details

- Built with Three.js r128
- Uses WebGL for hardware-accelerated rendering
- Implements shadow mapping for realistic lighting
- Features multiple light sources (ambient, directional, point lights)
- Uses Orbit Controls for smooth camera movement

## File Structure

```
InfinityCube/
├── index.html      # Main HTML file with UI
├── script.js       # Three.js implementation
└── README.md       # This file
```

## Real Infinity Cube Physics

This simulation attempts to recreate the physical properties of a real infinity cube:

- **8 interconnected cubes** arranged in a 2x2x2 formation
- **Flexible hinges** connecting adjacent cubes
- **Folding mechanics** that allow infinite transformation
- **Weight distribution** affecting rotation patterns
- **Realistic materials** with proper reflection and lighting

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Requires WebGL support for 3D rendering.

## Performance

The project is optimized for smooth 60fps performance on modern devices:
- Efficient geometry and material usage
- Optimized shadow mapping
- RequestAnimationFrame for smooth animations
- Responsive controls with damping

Enjoy exploring your virtual infinity cube!
