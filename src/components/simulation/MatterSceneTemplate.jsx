import { useEffect, useRef } from "react";

export default function MatterSceneTemplate() {
  const sceneRef = useRef(null);

  useEffect(() => {
    let cleanup = () => {};

    async function startMatterScene() {
      // Template only. Install matter-js before importing this component:
      // npm install matter-js
      const Matter = await import("matter-js");
      const { Engine, Render, Runner, Bodies, Composite } = Matter;
      const engine = Engine.create();
      const render = Render.create({
        element: sceneRef.current,
        engine,
        options: {
          width: 900,
          height: 520,
          wireframes: false,
          background: "transparent",
        },
      });

      const ground = Bodies.rectangle(450, 500, 860, 28, { isStatic: true });
      const trolley = Bodies.rectangle(180, 180, 92, 44, {
        chamfer: { radius: 10 },
        render: { fillStyle: "#22d3ee" },
      });
      const wheelA = Bodies.circle(150, 210, 14, { render: { fillStyle: "#0f172a" } });
      const wheelB = Bodies.circle(210, 210, 14, { render: { fillStyle: "#0f172a" } });

      Composite.add(engine.world, [ground, trolley, wheelA, wheelB]);
      Render.run(render);
      const runner = Runner.create();
      Runner.run(runner, engine);

      cleanup = () => {
        Render.stop(render);
        Runner.stop(runner);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
        render.canvas.remove();
      };
    }

    startMatterScene();
    return () => cleanup();
  }, []);

  return <div className="matterSceneTemplate" ref={sceneRef} />;
}
