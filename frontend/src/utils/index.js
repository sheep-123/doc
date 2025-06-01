//防抖 搜索框、窗口调整、表单验证
function debounce(func, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
//节流 滚动监听、鼠标移动、resize
function throttle(func, delay) {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= delay) {
      func.apply(this, args);
      lastTime = now;
    }
  };
}

export default {
  debounce,
  throttle
};
