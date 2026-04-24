/**
 * p5.lerpShape.js
 * p5.jsの図形描画をプログレス値(0.0 - 1.0)で補完するライブラリ
 */
{
  if (typeof window.p5 !== 'undefined') {
    // --- 内部状態の管理 ---
    let _currentLerpProgress = null;
    let _shapeVertices = [];
    let _isLerpShapeMode = false;
    let _isInsideWithLerpShape = false;
    let _currentSteps = 0;
    let _currentStepIndex = 0;
    let _currentOptions = {};
    let _prevOptions = {};

    // --- オリジナル関数の退避 (モンキーパッチ用) ---
    const _originalLine = p5.prototype.line;
    const _originalRect = p5.prototype.rect;
    const _originalEllipse = p5.prototype.ellipse;
    const _originalCircle = p5.prototype.circle;
    const _originalArc = p5.prototype.arc;
    const _originalTriangle = p5.prototype.triangle;
    const _originalText = p5.prototype.text;
    const _originalBeginShape = p5.prototype.beginShape;
    const _originalVertex = p5.prototype.vertex;
    const _originalEndShape = p5.prototype.endShape;

    // ==========================================
    // 1. メインAPI (ユーザーが直接呼ぶ関数)
    // ==========================================

    /**
     * 指定した進捗度でコールバック内の図形を描画する
     * @param {Number} progress 0.0 ~ 1.0 の数値
     * @param {Function} callback 描画関数を含む処理
     */
    p5.prototype.withLerpShape = function (progress, arg2, arg3 = {}) {
      let callback;
      let options;

      // 第2引数が関数の場合（標準的な書き方）
      if (typeof arg2 === 'function') {
        callback = arg2;
        options = arg3;
      }
      // 第2引数がオブジェクトの場合（callback省略、optionsのみ）
      else if (typeof arg2 === 'object' && arg2 !== null) {
        callback = null; // またはデフォルトの空関数
        options = arg2;
      }
      // それ以外（第2引数がない場合など）
      else {
        callback = null;
        options = arg3;
      }

      // progress
      _currentLerpProgress = progress;
      _isInsideWithLerpShape = true;

      // options
      _prevOptions = _currentOptions;
      _currentOptions = {
        reverse: options.reverse || false,
      };

      // stepsの設定は別途
      _currentSteps = options.steps || 0;
      _currentStepIndex = 0;

      if (typeof callback === 'function') {
        this.push();
        callback();
        this.pop();

        this.endLerpShape();
      }
    };

    /**
     * 手動でLerpモードを終了する (基本はwithLerpShapeを推奨)
     */
    p5.prototype.endLerpShape = function () {
      _currentLerpProgress = null;
      _isInsideWithLerpShape = false;

      // 入れ子の場合などのためにもとに戻す
      _currentOptions = _prevOptions;
    };

    // p5.prototype.lerpNext = function (offset) {
    // };

    // ==========================================
    // 3. 基本図形のオーバーライド
    // ==========================================

    p5.prototype.line = function (...args) {
      if (_currentLerpProgress !== null) {
        // 進捗計算
        const p = _calculateLocalProgress(
          _getValidatedProgress(_currentLerpProgress),
        );
        if (p <= 0) return;
        if (p >= 1) return _originalLine.apply(this, args);

        // 内部関数には計算済みの p を渡す
        return this.lerpLine(...args, p, _currentOptions);
      }
      return _originalLine.apply(this, args);
    };

    p5.prototype.rect = function (...args) {
      if (_currentLerpProgress !== null) {
        const p = _calculateLocalProgress(
          _getValidatedProgress(_currentLerpProgress),
        );
        if (p <= 0) return;
        if (p >= 1)
          return _originalRect.call(this, args[0], args[1], args[2], args[3]);

        // ※角丸(radius)引数は現在未対応のため最初の4つを使用
        return this.lerpRect(
          args[0],
          args[1],
          args[2],
          args[3],
          p,
          _currentOptions,
        );
      }
      return _originalRect.apply(this, args);
    };

    p5.prototype.triangle = function (...args) {
      if (_currentLerpProgress !== null) {
        const p = _calculateLocalProgress(
          _getValidatedProgress(_currentLerpProgress),
        );
        if (p <= 0) return;
        if (p >= 1) return _originalTriangle.apply(this, args);
        return this.lerpTriangle(...args, p, _currentOptions);
      }
      return _originalTriangle.apply(this, args);
    };

    p5.prototype.ellipse = function (...args) {
      if (_currentLerpProgress !== null) {
        const p = _calculateLocalProgress(
          _getValidatedProgress(_currentLerpProgress),
        );
        if (p <= 0) return;
        if (p >= 1) return _originalEllipse.apply(this, args);

        return this.lerpEllipse(
          args[0],
          args[1],
          args[2],
          args[3],
          p,
          _currentOptions,
        );
      }
      return _originalEllipse.apply(this, args);
    };

    p5.prototype.circle = function (...args) {
      if (_currentLerpProgress !== null) {
        const p = _calculateLocalProgress(
          _getValidatedProgress(_currentLerpProgress),
        );
        if (p <= 0) return;
        if (p >= 1) return _originalCircle.apply(this, args);
        return this.lerpEllipse(
          args[0],
          args[1],
          args[2],
          args[2],
          p,
          _currentOptions,
        );
      }
      return _originalCircle.apply(this, args);
    };

    p5.prototype.arc = function (...args) {
      if (_currentLerpProgress !== null) {
        const p = _calculateLocalProgress(
          _getValidatedProgress(_currentLerpProgress),
        );
        if (p <= 0) return;
        if (p >= 1) return _originalArc.apply(this, args);
        return this.lerpArc(
          args[0],
          args[1],
          args[2],
          args[3],
          args[4],
          args[5],
          p,
          _currentOptions,
        );
      }
      return _originalArc.apply(this, args);
    };

    p5.prototype.text = function (...args) {
      if (_currentLerpProgress !== null) {
        const p = _calculateLocalProgress(
          _getValidatedProgress(_currentLerpProgress),
        );
        if (p <= 0) return;
        if (p >= 1) return _originalText.apply(this, args);
        return this.lerpText(args[0], args[1], args[2], p);
      }
      return _originalText.apply(this, args);
    };

    // ==========================================
    // 4. カスタム形状 (Vertex) のハンドリング
    // ==========================================

    p5.prototype.beginShape = function (...args) {
      if (_currentLerpProgress !== null) {
        _isLerpShapeMode = true;
        _shapeVertices = [];
        return;
      }
      return _originalBeginShape.apply(this, args);
    };

    p5.prototype.vertex = function (...args) {
      if (_isLerpShapeMode) {
        _shapeVertices.push({ x: args[0], y: args[1] });
        return;
      }
      return _originalVertex.apply(this, args);
    };

    p5.prototype.endShape = function (...args) {
      if (_isLerpShapeMode) {
        _isLerpShapeMode = false;
        if (args[0] === this.CLOSE) {
          _shapeVertices.push(_shapeVertices[0]);
        }
        const p = _calculateLocalProgress(
          _getValidatedProgress(_currentLerpProgress),
        );
        if (p <= 0) return;
        // if (p >= 1) return
        this.lerpVertices(_shapeVertices, p);
        return;
      }
      return _originalEndShape.apply(this, args);
    };

    // ==========================================
    // 5. Lerp実体化ロジック (計算エンジン)
    // ==========================================

    p5.prototype.lerpLine = function (x1, y1, x2, y2, progress, options = {}) {
      let p = _getValidatedProgress(progress);
      if (p <= 0) return;
      if (p >= 1) return _originalLine.call(this, x1, y1, x2, y2);

      if (options.reverse) {
        return _originalLine.call(
          this,
          x2,
          y2,
          this.lerp(x2, x1, p),
          this.lerp(y2, y1, p),
        );
      }
      const tx = this.lerp(x1, x2, p);
      const ty = this.lerp(y1, y2, p);
      return _originalLine.call(this, x1, y1, tx, ty);
    };

    p5.prototype.lerpRect = function (a, b, c, d, progress, options = {}) {
      let p = _getValidatedProgress(progress);
      if (p <= 0) return;
      if (p >= 1) return _originalRect.call(this, a, b, c, d);

      let x, y, w, h;
      const currentRectMode = this._renderer.states.rectMode; //
      if (currentRectMode === this.CORNERS) {
        x = this.min(a, c);
        y = this.min(b, d);
        w = this.abs(c - a);
        h = this.abs(d - b);
      } else if (currentRectMode === this.RADIUS) {
        x = a - c;
        y = b - d;
        w = c * 2;
        h = d * 2;
      } else if (currentRectMode === this.CENTER) {
        x = a - c / 2;
        y = b - d / 2;
        w = c;
        h = d;
      } else {
        x = a;
        y = b;
        w = c;
        h = d;
      }

      const vertices = [
        { x: x, y: y },
        { x: x + w, y: y },
        { x: x + w, y: y + h },
        { x: x, y: y + h },
        { x: x, y: y },
      ];
      if (options.reverse) {
        vertices.reverse();
      }
      this.lerpVertices(vertices, p);
    };

    p5.prototype.lerpTriangle = function (
      x1,
      y1,
      x2,
      y2,
      x3,
      y3,
      progress,
      options = {},
    ) {
      let p = _getValidatedProgress(progress);
      if (p <= 0) return;
      if (p >= 1) return _originalTriangle.call(this, x1, y1, x2, y2, x3, y3);

      const vertices = [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
        { x: x3, y: y3 },
        { x: x1, y: y1 },
      ];
      if (options.reverse) {
        vertices.reverse();
      }
      this.lerpVertices(vertices, p);
    };

    p5.prototype.lerpEllipse = function (a, b, c, d, progress, options = {}) {
      let p = _getValidatedProgress(progress);
      if (p <= 0) return;
      if (p >= 1) return _originalEllipse.call(this, a, b, c, d);

      const angle =
        this.angleMode() === this.DEGREES ? 360 * p : this.TWO_PI * p;

      let x = a,
        y = b,
        w = c,
        h = d;
      // const mode = _activeEllipseMode;
      // arcもellipseModeに影響されるためなし
      // if (mode === this.CORNER) {
      //   x = a + c / 4;
      //   y = b + d / 4; // arcは常に中心基準なのでずらす
      // } else if (mode === this.CORNERS) {
      //   x = (a + c) / 2;
      //   y = (b + d) / 2;
      //   w = this.abs(c - a);
      //   h = this.abs(d - b);
      // } else if (mode === this.RADIUS) {
      //   w = c * 2;
      //   h = d * 2;
      // }
      if (options.reverse) {
        return _originalArc.call(
          this,
          x,
          y,
          w,
          h,
          (this.angleMode() === this.DEGREES ? 360 : this.TWO_PI) - angle,
          0,
        );
      }
      return _originalArc.call(this, x, y, w, h, 0, angle);
    };

    p5.prototype.lerpArc = function (
      x,
      y,
      w,
      h,
      start,
      end,
      progress,
      options = {},
    ) {
      let p = _getValidatedProgress(progress);
      if (p <= 0) return;
      if (p >= 1) return _originalArc.call(this, x, y, w, h, start, end);

      let s = start,
        e = end;
      if (s > e) s -= this.angleMode() === this.DEGREES ? 360 : this.TWO_PI;
      const currentAngle = this.lerp(s, e, p);
      if (options.reverse) {
        return _originalArc.call(this, x, y, w, h, this.lerp(e, s, p), e);
      }
      return _originalArc.call(this, x, y, w, h, s, currentAngle);
    };

    p5.prototype.lerpText = function (str, x, y, progress) {
      let p = _getValidatedProgress(progress);
      if (p <= 0) return;
      if (p >= 1) return _originalText.call(this, str, x, y);
      const strIndex = Math.floor(str.length * p);
      return _originalText.call(this, str.slice(0, strIndex), x, y);
    };

    /**
     * 2つの文字の間を文字コード基準で補間して描画する
     * @param {String} startChar 開始文字
     * @param {String} endChar 終了文字
     * @param {Number} x x座標
     * @param {Number} y y座標
     * @param {Number} progress 0.0 ~ 1.0
     */
    p5.prototype.lerpChar = function (startChar, endChar, x, y, progress) {
      let p = _getValidatedProgress(progress);
      if (p <= 0) return _originalText.call(this, startChar, x, y);
      if (p >= 1) return _originalText.call(this, endChar, x, y);

      // 文字コードを取得
      const startCode = startChar.charCodeAt(0);
      const endCode = endChar.charCodeAt(0);

      // コードの間を補間
      const currentCode = Math.round(this.lerp(startCode, endCode, p));

      // 文字に戻して描画
      const currentChar = String.fromCharCode(currentCode);
      return _originalText.call(this, currentChar, x, y);
    };

    /**
     * 文字列から別の文字列へ、一文字ずつ文字コードを補間して変容させる
     * @param {String} startStr 開始文字列
     * @param {String} endStr 終了文字列
     * @param {Number} x x座標
     * @param {Number} y y座標
     * @param {Number} progress 0.0 ~ 1.0
     */
    p5.prototype.lerpString = function (startStr, endStr, x, y, progress) {
      let p = _getValidatedProgress(progress);
      if (p <= 0) return _originalText.call(this, startStr, x, y);
      if (p >= 1) return _originalText.call(this, endStr, x, y);

      // 最大の長さを取得
      const maxLen = Math.max(startStr.length, endStr.length);
      let result = '';

      for (let i = 0; i < maxLen; i++) {
        // 文字がない場合はスペース(32)として扱う
        const startCode = startStr[i] ? startStr.charCodeAt(i) : 32;
        const endCode = endStr[i] ? endStr.charCodeAt(i) : 32;

        // 文字コードを補間
        const currentCode = Math.round(this.lerp(startCode, endCode, p));
        result += String.fromCharCode(currentCode);
      }

      return _originalText.call(this, result, x, y);
    };

    p5.prototype.lerpVertices = function (vertices, progress) {
      let p = _getValidatedProgress(progress);
      if (p <= 0) return;

      if (vertices.length < 2 || p <= 0) return;

      let totalLength = 0;
      let distances = [];
      for (let i = 0; i < vertices.length - 1; i++) {
        let d = this.dist(
          vertices[i].x,
          vertices[i].y,
          vertices[i + 1].x,
          vertices[i + 1].y,
        );
        distances.push(d);
        totalLength += d;
      }

      let targetLength = totalLength * p;
      let currentAccumulated = 0;

      _originalBeginShape.call(this);
      _originalVertex.call(this, vertices[0].x, vertices[0].y);

      for (let i = 0; i < vertices.length - 1; i++) {
        let d = distances[i];
        if (currentAccumulated + d <= targetLength) {
          _originalVertex.call(this, vertices[i + 1].x, vertices[i + 1].y);
          currentAccumulated += d;
        } else {
          let localP = (targetLength - currentAccumulated) / d;
          let tx = this.lerp(vertices[i].x, vertices[i + 1].x, localP);
          let ty = this.lerp(vertices[i].y, vertices[i + 1].y, localP);
          _originalVertex.call(this, tx, ty);
          break;
        }
      }
      _originalEndShape.call(this);
    };

    /**
     * ベクトルの配列から総延長を計算する
     * @param {p5.Vector[]} vertices
     * @param {boolean} isClosed - 終点と始点を結ぶかどうか（rectなどの場合）
     * @returns {number} 総延長距離
     */
    const _calculateLength = (vertices, isClosed = false) => {
      if (!vertices || vertices.length < 2) return 0;

      let total = 0;
      for (let i = 0; i < vertices.length - 1; i++) {
        total += this.dist(
          vertices[i].x,
          vertices[i].y,
          vertices[i + 1].x,
          vertices[i + 1].y,
        );
      }

      // 閉じている図形（rectやcloseしたbeginShape）なら最後の一辺を足す
      if (isClosed) {
        total += this.dist(
          vertices[vertices.length - 1].x,
          vertices[vertices.length - 1].y,
          vertices[0].x,
          vertices[0].y,
        );
      }

      return total;
    };

    const _calculateLocalProgress = (globalP) => {
      let p = globalP;

      if (_isInsideWithLerpShape && _currentSteps !== 0) {
        _currentStepIndex++;
        const slotSize = 1.0 / _currentSteps;
        const myStart = (_currentStepIndex - 1) * slotSize;
        const myEnd = _currentStepIndex * slotSize;

        // mapでローカル進捗に変換（trueでクランプ）
        p = this.map(p, myStart, myEnd, 0, 1, true);

        const EPSILON = 0.00001; // 100万分の1程度の遊び
        if (p < EPSILON) return 0;
        if (p > 1 - EPSILON) return 1;
      }

      return p;
    };

    const _getValidatedProgress = (progress) => {
      // 1. 宣言の共通化（引数があればそれを、なければグローバルの進捗を使う）
      let p = progress !== undefined ? progress : _currentLerpProgress;

      // 2. クリーンアップ（閾値処理）
      const EPSILON = 0.00001;
      if (p < EPSILON) return 0;
      if (p > 1 - EPSILON) return 1;

      return p;
    };
  } else {
    console.error('p5.lerpShape: p5.js is not found. Please load p5.js first.');
  }
}
