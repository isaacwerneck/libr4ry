export function createStudyReminder(now = () => performance.now(), interval = 45 * 60 * 1000) {
  let previous = now();
  let active = false;
  let elapsed = 0;
  let due = false;
  return {
    update(visible, enabled) {
      const current = now();
      if (enabled && active) elapsed += Math.max(0, current - previous);
      previous = current;
      active = visible && enabled;
      if (!enabled) { elapsed = 0; due = false; }
      if (elapsed >= interval) due = true;
      return due && visible && enabled;
    },
    dismiss() { previous = now(); elapsed = 0; due = false; },
  };
}
