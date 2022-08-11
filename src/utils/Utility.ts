/**
 * 방향.
 */
export type direction = "restart" | "up" | "down" | "left" | "right" | "no";

/**
 * 누른 키보드의 키에 따라 방향 결졍.
 * @param key 누른 키보드의 키 값.
 */
export function getDirection(key: string): direction {
  switch (key) {
    case "KeyR":
      return "restart";

    case "ArrowUp":
    case "KeyW":
      return "up";

    case "ArrowDown":
    case "KeyS":
      return "down";

    case "ArrowLeft":
    case "KeyA":
      return "left";
    
    case "ArrowRight":
    case "KeyD":
      return "right";

    default:
      return "no";
  }
}