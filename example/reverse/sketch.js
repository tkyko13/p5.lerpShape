let p = 0;

function setup() {
  createCanvas(300, 200);

  // saveGif('reverse', 360, { units: 'frames' });
}

function draw() {
  p = -(cos(frameCount / 60) - 1) / 2;

  background(200);
  rectMode(CENTER);
  noFill();

  withLerpShape(p, () => {
    translate(100, 100);
    rect(0, 0, 60, 60);
    rotate(PI * 1.25);
    circle(0, 0, 30);
  });

  withLerpShape(
    p,
    () => {
      translate(200, 100);
      rotate(PI * 0.5);
      rect(0, 0, 60, 60);
      rotate(PI * 1.25);
      circle(0, 0, 30);
    },
    { reverse: true },
  );
}
