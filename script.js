class InfinityCube {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.cubes = [];
        this.hinges = [];
        this.animationId = null;
        this.isAnimating = true;
        this.animationSpeed = 1;
        this.cubeSize = 0.8;
        
        // Infinity cube specific properties
        this.cubeGroups = [];
        this.currentFlipGroup = 0;
        this.isFlipping = false;
        this.flipProgress = 0;
        this.flipSpeed = 0.02;
        this.flipAxis = 'x';
        this.flipDelay = 60; // frames to wait between flips
        this.flipDelayCounter = 0;
        
        this.init();
        this.createInfinityCube();
        this.setupControls();
        this.animate();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.physicallyCorrectLights = true;
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Lighting
        this.setupLighting();
        
        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 20;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);
        
        // Fill lights
        const fillLight1 = new THREE.DirectionalLight(0x4080ff, 0.4);
        fillLight1.position.set(-5, 3, -5);
        this.scene.add(fillLight1);
        
        const fillLight2 = new THREE.DirectionalLight(0xff8040, 0.3);
        fillLight2.position.set(3, -2, 8);
        this.scene.add(fillLight2);
        
        // Point light for rim lighting
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 30);
        pointLight.position.set(0, 8, 0);
        this.scene.add(pointLight);
    }
    
    createInfinityCube() {
        // Clear existing cubes and groups
        this.cubes.forEach(cube => this.scene.remove(cube.group));
        this.cubeGroups.forEach(group => this.scene.remove(group));
        this.cubes = [];
        this.hinges = [];
        this.cubeGroups = [];
        
        // Create materials with different colors for each face
        const materials = this.createCubeMaterials();
        
        // Create two groups of 4 cubes each (2x2 formation)
        // Group 1: Front 4 cubes
        // Group 2: Back 4 cubes
        
        const group1 = new THREE.Group();
        const group2 = new THREE.Group();
        
        // Positions for the first group (front 2x2 layer)
        const group1Positions = [
            { x: -0.5, y: -0.5, z: 0.5 },
            { x: 0.5, y: -0.5, z: 0.5 },
            { x: -0.5, y: 0.5, z: 0.5 },
            { x: 0.5, y: 0.5, z: 0.5 }
        ];
        
        // Positions for the second group (back 2x2 layer)
        const group2Positions = [
            { x: -0.5, y: -0.5, z: -0.5 },
            { x: 0.5, y: -0.5, z: -0.5 },
            { x: -0.5, y: 0.5, z: -0.5 },
            { x: 0.5, y: 0.5, z: -0.5 }
        ];
        
        // Create cubes for group 1
        group1Positions.forEach((pos, index) => {
            const cube = this.createSingleCube(materials, pos);
            group1.add(cube.group);
            this.cubes.push(cube);
        });
        
        // Create cubes for group 2
        group2Positions.forEach((pos, index) => {
            const cube = this.createSingleCube(materials, pos);
            group2.add(cube.group);
            this.cubes.push(cube);
        });
        
        // Position the groups so they form a 2x2x2 cube initially
        group1.position.set(0, 0, 0);
        group2.position.set(0, 0, 0);
        
        this.scene.add(group1);
        this.scene.add(group2);
        
        this.cubeGroups = [group1, group2];
        
        // Create hinge visualization
        this.createHingeVisualization();
    }
    
    createSingleCube(materials, position) {
        const cubeGroup = new THREE.Group();
        
        // Create individual cube
        const geometry = new THREE.BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize);
        const cube = new THREE.Mesh(geometry, materials);
        cube.castShadow = true;
        cube.receiveShadow = true;
        
        // Add edges for more definition
        const edges = new THREE.EdgesGeometry(geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        const wireframe = new THREE.LineSegments(edges, edgeMaterial);
        
        cubeGroup.add(cube);
        cubeGroup.add(wireframe);
        cubeGroup.position.set(
            position.x * this.cubeSize, 
            position.y * this.cubeSize, 
            position.z * this.cubeSize
        );
        
        return {
            group: cubeGroup,
            mesh: cube,
            wireframe: wireframe,
            originalPosition: { ...position }
        };
    }
    
    createHingeVisualization() {
        // Create visual hints for hinge axes
        const hingeGeometry = new THREE.CylinderGeometry(0.02, 0.02, this.cubeSize * 2.2);
        const hingeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000, 
            transparent: true, 
            opacity: 0.6 
        });
        
        // X-axis hinge
        const hingeX = new THREE.Mesh(hingeGeometry, hingeMaterial);
        hingeX.rotation.z = Math.PI / 2;
        hingeX.position.set(0, 0, 0);
        
        // Y-axis hinge
        const hingeY = new THREE.Mesh(hingeGeometry, hingeMaterial.clone());
        hingeY.material.color.setHex(0x00ff00);
        hingeY.position.set(0, 0, 0);
        
        // Z-axis hinge
        const hingeZ = new THREE.Mesh(hingeGeometry, hingeMaterial.clone());
        hingeZ.material.color.setHex(0x0000ff);
        hingeZ.rotation.x = Math.PI / 2;
        hingeZ.position.set(0, 0, 0);
        
        this.scene.add(hingeX);
        this.scene.add(hingeY);
        this.scene.add(hingeZ);
        
        this.hinges = [hingeX, hingeY, hingeZ];
        
        // Initially hide hinges
        this.hinges.forEach(hinge => hinge.visible = false);
    }
    
    createCubeMaterials() {
        // Create materials for each face with different colors
        const faceColors = [
            0xff4444, // Right - Red
            0x44ff44, // Left - Green  
            0x4444ff, // Top - Blue
            0xffff44, // Bottom - Yellow
            0xff44ff, // Front - Magenta
            0x44ffff  // Back - Cyan
        ];
        
        const materials = faceColors.map(color => new THREE.MeshPhongMaterial({
            color: color,
            shininess: 30,
            specular: 0x222222
        }));
        
        return materials;
    }
    
    createConnections() {
        // This method is now simplified since connections are handled by the group structure
        // We can add visual tape/hinge connections if desired
    }
    
    setupControls() {
        // Speed control
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.animationSpeed = parseFloat(e.target.value);
        });
        
        // Size control
        document.getElementById('sizeSlider').addEventListener('input', (e) => {
            this.cubeSize = parseFloat(e.target.value);
            this.createInfinityCube();
        });
        
        // Play/Pause
        document.getElementById('playPause').addEventListener('click', () => {
            this.isAnimating = !this.isAnimating;
            document.getElementById('playPause').textContent = this.isAnimating ? 'Pause' : 'Play';
        });
        
        // Reset view
        document.getElementById('resetView').addEventListener('click', () => {
            this.camera.position.set(5, 5, 5);
            this.controls.reset();
        });
        
        // Wireframe toggle (now toggles hinge visualization)
        document.getElementById('toggleWireframe').addEventListener('click', () => {
            this.hinges.forEach(hinge => {
                hinge.visible = !hinge.visible;
            });
        });
        
        // Fold animation
        document.getElementById('foldCube').addEventListener('click', () => {
            this.startFlip();
        });
        
        document.getElementById('unfoldCube').addEventListener('click', () => {
            this.resetCube();
        });
        
        // Mouse interaction
        this.setupMouseInteraction();
    }
    
    setupMouseInteraction() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        this.renderer.domElement.addEventListener('click', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            const meshes = this.cubes.map(cube => cube.mesh);
            const intersects = raycaster.intersectObjects(meshes);
            
            if (intersects.length > 0) {
                const clickedCube = intersects[0].object;
                this.highlightCube(clickedCube);
            }
        });
    }
    
    highlightCube(cube) {
        // Create highlight effect
        const originalMaterials = cube.material;
        const highlightMaterials = originalMaterials.map(mat => 
            new THREE.MeshPhongMaterial({
                color: 0xffffff,
                shininess: 100,
                emissive: 0x222222
            })
        );
        
        cube.material = highlightMaterials;
        
        setTimeout(() => {
            cube.material = originalMaterials;
        }, 200);
    }
    
    startFlip() {
        if (!this.isFlipping) {
            this.isFlipping = true;
            this.flipProgress = 0;
            this.flipDelayCounter = 0;
            
            // Alternate between different flip axes and groups
            const axes = ['x', 'y', 'z'];
            this.flipAxis = axes[Math.floor(Math.random() * axes.length)];
            this.currentFlipGroup = (this.currentFlipGroup + 1) % 2;
        }
    }
    
    resetCube() {
        // Reset all rotations
        this.cubeGroups.forEach(group => {
            group.rotation.set(0, 0, 0);
        });
        this.isFlipping = false;
        this.flipProgress = 0;
    }
    
    updateInfinityCubeAnimation() {
        if (!this.isFlipping) {
            // Auto-flip delay
            this.flipDelayCounter++;
            if (this.flipDelayCounter >= this.flipDelay && this.isAnimating) {
                this.startFlip();
            }
            return;
        }
        
        // Update flip progress
        this.flipProgress += this.flipSpeed * this.animationSpeed;
        
        if (this.flipProgress >= 1) {
            this.flipProgress = 1;
            this.isFlipping = false;
            this.flipDelayCounter = 0;
        }
        
        // Apply easing (smooth in/out)
        const easedProgress = this.easeInOutCubic(this.flipProgress);
        const angle = easedProgress * Math.PI; // 180 degrees
        
        // Apply rotation to the current flip group
        const group = this.cubeGroups[this.currentFlipGroup];
        
        switch (this.flipAxis) {
            case 'x':
                group.rotation.x = angle;
                break;
            case 'y':
                group.rotation.y = angle;
                break;
            case 'z':
                group.rotation.z = angle;
                break;
        }
        
        // When flip is complete, rearrange the cube structure
        if (this.flipProgress >= 1) {
            this.rearrangeCubeStructure();
        }
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    
    rearrangeCubeStructure() {
        // After a flip, we need to rearrange the cube structure
        // This simulates the infinity cube's continuous folding behavior
        
        // Reset rotation and apply new positions
        const group = this.cubeGroups[this.currentFlipGroup];
        group.rotation.set(0, 0, 0);
        
        // Randomly offset the group slightly to create the infinity effect
        const offset = 0.1;
        switch (this.flipAxis) {
            case 'x':
                group.position.x += (Math.random() - 0.5) * offset;
                break;
            case 'y':
                group.position.y += (Math.random() - 0.5) * offset;
                break;
            case 'z':
                group.position.z += (Math.random() - 0.5) * offset;
                break;
        }
        
        // Gradually return to center
        group.position.lerp(new THREE.Vector3(0, 0, 0), 0.1);
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (this.isAnimating) {
            const time = Date.now() * 0.001 * this.animationSpeed;
            
            // Subtle floating animation for the entire cube assembly
            this.scene.position.y = Math.sin(time * 0.5) * 0.1;
            
            // Gentle rotation of the entire scene for better viewing
            this.scene.rotation.y += 0.005 * this.animationSpeed;
        }
        
        // Update infinity cube flip animation
        this.updateInfinityCubeAnimation();
        
        // Update controls
        this.controls.update();
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clean up Three.js objects
        this.cubes.forEach(cube => {
            if (cube.group.parent) {
                cube.group.parent.remove(cube.group);
            }
        });
        
        this.cubeGroups.forEach(group => {
            this.scene.remove(group);
        });
        
        this.hinges.forEach(hinge => {
            this.scene.remove(hinge);
        });
        
        this.renderer.dispose();
    }
}

// Initialize the infinity cube when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const infinityCube = new InfinityCube();
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        infinityCube.destroy();
    });
});
