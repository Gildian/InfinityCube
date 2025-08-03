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
        this.cubeSize = 1;
        this.foldAnimation = { active: false, progress: 0, direction: 1 };
        
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
        // Clear existing cubes
        this.cubes.forEach(cube => this.scene.remove(cube.group));
        this.cubes = [];
        this.hinges = [];
        
        // Create materials with different colors for each face
        const materials = this.createCubeMaterials();
        
        // Create 8 interconnected cubes in a 2x2x2 formation
        const positions = [
            { x: -1, y: -1, z: -1 }, // Bottom layer
            { x: 1, y: -1, z: -1 },
            { x: -1, y: -1, z: 1 },
            { x: 1, y: -1, z: 1 },
            { x: -1, y: 1, z: -1 },  // Top layer
            { x: 1, y: 1, z: -1 },
            { x: -1, y: 1, z: 1 },
            { x: 1, y: 1, z: 1 }
        ];
        
        positions.forEach((pos, index) => {
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
            cubeGroup.position.set(pos.x * this.cubeSize, pos.y * this.cubeSize, pos.z * this.cubeSize);
            
            // Add hinge points for folding animation
            const hingeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const hingeMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
            const hinge = new THREE.Mesh(hingeGeometry, hingeMaterial);
            cubeGroup.add(hinge);
            
            this.scene.add(cubeGroup);
            this.cubes.push({
                group: cubeGroup,
                mesh: cube,
                wireframe: wireframe,
                hinge: hinge,
                originalPosition: { ...pos },
                index: index
            });
        });
        
        // Create connecting elements (representing the tape/hinges)
        this.createConnections();
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
        // Create visible connections between adjacent cubes
        const connectionMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.8
        });
        
        // Define which cubes are connected (like tape hinges in real infinity cube)
        const connections = [
            [0, 1], [0, 2], [0, 4], // Bottom-front-left connections
            [1, 3], [1, 5], // Bottom-front-right connections
            [2, 3], [2, 6], // Bottom-back connections
            [3, 7], // Bottom-back-right
            [4, 5], [4, 6], // Top connections
            [5, 7], [6, 7] // Top-back connections
        ];
        
        connections.forEach(([i, j]) => {
            const cube1 = this.cubes[i];
            const cube2 = this.cubes[j];
            
            const distance = cube1.group.position.distanceTo(cube2.group.position);
            const geometry = new THREE.CylinderGeometry(0.02, 0.02, distance * 0.8);
            const connection = new THREE.Mesh(geometry, connectionMaterial);
            
            // Position connection between cubes
            const midpoint = new THREE.Vector3()
                .addVectors(cube1.group.position, cube2.group.position)
                .multiplyScalar(0.5);
            connection.position.copy(midpoint);
            
            // Orient connection
            const direction = new THREE.Vector3()
                .subVectors(cube2.group.position, cube1.group.position)
                .normalize();
            connection.lookAt(cube2.group.position);
            connection.rotateX(Math.PI / 2);
            
            this.scene.add(connection);
            this.hinges.push(connection);
        });
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
        
        // Wireframe toggle
        document.getElementById('toggleWireframe').addEventListener('click', () => {
            this.cubes.forEach(cube => {
                cube.wireframe.visible = !cube.wireframe.visible;
            });
        });
        
        // Fold animation
        document.getElementById('foldCube').addEventListener('click', () => {
            this.startFoldAnimation(1);
        });
        
        document.getElementById('unfoldCube').addEventListener('click', () => {
            this.startFoldAnimation(-1);
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
    
    startFoldAnimation(direction) {
        if (this.foldAnimation.active) return;
        
        this.foldAnimation.active = true;
        this.foldAnimation.direction = direction;
        this.foldAnimation.progress = direction > 0 ? 0 : 1;
    }
    
    updateFoldAnimation() {
        if (!this.foldAnimation.active) return;
        
        const speed = 0.02;
        this.foldAnimation.progress += this.foldAnimation.direction * speed;
        
        if (this.foldAnimation.direction > 0 && this.foldAnimation.progress >= 1) {
            this.foldAnimation.progress = 1;
            this.foldAnimation.active = false;
        } else if (this.foldAnimation.direction < 0 && this.foldAnimation.progress <= 0) {
            this.foldAnimation.progress = 0;
            this.foldAnimation.active = false;
        }
        
        // Apply folding transformation
        this.cubes.forEach((cube, index) => {
            const t = this.foldAnimation.progress;
            const angle = t * Math.PI * 0.5;
            
            // Different folding patterns for different cubes
            if (index % 2 === 0) {
                cube.group.rotation.x = Math.sin(angle) * 0.5;
                cube.group.rotation.y = Math.cos(angle) * 0.3;
            } else {
                cube.group.rotation.z = Math.sin(angle) * 0.4;
                cube.group.rotation.x = Math.cos(angle) * 0.2;
            }
        });
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (this.isAnimating) {
            const time = Date.now() * 0.001 * this.animationSpeed;
            
            // Rotate individual cubes
            this.cubes.forEach((cube, index) => {
                if (!this.foldAnimation.active) {
                    cube.group.rotation.x = Math.sin(time + index) * 0.1;
                    cube.group.rotation.y = Math.cos(time + index * 0.5) * 0.1;
                    cube.group.rotation.z = Math.sin(time * 0.7 + index * 0.3) * 0.05;
                }
                
                // Subtle floating animation
                cube.group.position.y = cube.originalPosition.y * this.cubeSize + Math.sin(time * 2 + index) * 0.02;
            });
            
            // Rotate the entire cube assembly
            this.scene.rotation.y = time * 0.1;
        }
        
        // Update fold animation
        this.updateFoldAnimation();
        
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
            this.scene.remove(cube.group);
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
