let historicoCalculos = [], animacaoId = null;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('btn-gerar')?.addEventListener('click', gerarTabela);
    document.getElementById('btn-calcular')?.addEventListener('click', calcular);

    document.querySelectorAll('.controls input, .controls select').forEach(element => {
        element.addEventListener('input', () => {
            if (document.getElementById('painel-resultados').style.display === 'block') {
                calcular();
            }
        });
    });
});

// Garante saída estrita em formato de notação de física acadêmica com vírgulas
function formatarCientifico(n) {
    if (n === 0 || !isFinite(n)) return "0,00 × 10<sup>0</sup>";
    let [mantissa, expoente] = n.toExponential(2).split('e');
    return `${mantissa.replace('.', ',')} × 10<sup>${parseInt(expoente)}</sup>`;
}

// Cria a seta vetorial centralizada estritamente ACIMA da letra de forma estável
function criarSetaVetorial(letra) {
    return `<span style="position:relative; display:inline-block; padding-top:0.35em; margin-right:3px;">${letra}<span style="position:absolute; top:-0.1em; left:50%; transform:translateX(-50%); font-size:0.75em; line-height:1; font-family:sans-serif;">→</span></span>`;
}

// EXPOSIÇÃO GLOBAL MANDATÓRIA: Força o navegador a enxergar a função chamada pelo HTML inline
function alternarBlocoIndividual(btn) {
    const wrapper = btn.closest('.vector-block-wrapper');
    const conteudo = wrapper?.querySelector('.vector-block-content');
    if (conteudo) {
        if (conteudo.style.display === 'none' || conteudo.style.display === '') {
            conteudo.style.display = 'block';
            btn.textContent = '▲ Ocultar Detalhes';
        } else {
            conteudo.style.display = 'none';
            btn.textContent = '▼ Expandir Detalhes';
        }
    }
}
window.alternarBlocoIndividual = alternarBlocoIndividual;

function alternarTodosBlocos(id, visivel) {
    document.getElementById(id)?.querySelectorAll('.vector-block-wrapper').forEach(b => {
        let conteudo = b.querySelector('.vector-block-content');
        if (conteudo) conteudo.style.display = visivel ? 'block' : 'none';
        let btn = b.querySelector('.btn-toggle-bloco');
        if (btn) btn.textContent = visivel ? '▲ Ocultar Detalhes' : '▼ Expandir Detalhes';
    });
}
window.alternarTodosBlocos = alternarTodosBlocos;





function gerarTabela() {
    const numPos = parseInt(document.getElementById('campos-pos').value) || 5;
    const numTemp = parseInt(document.getElementById('campos-temp').value) || 5;
    const header = document.getElementById('table-header');
    const tbody = document.getElementById('table-body');
    
    if (numPos < 5 || numPos > 10 || numTemp < 5 || numTemp > 10) return alert("Amostragem entre 5 e 10.");
    header.innerHTML = ''; tbody.innerHTML = '';

    let colsHtml = `<th style="width: 10vw">Posição S<br>(m)</th>`;
    for (let i = 1; i <= numTemp; i++) colsHtml += `<th style="width: 8vw">t${i}<br>(s)</th>`;
    colsHtml += `
        <th style="width: 12vw">t<sub>m</sub><br>(s)</th>
        <th style="width: 12vw">v<sub>m</sub><br>(m/s)</th>
        <th style="width: 12vw">v<sub>f</sub><br>(m/s)</th>`;
    header.innerHTML = colsHtml;

    for (let p = 0; p < numPos; p++) {
        let tr = document.createElement('tr'), sugS = Math.max(0, 5 - p);
        let ehPrimeiraLinha = (p === 0);
        
        let rowHtml = `<td><input type="number" value="${sugS}" class="pos-s" style="font-weight:bold; color:#005f73;"></td>`;
        for (let t = 0; t < numTemp; t++) {
            if (ehPrimeiraLinha) {
                rowHtml += `<td><input type="number" value="0.00" class="tempo" readonly style="background-color: #f8f9fa; color: #6c757d; font-weight: bold;"></td>`;
            } else {
                let oscilacao = (Math.sin(p * t + t) * 0.05);
                let tempo = (p * 1.2 + t * 0.04 + 0.5 + oscilacao).toFixed(2);
                rowHtml += `<td><input type="number" value="${tempo}" class="tempo"></td>`;
            }
        }
        rowHtml += `
            <td class="tempo-medio" style="font-weight:bold;">${ehPrimeiraLinha ? '0.00' : '—'}</td>
            <td class="vel-media" style="font-weight:bold;">${ehPrimeiraLinha ? '0.00' : '—'}</td>
            <td class="vel-final" style="font-weight:bold; color:#d90429;">${ehPrimeiraLinha ? '0.00' : '—'}</td>`;
        tr.innerHTML = rowHtml; tbody.appendChild(tr);
    }

    document.getElementById('section-tabela').style.display = 'block';
    document.getElementById('container-calcular').style.display = 'block';
    document.getElementById('painel-resultados').style.display = 'none';
    
    document.querySelectorAll('#table-body input:not([readonly])').forEach(el => el.addEventListener('input', analisarEColorirDescartes));
    analisarEColorirDescartes();
}

function analisarEColorirDescartes() {
    document.querySelectorAll('#table-body tr').forEach((row, idx) => {
        if (idx === 0) return; 
        let inputs = row.querySelectorAll('.tempo'), valores = [];
        inputs.forEach(inp => {
            let val = parseFloat(inp.value);
            if (!isNaN(val)) valores.push({ el: inp, val: val });
            inp.style.backgroundColor = '#fff'; inp.style.color = '#333'; inp.style.fontWeight = 'normal';
        });
        if (valores.length >= 3) {
            let ord = [...valores].sort((a, b) => a.val - b.val);
            let min = ord[0], max = ord[ord.length - 1];
            if (min.val !== max.val) {
                max.el.style.backgroundColor = '#ffebee'; max.el.style.color = '#c62828'; max.el.style.fontWeight = 'bold';
                min.el.style.backgroundColor = '#fffde7'; min.el.style.color = '#f57f17'; min.el.style.fontWeight = 'bold';
            }
        }
    });
}







function calcular() {
    const rows = document.querySelectorAll('#table-body tr');
    if (rows.length === 0) return;

    const m = parseFloat(document.getElementById('massa').value) || 1;
    const theta = (parseFloat(document.getElementById('angulo-theta').value) || 0) * Math.PI / 180;
    const phi = (parseFloat(document.getElementById('angulo-phi').value) || 0) * Math.PI / 180;
    const traj = document.getElementById('trajetoria').value, g = 9.81;

    let vVetor = '', vModulo = '', pontos = [], sIni = null;
    historicoCalculos = [];

    rows.forEach((row, idx) => {
        let s = parseFloat(row.querySelector('.pos-s').value) || 0;
        if (idx === 0) sIni = s;

        if (idx === 0) {
            pontos.push({ t: 0, v: 0, s: s, dS: 0, idx: idx });
            return;
        }

        let tSI = [];
        row.querySelectorAll('.tempo').forEach(t => { if (!isNaN(parseFloat(t.value))) tSI.push(parseFloat(t.value)); });
        if (tSI.length < 3) return;

        let ord = [...tSI].sort((a, b) => a - b).slice(1, -1);
        let tMed = ord.reduce((a, b) => a + b, 0) / ord.length;
        let dS = s - sIni; 
        
        let vMedProvisoria = tMed > 0 ? dS / tMed : 0;
        let vFinProvisoria = 2 * vMedProvisoria;

        row.querySelector('.tempo-medio').textContent = tMed.toFixed(2);
        pontos.push({ t: tMed, v: vFinProvisoria, s: s, dS: dS, idx: idx });
    });

    let pontosFiltrados = [...pontos].filter(p => p.idx > 0);
    if (pontosFiltrados.length === 0) return;

    let n = pontosFiltrados.length, sT = 0, sV = 0, sTV = 0, sT2 = 0;
    pontosFiltrados.forEach(p => { sT += p.t; sV += p.v; sTV += p.t * p.v; sT2 += p.t * p.t; });
    let aGlobal = (n * sT2 - sT * sT) !== 0 ? (n * sTV - sT * sV) / (n * sT2 - sT * sT) : 0;

    rows.forEach((row, idx) => {
        let pt = pontos.find(p => p.idx === idx);
        if (!pt) return;
        let vFinalReal = aGlobal * pt.t;
        let vMediaReal = vFinalReal / 2;
        row.querySelector('.vel-media').textContent = vMediaReal.toFixed(2);
        row.querySelector('.vel-final').textContent = vFinalReal.toFixed(2);
        pt.v = vFinalReal;
    });

    const u_i = '<b><i>î</i></b>', u_j = '<b><i>ĵ</i></b>', u_k = '<span style="position:relative;font-weight:bold;font-style:italic;">k<span style="position:absolute;top:-0.35em;left:1px;font-size:0.8em;font-style:normal;font-weight:normal;">^</span></span>';
    const f_m = "m", f_ms = "m/s", f_ms2 = "m/s²";

    pontos.forEach(p => {
        let vInst = aGlobal * p.t;
        let x = p.s * Math.cos(theta) * Math.cos(phi);
        let y = p.s * Math.cos(theta) * Math.sin(phi);
        let z = p.s * Math.sin(theta);

        let vx = vInst * Math.cos(theta) * Math.cos(phi);
        let vy = vInst * Math.cos(theta) * Math.sin(phi);
        let vz = vInst * Math.sin(theta);

        let ax = aGlobal * Math.cos(theta) * Math.cos(phi);
        let ay = aGlobal * Math.cos(theta) * Math.sin(phi);
        let az = aGlobal * Math.sin(theta);

        if (traj === 'horizontal') { vz = 0; az = 0; z = 0; }
        else if (traj === 'vertical') { vx = 0; vy = 0; ax = 0; ay = 0; x = 0; y = 0; vz = vInst; az = aGlobal; z = p.s; }

        historicoCalculos.push({ ponto: p.idx + 1, x, y, z, tMed: p.t, vx, vy, vz, ax, ay, az, fx: m*ax, fy: m*ay, fz: m*az, ec: 0.5*m*vInst*vInst, ep: m*g*z, d: p.s, dS: p.dS });

        let angThetaDeg = document.getElementById('angulo-theta').value, angPhiDeg = document.getElementById('angulo-phi').value;

        vVetor += `
            <div class="vector-block-wrapper">
                <div class="vector-block-header"><h3>Ponto Amostral #${p.idx + 1} (t<sub>m</sub> = ${p.t.toFixed(2)} s)</h3><button type="button" class="btn-toggle-bloco" onclick="alternarBlocoIndividual(this)">▲ Ocultar Detalhes</button></div>
                <div class="vector-block-content">
                    <div class="item-grandeza">
                        <div><b>Nome:</b> Vetor Posição Absoluta Espacial</div>
                        <div><b>Símbolo:</b> ${criarSetaVetorial('r')}</div>
                        <div><b>Equação:</b> ${criarSetaVetorial('r')} = x${u_i} + y${u_j} + z${u_k}</div>
                        <div><b>Cálculo:</b> ${criarSetaVetorial('r')} = (${p.s.toFixed(2)} m · cos(${angThetaDeg}°) · cos(${angPhiDeg}°))${u_i} + (${p.s.toFixed(2)} m · cos(${angThetaDeg}°) · sin(${angPhiDeg}°))${u_j} + (${p.s.toFixed(2)} m · sin(${angThetaDeg}°))${u_k}</div>
                        <div><b>Unidade de Medida e Resultado:</b> ${criarSetaVetorial('r')} = [ (${formatarCientifico(x)})${u_i} + (${formatarCientifico(y)})${u_j} + (${formatarCientifico(z)})${u_k} ] ${f_m}</div>
                    </div>
                    <div class="item-grandeza">
                        <div><b>Nome:</b> Vetor Velocidade Instantânea Coordenada</div>
                        <div><b>Símbolo:</b> ${criarSetaVetorial('v')}</div>
                        <div><b>Equação:</b> ${criarSetaVetorial('v')} = v<sub>x</sub>${u_i} + v<sub>y</sub>${u_j} + v<sub>z</sub>${u_k}</div>
                        <div><b>Cálculo:</b> ${criarSetaVetorial('v')} = (${aGlobal.toFixed(4)} m/s² · ${p.t.toFixed(2)} s · cos(${angThetaDeg}°) · cos(${angPhiDeg}°))${u_i} + (${aGlobal.toFixed(4)} m/s² · ${p.t.toFixed(2)} s · cos(${angThetaDeg}°) · sin(${angPhiDeg}°))${u_j} + (${aGlobal.toFixed(4)} m/s² · ${p.t.toFixed(2)} s · sin(${angThetaDeg}°))${u_k}</div>
                        <div><b>Unidade de Medida e Resultado:</b> ${criarSetaVetorial('v')} = [ (${formatarCientifico(vx)})${u_i} + (${formatarCientifico(vy)})${u_j} + (${formatarCientifico(vz)})${u_k} ] ${f_ms}</div>
                    </div>
                </div>
            </div>`;

        vModulo += `
            <div class="vector-block-wrapper">
                <div class="vector-block-header"><h3>Ponto Amostral #${p.idx + 1}</h3><button type="button" class="btn-toggle-bloco" onclick="alternarBlocoIndividual(this)">▲ Ocultar Detalhes</button></div>
                <div class="vector-block-content">
                    <div class="item-grandeza">
                        <div><b>Nome:</b> Módulo do Deslocamento Espacial Real</div>
                        <div><b>Símbolo:</b> |Δ${criarSetaVetorial('r')}|</div>
                        <div><b>Equação:</b> |Δ${criarSetaVetorial('r')}| = |S(t) - S<sub>0</sub>|</div>
                        <div><b>Cálculo:</b> |Δ${criarSetaVetorial('r')}| = |${p.s.toFixed(2)} m - ${sIni.toFixed(2)} m|</div>
                        <div><b>Unidade de Medida e Resultado:</b> |Δ${criarSetaVetorial('r')}| = ${formatarCientifico(Math.abs(p.dS))} ${f_m}</div>
                    </div>
                    <div class="item-grandeza">
                        <div><b>Nome:</b> Módulo da Velocidade Escalar Instantânea</div>
                        <div><b>Símbolo:</b> |${criarSetaVetorial('v')}|</div>
                        <div><b>Equação:</b> |${criarSetaVetorial('v')}| = √(v<sub>x</sub>² + v<sub>y</sub>² + v<sub>z</sub>²)</div>
                        <div><b>Cálculo:</b> |${criarSetaVetorial('v')}| = √[(${vx.toFixed(4)})² + (${vy.toFixed(4)})² + (${vz.toFixed(4)})²] m/s</div>
                        <div><b>Unidade de Medida e Resultado:</b> |${criarSetaVetorial('v')}| = ${formatarCientifico(Math.abs(vInst))} ${f_ms}</div>
                    </div>
                </div>
            </div>`;
    });

    document.getElementById('output-vetor').innerHTML = vVetor;
    document.getElementById('output-modulo').innerHTML = vModulo;
    let pF = historicoCalculos[historicoCalculos.length - 1];



        let x0 = sIni * Math.cos(theta) * Math.cos(phi), z0 = sIni * Math.sin(theta);

    document.getElementById('output-equacoes').innerHTML = `
        <div class="vector-block-wrapper" style="width:100%;">
            <div class="vector-block-header"><h3>Equações de Movimento Parametrizadas Coordenadas</h3></div>
            <div class="vector-block-content">
                <div class="item-grandeza">
                    <div><b>Nome:</b> Funções Horárias de Posição Vetorial Coordenada</div>
                    <div><b>Símbolo:</b> S<sub>n</sub>(t)</div>
                    <div><b>Equação:</b> S<sub>n</sub>(t) = S<sub>0n</sub> + v<sub>0n</sub>·t + ½·a<sub>n</sub>·t²</div>
                    <div><b>Cálculo:</b> Substituindo S<sub>0</sub> = ${sIni.toFixed(2)} m medido do solo e aceleração da reta</div>
                    <div><b>Unidade de Medida e Resultado:</b></div>
                    <div style="margin-left:15px;">x(t) = [ ${x0.toFixed(2)} m + 0,00 m/s · t + (${formatarCientifico(0.5 * pF.ax)}) m/s² · t² ]</div>
                    <div style="margin-left:15px;">z(t) = [ ${z0.toFixed(2)} m + 0,00 m/s · t + (${formatarCientifico(0.5 * pF.az)}) m/s² · t² ]</div>
                </div>
                <div class="item-grandeza">
                    <div><b>Nome:</b> Funções Horárias de Velocidade Vetorial Coordenada</div>
                    <div><b>Símbolo:</b> v<sub>n</sub>(t)</div>
                    <div><b>Equação:</b> v<sub>n</sub>(t) = v<sub>0n</sub> + a<sub>n</sub>·t</div>
                    <div><b>Cálculo:</b> Substituindo v<sub>0</sub> = 0,00 m/s</div>
                    <div><b>Unidade de Medida e Resultado:</b></div>
                    <div style="margin-left:15px;">v<sub>x</sub>(t) = [ 0,00 m/s + (${formatarCientifico(pF.ax)}) m/s² · t ]</div>
                    <div style="margin-left:15px;">v<sub>z</sub>(t) = [ 0,00 m/s + (${formatarCientifico(pF.az)}) m/s² · t ]</div>
                </div>
            </div>
        </div>`;

    document.getElementById('painel-resultados').style.display = 'block';
    gerarGraficosCanvas(pF.d, pF.vx, pF.tMed, aGlobal, sIni, theta);
}

function gerarGraficosCanvas(sF, vF, tF, aG, sIni, theta) {
    const cS = document.getElementById('svg-posicao-container'), cV = document.getElementById('svg-velocidade-container');
    if (!cS || !cV) return; cS.innerHTML = ''; cV.innerHTML = '';
    const canvasS = document.createElement('canvas'), canvasV = document.createElement('canvas');
    cS.appendChild(canvasS); cV.appendChild(canvasV);
    const w = cS.clientWidth || 400, h = 180;
    canvasS.width = w; canvasS.height = h; canvasV.width = w; canvasV.height = h;
    const ctxS = canvasS.getContext('2d'), ctxV = canvasV.getContext('2d'), pad = 55;
    let sMax = Math.abs(sIni) * 1.1 || 10, vMax = Math.abs(vF) * 1.1 || 5;
    
    [ctxS, ctxV].forEach((ctx, i) => {
        ctx.clearRect(0,0,w,h); ctx.strokeStyle = "#333"; ctx.lineWidth = 1.5; ctx.font = "11px sans-serif"; ctx.fillStyle = "#333";
        ctx.beginPath(); ctx.moveTo(pad, 10); ctx.lineTo(pad, h - pad); ctx.lineTo(w - 15, h - pad); ctx.stroke();
        ctx.fillText("t(s)", w - 30, h - pad + 15); ctx.fillText("0", pad - 12, h - pad + 12); ctx.fillText(Math.abs(tF).toFixed(2), w - 45, h - pad + 15);
        ctx.fillText(i === 0 ? "S(m)" : "v(m/s)", pad - 50, 20);
        ctx.fillText((i === 0 ? sIni : Math.abs(vF)).toFixed(2).replace('.', ','), pad - 42, 35);
    });

    ctxS.strokeStyle = "#005f73"; ctxS.lineWidth = 2.5; ctxS.beginPath();
    for(let i=0; i<=40; i++) { let t = (tF/40)*i, s = sIni + (0.5 * aG * t * t); let cx = pad+(t/tF)*(w-pad-20), cy = (h-pad)-(Math.abs(s)/sMax)*(h-pad-20); if(i===0) ctxS.moveTo(cx,cy); else ctxS.lineTo(cx,cy); }
    ctxS.stroke();

    ctxV.strokeStyle = "#2a9d8f"; ctxV.lineWidth = 2.5; ctxV.beginPath();
    for(let i=0; i<=40; i++) { let t = (tF/40)*i, v = aG * t; let cx = pad+(t/tF)*(w-pad-20), cy = (h-pad)-(Math.abs(v)/vMax)*(h-pad-20); if(i===0) ctxV.moveTo(cx,cy); else ctxV.lineTo(cx,cy); }
    ctxV.stroke();

    inicializarEngineAnimacao(tF);
}

function inicializarEngineAnimacao(tReal) {
    const cAnim = document.getElementById('canvas-animacao-container');
    if (!cAnim) return;
    let cv = cAnim.querySelector('canvas') || document.createElement('canvas');
    if(!cv.parentNode) cAnim.appendChild(cv);
    const w = cAnim.clientWidth || 800, h = 300; cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    
    // AJUSTE DE MARGEM: Desloca a origem (0,0,0) para a margem esquerda da tela preta
    const cX = 100, cY = h / 2 + 50;

    const theta = (parseFloat(document.getElementById('angulo-theta').value) || 0) * Math.PI / 180;
    const phi = (parseFloat(document.getElementById('angulo-phi').value) || 0) * Math.PI / 180;

    function proj(x, y, z) { return { x: cX + (x - y) * Math.cos(Math.PI/6), y: cY + (x + y) * Math.sin(Math.PI/6) - z }; }
    if (animacaoId) cancelAnimationFrame(animacaoId);

    function draw() {
        ctx.clearRect(0,0,w,h); ctx.lineWidth = 2;
        // Desenha os eixos partindo da margem esquerda
        [{x:180,y:0,z:0,c:"#ff4d4d",l:"X"}, {x:0,y:180,z:0,c:"#2a9d8f",l:"Y"}, {x:0,y:0,z:180,c:"#005f73",l:"Z"}].forEach(e => {
            let o = proj(0,0,0), f = proj(e.x,e.y,e.z); ctx.strokeStyle = e.c; ctx.beginPath(); ctx.moveTo(o.x,o.y); ctx.lineTo(f.x,f.y); ctx.stroke();
            ctx.fillStyle = e.c; ctx.font = "bold 11px sans-serif"; ctx.fillText(e.l, f.x+5, f.y+5);
        });
    }

    function dispararSimulacaoAtiva() {
        if (animacaoId) cancelAnimationFrame(animacaoId);
        let start = performance.now(), tSim = Math.abs(tReal) * 1000;
        let sMaxFisico = historicoCalculos.length > 0 ? historicoCalculos[0].d : 5;

        function loop(now) {
            let elapsed = now - start; if (elapsed > tSim) elapsed = tSim;
            let t = elapsed / 1000, f = tReal > 0 ? t / tReal : 1;
            draw();
            
            let sAtual = sMaxFisico * (1 - f);
            
            // ESCALA PROPORCIONAL AMPLIAÇÃO 3X: Passou de 25 para 75 de ganho de pixel por metro
            let escalaPixels = 75; 
            let amp = sAtual * escalaPixels, ampTopo = sMaxFisico * escalaPixels;

            let pBolinha = proj(amp * Math.cos(theta) * Math.cos(phi), amp * Math.cos(theta) * Math.sin(phi), amp * Math.sin(theta));
            let pTopo = proj(ampTopo * Math.cos(theta) * Math.cos(phi), ampTopo * Math.cos(theta) * Math.sin(phi), ampTopo * Math.sin(theta));
            
            ctx.strokeStyle = "#495057"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(pTopo.x, pTopo.y); ctx.lineTo(cX, cY); ctx.stroke();
            ctx.fillStyle = "#00b4d8"; ctx.beginPath(); ctx.arc(pBolinha.x, pBolinha.y, 9, 0, 2*Math.PI); ctx.fill();
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
            
            ctx.fillStyle = "#fff"; ctx.font = "12px monospace"; ctx.fillText("Tempo 3D: " + t.toFixed(2) + "s", 20, 25);
            if (elapsed < tSim) animacaoId = requestAnimationFrame(loop); else animacaoId = null;
        }
        animacaoId = requestAnimationFrame(loop);
    }
    dispararSimulacaoAtiva();
    let playBtn = document.getElementById('btn-play') || document.getElementById('btnPlay');
    if (playBtn) playBtn.onclick = dispararSimulacaoAtiva;
}

function exportarPDF() {
    const elemento = document.getElementById('painel-resultados');
    if (typeof html2pdf === 'undefined') return alert("Biblioteca PDF carregando.");
    html2pdf().set({ margin: 10, filename: 'Relatorio_Fisica_3D.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(elemento).save();
}

function exportarTexto() {
    if (historicoCalculos.length === 0) return;
    let txt = "==================================================\n  RELATÓRIO DE MOVIMENTO E DINÂMICA TRIDIMENSIONAL\n==================================================\n\n";
    historicoCalculos.forEach(d => { txt += "PONTO EXPERIMENTAL #" + d.ponto + " (Tempo: " + d.tMed.toFixed(2) + "s)\n- Posição Linear (S): " + d.d.toFixed(2) + " m\n"; });
    let link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })); link.download = 'Relatorio_Fisica_3D.txt'; link.click();
}

document.getElementById('btnPdf')?.addEventListener('click', exportarPDF);
document.getElementById('btnTexto')?.addEventListener('click', exportarTexto);
