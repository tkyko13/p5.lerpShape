let p = 0;

function setup() {
  createCanvas(600, 400);
  angleMode(DEGREES); // 度数法でも動くことを確認

  // saveGif('basic-all', 2);
}

function draw() {
  background(15, 15, 35); // 深い紺色

  // 0.0 ~ 1.0 を往復する進捗値を作成
  p = (cos((frameCount / 60) * 180) + 1) / 2;

  // --- 共通設定 ---
  stroke(255);
  strokeWeight(2);
  noFill();

  // 1. 基本的な図形 (withLerpShape)
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
  withLerpShape(p, () => {
    stroke(100, 200, 255);
    beginShape();
    vertex(50, 250);
    vertex(150, 220);
    vertex(180, 300);
    vertex(100, 350);
    vertex(20, 320);
    endShape(CLOSE);
  });

  // 3. 文字のモーフィング (lerpString)
  withLerpShape(p, () => {
    noStroke();
    fill(255, 200, 0);
    textAlign(CENTER, CENTER);
    textSize(40);

    // 文字列間の変容
    lerpString('LerpShape', 'Creative', 400, 250);

    // タイピング効果
    textSize(20);
    fill(255);
    text('Loading code progress...', 400, 320);
  });

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
