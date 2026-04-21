let p = 0;

function setup() {
  createCanvas(600, 400);
  angleMode(DEGREES); // 度数法でも動く

  // saveGif('basic', 4);
}

function draw() {
  background(15, 15, 35);

  // 0.0 ~ 1.0 を往復する進捗値を作成
  p = (cos((frameCount / 120) * 180) + 1) / 2;

  stroke(255);
  strokeWeight(2);
  noFill();

  // 1. 基本的な図形
  // withLerpShapeのcallback
  withLerpShape(p, () => {
    // 四角形 (CENTERモード)
    rectMode(CENTER);
    rect(100, 100, 80, 80);
    // 円 (ellipse)
    ellipse(230, 100, 80, 80);
    // 三角形
    triangle(350, 60, 300, 140, 400, 140);
    // beginShape / vertex
    beginShape();
    vertex(440, 50);
    vertex(500, 50);
    vertex(500, 100);
    vertex(550, 100);
    vertex(550, 140);
    vertex(440, 140);
    endShape(CLOSE);
  });

  // 2. Sequential
  // endLerpShape
  // const n = 5;
  // withLerpShape(p, { steps: n });
  // push();
  // rectMode(CORNER);
  // fill(237, 34, 93, p * 255);
  // stroke(255, 255 - p * 255);
  // translate(100, 270);
  // rotate(270);
  // for (let i = 0; i < n; i++) {
  //   rect(0, -10, 50, 20);
  //   rotate(360 / n);
  // }
  // pop();
  // endLerpShape();

  const n = 6;
  withLerpShape(p, { steps: n });
  push();
  translate(100, 230);
  stroke(100, 200, 255);
  rectMode(CENTER);
  for (let i = n - 1; i >= 0; i--) {
    rect(0, i * 20, 10 + i * 20, 10);
  }
  pop();
  endLerpShape();

  // 3. 文字
  // lerpLineやlerpText
  noStroke();
  fill(255, 200, 0);
  textAlign(CENTER, CENTER);
  textSize(40);
  // 文字列間の変容（オリジナル）
  lerpString('LerpShape', 'Creative', 400, 250, p);
  // タイピング効果
  textAlign(LEFT, BOTTOM);
  textSize(20);
  fill(255);
  lerpText('Loading code progress...', 300, 320, p);
  // アンダーバー
  stroke(255, 100, 100);
  lerpLine(300, 330, 530, 330, p);

  // 4.
}