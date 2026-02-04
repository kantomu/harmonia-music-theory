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
        // CSS Height is 120px. 
        // To make notes "2x bigger", we reduce heightView.
        // Was 130. Now 90.
        // widthView 160.
        const widthView = (type === 'chord') ? 160 : 500;
        const heightView = (type === 'chord') ? 100 : 150;

        const svg = document.createElementNS(this.svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", `0 0 ${widthView} ${heightView}`);
        svg.style.overflow = "visible";

        // Draw Staff Lines
        // For chords, move startY up to fit in smaller view
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
        clef.setAttribute("x", 10); // Slightly more left
        clef.setAttribute("y", startY + 30);
        clef.setAttribute("font-size", "35");
        clef.setAttribute("font-family", "serif");
        svg.appendChild(clef);

        // Draw Key Signature
        // bottomY = startY + 40 (approx E4 line).
        const keySigWidth = this.drawKeySignature(svg, keySignature, startY + 40);

        // Dynamic Start X based on Key Sig
        // Clef (10 + 35 width) + KeySig + Padding
        let startNoteX = 50 + keySigWidth + 20;

        // Pre-process Notes
        const noteMap = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };
        let processedNotes = [];

        let currentOctave = 4;
        let lastNoteVal = -999;

        notes.forEach((noteObj, index) => {
            let noteName = (typeof noteObj === 'string') ? noteObj : noteObj.note;
            const isBlue = noteObj.isBlue;
            const replacementNote = noteObj.blueNote;

            // Blue Note Replacement
            if (isBlue && replacementNote) {
                noteName = replacementNote;
            }

            const cleanNote = noteName.replace(/[#bxy]+$/, '');
            let noteVal = noteMap[cleanNote];

            // Heuristic Octave Adjustment
            if (index === 0) {
                if (['A', 'B'].includes(cleanNote)) currentOctave = 3;
                else currentOctave = 4;
            } else {
                if (lastNoteVal >= 5 && noteVal <= 1) currentOctave++;
                else if (lastNoteVal <= 1 && noteVal >= 5) currentOctave--;
            }
            lastNoteVal = noteVal;

            let stepsFromE4 = (noteVal - 2) + (currentOctave - 4) * 7;

            // User Request: Drop 9, 11, 13 (index >= 4) by 1 Octave
            if (type === 'chord' && index >= 4) {
                stepsFromE4 -= 7;
            }

            const cy = bottomY - (stepsFromE4 * 5);

            // Shift Logic:
            // 1. Tensions (9, 11, 13) -> ALWAYS Shift Right.
            //    Tensions are typically at indices 4, 5, 6 (Root=0, 3rd=1, 5th=2, 7th=3).
            // 2. Clusters (2nds) -> Upper note Shift Right. 
            //    (Applied if not already shifted by rule 1).

            let shift = false;
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

        // Collision Detection for remaining notes (e.g. Root-2nd, or 3rd-4th if tension not strictly high index)
        if (type === 'chord' && processedNotes.length > 1) {
            for (let i = 0; i < processedNotes.length - 1; i++) {
                const n1 = processedNotes[i];
                const n2 = processedNotes[i + 1];

                // If already shifted, skip re-eval?
                // Wait, if n2 is 9th (shifted), and n1 is Root (unshifted). Distance large.
                // If n2 is 11th (shifted right), n1 is 3rd (unshifted).
                // What if n1 and n2 are seconds, and NEITHER is tension index? (e.g. Add2 chord: Root, 2nd, 5th).
                // Root=0, 2nd=1. Index < 4. So collision logic needed.

                if (!n2.shifted) {
                    const stepDiff = Math.abs(n1.stepsFromE4 - n2.stepsFromE4);
                    if (stepDiff === 1) {
                        n2.shifted = 'right';
                    }
                }
            }
        }

        processedNotes.forEach((n, i) => {
            const color = n.isBlue ? "#E74C3C" : "#000";

            let cx = startNoteX + i * noteSpacing;
            // CENTER LOGIC:
            if (type === 'chord') cx = 95 + (keySigWidth / 2);

            let headCx = cx;
            // Shift Right logic
            if (n.shifted === 'right') {
                headCx = cx + 13;
            }

            // Ledger Lines logic needs startY context? NO, it uses relative to bottomY (E4).
            // But bottomY depends on startY.
            // drawLedgerLines uses bottomLineY = 90 hardcoded.
            // FIX: Pass bottomY to drawLedgerLines or update it.
            // In render: bottomY = startY + 40.
            // chord: 30 + 40 = 70.
            // scale: 50 + 40 = 90.

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

            // Stem
            // Rule: Shifted (Right) notes = NO STEM.
            // Main (Left) notes = STEM.
            if (n.shifted !== 'right') {
                const stemHeight = 35;
                const stemY2 = n.cy - stemHeight;
                const stemCx = cx + 5; // Fixed to main column

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

                // Position:
                // User requirement: "Write explicitly further to left".
                // Main column is `cx`.
                // Standard left is `cx - x`.
                // Previous was 24. Let's make it 35 to ensure separation.
                // ALSO: Use `headCx` reference? 
                // No, Main Column `cx` is the anchor. 
                // Accidentals stack to the left of the chord.
                // If we have multiple accidentals, we might need to stagger them?
                // For now, strict spacing:
                const accX = cx - 35;

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
        // startY=50. 4*10=40. Bottom=90.
        // E4 is at BottomY=90.


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

        // Order of Sharps/Flats positions (Steps from E4)
        // Sharps: F(8), C(5), G(9), D(6), A(3), E(7), B(4)
        const sharpSteps = [8, 5, 9, 6, 3, 7, 4];
        // Flats: B(4), E(7), A(3), D(6), G(2), C(5), F(1) 
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
            txt.setAttribute("y", cy + 6); // visual adjust
            txt.setAttribute("font-size", "22");
            txt.setAttribute("font-family", "serif");
            svg.appendChild(txt);

            xOffset += stepX;
        });

        // Return the width occupied by key sig (relative to start 45)
        return (xOffset - 45);
    }
}
