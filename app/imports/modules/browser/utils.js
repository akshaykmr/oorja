/* global document */

export const toggleFullScreenForElement = (element) => {
  const requestFullscreen =
    element.requestFullscreen ||
    element.webkitRequestFullscreen ||
    element.mozRequestFullScreen ||
    element.msRequestFullscreen;

  const exitFullscreen =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.mozCancelFullScreen ||
    document.msExitFullscreen;

  const fullscreenElement =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;

  if (!fullscreenElement) {
    requestFullscreen.call(element);
  } else if (exitFullscreen) {
    exitFullscreen.call(document);
  }
};

export const getBodyColor = () => document.body.style.background;

export const setBodyColor = (color) => {
  document.body.style.background = color;
};
