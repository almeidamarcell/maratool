/**
 * Wave 5 shared data — 8 special-logic converters (individual JS in src/tools/).
 */

export const SPECIAL = [
  {
    slug: 'mpg-to-l100km', jsFile: 'mpg-to-l100km.js', emoji: '⛽',
    category: 'Converter', sub: 'Unit', catSlug: 'converter', catLabel: 'Converter', subSlug: 'unit', subLabel: 'Unit',
    name: 'MPG to L/100km Converter — Fuel Economy',
    crumb: 'MPG to L/100km',
    title: 'MPG to L/100km Converter — Fuel Economy | maratool',
    desc: 'Convert fuel economy between US MPG, UK MPG, L/100km, and km/L instantly. Free fuel consumption converter that runs entirely in your browser.',
    shellDesc: 'Enter fuel economy in any unit to see US MPG, UK MPG, L/100km, and km/L side by side.',
    appCategory: 'UtilitiesApplication',
    keywords: ['mpg to l/100km', 'l/100km to mpg', 'km/l to mpg', 'uk mpg to us mpg', 'fuel economy converter', 'fuel consumption calculator', 'miles per gallon to liters'],
    howTo: ['Enter your fuel economy value.', 'Pick its unit — US MPG, UK MPG, L/100km, or km/L.', 'Read all four equivalents instantly and copy the summary.'],
    faq: [
      { q: 'Why is MPG to L/100km an inverse conversion?', a: 'MPG measures distance per fuel; L/100km measures fuel per distance. The relation is L/100km = 235.215 ÷ MPG(US) — doubling MPG halves consumption.' },
      { q: 'Why are UK and US MPG different?', a: 'The gallons differ: US 3.785412 L vs imperial 4.54609 L. The same car scores about 20% higher in UK MPG (×1.20095).' },
      { q: 'What is a good fuel economy?', a: 'On the US EPA combined cycle, 30+ MPG (under 7.8 L/100km) is efficient for gasoline cars; hybrids reach 50+ MPG (4.7 L/100km).' },
      { q: 'Is my data sent to a server?', a: 'No. The conversion runs entirely in your browser using exact gallon and mile definitions.' },
    ],
    note: 'Uses the inverse relation L/100km = 235.215 ÷ MPG(US) with exact US gallon (3.785411784 L), imperial gallon (4.54609 L), and mile (1.609344 km) definitions. Reference:',
    ref: 'EPA',
    related: ['unit-converter', 'volume-converter', 'tire-size-calculator'],
    minHeight: 380,
    body: `      <div class="calc-row">
        <div class="calc-field"><label class="tool-label" for="mpg-value">Fuel economy</label><input type="number" id="mpg-value" class="tool-input" placeholder="30" min="0" step="any" /></div>
        <div class="calc-field"><label class="tool-label" for="mpg-unit">Unit</label><select id="mpg-unit" class="tool-input calc-select"><option value="mpgus">MPG (US)</option><option value="mpguk">MPG (UK)</option><option value="l100">L/100km</option><option value="kml">km/L</option></select></div>
      </div>
      <div class="tool-stats">
        <div class="tool-stat"><span class="tool-stat-value" id="mpg-out-mpgus">—</span><span class="tool-stat-label">MPG (US)</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="mpg-out-mpguk">—</span><span class="tool-stat-label">MPG (UK)</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="mpg-out-l100">—</span><span class="tool-stat-label">L/100km</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="mpg-out-kml">—</span><span class="tool-stat-label">km/L</span></div>
      </div>
      <button type="button" id="mpg-copy" class="copy-btn" style="margin-top:1rem;">Copy summary</button>`,
    blog: {
      title: 'How to convert MPG to L/100km (fuel economy)',
      seoTitle: 'MPG to L/100km converter — fuel economy | maratool',
      description: 'Convert US MPG, UK MPG, L/100km, and km/L instantly. Free browser fuel economy converter with exact factors.',
      lead: 'Enter fuel economy in any unit — read US MPG, UK MPG, L/100km, and km/L side by side.',
      og: 'converter.svg', embedTitle: 'Try it — enter a fuel economy value', embedHeight: 460,
      intro: 'US window stickers say MPG, European specs say L/100km, and Asian markets use km/L. The <a href="/mpg-to-l100km">MPG to L/100km Converter</a> shows all four at once — including the often-confused UK MPG.',
      steps: ['<strong>Enter a value</strong> — e.g. 30 MPG or 7.8 L/100km.', '<strong>Pick its unit</strong> — the other three update instantly.', '<strong>Copy</strong> — a one-line summary of all four figures.'],
      sections: [
        { h2: 'The inverse math', body: '<p>MPG and L/100km measure opposite ratios, so the conversion is a division, not a multiplication: L/100km = 235.215 ÷ MPG(US). That constant is 100 × 3.785411784 ÷ 1.609344 — exact gallon and mile definitions per <a href="https://www.fueleconomy.gov/" rel="noopener" target="_blank">fueleconomy.gov</a> and NIST SP 811.</p><p>Because it is inverse, gains are non-linear: going from 15 to 20 MPG saves more fuel per mile than going from 40 to 50 MPG.</p>' },
        { h2: 'UK vs US MPG', body: '<p>An imperial gallon is 4.54609 L against the US 3.785411784 L, so UK MPG figures run 20.095% higher for identical consumption. A UK brochure claiming 50 MPG means 41.6 MPG US — or 5.65 L/100km.</p>' },
      ],
    },
  },
  {
    slug: 'running-pace-calculator', jsFile: 'running-pace-calculator.js', emoji: '🏃',
    category: 'Health', sub: 'Fitness', catSlug: 'health', catLabel: 'Health', subSlug: 'fitness', subLabel: 'Fitness',
    name: 'Running Pace Calculator — Min/km, Min/mile & Race Times',
    crumb: 'Running Pace Calculator',
    title: 'Running Pace Calculator — Min/km & Min/mile | maratool',
    desc: 'Calculate running pace per km and per mile from distance and time, plus projected 5K, 10K, half and marathon finish times. Free, in your browser.',
    shellDesc: 'Enter a distance and time to get pace per km and per mile, speed, and projected race finish times.',
    appCategory: 'HealthApplication',
    keywords: ['running pace calculator', 'pace calculator km', 'min per mile pace', 'marathon pace calculator', '5k pace calculator', 'race time predictor', 'pace per km to pace per mile'],
    howTo: ['Enter the distance you ran and pick km or miles.', 'Enter the time as hours, minutes, and seconds.', 'Read pace per km/mile, speed, and projected race times.'],
    faq: [
      { q: 'How is running pace calculated?', a: 'Pace = time ÷ distance. Running 5 km in 25 minutes gives 25/5 = 5:00 min/km, which is 8:03 min/mile.' },
      { q: 'How do the race projections work?', a: 'They hold your entered pace constant across 5K, 10K, half (21.0975 km) and marathon (42.195 km). Real race times are usually slower at longer distances, so treat them as an optimistic baseline.' },
      { q: 'What is a good 5K pace?', a: 'Recreational runners commonly finish 5K between 25 and 35 minutes — 5:00 to 7:00 min/km. Elite runners go under 3:00 min/km.' },
      { q: 'Is my data sent to a server?', a: 'No. All pace math runs in your browser — nothing is uploaded or stored.' },
    ],
    note: 'Pace is the arithmetic definition time ÷ distance; race projections multiply your pace by official race distances (marathon 42.195 km). Formula shown inline —',
    ref: 'EPA_NONE',
    refInline: true,
    related: ['bmi-calculator', 'age-calculator', 'unit-converter'],
    minHeight: 480,
    body: `      <div class="calc-row">
        <div class="calc-field"><label class="tool-label" for="rpc-dist">Distance</label><input type="number" id="rpc-dist" class="tool-input" placeholder="5" min="0" step="any" /></div>
        <div class="calc-field"><label class="tool-label" for="rpc-unit">Unit</label><select id="rpc-unit" class="tool-input calc-select"><option value="km">Kilometers</option><option value="mi">Miles</option></select></div>
      </div>
      <div class="calc-row" style="grid-template-columns:1fr 1fr 1fr;">
        <div class="calc-field"><label class="tool-label" for="rpc-h">Hours</label><input type="number" id="rpc-h" class="tool-input" placeholder="0" min="0" /></div>
        <div class="calc-field"><label class="tool-label" for="rpc-m">Minutes</label><input type="number" id="rpc-m" class="tool-input" placeholder="25" min="0" /></div>
        <div class="calc-field"><label class="tool-label" for="rpc-s">Seconds</label><input type="number" id="rpc-s" class="tool-input" placeholder="0" min="0" /></div>
      </div>
      <div class="tool-stats">
        <div class="tool-stat"><span class="tool-stat-value" id="rpc-pace-km">—</span><span class="tool-stat-label">Pace /km</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="rpc-pace-mi">—</span><span class="tool-stat-label">Pace /mile</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="rpc-speed-kmh">—</span><span class="tool-stat-label">km/h</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="rpc-speed-mph">—</span><span class="tool-stat-label">mph</span></div>
      </div>
      <p class="tool-label" style="margin:1.25rem 0 0.5rem;">Projected race times at this pace</p>
      <div class="tool-stats">
        <div class="tool-stat"><span class="tool-stat-value" id="rpc-t5">—</span><span class="tool-stat-label">5K</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="rpc-t10">—</span><span class="tool-stat-label">10K</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="rpc-thalf">—</span><span class="tool-stat-label">Half marathon</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="rpc-tfull">—</span><span class="tool-stat-label">Marathon</span></div>
      </div>
      <button type="button" id="rpc-copy" class="copy-btn" style="margin-top:1rem;">Copy summary</button>`,
    blog: {
      title: 'How to calculate your running pace (min/km and min/mile)',
      seoTitle: 'Running pace calculator — min/km, min/mile | maratool',
      description: 'Calculate pace per km and per mile from any run, plus projected 5K, 10K, half, and marathon times. Free browser tool.',
      lead: 'Enter distance and time — get pace per km, per mile, and projected race finishes.',
      og: 'health.svg', embedTitle: 'Try it — distance and time', embedHeight: 560,
      intro: 'Pace is the number runners actually train by. The <a href="/running-pace-calculator">Running Pace Calculator</a> turns any distance + time into min/km and min/mile, then projects 5K through marathon finishes at that pace.',
      steps: ['<strong>Distance</strong> — kilometers or miles.', '<strong>Time</strong> — hours, minutes, seconds.', '<strong>Read pace</strong> — per km, per mile, speed, and race projections.'],
      sections: [
        { h2: 'The formula', body: '<p>Pace = time ÷ distance. A 47:30 10K is 4:45 min/km (47.5 ÷ 10) or 7:39 min/mile. Speed is the inverse: 60 ÷ 4.75 = 12.6 km/h.</p>' },
        { h2: 'Using the projections', body: '<p>Projections hold pace constant, which flatters longer races — most runners slow 5–8% when doubling race distance. Use them to sanity-check goal splits: a 4-hour marathon needs 5:41 min/km, so tempo runs should sit comfortably below that.</p>' },
      ],
    },
  },
  {
    slug: 'wind-speed-converter', jsFile: 'wind-speed-converter.js', emoji: '🌬️',
    category: 'Converter', sub: 'Unit', catSlug: 'converter', catLabel: 'Converter', subSlug: 'unit', subLabel: 'Unit',
    name: 'Wind Speed Converter — Knots, MPH, km/h & Beaufort Scale',
    crumb: 'Wind Speed Converter',
    title: 'Wind Speed Converter — Knots, MPH & Beaufort | maratool',
    desc: 'Convert wind speed between knots, mph, km/h, and m/s and read the Beaufort scale force with description. Free wind converter in your browser.',
    shellDesc: 'Enter a wind speed in any unit to see knots, mph, km/h, m/s, ft/s, and the Beaufort force with description.',
    appCategory: 'UtilitiesApplication',
    keywords: ['knots to mph', 'mph to knots', 'km/h to knots', 'wind speed converter', 'beaufort scale calculator', 'm/s to knots', 'knots to km/h wind'],
    howTo: ['Enter the wind speed value.', 'Pick its unit — knots, mph, km/h, m/s, or ft/s.', 'Read every equivalent plus the Beaufort force and description.'],
    faq: [
      { q: 'How many mph is a knot?', a: 'One knot is one nautical mile per hour: exactly 1.852 km/h, about 1.15078 mph and 0.51444 m/s.' },
      { q: 'What is the Beaufort scale?', a: 'A 0–12 scale mapping wind speed to observed effects, from calm (force 0, under 1 knot) to hurricane force (12, 64+ knots). The bands here follow the NOAA National Weather Service table.' },
      { q: 'At what wind speed should small boats be careful?', a: 'NWS issues small-craft advisories around 22–33 knots (force 6–7). Force 8 (34+ knots) is gale force.' },
      { q: 'Is my data sent to a server?', a: 'No. Conversion and Beaufort lookup run entirely in your browser.' },
    ],
    note: 'Linear conversions use the exact knot definition (1.852 km/h); the Beaufort force is a band lookup per the',
    ref: 'NOAA',
    related: ['unit-converter', 'acceleration-converter', 'mpg-to-l100km'],
    minHeight: 420,
    body: `      <div class="calc-row">
        <div class="calc-field"><label class="tool-label" for="wsc-value">Wind speed</label><input type="number" id="wsc-value" class="tool-input" placeholder="15" min="0" step="any" /></div>
        <div class="calc-field"><label class="tool-label" for="wsc-unit">Unit</label><select id="wsc-unit" class="tool-input calc-select"><option value="kn">Knots (kn)</option><option value="mph">Miles per hour (mph)</option><option value="kmh">Kilometers per hour (km/h)</option><option value="ms">Meters per second (m/s)</option><option value="fts">Feet per second (ft/s)</option></select></div>
      </div>
      <div class="tool-stats">
        <div class="tool-stat"><span class="tool-stat-value" id="wsc-out-kn">—</span><span class="tool-stat-label">Knots</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="wsc-out-mph">—</span><span class="tool-stat-label">mph</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="wsc-out-kmh">—</span><span class="tool-stat-label">km/h</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="wsc-out-ms">—</span><span class="tool-stat-label">m/s</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="wsc-out-fts">—</span><span class="tool-stat-label">ft/s</span></div>
      </div>
      <div class="tool-stats" style="margin-top:0.75rem;">
        <div class="tool-stat"><span class="tool-stat-value" id="wsc-beaufort">—</span><span class="tool-stat-label">Beaufort force</span></div>
        <div class="tool-stat" style="flex:2;"><span class="tool-stat-value" id="wsc-desc" style="font-size:16px;">—</span><span class="tool-stat-label">Description</span></div>
      </div>
      <button type="button" id="wsc-copy" class="copy-btn" style="margin-top:1rem;">Copy summary</button>`,
    blog: {
      title: 'How to convert knots to mph and read the Beaufort scale',
      seoTitle: 'Wind speed converter — knots, mph, Beaufort | maratool',
      description: 'Convert knots, mph, km/h, and m/s and get the Beaufort force with description. Free browser wind speed converter.',
      lead: 'Enter a wind speed in any unit — read every other unit plus the Beaufort force.',
      og: 'converter.svg', embedTitle: 'Try it — enter a wind speed', embedHeight: 520,
      intro: 'Marine forecasts speak knots, land forecasts mph or km/h, and sailing guides speak Beaufort force. The <a href="/wind-speed-converter">Wind Speed Converter</a> translates between all of them at once.',
      steps: ['<strong>Enter speed</strong> — any of knots, mph, km/h, m/s, ft/s.', '<strong>All units update</strong> — exact knot/mile/meter factors.', '<strong>Beaufort readout</strong> — force number and NWS description.'],
      sections: [
        { h2: 'The key factors', body: '<p>1 knot = 1.852 km/h exactly (one nautical mile per hour) = 1.15078 mph = 0.51444 m/s. Aviation and marine wind reports stay in knots worldwide; multiply by 2 for a rough km/h figure.</p>' },
        { h2: 'Beaufort bands', body: '<p>The Beaufort scale maps speed ranges to sea and land effects per the <a href="https://www.weather.gov/mfl/beaufort" rel="noopener" target="_blank">NOAA NWS table</a>: force 4 (11–16 kn) is a moderate breeze, force 6 begins small-craft caution, force 8 is a gale, force 12 (64+ kn) is hurricane force.</p>' },
      ],
    },
  },
  {
    slug: 'due-date-calculator', jsFile: 'due-date-calculator.js', emoji: '🤰',
    category: 'Health', sub: 'Obstetric', catSlug: 'health', catLabel: 'Health', subSlug: 'obstetric', subLabel: 'Obstetric',
    name: 'Pregnancy Due Date Calculator',
    crumb: 'Due Date Calculator',
    title: 'Pregnancy Due Date Calculator — Naegele’s Rule | maratool',
    desc: 'Calculate your pregnancy due date from LMP, conception date, or IVF transfer using Naegele’s rule, plus current gestational age and trimester.',
    shellDesc: 'Estimate the due date from last menstrual period, conception date, or IVF transfer day, with gestational age and trimester milestones.',
    appCategory: 'HealthApplication',
    keywords: ['due date calculator', 'pregnancy due date calculator', 'how many weeks pregnant am i', 'due date by lmp', 'ivf due date calculator', 'conception date calculator', 'gestational age calculator', 'naegele rule'],
    howTo: ['Pick the dating method — LMP, conception date, or IVF transfer.', 'Enter the date (and cycle length for LMP).', 'Read the estimated due date, gestational age today, and trimester milestones.'],
    faq: [
      { q: 'How is the due date calculated from LMP?', a: 'Naegele’s rule: due date = first day of the last menstrual period + 280 days (40 weeks), adjusted by (cycle length − 28) days for longer or shorter cycles, per ACOG Committee Opinion 700.' },
      { q: 'How accurate is the estimated due date?', a: 'Only about 4–5% of babies arrive on the exact date; most are born within two weeks either side. First-trimester ultrasound is the most accurate dating method and takes precedence when it differs.' },
      { q: 'How does IVF dating work?', a: 'Embryo age is known precisely: due date = transfer date + 261 days for a day-5 blastocyst or + 263 days for a day-3 embryo.' },
      { q: 'When do trimesters change?', a: 'Using ACOG convention: second trimester begins at 14w0d, third at 28w0d, and full term runs 39w0d to 40w6d.' },
    ],
    note: 'Implements Naegele’s rule (LMP + 280 days, cycle-adjusted) and standard conception/IVF offsets per',
    ref: 'ACOG',
    extraNote: 'Informational only — not medical advice. Confirm dating with your prenatal care provider; first-trimester ultrasound overrides calendar estimates.',
    related: ['gestational-age-lmp', 'gestational-age-ultrasound', 'age-calculator'],
    minHeight: 460,
    body: `      <div class="calc-row">
        <div class="calc-field"><label class="tool-label" for="ddc-method">Dating method</label><select id="ddc-method" class="tool-input calc-select"><option value="lmp">Last menstrual period (LMP)</option><option value="conception">Conception date</option><option value="ivf5">IVF — day-5 transfer</option><option value="ivf3">IVF — day-3 transfer</option></select></div>
        <div class="calc-field"><label class="tool-label" for="ddc-date">Date</label><input type="date" id="ddc-date" class="tool-input" /></div>
      </div>
      <div class="calc-field" id="ddc-cycle-wrap"><label class="tool-label" for="ddc-cycle">Average cycle length (days)</label><input type="number" id="ddc-cycle" class="tool-input" value="28" min="20" max="45" style="max-width:200px;" /></div>
      <div class="tool-stats">
        <div class="tool-stat" style="flex:1.4;"><span class="tool-stat-value" id="ddc-edd">—</span><span class="tool-stat-label">Estimated due date</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="ddc-ga">—</span><span class="tool-stat-label">Gestational age today</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="ddc-trimester">—</span><span class="tool-stat-label">Trimester</span></div>
      </div>
      <p class="tool-label" style="margin:1.25rem 0 0.5rem;">Milestones</p>
      <div class="tool-stats">
        <div class="tool-stat"><span class="tool-stat-value" id="ddc-t2">—</span><span class="tool-stat-label">2nd trimester (14w0d)</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="ddc-t3">—</span><span class="tool-stat-label">3rd trimester (28w0d)</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="ddc-term">—</span><span class="tool-stat-label">Full term (39w0d)</span></div>
      </div>
      <p id="ddc-msg" style="font-size:13px;color:var(--text-2);margin:1rem 0 0;"></p>`,
    blog: {
      title: 'How to calculate your pregnancy due date (Naegele’s rule)',
      seoTitle: 'Due date calculator — LMP, conception, IVF | maratool',
      description: 'Calculate the due date from LMP, conception, or IVF transfer with Naegele’s rule per ACOG. Free browser calculator.',
      lead: 'Pick a dating method and a date — get the due date, gestational age, and trimester milestones.',
      og: 'health.svg', embedTitle: 'Try it — pick a method and date', embedHeight: 560,
      intro: 'Every due date estimate is calendar math with a documented rule. The <a href="/due-date-calculator">Pregnancy Due Date Calculator</a> implements Naegele’s rule and the standard conception/IVF offsets from ACOG Committee Opinion 700.',
      steps: ['<strong>Method</strong> — LMP, conception date, or IVF transfer day.', '<strong>Date</strong> — plus cycle length if dating by LMP.', '<strong>Results</strong> — due date, weeks + days today, trimester milestones.'],
      sections: [
        { h2: 'The rules', body: '<p>LMP dating: due date = LMP + 280 days, shifted by (cycle − 28) days. Conception dating: + 266 days. IVF: + 261 days from a day-5 transfer, + 263 from day-3. Gestational age counts from LMP, which is why "4 weeks pregnant" happens barely two weeks after conception.</p>' },
        { h2: 'What the estimate means', body: '<p>A due date is the middle of a distribution, not an appointment — roughly 96% of births miss the exact day. Per <a href="https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date" rel="noopener" target="_blank">ACOG CO 700</a>, a first-trimester ultrasound measurement supersedes calendar dating when they disagree. Informational only — confirm with your prenatal provider.</p>' },
      ],
    },
  },
  {
    slug: 'tire-size-calculator', jsFile: 'tire-size-calculator.js', emoji: '🛞',
    category: 'Converter', sub: 'Sizing', catSlug: 'converter', catLabel: 'Converter', subSlug: 'sizing', subLabel: 'Sizing',
    name: 'Tire Size Calculator — Compare Tire Dimensions',
    crumb: 'Tire Size Calculator',
    title: 'Tire Size Calculator — Compare Tire Dimensions | maratool',
    desc: 'Enter a tire size like 205/55R16 to get diameter, sidewall, and circumference — and compare two sizes with speedometer error. Free, in-browser.',
    shellDesc: 'Parse metric tire codes (205/55R16) into real dimensions and compare two sizes including speedometer error.',
    appCategory: 'UtilitiesApplication',
    keywords: ['tire size calculator', '205/55r16 in inches', 'tire size comparison', 'tire diameter calculator', 'speedometer error tire size', 'tire circumference calculator', 'plus sizing tires'],
    howTo: ['Type a tire code such as 205/55R16 (a second tire is optional).', 'Read width, sidewall, diameter, and circumference for each.', 'Compare diameter difference and speedometer error between the two.'],
    faq: [
      { q: 'What does 205/55R16 mean?', a: '205 = section width in mm, 55 = aspect ratio (sidewall is 55% of width), R = radial construction, 16 = wheel diameter in inches. Total diameter = 16×25.4 + 2×(205×0.55) mm.' },
      { q: 'How is speedometer error calculated?', a: 'Speedometers count wheel revolutions. With a new diameter D2, actual speed = indicated × D2/D1 — a 3% larger tire means you travel 3% faster than the gauge shows.' },
      { q: 'How much size difference is acceptable?', a: 'A common rule of thumb keeps the overall diameter within ±3% of stock to protect speedometer accuracy, gearing, and ABS calibration. Check your vehicle documentation.' },
      { q: 'Is my data sent to a server?', a: 'No. Parsing and comparison run entirely in your browser.' },
    ],
    note: 'Dimensions follow the standard metric tire designation (width mm / aspect % R rim inches) defined in',
    ref: 'ISO4000',
    related: ['screen-size-calculator', 'mpg-to-l100km', 'unit-converter'],
    minHeight: 520,
    body: `      <div class="calc-row">
        <div class="calc-field"><label class="tool-label" for="tsc-a">Tire 1</label><input type="text" id="tsc-a" class="tool-input" placeholder="205/55R16" autocomplete="off" spellcheck="false" /></div>
        <div class="calc-field"><label class="tool-label" for="tsc-b">Tire 2 (optional)</label><input type="text" id="tsc-b" class="tool-input" placeholder="225/45R17" autocomplete="off" spellcheck="false" /></div>
      </div>
      <div id="tsc-out-a" hidden>
        <p class="tool-label" style="margin:1rem 0 0.5rem;">Tire 1</p>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="tsc-a-width">—</span><span class="tool-stat-label">Width</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="tsc-a-side">—</span><span class="tool-stat-label">Sidewall</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="tsc-a-diam">—</span><span class="tool-stat-label">Diameter</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="tsc-a-circ">—</span><span class="tool-stat-label">Circumference</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="tsc-a-revs">—</span><span class="tool-stat-label">Revs/km</span></div>
        </div>
      </div>
      <div id="tsc-out-b" hidden>
        <p class="tool-label" style="margin:1rem 0 0.5rem;">Tire 2</p>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="tsc-b-width">—</span><span class="tool-stat-label">Width</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="tsc-b-side">—</span><span class="tool-stat-label">Sidewall</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="tsc-b-diam">—</span><span class="tool-stat-label">Diameter</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="tsc-b-circ">—</span><span class="tool-stat-label">Circumference</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="tsc-b-revs">—</span><span class="tool-stat-label">Revs/km</span></div>
        </div>
      </div>
      <div id="tsc-cmp" hidden>
        <p class="tool-label" style="margin:1rem 0 0.5rem;">Comparison</p>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="tsc-diff">—</span><span class="tool-stat-label">Diameter difference</span></div>
          <div class="tool-stat" style="flex:1.6;"><span class="tool-stat-value" id="tsc-speedo">—</span><span class="tool-stat-label">At indicated 100 km/h you travel</span></div>
        </div>
      </div>
      <p id="tsc-msg" style="font-size:13px;color:var(--text-2);margin:1rem 0 0;">Enter a size like 205/55R16 to see dimensions.</p>`,
    blog: {
      title: 'How to read tire sizes and compare 205/55R16 to another size',
      seoTitle: 'Tire size calculator — compare dimensions | maratool',
      description: 'Parse 205/55R16 into diameter, sidewall, and circumference and compare two sizes with speedometer error. Free browser tool.',
      lead: 'Type a tire code — get real dimensions and a two-size comparison with speedometer error.',
      og: 'converter.svg', embedTitle: 'Try it — enter tire codes', embedHeight: 620,
      intro: 'That string on your sidewall is three numbers in three different units. The <a href="/tire-size-calculator">Tire Size Calculator</a> decodes it into millimeters and inches, then compares any two sizes the way a tire shop would.',
      steps: ['<strong>Tire 1</strong> — e.g. 205/55R16 (your current size).', '<strong>Tire 2</strong> — optional candidate size to compare.', '<strong>Read the diff</strong> — diameter change and speedometer error.'],
      sections: [
        { h2: 'The geometry', body: '<p>Per the <a href="https://www.iso.org/standard/76574.html" rel="noopener" target="_blank">ISO 4000-1 / ETRTO</a> metric designation, sidewall height = width × aspect%, and overall diameter = rim×25.4 + 2×sidewall (all in mm). A 205/55R16 stands 631 mm (24.8″) tall with a 112.8 mm sidewall.</p>' },
        { h2: 'Why the ±3% rule exists', body: '<p>Speedometers, odometers, ABS, and gearing all assume the stock rolling circumference. Moving to a tire 3% larger under-reads speed by 3% and subtly raises effective gearing. The comparison panel shows exactly how far a candidate size drifts.</p>' },
      ],
    },
  },
  {
    slug: 'screen-size-calculator', jsFile: 'screen-size-calculator.js', emoji: '📺',
    category: 'Converter', sub: 'Sizing', catSlug: 'converter', catLabel: 'Converter', subSlug: 'sizing', subLabel: 'Sizing',
    name: 'Screen Size Calculator — TV & Monitor Dimensions',
    crumb: 'Screen Size Calculator',
    title: 'Screen Size Calculator — TV & Monitor Dimensions | maratool',
    desc: 'Turn a diagonal size and aspect ratio into real width, height, area, and PPI for TVs and monitors — inches and centimeters. Free, in-browser.',
    shellDesc: 'Enter a diagonal and aspect ratio to get width, height, and area in inches and centimeters, plus PPI from resolution.',
    appCategory: 'UtilitiesApplication',
    keywords: ['screen size calculator', 'tv dimensions calculator', '55 inch tv dimensions', 'monitor size calculator', 'ppi calculator', 'screen width from diagonal', '16:9 dimensions calculator'],
    howTo: ['Enter the diagonal size in inches.', 'Pick the aspect ratio (16:9 for most TVs and monitors).', 'Optionally add resolution to get PPI; read width, height, and area.'],
    faq: [
      { q: 'How do you get width and height from a diagonal?', a: 'Pythagoras: for ratio w:h, width = diagonal × w/√(w²+h²). A 55″ 16:9 TV is 47.9″ wide and 27.0″ tall — before the bezel.' },
      { q: 'How is PPI calculated?', a: 'PPI = √(horizontal² + vertical² pixels) ÷ diagonal inches. A 27″ 4K monitor is 163 PPI; the same panel at 1080p is 82 PPI.' },
      { q: 'Is a 32:9 ultrawide bigger than two 16:9 monitors?', a: 'A 49″ 32:9 panel has exactly the width and height of two 27″ 16:9 panels side by side (identical pixel pitch at matching resolutions).' },
      { q: 'Is my data sent to a server?', a: 'No. All geometry runs in your browser.' },
    ],
    note: 'Width and height come from the Pythagorean theorem applied to the aspect ratio: width = diagonal × w⁄√(w²+h²); PPI divides the diagonal pixel count by diagonal inches. Methodology shown inline —',
    refInline: true,
    ref: 'EPA_NONE',
    related: ['tire-size-calculator', 'luminance-converter', 'unit-converter'],
    minHeight: 460,
    body: `      <div class="calc-row">
        <div class="calc-field"><label class="tool-label" for="ssc-diag">Diagonal (inches)</label><input type="number" id="ssc-diag" class="tool-input" placeholder="55" min="0" step="any" /></div>
        <div class="calc-field"><label class="tool-label" for="ssc-ratio">Aspect ratio</label><select id="ssc-ratio" class="tool-input calc-select"><option value="16:9">16:9 (TV, monitor)</option><option value="16:10">16:10 (laptop)</option><option value="21:9">21:9 (ultrawide)</option><option value="32:9">32:9 (super ultrawide)</option><option value="4:3">4:3 (classic)</option><option value="3:2">3:2 (Surface)</option><option value="1:1">1:1 (square)</option></select></div>
      </div>
      <div class="calc-row">
        <div class="calc-field"><label class="tool-label" for="ssc-rw">Resolution width (px, optional)</label><input type="number" id="ssc-rw" class="tool-input" placeholder="3840" min="0" /></div>
        <div class="calc-field"><label class="tool-label" for="ssc-rh">Resolution height (px, optional)</label><input type="number" id="ssc-rh" class="tool-input" placeholder="2160" min="0" /></div>
      </div>
      <div class="tool-stats">
        <div class="tool-stat"><span class="tool-stat-value" id="ssc-width">—</span><span class="tool-stat-label">Width</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="ssc-height">—</span><span class="tool-stat-label">Height</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="ssc-area">—</span><span class="tool-stat-label">Area</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="ssc-ppi">—</span><span class="tool-stat-label">PPI</span></div>
      </div>
      <p id="ssc-cm" style="font-size:13px;color:var(--text-2);margin:1rem 0 0;"></p>`,
    blog: {
      title: 'How to calculate TV and monitor dimensions from the diagonal',
      seoTitle: 'Screen size calculator — TV dimensions, PPI | maratool',
      description: 'Get real width, height, area, and PPI from a diagonal and aspect ratio. Free browser screen size calculator.',
      lead: 'Enter a diagonal and aspect ratio — read true width, height, area, and PPI.',
      og: 'converter.svg', embedTitle: 'Try it — diagonal and aspect ratio', embedHeight: 540,
      intro: 'A "55-inch" TV tells you one number — the diagonal. The <a href="/screen-size-calculator">Screen Size Calculator</a> turns it into shelf-fitting width and height, viewing area, and pixel density.',
      steps: ['<strong>Diagonal</strong> — the marketing size in inches.', '<strong>Aspect ratio</strong> — 16:9 unless you know otherwise.', '<strong>Optional resolution</strong> — adds PPI to the readout.'],
      sections: [
        { h2: 'The formula', body: '<p>For ratio w:h, width = diag × w/√(w²+h²) and height = diag × h/√(w²+h²). For 16:9 that means width = 0.8716 × diag and height = 0.4903 × diag — a 65″ TV is 56.7″ × 31.9″ (144 × 81 cm) plus bezel.</p>' },
        { h2: 'Diagonal inflation', body: '<p>Wider ratios pack less area per diagonal inch: a 34″ 21:9 ultrawide has about the same height as a 27″ 16:9 monitor, just stretched sideways. Compare areas, not diagonals, when weighing formats.</p>' },
      ],
    },
  },
  {
    slug: 'clothing-size-converter', jsFile: 'clothing-size-converter.js', emoji: '👗',
    category: 'Converter', sub: 'Sizing', catSlug: 'converter', catLabel: 'Converter', subSlug: 'sizing', subLabel: 'Sizing',
    name: 'Clothing Size Converter — US, EU & UK Dress and Suit Sizes',
    crumb: 'Clothing Size Converter',
    title: 'Clothing Size Converter — US, EU & UK Sizes | maratool',
    desc: 'Convert clothing sizes between US, UK, EU, Italian, and Japanese charts for women’s dresses, men’s suits, and shirts. Free, in your browser.',
    shellDesc: 'Pick a chart and a size you know to read the equivalent in US, UK, EU, Italian, and Japanese sizing.',
    appCategory: 'UtilitiesApplication',
    keywords: ['clothing size converter', 'us to eu size', 'uk to us size dress', 'eu size to us women', 'suit size conversion', 'shirt collar size cm', 'dress size chart international', 'italian size to us'],
    howTo: ['Pick the chart — women’s dress, men’s suit, or men’s shirt collar.', 'Choose the sizing system you know and your size in it.', 'Read the equivalent size in every other system.'],
    faq: [
      { q: 'How reliable are international size conversions?', a: 'They are industry-standard alignments, not guarantees — brands cut differently and vanity sizing shifts over time. Treat the result as the size to try first, and check the brand’s own measurement chart when available.' },
      { q: 'What is the difference between US and UK dress sizes?', a: 'The same garment is numbered 4 higher in the UK: a US 8 is a UK 12. EU sizes run US + 32 (US 8 = EU 40), Italian sizes US + 36.' },
      { q: 'How do men’s suit sizes convert?', a: 'US and UK suit numbers match (chest in inches); EU adds 10 (US 40 = EU 50). Japanese suits use letter-number combos but align with EU numeric sizing here.' },
      { q: 'How do shirt collar sizes work?', a: 'US/UK collars are inches, EU collars centimeters: EU ≈ inches × 2.54 rounded — a 15.5″ collar is EU 39–40.' },
    ],
    note: 'Charts follow common industry alignments on the size-designation framework of',
    ref: 'ISO8559',
    extraNote: 'Sizing varies by brand and cut — use the converted size as a starting point, not a guarantee of fit.',
    related: ['shoe-size-converter', 'hat-size-converter', 'unit-converter'],
    minHeight: 420,
    body: `      <div class="calc-row" style="grid-template-columns:1fr 1fr 1fr;">
        <div class="calc-field"><label class="tool-label" for="csc-chart">Chart</label><select id="csc-chart" class="tool-input calc-select"><option value="dress">Women’s dress</option><option value="suit">Men’s suit / blazer</option><option value="shirt">Men’s shirt (collar)</option></select></div>
        <div class="calc-field"><label class="tool-label" for="csc-region">You know the size in</label><select id="csc-region" class="tool-input calc-select"></select></div>
        <div class="calc-field"><label class="tool-label" for="csc-size">Size</label><select id="csc-size" class="tool-input calc-select"></select></div>
      </div>
      <div class="tool-stats" id="csc-out"></div>
      <p id="csc-msg" style="font-size:13px;color:var(--text-2);margin:1rem 0 0;">Pick a chart, system, and size to see equivalents.</p>`,
    blog: {
      title: 'How to convert clothing sizes between US, EU, and UK',
      seoTitle: 'Clothing size converter — US, EU, UK charts | maratool',
      description: 'Convert women’s dress, men’s suit, and shirt sizes across US, UK, EU, IT, and JP systems. Free browser converter.',
      lead: 'Pick the size you know — read its equivalent in every other sizing system.',
      og: 'converter.svg', embedTitle: 'Try it — pick a chart and size', embedHeight: 480,
      intro: 'A US 8 dress is a UK 12, an EU 40, an Italian 44, and a Japanese 13 — same garment, five numbers. The <a href="/clothing-size-converter">Clothing Size Converter</a> keeps the international charts straight for dresses, suits, and shirts.',
      steps: ['<strong>Chart</strong> — women’s dress, men’s suit, or shirt collar.', '<strong>Known size</strong> — pick the system and number you wear.', '<strong>Equivalents</strong> — read all other systems at once.'],
      sections: [
        { h2: 'The offsets', body: '<p>Women’s dresses: UK = US + 4, EU = US + 32, IT = US + 36, JP = US + 5. Men’s suits: UK = US (both chest inches), EU = US + 10. Shirt collars: EU cm ≈ US inches × 2.54. These alignments sit on the size-designation framework of <a href="https://www.iso.org/standard/61686.html" rel="noopener" target="_blank">ISO 8559-1</a>.</p>' },
        { h2: 'Why fit still varies', body: '<p>Size numbers designate body dimensions, but brands add different ease and follow vanity-sizing drift. Between two candidate sizes, the garment’s own cm measurements beat any chart — convert here, then verify against the brand table.</p>' },
      ],
    },
  },
  {
    slug: 'hat-size-converter', jsFile: 'hat-size-converter.js', emoji: '🎩',
    category: 'Converter', sub: 'Sizing', catSlug: 'converter', catLabel: 'Converter', subSlug: 'sizing', subLabel: 'Sizing',
    name: 'Hat Size Converter — US, UK & CM',
    crumb: 'Hat Size Converter',
    title: 'Hat Size Converter — US, UK, CM & S/M/L | maratool',
    desc: 'Convert hat sizes between head circumference in cm or inches, US and UK numeric sizes, and S/M/L letters. Free hat size converter in your browser.',
    shellDesc: 'Enter head circumference or a US/UK hat size to read every equivalent, including S/M/L letter sizing.',
    appCategory: 'UtilitiesApplication',
    keywords: ['hat size converter', 'hat size chart', 'us hat size to cm', 'uk hat size', 'head circumference hat size', '7 1/4 hat size in cm', 'fitted hat size chart'],
    howTo: ['Measure around your head just above the ears and brow.', 'Enter the circumference in cm or inches (or a US/UK size).', 'Read the US, UK, metric, and letter-size equivalents.'],
    faq: [
      { q: 'How do I measure my head for a hat?', a: 'Wrap a soft tape around the widest part — about 1 cm above the ears and across the mid-forehead. Keep it snug but not tight; measure twice.' },
      { q: 'How are US numeric hat sizes defined?', a: 'US size = head circumference in inches ÷ π, rounded to the nearest eighth — a 23″ head is size 7 3/8. UK sizes run 1/8 smaller for the same head.' },
      { q: 'What size is a 58 cm head?', a: '58 cm is 22.8″ — US 7 1/4, UK 7 1/8, or a Large in most S/M/L brands.' },
      { q: 'Is my data sent to a server?', a: 'No. All sizing math runs in your browser.' },
    ],
    note: 'Uses traditional millinery sizing: US size = circumference in inches ÷ π (UK size = US − 1/8), with S–XL bands by circumference. Formula shown inline —',
    refInline: true,
    ref: 'EPA_NONE',
    related: ['clothing-size-converter', 'shoe-size-converter', 'unit-converter'],
    minHeight: 400,
    body: `      <div class="calc-row">
        <div class="calc-field"><label class="tool-label" for="hsc-type">I know</label><select id="hsc-type" class="tool-input calc-select"><option value="cm">Head circumference (cm)</option><option value="in">Head circumference (inches)</option><option value="us">US hat size</option><option value="uk">UK hat size</option></select></div>
        <div class="calc-field"><label class="tool-label" for="hsc-value">Value</label><input type="number" id="hsc-value" class="tool-input" placeholder="58" min="0" step="any" /></div>
      </div>
      <div class="tool-stats">
        <div class="tool-stat"><span class="tool-stat-value" id="hsc-cm">—</span><span class="tool-stat-label">Circumference (cm)</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="hsc-in">—</span><span class="tool-stat-label">Circumference (in)</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="hsc-us">—</span><span class="tool-stat-label">US size</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="hsc-uk">—</span><span class="tool-stat-label">UK size</span></div>
        <div class="tool-stat"><span class="tool-stat-value" id="hsc-letter">—</span><span class="tool-stat-label">Letter size</span></div>
      </div>
      <p id="hsc-msg" style="font-size:13px;color:var(--text-2);margin:1rem 0 0;">US sizes step in eighths (6 3/4 – 8). Enter e.g. 7.25 for 7 1/4.</p>`,
    blog: {
      title: 'How to find your hat size from head circumference',
      seoTitle: 'Hat size converter — US, UK, cm, S/M/L | maratool',
      description: 'Convert head circumference to US and UK hat sizes and S/M/L letters. Free browser hat size converter.',
      lead: 'Measure your head, type the number — read US, UK, cm, inch, and letter sizes.',
      og: 'converter.svg', embedTitle: 'Try it — enter a head measurement', embedHeight: 460,
      intro: 'Fitted hats use a numbering system most people meet exactly once — while buying a hat. The <a href="/hat-size-converter">Hat Size Converter</a> turns a tape measurement into US eighths, UK sizes, and S/M/L letters.',
      steps: ['<strong>Measure</strong> — around the head, 1 cm above the ears.', '<strong>Enter</strong> — cm, inches, or a known US/UK size.', '<strong>Read</strong> — every system, including letter sizes.'],
      sections: [
        { h2: 'The formula', body: '<p>Traditional millinery sizing divides head circumference in inches by π and rounds to the nearest eighth: a 22.75″ (57.8 cm) head → 22.75/3.1416 = 7.24 → size 7 1/4 US. UK sizes sit exactly one eighth lower.</p>' },
        { h2: 'Letter sizes', body: '<p>Common bands: S = 55–56 cm, M = 57–58 cm, L = 59–60 cm, XL = 61–62 cm. Between sizes? Go up — most fitted hats shrink slightly and sweatbands can be padded.</p>' },
      ],
    },
  },
]
