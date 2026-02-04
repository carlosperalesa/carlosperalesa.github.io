
class RetroGridBackground {
    constructor() {
        this.container = document.querySelector('.desktop-screen');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.grid = null;
        this.terrain = null;
        this.clock = new THREE.Clock();

        // Configuration
        this.gridColor = 0xff00ff; // Neon Pink/Magenta default
        this.gridColorDark = 0xbc13fe;
        this.gridColorLight = 0x4f46e5; // Indigo for light mode
        this.fogColorDark = 0x030712; // Matches dark mode bg
        this.fogColorLight = 0xf8fafc; // Matches light mode bg

        this.init();
    }

    init() {
        // Create Scene
        this.scene = new THREE.Scene();

        // Setup Fog (Fade distance)
        this.scene.fog = new THREE.FogExp2(this.fogColorDark, 0.0015);

        // Setup Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 200;
        this.camera.position.y = 80;
        this.camera.rotation.x = -0.2;

        // Setup Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performance optimization

        // Canvas Styling
        this.renderer.domElement.id = 'three-bg';
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.zIndex = '-1';
        this.renderer.domElement.style.pointerEvents = 'none'; // Allow clicks to pass through

        // Insert before desktop-screen content, but we want it effectively as the background
        // Since .desktop-screen is the container, we can prepend it or append it to body.
        // Appending to body and using z-index -1 is safest.
        document.body.prepend(this.renderer.domElement);

        this.createGrid();
        this.createParticles();
        this.setupLights();

        // Event Listeners
        window.addEventListener('resize', () => this.onResize());

        // Watch for theme changes
        this.checkTheme();
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', () => this.checkTheme());
        }

        // Start Loop
        this.animate();
    }

    createGrid() {
        // Create a moving plane with grid texture or actual grid helper
        // Using a moving PlaneGeometry with wireframe for the "Terrain" look

        const geometry = new THREE.PlaneGeometry(2000, 2000, 40, 40);

        // Displace vertices to create "hills" on the sides
        const count = geometry.attributes.position.count;
        const positionAttribute = geometry.attributes.position;

        for (let i = 0; i < count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);

            // Create a "valley" in the middle
            const distFromCenter = Math.abs(x);
            let zHeight = 0;

            if (distFromCenter > 200) {
                // Add noise/height to sides
                zHeight = Math.sin(x * 0.01) * 30 + Math.cos(y * 0.01) * 30;
                if (zHeight < 0) zHeight = 0;
            }

            // We modify Z here because Plane is created on XY plane, then we rotate it.
            // Actually PlaneGeometry is on XY. We will rotate -90 deg on X.
            // So Z in local space becomes Y in world space (height).
             positionAttribute.setZ(i, zHeight);
        }

        geometry.computeVertexNormals();

        const material = new THREE.MeshBasicMaterial({
            color: this.gridColor,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });

        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.position.y = -50;
        this.scene.add(this.terrain);

        // Add a second grid for the "floor" purely flat
        const gridHelper = new THREE.GridHelper(2000, 60, this.gridColor, this.gridColor);
        gridHelper.position.y = -50;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.1;
        this.scene.add(gridHelper);
    }

    createParticles() {
        // Floating particles for depth
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        for (let i = 0; i < 600; i++) {
            vertices.push(
                (Math.random() - 0.5) * 1500,
                (Math.random() - 0.5) * 500 + 200, // floating above
                (Math.random() - 0.5) * 1500
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const material = new THREE.PointsMaterial({ color: 0xffffff, size: 2, transparent: true, opacity: 0.6 });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        this.particles = particles;
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
        this.scene.add(ambientLight);
    }

    checkTheme() {
        const isDark = document.body.classList.contains('dark-mode');

        if (isDark) {
            // Dark Mode / Cyber settings
            this.scene.fog.color.setHex(this.fogColorDark);
            this.scene.background = new THREE.Color(this.fogColorDark); // Ensure bg is solid color so CSS behind doesn't matter

            if (this.terrain) {
                this.terrain.material.color.setHex(this.gridColorDark);
                this.terrain.material.opacity = 0.2;
            }
        } else {
            // Light Mode settings
            this.scene.fog.color.setHex(this.fogColorLight);
            this.scene.background = new THREE.Color(this.fogColorLight);

            if (this.terrain) {
                this.terrain.material.color.setHex(this.gridColorLight);
                this.terrain.material.opacity = 0.15;
            }
        }
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        // Move Terrain towards camera to simulate flight
        if (this.terrain) {
            this.terrain.position.z += 40 * delta;
            // Loop the terrain
            if (this.terrain.position.z > 200) {
                this.terrain.position.z = 0;
            }
        }

        // Rotate particles slowly
        if (this.particles) {
            this.particles.rotation.y += 0.05 * delta;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when ready
new RetroGridBackground();
