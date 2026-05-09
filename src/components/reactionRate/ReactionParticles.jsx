export default function ReactionParticles({ running, rateLevel }) {
  const particles = Array.from({ length: 18 }, (_, index) => ({
    id: index,
    style: {
      "--x": `${8 + (index % 6) * 16}%`,
      "--y": `${18 + Math.floor(index / 6) * 25}%`,
      "--delay": `${(index % 7) * -0.28}s`,
      "--speed": `${Math.max(0.75, 2.1 - rateLevel * 0.45)}s`,
    },
    acid: index % 3 !== 0,
  }));

  return (
    <div className={running ? "reactionParticles reactionParticles--running" : "reactionParticles"}>
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={particle.acid ? "reactionParticle reactionParticle--acid" : "reactionParticle reactionParticle--solid"}
          style={particle.style}
        />
      ))}
      <i className="reactionCollision reactionCollision--one" />
      <i className="reactionCollision reactionCollision--two" />
      <i className="reactionCollision reactionCollision--three" />
    </div>
  );
}
