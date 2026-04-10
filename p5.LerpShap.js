/**
 * p5.lerpShape.js
 * p5.jsの図形描画をプログレス値(0.0 - 1.0)で補完するライブラリ
 */
{
  if (typeof window.p5 !== 'undefined') {
    // --- 内部状態の管理 ---
    let _currentLerpProgress = null;
    let _activeRectMode = 'corner';
    let _activeEllipseMode = 'center';
    let _shapeVertices = [];
    let _isLerpShapeMode = false;

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
    const _originalRectMode = p5.prototype.rectMode;
    const _originalEllipseMode = p5.prototype.ellipseMode;

    // ==========================================
    // 1. メインAPI (ユーザーが直接呼ぶ関数)
    // ==========================================

    /**
     * 指定した進捗度でコールバック内の図形を描画する
     * @param {Number} progress 0.0 ~ 1.0 の数値
     * @param {Function} callback 描画関数を含む処理
     */
    p5.prototype.withLerpShape = function (progress, callback) {
      _currentLerpProgress = progress;
      if (typeof callback === 'function') {
        this.push();
        callback();
        this.pop();
        _currentLerpProgress = null;
      }
    };

    /**
     * 手動でLerpモードを終了する (基本はwithLerpShapeを推奨)
     */
    p5.prototype.endLerpShape = function () {
      _currentLerpProgress = null;
    };

    // ==========================================
    // 2. モード監視 (描画基準の同期)
    // ==========================================

    p5.prototype.rectMode = function (mode) {
      _activeRectMode = mode;
      return _originalRectMode.apply(this, arguments);
    };

    p5.prototype.ellipseMode = function (mode) {
      _activeEllipseMode = mode;
      return _originalEllipseMode.apply(this, arguments);
    };

    // ==========================================
    // 3. 基本図形のオーバーライド
    // ==========================================

    p5.prototype.line = function (...args) {
      if (_currentLerpProgress !== null) {
        return this.lerpLine(...args, _currentLerpProgress);
      }
      return _originalLine.apply(this, args);
    };

    p5.prototype.rect = function (...args) {
      if (_currentLerpProgress !== null) {
        // ※角丸(radius)引数は現在未対応のため最初の4つを使用
        return this.lerpRect(
          args[0],
          args[1],
          args[2],
          args[3],
          _currentLerpProgress,
        );
      }
      return _originalRect.apply(this, args);
    };

    p5.prototype.triangle = function (...args) {
      if (_currentLerpProgress !== null) {
        return this.lerpTriangle(...args, _currentLerpProgress);
      }
      return _originalTriangle.apply(this, args);
    };

    p5.prototype.ellipse = function (...args) {
      if (_currentLerpProgress !== null) {
        return this.lerpEllipse(
          args[0],
          args[1],
          args[2],
          args[3],
          _currentLerpProgress,
        );
      }
      return _originalEllipse.apply(this, args);
    };

    p5.prototype.circle = function (...args) {
      if (_currentLerpProgress !== null) {
        return this.lerpEllipse(
          args[0],
          args[1],
          args[2],
          args[2],
          _currentLerpProgress,
        );
      }
      return _originalCircle.apply(this, args);
    };

    p5.prototype.arc = function (...args) {
      if (_currentLerpProgress !== null) {
        return this.lerpArc(
          args[0],
          args[1],
          args[2],
          args[3],
          args[4],
          args[5],
          _currentLerpProgress,
        );
      }
      return _originalArc.apply(this, args);
    };

    p5.prototype.text = function (...args) {
      if (_currentLerpProgress !== null) {
        return this.lerpText(args[0], args[1], args[2], _currentLerpProgress);
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
        this.drawLerpVertices(_shapeVertices, _currentLerpProgress);
        return;
      }
      return _originalEndShape.apply(this, args);
    };

    // ==========================================
    // 5. Lerp実体化ロジック (計算エンジン)
    // ==========================================

    p5.prototype.lerpLine = function (x1, y1, x2, y2, progress) {
      const p = progress !== undefined ? progress : _currentLerpProgress;
      if (p <= 0) return;
      if (p >= 1) return _originalLine.call(this, x1, y1, x2, y2);
      const tx = this.lerp(x1, x2, p);
      const ty = this.lerp(y1, y2, p);
      return _originalLine.call(this, x1, y1, tx, ty);
    };

    p5.prototype.lerpRect = function (a, b, c, d, progress) {
      const p = progress !== undefined ? progress : _currentLerpProgress;
      if (p <= 0) return;
      if (p >= 1) return _originalRect.call(this, a, b, c, d);

      let x, y, w, h;
      if (_activeRectMode === this.CORNERS) {
        x = this.min(a, c);
        y = this.min(b, d);
        w = this.abs(c - a);
        h = this.abs(d - b);
      } else if (_activeRectMode === this.RADIUS) {
        x = a - c;
        y = b - d;
        w = c * 2;
        h = d * 2;
      } else if (_activeRectMode === this.CENTER) {
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
      this.drawLerpVertices(vertices, p);
    };

    p5.prototype.lerpTriangle = function (x1, y1, x2, y2, x3, y3, progress) {
      const p = progress !== undefined ? progress : _currentLerpProgress;
      if (p <= 0) return;
      if (p >= 1) return _originalTriangle.call(this, x1, y1, x2, y2, x3, y3);

      const vertices = [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
        { x: x3, y: y3 },
        { x: x1, y: y1 },
      ];
      this.drawLerpVertices(vertices, p);
    };

    p5.prototype.lerpEllipse = function (a, b, c, d, progress) {
      const p = progress !== undefined ? progress : _currentLerpProgress;
      if (p <= 0) return;
      if (p >= 1) return _originalEllipse.call(this, a, b, c, d);

      const angle =
        this.angleMode() === this.DEGREES ? 360 * p : this.TWO_PI * p;
      const mode = _activeEllipseMode;
      let x = a,
        y = b,
        w = c,
        h = d;

      if (mode === this.CORNER) {
        x = a + c / 2;
        y = b + d / 2; // arcは常に中心基準なのでずらす
      } else if (mode === this.CORNERS) {
        x = (a + c) / 2;
        y = (b + d) / 2;
        w = this.abs(c - a);
        h = this.abs(d - b);
      } else if (mode === this.RADIUS) {
        w = c * 2;
        h = d * 2;
      }
      return _originalArc.call(this, x, y, w, h, 0, angle);
    };

    p5.prototype.lerpArc = function (x, y, w, h, start, end, progress) {
      const p = progress !== undefined ? progress : _currentLerpProgress;
      if (p <= 0) return;
      if (p >= 1) return _originalArc.call(this, x, y, w, h, start, end);

      let s = start,
        e = end;
      if (s > e) s -= this.angleMode() === this.DEGREES ? 360 : this.TWO_PI;
      const currentAngle = this.lerp(s, e, p);
      return _originalArc.call(this, x, y, w, h, s, currentAngle);
    };

    p5.prototype.lerpText = function (str, x, y, progress) {
      const p = progress !== undefined ? progress : _currentLerpProgress;
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
      const p = progress !== undefined ? progress : _currentLerpProgress;
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
      const p = progress !== undefined ? progress : _currentLerpProgress;
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

    p5.prototype.drawLerpVertices = function (vertices, p) {
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
  } else {
    console.error('p5.lerpShape: p5.js is not found. Please load p5.js first.');
  }
}
