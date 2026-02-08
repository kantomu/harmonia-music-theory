/**
 * Interactive Circle of Fifths Component
 * SVG-based navigation for key relationships
 */

export class CircleOfFifths {
    constructor(containerId, options = {}) {
        this.container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        this.options = {
            size: options.size || 300,
            onKeySelect: options.onKeySelect || null,
            showRelativeMinors: options.showRelativeMinors !== false,
            showCamelot: options.showCamelot || false
        };

        this.currentKey = 'C';
        this.svgNS = "http://www.w3.org/2000/svg";

        // Circle of fifths order
        this.majorKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
        this.minorKeys = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];

        // Key signature info
        this.keySignatures = {
            'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'Gb': 6,
            'Db': 5, 'Ab': 4, 'Eb': 3, 'Bb': 2, 'F': 1
        };

        this.render();
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        const size = this.options.size;
        const cx = size / 2;
        const cy = size / 2;
        const outerRadius = size / 2 - 20;
        const innerRadius = outerRadius * 0.65;
        const centerRadius = innerRadius * 0.4;

        const svg = document.createElementNS(this.svgNS, "svg");
        svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.maxWidth = size + "px";

        // Background circle
        const bgCircle = document.createElementNS(this.svgNS, "circle");
        bgCircle.setAttribute("cx", cx);
        bgCircle.setAttribute("cy", cy);
        bgCircle.setAttribute("r", outerRadius);
        bgCircle.setAttribute("fill", "#FAFAFA");
        bgCircle.setAttribute("stroke", "#DDD");
        svg.appendChild(bgCircle);

        // Draw segments for each key
        const angleStep = (2 * Math.PI) / 12;

        this.majorKeys.forEach((key, i) => {
            const startAngle = -Math.PI / 2 + (i - 0.5) * angleStep;
            const endAngle = startAngle + angleStep;

            // Major key segment (outer)
            const segment = this.createArcSegment(cx, cy, innerRadius, outerRadius, startAngle, endAngle, key);
            segment.setAttribute("class", `cof-segment major ${key === this.currentKey ? 'active' : ''}`);
            segment.addEventListener("click", () => this.selectKey(key));
            svg.appendChild(segment);

            // Key label
            const labelAngle = startAngle + angleStep / 2;
            const labelRadius = (innerRadius + outerRadius) / 2;
            const lx = cx + labelRadius * Math.cos(labelAngle);
            const ly = cy + labelRadius * Math.sin(labelAngle);

            const label = document.createElementNS(this.svgNS, "text");
            label.textContent = key;
            label.setAttribute("x", lx);
            label.setAttribute("y", ly);
            label.setAttribute("class", "cof-label major");
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("dominant-baseline", "central");
            label.style.pointerEvents = "none";
            svg.appendChild(label);
        });

        // Inner circle for relative minors
        if (this.options.showRelativeMinors) {
            const innerBg = document.createElementNS(this.svgNS, "circle");
            innerBg.setAttribute("cx", cx);
            innerBg.setAttribute("cy", cy);
            innerBg.setAttribute("r", innerRadius);
            innerBg.setAttribute("fill", "#F0F0F0");
            innerBg.setAttribute("stroke", "#CCC");
            svg.appendChild(innerBg);

            this.minorKeys.forEach((key, i) => {
                const startAngle = -Math.PI / 2 + (i - 0.5) * angleStep;
                const endAngle = startAngle + angleStep;

                const segment = this.createArcSegment(cx, cy, centerRadius, innerRadius, startAngle, endAngle, key);
                segment.setAttribute("class", `cof-segment minor`);
                segment.addEventListener("click", () => this.selectKey(key.replace('m', ''), true));
                svg.appendChild(segment);

                // Minor label
                const labelAngle = startAngle + angleStep / 2;
                const labelRadius = (centerRadius + innerRadius) / 2;
                const lx = cx + labelRadius * Math.cos(labelAngle);
                const ly = cy + labelRadius * Math.sin(labelAngle);

                const label = document.createElementNS(this.svgNS, "text");
                label.textContent = key;
                label.setAttribute("x", lx);
                label.setAttribute("y", ly);
                label.setAttribute("class", "cof-label minor");
                label.setAttribute("text-anchor", "middle");
                label.setAttribute("dominant-baseline", "central");
                label.style.pointerEvents = "none";
                svg.appendChild(label);
            });
        }

        // Center circle with current key
        const centerCircle = document.createElementNS(this.svgNS, "circle");
        centerCircle.setAttribute("cx", cx);
        centerCircle.setAttribute("cy", cy);
        centerCircle.setAttribute("r", centerRadius);
        centerCircle.setAttribute("fill", "var(--color-gold, #C5A059)");
        svg.appendChild(centerCircle);

        const centerLabel = document.createElementNS(this.svgNS, "text");
        centerLabel.textContent = this.currentKey;
        centerLabel.setAttribute("x", cx);
        centerLabel.setAttribute("y", cy);
        centerLabel.setAttribute("class", "cof-center-label");
        centerLabel.setAttribute("text-anchor", "middle");
        centerLabel.setAttribute("dominant-baseline", "central");
        svg.appendChild(centerLabel);

        this.container.appendChild(svg);
        this.svg = svg;
    }

    createArcSegment(cx, cy, innerR, outerR, startAngle, endAngle, key) {
        const path = document.createElementNS(this.svgNS, "path");

        const x1Outer = cx + outerR * Math.cos(startAngle);
        const y1Outer = cy + outerR * Math.sin(startAngle);
        const x2Outer = cx + outerR * Math.cos(endAngle);
        const y2Outer = cy + outerR * Math.sin(endAngle);

        const x1Inner = cx + innerR * Math.cos(endAngle);
        const y1Inner = cy + innerR * Math.sin(endAngle);
        const x2Inner = cx + innerR * Math.cos(startAngle);
        const y2Inner = cy + innerR * Math.sin(startAngle);

        const d = [
            `M ${x1Outer} ${y1Outer}`,
            `A ${outerR} ${outerR} 0 0 1 ${x2Outer} ${y2Outer}`,
            `L ${x1Inner} ${y1Inner}`,
            `A ${innerR} ${innerR} 0 0 0 ${x2Inner} ${y2Inner}`,
            'Z'
        ].join(' ');

        path.setAttribute("d", d);
        path.setAttribute("data-key", key);

        return path;
    }

    selectKey(key, isMinor = false) {
        this.currentKey = key;
        this.render();

        if (this.options.onKeySelect) {
            this.options.onKeySelect(key, isMinor);
        }
    }

    setKey(key) {
        this.currentKey = key.replace('m', '').replace('#', '#').replace('b', 'b');
        this.render();
    }

    /**
     * Highlight related keys (dominant, subdominant, relative)
     */
    highlightRelatedKeys(key) {
        const idx = this.majorKeys.indexOf(key);
        if (idx === -1) return;

        const dominant = this.majorKeys[(idx + 1) % 12];  // One step clockwise
        const subdominant = this.majorKeys[(idx + 11) % 12];  // One step counter-clockwise
        const relative = this.minorKeys[idx];

        // Add highlight classes
        this.svg.querySelectorAll(`[data-key="${dominant}"]`).forEach(el => el.classList.add('related-dominant'));
        this.svg.querySelectorAll(`[data-key="${subdominant}"]`).forEach(el => el.classList.add('related-subdominant'));
        this.svg.querySelectorAll(`[data-key="${relative}"]`).forEach(el => el.classList.add('related-relative'));
    }

    /**
     * Get interval relationship between two keys
     */
    getKeyRelationship(fromKey, toKey) {
        const fromIdx = this.majorKeys.indexOf(fromKey);
        const toIdx = this.majorKeys.indexOf(toKey);
        if (fromIdx === -1 || toIdx === -1) return null;

        const distance = ((toIdx - fromIdx) + 12) % 12;
        const relationships = {
            0: 'Same key',
            1: 'Dominant (V)',
            2: 'Two fifths away',
            5: 'Tritone (Enharmonic)',
            6: 'bII (Tritone sub)',
            7: 'Parallel minor area',
            11: 'Subdominant (IV)'
        };

        return relationships[distance] || `${distance} steps`;
    }
}

/**
 * CSS styles for Circle of Fifths
 */
export const COF_STYLES = `
.cof-segment {
    cursor: pointer;
    transition: fill 0.2s ease, transform 0.2s ease;
    transform-origin: center;
}
.cof-segment.major {
    fill: #FEFEFE;
    stroke: #CCC;
    stroke-width: 1;
}
.cof-segment.major:hover {
    fill: #F5F5F5;
}
.cof-segment.major.active {
    fill: var(--color-gold, #C5A059);
}
.cof-segment.minor {
    fill: #E8E8E8;
    stroke: #BBB;
    stroke-width: 1;
}
.cof-segment.minor:hover {
    fill: #DDD;
}
.cof-segment.related-dominant {
    fill: #D5E8D4 !important;
}
.cof-segment.related-subdominant {
    fill: #DAE8FC !important;
}
.cof-segment.related-relative {
    fill: #FFE6CC !important;
}

.cof-label {
    font-family: var(--font-display, serif);
    font-weight: 600;
}
.cof-label.major {
    font-size: 14px;
    fill: #333;
}
.cof-label.minor {
    font-size: 11px;
    fill: #666;
}

.cof-center-label {
    font-family: var(--font-display, serif);
    font-size: 24px;
    font-weight: 400;
    fill: #FFF;
}
`;
