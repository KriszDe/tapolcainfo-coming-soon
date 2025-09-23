(function(){
  const STORAGE_KEY = 'borostyan_standings_v1';

  const teamDefaults = (window.__BOROSTYAN_DEFAULT_TEAMS__||[]).map((name,i)=>({peg:i+1, team:name}));

  let state = load() || {
    teams: teamDefaults, // {peg, team, sector?}
    entries: [] // {peg, team, sector, count, totalKg, biggestKg, top5Kg}
  };

  // DOM
  const teamsTable = $('#teamsTable');
  const datalist = $('#teamList');
  const entryForm = $('#entryForm');
  const sectorSelect = $('#sectorSelect');
  const peg = $('#peg'); const team = $('#team');
  const count = $('#count'); const totalKg = $('#totalKg'); const biggestKg = $('#biggestKg'); const top5Kg = $('#top5Kg');
  const btnReset = $('#btnReset'); const btnExport = $('#btnExport'); const btnPrint = $('#btnPrint');

  // Helpers
  function $(s){ return document.querySelector(s) }
  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }
  function load(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) }catch(e){ return null } }
  function num(n){ const v = parseFloat(n); return isFinite(v) ? v : 0 }
  function fmtKg(n){ return (Math.round(n*1000)/1000).toFixed(3) }
  function byRank(a,b){
    // sort: total desc, biggest desc, count desc
    if (b.totalKg !== a.totalKg) return b.totalKg - a.totalKg;
    if (b.biggestKg !== a.biggestKg) return b.biggestKg - a.biggestKg;
    if (b.count !== a.count) return b.count - a.count;
    return a.team.localeCompare(b.team);
  }

  // Render teams table (peg + team + sector edit inline)
  function renderTeams(){
    const headers = ['Horg.hely','Csapat neve','Szektor',''];
    const rows = [`<tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr>`];
    state.teams.forEach((t,idx)=>{
      rows.push(`<tr>
        <td class="right"><input data-idx="${idx}" data-k="peg" type="number" value="${t.peg}" style="width:80px"></td>
        <td><input data-idx="${idx}" data-k="team" value="${escapeHtml(t.team)}" style="min-width:280px"></td>
        <td>
          <select data-idx="${idx}" data-k="sector">
            ${['','I','II','III'].map(s=>`<option value="${s}" ${t.sector===s?'selected':''}>${s||'–'}</option>`).join('')}
          </select>
        </td>
        <td><button class="btn btn-ghost" data-del="${idx}">Törlés</button></td>
      </tr>`);
    });
    rows.push(`<tr>
      <td class="right"><input id="newPeg" type="number" placeholder="#" style="width:80px"></td>
      <td><input id="newTeam" placeholder="Új csapat neve"></td>
      <td>
        <select id="newSector"><option value="">–</option><option>I</option><option>II</option><option>III</option></select>
      </td>
      <td><button class="btn" id="addTeam">+ Hozzáadás</button></td>
    </tr>`);
    teamsTable.innerHTML = rows.join('');

    // options for datalist
    datalist.innerHTML = state.teams.map(t=>`<option value="${escapeHtml(t.team)}">`).join('');

    // listeners
    $$('input[data-idx],select[data-idx]').forEach(el=>{
      el.addEventListener('input', e=>{
        const i = +e.target.getAttribute('data-idx');
        const k = e.target.getAttribute('data-k');
        let v = e.target.value;
        if (k==='peg') v = parseInt(v,10)||0;
        state.teams[i] = {...state.teams[i], [k]: v};
        save();
      });
    });
    $$('button[data-del]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const i = +btn.getAttribute('data-del');
        state.teams.splice(i,1); save(); renderAll();
      });
    });
    $('#addTeam').addEventListener('click', ()=>{
      const np = parseInt($('#newPeg').value||'0',10);
      const nt = ($('#newTeam').value||'').trim();
      const ns = $('#newSector').value||'';
      if (!nt) return;
      state.teams.push({peg:np||state.teams.length+1, team:nt, sector:ns||undefined});
      save(); renderAll();
    });
  }

  // Form submit
  entryForm.addEventListener('submit', e=>{
    e.preventDefault();
    const rec = {
      peg: parseInt(peg.value||'0',10),
      team: team.value.trim(),
      sector: sectorSelect.value,
      count: parseInt(count.value||'0',10),
      totalKg: num(totalKg.value),
      biggestKg: num(biggestKg.value),
      top5Kg: num(top5Kg.value),
    };
    // upsert by sector+team or sector+peg
    const key = (r)=> `${r.sector}||${r.team||''}||${r.peg||''}`;
    const idx = state.entries.findIndex(x=> key(x)===key(rec));
    if (idx>=0) state.entries[idx] = rec; else state.entries.push(rec);
    save(); renderAll();
    entryForm.reset();
  });

  btnReset.addEventListener('click', ()=>{
    if (!confirm('Minden adat törlése?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = { teams: teamDefaults, entries: [] };
    renderAll();
  });
  btnExport.addEventListener('click', ()=>{
    const lines = [['sector','peg','team','count','totalKg','biggestKg','top5Kg'].join(',')];
    state.entries.forEach(r=>{
      lines.push([r.sector,r.peg,`"${r.team.replaceAll('"','""')}"`,r.count,fmtKg(r.totalKg),fmtKg(r.biggestKg),fmtKg(r.top5Kg)].join(','));
    });
    download('borostyan_eredmenyek.csv', lines.join('\n'));
  });
  btnPrint.addEventListener('click', ()=> window.print());

  function computeSector(sector){
    const recs = state.entries.filter(r=>r.sector===sector);
    const arr = recs.map(r=>({ ...r, avgKg: r.count>0 ? r.totalKg/r.count : 0 }));
    arr.sort(byRank);
    arr.forEach((r,i)=> r.rank = i+1);
    return arr;
  }
  function computeOverall(){
    // group by team across sectors
    const map = new Map();
    state.entries.forEach(r=>{
      const t = r.team || state.teams.find(x=>x.peg===r.peg)?.team || `Peg ${r.peg}`;
      if (!map.has(t)) map.set(t, {team:t, totalKg:0, biggestKg:0, count:0});
      const a = map.get(t);
      a.totalKg += r.totalKg||0;
      a.count += r.count||0;
      a.biggestKg = Math.max(a.biggestKg, r.biggestKg||0);
    });
    const arr = Array.from(map.values()).sort(byRank);
    arr.forEach((r,i)=> r.rank=i+1);
    return arr;
  }

  function renderSectorTable(sector, el){
    const rows = [];
    const head = ['Horg.hely','Csapat neve','Helyezés','Legnagyobb hal (kg)','Fogások (db)','Összsúly (kg)','Átlag (kg)','Öt legnagyobb (kg)'];
    rows.push(`<tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>`);
    const arr = computeSector(sector);
    arr.forEach(r=>{
      rows.push(`<tr>
        <td class="center">${r.peg||''}</td>
        <td>${escapeHtml(r.team||'')}</td>
        <td class="center"><span class="badge">${r.rank}</span></td>
        <td class="right">${fmtKg(r.biggestKg||0)}</td>
        <td class="right">${r.count||0}</td>
        <td class="right"><b>${fmtKg(r.totalKg||0)}</b></td>
        <td class="right">${r.count?fmtKg((r.totalKg||0)/r.count):'0.000'}</td>
        <td class="right">${fmtKg(r.top5Kg||0)}</td>
      </tr>`);
    });
    // footer sum
    const sum = arr.reduce((a,r)=>({total:a.total+(r.totalKg||0), count:a.count+(r.count||0), top5:a.top5+(r.top5Kg||0)}),{total:0,count:0,top5:0});
    rows.push(`<tr>
      <td colspan="4" class="right"><b>Összesen</b></td>
      <td class="right"><b>${sum.count}</b></td>
      <td class="right"><b>${fmtKg(sum.total)}</b></td>
      <td class="right"><b>${arr.length?fmtKg(sum.total/Math.max(sum.count,1)): '0.000'}</b></td>
      <td class="right"><b>${fmtKg(sum.top5)}</b></td>
    </tr>`);
    el.innerHTML = rows.join('');
  }

  function renderOverall(){
    const el = $('#overall');
    const head = ['Horg.hely','Csapat neve','Helyezés','Legnagyobb (kg)','Fogások (db)','Összsúly (kg)','Átlag (kg)'];
    const rows = [`<tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>`];
    const arr = computeOverall();
    arr.forEach(r=>{
      const teamObj = state.teams.find(t=>t.team===r.team);
      rows.push(`<tr>
        <td class="center">${teamObj?.peg||''}</td>
        <td>${escapeHtml(r.team)}</td>
        <td class="center"><span class="badge">${r.rank}</span></td>
        <td class="right">${fmtKg(r.biggestKg||0)}</td>
        <td class="right">${r.count||0}</td>
        <td class="right"><b>${fmtKg(r.totalKg||0)}</b></td>
        <td class="right">${r.count?fmtKg(r.totalKg/r.count):'0.000'}</td>
      </tr>`);
    });
    const sum = arr.reduce((a,r)=>({total:a.total+r.totalKg,count:a.count+r.count}),{total:0,count:0});
    rows.push(`<tr>
      <td colspan="4" class="right"><b>Összesen</b></td>
      <td class="right"><b>${sum.count}</b></td>
      <td class="right"><b>${fmtKg(sum.total)}</b></td>
      <td class="right"><b>${arr.length?fmtKg(sum.total/Math.max(sum.count,1)):'0.000'}</b></td>
    </tr>`);
    el.innerHTML = rows.join('');
  }

  function renderAll(){
    renderTeams();
    renderSectorTable('I', $('#sector_I'));
    renderSectorTable('II', $('#sector_II'));
    renderSectorTable('III', $('#sector_III'));
    renderOverall();
  }

  // utils
  function $$(s){ return Array.from(document.querySelectorAll(s)) }
  function escapeHtml(s){ return s?.replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) || '' }
  function download(name, text){
    const blob = new Blob([text], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
  }

  // hydrate
  renderAll();
})();
