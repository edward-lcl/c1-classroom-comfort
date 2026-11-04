'use strict';
// English / Simplified Chinese text for every page. English is the default (English-medium university);
// the 中文 / EN button switches and is remembered on this device.
// Usage: data-i18n="key" (text), data-i18n-tip="key" (tooltip), data-i18n-ph="key" (placeholder),
// or I18N.t('key', { var: value }) in scripts. Missing Chinese falls back to English.
(function () {
  const EN = {
    'room.example-room': 'Example Classroom (C1 demo)',
    'lang.switch': '中文',

    'qr.sameNet': 'The phone must be on the same Wi-Fi or hotspot as this laptop.', 'qr.full': 'Open full page (to project or print)', 'qr.close': 'Close', 'qr.loading': 'Making QR codes…',
    'fl.l1': 'SENSING', 'fl.l2': 'NETWORKING', 'fl.l3': 'DATA ANALYSIS', 'fl.l4': 'APPLICATION',
    'fl.sensors': 'Classroom sensors', 'fl.sensorsD': 'light · temp · RH · gas',
    'fl.uno': 'Arduino UNO', 'fl.unoD': 'reads every 2 s',
    'fl.app': 'Laptop app', 'fl.appD': 'freshness check · rules',
    'fl.dash': 'Staff dashboard', 'fl.dashD': 'readings + feedback',
    'fl.person': 'A person', 'fl.personD': 'checks room · logs it',
    'fl.phone': 'Student phone', 'fl.phoneD': 'scans the QR code',
    'fl.a1': 'voltage · I²C', 'fl.a2': 'USB · 1 line / 2 s', 'fl.a3': 'live updates', 'fl.a4': '“Needs review”',
    'fl.a5': 'feedback form · Wi-Fi', 'fl.loop': 'opens a window / asks for AC check → new readings and feedback',

    'su.title': 'C1 hardware setup', 'su.back': '← Dashboard', 'su.h1': 'Hardware setup', 'su.progress': '{n} of {total} done',
    'su.safety': 'Unplug USB before changing any wiring. Check every connection against the diagram before plugging back in.',
    'su.st.done': 'Done', 'su.st.waiting': 'Waiting', 'su.st.problem': 'Problem', 'su.st.off': 'Off', 'su.st.test': 'Test input only',
    'su.usb.t': 'Plug the UNO into this laptop',
    'su.usb.d': "Use the blue USB cable from the kit (a data cable). Close Arduino IDE's Serial Monitor — only one program can use the port.",
    'su.usb.ok': 'Connected on {port}.', 'su.simMode': 'The app is in simulated-sensor mode. Restart it with npm start to use the Arduino.',
    'su.sketch.t': 'Upload the C1 sketch',
    'su.sketch.d': "Arduino IDE → open arduino/c1_station → Tools › Board › Arduino Uno → Tools › Port → Upload. Close the IDE's Serial Monitor afterwards.",
    'su.sketch.ok': 'Receiving data from {fw}. Bad lines so far: {n}.', 'su.sketch.wait': 'Port is open but no data yet. Upload the sketch, or press the UNO reset button.',
    'su.sketch.unknown': 'Data is arriving but no C1 boot message was seen. Press the UNO reset button.',
    'su.ldr.t': 'Photoresistor on A1',
    'su.ldr.d': 'Wire it as shown, then cover the sensor with your hand and shine a phone torch on it. The step passes when the reading moves by at least 150.',
    'su.ldr.move': 'Now {v}. Seen {lo}–{hi}. Cover it, then light it up.', 'su.ldr.ok': 'Responds to light: {lo}–{hi} (now {v}).',
    'su.offInSketch': 'Switched off in the sketch ({flag} 0).',
    'su.lm35.t': 'LM35 temperature sensor on A0',
    'su.lm35.d': 'Flat printed face toward you: left leg 5V, middle A0, right GND (same breadboard picture as step 3). If it gets hot, unplug immediately — it is reversed.',
    'su.lm35.ok': 'Reads {c} °C. Compare with a thermometer if you have one.',
    'su.i2c.t': 'ENS160 + AHT21 module (after soldering and checks)',
    'su.i2c.d': 'Do the multimeter checks in docs/HARDWARE_GUIDE.md §3 first. Then run arduino/i2c_scanner (expect 0x38 and 0x53 or 0x52) and set ENABLE_AHT20 and ENABLE_ENS160 to 1 in the sketch.',
    'su.i2c.off': 'Not enabled in the sketch yet — correct until the checks are done.', 'su.i2c.ok': 'AHT21 {t} °C, {rh} %RH. ENS160: {ens}.',
    'su.phone.t': 'Test the QR code with a second phone',
    'su.phone.d': 'Open the QR page, scan it with a phone on the same Wi-Fi or hotspot, and send one test response. It passes when feedback arrives.',
    'su.openQr': 'Open QR page', 'su.phone.wait': 'Waiting for a new response while this page is open.', 'su.phone.ok': 'A response arrived from a phone.',
    'su.overview': 'System overview diagram',

    'dash.setup': 'Setup', 'dash.setupTip': 'Step-by-step hardware setup with wiring diagrams and live checks',
    'p.latestTip': 'Comments are shown exactly as students wrote them. They are not translated, so they never leave this laptop.',
    'vd.review': 'Needs review · {n}', 'vd.reviewTip': '{n} alert(s) waiting for someone to check the room and log what they did.',
    'vd.watching': 'Reviewed · watching', 'vd.watchingTip': 'Someone has reviewed the room. The alert closes by itself when readings or feedback return to normal.',
    'vd.ok': 'All clear', 'vd.okTip': 'Live data is arriving and no rule is triggered.',
    'vd.nodata': 'No live data', 'vd.nodataTip': 'No fresh readings are arriving, so the room state is unknown — not good news.',
    'chart.gap': 'No data {from}–{to}', 'lg.gap': 'No data',
    // app-generated messages (server text is matched and translated here)
    'rs.empty line': 'empty line', 'rs.line too long': 'line too long', 'rs.incomplete or non-JSON line': 'incomplete or non-JSON line',
    'rs.invalid JSON': 'invalid JSON', 'rs.not an object': 'not a JSON object', 'rs.unsupported protocol version': 'unsupported protocol version',
    'rs.unknown message type': 'unknown message type', 'rs.missing sequence number': 'missing sequence number', 'rs.not text': 'not text',
    'pb.light_raw out of range': 'Light reading out of range', 'pb.lm35_raw out of range': 'LM35 reading out of range',
    'pb.lm35': 'LM35 reading implausible ({c} °C) — check wiring',
    'pb.AHT20 temperature out of range': 'AHT20 temperature out of range', 'pb.AHT20 humidity out of range': 'AHT20 humidity out of range',
    'pb.AHT20 not responding': 'AHT20 not responding', 'pb.ENS160 eCO₂ out of range': 'ENS160 eCO₂ out of range', 'pb.ENS160 not responding': 'ENS160 not responding',
    'er.noArduino': 'No Arduino found on USB. Check the cable (it must be a data cable) and close Arduino IDE Serial Monitor.',
    'er.closed': 'Serial port closed (USB unplugged or board reset).',
    'er.open': 'Could not open the port. Is Arduino IDE Serial Monitor open?',
    'er.stdin': 'Test input stopped.', 'er.pkg': 'serialport package not installed — run npm install',
    'dv.boardMsg': 'Board says',
    'lang.tip': 'Switch language to Chinese',

    // dashboard header
    'dash.title': 'Example Classroom · C1 dashboard',
    'dash.proto': 'C1 prototype',
    'dash.protoTip': 'Group C1 · IOT001TC student prototype. Not an official campus service or a safety monitor.',
    'dash.demo': 'Demo',
    'dash.demoTip': 'Demo control: switches the SIMULATED CO₂ scenario. It never changes real sensor readings.',
    'dash.qr': 'QR',
    'dash.qrTip': 'Open the QR code page for student phones',
    'dash.csv': 'CSV',
    'dash.csvTip': 'Download the raw records as CSV',
    'csv.readings': 'Readings', 'csv.feedback': 'Feedback', 'csv.reviews': 'Reviews', 'csv.events': 'Events',
    'dash.themeTip': 'Light / dark',
    'dash.offlineNote': "Can't reach the laptop app. Showing the last numbers received.",

    // tiles
    'tile.temp': 'Temperature', 'tile.rh': 'Humidity', 'tile.light': 'Light', 'tile.eco2': 'eCO₂', 'tile.sim': 'CO₂',
    'chip.est': 'est.', 'chip.sim': 'sim.', 'chip.nodata': 'no data', 'chip.stale': 'stale {age}',
    'ens.none': 'no status', 'ens.normal': 'Normal', 'ens.warm-up': 'Warm-up', 'ens.initial-start-up': 'Start-up', 'ens.invalid': 'Invalid',
    'tip.temp': '{label}. Review prompt at ≥ {thr} °C for {n} readings in a row (illustrative).',
    'tip.rh': 'Relative humidity from the AHT20 sensor.',
    'tip.light': 'Photoresistor reading as a share of the 0–1023 ADC range. Relative light, not calibrated lux.',
    'tip.eco2': 'ENS160 gas-sensor ESTIMATE of equivalent CO₂ from VOCs/H₂ — not measured CO₂. Never used for alerts.',
    'tip.ensStatus': 'Status: {status}. Compensation: {comp}.',
    'tip.compYes': 'from AHT20', 'tip.compNo': 'missing',
    'tip.sim': 'SIMULATED CO₂ — synthetic demo values, not measured. Review prompt at ≥ {thr} ppm, clears below {clear}.',
    'tip.simMode': 'This value is SIMULATED (hardware-free demo mode).',
    'tip.last': 'Last value {time}.', 'tip.lastStale': 'Last value {time} — stale, not current.',
    'label.aht': 'Temperature (AHT20)', 'label.lm35': 'Temperature (LM35)',

    // time
    'age.s': '{n} s', 'age.min': '{n} min', 'age.h': '{n} h', 'age.ago': '{age} ago',

    // chart
    'chart.label': '{name} · last {n} min', 'chart.estimate': ' estimate (ENS160)', 'chart.simulated': ' (simulated)', 'chart.stale': ' · stale',
    'range.15': '15 min', 'range.30': '30 min', 'range.60': '60 min',
    'lg.measured': 'Measured', 'lg.estimate': 'Estimate', 'lg.simulated': 'Simulated', 'lg.level': 'Alert level', 'lg.alert': 'Alert',
    'lg.discomfort': 'Discomfort', 'lg.other': 'Other report', 'lg.review': 'Review',
    'chart.emptySim': 'Simulated CO₂ appears here while a demo scenario runs. Pick one under Demo.',
    'chart.empty': 'Readings appear here once the Arduino sends data, or run the app with --sensors=simulated.',
    'chart.thr': 'alert {thr}', 'chart.hEst': ' · estimate', 'chart.hSim': ' · simulated',
    'chart.aria': '{name} over the last {n} minutes', 'chart.now': 'now',

    // feedback answers
    'fb.cold': 'Too cold', 'fb.tempOk': 'Comfortable', 'fb.hot': 'Too hot', 'fb.airOk': 'Air OK', 'fb.stuffy': 'Stuffy',
    'fb.unsure': 'Air unsure', 'fb.dark': 'Too dark', 'fb.lightOk': 'Light OK', 'fb.bright': 'Too bright',

    // alerts
    'al.sim': 'Simulated CO₂', 'al.temp': 'Temperature', 'al.fb': 'Discomfort reports', 'al.since': 'since {t}', 'al.min': '{n} min',
    'al.ruleTip': 'Illustrative rule, not a safety limit.', 'al.reviewedTip': 'Reviewed {t}: {action}.',
    'al.title.sim_co2': 'Simulated CO₂ above illustrative level', 'al.title.temperature': 'Room may be too warm', 'al.title.feedback': 'Several students reported discomfort',
    'rv.what': 'What was done?', 'rv.thermostat': 'Adjusted thermostat(s)', 'rv.teacher': 'Asked the teacher', 'rv.ventilated': 'Opened window/door',
    'rv.hvac': 'Reported to facilities', 'rv.no_change': 'Checked — no change',
    'rv.other': 'Other', 'rv.note': 'Note, e.g. set both thermostats to 24 °C', 'rv.log': 'Log review',

    // connection
    'cn.offline': 'Laptop app offline', 'cn.offlineTip': 'The dashboard lost its connection to the laptop app. Values shown are the last received.',
    'cn.simulated': 'Simulated sensors', 'cn.simulatedTip': 'Hardware-free demo mode: light, temperature and humidity are simulated.',
    'cn.test': 'Test input', 'cn.arduino': 'Arduino', 'cn.nodata': 'no data', 'cn.lastTip': '{port}. Last valid sample {time}.', 'cn.none': 'none',
    'cn.searching': 'Looking for Arduino', 'cn.searchingTip': 'Plug in the UNO with a USB data cable and close Arduino IDE Serial Monitor.',
    'cn.disconnected': 'Arduino disconnected', 'cn.disconnectedTip': 'Check the USB cable.',
    'cn.off': 'Serial off', 'cn.offTip': 'The app was started without serial input.',
    'mode.sim': 'SIMULATED SENSORS', 'mode.simTip': 'No hardware: light, temperature and humidity are simulated values.',
    'mode.test': 'TEST INPUT', 'mode.testTip': 'Serial lines come from the fake-UNO test generator, not a real Arduino.',
    'mode.profile': 'profile {p}', 'mode.profileTip': 'Data is saved in a separate profile folder.',

    // scenarios
    'sc.off': 'Off', 'sc.normal': 'Normal', 'sc.stuffy': 'Stuffy', 'sc.ventilated': 'Ventilated',
    'sc.tip.off': 'Simulated CO₂: no values.', 'sc.tip.normal': 'Simulated CO₂: steady around 650 ppm.',
    'sc.tip.stuffy': 'Simulated CO₂: rises to ~1500 ppm over 3 min.', 'sc.tip.ventilated': 'Simulated CO₂: falls back toward 600 ppm over ~2 min.',

    // panels
    'p.feedback': 'Feedback', 'p.comments': 'Comments', 'p.latest': 'latest', 'p.reviews': 'Reviews', 'p.roleplay': 'role-play',
    'p.roleplayTip': 'Recorded by the presenter in a role-play. Real facilities staff were not involved. A staged demo cannot show that ventilation caused a change.',
    'p.device': 'Device', 'p.earlier': 'Earlier alerts', 'p.last5': 'last 5',
    'fb.total': '60 min · {n}', 'fb.empty': 'Responses appear here after a student scans the QR code.', 'fb.openQr': 'Open QR page',
    'fb.rowTip': '{n} of {total} responses in the last 60 min chose “{name}”. A response can include several answers. “Stuffy” is how a student feels, not a CO₂ measurement.',
    'cm.empty': 'No comments yet.', 'rv.empty': 'Reviews appear here after someone logs one on an alert.', 'ea.empty': 'None yet.',
    'ea.reviewed': 'reviewed', 'ea.cleared': 'cleared',
    'dv.serial': 'Serial', 'dv.last': 'Last sample', 'dv.sensors': 'Sensors on', 'dv.bad': 'Bad lines', 'dv.problems': 'Problems',
    'dv.restarts': 'Restarts', 'dv.mode': 'Mode', 'dv.none': 'none',
    'dv.badTip': 'Malformed serial lines are ignored and counted here.', 'dv.badLast': 'Last: {reason} at {time}. Bad lines are ignored.',
    'st.connected': 'connected', 'st.searching': 'searching', 'st.disconnected': 'disconnected', 'st.disabled': 'off',
    'md.simulated': 'simulated', 'md.serial': 'serial',

    // how it works
    'how.title': 'How it works',
    'how.sense': 'Sense', 'how.senseD': 'LDR · LM35 · AHT20 · ENS160 on the Arduino UNO',
    'how.connect': 'Connect', 'how.connectD': 'USB serial → laptop bridge',
    'how.student': 'Student input', 'how.studentD': 'Phone → QR form → local Wi-Fi',
    'how.analyse': 'Analyse', 'how.analyseD': 'Freshness checks + threshold rules (no AI)',
    'how.act': 'Act', 'how.actD': 'A person reviews the room and logs it',

    // feedback form
    'form.title': 'Classroom comfort feedback',
    'form.eyebrow': 'Student prototype (Group C1)',
    'form.h1': 'How does this classroom feel?',
    'form.notice': 'Voluntary and anonymous — no name or student ID. This is a student course prototype, not an official maintenance or emergency channel.',
    'form.temp': 'Temperature', 'form.air': 'Air', 'form.light': 'Light', 'form.optional': '(optional)',
    'form.cold': '🥶 Too cold', 'form.ok': '🙂 Comfortable', 'form.hot': '🥵 Too hot',
    'form.airOk': '🙂 Fresh / OK', 'form.stuffy': '😮‍💨 Stuffy', 'form.unsure': '🤷 Not sure',
    'form.dark': 'Too dark', 'form.lightOk': 'OK', 'form.bright': 'Too bright',
    'form.comment': 'Comment', 'form.commentOpt': '(optional, max 200)', 'form.placeholder': 'e.g. back row is warm',
    'form.send': 'Send feedback', 'form.sending': 'Sending…',
    'form.pick': 'Please choose at least one answer.',
    'form.fail': 'Could not send. Please check the connection and try again.',
    'form.thanks': 'Thank you!', 'form.sent': 'Your feedback was sent to the demo staff dashboard for this room.',
    'form.again': 'Send another',

    // QR page
    'qr.title': 'C1 feedback QR code',
    'qr.h1': 'Scan to give classroom feedback',
    'qr.notice': 'Student prototype (Group C1). Anonymous and voluntary. Not an official campus channel.',
    'qr.howH': 'Before the demo — check the QR really works',
    'qr.how1': 'The phone and this laptop must be on the same network. Each address below belongs to one network adapter of this laptop.',
    'qr.how2': 'Scan with a separate phone. If the page does not open, the network may block device-to-device traffic (common on campus Wi-Fi).',
    'qr.how3': 'Fallback: turn on a phone hotspot, join it with this laptop, reload this page, and scan the new code with another phone on that hotspot.',
    'qr.how4': 'A localhost link never works on a phone, so it is not shown here.',
    'qr.none': 'This laptop has no network address. Connect to Wi-Fi or a phone hotspot, then reload.',
    'qr.error': 'Could not make QR codes: {msg}',
    'qr.adapter': 'adapter {name}',
  };

  const ZH = {
    'room.example-room': '示例教室（C1 演示）',
    'lang.switch': 'EN',

    'qr.sameNet': '手机必须和这台笔记本连接同一个 Wi-Fi 或热点。', 'qr.full': '打开完整页面（投影或打印）', 'qr.close': '关闭', 'qr.loading': '正在生成二维码…',
    'fl.l1': '感知层', 'fl.l2': '网络层', 'fl.l3': '数据分析层', 'fl.l4': '应用层',
    'fl.sensors': '教室传感器', 'fl.sensorsD': '光照 · 温度 · 湿度 · 气体',
    'fl.uno': 'Arduino UNO', 'fl.unoD': '每 2 秒读取一次',
    'fl.app': '笔记本应用', 'fl.appD': '时效检查 · 规则',
    'fl.dash': '管理面板', 'fl.dashD': '读数 + 反馈',
    'fl.person': '工作人员', 'fl.personD': '检查教室并记录',
    'fl.phone': '学生手机', 'fl.phoneD': '扫描二维码',
    'fl.a1': '电压 · I²C', 'fl.a2': 'USB · 每 2 秒 1 行', 'fl.a3': '实时更新', 'fl.a4': '「需要检查」',
    'fl.a5': '反馈表单 · Wi-Fi', 'fl.loop': '开窗 / 请人检查空调 → 新的读数和反馈',

    'su.title': 'C1 硬件设置', 'su.back': '← 管理面板', 'su.h1': '硬件设置向导', 'su.progress': '已完成 {n}/{total}',
    'su.safety': '改动任何接线前先拔掉 USB。重新插上前，请对照接线图逐一检查。',
    'su.st.done': '完成', 'su.st.waiting': '等待中', 'su.st.problem': '有问题', 'su.st.off': '未启用', 'su.st.test': '仅测试输入',
    'su.usb.t': '用 USB 把 UNO 连接到这台笔记本',
    'su.usb.d': '请使用套件里的蓝色 USB 线（数据线）。关闭 Arduino IDE 的串口监视器——同一时间只能有一个程序使用串口。',
    'su.usb.ok': '已连接：{port}。', 'su.simMode': '应用正处于模拟传感器模式。请用 npm start 重新启动以使用 Arduino。',
    'su.sketch.t': '上传 C1 程序',
    'su.sketch.d': 'Arduino IDE → 打开 arduino/c1_station → 工具 › 开发板 › Arduino Uno → 工具 › 端口 → 上传。上传后关闭串口监视器。',
    'su.sketch.ok': '正在接收 {fw} 的数据。目前错误行：{n}。', 'su.sketch.wait': '串口已打开但还没有数据。请上传程序，或按 UNO 上的复位键。',
    'su.sketch.unknown': '有数据但没有看到 C1 启动信息。请按 UNO 上的复位键。',
    'su.ldr.t': '光敏电阻接 A1',
    'su.ldr.d': '按图接线，然后用手遮住传感器，再用手机手电筒照它。读数变化至少 150 即通过。',
    'su.ldr.move': '当前 {v}，已见范围 {lo}–{hi}。先遮住，再照亮。', 'su.ldr.ok': '对光有反应：{lo}–{hi}（当前 {v}）。',
    'su.offInSketch': '程序中已关闭（{flag} 0）。',
    'su.lm35.t': 'LM35 温度传感器接 A0',
    'su.lm35.d': '印字平面朝向自己：左脚接 5V，中间接 A0，右脚接 GND（与第 3 步同一张面包板图）。如果发烫，说明接反了，请立即拔掉。',
    'su.lm35.ok': '读数 {c} °C。如有温度计可以对比一下。',
    'su.i2c.t': 'ENS160 + AHT21 模块（焊接并检查之后）',
    'su.i2c.d': '先完成 docs/HARDWARE_GUIDE.md 第 3 节的万用表检查。然后运行 arduino/i2c_scanner（应看到 0x38 以及 0x53 或 0x52），再把程序中的 ENABLE_AHT20 和 ENABLE_ENS160 改为 1。',
    'su.i2c.off': '程序中尚未启用——完成检查前保持这样是正确的。', 'su.i2c.ok': 'AHT21 {t} °C，{rh} %RH。ENS160：{ens}。',
    'su.phone.t': '用另一部手机测试二维码',
    'su.phone.d': '打开二维码页面，用连接同一 Wi-Fi 或热点的手机扫码，并提交一条测试反馈。收到反馈即通过。',
    'su.openQr': '打开二维码页面', 'su.phone.wait': '本页面打开期间正在等待新的反馈。', 'su.phone.ok': '已收到手机提交的反馈。',
    'su.overview': '系统总览图',

    'dash.setup': '设置向导', 'dash.setupTip': '分步骤的硬件设置，含接线图和实时检查',
    'p.latest': '最新 · 原文',
    'p.latestTip': '留言按学生原文显示，不做翻译，因此不会离开这台笔记本。',
    'vd.review': '需要检查 · {n}', 'vd.reviewTip': '有 {n} 条提醒等待有人检查教室并记录处理。',
    'vd.watching': '已处理 · 观察中', 'vd.watchingTip': '已有人检查教室。读数或反馈恢复正常后，提醒会自动关闭。',
    'vd.ok': '一切正常', 'vd.okTip': '正在接收实时数据，没有触发任何规则。',
    'vd.nodata': '无实时数据', 'vd.nodataTip': '没有收到新的读数，教室状态未知——这不代表一切正常。',
    'chart.gap': '无数据 {from}–{to}', 'lg.gap': '无数据',
    'rs.empty line': '空行', 'rs.line too long': '行太长', 'rs.incomplete or non-JSON line': '不完整或非 JSON 行',
    'rs.invalid JSON': 'JSON 格式错误', 'rs.not an object': '不是 JSON 对象', 'rs.unsupported protocol version': '协议版本不支持',
    'rs.unknown message type': '未知消息类型', 'rs.missing sequence number': '缺少序号', 'rs.not text': '不是文本',
    'pb.light_raw out of range': '光照读数超出范围', 'pb.lm35_raw out of range': 'LM35 读数超出范围',
    'pb.lm35': 'LM35 读数不合理（{c} °C）——请检查接线',
    'pb.AHT20 temperature out of range': 'AHT20 温度超出范围', 'pb.AHT20 humidity out of range': 'AHT20 湿度超出范围',
    'pb.AHT20 not responding': 'AHT20 无响应', 'pb.ENS160 eCO₂ out of range': 'ENS160 eCO₂ 超出范围', 'pb.ENS160 not responding': 'ENS160 无响应',
    'er.noArduino': 'USB 上没有找到 Arduino。请检查数据线（必须是数据线），并关闭 Arduino IDE 的串口监视器。',
    'er.closed': '串口已关闭（USB 被拔出或开发板重启）。',
    'er.open': '无法打开串口。Arduino IDE 的串口监视器是否开着？',
    'er.stdin': '测试输入已停止。', 'er.pkg': '未安装 serialport 软件包——请运行 npm install',
    'dv.boardMsg': '开发板消息',
    'lang.tip': '切换为英文',

    'dash.title': '示例教室 · C1 管理面板',
    'dash.proto': 'C1 原型',
    'dash.protoTip': 'C1 小组 · IOT001TC 学生原型。不是学校官方服务，也不是安全监测设备。',
    'dash.demo': '演示',
    'dash.demoTip': '演示控制：切换「模拟 CO₂」场景，不会改变真实传感器读数。',
    'dash.qrTip': '打开学生扫码用的二维码页面',
    'dash.csvTip': '下载原始记录（CSV）',
    'csv.readings': '读数', 'csv.feedback': '反馈', 'csv.reviews': '处理记录', 'csv.events': '事件',
    'dash.themeTip': '浅色 / 深色',
    'dash.offlineNote': '无法连接笔记本上的应用，正在显示最后收到的数据。',

    'tile.temp': '温度', 'tile.rh': '湿度', 'tile.light': '亮度', 'tile.eco2': 'eCO₂', 'tile.sim': 'CO₂',
    'chip.est': '估算', 'chip.sim': '模拟', 'chip.nodata': '无数据', 'chip.stale': '已过期 {age}',
    'ens.none': '无状态', 'ens.normal': '正常', 'ens.warm-up': '预热中', 'ens.initial-start-up': '初始启动', 'ens.invalid': '无效',
    'tip.temp': '{label}。连续 {n} 次读数 ≥ {thr} °C 时提示检查（示例阈值）。',
    'tip.rh': 'AHT20 传感器测得的相对湿度。',
    'tip.light': '光敏电阻读数占 0–1023 ADC 范围的百分比。只是相对亮度，不是校准过的勒克斯（lux）。',
    'tip.eco2': 'ENS160 气体传感器根据 VOC/氢气「估算」的等效 CO₂，不是实测 CO₂。不用于触发提醒。',
    'tip.ensStatus': '状态：{status}。温湿度补偿：{comp}。',
    'tip.compYes': '来自 AHT20', 'tip.compNo': '无',
    'tip.sim': '模拟 CO₂：演示用的合成数据，不是测量值。≥ {thr} ppm 时提示检查，低于 {clear} 时解除。',
    'tip.simMode': '此数值为模拟数据（无硬件演示模式）。',
    'tip.last': '最近数值：{time}。', 'tip.lastStale': '最近数值：{time}，已过期，不是当前读数。',
    'label.aht': '温度（AHT20）', 'label.lm35': '温度（LM35）',

    'age.s': '{n} 秒', 'age.min': '{n} 分钟', 'age.h': '{n} 小时', 'age.ago': '{age}前',

    'chart.label': '{name} · 最近 {n} 分钟', 'chart.estimate': ' 估算值（ENS160）', 'chart.simulated': '（模拟）', 'chart.stale': ' · 已过期',
    'range.15': '15 分钟', 'range.30': '30 分钟', 'range.60': '60 分钟',
    'lg.measured': '实测', 'lg.estimate': '估算', 'lg.simulated': '模拟', 'lg.level': '提醒阈值', 'lg.alert': '提醒',
    'lg.discomfort': '不适反馈', 'lg.other': '其他反馈', 'lg.review': '处理',
    'chart.emptySim': '运行演示场景时，这里会显示模拟 CO₂。请在「演示」中选择一个场景。',
    'chart.empty': 'Arduino 发送数据后这里会显示读数；也可以用 --sensors=simulated 启动应用。',
    'chart.thr': '阈值 {thr}', 'chart.hEst': ' · 估算', 'chart.hSim': ' · 模拟',
    'chart.aria': '{name}，最近 {n} 分钟', 'chart.now': '现在',

    'fb.cold': '太冷', 'fb.tempOk': '舒适', 'fb.hot': '太热', 'fb.airOk': '空气正常', 'fb.stuffy': '闷',
    'fb.unsure': '空气不确定', 'fb.dark': '太暗', 'fb.lightOk': '光线合适', 'fb.bright': '太亮',

    'al.sim': '模拟 CO₂', 'al.temp': '温度', 'al.fb': '不适反馈', 'al.since': '{t} 起', 'al.min': '{n} 分钟',
    'al.ruleTip': '示例规则，不是安全限值。', 'al.reviewedTip': '{t} 已处理：{action}。',
    'al.title.sim_co2': '模拟 CO₂ 超过示例阈值', 'al.title.temperature': '教室可能过热', 'al.title.feedback': '多名学生反馈不适',
    'rv.what': '采取了什么措施？', 'rv.thermostat': '自己调了温控器', 'rv.teacher': '告诉了老师', 'rv.ventilated': '开窗或开门',
    'rv.hvac': '报修给后勤', 'rv.no_change': '已检查，无需调整',
    'rv.other': '其他', 'rv.note': '备注，例如：两个温控器都调到 24 °C', 'rv.log': '记录处理',

    'cn.offline': '笔记本应用离线', 'cn.offlineTip': '面板与笔记本应用断开连接，显示的是最后收到的数据。',
    'cn.simulated': '模拟传感器', 'cn.simulatedTip': '无硬件演示模式：亮度、温度和湿度均为模拟数据。',
    'cn.test': '测试输入', 'cn.nodata': '无数据', 'cn.lastTip': '{port}。最近有效数据：{time}。', 'cn.none': '无',
    'cn.searching': '正在寻找 Arduino', 'cn.searchingTip': '请用 USB 数据线连接 UNO，并关闭 Arduino IDE 的串口监视器。',
    'cn.disconnected': 'Arduino 已断开', 'cn.disconnectedTip': '请检查 USB 线。',
    'cn.off': '串口关闭', 'cn.offTip': '应用启动时没有启用串口输入。',
    'mode.sim': '模拟传感器', 'mode.simTip': '无硬件：亮度、温度和湿度均为模拟数据。',
    'mode.test': '测试输入', 'mode.testTip': '串口数据来自 fake-UNO 测试程序，不是真实的 Arduino。',
    'mode.profile': '数据档案 {p}', 'mode.profileTip': '数据保存在单独的档案文件夹中。',

    'sc.off': '关闭', 'sc.normal': '正常', 'sc.stuffy': '闷', 'sc.ventilated': '已通风',
    'sc.tip.off': '模拟 CO₂：不产生数据。', 'sc.tip.normal': '模拟 CO₂：稳定在约 650 ppm。',
    'sc.tip.stuffy': '模拟 CO₂：3 分钟内升至约 1500 ppm。', 'sc.tip.ventilated': '模拟 CO₂：约 2 分钟内回落到 600 ppm 左右。',

    'p.feedback': '学生反馈', 'p.comments': '留言', 'p.reviews': '处理记录', 'p.roleplay': '角色扮演',
    'p.roleplayTip': '由演示者以角色扮演方式记录，没有真实的后勤人员参与。演示无法证明通风导致了数值变化。',
    'p.device': '设备', 'p.earlier': '历史提醒', 'p.last5': '最近 5 条',
    'fb.total': '60 分钟 · {n}', 'fb.empty': '学生扫描二维码提交后，反馈会显示在这里。', 'fb.openQr': '打开二维码页面',
    'fb.rowTip': '最近 60 分钟的 {total} 份反馈中有 {n} 份选择了「{name}」。一份反馈可以包含多个选项。「闷」是学生的感受，不是 CO₂ 测量值。',
    'cm.empty': '暂无留言。', 'rv.empty': '在提醒上记录处理后，会显示在这里。', 'ea.empty': '暂无。',
    'ea.reviewed': '已处理', 'ea.cleared': '已自动解除',
    'dv.serial': '串口', 'dv.last': '最近数据', 'dv.sensors': '已启用传感器', 'dv.bad': '错误行', 'dv.problems': '问题',
    'dv.restarts': '重启次数', 'dv.mode': '模式', 'dv.none': '无',
    'dv.badTip': '格式错误的串口数据会被忽略并在此计数。', 'dv.badLast': '最近一次：{reason}（{time}）。错误行会被忽略。',
    'st.connected': '已连接', 'st.searching': '查找中', 'st.disconnected': '已断开', 'st.disabled': '关闭',
    'md.simulated': '模拟', 'md.serial': '串口',

    'how.title': '数据流程',
    'how.sense': '感知', 'how.senseD': 'Arduino UNO 上的光敏电阻 · LM35 · AHT20 · ENS160',
    'how.connect': '传输', 'how.connectD': 'USB 串口 → 笔记本桥接程序',
    'how.student': '学生输入', 'how.studentD': '手机 → 扫码表单 → 本地 Wi-Fi',
    'how.analyse': '分析', 'how.analyseD': '数据时效检查 + 阈值规则（不使用 AI）',
    'how.act': '行动', 'how.actD': '由人检查教室并记录处理',

    'form.title': '教室舒适度反馈',
    'form.eyebrow': '学生原型项目（C1 小组）',
    'form.h1': '教室感觉怎么样？',
    'form.notice': '自愿、匿名填写，请勿填写姓名或学号。本页面为学生课程原型，不是学校官方报修或紧急求助渠道。',
    'form.temp': '温度', 'form.air': '空气', 'form.light': '光线', 'form.optional': '（选填）',
    'form.cold': '🥶 太冷', 'form.ok': '🙂 舒适', 'form.hot': '🥵 太热',
    'form.airOk': '🙂 清新', 'form.stuffy': '😮‍💨 闷', 'form.unsure': '🤷 不确定',
    'form.dark': '太暗', 'form.lightOk': '合适', 'form.bright': '太亮',
    'form.comment': '补充说明', 'form.commentOpt': '（选填，最多 200 字）', 'form.placeholder': '例如：后排很热',
    'form.send': '提交', 'form.sending': '提交中…',
    'form.pick': '请至少选择一项。',
    'form.fail': '提交失败，请检查网络后重试。',
    'form.thanks': '谢谢！', 'form.sent': '反馈已发送到本教室的演示管理面板。',
    'form.again': '再次反馈',

    'qr.title': 'C1 反馈二维码',
    'qr.h1': '扫码反馈教室感受',
    'qr.notice': '学生原型项目（C1 小组）。匿名、自愿。不是学校官方渠道。',
    'qr.howH': '演示前：确认二维码真的能用',
    'qr.how1': '手机和这台笔记本必须连接同一个网络。下面每个地址对应笔记本的一个网络适配器。',
    'qr.how2': '请用另一部手机扫码。如果打不开，可能是网络禁止设备之间互相访问（校园 Wi-Fi 常见）。',
    'qr.how3': '备用方案：打开手机热点，让笔记本连接该热点，刷新本页，再用连接同一热点的另一部手机扫描新的二维码。',
    'qr.how4': 'localhost 链接在手机上无法打开，因此这里不显示。',
    'qr.none': '这台笔记本没有网络地址。请连接 Wi-Fi 或手机热点后刷新。',
    'qr.error': '无法生成二维码：{msg}',
    'qr.adapter': '适配器 {name}',
  };

  const DICT = { en: EN, zh: ZH };
  let lang = 'en';
  try {
    // A link can choose the language (e.g. a QR code ending in &lang=zh); otherwise use the saved choice.
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (fromUrl === 'zh' || fromUrl === 'en') localStorage.setItem('c1-lang', fromUrl);
    if (localStorage.getItem('c1-lang') === 'zh') lang = 'zh';
  } catch {
    /* storage blocked: English */
  }
  const listeners = [];

  function t(key, vars) {
    let s = DICT[lang][key];
    if (s === undefined) s = EN[key];
    if (s === undefined) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return s;
  }

  function apply(root = document) {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    for (const e of root.querySelectorAll('[data-i18n]')) e.textContent = t(e.dataset.i18n);
    for (const e of root.querySelectorAll('[data-i18n-tip]')) e.dataset.tip = t(e.dataset.i18nTip);
    for (const e of root.querySelectorAll('[data-i18n-ph]')) e.placeholder = t(e.dataset.i18nPh);
    for (const e of root.querySelectorAll('[data-i18n-aria]')) e.setAttribute('aria-label', t(e.dataset.i18nAria));
    for (const b of document.querySelectorAll('[data-lang]')) {
      b.classList.toggle('on', b.dataset.lang === lang);
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    }
    const titleKey = document.documentElement.dataset.titleKey;
    if (titleKey) document.title = t(titleKey);
  }

  function set(next) {
    lang = next === 'zh' ? 'zh' : 'en';
    try {
      localStorage.setItem('c1-lang', lang);
    } catch {
      /* ignore */
    }
    apply();
    for (const fn of listeners) fn(lang);
  }

  // Any element with id="langBtn" toggles the language.
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    for (const b of document.querySelectorAll('[data-lang]')) b.addEventListener('click', () => set(b.dataset.lang));
  });

  // Messages generated by the laptop app arrive in English; translate the known ones.
  function reason(r) {
    return DICT[lang]['rs.' + r] !== undefined || EN['rs.' + r] !== undefined ? t('rs.' + r) : r;
  }
  function problem(p) {
    const m = /^LM35 reading implausible \((-?[\d.]+) °C\)/.exec(p);
    if (m) return t('pb.lm35', { c: m[1] });
    return EN['pb.' + p] !== undefined ? t('pb.' + p) : p;
  }
  function serialError(e) {
    if (!e) return e;
    if (e.startsWith('No Arduino found')) return t('er.noArduino');
    if (e.startsWith('Serial port closed')) return t('er.closed');
    if (e.startsWith('Could not open')) return t('er.open') + (lang === 'en' ? '' : ' (' + e + ')');
    if (e === 'stdin closed') return t('er.stdin');
    if (e.startsWith('serialport package')) return t('er.pkg');
    return e;
  }

  window.I18N = { t, apply, set, reason, problem, serialError, get lang() { return lang; }, onChange: (fn) => listeners.push(fn) };
})();
