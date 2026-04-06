
import React, { useState } from 'react';
import './GuidedPrompts.css';

export default function GuidedPrompts({ questions, analysis, onComplete, navigate }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);

  if (!questions || questions.length === 0) {
    onComplete(answers);
    return null;
  }

  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  const handleAnswer = (option) => {
    const newAnswers = [...answers, { question: question.q, answer: option }];
    if (currentQ + 1 < questions.length) {
      setAnswers(newAnswers);
      setCurrentQ(currentQ + 1);
    } else {
      onComplete(newAnswers);
    }
  };

  return (
    <div className="guided-prompts">
      {/* PROGRESS */}
      <div className="guided-progress">
        <div className="guided-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* HEADER */}
      <div style={{ padding: '20px 0 8px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
          ✦ SNAP AI
        </div>
        <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
          Almost there…
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
          A few more questions for {analysis.job}
        </div>
      </div>

      {/* QUESTION */}
      <div className="prompt-card anim-slide-up">
        <div className="prompt-q">
          {question.q}
        </div>
        <div className="prompt-options">
          {question.options.map((opt, i) => (
            <button
              key={opt}
              className="prompt-option"
              style={{ animationDelay: `${i * 0.1}s` }}
              onClick={() => handleAnswer(opt)}
            >
              <span style={{ fontSize: 18, marginRight: 10 }}>
                {opt.includes('Yes') ? '✅' : opt.includes('Firm') || opt.includes('None') ? '🟢' : opt.includes('Minor') || opt.includes('Slight') ? '🟡' : opt.includes('Ground') || opt.includes('Lost') || opt.includes('Constant') ? '🔵' : '📋'}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* QUESTION DOT INDICATORS */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20 }}>
        {questions.map((_, i) => (
          <div
            key={i}
            className={`prompt-dot ${i === currentQ ? 'active' : i < currentQ ? 'done' : ''}`}
          />
        ))}
      </div>

      {/* SKIP */}
      <button
        className="prompt-skip"
        onClick={() => onComplete(answers)}
      >
        Skip questions →
      </button>
    </div>
  );
}
