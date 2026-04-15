let t = 0;
let sp = 0.0005;

function setup() {
  createCanvas(400, 400);
  noFill();
  stroke(0);
}

function draw() {
  background(255);

  // 0から1を往復させる
  t += sp;
  if (t < 0 || t > 1) sp *= -1;

  // 100個の円を順番に描画する魔法
  withLerpShape(
    t,
    () => {
      let cols = 10;
      let rows = 10;
      let gap = width / cols;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          let x = i * gap + gap / 2;
          let y = j * gap + gap / 2;

          // 普通の ellipse を呼ぶだけで、
          // 内部で steps に基づいて順番に描画される
          ellipse(x, y, 30, 30);
        }
      }
    },
    { steps: 100 },
  );
}
