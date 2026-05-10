import { useState } from "react";

export default function QuizCard({ title = "Science Check", questions, onComplete }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [wrongSelections, setWrongSelections] = useState({});
  const [missedFirstAttempt, setMissedFirstAttempt] = useState({});
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const current = questions[index];
  const isCorrectSelection = selected === current.answer;
  const attempted = Boolean(selected);
  const currentWrongSelections = wrongSelections[index] || [];
  const progressStep = done ? questions.length : isCorrectSelection ? index + 1 : index;
  const progress = questions.length ? (progressStep / questions.length) * 100 : 0;

  const choose = (option) => {
    if (isCorrectSelection || done) {
      return;
    }

    setSelected(option);
    if (option === current.answer) {
      if (!missedFirstAttempt[index]) {
        setScore((value) => value + 1);
      }
      return;
    }

    setMissedFirstAttempt((currentMisses) => ({
      ...currentMisses,
      [index]: true,
    }));
    setWrongSelections((currentSelections) => {
      const previous = currentSelections[index] || [];
      if (previous.includes(option)) {
        return currentSelections;
      }
      return {
        ...currentSelections,
        [index]: [...previous, option],
      };
    });
  };

  const next = () => {
    if (!isCorrectSelection) {
      return;
    }

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
    setWrongSelections({});
    setMissedFirstAttempt({});
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
              <span>Skor cubaan pertama</span>
              <strong>{score}/{questions.length}</strong>
              <p>{score === questions.length ? "Hebat!" : "Cuba semak semula konsep."}</p>
              <button type="button" onClick={retry}>Ulang kuiz</button>
            </div>
          ) : (
            <>
              <div className="quizCard__meta">
                <span>Soalan {index + 1}/{questions.length}</span>
                <strong>{attempted && (isCorrectSelection ? "Betul!" : "Cuba lagi.")}</strong>
              </div>
              <h2>{current.question}</h2>
              <div className="quizCard__options">
                {Object.entries(current.options).map(([key, value]) => {
                  const isCorrect = isCorrectSelection && key === current.answer;
                  const isWrong = currentWrongSelections.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={isCorrectSelection || isWrong}
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

              {attempted && (
                <div className="quizCard__feedback">
                  {isCorrectSelection ? (
                    <>
                      <strong>Jawapan betul: {current.answer}</strong>
                      <p>{current.explanation}</p>
                      <button type="button" onClick={next}>
                        {index < questions.length - 1 ? "Soalan seterusnya" : "Lihat skor"}
                      </button>
                    </>
                  ) : (
                    <>
                      <strong>Cuba lagi</strong>
                      <p>Jawapan betul belum dipaparkan. Pilih pilihan lain sehingga tepat.</p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
