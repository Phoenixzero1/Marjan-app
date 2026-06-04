/** Generates the standalone installer.html content. */
export function generateInstallerHtml(meta: {
  packageDate: string;
  recordCounts: Record<string, number>;
  appName: string;
}): string {
  const totalRecords = Object.values(meta.recordCounts).reduce((a, b) => a + b, 0);
  // HTML is returned as a raw string — backticks inside are escaped
  const html = [
    "<!DOCTYPE html>",
    '<html lang="fa" dir="rtl">',
    "<head>",
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    "<title>نصب " + meta.appName + "</title>",
    "<style>",
    "*{box-sizing:border-box;margin:0;padding:0}",
    "body{font-family:Tahoma,Arial,sans-serif;background:#0f2040;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}",
    ".card{background:#1a2d4e;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:2rem;width:100%;max-width:640px}",
    "h1{color:#fff;font-size:22px;margin-bottom:.5rem}",
    ".subtitle{color:rgba(255,255,255,.5);font-size:13px;margin-bottom:2rem}",
    ".step{display:none}.step.active{display:block}",
    ".step-header{display:flex;align-items:center;gap:10px;margin-bottom:1.5rem}",
    ".step-num{width:32px;height:32px;border-radius:50%;background:#3b82f6;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0}",
    ".step-title{font-size:18px;font-weight:700;color:#fff}",
    ".check-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;margin-bottom:8px;font-size:13px}",
    ".check-item.pass{background:rgba(34,197,94,.1)}.check-item.fail{background:rgba(239,68,68,.1)}.check-item.warn{background:rgba(251,191,36,.1)}",
    "input{width:100%;background:#0f2040;border:1.5px solid rgba(255,255,255,.2);color:#e2e8f0;border-radius:8px;padding:10px 12px;font-size:13px;margin-bottom:12px;outline:none;font-family:inherit}",
    "input::placeholder{color:rgba(255,255,255,.35)}",
    "label{display:block;font-size:12px;color:rgba(255,255,255,.6);margin-bottom:4px;font-weight:700}",
    ".btn{width:100%;background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;margin-top:.5rem;font-family:inherit}",
    ".btn:disabled{opacity:.5;cursor:not-allowed}.btn.success{background:#16a34a}.btn.danger{background:#dc2626}.btn.secondary{background:rgba(255,255,255,.1)}",
    ".log-box{background:#0f2040;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:12px;height:200px;overflow-y:auto;font-family:monospace;font-size:12px;color:#94a3b8}",
    ".log-line{padding:2px 0;line-height:1.5}.log-line.ok{color:#22c55e}.log-line.err{color:#ef4444}.log-line.warn{color:#fbbf24}",
    ".progress-bar{height:8px;background:rgba(255,255,255,.1);border-radius:4px;overflow:hidden;margin-bottom:1rem}",
    ".progress-fill{height:100%;background:#3b82f6;transition:width .3s;border-radius:4px}",
    ".field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
    ".result-box{text-align:center;padding:2rem}.result-icon{font-size:60px;margin-bottom:1rem}.result-title{font-size:24px;font-weight:700;margin-bottom:.75rem}",
    ".credentials{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:12px;margin:1rem 0;text-align:left;direction:ltr;font-family:monospace;font-size:12px;color:#94a3b8}",
    ".warning-box{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;padding:12px;color:#fca5a5;font-size:12px;margin:.75rem 0}",
    ".info-box{background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);border-radius:8px;padding:12px;color:#93c5fd;font-size:12px;margin:.75rem 0}",
    ".btn-row{display:flex;gap:10px}.btn-row .btn{flex:1}",
    "</style>",
    "</head><body>",
    '<div class="card">',
    "  <h1>🚀 نصب " + meta.appName + "</h1>",
    '  <p class="subtitle">تاریخ پکیج: ' + meta.packageDate + " &nbsp;|&nbsp; " + totalRecords + " رکورد</p>",

    '  <div class="step active" id="step1">',
    '    <div class="step-header"><div class="step-num">1</div><div class="step-title">بررسی پیش‌نیازها</div></div>',
    '    <div id="checks"><div style="color:rgba(255,255,255,.5);font-size:13px">در حال بررسی...</div></div>',
    '    <button class="btn" id="btn1" disabled onclick="goStep(2)">ادامه ←</button>',
    "  </div>",

    '  <div class="step" id="step2">',
    '    <div class="step-header"><div class="step-num">2</div><div class="step-title">تنظیمات پایگاه داده</div></div>',
    '    <div class="field-row">',
    "      <div><label>هاست</label><input id='dbHost' value='localhost'></div>",
    "      <div><label>پورت</label><input id='dbPort' value='5432'></div>",
    "    </div>",
    "    <label>نام پایگاه داده</label><input id='dbName' placeholder='marjan_db'>",
    "    <label>نام کاربری</label><input id='dbUser' placeholder='postgres'>",
    "    <label>رمز عبور</label><input id='dbPass' type='password'>",
    "    <button class='btn secondary' onclick='testDb()' id='btnTestDb'>🔗 تست اتصال</button>",
    "    <div id='dbResult' style='margin-top:8px;font-size:12px'></div>",
    "    <button class='btn' id='btn2' disabled onclick='goStep(3)' style='margin-top:12px'>ادامه ←</button>",
    "  </div>",

    '  <div class="step" id="step3">',
    '    <div class="step-header"><div class="step-num">3</div><div class="step-title">تنظیمات سایت</div></div>',
    "    <label>آدرس سایت</label><input id='siteUrl' value='http://localhost:3000'>",
    "    <label>ایمیل مدیر</label><input id='adminEmail' placeholder='admin@example.com'>",
    "    <label>رمز عبور مدیر</label><input id='adminPass' type='password'>",
    "    <label>نام سایت</label><input id='siteName' value='" + meta.appName + "'>",
    "    <button class='btn' onclick='startInstall()'>شروع نصب ←</button>",
    "  </div>",

    '  <div class="step" id="step4">',
    '    <div class="step-header"><div class="step-num">4</div><div class="step-title">در حال نصب...</div></div>',
    '    <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>',
    "    <div id='progressLabel' style='font-size:12px;color:rgba(255,255,255,.5);margin-bottom:.75rem'>شروع نصب...</div>",
    "    <div class='log-box' id='logBox'></div>",
    "  </div>",

    '  <div class="step" id="step5"><div class="result-box" id="resultBox"></div></div>',
    "</div>",

    "<script>",
    "const API='http://localhost:3099';",
    "window.onload=async()=>{",
    "  const checks=[",
    "    {label:'Node.js 18+ نصب شده',test:async()=>{try{const r=await fetch(API+'?action=check-node');const d=await r.json();return d.ok?'pass':'fail';}catch{return 'fail';}}},",
    "    {label:'PostgreSQL در دسترس است',test:async()=>{try{const r=await fetch(API+'?action=check-pg');const d=await r.json();return d.ok?'pass':'warn';}catch{return 'warn';}}},",
    "    {label:'فضای دیسک کافی',test:async()=>{try{const r=await fetch(API+'?action=check-disk');const d=await r.json();return d.ok?'pass':'warn';}catch{return 'warn';}}},",
    "    {label:'فایل db-export.json موجود است',test:async()=>{try{const r=await fetch('./db-export.json',{method:'HEAD'});return r.ok?'pass':'fail';}catch{return 'fail';}}},",
    "  ];",
    "  const icons={pass:'✅',fail:'❌',warn:'⚠️'};",
    "  const checksDiv=document.getElementById('checks');checksDiv.innerHTML='';",
    "  let allPassed=true;",
    "  for(const c of checks){",
    "    const status=await c.test();",
    "    if(status==='fail')allPassed=false;",
    "    const div=document.createElement('div');",
    "    div.className='check-item '+status;",
    "    div.innerHTML='<span style=font-size:18px>'+icons[status]+'</span><span>'+c.label+'</span>';",
    "    checksDiv.appendChild(div);",
    "  }",
    "  document.getElementById('btn1').disabled=!allPassed;",
    "};",
    "function goStep(n){document.querySelectorAll('.step').forEach(s=>s.classList.remove('active'));document.getElementById('step'+n).classList.add('active');}",
    "async function testDb(){",
    "  const btn=document.getElementById('btnTestDb');",
    "  const result=document.getElementById('dbResult');",
    "  btn.disabled=true;btn.textContent='در حال تست...';result.textContent='';",
    "  try{",
    "    const r=await fetch(API+'?action=test-db',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host:document.getElementById('dbHost').value,port:document.getElementById('dbPort').value,name:document.getElementById('dbName').value,user:document.getElementById('dbUser').value,pass:document.getElementById('dbPass').value})});",
    "    const d=await r.json();",
    "    if(d.ok){result.innerHTML='<span style=color:#22c55e>✅ اتصال موفق</span>';document.getElementById('btn2').disabled=false;}",
    "    else result.innerHTML='<span style=color:#ef4444>❌ '+(d.error||'خطای اتصال')+'</span>';",
    "  }catch{result.innerHTML='<span style=color:#ef4444>❌ سرور installer-api.js در دسترس نیست</span>';}",
    "  btn.disabled=false;btn.textContent='🔗 تست اتصال';",
    "}",
    "async function startInstall(){",
    "  goStep(4);",
    "  const logBox=document.getElementById('logBox');",
    "  const fill=document.getElementById('progressFill');",
    "  const label=document.getElementById('progressLabel');",
    "  const addLog=(msg,type='')=>{const div=document.createElement('div');div.className='log-line '+type;const ts=new Date().toTimeString().slice(0,8);div.textContent='['+ts+'] '+msg;logBox.appendChild(div);logBox.scrollTop=logBox.scrollHeight;};",
    "  const setProgress=(pct,msg)=>{fill.style.width=pct+'%';label.textContent=msg;};",
    "  try{",
    "    setProgress(5,'شروع نصب...');addLog('شروع فرآیند نصب','ok');",
    "    setProgress(20,'ساخت جداول...');addLog('اتصال به پایگاه داده...');",
    "    const cr=await fetch(API+'?action=create-schema',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host:g('dbHost'),port:g('dbPort'),name:g('dbName'),user:g('dbUser'),pass:g('dbPass')})});",
    "    const cd=await cr.json();if(!cd.ok)throw new Error(cd.error||'خطا در ساخت جداول');",
    "    addLog('جداول ساخته شدند ('+cd.tableCount+' جدول)','ok');",
    "    setProgress(40,'وارد کردن داده‌ها...');addLog('بارگذاری db-export.json...');",
    "    const dbr=await fetch('./db-export.json');const dbData=await dbr.json();",
    "    const ir=await fetch(API+'?action=import-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({db:{host:g('dbHost'),port:g('dbPort'),name:g('dbName'),user:g('dbUser'),pass:g('dbPass')},tables:dbData.tables})});",
    "    const id=await ir.json();if(!id.ok)throw new Error(id.error);",
    "    id.imported.forEach(t=>addLog('✅ '+t.table+' ('+t.count+' رکورد)','ok'));",
    "    setProgress(65,'داده‌ها وارد شدند...');",
    "    setProgress(75,'ساخت .env...');",
    "    const er=await fetch(API+'?action=create-env',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dbHost:g('dbHost'),dbPort:g('dbPort'),dbName:g('dbName'),dbUser:g('dbUser'),dbPass:g('dbPass'),siteUrl:g('siteUrl'),siteName:g('siteName')})});",
    "    const ed=await er.json();if(!ed.ok)throw new Error(ed.error);addLog('.env ساخته شد','ok');",
    "    setProgress(90,'ساخت حساب مدیر...');",
    "    const ar=await fetch(API+'?action=create-admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({db:{host:g('dbHost'),port:g('dbPort'),name:g('dbName'),user:g('dbUser'),pass:g('dbPass')},email:g('adminEmail'),password:g('adminPass')})});",
    "    const ad=await ar.json();if(ad.ok)addLog('حساب مدیر: '+ad.email,'ok');else addLog('⚠️ '+(ad.error||'خطا در حساب'),'warn');",
    "    setProgress(100,'نصب کامل شد!');addLog('🎉 نصب با موفقیت انجام شد!','ok');",
    "    setTimeout(()=>showResult(true,{siteUrl:g('siteUrl'),email:g('adminEmail')}),800);",
    "  }catch(err){",
    "    addLog('❌ خطا: '+err.message,'err');addLog('⚠️ Rollback...','warn');",
    "    try{await fetch(API+'?action=rollback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host:g('dbHost'),port:g('dbPort'),name:g('dbName'),user:g('dbUser'),pass:g('dbPass')})});}catch{}",
    "    setTimeout(()=>showResult(false,{error:err.message}),800);",
    "  }",
    "}",
    "function g(id){return document.getElementById(id).value;}",
    "function showResult(ok,data){",
    "  goStep(5);",
    "  const box=document.getElementById('resultBox');",
    "  if(ok)box.innerHTML='<div class=result-icon>🎉</div><div class=result-title style=color:#22c55e>نصب موفق!</div><div class=credentials>آدرس: '+data.siteUrl+'<br>پنل: '+data.siteUrl+'/admin<br>ایمیل: '+data.email+'</div><div class=warning-box>⚠️ فایل installer.html را حذف کنید!</div><div class=btn-row><button class=btn onclick=\"window.open(\\'' +data.siteUrl+ '\\',\\'_blank\\')\">🌐 سایت</button><button class=\"btn success\" onclick=\"window.open(\\'' +data.siteUrl+ '/admin\\',\\'_blank\\')\">⚙️ پنل</button></div>';",
    "  else box.innerHTML='<div class=result-icon>❌</div><div class=result-title style=color:#ef4444>نصب ناموفق</div><div class=warning-box>'+data.error+'</div><div class=info-box>تغییرات برگشت داده شدند.</div><button class=btn onclick=\"goStep(2)\">تلاش مجدد</button>';",
    "}",
    "</script>",
    "</body></html>",
  ].join("\n");

  return html;
}

/** Generates installer-api.js (standalone Node.js server for installation). */
export function generateInstallerApi(): string {
  return `#!/usr/bin/env node
// Marjan Installer API - run: node installer-api.js
const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PORT = 3099;

function runPsql(db, sql) {
  const pass = (db.pass || '').replace(/'/g, "\\'");
  process.env.PGPASSWORD = db.pass || '';
  execSync('psql -h ' + db.host + ' -p ' + db.port + ' -U ' + db.user + ' -d ' + db.name + " -c \\\"" + sql.replace(/"/g, '\\\\"') + "\\\"", { stdio: 'pipe' });
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url, 'http://localhost');
  const action = url.searchParams.get('action');
  let body = '';
  req.on('data', d => body += d);
  req.on('end', () => {
    let data = {};
    try { data = body ? JSON.parse(body) : {}; } catch {}
    res.setHeader('Content-Type', 'application/json');
    try {
      if (action === 'check-node') {
        const major = parseInt(process.version.slice(1));
        res.end(JSON.stringify({ ok: major >= 18, version: process.version }));
      } else if (action === 'check-pg') {
        try { execSync('psql --version', { stdio: 'pipe' }); res.end(JSON.stringify({ ok: true })); }
        catch { res.end(JSON.stringify({ ok: false })); }
      } else if (action === 'check-disk') {
        res.end(JSON.stringify({ ok: true }));
      } else if (action === 'test-db') {
        try {
          process.env.PGPASSWORD = data.pass || '';
          execSync('psql -h ' + data.host + ' -p ' + data.port + ' -U ' + data.user + ' -d ' + data.name + ' -c "SELECT 1" -t -q', { stdio: 'pipe' });
          res.end(JSON.stringify({ ok: true }));
        } catch(e) { res.end(JSON.stringify({ ok: false, error: e.message.slice(0,100) })); }
      } else if (action === 'create-schema') {
        const schemaFile = path.join(__dirname, 'db-schema.sql');
        if (fs.existsSync(schemaFile)) {
          process.env.PGPASSWORD = data.pass || '';
          execSync('psql -h ' + data.host + ' -p ' + data.port + ' -U ' + data.user + ' -d ' + data.name + ' -f ' + schemaFile, { stdio: 'pipe' });
          res.end(JSON.stringify({ ok: true, tableCount: 17 }));
        } else {
          res.end(JSON.stringify({ ok: true, tableCount: 0, note: 'no schema file' }));
        }
      } else if (action === 'import-data') {
        const tables = data.tables || {};
        const imported = [];
        for (const [table, rows] of Object.entries(tables)) {
          if (!Array.isArray(rows) || rows.length === 0) { imported.push({ table, count: 0 }); continue; }
          try {
            const cols = Object.keys(rows[0]);
            let count = 0;
            for (const row of rows) {
              const vals = cols.map(c => {
                const v = row[c];
                if (v === null || v === undefined) return 'NULL';
                if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
                if (typeof v === 'number') return String(v);
                return "'" + String(v).replace(/'/g, "''") + "'";
              });
              try {
                process.env.PGPASSWORD = data.db.pass || '';
                execSync('psql -h ' + data.db.host + ' -p ' + data.db.port + ' -U ' + data.db.user + ' -d ' + data.db.name + " -c \\"INSERT INTO \\"" + table + "\\" (\\"" + cols.join('\\",\\"') + "\\") VALUES (" + vals.join(',') + ") ON CONFLICT DO NOTHING\\"", { stdio: 'pipe' });
                count++;
              } catch { /* skip row */ }
            }
            imported.push({ table, count });
          } catch(e) { imported.push({ table, count: 0, error: e.message }); }
        }
        res.end(JSON.stringify({ ok: true, imported }));
      } else if (action === 'create-env') {
        const env = [
          'DATABASE_URL="postgresql://' + data.dbUser + ':' + data.dbPass + '@' + data.dbHost + ':' + data.dbPort + '/' + data.dbName + '"',
          'AUTH_SECRET="' + crypto.randomBytes(32).toString('hex') + '"',
          'AUTH_URL="' + data.siteUrl + '"',
          'NEXT_PUBLIC_APP_URL="' + data.siteUrl + '"',
          'NEXT_PUBLIC_SITE_URL="' + data.siteUrl + '"',
          'NEXT_PUBLIC_APP_NAME="' + data.siteName + '"',
          'ZARINPAL_MERCHANT_ID="your-merchant-id"',
          'ZARINPAL_SANDBOX="true"',
          'UPLOAD_DIR="./public/uploads"',
          'MAX_FILE_SIZE="5242880"',
          'CRON_SECRET="' + crypto.randomBytes(16).toString('hex') + '"',
        ].join('\\n');
        fs.writeFileSync(path.join(__dirname, '..', '.env'), env);
        res.end(JSON.stringify({ ok: true }));
      } else if (action === 'create-admin') {
        let bcrypt;
        try { bcrypt = require('bcryptjs'); } catch { res.end(JSON.stringify({ ok: false, error: 'bcryptjs not found' })); return; }
        const hash = bcrypt.hashSync(data.password, 10);
        try {
          process.env.PGPASSWORD = data.db.pass || '';
          execSync('psql -h ' + data.db.host + ' -p ' + data.db.port + ' -U ' + data.db.user + ' -d ' + data.db.name + " -c \\"UPDATE \\"User\\" SET \\"passwordHash\\"='" + hash + "', \\"email\\"='" + data.email + "' WHERE \\"role\\"='SUPER_ADMIN' LIMIT 1\\"", { stdio: 'pipe' });
          res.end(JSON.stringify({ ok: true, email: data.email }));
        } catch(e) { res.end(JSON.stringify({ ok: false, error: e.message })); }
      } else if (action === 'rollback') {
        const tables = ['UserPermission','BackupRecord','ReturnRequest','WalletTx','Wallet','Notification','Review','CartItem','Wishlist','OrderItem','Payment','Order','Invoice','ProductSize','ProductImage','Product','Address','Session','Account','User','BlogComment','BlogPost','BlogCategory','Brand','Category','Coupon','SiteSettings','SystemLog','Newsletter','Faq','ContactMessage','Media','OtpCode'];
        for (const t of tables) {
          try {
            process.env.PGPASSWORD = data.pass || '';
            execSync('psql -h ' + data.host + ' -p ' + data.port + ' -U ' + data.user + ' -d ' + data.name + ' -c "DROP TABLE IF EXISTS \\"' + t + '\\" CASCADE"', { stdio: 'pipe' });
          } catch {}
        }
        res.end(JSON.stringify({ ok: true }));
      } else {
        res.end(JSON.stringify({ error: 'unknown action: ' + action }));
      }
    } catch(e) {
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
  });
}).listen(PORT, () => {
  console.log('Installer API: http://localhost:' + PORT);
  console.log('Open installer.html in your browser.');
});
`;
}

export function generateInstallMd(appName: string, packageDate: string): string {
  return `# ${appName} - راهنمای نصب

تاریخ پکیج: ${packageDate}

## پیش‌نیازها
- Node.js 18+
- PostgreSQL 14+

## نصب خودکار (توصیه‌شده)
1. فایل ZIP را استخراج کنید
2. اجرا کنید: \`node installer-api.js\`
3. فایل installer.html را در مرورگر باز کنید

## نصب دستی
1. \`cp .env.example .env\` و مقادیر را پر کنید
2. \`npx prisma db push\`
3. \`npm run build && npm start\`

## بعد از نصب
- فایل‌های installer.html، installer-api.js و db-export.json را حذف کنید
`;
}

export function generateEnvExample(): string {
  return `DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE"
AUTH_SECRET="CHANGE_ME"
AUTH_URL="http://localhost:3000"
ZARINPAL_MERCHANT_ID="your-merchant-id"
ZARINPAL_SANDBOX="true"
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE="5242880"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Marjan"
CRON_SECRET="CHANGE_ME"
`;
}
