export class StaffRenderer {
    constructor(elementIdOrElement) {
        if (typeof elementIdOrElement === 'string') {
            this.container = document.getElementById(elementIdOrElement);
        } else {
            this.container = elementIdOrElement; // Support passing element directly
        }
        this.svgNS = "http://www.w3.org/2000/svg";
    }

    render(notes, type = 'scale', keySignature = [], showBlueNotes = false, avoidNotes = []) {
        if (!this.container) return;
        this.container.innerHTML = '';

        const keyAccidentals = Array.isArray(keySignature) ? keySignature : (keySignature.accidentals || []);

        // Zoom Logic:
        const widthView = (type === 'chord') ? 160 : 500;
        const heightView = (type === 'chord') ? 100 : 150;

        const svg = document.createElementNS(this.svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", `0 0 ${widthView} ${heightView}`);
        svg.style.overflow = "visible";

        // Draw Staff Lines
        const startY = (type === 'chord') ? 30 : 50;
        const lineSpacing = 10;
        const bottomY = startY + 4 * lineSpacing;
        const staffWidth = widthView - 20;

        for (let i = 0; i < 5; i++) {
            const line = document.createElementNS(this.svgNS, "line");
            line.setAttribute("x1", 10);
            line.setAttribute("y1", startY + i * lineSpacing);
            line.setAttribute("x2", 10 + staffWidth);
            line.setAttribute("y2", startY + i * lineSpacing);
            line.setAttribute("stroke", "#999");
            line.setAttribute("stroke-width", "1");
            svg.appendChild(line);
        }

        // Clef
        const clef = document.createElementNS(this.svgNS, "text");
        clef.textContent = "𝄞";
        clef.setAttribute("x", 10);
        clef.setAttribute("y", startY + 30);
        clef.setAttribute("font-size", "35");
        clef.setAttribute("font-family", "serif");
        svg.appendChild(clef);

        // Draw Key Signature
        const keySigWidth = this.drawKeySignature(svg, keySignature, startY + 40);

        // Dynamic Start X based on Key Sig
        let startNoteX = 50 + keySigWidth + 20;

        // Pre-process Notes
        const noteMap = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };
        let processedNotes = [];

        // Close Voicing Logic (E4 Center)
        const centerStep = 2; // E4

        notes.forEach((noteObj, index) => {
            let noteName = (typeof noteObj === 'string') ? noteObj : noteObj.note;
            const isBlue = noteObj.isBlue;
            const replacementNote = noteObj.blueNote;

            if (isBlue && replacementNote) {
                noteName = replacementNote;
            }

            const cleanNote = noteName.replace(/[#bxy]+$/, '');
            let noteVal = noteMap[cleanNote];

            // Close Voicing Algorithm
            let bestOctave = 4;
            let minDiff = 999;
            for (let oct = 3; oct <= 5; oct++) {
                const stepVal = noteVal + (oct - 4) * 7;
                const diff = Math.abs(stepVal - centerStep);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestOctave = oct;
                }
            }
            let currentOctave = bestOctave;

            let stepsFromE4 = (noteVal - 2) + (currentOctave - 4) * 7;
            const cy = bottomY - (stepsFromE4 * 5);

            let shift = false;
            // Shift Tensions (index >= 4) for visual distinction, or Clusters (Seconds)
            if (type === 'chord' && index >= 4) {
                shift = 'right';
            }

            processedNotes.push({
                name: noteName,
                cy: cy,
                stepsFromE4: stepsFromE4,
                isBlue: isBlue,
                index: index,
                shifted: shift
            });
        });

        const noteSpacing = (staffWidth - startNoteX + 10) / (notes.length || 1);

        // Collision Detection for remaining notes (e.g. Inversion Clusters)
        if (type === 'chord' && processedNotes.length > 1) {
            // Sort by distinct visual steps to find neighbors?
            // Since we shifted some notes (tensions) right, they won't collide with main column.
            // We only care about collisions within the SAME column.

            // Check Main Column Collisions (Unshifted)
            const mainCol = processedNotes.filter(n => n.shifted !== 'right');
            mainCol.sort((a, b) => a.stepsFromE4 - b.stepsFromE4);
            for (let i = 0; i < mainCol.length - 1; i++) {
                if (Math.abs(mainCol[i].stepsFromE4 - mainCol[i + 1].stepsFromE4) === 1) {
                    // Second interval in main column. Shift upper note to right?
                    // Or shift lower note to left? 
                    // Standard notation: lower is left, upper is right.
                    // But our "shifted" means "Right Column".
                    // So shift the upper note.
                    mainCol[i + 1].shifted = 'right';
                }
            }

            // Check Right Column Collisions (Shifted)
            const rightCol = processedNotes.filter(n => n.shifted === 'right');
            rightCol.sort((a, b) => a.stepsFromE4 - b.stepsFromE4);
            for (let i = 0; i < rightCol.length - 1; i++) {
                if (Math.abs(rightCol[i].stepsFromE4 - rightCol[i + 1].stepsFromE4) === 1) {
                    // Collision in right column. 
                    // Usually we don't have this with standard voicings, but if we do...
                    // We might need a 3rd column or toggle back?
                    // For simplicity, let's keep as is.
                }
            }
        }

        processedNotes.forEach((n, i) => {
            const color = n.isBlue ? "#E74C3C" : "#000";

            let cx = startNoteX + i * noteSpacing;
            if (type === 'chord') cx = 95 + (keySigWidth / 2);

            let headCx = cx;
            if (n.shifted === 'right') {
                headCx = cx + 13;
            }

            if (n.stepsFromE4 <= -2 || n.stepsFromE4 >= 10) {
                this.drawLedgerLines(svg, headCx, n.cy, n.stepsFromE4, color, false, bottomY);
            }

            // Note Head
            const head = document.createElementNS(this.svgNS, "ellipse");
            head.setAttribute("cx", headCx);
            head.setAttribute("cy", n.cy);
            head.setAttribute("rx", 6);
            head.setAttribute("ry", 4.5);
            head.setAttribute("transform", `rotate(-10 ${headCx} ${n.cy})`);
            head.setAttribute("fill", color);
            svg.appendChild(head);

            // Stem (Only for Main Column)
            if (n.shifted !== 'right') {
                const stemHeight = 35;
                const stemY2 = n.cy - stemHeight;
                const stemCx = cx + 5;
                const stem = document.createElementNS(this.svgNS, "line");
                stem.setAttribute("x1", stemCx);
                stem.setAttribute("y1", n.cy);
                stem.setAttribute("x2", stemCx);
                stem.setAttribute("y2", stemY2);
                stem.setAttribute("stroke", color);
                stem.setAttribute("stroke-width", "1.5");
                svg.appendChild(stem);
            }

            // Accidental
            const acc = this.getAccidentalDisplay(n.name, keyAccidentals);
            if (acc) {
                const accText = document.createElementNS(this.svgNS, "text");
                accText.textContent = this.getAccidentalSymbol(acc);

                // Zig-Zag Staggering
                let accX = cx - 35;
                if (n.shifted === 'right') {
                    accX -= 40; // Far Left for Shifted Notes
                }

                accText.setAttribute("x", accX);
                accText.setAttribute("y", n.cy + 6);
                accText.setAttribute("font-size", "22");
                accText.setAttribute("fill", color);
                svg.appendChild(accText);
            }
        });

        this.container.appendChild(svg);
    }

    getAccidentalDisplay(noteName, keyAccidentals) {
        const match = noteName.match(/[#bxy]+$/);
        let noteAcc = match ? match[0] : '';

        const clean = noteName.replace(/[#bxy]+$/, '');
        const keyMatch = keyAccidentals.find(k => k.startsWith(clean));
        let keyAcc = '';
        if (keyMatch) {
            const km = keyMatch.match(/[#bxy]+$/);
            if (km) keyAcc = km[0];
        }

        if (noteAcc === keyAcc) return null;
        if (noteAcc === '') return 'n';
        return noteAcc;
    }

    getAccidentalSymbol(accStr) {
        if (accStr === 'n') return '♮';
        if (accStr === '#') return '♯';
        if (accStr === 'b') return '♭';
        if (accStr === 'x') return '𝄪';
        if (accStr === 'bb') return '𝄫';
        return '';
    }

    drawLedgerLines(svg, x, y, stepsFromE4, color, isSmall = false, bottomLineY = 90) {
        let targetStep = stepsFromE4;
        const width = isSmall ? 14 : 24;
        const x1 = x - (width / 2);
        const x2 = x + (width / 2);

        if (targetStep <= -2) {
            for (let s = -2; s >= targetStep; s -= 2) {
                const lineY = bottomLineY - (s * 5);
                const line = document.createElementNS(this.svgNS, "line");
                line.setAttribute("x1", x1);
                line.setAttribute("y1", lineY);
                line.setAttribute("x2", x2);
                line.setAttribute("y2", lineY);
                line.setAttribute("stroke", color);
                line.setAttribute("stroke-width", "1");
                svg.appendChild(line);
            }
        }

        if (targetStep >= 10) {
            for (let s = 10; s <= targetStep; s += 2) {
                const lineY = bottomLineY - (s * 5);
                const line = document.createElementNS(this.svgNS, "line");
                line.setAttribute("x1", x1);
                line.setAttribute("y1", lineY);
                line.setAttribute("x2", x2);
                line.setAttribute("y2", lineY);
                line.setAttribute("stroke", color);
                line.setAttribute("stroke-width", "1");
                svg.appendChild(line);
            }
        }
    }

    drawKeySignature(svg, keySignature, bottomY) {
        const accidentals = Array.isArray(keySignature) ? keySignature : (keySignature.accidentals || []);
        if (accidentals.length === 0) return 0;

        const isSharp = (keySignature.type === 'sharp') || (accidentals[0] && accidentals[0].includes('#'));
        let xOffset = 45; // Start after Clef
        const stepX = 12;

        const sharpSteps = [8, 5, 9, 6, 3, 7, 4];
        const flatSteps = [4, 7, 3, 6, 2, 5, 1];

        const steps = isSharp ? sharpSteps : flatSteps;
        const symbol = isSharp ? '♯' : '♭';

        accidentals.forEach((acc, i) => {
            if (i >= steps.length) return;
            const step = steps[i];
            const cy = bottomY - (step * 5);

            const txt = document.createElementNS(this.svgNS, "text");
            txt.textContent = symbol;
            txt.setAttribute("x", xOffset);
            txt.setAttribute("y", cy + 6);
            txt.setAttribute("font-size", "22");
            txt.setAttribute("font-family", "serif");
            svg.appendChild(txt);

            xOffset += stepX;
        });

        return (xOffset - 45);
    }
}
