/**
 * p5.lerpShape Example: Handwritten Typography
 * * This example uses the Chars74k-JSON-Dump dataset by Allison Parrish,
 * which is a processed version of the original Chars74k dataset.
 * * Data source: https://github.com/aparrish/chars74k-json-dump
 * Original Dataset: http://www.ee.surrey.ac.uk/CVSSP/demos/chars74k/
 */

const sp = 0.03;
let chars;
let progresses = [];
let typedStrokes = [];
let isTyped = false;

async function setup() {
  createCanvas(600, 600);

  chars = await loadJSON('char74k-normalized.json');

  // saveGif('Handwritten_Typography', 10);
}

function draw() {
  background(245, 240, 230);

  if (!isTyped) {
    textAlign(CENTER, CENTER);
    strokeWeight(1);
    fill(150);
    noStroke();
    textSize(16);
    lerpText('Start typing...', 300, 300, (frameCount % 160) / 100);
  }

  translate(50, 50);
  scale(0.2);
  strokeWeight(5);
  noFill();
  stroke(0);

  for (let i = 0; i < progresses.length; i++) {
    if (progresses[i] < 1) {
      progresses[i] += sp;
      break; // 順番づつ描画する場合は、これを有効にしてください。
    }
  }

  typedStrokes.forEach((stroke, i) => {
    push();
    translate(300 * (i % 9), 400 * int(i / 9));

    const p = progresses[i];
    withLerpShape(
      p,
      () => {
        stroke.forEach((coord) => {
          beginShape();
          coord.forEach((pt) => {
            vertex(pt[0], pt[1]);
          });
          endShape();
        });
      },
      { steps: stroke.length },
    );
    pop();
  });
}

function keyPressed() {
  const typedChars = chars[key];
  if (typedChars) {
    isTyped = true;
    const typedChars = chars[key];
    typedStrokes.push(random(typedChars));
    progresses.push(0);
  }
}

function mouseClicked() {
  isTyped = false;
  typedStrokes = [];
  progresses = [];
}
