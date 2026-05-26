// ============================================================
// FlashLearn Hub — app.js
// All app logic: flashcards, quiz, timer, notes,
// progress tracking, themes, navigation
// ============================================================

function buildFullStack(deckId){
 const base=BASE_CARDS[deckId]||[];
 const extra=extraCards[deckId]||[];
 return shuffle([...base,...extra]);
}

// Returns next SET_SIZE cards from the deck stack, refilling if needed
function getNextSet(deckId){
 if(deckStacks[deckId].length<SET_SIZE){
 // Refill: reshuffle the full 150 again
 deckStacks[deckId]=[...buildFullStack(deckId)];
 }
 const set=deckStacks[deckId].splice(0,SET_SIZE);
 return set;
}

// For quiz wrong-answer pool: use full stack for distractors
function buildPool(deckId){
 // Legacy: returns a flat set of 20 for current session
 return getNextSet(deckId);
}
function buildFCPool(deckId){return getNextSet(deckId);}
function buildQuizPool(deckId){
 if(deckStacks[deckId].length<SET_SIZE) deckStacks[deckId]=[...buildFullStack(deckId)];
 const set=deckStacks[deckId].splice(0,SET_SIZE);
 quizStack=[...deckStacks[deckId],...buildFullStack(deckId)];
 return set;
}

// ════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════
let xp=0,streak=0,studyMins=0;
let curDeck='oop',fcIdx=0,fcFlipped=false,fcQueue=[],fcCorrect=0,fcAgain=0,fcHard=0;
let quizDeckId='py',quizIdx=0,quizAnswered=false,quizScore=0,quizData=[];
// ════════════════════════════════════════════
// ALARM
// ════════════════════════════════════════════
function playAlarm(){
 try{
 const ctx=new(window.AudioContext||window.webkitAudioContext)();
 [0,400,800,1200,1600].forEach(delay=>{
 const osc=ctx.createOscillator();
 const gain=ctx.createGain();
 osc.connect(gain);gain.connect(ctx.destination);
 osc.type='sine';
 osc.frequency.setValueAtTime(880,ctx.currentTime+delay/1000);
 osc.frequency.exponentialRampToValueAtTime(440,ctx.currentTime+(delay+300)/1000);
 gain.gain.setValueAtTime(0.6,ctx.currentTime+delay/1000);
 gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+(delay+350)/1000);
 osc.start(ctx.currentTime+delay/1000);
 osc.stop(ctx.currentTime+(delay+400)/1000);
 });
 }catch(e){console.warn('Alarm audio failed:',e);}
}

// ════════════════════════════════════════════
// TIMER
// ════════════════════════════════════════════
// ════════════════════════════════════════════
// TIMER
// ════════════════════════════════════════════
let tSecs=25*60,tTotal=25*60,tRunning=false,tInterval=null,tModeName='Pomodoro';

function updateTimer(){
 const m=Math.floor(tSecs/60), s=tSecs%60;
 const el=document.getElementById('tDigits');
 if(el) el.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
 const ring=document.getElementById('tRing');
 if(ring){
 const pct=(tTotal-tSecs)/tTotal;
 const circ=2*Math.PI*95;
 ring.style.strokeDashoffset=circ*(1-pct);
 }
}

function setMode(mins,label,btn){
 clearInterval(tInterval); tRunning=false;
 tSecs=tTotal=mins*60; tModeName=label;
 updateTimer();
 const startBtn=document.getElementById('tStartBtn');
 if(startBtn) startBtn.textContent='Start';
 const st=document.getElementById('tStatus');
 if(st) st.textContent=label+' · '+mins+'m — ready';
 document.querySelectorAll('.tmode-btn').forEach(b=>b.classList.remove('active'));
 if(btn) btn.classList.add('active');
 const lbl=document.getElementById('tModeLbl');
 if(lbl) lbl.textContent=label;
}

function toggleTimer(){
 const btn=document.getElementById('tStartBtn');
 if(tRunning){
 clearInterval(tInterval); tRunning=false;
 if(btn) btn.textContent='▶ Resume';
 const st=document.getElementById('tStatus');
 if(st) st.textContent='Paused';
 } else {
 if(tSecs===0){ tSecs=tTotal; }
 tRunning=true;
 tInterval=setInterval(()=>{
 if(tSecs>0){ tSecs--; updateTimer(); }
 else{
 clearInterval(tInterval); tRunning=false;
 if(btn) btn.textContent='Start';
 const st=document.getElementById('tStatus');
 if(st) st.textContent='✅ Session complete!';
 playAlarm();
 logSession();
 toast('Session complete! 🎉');
 }
 },1000);
 if(btn) btn.textContent='⏸ Pause';
 const st=document.getElementById('tStatus');
 if(st) st.textContent=' Focusing — '+tModeName+'…';
 }
}

function resetTimer(){
 clearInterval(tInterval); tRunning=false; tSecs=tTotal;
 updateTimer();
 const btn=document.getElementById('tStartBtn');
 if(btn) btn.textContent='Start';
 const st=document.getElementById('tStatus');
 if(st) st.textContent='Ready — pick a mode and start focusing';
}

function logSession(){
 studyMins+=Math.round(tTotal/60);
 const el=document.getElementById('studyTimeMet');
 if(el) el.textContent=studyMins+'m';
 // Add session log entry
 const log=document.getElementById('sessLog');
 if(log){
 const entry=document.createElement('div');
 entry.className='sess-entry';
 entry.innerHTML=`<span class="sess-dot" style="background:var(--accent)"></span><span>${tModeName} · ${Math.round(tTotal/60)}m</span><span style="margin-left:auto;color:var(--muted);font-size:0.73rem">just now</span>`;
 log.prepend(entry);
 }
}
let prefs={heatmap:true,chart:true};
let currentTheme=null; // null = using default CSS accent, set when user picks a colour
let currentMode='light'; document.body.classList.add('theme-light');
let activeNoteId=null;
let notes=[
 {id:1,title:'OOP — Key Pillars Summary',body:'The 4 pillars of OOP:\n1. Encapsulation — bundle data + methods, hide internals\n2. Abstraction — expose only what is needed\n3. Inheritance — reuse parent class properties in child class\n4. Polymorphism — one interface, many implementations\n\nRemember: abstract classes can have method bodies; interfaces (in Java) cannot (before Java 8 default methods).'},
 {id:2,title:'Python Quick Reference',body:'List comprehension: [expr for x in iterable if cond]\nDict comprehension: {k: v for k, v in items}\n\nCommon built-ins:\n• enumerate(list) → (index, value)\n• zip(a, b) → pairs\n• map(fn, list), filter(fn, list)\n\nException handling:\ntry:\n ...\nexcept ValueError as e:\n print(e)\nfinally:\n ...'}
];

// ════════════════════════════════════════════
// NAV
// ════════════════════════════════════════════
// showPage defined later (merged with landing section logic)
function toggleSidebar(){document.getElementById('sidebar')?.classList.toggle('open');document.getElementById('overlay')?.classList.toggle('show')}
function closeSidebar(){document.getElementById('sidebar')?.classList.remove('open');document.getElementById('overlay')?.classList.remove('show')}

// ════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════
let toastTO=null;
function toast(msg){
 clearTimeout(toastTO);
 document.getElementById('toastMsg').textContent=msg;
 document.getElementById('toast').classList.add('show');
 toastTO=setTimeout(()=>document.getElementById('toast').classList.remove('show'),3200);
}

// ════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════
const DCOLORS={oop:'var(--accent)',im:'var(--teal)',py:'var(--amber)',hci:'var(--coral)',ec:'var(--green)',net:'var(--accent)',qm:'var(--pink)'};
const DHEX={oop:'#7c6af5',im:'#3ecfb2',py:'#f5c542',hci:'#ff7e6b',ec:'#55d48b',net:'#00b4d8',qm:'#e86bb0'};

// Compute real mastery % from deckStats (flashcard + quiz combined accuracy)
function getMastery(deckId){
 const s = deckStats[deckId];
 if(!s) return 0;
 const totalSeen = (s.seen || 0) + (s.quizTotal || 0);
 const totalCorrect = (s.correct || 0) + (s.quizCorrect || 0);
 if(totalSeen === 0) return 0;
 return Math.min(100, Math.round(totalCorrect / totalSeen * 100));
}

function renderDashboard(){
 // Activity dots
 if(prefs.heatmap){
 const lvls=[0,1,2,3,2,1,0,1,2,3,3,2,1,0,1,2,3,3,2,1,2,3,2,1,0,1,2,3,2,1];
 document.getElementById('activityDots').innerHTML=lvls.map((l,i)=>`<div class="act-dot act-${['none','low','med','high'][Math.min(l,3)]}${i===29?' act-today':''}" title="${[0,4,12,24][Math.min(l,3)]} cards"></div>`).join('');
 } else {
 document.getElementById('activityDots').innerHTML='<span style="font-size:0.78rem;color:var(--muted)">Activity heatmap hidden in settings.</span>';
 }

 // Week chart
 if(prefs.chart){
 const wk=[{d:'M',v:32},{d:'T',v:45},{d:'W',v:58},{d:'T',v:41},{d:'F',v:67},{d:'S',v:28},{d:'S',v:12}];
 const mx=Math.max(...wk.map(w=>w.v));
 document.getElementById('weekChart').innerHTML=wk.map(w=>`<div class="bar-col"><div class="bar" style="height:${Math.round(w.v/mx*100)}%;background:var(--accent);opacity:.75"></div><div class="bar-lbl">${w.d}</div></div>`).join('');
 } else {
 document.getElementById('weekChart').innerHTML='<span style="font-size:0.78rem;color:var(--muted)">Chart hidden.</span>';
 }

 // Mastery bars
 document.getElementById('masteryBars').innerHTML=DECKS.map(d=>{
 const m = getMastery(d.id);
 const s = deckStats[d.id];
 const totalSeen = s ? (s.seen||0)+(s.quizTotal||0) : 0;
 const sublabel = totalSeen === 0 ? 'Not started yet' : `${totalSeen} cards reviewed`;
 return `<div class="subj-row">
 <span class="subj-name">${d.name}</span>
 <div class="subj-pb"><div class="subj-pbar" style="width:0%;background:${DCOLORS[d.id]}" data-w="${m}"></div></div>
 <span class="subj-pct" style="min-width:40px;text-align:right">${m > 0 ? m+'%' : '—'}</span>
 </div>
 <div style="font-size:0.68rem;color:var(--muted);margin:-2px 0 8px 2px">${sublabel}</div>`;
 }).join('');
 setTimeout(()=>document.querySelectorAll('.subj-pbar').forEach(b=>b.style.width=b.dataset.w+'%'),100);
}

function goFlashcards(id){
 curDeck=id;
 const el=document.querySelectorAll('.nav-item')[1];
 showPage('flashcards',el);
}

// ════════════════════════════════════════════
// FLASHCARDS (30-item shuffled sets)
// ════════════════════════════════════════════
function initFC(){
 // Build deck selector chips
 document.getElementById('deckSelector').innerHTML=DECKS.map(d=>`<button class="deck-chip${d.id===curDeck?' active':''}" onclick="switchDeck('${d.id}',this)">${d.name}</button>`).join('');
 loadDeck(curDeck);
}
function switchDeck(id,el){
 curDeck=id;
 document.querySelectorAll('.deck-chip').forEach(c=>c.classList.remove('active'));
 el.classList.add('active');
 loadDeck(id);
}
function loadDeck(id){
 fcQueue=buildFCPool(id);
 fcIdx=0;fcFlipped=false;fcCorrect=0;fcAgain=0;fcHard=0;
 document.getElementById('fcDone').style.display='none';
 document.getElementById('fcInner').style.display='';
 document.getElementById('fcHint').style.display='';
 document.getElementById('fcBtns').style.display='';
 document.querySelector('.fc-bar-bg').style.display='';
 document.querySelector('.fc-counter').style.display='';
 showFCCard();
}
function showFCCard(){
 if(fcIdx>=fcQueue.length){showFCDone();return;}
 const c=fcQueue[fcIdx];
 document.getElementById('fcQ').textContent=c.q;
 document.getElementById('fcA').textContent=c.a;
 document.getElementById('fcTag').textContent=c.t;
 document.getElementById('fcTag2').textContent=c.t;
 document.getElementById('fcCounter').textContent=`Card ${fcIdx+1} of ${SET_SIZE}`;
 document.getElementById('fcBar').style.width=(fcIdx/SET_SIZE*100)+'%';
 document.getElementById('fcInner').classList.remove('flipped');
 fcFlipped=false;
 document.getElementById('fcHint').textContent='👆 Click or tap the card to reveal the answer';
 document.querySelectorAll('.fc-btns button').forEach(b=>b.classList.remove('unlocked'));
}
function flipCard(){
 fcFlipped=!fcFlipped;
 document.getElementById('fcInner').classList.toggle('flipped');
 document.getElementById('fcHint').textContent=fcFlipped?'↕ Click to flip back':'👆 Click or tap to reveal';
 document.querySelectorAll('.fc-btns button').forEach(b=>b.classList.toggle('unlocked',fcFlipped));
}
function rateCard(r){
 if(!fcFlipped) return;
 initDeckStats();
 totalAnswered++;
 deckStats[curDeck].seen++;
 if(r==='good'){
 fcCorrect++; totalCorrect++; totalMastered++;
 deckStats[curDeck].correct++;
 if(streak > bestStreak) bestStreak = streak;
 gainXP(5);
 const d=DECKS.find(x=>x.id===curDeck);
 } else if(r==='hard'){
 fcHard++;
 } else {
 fcAgain++;
 }
 updateLiveStats();
 fcIdx++;
 setTimeout(showFCCard,180);
}
function showFCDone(){
 initDeckStats();
 fcSetsCompleted++;
 deckStats[curDeck].fcSets++;
 document.getElementById('fcDone').style.display='block';
 ['fcInner','fcHint','fcBtns'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
 document.querySelector('.fc-bar-bg').style.display='none';
 document.querySelector('.fc-counter').style.display='none';
 const pct=Math.round(fcCorrect/SET_SIZE*100);
 document.getElementById('fcDoneMsg').textContent=`${SET_SIZE} cards done! ✓ ${fcCorrect} Got it · ~ ${fcHard} Hard · ✗ ${fcAgain} Again · Accuracy: ${pct}%`;
 const remaining=deckStacks[curDeck]?deckStacks[curDeck].length:0;
 const stackInfo=remaining>0
 ? `${remaining} cards remaining · Next set pulls ${Math.min(SET_SIZE,remaining)} fresh cards`
 : `All 150 cards seen! Next set will reshuffle.`;
 document.getElementById('fcStackInfo').textContent=stackInfo;
 document.getElementById('fcBar').style.width='100%';
 updateLiveStats();
 toast('Set complete! 🎉');
}
function nextFCSet(){loadDeck(curDeck);}
function restartDeck(){
 // Force full reshuffle by clearing the stack
 deckStacks[curDeck]=[];
 loadDeck(curDeck);
}

// ════════════════════════════════════════════
// DECKS PAGE
// ════════════════════════════════════════════
function renderDecks(){
 document.getElementById('deckGrid').innerHTML=DECKS.map(d=>{
 const total=(BASE_CARDS[d.id]||[]).length+(extraCards[d.id]||[]).length;
 return `<div class="dk-card" onclick="goFlashcards('${d.id}')">
 <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${DHEX[d.id]};border-radius:14px 14px 0 0"></div>
 <div class="dk-icon" style="background:${DHEX[d.id]||d.color};border-radius:50%;width:36px;height:36px;flex-shrink:0"></div>
 <div class="dk-name">${d.name}</div>
 <div class="dk-count">${total} cards · ${d.due} due</div>
 <div class="dk-pb-bg"><div class="dk-pb" style="width:0%;background:${DHEX[d.id]}" data-w="${getMastery(d.id)}"></div></div>
 <div class="dk-mastery"><span>Mastery</span><span>${getMastery(d.id) > 0 ? getMastery(d.id)+'%' : '—'}</span></div>
 </div>`;
 }).join('');
 setTimeout(()=>document.querySelectorAll('.dk-pb').forEach(b=>b.style.width=b.dataset.w+'%'),100);
}

function populateNewDeckSelect(){
 const sel = document.getElementById('newDeck');
 if(!sel) return;
 sel.innerHTML = DECKS.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}

function populateColorPicker(){
 const cp = document.getElementById('colorPicker');
 if(!cp || cp.children.length > 0) return; // already populated
 cp.innerHTML = THEMES.map((t,i) => `
 <div class="color-swatch${i===0?' active':''}" data-color="${t.accent}"
 style="background:${t.accent}" title="${t.label}"
 onclick="pickColor(this)"></div>`).join('');
 selectedSwatchColor = THEMES[0].accent;
}

function openForm(type){
 // Close both first
 document.getElementById('addCardForm').classList.remove('open');
 document.getElementById('addSubjectForm').classList.remove('open');
 if(type === 'card'){
 populateNewDeckSelect();
 document.getElementById('addCardForm').classList.add('open');
 setTimeout(()=>document.getElementById('newQ').focus(), 50);
 } else {
 populateColorPicker();
 document.getElementById('addSubjectForm').classList.add('open');
 setTimeout(()=>document.getElementById('newSubjName').focus(), 50);
 }
}

function closeForm(type){
 if(type === 'card') document.getElementById('addCardForm').classList.remove('open');
 if(type === 'subject') document.getElementById('addSubjectForm').classList.remove('open');
}

// Keep toggleAddForm as alias so any other references don't break
function toggleAddForm(){ openForm('card'); }

function pickColor(el){
 document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
 el.classList.add('active');
 selectedSwatchColor = el.dataset.color;
}

function addCard(){
 const deckId = document.getElementById('newDeck').value;
 const q = document.getElementById('newQ').value.trim();
 const a = document.getElementById('newA').value.trim();
 if(!q || !a){ toast(' Fill in both question and answer.'); return; }
 const deck = DECKS.find(d => d.id === deckId);
 const tag = deck ? deck.name.split(' ').slice(0,2).join(' ') : deckId;
 if(!extraCards[deckId]) extraCards[deckId] = [];
 extraCards[deckId].push({q, a, t: tag});
 // Reset stack so new card is included in next set
 if(deckStacks[deckId]) deckStacks[deckId] = [];
 document.getElementById('newQ').value = '';
 document.getElementById('newA').value = '';
 closeForm('card');
 renderDecks();
 toast(`Card added to ${deck ? deck.name : deckId} ✅`);
 gainXP(10);
}

function addNewSubject(){
 const name = document.getElementById('newSubjName').value.trim();
 const icon = document.getElementById('newSubjIcon').value.trim() || '📖';
 const color = selectedSwatchColor;
 if(!name){ toast(' Enter a subject name.'); return; }

 const id = name.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8) + Date.now().toString().slice(-4);
 if(DECKS.find(d => d.name.toLowerCase() === name.toLowerCase())){
 toast(' A subject with that name already exists.'); return;
 }

 // Add to DECKS
 DECKS.push({id, name, icon, color, mastery:0, due:0});
 extraCards[id] = [];
 BASE_CARDS[id] = [];
 deckStacks[id] = [];
 deckStats[id] = {seen:0, correct:0, quizCorrect:0, quizTotal:0, fcSets:0, quizSets:0};
 DCOLORS[id] = color;
 DHEX[id] = color;

 // Clear form
 document.getElementById('newSubjName').value = '';
 document.getElementById('newSubjIcon').value = '';
 closeForm('subject');
 renderDecks();
 renderDashboard();
 toast(`Subject "${name}" created! ✅`);
}

// ════════════════════════════════════════════
// QUIZ (30 shuffled items)
// ════════════════════════════════════════════
function renderQuizSetup(){
 document.getElementById('quizSetup').style.display='';
 document.getElementById('quizArena').style.display='none';
 document.getElementById('quizResult').style.display='none';
 document.getElementById('quizDeckPicker').innerHTML=DECKS.map(d=>`<div class="qopt${d.id===quizDeckId?' sel':''}" onclick="selQuizDeck('${d.id}',this)"><div class="qopt-title">${d.name}</div><div class="qopt-desc">${(BASE_CARDS[d.id]||[]).length+(extraCards[d.id]||[]).length} cards</div></div>`).join('');
}
function selQuizDeck(id,el){
 quizDeckId=id;
 document.querySelectorAll('.qopt').forEach(o=>o.classList.remove('sel'));
 el.classList.add('sel');
}
function startQuiz(){
 quizData=buildQuizPool(quizDeckId);// 20 from 150-card stack
 quizIdx=0;quizScore=0;
 document.getElementById('quizSetup').style.display='none';
 document.getElementById('quizArena').style.display='block';
 document.getElementById('quizResult').style.display='none';
 showQuizQ();
}
function showQuizQ(){
 if(quizIdx>=quizData.length){endQuiz();return;}
 const c=quizData[quizIdx];
 const deck=DECKS.find(d=>d.id===quizDeckId);
 document.getElementById('quizDeckLbl').textContent=deck.name;
 document.getElementById('quizCounterLbl').textContent=`Q ${quizIdx+1}/${quizData.length}`;
 document.getElementById('quizBar').style.width=(quizIdx/quizData.length*100)+'%';
 document.getElementById('quizQ').textContent=c.q;
 document.getElementById('quizExp').style.display='none';
 document.getElementById('quizNextBtn').style.display='none';
 quizAnswered=false;

 const container=document.getElementById('quizChoices');
 container.innerHTML='';

 const wrong=[...quizData,...quizStack].filter(x=>x.a&&x.a!==c.a).sort(()=>Math.random()-0.5).slice(0,3).map(x=>x.a);
 const choices=shuffle([...wrong,c.a]);
 const correctAnswer=c.a;

 choices.forEach(ch=>{
 const btn=document.createElement('button');
 btn.className='qchoice';
 btn.textContent=ch;
 btn.addEventListener('click',function(){answerQ(this,ch,correctAnswer);});
 container.appendChild(btn);
 });
}
function answerQ(btn,chosen,correct){
 if(quizAnswered)return;
 quizAnswered=true;
 const ok=chosen.trim()===correct.trim();
 btn.classList.add(ok?'correct':'wrong');
 document.querySelectorAll('.qchoice').forEach(b=>{
 b.disabled=true;
 if(b.textContent.trim()===correct.trim()) b.classList.add('correct');
 });
 if(ok){quizScore++;gainXP(10);streak++;toast('Correct! ');}
 else{ if(streak>0) streak--; toast('Not quite — see the correct answer above.'); }
 const exp=document.getElementById('quizExp');
 exp.textContent=ok?'✅ Correct! Well done.':'❌ Correct answer: '+correct;
 exp.style.display='block';
 document.getElementById('quizNextBtn').style.display='flex';
}
function nextQuizQ(){quizIdx++;showQuizQ();}
function endQuiz(){
 document.getElementById('quizArena').style.display='none';
 document.getElementById('quizResult').style.display='block';
 const pct=Math.round(quizScore/quizData.length*100);
 const em=pct>=90?'🏆':pct>=70?'👍':pct>=50?'📚':'💪';
 document.getElementById('resultPct').textContent=pct+'% '+em;
 document.getElementById('resultLbl').textContent=`${quizScore}/${quizData.length} correct — ${pct>=90?'Outstanding!':pct>=70?'Great job!':pct>=50?'Keep studying!':'More review needed'}`;
 document.getElementById('resultBreakdown').innerHTML=`
 <div class="rb-item"><div class="rb-num" style="color:var(--green)">${quizScore}</div><div class="rb-lbl">Correct</div></div>
 <div class="rb-item"><div class="rb-num" style="color:var(--coral)">${quizData.length-quizScore}</div><div class="rb-lbl">Wrong</div></div>
 <div class="rb-item"><div class="rb-num" style="color:var(--accent2)">${pct}%</div><div class="rb-lbl">Score</div></div>`;
 // Track live stats
 initDeckStats();
 quizSetsCompleted++;
 deckStats[quizDeckId].quizSets++;
 deckStats[quizDeckId].quizTotal += quizData.length;
 deckStats[quizDeckId].quizCorrect += quizScore;
 totalAnswered += quizData.length;
 totalCorrect += quizScore;
 totalMastered += quizScore;
 if(streak > bestStreak) bestStreak = streak;
 const d=DECKS.find(x=>x.id===quizDeckId);
 updateLiveStats();
 gainXP(Math.round(quizScore/quizData.length*50));
 toast(`Quiz done! ${quizScore}/${quizData.length} correct `);
 const remaining=deckStacks[quizDeckId]?deckStacks[quizDeckId].length:0;
 const stackInfo=remaining>0
 ? `${remaining} cards remaining · Next set pulls ${Math.min(SET_SIZE,remaining)} fresh questions`
 : `All 150 cards seen! Next set will reshuffle.`;
 const infoEl=document.getElementById('quizStackInfo');
 if(infoEl) infoEl.textContent=stackInfo;
}


// ════════════════════════════════════════════
// XP / STATS
// ════════════════════════════════════════════
function gainXP(amt){ xp+=amt; }

// ════════════════════════════════════════════
// LIVE STATS TRACKING
// ════════════════════════════════════════════
let totalMastered=0, totalAnswered=0, totalCorrect=0;

function updateLiveStats(){
 const pct = totalAnswered > 0 ? Math.round(totalCorrect/totalAnswered*100) : 0;
 const upd = (id, v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
 upd('metMastered', totalCorrect);
 upd('metRetention', totalAnswered > 0 ? pct+'%' : '0%');
 upd('streakNum', streak);
 upd('dashStreak', ''+streak);
 upd('studyTimeMet', studyMins+'m');
 // Refresh mastery bars with live data
 const bars = document.getElementById('masteryBars');
 if(bars) renderDashboard();
}

// ════════════════════════════════════════════
// RESET
// ════════════════════════════════════════════
function showResetConfirm(){ document.getElementById('resetConfirm').style.display='flex'; }
function hideResetConfirm(){ document.getElementById('resetConfirm').style.display='none'; }
function doReset(){
 // Delegate to full progress reset
 doProgressReset();
 hideResetConfirm();
}

// ════════════════════════════════════════════
// PROGRESS TRACKING DATA
// ════════════════════════════════════════════
// Per-deck stats: { seen, correct, quizSets, quizCorrect, quizTotal, fcSets }
let deckStats = {};
let bestStreak = 0;
let quizSetsCompleted = 0;
let fcSetsCompleted = 0;

function initDeckStats(){
 DECKS.forEach(d => {
 if(!deckStats[d.id]) deckStats[d.id] = {seen:0, correct:0, quizCorrect:0, quizTotal:0, fcSets:0, quizSets:0};
 });
 updateDueBadge();
}

function updateDueBadge(){
 // Count total unseen cards across all decks
 let totalCards = 0;
 let seenCards = 0;
 DECKS.forEach(d => {
 const base = (BASE_CARDS[d.id]||[]).length + (extraCards[d.id]||[]).length;
 const seen = deckStats[d.id] ? deckStats[d.id].seen : 0;
 totalCards += base;
 seenCards += Math.min(seen, base);
 });
 const due = Math.max(0, totalCards - seenCards);
 const badge = document.getElementById('dueCount');
 if(badge){
 if(due > 0){
 badge.textContent = due > 99 ? '99+' : due;
 badge.style.display = '';
 } else {
 badge.style.display = 'none';
 }
 }
}

// ════════════════════════════════════════════
// PROGRESS PAGE
// ════════════════════════════════════════════
function renderProgress(){
 initDeckStats();

 // Update best streak
 if(streak > bestStreak) bestStreak = streak;

 // Summary metrics
 const el = id => document.getElementById(id);
 if(el('progTotalCards')) el('progTotalCards').textContent = totalAnswered;
 if(el('progDeckCount')) el('progDeckCount').textContent = `across ${DECKS.length} subjects`;
 if(el('progMastered')) el('progMastered').textContent = totalCorrect;
 const pct = totalAnswered > 0 ? Math.round(totalCorrect/totalAnswered*100) : 0;
 if(el('progMasteredPct')) el('progMasteredPct').textContent = totalAnswered > 0 ? `${pct}% accuracy` : 'Start studying!';
 if(el('progStreak')) el('progStreak').textContent = streak + ' 🔥';
 if(el('progBestStreak')) el('progBestStreak').textContent = `Best: ${bestStreak}`;
 if(el('progHours')) el('progHours').textContent = studyMins >= 60 ? `${Math.floor(studyMins/60)}h ${studyMins%60}m` : `${studyMins}m`;

 // Quiz activity breakdown
 const quizEl = el('quizActivity');
 if(quizEl){
 if(quizSetsCompleted === 0){
 quizEl.innerHTML = '<span style="color:var(--muted)">No quizzes taken yet. Head to Quiz Mode to get started!</span>';
 } else {
 const qRows = DECKS.filter(d => deckStats[d.id]?.quizSets > 0).map(d => {
 const s = deckStats[d.id];
 const acc = s.quizTotal > 0 ? Math.round(s.quizCorrect/s.quizTotal*100) : 0;
 const bar = `<div style="height:5px;background:var(--card2);border-radius:3px;margin-top:4px"><div style="height:100%;width:${acc}%;background:var(--accent);border-radius:3px"></div></div>`;
 return `<div style="margin-bottom:0.7rem">
 <div style="display:flex;justify-content:space-between;font-size:0.82rem">
 <span>${d.name}</span>
 <span style="color:var(--accent2);font-weight:600">${acc}% · ${s.quizSets} set${s.quizSets!==1?'s':''}</span>
 </div>${bar}</div>`;
 }).join('');
 quizEl.innerHTML = `<div style="font-size:0.78rem;color:var(--muted);margin-bottom:0.75rem">${quizSetsCompleted} quiz set${quizSetsCompleted!==1?'s':''} completed · ${totalAnswered} questions answered</div>` + (qRows || '<span style="color:var(--muted)">Keep going!</span>');
 }
 }

 // Flashcard activity breakdown
 const fcEl = el('fcActivity');
 if(fcEl){
 if(fcSetsCompleted === 0){
 fcEl.innerHTML = '<span style="color:var(--muted)">No flashcard sets reviewed yet. Open Flashcards to begin!</span>';
 } else {
 const fcRows = DECKS.filter(d => deckStats[d.id]?.fcSets > 0).map(d => {
 const s = deckStats[d.id];
 const acc = s.seen > 0 ? Math.round(s.correct/s.seen*100) : 0;
 const bar = `<div style="height:5px;background:var(--card2);border-radius:3px;margin-top:4px"><div style="height:100%;width:${acc}%;background:var(--green);border-radius:3px"></div></div>`;
 return `<div style="margin-bottom:0.7rem">
 <div style="display:flex;justify-content:space-between;font-size:0.82rem">
 <span>${d.name}</span>
 <span style="color:var(--green);font-weight:600">${acc}% · ${s.fcSets} set${s.fcSets!==1?'s':''}</span>
 </div>${bar}</div>`;
 }).join('');
 fcEl.innerHTML = `<div style="font-size:0.78rem;color:var(--muted);margin-bottom:0.75rem">${fcSetsCompleted} flashcard set${fcSetsCompleted!==1?'s':''} completed · ${totalCorrect} got it</div>` + (fcRows || '<span style="color:var(--muted)">Keep going!</span>');
 }
 }

 // Retention bars by subject
 const rb = el('retentionBars');
 if(rb){
 rb.innerHTML = DECKS.map(d => {
 const s = deckStats[d.id] || {seen:0,correct:0,quizCorrect:0,quizTotal:0};
 const totalSeen = s.seen + s.quizTotal;
 const totalRight = s.correct + s.quizCorrect;
 const ret = totalSeen > 0 ? Math.round(totalRight/totalSeen*100) : 0;
 const color = ret >= 80 ? 'var(--green)' : ret >= 50 ? 'var(--accent)' : ret > 0 ? 'var(--amber)' : 'var(--card2)';
 return `<div style="margin-bottom:0.85rem">
 <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
 <span style="font-size:0.85rem;font-weight:500">${d.name}</span>
 <span style="font-size:0.8rem;font-weight:600;color:${color}">${totalSeen > 0 ? ret+'%' : 'Not started'}</span>
 </div>
 <div style="height:8px;background:var(--card2);border-radius:4px;overflow:hidden">
 <div style="height:100%;width:${ret}%;background:${color};border-radius:4px;transition:width 0.6s ease"></div>
 </div>
 <div style="font-size:0.72rem;color:var(--muted);margin-top:3px">${totalSeen} cards reviewed · ${totalRight} correct</div>
 </div>`;
 }).join('');
 }

 // Milestones
 const milestoneList = [
 {icon:'', title:'First Quiz', desc:'Complete your first quiz set', done: quizSetsCompleted >= 1},
 {icon:'', title:'Card Flipper', desc:'Review your first flashcard set', done: fcSetsCompleted >= 1},
 {icon:'🔥', title:'On Fire', desc:'Get a 5-answer streak', done: bestStreak >= 5},
 {icon:'', title:'Speed Learner', desc:'Answer 50 questions correctly', done: totalCorrect >= 50},
 {icon:'💯', title:'Perfect Set', desc:'Score 100% on a quiz', done: DECKS.some(d => deckStats[d.id]?.quizTotal > 0 && deckStats[d.id]?.quizCorrect === deckStats[d.id]?.quizTotal && deckStats[d.id]?.quizTotal >= 10)},
 {icon:'📚', title:'Scholar', desc:'Answer 100 questions correctly', done: totalCorrect >= 100},
 {icon:'🏆', title:'Champion', desc:'Answer 200 questions correctly', done: totalCorrect >= 200},
 {icon:'', title:'Focused', desc:'Complete a focus timer session', done: studyMins > 0},
 {icon:'🧠', title:'All Subjects', desc:'Study at least one set in every subject',done: DECKS.every(d => (deckStats[d.id]?.seen||0)+(deckStats[d.id]?.quizTotal||0) > 0)},
 {icon:'🌟', title:'Consistent', desc:'Reach a 10-question streak', done: bestStreak >= 10},
 ];
 const ms = el('milestones');
 if(ms){
 ms.innerHTML = milestoneList.map(m => `
 <div style="display:flex;align-items:center;gap:10px;padding:0.7rem 0.85rem;background:var(--card2);border-radius:10px;border:1px solid var(--border);opacity:${m.done?'1':'0.45'}">
 <span style="font-size:1.5rem">${m.icon}</span>
 <div>
 <div style="font-size:0.82rem;font-weight:600${m.done?';color:var(--accent2)':''}">${m.title} ${m.done?'✓':''}</div>
 <div style="font-size:0.72rem;color:var(--muted)">${m.desc}</div>
 </div>
 </div>`).join('');
 }
}

// ════════════════════════════════════════════
// PROGRESS RESET
// ════════════════════════════════════════════
function showProgressResetConfirm(){
 const el = document.getElementById('progressResetConfirm');
 if(el) el.style.display = 'flex';
}
function hideProgressResetConfirm(){
 const el = document.getElementById('progressResetConfirm');
 if(el) el.style.display = 'none';
}
function doProgressReset(){
 // Reset all tracking variables
 totalMastered = 0; totalAnswered = 0; totalCorrect = 0;
 streak = 0; bestStreak = 0; studyMins = 0;
 quizSetsCompleted = 0; fcSetsCompleted = 0;
 deckStats = {};
 initDeckStats();
 // Reset deck mastery
 DECKS.forEach(d => { d.mastery = 0; d.due = 0; });
 // Reset deck stacks so cards re-shuffle fresh
 Object.keys(deckStacks).forEach(k => { deckStacks[k] = []; });
 // Update dashboard display
 const upd = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
 upd('streakNum', '0'); upd('dashStreak', '0');
 upd('studyTimeMet', '0m'); upd('metMastered', '0'); upd('metRetention', '0%');
 hideProgressResetConfirm();
 renderDashboard();
 renderProgress();
 toast('Progress reset! Fresh start 🔄');
}

// ════════════════════════════════════════════
// NOTES PAGE
// ════════════════════════════════════════════
function renderNotes(){
 const list=document.getElementById('noteList');
 if(!list) return;
 if(notes.length===0){
 list.innerHTML='<div style="color:var(--muted);font-size:0.88rem;padding:1rem 0;text-align:center">No notes yet. Click <strong>+ Add Note</strong> to create one.</div>';
 return;
 }
 list.innerHTML=notes.map(n=>`
 <div class="card" style="margin-bottom:0.75rem;cursor:pointer;border:1px solid var(--border);transition:border-color 0.2s" onclick="openNote(${n.id})" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
 <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
 <div style="flex:1;min-width:0">
 <div style="font-weight:700;font-size:0.9rem;margin-bottom:0.3rem;font-family:'Fraunces',serif">${n.title||'Untitled'}</div>
 <div style="font-size:0.8rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.body?n.body.slice(0,100)+'…':'(empty note)'}</div>
 </div>
 <div style="font-size:0.7rem;color:var(--muted);flex-shrink:0">✏ Edit</div>
 </div>
 </div>`).join('');
}
function showAddNoteForm(){
 activeNoteId=null;
 document.getElementById('noteTitleIn').value='';
 document.getElementById('noteBodyIn').value='';
 const label=document.getElementById('noteEditorTitle');
 if(label) label.textContent='New Note';
 setTimeout(()=>document.getElementById('noteTitleIn').focus(),50);
}
function clearNoteForm(){
 activeNoteId=null;
 document.getElementById('noteTitleIn').value='';
 document.getElementById('noteBodyIn').value='';
 const label=document.getElementById('noteEditorTitle');
 if(label) label.textContent='New Note';
}
function closeNote(){ clearNoteForm(); }
function openNote(id){
 const n=notes.find(x=>x.id===id);
 if(!n) return;
 activeNoteId=id;
 document.getElementById('noteTitleIn').value=n.title||'';
 document.getElementById('noteBodyIn').value=n.body||'';
 const label=document.getElementById('noteEditorTitle');
 if(label) label.textContent='✏ Editing: '+(n.title||'Untitled');
 document.getElementById('noteTitleIn').focus();
 window.scrollTo({top:0,behavior:'smooth'});
}
function saveNote(){
 const title=document.getElementById('noteTitleIn').value.trim()||'Untitled';
 const body=document.getElementById('noteBodyIn').value;
 if(activeNoteId===null){
 // New note
 const id=Date.now();
 notes.unshift({id,title,body});
 } else {
 const n=notes.find(x=>x.id===activeNoteId);
 if(n){ n.title=title; n.body=body; }
 }
 renderNotes();
 toast('Note saved ✅');
}
function closeNote(){
 document.getElementById('noteEditor').style.display='none';
 activeNoteId=null;
}
function newNote(){ showAddNoteForm(); }
function deleteNote(){
 if(activeNoteId===null){
 closeNote();
 return;
 }
 notes=notes.filter(x=>x.id!==activeNoteId);
 activeNoteId=null;
 closeNote();
 renderNotes();
 toast('Note deleted 🗑');
}

// ════════════════════════════════════════════
// SETTINGS PAGE
// ════════════════════════════════════════════
// ════════════════════════════════════════════
// SETTINGS PAGE
// ════════════════════════════════════════════
const THEMES=[
 // Purples
 {id:'violet', label:'Violet', accent:'#7c6af5', accent2:'#a593ff', accentDark:'#4a38c4', rgb:'124,106,245', rgbDark:'74,56,196'},
 {id:'purple', label:'Purple', accent:'#a855f7', accent2:'#c084fc', accentDark:'#7e22ce', rgb:'168,85,247', rgbDark:'126,34,206'},
 {id:'indigo', label:'Indigo', accent:'#6366f1', accent2:'#818cf8', accentDark:'#3730a3', rgb:'99,102,241', rgbDark:'55,48,163'},
 {id:'deeppur', label:'Deep Purple', accent:'#7c3aed', accent2:'#9f67ff', accentDark:'#5b21b6', rgb:'124,58,237', rgbDark:'91,33,182'},
 {id:'grape', label:'Grape', accent:'#9333ea', accent2:'#b96df7', accentDark:'#6b21a8', rgb:'147,51,234', rgbDark:'107,33,168'},
 // Blues
 {id:'blue', label:'Blue', accent:'#3b82f6', accent2:'#60a5fa', accentDark:'#1d4ed8', rgb:'59,130,246', rgbDark:'29,78,216'},
 {id:'sky', label:'Sky', accent:'#00b4d8', accent2:'#67e8f9', accentDark:'#0072a3', rgb:'0,180,216', rgbDark:'0,114,163'},
 {id:'cyan', label:'Cyan', accent:'#06b6d4', accent2:'#22d3ee', accentDark:'#0891b2', rgb:'6,182,212', rgbDark:'8,145,178'},
 {id:'navy', label:'Navy', accent:'#2563eb', accent2:'#60a5fa', accentDark:'#1e3a8a', rgb:'37,99,235', rgbDark:'30,58,138'},
 {id:'cobalt', label:'Cobalt', accent:'#0284c7', accent2:'#38bdf8', accentDark:'#075985', rgb:'2,132,199', rgbDark:'7,89,133'},
 // Teals & Greens
 {id:'teal', label:'Teal', accent:'#3ecfb2', accent2:'#5eead4', accentDark:'#0a9e88', rgb:'62,207,178', rgbDark:'10,158,136'},
 {id:'emerald', label:'Emerald', accent:'#10b981', accent2:'#34d399', accentDark:'#047857', rgb:'16,185,129', rgbDark:'4,120,87'},
 {id:'green', label:'Green', accent:'#55d48b', accent2:'#86efac', accentDark:'#1e7a44', rgb:'85,212,139', rgbDark:'30,122,68'},
 {id:'lime', label:'Lime', accent:'#84cc16', accent2:'#bef264', accentDark:'#4d7c0f', rgb:'132,204,22', rgbDark:'77,124,15'},
 {id:'forest', label:'Forest', accent:'#16a34a', accent2:'#4ade80', accentDark:'#14532d', rgb:'22,163,74', rgbDark:'20,83,45'},
 {id:'mint', label:'Mint', accent:'#14b8a6', accent2:'#2dd4bf', accentDark:'#0f766e', rgb:'20,184,166', rgbDark:'15,118,110'},
 {id:'sage', label:'Sage', accent:'#059669', accent2:'#34d399', accentDark:'#065f46', rgb:'5,150,105', rgbDark:'6,95,70'},
 // Yellows & Oranges
 {id:'amber', label:'Amber', accent:'#f5c542', accent2:'#fde68a', accentDark:'#a06800', rgb:'245,197,66', rgbDark:'160,104,0'},
 {id:'yellow', label:'Yellow', accent:'#facc15', accent2:'#fde047', accentDark:'#a16207', rgb:'250,204,21', rgbDark:'161,98,7'},
 {id:'gold', label:'Gold', accent:'#ca8a04', accent2:'#fcd34d', accentDark:'#92400e', rgb:'202,138,4', rgbDark:'146,64,14'},
 {id:'orange', label:'Orange', accent:'#f97316', accent2:'#fdba74', accentDark:'#c2410c', rgb:'249,115,22', rgbDark:'194,65,12'},
 {id:'peach', label:'Peach', accent:'#fb923c', accent2:'#fdc08a', accentDark:'#ea580c', rgb:'251,146,60', rgbDark:'234,88,12'},
 {id:'saffron', label:'Saffron', accent:'#f59e0b', accent2:'#fcd34d', accentDark:'#b45309', rgb:'245,158,11', rgbDark:'180,83,9'},
 // Reds & Pinks
 {id:'coral', label:'Coral', accent:'#ff7e6b', accent2:'#fca5a5', accentDark:'#c94030', rgb:'255,126,107', rgbDark:'201,64,48'},
 {id:'red', label:'Red', accent:'#ef4444', accent2:'#f87171', accentDark:'#b91c1c', rgb:'239,68,68', rgbDark:'185,28,28'},
 {id:'rose', label:'Rose', accent:'#f43f5e', accent2:'#fb7185', accentDark:'#be123c', rgb:'244,63,94', rgbDark:'190,18,60'},
 {id:'crimson', label:'Crimson', accent:'#e11d48', accent2:'#fb7185', accentDark:'#9f1239', rgb:'225,29,72', rgbDark:'159,18,57'},
 {id:'scarlet', label:'Scarlet', accent:'#dc2626', accent2:'#f87171', accentDark:'#991b1b', rgb:'220,38,38', rgbDark:'153,27,27'},
 {id:'pink', label:'Pink', accent:'#ec4899', accent2:'#f9a8d4', accentDark:'#9d174d', rgb:'236,72,153', rgbDark:'157,23,77'},
 {id:'hotpink', label:'Hot Pink', accent:'#e86bb0', accent2:'#f0abcb', accentDark:'#be185d', rgb:'232,107,176', rgbDark:'190,24,93'},
 {id:'fuchsia', label:'Fuchsia', accent:'#d946ef', accent2:'#e879f9', accentDark:'#a21caf', rgb:'217,70,239', rgbDark:'162,28,175'},
 {id:'magenta', label:'Magenta', accent:'#c026d3', accent2:'#e879f9', accentDark:'#86198f', rgb:'192,38,211', rgbDark:'134,25,143'},
 // Browns & Neutrals
 {id:'brown', label:'Brown', accent:'#92400e', accent2:'#d97706', accentDark:'#78350f', rgb:'146,64,14', rgbDark:'120,53,15'},
 {id:'mocha', label:'Mocha', accent:'#a16207', accent2:'#d97706', accentDark:'#713f12', rgb:'161,98,7', rgbDark:'113,63,18'},
 {id:'sienna', label:'Sienna', accent:'#b45309', accent2:'#f59e0b', accentDark:'#92400e', rgb:'180,83,9', rgbDark:'146,64,14'},
 {id:'stone', label:'Stone', accent:'#78716c', accent2:'#a8a29e', accentDark:'#44403c', rgb:'120,113,108', rgbDark:'68,64,60'},
 {id:'slate', label:'Slate', accent:'#64748b', accent2:'#94a3b8', accentDark:'#334155', rgb:'100,116,139', rgbDark:'51,65,85'},
 {id:'zinc', label:'Zinc', accent:'#71717a', accent2:'#a1a1aa', accentDark:'#3f3f46', rgb:'113,113,122', rgbDark:'63,63,70'},
 {id:'steel', label:'Steel', accent:'#475569', accent2:'#94a3b8', accentDark:'#1e293b', rgb:'71,85,105', rgbDark:'30,41,59'},
 // Special
 {id:'white', label:'White', accent:'#e8e8f0', accent2:'#ffffff', accentDark:'#9999aa', rgb:'232,232,240', rgbDark:'153,153,170'},
 {id:'silver', label:'Silver', accent:'#94a3b8', accent2:'#cbd5e1', accentDark:'#475569', rgb:'148,163,184', rgbDark:'71,85,105'},
 {id:'charcoal', label:'Charcoal', accent:'#374151', accent2:'#6b7280', accentDark:'#111827', rgb:'55,65,81', rgbDark:'17,24,39'},
 {id:'black', label:'Black', accent:'#1f2937', accent2:'#4b5563', accentDark:'#030712', rgb:'31,41,55', rgbDark:'3,7,18'},
 // Extra vibrant
 {id:'neon', label:'Neon Green', accent:'#39ff14', accent2:'#86efac', accentDark:'#15803d', rgb:'57,255,20', rgbDark:'21,128,61'},
 {id:'electric', label:'Electric', accent:'#00f5ff', accent2:'#67e8f9', accentDark:'#0891b2', rgb:'0,245,255', rgbDark:'8,145,178'},
 {id:'lava', label:'Lava', accent:'#ff4500', accent2:'#fdba74', accentDark:'#c2410c', rgb:'255,69,0', rgbDark:'194,65,12'},
 {id:'aqua', label:'Aqua', accent:'#00ffcc', accent2:'#5eead4', accentDark:'#0f766e', rgb:'0,255,204', rgbDark:'15,118,110'},
 {id:'lavender', label:'Lavender', accent:'#c4b5fd', accent2:'#ddd6fe', accentDark:'#7c3aed', rgb:'196,181,253', rgbDark:'124,58,237'},
 {id:'champagne',label:'Champagne', accent:'#f0e6c8', accent2:'#fef3c7', accentDark:'#a16207', rgb:'240,230,200', rgbDark:'161,98,7'},
 {id:'sapphire', label:'Sapphire', accent:'#0f52ba', accent2:'#3b82f6', accentDark:'#1e3a8a', rgb:'15,82,186', rgbDark:'30,58,138'},
 {id:'ruby', label:'Ruby', accent:'#9b111e', accent2:'#f87171', accentDark:'#7f1d1d', rgb:'155,17,30', rgbDark:'127,29,29'},
];

function renderSettings(){
 // Sync toggles with prefs
 syncToggle('togHeatmap','togHeatmapS','togHeatmapK', prefs.heatmap);
 syncToggle('togChart', 'togChartS', 'togChartK', prefs.chart);



 // Appearance mode buttons — always re-render to reflect currentMode
 const modeEl=document.getElementById('modeGrid');
 if(modeEl){
 modeEl.innerHTML=`
 <button class="btn btn-sm${currentMode==='light'?' btn-a':' btn-o'}" onclick="setMode_('light',this)">Light</button>
 <button class="btn btn-sm${currentMode==='dark'?' btn-a':' btn-o'}" onclick="setMode_('dark',this)">Dark</button>
 <button class="btn btn-sm${currentMode==='ocean'?' btn-a':' btn-o'}" onclick="setMode_('ocean',this)">Ocean</button>
 <button class="btn btn-sm${currentMode==='forest'?' btn-a':' btn-o'}" onclick="setMode_('forest',this)">Forest</button>
 <button class="btn btn-sm${currentMode==='sunset'?' btn-a':' btn-o'}" onclick="setMode_('sunset',this)">Sunset</button>`;
 }
}

function syncToggle(inputId, trackId, knobId, state){
 const inp=document.getElementById(inputId);
 const track=document.getElementById(trackId);
 const knob=document.getElementById(knobId);
 if(inp) inp.checked=state;
 if(track) track.style.background=state?'var(--accent)':'var(--card2)';
 if(knob) knob.style.transform=state?'translateX(18px)':'translateX(0)';
}

function savePref(key, val){
 prefs[key]=val;
 syncToggle(
 key==='heatmap'?'togHeatmap':'togChart',
 key==='heatmap'?'togHeatmapS':'togChartS',
 key==='heatmap'?'togHeatmapK':'togChartK',
 val
 );
 renderDashboard();
}

function applyTheme(id){
 currentTheme = id;
 const t = THEMES.find(x => x.id === id);
 if(!t) return;
 const isLight = document.body.classList.contains('theme-light');
 // Light mode: use darker accent for readability on white bg
 // Dark/Ocean/Forest/Sunset: use bright accent for visibility on dark bg
 const accent = isLight ? t.accentDark : t.accent;
 const accent2 = isLight ? t.accent : t.accent2;
 const accentRGB = isLight ? t.rgbDark : t.rgb;
 document.documentElement.style.setProperty('--accent', accent);
 document.documentElement.style.setProperty('--accent2', accent2);
 document.documentElement.style.setProperty('--accentRGB', accentRGB);
 // Also update nav active border and btn-a dynamically
 renderSettings();
 toast(`🎨 ${t.label}`);
}

function changeTheme(theme){ applyTheme(theme); }

function setMode_(mode, btn){
 currentMode = mode;
 const allThemeClasses = ['theme-light','theme-dark','theme-ocean','theme-forest','theme-sunset'];
 allThemeClasses.forEach(c => document.body.classList.remove(c));
 // Only remove bg/card/text vars — NOT accent vars
 const vars = ['--bg','--bg2','--card','--card2','--text','--muted','--border','--border2','--teal','--coral','--amber','--green','--pink','--nav-bg','--nav-text','--nav-border','--qchoice-bg','--input-bg'];
 vars.forEach(v => document.documentElement.style.removeProperty(v));
 const classMap = {light:'theme-light', dark:'theme-dark', ocean:'theme-ocean', forest:'theme-forest', sunset:'theme-sunset'};
 if(classMap[mode]) document.body.classList.add(classMap[mode]);
 // Re-apply current accent with correct light/dark variant after mode change
 if(currentTheme && currentTheme !== 'default'){
 const t = THEMES.find(x => x.id === currentTheme);
 if(t){
 const isLight = mode === 'light';
 document.documentElement.style.setProperty('--accent', isLight ? t.accentDark : t.accent);
 document.documentElement.style.setProperty('--accent2', isLight ? t.accent : t.accent2);
 document.documentElement.style.setProperty('--accentRGB', isLight ? t.rgbDark : t.rgb);
 }
 }
 renderSettings();
 const labels = {light:'Light mode', dark:'Dark mode', ocean:'Ocean theme', forest:'Forest theme', sunset:'Sunset theme'};
 toast(labels[mode] || `🎨 ${mode} theme`);
}
const _origShowPage = typeof showPage === 'function' ? showPage : null;
function showPage(id, el){
 const hero = document.getElementById('heroSection');
 const featureBand = document.querySelector('.feature-band');
 const ctaBand = document.querySelector('.cta-band');
 const iconGrid = document.querySelector('.icon-grid-section');
 const appContent = document.querySelector('.app-content');
 const isHome = id === 'dashboard';

 // Landing sections only visible on Home
 [hero, featureBand, ctaBand, iconGrid].forEach(s => {
 if(s) s.style.display = isHome ? '' : 'none';
 });

 // App content area: hide on home, show on all other pages
 if(appContent) appContent.style.display = isHome ? 'none' : 'block';

 // Nav active state
 document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
 if(el && el.classList) el.classList.add('active');

 // Only switch pages when NOT home
 if(!isHome){
 document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
 const pg = document.getElementById('page-' + id);
 if(pg) pg.classList.add('active');
 }

 const tt = document.getElementById('topbarTitle');
 if(tt){ const T={dashboard:'Home',flashcards:'Flashcards',decks:'My Decks',quiz:'Quiz Mode',timer:'Focus Timer',progress:'Progress',notes:'Quick Notes',settings:'Settings'}; tt.textContent=T[id]||id; }

 // Page-specific renderers
 if(id==='flashcards') initFC();
 if(id==='decks') renderDecks();
 if(id==='quiz') renderQuizSetup();
 if(id==='progress') renderProgress();
 if(id==='notes') renderNotes();
 if(id==='settings') renderSettings();

 // Always scroll to top so page headers and buttons are fully visible
 window.scrollTo({top:0, behavior:'smooth'});
}

function navTo(id){
 const items = document.querySelectorAll('.nav-item');
 let target = null;
 items.forEach(it => {
 if(it.getAttribute('onclick') && it.getAttribute('onclick').includes("'"+id+"'")) target = it;
 });
 showPage(id, target);
 // Always scroll to very top so page header + buttons are visible
 window.scrollTo({top:0, behavior:'smooth'});
}

renderDashboard();
updateTimer();
initDeckStats();
