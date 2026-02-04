import React, { useEffect, useRef } from 'react';
import { Vex } from 'vexflow';
import { Scale } from "@tonaljs/tonal";

const MusicStaff = ({ root, scale }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // コンテナをクリア
        containerRef.current.innerHTML = '';

        const { Factory } = Vex.Flow;
        // コンテナの幅に合わせて描画幅を決定
        const width = containerRef.current.clientWidth || 700;
        const height = 250;

        const vf = new Factory({
            renderer: { elementId: null, element: containerRef.current, width: width, height: height }
        });

        const score = vf.EasyScore();
        const system = vf.System();

        // Tonal.jsでスケール情報を取得
        const scaleName = `${root} ${scale}`;
        const scaleData = Scale.get(scaleName);
        const notes = scaleData.notes;

        // VexFlow用に音符データを変換
        // 基準オクターブ: 4
        // 音高が下がった場合はオクターブを上げる
        let octave = 4;
        let lastChroma = -1;

        // クロマ（半音のインデックス）を取得する簡易関数
        const getChroma = (n) => {
            const letter = n.replace(/\d/g, '');
            /* 
               Tonal.Note.chroma(n) がベストだが、
               importの手間を減らすため簡易マップを使用
            */
            const semitones = {
                'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11
            };
            return semitones[letter] ?? 0;
        };

        // 音階のノート列を作成（ルートからオクターブ上まで）
        const displayNotes = [...notes, notes[0]];

        const vexNotes = displayNotes.map((noteName, i) => {
            const chroma = getChroma(noteName);

            // Cを跨いだらオクターブを上げる (例: B -> C)
            // ただし最初の音がCの場合はそのまま
            if (i > 0 && chroma < lastChroma) {
                octave++;
            }
            lastChroma = chroma;

            // VexFlowのEasyScore形式: "C#5/q" (四分音符)
            return `${noteName}${octave}/q`;
        }).join(', ');

        // 拍子記号: 音符の数に合わせる (例: 8/4)
        const timeSignature = `${displayNotes.length}/4`;

        // 描画設定
        // 五度圏に基づく調号判定は複雑なため、今回は音符ごとの臨時記号表示を優先し、
        // 将来的に Key Signature を追加可能な構造にする。
        // 背景に合わせてステーブ（五線）等の色を調整

        const stave = system.addStave({
            voices: [
                score.voice(score.notes(vexNotes, { stem: 'up' }))
            ]
        });

        stave.addClef('treble');
        stave.addTimeSignature(timeSignature);

        // スタイル調整関数
        const styleVexFlow = () => {
            const svg = containerRef.current.querySelector('svg');
            if (svg) {
                svg.style.width = '100%';
                svg.style.height = '100%';
                // SVG内の要素をCSS変数で制御できるようにクラスを付与するなど
                // VexFlowは直接fill属性を持つことが多いので、CSSでの上書きは !important が必要になることが多い
            }
        };

        vf.draw();
        styleVexFlow();

    }, [root, scale]);

    return <div ref={containerRef} className="vexflow-wrapper"></div>;
};

export default MusicStaff;
