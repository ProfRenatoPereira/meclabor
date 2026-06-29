let historicoCalculos = [];
let animacaoId = null;

document.addEventListener("DOMContentLoaded", () => {
    const btnGerar = document.getElementById('btn-gerar');
    const btnCalcular = document.getElementById('btn-calcular');

    if (btnGerar) btnGerar.addEventListener('click', gerarTabela);
    if (btnCalcular) btnCalcular.addEventListener('click', () => {
        if (typeof calcular === 'function') { calcular(); }
    });

    document.querySelectorAll('.controls input, .controls select').forEach(element => {
        element.addEventListener('input', () => {
            if (document.getElementById('painel-resultados').style.display === 'block') {
                if (typeof calcular === 'function') { calcular(); }
            }
        });
    });
});

function formatarCientifico(numero) {
    if (numero === 0 || !isFinite(numero)) return "0,00 × 10<sup>0</sup>";
    let expStr = numero.toExponential(2);
    let [mantissa, expoente] = expStr.split('e');
    let expLimpo = parseInt(expoente).toString();
    let mantissaVirgula = mantissa.replace('.', ',');
    return mantissaVirgula + " × 10<sup>" + expLimpo + "</sup>";
}

function alternarBlocoIndividual(btn) {
    const wrapper = btn.closest('.vector-block-wrapper');
    const conteudo = wrapper.querySelector('.vector-block-content');
    if (conteudo.style.display === 'none') {
        conteudo.style.display = 'block';
        btn.textContent = '▲ Ocultar Detalhes';
    } else {
        conteudo.style.display = 'none';
        btn.textContent = '▼ Expandir Detalhes';
    }
}

function alternarTodosBlocos(secaoId, visivel) {
    const container = document.getElementById(secaoId);
    if (!container) return;
    const blocos = container.querySelectorAll('.vector-block-wrapper');
    blocos.forEach(bloco => {
        const conteudo = bloco.querySelector('.vector-block-content');
        const btn = bloco.querySelector('.btn-toggle-bloco');
        if (visivel) {
            conteudo.style.display = 'block';
            if (btn) btn.textContent = '▲ Ocultar Detalhes';
        } else {
            conteudo.style.display = 'none';
            if (btn) btn.textContent = '▼ Expandir Detalhes';
        }
    });
}






function gerarTabela() {
    const numPos = parseInt(document.getElementById('campos-pos').value);
    const numTemp = parseInt(document.getElementById('campos-temp').value);
    const header = document.getElementById('table-header');
    const tbody = document.getElementById('table-body');
    
    header.innerHTML = '';
    tbody.innerHTML = '';

    if (numPos < 5 || numPos > 10 || numTemp < 5 || numTemp > 10) {
        alert("Dimensões inválidas. Selecione valores de amostragem entre 5 e 10.");
        return;
    }

    const totalPesos = (3 + numTemp) * 1.0 + (3 * 1.4); 
    const baseWidth = (96 / totalPesos); 

    const larguraDado = (baseWidth * 1.0).toFixed(4) + 'vw';
    const larguraCalculado = (baseWidth * 1.4).toFixed(4) + 'vw';

    let colsHtml = `
        <th style="width: ${larguraDado}">x<br>(m|km)</th>
        <th style="width: ${larguraDado}">y<br>(m|km)</th>
        <th style="width: ${larguraDado}">z<br>(m|km)</th>
    `;
    
    for (let i = 1; i <= numTemp; i++) {
        colsHtml += `<th style="width: ${larguraDado}">t${i}<br>(ens)</th>`;
    }

    colsHtml += `
        <th style="width: ${larguraCalculado}">t<sub>m</sub><br>(SI)</th>
        <th style="width: ${larguraCalculado}">v<sub>m</sub><br>(SI)</th>
        <th style="width: ${larguraCalculado}">a<sub>m</sub><br>(SI)</th>
    `;
    header.innerHTML = colsHtml;

    for (let p = 0; p < numPos; p++) {
        let row = document.createElement('tr');
        let referencialInicial = (p + 1) * 2;
        
        let rowHtml = `
            <td><input type="number" value="${referencialInicial}" class="pos-x" name="pos_x_${p}" step="any"></td>
            <td><input type="number" value="0" class="pos-y" name="pos_y_${p}" step="any"></td>
            <td><input type="number" value="0" class="pos-z" name="pos_z_${p}" step="any"></td>
        `;

        for (let t = 0; t < numTemp; t++) {
            let tempoInjetado = ((p + 1) * 1.5 + (t * 0.1)).toFixed(2);
            rowHtml += `<td><input type="number" value="${tempoInjetado}" class="tempo" name="tempo_${p}_${t}" step="any"></td>`;
        }

        rowHtml += `
            <td class="tempo-medio" style="font-weight: bold; color: #2b2b2b;">—</td>
            <td class="vel-media" style="font-weight: bold; color: #212529;">—</td>
            <td class="acel-media" style="font-weight: bold; color: #212529;">—</td>
        `;
        row.innerHTML = rowHtml;
        tbody.appendChild(row);
    }

    document.getElementById('section-tabela').style.display = 'block';
    document.getElementById('container-calcular').style.display = 'block';
    document.getElementById('painel-resultados').style.display = 'none';
    
    if (animacaoId) {
        cancelAnimationFrame(animacaoId);
        animacaoId = null;
    }

    document.querySelectorAll('#table-body input').forEach(element => {
        element.addEventListener('input', () => {
            if (document.getElementById('painel-resultados').style.display === 'block') {
                if (typeof calcular === 'function') { calcular(); }
            }
        });
    });
}



function calcular() {
    const rows = document.querySelectorAll('#table-body tr');
    if (rows.length === 0) return;

    const massa = parseFloat(document.getElementById('massa').value) || 1;
    const v0Input = parseFloat(document.getElementById('vel-inicial').value) || 0;
    const uniVel = document.getElementById('unidade-vel').value;
    const v0 = uniVel === 'kmh' ? (v0Input / 3.6) : v0Input;

    const thetaGraus = parseFloat(document.getElementById('angulo-theta').value) || 0;
    const phiGraus = parseFloat(document.getElementById('angulo-phi').value) || 0;
    const theta = thetaGraus * Math.PI / 180;
    const phi = phiGraus * Math.PI / 180;

    const traj = document.getElementById('trajetoria').value;
    const uniEspaco = document.getElementById('unidade-espaco').value;
    const uniTempo = document.getElementById('unidade-tempo').value;
    const g = 9.81;

    const fatorEspaco = uniEspaco === 'km' ? 1000 : 1;
    let fatorTempo = 1;
    if (uniTempo === 'min') fatorTempo = 60;
    else if (uniTempo === 'h') fatorTempo = 3600;
    else if (uniTempo === 'd') fatorTempo = 86400;
    else if (uniTempo === 'ano') fatorTempo = 31536000;

    let resultadosVetorHTML = '';
    let resultadosModuloHTML = '';
    historicoCalculos = [];

    let dadosFinais = { t: 0, x: 0, y: 0, z: 0, v: 0, a: 0, vx: 0, vy: 0, vz: 0, ax: 0, ay: 0, az: 0 };

    rows.forEach((row, index) => {
        let xInput = row.querySelector('.pos-x');
        let yInput = row.querySelector('.pos-y');
        let zInput = row.querySelector('.pos-z');

        let xRaw = parseFloat(xInput.value) || 0;
        let yRaw = parseFloat(yInput.value) || 0;
        let zRaw = parseFloat(zInput.value) || 0;

        let x = xRaw * fatorEspaco;
        let y = yRaw * fatorEspaco;
        let z = zRaw * fatorEspaco;

        const temposInput = row.querySelectorAll('.tempo');
        let temposSI = [];
        temposInput.forEach(t => temposSI.push((parseFloat(t.value) || 0) * fatorTempo));

        if (temposSI.length < 3) return;

        let temposOrdenados = [...temposSI].sort((a, b) => a - b);
        let temposValidos = temposOrdenados.slice(1, -1);
        let somaTempos = temposValidos.reduce((acc, curr) => acc + curr, 0);
        let tempoMedio = somaTempos / temposValidos.length;
        
        row.querySelector('.tempo-medio').textContent = (tempoMedio / fatorTempo).toFixed(2);

        let d = Math.sqrt(x*x + y*y + z*z);
        let velMedia = tempoMedio > 0 ? (d / tempoMedio) : 0;
        row.querySelector('.vel-media').textContent = (velMedia / (fatorEspaco / fatorTempo)).toFixed(2);

        let acelMedia = tempoMedio > 0 ? (2 * velMedia / tempoMedio) : 0;
        row.querySelector('.acel-media').textContent = (acelMedia / (fatorEspaco / (fatorTempo * fatorTempo))).toFixed(2);

        let velInstantanea = acelMedia * tempoMedio;

        let vx = velInstantanea * Math.cos(phi) * Math.cos(theta);
        let vy = velInstantanea * Math.cos(phi) * Math.sin(theta);
        let vz = velInstantanea * Math.sin(phi);

        let ax = acelMedia * Math.cos(phi) * Math.cos(theta);
        let ay = acelMedia * Math.cos(phi) * Math.sin(theta);
        let az = acelMedia * Math.sin(phi);

        if (traj === 'horizontal') {
            vz = 0; az = 0;
        } else if (traj === 'vertical') {
            vx = 0; vy = 0; ax = 0; ay = 0;
            vz = velInstantanea; az = acelMedia;
        }

        if (index === rows.length - 1) {
            dadosFinais = { t: tempoMedio, x, y, z, v: velInstantanea, a: acelMedia, vx, vy, vz, ax, ay, az };
        }

        let px = massa * vx; let py = massa * vy; let pz = massa * vz;
        let fx = massa * ax; let fy = massa * ay; let fz = massa * az;
        let impX = fx * tempoMedio; let impY = fy * tempoMedio; let impZ = fz * tempoMedio;
        
        let ec = 0.5 * massa * Math.pow(velInstantanea, 2);
        let ep = massa * g * z; 
        let potencia = tempoMedio > 0 ? ((ec + ep) / tempoMedio) : 0;

        historicoCalculos.push({
            ponto: index + 1, x, y, z, tempoMedio, velMedia, acelMedia, velInstantanea,
            vx, vy, vz, ax, ay, az, fx, fy, fz, px, py, pz, impX, impY, impZ, ec, ep, potencia
        });





                let dissipadoHTML = '';
        if (traj === 'vertical') {
            let tTeorico = Math.sqrt(2 * Math.abs(z) / (g || 1));
            let erroT = tTeorico > 0 ? (Math.abs(tempoMedio - tTeorico) / tTeorico) * 100 : 0;
            let fArrasto = Math.abs((massa * g) - Math.abs(fz));
            let eDissipada = Math.abs((massa * g * z) - ec);
            dissipadoHTML = `
                <div class="item-grandeza"><span class="label-grandeza">Tempo Teórico Queda Livre:</span><span>t<sub>teo</sub> = ${formatarCientifico(tTeorico)} s</span><span class="badge-teorico">Ideal</span></div>
                <div class="item-grandeza"><span class="label-grandeza">Divergência de Tempo (Erro %):</span><span>Erro = ${formatarCientifico(erroT)}%</span></div>
                <div class="item-grandeza"><span class="label-grandeza">Força de Resistência do Ar:</span><span>|F<sub>ar</sub>| = ${formatarCientifico(fArrasto)} N</span><span class="badge-dissipado">Dissipativo</span></div>
                <div class="item-grandeza"><span class="label-grandeza">Energia Mecânica Dissipada:</span><span>ΔE<sub>m</sub> = ${formatarCientifico(eDissipada)} J</span><span class="badge-dissipado">Dissipativo</span></div>
            `;
        } else if (traj === 'inclinada') {
            let aTeorica = g * Math.sin(Math.abs(phi));
            let fTeorica = massa * aTeorica;
            let fRealMod = Math.sqrt(fx*fx + fy*fy + fz*fz);
            let fAtrito = Math.abs(fTeorica - fRealMod);
            let fNormal = massa * g * Math.cos(phi);
            let muC = fNormal > 0 ? fAtrito / fNormal : 0;
            let eDissipada = Math.abs((massa * g * z + (0.5 * massa * v0 * v0)) - (ec + (massa * g * z)));
            dissipadoHTML = `
                <div class="item-grandeza"><span class="label-grandeza">Aceleração Ideal (Sem Atrito):</span><span>a<sub>ideal</sub> = ${formatarCientifico(aTeorica)} m/s²</span><span class="badge-teorico">Ideal</span></div>
                <div class="item-grandeza"><span class="label-grandeza">Força de Atrito Cinético Média:</span><span>F<sub>at</sub> = ${formatarCientifico(fAtrito)} N</span><span class="badge-dissipado">Dissipativo</span></div>
                <div class="item-grandeza"><span class="label-grandeza">Força Normal de Contato:</span><span>N = ${formatarCientifico(fNormal)} N</span></div>
                <div class="item-grandeza"><span class="label-grandeza">Coeficiente de Atrito Cinético (μc):</span><span>μ<sub>c</sub> = ${formatarCientifico(muC)}</span></div>
                <div class="item-grandeza"><span class="label-grandeza">Energia Térmica Dissipada:</span><span>W = ${formatarCientifico(eDissipada)} J</span><span class="badge-dissipado">Dissipativo</span></div>
            `;
        } else if (traj === 'parabolica') {
            if (v0 === 0 && (thetaGraus >= 180 || thetaGraus < 0)) {
                let eDissipada = Math.abs((massa * g * Math.abs(z)) - ec);
                let fNormalCurva = massa * g * Math.cos(phi) + (massa * velInstantanea * velInstantanea / (d || 1));
                let fAtrito = tempoMedio > 0 ? eDissipada / (d || 1) : 0;
                let muC = fNormalCurva > 0 ? fAtrito / fNormalCurva : 0;
                dissipadoHTML = `
                    <div class="item-grandeza"><span class="label-grandeza">Força de Atrito na Rampa:</span><span>F<sub>at</sub> = ${formatarCientifico(fAtrito)} N</span><span class="badge-dissipado">Dissipativo</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Força Normal Curvilínea Média:</span><span>N = ${formatarCientifico(fNormalCurva)} N</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Coeficiente de Atrito (μc):</span><span>μ<sub>c</sub> = ${formatarCientifico(muC)}</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Energia Mecânica Dissipada:</span><span>ΔE<sub>m</sub> = ${formatarCientifico(eDissipada)} J</span><span class="badge-dissipado">Dissipativo</span></div>
                `;
            } else if (v0 !== 0 && thetaGraus >= 0 && thetaGraus < 180) {
                let fArrastoX = massa * ax;
                let fArrastoY = massa * ay;
                let fArrastoZ = massa * (az - (-g));
                let fArrastoMod = Math.sqrt(fArrastoX*fArrastoX + fArrastoY*fArrastoY + fArrastoZ*fArrastoZ);
                dissipadoHTML = `
                    <div class="item-grandeza"><span class="label-grandeza">Força de Arrasto Vetorial:</span><span>F<sub>ar</sub> = (${formatarCientifico(fArrastoX)}i + ${formatarCientifico(fArrastoY)}j + ${formatarCientifico(fArrastoZ)}k) N</span><span class="badge-dissipado">Dissipativo</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Módulo da Resistência do Ar:</span><span>|F<sub>ar</sub>| = ${formatarCientifico(fArrastoMod)} N</span></div>
                `;
            }
        }




          // Definição de vetores e versores blindados contra falhas de renderização de fontes
        const v_r = '<span style="position:relative;display:inline-block;margin-right:3px;">r<span style="position:absolute;top:-0.3em;left:0;font-size:0.75em;line-height:1;">→</span></span>';
        const v_v = '<span style="position:relative;display:inline-block;margin-right:3px;">v<span style="position:absolute;top:-0.3em;left:0;font-size:0.75em;line-height:1;">→</span></span>';
        const v_a = '<span style="position:relative;display:inline-block;margin-right:3px;">a<span style="position:absolute;top:-0.3em;left:0;font-size:0.75em;line-height:1;">→</span></span>';
        const v_p = '<span style="position:relative;display:inline-block;margin-right:3px;">p<span style="position:absolute;top:-0.3em;left:0;font-size:0.75em;line-height:1;">→</span></span>';
        const v_I = '<span style="position:relative;display:inline-block;margin-right:3px;">I<span style="position:absolute;top:-0.3em;left:0;font-size:0.75em;line-height:1;">→</span></span>';
        const v_F = '<span style="position:relative;display:inline-block;margin-right:3px;">F<span style="position:absolute;top:-0.3em;left:0;font-size:0.75em;line-height:1;">→</span></span>';

        const u_i = '<span style="font-weight:bold;font-style:italic;">î</span>';
        const u_j = '<span style="font-weight:bold;font-style:italic;">ĵ</span>';
        const u_k = '<span style="position:relative;display:inline-block;font-weight:bold;font-style:italic;">k<span style="position:absolute;top:-0.35em;left:1px;font-size:0.8em;font-style:normal;font-weight:normal;">^</span></span>';

        const m_s = "<div style='display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:0.85em;line-height:1;margin:0 2px;'><span style='border-bottom:1px solid #333;padding:0 2px;'>m</span><span>s</span></div>";
        const m_s2 = "<div style='display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:0.85em;line-height:1;margin:0 2px;'><span style='border-bottom:1px solid #333;padding:0 2px;'>m</span><span>s²</span></div>";
        const kg_m_s = "<div style='display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:0.85em;line-height:1;margin:0 2px;'><span style='border-bottom:1px solid #333;padding:0 2px;'>kg·m</span><span>s</span></div>";

        resultadosVetorHTML += `
            <div class="vector-block-wrapper">
                <div class="vector-block-header"><h3>Ponto Amostral #${index + 1}</h3><button type="button" class="btn-toggle-bloco" onclick="alternarBlocoIndividual(this)">▲ Ocultar Detalhes</button></div>
                <div class="vector-block-content">
                    <div class="item-grandeza"><span class="label-grandeza">Posição Espacial Vetorial (r):</span><span>${v_r} = (${formatarCientifico(x)} m)${u_i} + (${formatarCientifico(y)} m)${u_j} + (${formatarCientifico(z)} m)${u_k}</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Velocidade Instantânea Vetorial (v):</span><span>${v_v} = (${formatarCientifico(vx)}${m_s})${u_i} + (${formatarCientifico(vy)}${m_s})${u_j} + (${formatarCientifico(vz)}${m_s})${u_k}</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Aceleração Vetorial (a):</span><span>${v_a} = (${formatarCientifico(ax)}${m_s2})${u_i} + (${formatarCientifico(ay)}${m_s2})${u_j} + (${formatarCientifico(az)}${m_s2})${u_k}</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Momento Linear Coordenado (p):</span><span>${v_p} = (${formatarCientifico(px)}${kg_m_s})${u_i} + (${formatarCientifico(py)}${kg_m_s})${u_j} + (${formatarCientifico(pz)}${kg_m_s})${u_k}</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Impulso Mecânico Vetorial (I):</span><span>${v_I} = (${formatarCientifico(impX)} N·s)${u_i} + (${formatarCientifico(impY)} N·s)${u_j} + (${formatarCientifico(impZ)} N·s)${u_k}</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Força Resultante Vetorial (F):</span><span>${v_F} = (${formatarCientifico(fx)} N)${u_i} + (${formatarCientifico(fy)} N)${u_j} + (${formatarCientifico(fz)} N)${u_k}</span></div>
                </div>
            </div>
        `;

        resultadosModuloHTML += `
            <div class="vector-block-wrapper">
                <div class="vector-block-header"><h3>Ponto Amostral #${index + 1}</h3><button type="button" class="btn-toggle-bloco" onclick="alternarBlocoIndividual(this)">▲ Ocultar Detalhes</button></div>
                <div class="vector-block-content">
                    <div class="item-grandeza"><span class="label-grandeza">Módulo do Deslocamento Espacial:</span><span>|r| = ${formatarCientifico(d)} m</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Módulo da Velocidade Média:</span><span>|v<sub>m</sub>| = ${formatarCientifico(velMedia)} m/s</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Módulo da Velocidade Instantânea:</span><span>|v| = ${formatarCientifico(velInstantanea)} m/s</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Módulo da Aceleração Resultante:</span><span>|a| = ${formatarCientifico(acelMedia)} m/s²</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Energia Cinética Instantânea:</span><span>E<sub>c</sub> = ${formatarCientifico(ec)} J</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Energia Potencial Gravitacional:</span><span>E<sub>p</sub> = ${formatarCientifico(ep)} J</span></div>
                    <div class="item-grandeza"><span class="label-grandeza">Potência Mecânica Desenvolvida:</span><span>P = ${formatarCientifico(potencia)} W</span></div>
                    ${dissipadoHTML}
                </div>
            </div>
        `;
    });


        document.getElementById('output-vetor').innerHTML = resultadosVetorHTML;
    document.getElementById('output-modulo').innerHTML = resultadosModuloHTML;

    let tReal = dadosFinais.t;
    let aReal = dadosFinais.a;
    let vReal = dadosFinais.v;
    let sFinal = Math.sqrt(dadosFinais.x * dadosFinais.x + dadosFinais.y * dadosFinais.y + dadosFinais.z * dadosFinais.z);
    
    let fResTotal = massa * aReal;
    let ecFinal = 0.5 * massa * Math.pow(vReal, 2);
    let epFinal = massa * g * dadosFinais.z;
    let potFinal = tReal > 0 ? ((ecFinal + epFinal) / tReal) : 0;

    let xAcel = dadosFinais.ax; 
    let yAcel = dadosFinais.ay; 
    let zAcel = dadosFinais.az;
    let xVel = dadosFinais.vx;
    let yVel = dadosFinais.vy;
    let zVel = dadosFinais.vz;

    let equacoesHTML = `
        <div class="vector-block-wrapper" style="width: 100%;">
            <div class="vector-block-header"><h3>Equações de Movimento Parametrizadas Coordenadas para Extrapolação Teórica</h3></div>
            <div class="vector-block-content">
                <div class="item-grandeza"><span class="label-grandeza">Funções Horárias de Posição:</span>
                    <div style="margin-bottom: 5px;">x(t) = 0,00 + 0,00t + (${formatarCientifico(0.5 * xAcel)})t² [m]</div>
                    <div style="margin-bottom: 5px;">y(t) = 0,00 + 0,00t + (${formatarCientifico(0.5 * yAcel)})t² [m]</div>
                    <div>z(t) = 0,00 + 0,00t + (${formatarCientifico(0.5 * zAcel)})t² [m]</div>
                </div>
                <div class="item-grandeza"><span class="label-grandeza">Funções Horárias de Velocidade:</span>
                    <div style="margin-bottom: 5px;">v<sub>x</sub>(t) = 0,00 + (${formatarCientifico(xAcel)})t [m/s]</div>
                    <div style="margin-bottom: 5px;">v<sub>y</sub>(t) = 0,00 + (${formatarCientifico(yAcel)})t [m/s]</div>
                    <div>v<sub>z</sub>(t) = 0,00 + (${formatarCientifico(zAcel)})t [m/s]</div>
                </div>
                <div class="item-grandeza"><span class="label-grandeza">Equação Vetorial de Força Dinâmica:</span>
                    <span>F(m) = m · [ (${formatarCientifico(xAcel)})i + (${formatarCientifico(yAcel)})j + (${formatarCientifico(zAcel)})k ] [N]</span>
                </div>
                <div class="item-grandeza"><span class="label-grandeza">Trabalho da Força Resultante Estendida:</span>
                    <span>W(d) = (${formatarCientifico(fResTotal)}) · d [J]</span>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('output-equacoes').innerHTML = equacoesHTML;
    document.getElementById('painel-resultados').style.display = 'block';

    gerarGraficosReaisCanvas(sFinal, vReal, tReal, aReal);
}

function gerarGraficosReaisCanvas(sFinal, vReal, tReal, aReal) {
    const containerS = document.getElementById('svg-posicao-container');
    const containerV = document.getElementById('svg-velocidade-container');
    
    containerS.innerHTML = ''; 
    containerV.innerHTML = '';
    
    const canvasS = document.createElement('canvas');
    const canvasV = document.createElement('canvas');
    containerS.appendChild(canvasS);
    containerV.appendChild(canvasV);
    
    const w = containerS.clientWidth || 400;
    const h = 180;
    canvasS.width = w; canvasS.height = h;
    canvasV.width = w; canvasV.height = h;
    
    const ctxS = canvasS.getContext('2d');
    const ctxV = canvasV.getContext('2d');
    const pad = 45;

    function desenharEixosGrafico(ctx, labelY, maxValY) {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = "#333333"; ctx.lineWidth = 1.5;
        ctx.font = "11px sans-serif"; ctx.fillStyle = "#333333";
        
        ctx.beginPath(); ctx.moveTo(pad, 10); ctx.lineTo(pad, h - pad); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - 15, h - pad); ctx.stroke();
        
        ctx.fillText("t(s)", w - 30, h - pad + 15);
        ctx.fillText(labelY, pad - 40, 20);
        ctx.fillText("0", pad - 12, h - pad + 12);
        ctx.fillText(tReal.toFixed(2), w - 45, h - pad + 15);
        ctx.fillText(maxValY.toExponential(1).replace('.', ','), pad - 42, 35);
    }

    let sMax = sFinal > 0 ? sFinal * 1.1 : 10;
    desenharEixosGrafico(ctxS, "S(m)", sMax);
    ctxS.strokeStyle = "#005f73"; ctxS.lineWidth = 2.5; ctxS.beginPath();
    for (let i = 0; i <= 40; i++) {
        let t = (tReal / 40) * i;
        let s = 0.5 * aReal * t * t;
        let cx = pad + (t / (tReal || 1)) * (w - pad - 20);
        let cy = (h - pad) - (s / sMax) * (h - pad - 20);
        if (i === 0) ctxS.moveTo(cx, cy); else ctxS.lineTo(cx, cy);
    }
    ctxS.stroke();

    let vMax = vReal > 0 ? vReal * 1.1 : 5;
    desenharEixosGrafico(ctxV, "v(m/s)", vMax);
    ctxV.strokeStyle = "#2a9d8f"; ctxV.lineWidth = 2.5; ctxV.beginPath();
    for (let i = 0; i <= 40; i++) {
        let t = (tReal / 40) * i;
        let v = aReal * t;
        let cx = pad + (t / (tReal || 1)) * (w - pad - 20);
        let cy = (h - pad) - (v / vMax) * (h - pad - 20);
        if (i === 0) ctxV.moveTo(cx, cy); else ctxV.lineTo(cx, cy);
    }
    ctxV.stroke();
    
    inicializarEngineAnimacao(tReal, sFinal);
}


function inicializarEngineAnimacao(tReal, sFinal) {
    const containerAnim = document.getElementById('canvas-animacao-container');
    let canvasAnim = containerAnim.querySelector('canvas');
    if (!canvasAnim) {
        canvasAnim = document.createElement('canvas');
        containerAnim.appendChild(canvasAnim);
    }
    const wA = containerAnim.clientWidth || 800; 
    const hA = 300;
    canvasAnim.width = wA; 
    canvasAnim.height = hA;
    const ctxA = canvasAnim.getContext('2d');

    const traj = document.getElementById('trajetoria').value;
    const thetaGraus = parseFloat(document.getElementById('angulo-theta').value) || 0;
    const phiGraus = parseFloat(document.getElementById('angulo-phi').value) || 0;
    const theta = thetaGraus * Math.PI / 180; 
    const phi = phiGraus * Math.PI / 180;
    const massa = parseFloat(document.getElementById('massa').value) || 1;

    const cX = wA / 2; 
    const cY = hA / 2 + 30;

    function projetar3D(x, y, z) {
        const isoX = cX + (x - y) * Math.cos(Math.PI / 6);
        const isoY = cY + (x + y) * Math.sin(Math.PI / 6) - z;
        return { x: isoX, y: isoY };
    }

    if (animacaoId) cancelAnimationFrame(animacaoId);

    function desenharTriedro3D() {
        ctxA.clearRect(0, 0, wA, hA);
        ctxA.lineWidth = 2;
        const eixos = [
            { x: 120, y: 0, z: 0, cor: "#ff4d4d", label: "X" },
            { x: 0, y: 120, z: 0, cor: "#2a9d8f", label: "Y" },
            { x: 0, y: 0, z: 120, cor: "#005f73", label: "Z" }
        ];
        const origin = projetar3D(0, 0, 0);
        eixos.forEach(e => {
            const fim = projetar3D(e.x, e.y, e.z);
            ctxA.strokeStyle = e.cor; 
            ctxA.beginPath(); 
            ctxA.moveTo(origin.x, origin.y); 
            ctxA.lineTo(fim.x, fim.y); 
            ctxA.stroke();
            ctxA.fillStyle = e.cor; 
            ctxA.font = "bold 11px sans-serif"; 
            ctxA.fillText(e.label, fim.x + 5, fim.y + 5);
        });
    }

    desenharTriedro3D();


        document.getElementById('btn-play').onclick = function() {
        if (animacaoId) cancelAnimationFrame(animacaoId);
        let tempoInicio = performance.now();
        const tTotalSimulado = tReal * 1000;

        function loop(agora) {
            let tempoDecorrido = agora - tempoInicio;
            if (tempoDecorrido > tTotalSimulado) tempoDecorrido = tTotalSimulado;
            
            let tCurrent = tempoDecorrido / 1000;
            let fracao = tReal > 0 ? tCurrent / tReal : 1;

            desenharTriedro3D();

            let x3D = 0, y3D = 0, z3D = 0; 
            const amp = 80; 

            if (traj === 'vertical') { 
                z3D = amp * (1 - fracao); 
            } else if (traj === 'inclinada') {
                x3D = amp * Math.cos(phi) * Math.cos(theta) * (1 - fracao);
                y3D = amp * Math.cos(phi) * Math.sin(theta) * (1 - fracao);
                z3D = amp * Math.sin(phi) * (1 - fracao);
            } else if (traj === 'parabolica') {
                let dLinear = amp * fracao;
                x3D = dLinear * Math.cos(phi) * Math.cos(theta); 
                y3D = dLinear * Math.cos(phi) * Math.sin(theta);
                z3D = (dLinear * Math.sin(phi)) - (0.5 * 30 * fracao * fracao);
            } else { 
                x3D = amp * fracao * Math.cos(theta); 
                y3D = amp * fracao * Math.sin(theta); 
            }

            const posParticula = projetar3D(x3D, y3D, z3D);

            ctxA.strokeStyle = "#e74c3c"; 
            ctxA.lineWidth = 2; 
            ctxA.beginPath(); 
            ctxA.moveTo(posParticula.x, posParticula.y);
            ctxA.lineTo(posParticula.x + 20, posParticula.y - 10); 
            ctxA.stroke();

            ctxA.fillStyle = "#00b4d8"; 
            ctxA.beginPath(); 
            ctxA.arc(posParticula.x, posParticula.y, 10, 0, 2 * Math.PI); 
            ctxA.fill();

            ctxA.fillStyle = "#ffffff"; 
            ctxA.font = "12px monospace";
            ctxA.fillText("Tempo 3D: " + tCurrent.toFixed(2) + "s", 20, 25);

            if (tempoDecorrido < tTotalSimulado) {
                animacaoId = requestAnimationFrame(loop);
            } else {
                animacaoId = null;
            }
        }
        animacaoId = requestAnimationFrame(loop);
    };
}




function exportarPDF() {
    const elemento = document.getElementById('painel-resultados');
    const containerBotoes = elemento.querySelector('div[style*="justify-content: flex-end"]');
    if (containerBotoes) containerBotoes.style.display = 'none';

    if (typeof html2pdf === 'undefined') {
        alert("Biblioteca PDF carregando.");
        if (containerBotoes) containerBotoes.style.display = 'flex';
        return;
    }

    const opt = {
        margin: 10,
        filename: 'Relatorio_Laboratorio_Fisica_3D.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(elemento).toPdf().get('pdf').save().then(() => {
        if (containerBotoes) containerBotoes.style.display = 'flex';
    });
}

function exportarTexto() {
    if (historicoCalculos.length === 0) {
        alert("Gere os dados primeiro.");
        return;
    }

    let conteudoTxt = "==================================================\n";
    conteudoTxt += "  RELATÓRIO DE MOVIMENTO E DINÂMICA TRIDIMENSIONAL 3D\n";
    conteudoTxt += "==================================================\n\n";
    
    historicoCalculos.forEach(d => {
        conteudoTxt += "PONTO EXPERIMENTAL #" + d.ponto + " (Tempo Médio: " + d.tempoMedio.toExponential(2) + "s)\n";
        conteudoTxt += "--------------------------------------------------\n";
        conteudoTxt += "- Posição Espacial Vetorial: r = (" + d.x.toExponential(2) + "i + " + d.y.toExponential(2) + "j + " + d.z.toExponential(2) + "k) m\n";
        conteudoTxt += "- Velocidade Instantânea Vetorial: v = (" + d.vx.toExponential(2) + "i + " + d.vy.toExponential(2) + "j + " + d.vz.toExponential(2) + "k) m/s\n";
        conteudoTxt += "- Aceleração Vetorial: a = (" + d.ax.toExponential(2) + "i + " + d.ay.toExponential(2) + "j + " + d.az.toExponential(2) + "k) m/s²\n";
        conteudoTxt += "- Momento Linear Coordenado: p = (" + d.px.toExponential(2) + "i + " + d.py.toExponential(2) + "j + " + d.pz.toExponential(2) + "k) kg·m/s\n";
        conteudoTxt += "- Força Resultante Dinâmica: F = (" + d.fx.toExponential(2) + "i + " + d.fy.toExponential(2) + "j + " + d.fz.toExponential(2) + "k) N\n";
        conteudoTxt += "- Energia Cinética (K): " + d.ec.toExponential(2) + " J\n";
        conteudoTxt += "- Energia Potencial (U): " + d.ep.toExponential(2) + " J\n";
        conteudoTxt += "- Potência Mecânica Desenvolvida: " + d.potencia.toExponential(2) + " W\n\n";
    });

    const blob = new Blob([conteudoTxt], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Relatorio_Experimento_Fisica_3D.txt';
    link.click();
    URL.revokeObjectURL(link.href);
}

document.getElementById('btnPdf').addEventListener('click', exportarPDF);
document.getElementById('btnTexto').addEventListener('click', exportarTexto);
