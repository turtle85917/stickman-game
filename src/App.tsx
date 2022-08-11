import { useEffect, useRef, useState } from "react";

import map from "./utils/Map";
import { direction, getDirection } from "./utils/Utility";

interface mapData { $text: string[], spike?: string[]; ladder?: string[]; dropSpike?: string[]; };
type position = { x: number; y: number; width: number; height: number; };

function moveSpeed(life: number): number {
  if (life === 0) return Math.random();
  if (life < 0) return -life / +(`1${"0".repeat((-life).toString().length + 12)}`);
  return life;
}

function collides(a: position, b: position): boolean { // a collide with b?
  if (a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y) return true;

  return false;
}

function App() {
  const ref = useRef<HTMLCanvasElement | null>(null); // game canvas ref

  const [level, setLevel] = useState<number>(1); // game stage
  const [clear, setClear] = useState<boolean>(false); // game clear

  const [direction, setDirection] = useState<direction>("no"); // player move direction
  const [onGround, setGround] = useState<boolean>(false); // player on ground?

  const [passDropSpike, setPassDropSpike] = useState<boolean[]>([]); // dropping spike?

  const [player, setPlayer] = useState<HTMLImageElement | undefined>(undefined); // main player ref
  const [goal, setGoal] = useState<HTMLImageElement | undefined>(undefined); // finish object

  const [position, setPosition] = useState<{ x: number; y: number; }>({ x: 0, y: 850 }); // player position

  const [life, setLife] = useState<number>(5); // player spent life
  const [textLevel, setTextLevel] = useState<number>(0); // text level

  const [moving, setAction] = useState<boolean>(true); // player action?

  const [mana, setMana] = useState<number>(100); // player spent mana
  const [dash, setDash] = useState<boolean>(false); // player dash?

  useEffect(() => { // canvas update
    if (ref.current) {
      const ctx = ref.current.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, ref.current.width, ref.current.height); // canvas clear

      if (level > 3) {
        ctx.font = "20px serif";
        ctx.fillText("제작자의 귀차니즘으로 인해 4레벨 이후는 없습니다.", ref.current.width / 2, ref.current.height / 2 - 300);
        ctx.fillText("종종 업데이트될지도?", ref.current.width / 2, ref.current.height / 2 - 260);
      }

      if (clear) {  // clear message
        ctx.font = "48px serif";
        ctx.fillText("이겼습니다!", ref.current.width / 2, ref.current.height / 2);
        ctx.font = "29px serif";
        ctx.fillText("다음으로 진행할려면 R을 누르십시오.", ref.current.width / 2, ref.current.height / 2 + 50);
      }

      if (life < -299) {
        ctx.font = "29px serif";
        ctx.fillText("더 이상 움직이지 못 하는 것 같네요.", ref.current.width / 2, ref.current.height / 2);
      }

      ctx.font = "48px serif";
      ctx.fillText(`Level. ${level}`, ref.current.width / 2, 50);

      // spent life message
      ctx.font = "48px serif";
      ctx.fillText(`x${life}`, 45, 50);

      // spent mana message
      ctx.font = "48px serif";
      ctx.fillText(`x${+(mana.toFixed(2))}`, 45, 110);

      let heartImg = new Image();
      heartImg.src = "/assets/heart.png";
      heartImg.onload = () => ctx.drawImage(heartImg, 0, 5, 50, 50);

      let mpImg = new Image();
      mpImg.src = "/assets/mana.png";
      mpImg.onload = () => ctx.drawImage(mpImg, 0, 65, 50, 50);

      // finish obeject draw
      let goalImg = new Image();
      goalImg.src = "/assets/goal.png";
      goalImg.onload = () => {
        setGoal(goalImg);
        ctx.drawImage(goalImg, ref.current!.width - goalImg.width, ref.current!.height - goalImg.height);
      };

      const data: mapData = map[level - 1];
      if (data) {
        // draw drop-spikes
        let dropSpikeImg = new Image();
        dropSpikeImg.src = "/assets/drop-spike.png";
        dropSpikeImg.onload = () => {
          data.dropSpike?.map(($d, $idx) => {
            if (passDropSpike[$idx] === undefined) {
              setPassDropSpike([
                ...passDropSpike,
                false
              ]);
            }

            const $position = $d
              .replace("height", (ref.current!.height - dropSpikeImg.height).toString())
              .split("-")[0]
              .split("::")
              .map(Number);
            const $size = $d.split("-")[1]?.split("::").map(Number) || [dropSpikeImg.width, dropSpikeImg.height];

            const dropping = collides(
              { x: position.x, y: position.y, width: player!.width / 2, height: player!.height },
              { x: $position[0], y: $position[1], width: $size[0], height: ref.current!.height + $size[1] }
            );

            const newY = ref.current!.height - dropSpikeImg.height + $size[1];

            const collidDropSpike = collides(
              { x: position.x, y: position.y, width: player!.width / 2, height: player!.height },
              { x: $position[0], y: newY, width: $size[0] / 3, height: $size[1] }
            );

            if (collidDropSpike && passDropSpike[$idx]) { // ouch!
              ctx.font = "23px serif";
              ctx.fillText("아파 ㅠㅠ", position.x, ref.current!.height - player!.height - 90);

              setLife(life - 0.5);
            }

            if (dropping && !passDropSpike[$idx]) {
              setTimeout(() => {
                ctx.drawImage(dropSpikeImg, $position[0], newY, $size[0], $size[1]);

                setPassDropSpike([
                  ...passDropSpike.slice(0, $idx),
                  true,
                  ...passDropSpike.slice($idx + 1)
                ]);
              }, 485);
            }
            else if (dropping || passDropSpike[$idx]) {
              ctx.drawImage(dropSpikeImg, $position[0], newY, $size[0], $size[1]);
            }

            if (!passDropSpike[$idx]) {
              ctx.drawImage(dropSpikeImg, $position[0], $position[1], $size[0], $size[1]);
            }
          });
        }

        // draw spikes
        let spikeImg = new Image();
        spikeImg.src = "/assets/spike.png";
        spikeImg.onload = () => {
          data.spike?.map($d => {
            const $position = $d
              .replace("height", (ref.current!.height - spikeImg.height).toString())
              .split("-")[0]
              .split("::")
              .map(Number);
            const $size = $d.split("-")[1]?.split("::").map(Number) || [spikeImg.width, spikeImg.height];

            if ($size) {
              $position[1] += $size[1];
            }

            ctx.drawImage(spikeImg, $position[0], $position[1], $size[0], $size[1]);

            const collidSpike = collides(
              { x: position.x, y: position.y, width: player!.width / 2, height: player!.height },
              { x: $position[0], y: $position[1], width: $size[0] / 4.5, height: $size[1] }
            );

            if (collidSpike) { // ouch!
              ctx.font = "23px serif";
              ctx.fillText("아파 ㅠㅠ", position.x, ref.current!.height - player!.height - 90);

              setLife(life - 0.5);
            }
          });
        }

        // draw ladders
        let ladderImg = new Image();
        ladderImg.src = "/assets/ladder.png";
        ladderImg.onload = () => {
          data.ladder?.map($d => {
            const $position = $d
              .replace("height", (ref.current!.height - ladderImg.height).toString())
              .split("-")[0]
              .split("::")
              .map(Number);
            const $size = $d.split("-")[1]?.split("::").map(Number) || [ladderImg.width, ladderImg.height];

            ctx.drawImage(ladderImg, $position[0], $position[1], $size[0], $size[1]);

            // draw floor
            let floorImg = new Image();
            floorImg.src = "/assets/floor.png";
            floorImg.onload = () => {
              const $size = [floorImg.width, floorImg.height];
              ctx.drawImage(floorImg, $position[0], $position[1] - floorImg.height, $size[0] + 160, $size[1]);

              const collidFloor = collides(
                { x: position.x, y: position.y, width: player!.width / 2, height: player!.height },
                { x: $position[0], y: $position[1] - floorImg.height, width: $size[0] + 85, height: $size[1] }
              );

              if (!collidFloor) { // fall off a ladder
                setGround(false);
              }
            };

            const collidLadder = collides(
              { x: position.x, y: position.y, width: player!.width / 2, height: player!.height },
              { x: $position[0], y: $position[1], width: $size[0] / 2, height: $size[1] }
            );

            if (collidLadder) {
              if (direction === "up") { // climb on ladder
                setPosition({ x: position.x, y: ref.current!.height - ladderImg.height - $size[1] - floorImg.height  });

                if (level === 2 && textLevel === 2) {
                  setTextLevel(textLevel + 1);
                }
              }

              ctx.font = "23px serif";
              ctx.fillText("사다리 타기 - W / ↑", position.x, ref.current!.height - player!.height - 60);
            }
          });
        };
      }

      // draw player
      let playerImg = new Image();
      playerImg.src = "/assets/player.png";
      
      playerImg.onload = () => {
        setPlayer(playerImg);
        ctx.drawImage(playerImg, position.x, position.y);

        if (position.y < ref.current!.height - playerImg.height && !onGround) {
          setPosition({ x: position.x, y: ref.current!.height - playerImg.height });
          setGround(true);
        }

        if (data) { // draw an announcement message
          if (level === 1 && clear && textLevel === 2) {
            setTextLevel(textLevel + 1);
          }

          if ((["left", "right"] as direction[]).includes(direction) && level === 1 && textLevel === 1) setTextLevel(textLevel + 1);
          if ((["left", "right"] as direction[]).includes(direction) && level === 2 && [0, 1].includes(textLevel)) setTextLevel(textLevel + 1);
          if ((["left", "right"] as direction[]).includes(direction) && level === 3 && textLevel === 0) setTextLevel(textLevel + 1);

          if (data.$text[textLevel]) {
            ctx.font = "23px serif";
            ctx.fillText(data.$text[textLevel], 150, playerImg.height + 40);
          }
        }
      }
    }

    return (() => {
      setAction(false); // action stop
    });
  }, [moving]);

  return (
    <>
      <div className="game">
        <canvas
          ref={ref} width={1000} height={1000}
          tabIndex={0}
          onKeyUp={() => {
            setDirection("no");
          }}
          onClick={() => {
            if (level === 1 && textLevel === 0) {
              setTextLevel(textLevel + 1);
              setAction(true);
            }
          }}
          onKeyDown={(event) => {
            const direction = getDirection(event.code);
            setDirection(direction);
            setDash(event.shiftKey);
  
            if (direction !== "no") {
              setAction(true);
              if (direction === "restart") { // game restart
                setPosition({ x: 0, y: 850 });
                setLife(5);
                setMana(100);
                setPassDropSpike([]);
                setTextLevel(level === 1 ? 1 : 0);
                setAction(true);
                setDash(false);
                if (clear) {
                  setLevel(level + 1);
                  setClear(false);
                }
              }
              
              const dashSpeed: number = dash && mana > 0 ? 3.5 : 0;
              if (dash && mana > 0) {
                setMana(mana - 1);
                if (mana < 0) setMana(0);
              }
  
              if (dash && ["left", "right"].includes(direction) && level === 1 && textLevel === 2) setTextLevel(textLevel + 1);
  
              if (direction === "left") {
                setPosition({ x: position.x - moveSpeed(life) - dashSpeed, y: position.y });
                if (position.x < 0) { // wall
                  setPosition({ x: position.x + 1, y: position.y });
                }
              }
              if (direction === "right") {
                setPosition({ x: position.x + moveSpeed(life) + dashSpeed, y: position.y });
                if (position.x > ref.current!.width - player!.width) { // wall
                  setPosition({ x: position.x - 1, y: position.y });
                }
              }
  
              if (!clear) {
                setClear(collides({ x: position.x, y: position.y, width: player!.width / 2, height: player!.height }, { x: ref.current!.width - goal!.width, y: ref.current!.height - goal!.height, width: goal!.width, height: goal!.height }));
                setAction(true);
              }
            }
          }}
          />
      </div>
    </>
  );
};

export default App;