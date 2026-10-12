export function ambientSize(width, height) {
  const scale = Math.min(.6, 960 / Math.max(1, width), 640 / Math.max(1, height));
  return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
}

export function ambientEnabled(value, visible, reduced) {
  return value.ambient === true && value.motion === 'full' && visible && !reduced;
}

const vertexSource = 'attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}';
const fragmentSource = `precision mediump float;
varying vec2 uv; uniform float time; uniform vec3 tint;
void main(){
  vec2 p=vec2(uv.x,1.-uv.y);
  float pool=exp(-dot((p-vec2(.14,.12))*vec2(1.8,1.4),(p-vec2(.14,.12))*vec2(1.8,1.4))*2.);
  float ray=pow(.5+.5*sin(p.x*17.+p.y*7.+sin(time*.08)*.18),8.);
  float glow=pool*(.04+ray*.06)*(.98+.02*sin(time*.2));
  gl_FragColor=vec4(tint*glow,glow);
}`;

export function createAmbientLight(canvas, report) {
  const doc = canvas.ownerDocument;
  const win = doc.defaultView;
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
  let value = {}; let active = false; let gl; let program; let buffer; let frame = 0;
  let failed = false; let lost = false; let last = -Infinity; let clock; let tint;

  function release() {
    if (!gl || lost) return;
    if (program) gl.deleteProgram(program);
    if (buffer) gl.deleteBuffer(buffer);
    program = null; buffer = null;
  }
  function fallback(message) {
    failed = true; win.cancelAnimationFrame(frame); frame = 0; canvas.hidden = true;
    release(); report(message);
  }
  function initialize() {
    const shaders = [];
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
      if (!gl) throw new Error('Este dispositivo não disponibilizou o efeito de luz.');
      for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]]) {
        const shader = gl.createShader(type);
        if (!shader) throw new Error('Não foi possível preparar o efeito de luz.');
        shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Não foi possível compilar o efeito de luz.');
      }
      program = gl.createProgram(); buffer = gl.createBuffer();
      if (!program || !buffer) throw new Error('Não há recursos gráficos disponíveis para o efeito.');
      for (const shader of shaders) gl.attachShader(program, shader);
      gl.bindAttribLocation(program, 0, 'position'); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Não foi possível montar o efeito de luz.');
      gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      clock = gl.getUniformLocation(program, 'time'); tint = gl.getUniformLocation(program, 'tint');
      resize();
      return true;
    } catch (error) { fallback(error.message + ' A iluminação estática continua disponível.'); return false; }
    finally { if (gl && !lost) for (const shader of shaders) gl.deleteShader(shader); }
  }
  function resize() {
    if (!gl || lost || !program) return;
    [canvas.width, canvas.height] = ambientSize(win.innerWidth, win.innerHeight);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function draw(now) {
    frame = 0;
    if (!ambientEnabled(value, active && !doc.hidden, reduced.matches) || failed || lost) return;
    // shortcut: limite de 30 desenhos/s e buffer reduzido; calibrar em hardware físico antes de ampliar.
    if (now - last >= 1000 / 30) {
      last = now;
      gl.uniform1f(clock, now / 1000);
      const color = value.light === 'day' ? [.96, .94, .82] : value.light === 'night' ? [1, .66, .3] : [1, .79, .48];
      gl.uniform3fv(tint, color); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    frame = win.requestAnimationFrame(draw);
  }
  function refresh() {
    win.cancelAnimationFrame(frame); frame = 0;
    const enabled = ambientEnabled(value, active && !doc.hidden, reduced.matches);
    canvas.hidden = !enabled || failed || lost;
    if (!enabled || failed || lost) {
      if (!failed && !lost) report(value.ambient ? 'Iluminação estática: movimento pausado ou reduzido.' : '');
      return;
    }
    if (!program && !initialize()) return;
    report('Luz viva ativa.');
    last = -Infinity; frame = win.requestAnimationFrame(draw);
  }
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true; program = null; buffer = null;
    win.cancelAnimationFrame(frame); frame = 0; canvas.hidden = true;
    report('O efeito de luz foi interrompido. A iluminação estática continua disponível.');
  });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; failed = false; refresh(); });
  doc.addEventListener('visibilitychange', refresh);
  reduced.addEventListener('change', refresh);
  win.addEventListener('resize', resize);
  canvas.hidden = true;
  return (preferences, studying) => { value = preferences; active = studying; refresh(); };
}
