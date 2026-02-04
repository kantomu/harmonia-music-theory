import React, { useState, useMemo } from 'react';
import { BookOpen, Music, Settings, Info } from 'lucide-react';
import { Scale, Chord } from "@tonaljs/tonal";
import './App.css';
import MusicStaff from './components/MusicStaff';

// ダイアトニックコード（4和音）を算出する関数
const getDiatonicChords = (root, scale) => {
    const scaleData = Scale.get(`${root} ${scale}`);
    const notes = scaleData.notes;
    if (!notes || notes.length === 0) return [];

    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

    return notes.map((n, i) => {
        // セブンスコード (1, 3, 5, 7)
        // スケール内の音を使うことでダイアトニックコードとなる
        const chordNotes = [
            notes[i],
            notes[(i + 2) % 7],
            notes[(i + 4) % 7],
            notes[(i + 6) % 7]
        ];

        // コード名を判定
        const detected = Chord.detect(chordNotes);
        // ルート音を含む候補を優先、なければ最初の候補
        let name = detected.find(d => d.includes(n)) || detected[0] || "Unknown";

        // コードシンボルを整形 (例: Cmaj7)
        // Tonalは "CMaj7" のように返す

        return {
            degree: romans[i],
            root: n,
            name: name,
            notes: chordNotes
        };
    });
};

const TheoryPanel = ({ scale, root }) => {
    const scaleInfo = Scale.get(`${root} ${scale}`);
    const diatonicChords = useMemo(() => getDiatonicChords(root, scale), [root, scale]);

    return (
        <div className="theory-info">
            <div className="panel-header" style={{ marginBottom: '2rem' }}>
                <BookOpen size={16} /> 理論解析 (Theoretical Analysis)
            </div>

            <div className="grid-section mb-8">
                <h2 className="section-title">Scale Properties</h2>
                <div className="info-card">
                    <div className="info-row">
                        <span className="label">スケール名</span>
                        <span className="value">{root} {scaleInfo.type.toUpperCase()}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">インターバル構成</span>
                        <span className="value">{scaleInfo.intervals.join(' - ')}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">構成音 (Notes)</span>
                        <div className="notes-list-small">
                            {scaleInfo.notes.map((n, i) => <span key={i} className="note-pill">{n}</span>)}
                        </div>
                    </div>
                    <div className="info-row">
                        <span className="label">調号 (Key Signature)</span>
                        <span className="value">
                            {(() => {
                                const sharps = scaleInfo.notes.filter(n => n.includes('#'));
                                const flats = scaleInfo.notes.filter(n => n.includes('b'));
                                if (sharps.length > 0) return `${sharps.length} ♯ (${sharps.join(', ')})`;
                                if (flats.length > 0) return `${flats.length} ♭ (${flats.join(', ')})`;
                                return "♮ Natural (調号なし)";
                            })()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid-section">
                <h2 className="section-title">Diatonic 7th Chords</h2>
                <div className="chords-grid">
                    {diatonicChords.map((c, i) => (
                        <div key={i} className="chord-card">
                            <div className="chord-degree">{c.degree}</div>
                            <div className="chord-name">{c.name}</div>
                            <div className="chord-notes">{c.notes.join(' - ')}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

function App() {
    const [root, setRoot] = useState("C");
    const [scaleType, setScaleType] = useState("major");

    // UI用のルート音リスト (異名同音を含める)
    const roots = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];
    // ユーザーに提示するスケール一覧
    const scales = [
        "major", "minor",
        "dorian", "phrygian", "lydian", "mixolydian", "locrian",
        "harmonic minor", "melodic minor",
        "whole tone", "diminished"
    ];

    return (
        <div className="app-container">
            <header className="header">
                <div className="title-container">
                    <h1 className="main-title">Musica Universalis</h1>
                </div>
                <p className="subtitle">音楽理論の深淵へ - Interactive Theory Compendium</p>
            </header>

            <main className="main-layout">
                {/* サイドバー（コントロール） */}
                <aside className="panel sidebar">
                    <div className="panel-header">
                        <Settings size={14} /> 設定 (Configuration)
                    </div>

                    <div className="control-group">
                        <label className="control-label">ルート音 (Root Note)</label>
                        <div className="root-grid">
                            {roots.map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRoot(r)}
                                    className={`root-btn ${root === r ? 'active' : ''}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="control-group">
                        <label className="control-label">スケール (Scale)</label>
                        <div className="select-wrapper">
                            <select
                                className="scale-select"
                                value={scaleType}
                                onChange={(e) => setScaleType(e.target.value)}
                            >
                                {scales.map(s => (
                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="info-box-small">
                        <Info size={14} className="inline mr-1" />
                        <p>スケールを選択すると、構成音、五線譜、およびダイアトニックコード（セブンス）が自動計算されます。</p>
                    </div>
                </aside>

                {/* メインコンテンツ */}
                <div className="content-area">
                    {/* 五線譜表示エリア */}
                    <div className="staff-container panel">
                        <MusicStaff root={root} scale={scaleType} />
                        <div className="staff-label">
                            <Music size={12} /> {root} {scaleType.charAt(0).toUpperCase() + scaleType.slice(1)} Scale
                        </div>
                    </div>

                    <TheoryPanel root={root} scale={scaleType} />
                </div>
            </main>

            <footer className="footer">
                <p>&copy; 2026 Musica Universalis - Developed with Classical & Modern Luxury Philosophy</p>
            </footer>
        </div>
    )
}

export default App
