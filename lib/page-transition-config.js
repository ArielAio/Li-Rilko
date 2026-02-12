const TRANSITION_SLOWDOWN_FACTOR = 1.3;

function scaleMs(value) {
  return Math.round(value * TRANSITION_SLOWDOWN_FACTOR);
}

const PAGE_TRANSITION_CONFIG = {
  coverHoldMs: scaleMs(240),
  navigationTimeoutMs: 5000,
  enter: {
    backDurationMs: scaleMs(1020),
    midDurationMs: scaleMs(1100),
    midDelayMs: scaleMs(70),
    frontDurationMs: scaleMs(1180),
    frontDelayMs: scaleMs(90),
    brandDurationMs: scaleMs(480),
    brandDelayMs: scaleMs(340),
  },
  exit: {
    backDurationMs: scaleMs(1180),
    backDelayMs: scaleMs(70),
    midDurationMs: scaleMs(980),
    midDelayMs: scaleMs(45),
    frontDurationMs: scaleMs(840),
    frontDelayMs: scaleMs(20),
    brandDurationMs: scaleMs(360),
    brandDelayMs: scaleMs(40),
  },
};

function getEnterDurationMs() {
  return Math.max(
    PAGE_TRANSITION_CONFIG.enter.backDurationMs,
    PAGE_TRANSITION_CONFIG.enter.midDurationMs + PAGE_TRANSITION_CONFIG.enter.midDelayMs,
    PAGE_TRANSITION_CONFIG.enter.frontDurationMs + PAGE_TRANSITION_CONFIG.enter.frontDelayMs,
  );
}

function getExitDurationMs() {
  return Math.max(
    PAGE_TRANSITION_CONFIG.exit.backDurationMs + PAGE_TRANSITION_CONFIG.exit.backDelayMs,
    PAGE_TRANSITION_CONFIG.exit.midDurationMs + PAGE_TRANSITION_CONFIG.exit.midDelayMs,
    PAGE_TRANSITION_CONFIG.exit.frontDurationMs + PAGE_TRANSITION_CONFIG.exit.frontDelayMs,
  );
}

function getTransitionCssVars() {
  return {
    "--pt-enter-back-duration": `${PAGE_TRANSITION_CONFIG.enter.backDurationMs}ms`,
    "--pt-enter-mid-duration": `${PAGE_TRANSITION_CONFIG.enter.midDurationMs}ms`,
    "--pt-enter-mid-delay": `${PAGE_TRANSITION_CONFIG.enter.midDelayMs}ms`,
    "--pt-enter-front-duration": `${PAGE_TRANSITION_CONFIG.enter.frontDurationMs}ms`,
    "--pt-enter-front-delay": `${PAGE_TRANSITION_CONFIG.enter.frontDelayMs}ms`,
    "--pt-exit-back-duration": `${PAGE_TRANSITION_CONFIG.exit.backDurationMs}ms`,
    "--pt-exit-back-delay": `${PAGE_TRANSITION_CONFIG.exit.backDelayMs}ms`,
    "--pt-exit-mid-duration": `${PAGE_TRANSITION_CONFIG.exit.midDurationMs}ms`,
    "--pt-exit-mid-delay": `${PAGE_TRANSITION_CONFIG.exit.midDelayMs}ms`,
    "--pt-exit-front-duration": `${PAGE_TRANSITION_CONFIG.exit.frontDurationMs}ms`,
    "--pt-exit-front-delay": `${PAGE_TRANSITION_CONFIG.exit.frontDelayMs}ms`,
    "--pt-brand-enter-duration": `${PAGE_TRANSITION_CONFIG.enter.brandDurationMs}ms`,
    "--pt-brand-enter-delay": `${PAGE_TRANSITION_CONFIG.enter.brandDelayMs}ms`,
    "--pt-brand-exit-duration": `${PAGE_TRANSITION_CONFIG.exit.brandDurationMs}ms`,
    "--pt-brand-exit-delay": `${PAGE_TRANSITION_CONFIG.exit.brandDelayMs}ms`,
  };
}

export {
  PAGE_TRANSITION_CONFIG,
  getEnterDurationMs,
  getExitDurationMs,
  getTransitionCssVars,
};
