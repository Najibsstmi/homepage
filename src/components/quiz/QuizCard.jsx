import { useState } from "react";

export default function QuizCard({ title = "Science Check", questions, onComplete }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const current = questions[index];
  const answered = Boolean(selected);
  const progress = questions.length ? ((done ? questions.length : index) / questions.length) * 100 : 0;

  const choose = (option) => {
    if (answered || done) {
      return;
    }

    setSelected(option);
    if (option === current.answer) {
      setScore((value) => value + 1);
    }
  };

  const next = () => {
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      setSelected("");
      return;
    }

    const finalScore = score;
    setDone(true);
    onComplete?.(finalScore, questions.length);
  };

  const retry = () => {
    setIndex(0);
    setSelected("");
    setScore(0);
    setDone(false);
    onComplete?.(0, questions.length);
  };

  return (
    <section className="quizCard electroPanel electroAccordion">
      <button className="accordionHeader quizCard__toggle" type="button" onClick={() => setOpen((value) => !value)}>
        <span>{title}</span>
        <strong>{open ? "Tutup Kuiz" : "Buka Kuiz"}</strong>
      </button>

      {open && (
        <div className="accordionBody quizCard__body">
          <div className="quizCard__progress" aria-hidden="true">
            <i style={{ width: `${progress}%` }} />
          </div>

          {done ? (
            <div className="quizCard__complete">
              <span>Skor akhir</span>
              <strong>{score}/{questions.length}</strong>
              <p>{score === questions.length ? "Hebat!" : "Cuba semak semula konsep."}</p>
              <button type="button" onClick={retry}>Ulang kuiz</button>
            </div>
          ) : (
            <>
              <div className="quizCard__meta">
                <span>Soalan {index + 1}/{questions.length}</span>
                <strong>{answered && (selected === current.answer ? "Hebat!" : "Cuba semak semula konsep.")}</strong>
              </div>
              <h2>{current.question}</h2>
              <div className="quizCard__options">
                {Object.entries(current.options).map(([key, value]) => {
                  const isCorrect = answered && key === current.answer;
                  const isWrong = answered && key === selected && key !== current.answer;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={[
                        "quizOption",
                        isCorrect ? "quizOption--correct" : "",
                        isWrong ? "quizOption--wrong" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => choose(key)}
                    >
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div className="quizCard__feedback">
                  <strong>Jawapan betul: {current.answer}</strong>
                  <p>{current.explanation}</p>
                  <button type="button" onClick={next}>
                    {index < questions.length - 1 ? "Soalan seterusnya" : "Lihat skor"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
