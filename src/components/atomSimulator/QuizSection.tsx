import { useMemo, useState, type CSSProperties } from "react";
import { ATOM_QUIZ, type AtomQuizQuestion } from "../../data/atomSimulator/CompoundDatabase";

type AnswerKey = AtomQuizQuestion["answer"];

type ResultBand = {
  title: string;
  message: string;
  badge: string;
  icon: string;
  tone: "excellent" | "great" | "good" | "fair" | "retry";
};

function getResultBand(score: number): ResultBand {
  if (score >= 90) {
    return {
      title: "🎉 TAHNIAH! CEMERLANG",
      message:
        "Anda telah menguasai konsep atom, molekul dan sebatian dengan sangat baik. Anda sudah bersedia meneroka konsep ion dan elektrolisis.",
      badge: "🏆 Pakar Molekul Muda",
      icon: "🎉",
      tone: "excellent",
    };
  }

  if (score >= 80) {
    return {
      title: "🌟 SYABAS! SANGAT BAIK",
      message:
        "Anda memahami kebanyakan konsep dengan baik. Cuba ulang kaji sedikit lagi untuk mencapai tahap cemerlang.",
      badge: "🥈 Pembina Molekul Hebat",
      icon: "🌟",
      tone: "great",
    };
  }

  if (score >= 60) {
    return {
      title: "👏 TAHNIAH! TERUSKAN USAHA",
      message:
        "Anda berada di landasan yang betul. Teruskan membina model atom dan sebatian untuk mengukuhkan kefahaman.",
      badge: "🔬 Peneroka Atom",
      icon: "👏",
      tone: "good",
    };
  }

  if (score >= 40) {
    return {
      title: "💪 USAHA YANG BAIK",
      message:
        "Anda telah mencuba dengan baik. Gunakan semula simulator ini dan perhatikan beza antara atom, molekul unsur, sebatian molekul dan sebatian ionik.",
      badge: "🧪 Saintis Pelatih",
      icon: "💪",
      tone: "fair",
    };
  }

  return {
    title: "🚀 JANGAN MENGALAH",
    message:
      "Setiap saintis hebat bermula dengan latihan. Cuba bina beberapa contoh molekul dahulu, kemudian jawab kuiz semula.",
    badge: "🌱 Penyiasat Zarah Baharu",
    icon: "🚀",
    tone: "retry",
  };
}

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
      wrongQuestions: ATOM_QUIZ.map((question, questionIndex) => ({
        question,
        questionIndex,
        studentAnswer: answers[questionIndex],
      })).filter(({ question, studentAnswer }) => studentAnswer !== question.answer),
    };
  }, [answers]);
  const resultBand = getResultBand(result.score);
  const celebrateResult = result.score >= 80;

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
            <div className={`atomQuizResult atomQuizResult--${resultBand.tone}${celebrateResult ? " atomQuizResult--celebrate" : ""}`}>
              {celebrateResult && (
                <div className="atomQuizResult__confetti" aria-hidden="true">
                  {Array.from({ length: 14 }).map((_, confettiIndex) => {
                    const sparkleStyle = {
                      "--spark-x": `${8 + confettiIndex * 6.2}%`,
                      "--spark-y": `${10 + (confettiIndex % 4) * 13}%`,
                      "--spark-delay": `${confettiIndex * 0.09}s`,
                    } as CSSProperties;

                    return <i key={confettiIndex} style={sparkleStyle} />;
                  })}
                </div>
              )}

              <div className="atomQuizResult__hero">
                <span className="atomQuizResult__icon" aria-hidden="true">
                  {resultBand.icon}
                </span>
                <div>
                  <span>Keputusan Kuiz</span>
                  <h2>{resultBand.title}</h2>
                  <p>{resultBand.message}</p>
                </div>
              </div>

              <div className="atomQuizResult__badge">{resultBand.badge}</div>

              <div className="atomQuiz__summary atomQuizResult__summary">
                <p className="atomQuizResult__score">
                  <b>{result.score}%</b>
                  Skor
                </p>
                <p>
                  <b>{result.correct}</b>
                  Betul
                </p>
                <p>
                  <b>{result.wrong}</b>
                  Salah
                </p>
                <p>
                  <b>{resultBand.badge}</b>
                  Badge pencapaian
                </p>
              </div>

              <div className="atomQuizReview">
                <h3>{result.wrongQuestions.length ? "Jom semak semula" : "Hebat! Semua jawapan anda betul."}</h3>
                {result.wrongQuestions.length ? (
                  <div className="atomQuizReview__list">
                    {result.wrongQuestions.map(({ question, questionIndex, studentAnswer }) => {
                      const answerLabel = studentAnswer || "-";
                      const studentAnswerText = studentAnswer ? question.options[studentAnswer] : "Tidak dijawab";
                      const correctAnswerText = question.options[question.answer];

                      return (
                        <article className="atomQuizReview__item" key={questionIndex}>
                          <span>Soalan {questionIndex + 1}</span>
                          <strong>{question.question}</strong>
                          <dl>
                            <div>
                              <dt>Jawapan murid</dt>
                              <dd>
                                {answerLabel} - {studentAnswerText}
                              </dd>
                            </div>
                            <div>
                              <dt>Jawapan betul</dt>
                              <dd>
                                {question.answer} - {correctAnswerText}
                              </dd>
                            </div>
                          </dl>
                          <p>{question.explanation}</p>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="atomQuizReview__perfect">
                    Teruskan meneroka model zarah dan cuba kaitkan konsep ini dengan ion serta elektrolisis.
                  </p>
                )}
              </div>

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
