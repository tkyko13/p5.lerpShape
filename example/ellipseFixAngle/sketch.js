let progress = 0;
let progressSp = 0.005;

function setup() {
  createCanvas(400, 500);
}

function draw() {
  background(30);
  noFill();

  let w = 100;
  let h = 20;
  let angle = PI * 1.3;

  progress += progressSp;
  if (progress > 1) progress = 0;
  // if (0 > progress || progress > 1) progressSp = -progressSp;
  // progress = mouseX / width;

  noStroke();
  fill(255);
  text('Corrected Angle (Geometric)', 50, 50);
  withLerpShape(progress, () => {
    strokeWeight(2);
    stroke(255);
    noFill();
    ellipse(100, 100, w, h);
    arc(100 + 20 + w, 100, w, h, 0, angle);
  });

  noStroke();
  fill(255);
  text('Standard p5.js Angle (Parametric)', 50, 200);
  withLerpShape(
    progress,
    () => {
      strokeWeight(2);
      stroke(255);
      noFill();
      ellipse(100, 250, w, h);
      arc(100 + 20 + w, 250, w, h, 0, angle);
    },
    { fixAngle: false },
  );

  noStroke();
  fill(200, 200, 0);
  text(
    'Notice: fixAngle aligns the arc with its geometric direction, \nwhich differs from the default p5.js behavior.',
    50,
    350,
  );
  strokeWeight(2);
  stroke(255, 0, 0);
  noFill();
  arc(100, 400, w, h, 0, angle);
  withLerpShape(progress, () => {
    strokeWeight(2);
    stroke(255);
    noFill();
    arc(100, 400, w, h, 0, angle);
  });

  strokeWeight(2);
  stroke(255, 0, 0);
  noFill();
  arc(100 + 20 + w, 400, w, h, 0, angle);
  withLerpShape(
    progress,
    () => {
      strokeWeight(2);
      stroke(255);
      noFill();
      arc(100 + 20 + w, 400, w, h, 0, angle);
    },
    { fixAngle: false },
  );
}
