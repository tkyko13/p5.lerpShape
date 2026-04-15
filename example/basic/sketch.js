let p = 0;

function setup() {
  createCanvas(600, 400);
  angleMode(DEGREES); // 度数法でも動く

  // saveGif('basic-all', 2);
}

function draw() {
  background(15, 15, 35);

  // 0.0 ~ 1.0 を往復する進捗値を作成
  p = (cos((frameCount / 60) * 180) + 1) / 2;

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
    ellipse(300, 100, 80, 80);
    // 三角形
    triangle(500, 60, 540, 140, 460, 140);
  });

  // 2. カスタム形状 (beginShape / vertex)
  // endLerpShape
  withLerpShape(p);
  stroke(100, 200, 255);
  beginShape();
  vertex(50, 250);
  vertex(150, 220);
  vertex(180, 300);
  vertex(100, 350);
  vertex(20, 320);
  endShape(CLOSE);
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

  // 4. 進捗バー（おまけ）
  drawProgressBar(p);
}

function drawProgressBar(progress) {
  noStroke();
  fill(50);
  rectMode(CORNER);
  rect(0, height - 5, width, 5);
  fill(0, 255, 150);
  rect(0, height - 5, width * progress, 5);
}
