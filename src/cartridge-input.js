export function bindCartridgeInput(
  stage,
  { enabled = () => true, navigate, insert, eject, activate, signal },
) {
  let pointer = null;
  const cancel = () => {
    pointer = null;
  };
  stage.addEventListener(
    "pointerdown",
    (event) => {
      if (!event.isPrimary) return cancel();
      if (!enabled() || event.button !== 0) return;
      pointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        target: event.target,
        consumed: false,
      };
      stage.setPointerCapture(event.pointerId);
    },
    { signal },
  );
  function swipe(event) {
    if (!pointer || event.pointerId !== pointer.id || pointer.consumed) return;
    if (!enabled()) return cancel();
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    if (Math.abs(dx) > Math.abs(dy) * 1.15) {
      pointer.consumed = true;
      navigate(dx < 0 ? 1 : -1);
    } else if (Math.abs(dy) > Math.abs(dx) * 1.15) {
      pointer.consumed = true;
      if (dy > 0) insert();
      else eject();
    }
  }
  stage.addEventListener("pointermove", swipe, { signal });
  stage.addEventListener(
    "pointerup",
    (event) => {
      if (!pointer || event.pointerId !== pointer.id) return;
      swipe(event);
      if (
        pointer &&
        enabled() &&
        !pointer.consumed &&
        Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < 10
      )
        activate({
          x: event.clientX,
          y: event.clientY,
          target: pointer.target,
        });
      cancel();
    },
    { signal },
  );
  stage.addEventListener("pointercancel", cancel, { signal });
  stage.addEventListener("lostpointercapture", cancel, { signal });
  stage.addEventListener(
    "keydown",
    (event) => {
      if (!enabled() || event.target !== stage) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        navigate(event.key === "ArrowRight" ? 1 : -1);
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (event.key === "ArrowDown") insert();
        else eject();
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!event.repeat) activate();
      }
    },
    { signal },
  );
}
