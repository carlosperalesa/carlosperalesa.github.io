
class SkillsGraph {
    constructor() {
        this.containerId = 'skills-graph';
        this.container = document.getElementById(this.containerId);
        this.simulation = null;
        this.svg = null;
        this.initialized = false;

        // Data
        this.data = {
            nodes: [
                { id: "Carlos", group: 0, size: 30 },

                { id: "Frontend", group: 1, size: 20 },
                { id: "HTML5", group: 1, size: 10 },
                { id: "CSS3", group: 1, size: 10 },
                { id: "JS", group: 1, size: 12 },
                { id: "React", group: 1, size: 8 },
                { id: "Git", group: 1, size: 8 },

                { id: "Backend", group: 2, size: 20 },
                { id: "Python", group: 2, size: 12 },
                { id: "Django", group: 2, size: 10 },
                { id: "SQL", group: 2, size: 8 },
                { id: "Postgres", group: 2, size: 8 },
                { id: "APIs", group: 2, size: 8 },

                { id: "CMS", group: 3, size: 15 },
                { id: "WordPress", group: 3, size: 10 },
                { id: "WooCommerce", group: 3, size: 8 },
                { id: "Elementor", group: 3, size: 8 },

                { id: "DevOps", group: 4, size: 15 },
                { id: "Docker", group: 4, size: 10 },
                { id: "Linux", group: 4, size: 8 },
                { id: "Nginx", group: 4, size: 8 },

                { id: "Soft Skills", group: 5, size: 15 },
                { id: "Comms", group: 5, size: 8 },
                { id: "Analysis", group: 5, size: 8 },
                { id: "Solving", group: 5, size: 8 },
            ],
            links: [
                { source: "Carlos", target: "Frontend" },
                { source: "Carlos", target: "Backend" },
                { source: "Carlos", target: "CMS" },
                { source: "Carlos", target: "DevOps" },
                { source: "Carlos", target: "Soft Skills" },

                { source: "Frontend", target: "HTML5" },
                { source: "Frontend", target: "CSS3" },
                { source: "Frontend", target: "JS" },
                { source: "Frontend", target: "React" },
                { source: "Frontend", target: "Git" },

                { source: "Backend", target: "Python" },
                { source: "Backend", target: "Django" },
                { source: "Backend", target: "SQL" },
                { source: "Backend", target: "Postgres" },
                { source: "Backend", target: "APIs" },

                { source: "CMS", target: "WordPress" },
                { source: "CMS", target: "WooCommerce" },
                { source: "CMS", target: "Elementor" },

                { source: "DevOps", target: "Docker" },
                { source: "DevOps", target: "Linux" },
                { source: "DevOps", target: "Nginx" },

                { source: "Soft Skills", target: "Comms" },
                { source: "Soft Skills", target: "Analysis" },
                { source: "Soft Skills", target: "Solving" },

                { source: "JS", target: "React" },
                { source: "Python", target: "Django" },
                { source: "WordPress", target: "WooCommerce" },
            ]
        };

        // Colors
        this.colors = ["#ffffff", "#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];

        // Listener
        document.addEventListener('modal:opened', (e) => {
            if (e.detail.id === 'skills') {
                this.init();
            }
        });

        window.addEventListener('resize', () => {
            if (this.initialized && document.getElementById('modal-skills').classList.contains('active')) {
                this.resize();
            }
        });
    }

    init() {
        if (!this.container) this.container = document.getElementById(this.containerId);
        if (!this.container) return;

        // Clear previous
        this.container.innerHTML = '';

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        if (width === 0 || height === 0) {
            // Retry if not rendered yet
            setTimeout(() => this.init(), 100);
            return;
        }

        this.initialized = true;

        this.svg = d3.select(this.container).append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height]);

        this.simulation = d3.forceSimulation(this.data.nodes)
            .force("link", d3.forceLink(this.data.links).id(d => d.id).distance(50))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(d => d.size + 10).iterations(2));

        const link = this.svg.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(this.data.links)
            .join("line")
            .attr("stroke-width", 1.5);

        const node = this.svg.append("g")
            .selectAll("g")
            .data(this.data.nodes)
            .join("g")
            .call(this.drag(this.simulation));

        // Node circles
        node.append("circle")
            .attr("r", d => d.size)
            .attr("fill", d => this.colors[d.group])
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("style", "cursor: pointer;");

        // Labels
        node.append("text")
            .attr("x", 0)
            .attr("y", d => d.size + 12)
            .attr("text-anchor", "middle")
            .text(d => d.id)
            .style("font-size", "10px")
            .style("fill", "var(--text-color)")
            .style("font-family", "inherit")
            .style("pointer-events", "none")
            .style("text-shadow", "0 1px 2px rgba(0,0,0,0.5)");

        this.simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });

        // Zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                this.svg.selectAll("g").attr("transform", event.transform);
            });

        this.svg.call(zoom);
    }

    resize() {
        if (!this.svg) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.svg.attr("width", width).attr("height", height)
            .attr("viewBox", [0, 0, width, height]);

        this.simulation.force("center", d3.forceCenter(width / 2, height / 2));
        this.simulation.alpha(0.3).restart();
    }

    drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }
}

// Initialize
new SkillsGraph();
