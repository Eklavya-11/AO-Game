export interface KeyState {
  [key: string]: boolean;
}

export interface MobileInputState {
  dx: number;
  dy: number;
}

export class InputManager {
  private keysPressed: KeyState = {};
  private mobileInput: MobileInputState = { dx: 0, dy: 0 };
  private cleanupListeners: (() => void) | null = null;

  public initListeners() {
    if (typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      this.keysPressed[e.key] = true;
      this.keysPressed[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.keysPressed[e.key] = false;
      this.keysPressed[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    this.cleanupListeners = () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }

  public destroy() {
    if (this.cleanupListeners) {
      this.cleanupListeners();
      this.cleanupListeners = null;
    }
  }

  public setMobileInput(dx: number, dy: number) {
    this.mobileInput = { dx, dy };
  }

  public getMovementDelta(speed: number): { moveX: number; moveY: number } {
    let moveX = this.mobileInput.dx * speed;
    let moveY = this.mobileInput.dy * speed;

    const k = this.keysPressed;
    if (k["KeyW"] || k["w"] || k["ArrowUp"] || k["arrowup"]) moveY -= speed;
    if (k["KeyS"] || k["s"] || k["ArrowDown"] || k["arrowdown"]) moveY += speed;
    if (k["KeyA"] || k["a"] || k["ArrowLeft"] || k["arrowleft"]) moveX -= speed;
    if (k["KeyD"] || k["d"] || k["ArrowRight"] || k["arrowright"]) moveX += speed;

    return { moveX, moveY };
  }

  public isKeyPressed(key: string): boolean {
    return Boolean(this.keysPressed[key]);
  }
}
