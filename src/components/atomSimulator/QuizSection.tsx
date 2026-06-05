import { useMemo, useState } from "react";
import { ATOM_QUIZ, type AtomQuizQuestion } from "../../data/atomSimulator/CompoundDatabase";

type AnswerKey = AtomQuizQuestion["answer"];

export default function QuizSection() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<AnswerKey | "">("");
  const [answers, setAnswers] = useState<Record<number, AnswerKey>>({});
  const [done, setDone] = useState(false);
  const current = ATOM_QUIZ[index];

  const result = useMemo(() => {
    const correct = ATOM_QUIZ.reduce((total, question, questionIndex) => {
      return answers[questionIndex] === question.answer ? total + 1 : total;
    }, 0);

    return {
      correct,
      wrong: ATOM_QUIZ.length - correct,
      score: Math.round((correct / ATOM_QUIZ.length) * 100),
    };
  }, [answers]);

  const choose = (answer: AnswerKey) => {
    if (selected || done) {
      return;
    }

    setSelected(answer);
    setAnswers((currentAnswers) => ({ ...currentAnswers, [index]: answer }));
  };

  const next = () => {
    if (!selected) {
      return;
    }

    if (index === ATOM_QUIZ.length - 1) {
      setDone(true);
      return;
    }

    setIndex((currentIndex) => currentIndex + 1);
    setSelected("");
  };

  const retry = () => {
    setIndex(0);
    setSelected("");
    setAnswers({});
    setDone(false);
  };

  const progress = done ? 100 : ((index + (selected ? 1 : 0)) / ATOM_QUIZ.length) * 100;

  return (
    <section className="atomQuiz atomSimPanel">
      <button className="atomQuiz__toggle" type="button" onClick={() => setOpen((value) => !value)}>
        <span>Kuiz Kefahaman</span>
        <strong>{open ? "Tutup Kuiz" : "Buka Kuiz"}</strong>
      </button>

      {open && (
        <div className="atomQuiz__body">
          <div className="atomQuiz__progress" aria-hidden="true">
            <i style={{ width: `${progress}%` }} />
          </div>

          {done ? (
            <div className="atomQuiz__complete">
              <span>Skor</span>
              <strong>{result.score}%</strong>
              <div className="atomQuiz__summary">
                <p>
                  <b>{result.correct}</b>
                  Betul
                </p>
                <p>
                  <b>{result.wrong}</b>
                  Salah
                </p>
              </div>
              <p>
                {result.correct >= 8
                  ? "Penguasaan konsep sangat baik."
                  : result.correct >= 5
                    ? "Konsep asas semakin kukuh. Semak semula perbezaan unsur, sebatian dan campuran."
                    : "Ulang semula aktiviti binaan dan fokus kepada kategori setiap model zarah."}
              </p>
              <button type="button" onClick={retry}>
                Cuba Lagi
              </button>
            </div>
          ) : (
            <>
              <div className="atomQuiz__meta">
                <span>Soalan {index + 1}/{ATOM_QUIZ.length}</span>
                <strong>{selected ? (selected === current.answer ? "Betul" : "Salah") : "Pilih jawapan"}</strong>
              </div>

              <h2>{current.question}</h2>

              <div className="atomQuiz__options">
                {(Object.entries(current.options) as [AnswerKey, string][]).map(([key, value]) => {
                  const correct = selected && key === current.answer;
                  const wrong = selected === key && selected !== current.answer;

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={Boolean(selected)}
                      className={[
                        "atomQuizOption",
                        correct ? "atomQuizOption--correct" : "",
                        wrong ? "atomQuizOption--wrong" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => choose(key)}
                    >
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </button>
                  );
                })}
              </div>

              {selected && (
                <div className="atomQuiz__feedback">
                  <strong>Jawapan: {current.answer}</strong>
                  <p>{current.explanation}</p>
                  <button type="button" onClick={next}>
                    {index === ATOM_QUIZ.length - 1 ? "Lihat Skor" : "Soalan Seterusnya"}
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
