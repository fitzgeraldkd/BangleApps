// TODO: Move constants to settings.
const goal = 104;
const units = "oz";
const startHour = 8;
const endHour = 23;
const increment = 8;
const swipeIncrement = 1;

const PBOX = {
  x1: 10,
  y1: 50,
  x2: 166,
  y2: 80
};

let drawTimeout;
let state;

function getInitialState() {
  return {
    date: new Date().toISOString().split("T")[0],
    amount: 0
  };
}

function loadState() {
  state = require("Storage").readJSON("hydrate.json",1) || getInitialState();
}
loadState();

function calcPercent(val, min, max) {
  return Math.max(Math.min((val - min) / (max - min), 1), 0);
}

function percentToX(percent) {
  return percent * (PBOX.x2 - PBOX.x1) + PBOX.x1;
}

function addAmount(amount) {
  state.amount = Math.max(state.amount + amount, 0);
  require("Storage").writeJSON("hydrate.json", state);
  updateProgress();
}

function updateProgress() {
  const date = new Date();

  const waterProgress = calcPercent(state.amount, 0, goal);
  const timeProgress = calcPercent(date.getHours(), startHour, endHour);

  g.clearRect(PBOX.x1, PBOX.y1 - 17, PBOX.x2, PBOX.y2 + 12);
  g.setColor(0, 0, 1);
  g.fillRect(PBOX.x1, PBOX.y1, percentToX(waterProgress), PBOX.y2);
  g.setColor(g.theme.fg);
  g.drawRect(PBOX.x1, PBOX.y1, PBOX.x2, PBOX.y2);

  g.setFont("6x15").setFontAlign(0, 1);
  g.drawString(require("locale").time(date, 1) + require("locale").meridian(date), 88, PBOX.y1 - 2);

  g.setFont("6x8").setFontAlign(-1, 1);
  g.drawString(startHour, PBOX.x1, PBOX.y1 - 2);

  g.setFontAlign(1, 1);
  g.drawString(endHour, PBOX.x2, PBOX.y1 - 2);

  if (timeProgress > 0 && timeProgress < 1) {
    g.setColor(timeProgress < waterProgress ? -1 : g.theme.fg);
    const timeX = percentToX(timeProgress);
    g.drawLine(timeX, PBOX.y1, timeX, PBOX.y2);
  }

  g.setColor(g.theme.fg).setFontAlign(0, -1);
  g.drawString(state.amount.toString() + " / " + goal.toString() + " " + units, 88, PBOX.y2 + 4);

  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(updateProgress, 60000 - (date % 60000));
}

function draw() {
  g.clear().setColor(g.theme.fg);
  g.drawLine(0, 119, 176, 119);
  g.drawLine(88, 119, 88, 176);

  g.setFont("12x20").setFontAlign(0, 0);
  g.drawString("-" + increment, 44, 148);
  g.drawString("+" + increment, 132, 148);

  updateProgress();
}

Bangle.on("touch", (button, xy) => {
  if (xy.y < 119) return;
  if (xy.x < 88) addAmount(-1 * increment);
  else addAmount(increment);
});

Bangle.on("swipe", (lr, ud) => {
  addAmount(lr * swipeIncrement);
});

Bangle.setUI({mode:"custom",back:() => Bangle.showClock()});

Bangle.loadWidgets();
Bangle.drawWidgets();

draw();
