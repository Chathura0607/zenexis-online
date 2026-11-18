const fs = require('fs');
const path = require('path');

function createSimplePDF(title, subtitle, sections, filename) {
  const objects = [];

  function addObject(content) {
    objects.push(content);
    return objects.length;
  }

  // 1: Catalog
  addObject(`<< /Type /Catalog /Pages 2 0 R >>`);
  // 2: Pages placeholder
  addObject('');
  // 3: Font Helvetica
  addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
  // 4: Font Helvetica-Bold
  addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);
  // 5: Font Helvetica-Oblique
  addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>`);

  // Build stream content
  let stream = '';
  // Top Header Banner
  stream += '0.05 0.15 0.3 rg\n';
  stream += '40 760 515 50 re f\n';

  // Header Title
  stream += 'BT\n/F2 15 Tf\n1 1 1 rg\n55 788 Td\n(ZENEXIS ONLINE - AMBALANGODA) Tj\nET\n';
  stream += 'BT\n/F1 8.5 Tf\n0.8 0.9 1 rg\n55 770 Td\n(Free Educational Study Resource | Official Download from zenexismart.com) Tj\nET\n';

  // Document Title
  stream += 'BT\n/F2 13 Tf\n0.1 0.15 0.25 rg\n40 725 Td\n(' + escapePDF(title) + ') Tj\nET\n';
  if (subtitle) {
    stream += 'BT\n/F3 9.5 Tf\n0.3 0.4 0.5 rg\n40 708 Td\n(' + escapePDF(subtitle) + ') Tj\nET\n';
  }

  // Divider line
  stream += '0.2 0.6 0.8 RG\n1.5 w\n40 695 m 555 695 l S\n';

  // Sections
  let y = 672;
  for (const sec of sections) {
    if (y < 125) break;
    if (sec.heading) {
      stream += 'BT\n/F2 10.5 Tf\n0.05 0.3 0.6 rg\n40 ' + y + ' Td\n(' + escapePDF(sec.heading) + ') Tj\nET\n';
      y -= 15;
    }
    if (sec.lines) {
      stream += 'BT\n/F1 9 Tf\n0.15 0.15 0.15 rg\n';
      let first = true;
      for (const line of sec.lines) {
        if (first) {
          stream += '40 ' + y + ' Td\n';
          first = false;
        } else {
          stream += '0 -12 Td\n';
        }
        stream += '(' + escapePDF(line) + ') Tj\n';
        y -= 12;
      }
      stream += 'ET\n';
      y -= 7;
    }
  }

  // Footer box
  stream += '0.95 0.97 0.99 rg\n40 38 515 48 re f\n';
  stream += '0.8 0.85 0.9 RG\n0.8 w\n40 38 515 48 re S\n';
  stream += 'BT\n/F2 9 Tf\n0.1 0.2 0.4 rg\n50 68 Td\n(ZENEXIS ONLINE SHOWROOM - AMBALANGODA) Tj\nET\n';
  stream += 'BT\n/F1 8 Tf\n0.3 0.35 0.4 rg\n50 55 Td\n(School Books, Stationery, Past Papers, Computer Accessories & Gift Items) Tj\nET\n';
  stream += 'BT\n/F1 8 Tf\n0.05 0.5 0.3 rg\n50 44 Td\n(WhatsApp Inquiries & Orders: 070 112 0945 / 077 724 4554 | Web: https://zenexismart.com) Tj\nET\n';

  const streamBuf = Buffer.from(stream, 'utf-8');
  const contentObj = addObject(`<< /Length ${streamBuf.length} >>\nstream\n${stream}\nendstream`);
  const pageObj = addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentObj} 0 R >>`);

  // Update Pages (Obj 2)
  objects[1] = `<< /Type /Pages /Kids [${pageObj} 0 R] /Count 1 >>`;

  let pdf = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const xref = [];
  xref.push('0000000000 65535 f \n');

  for (let i = 0; i < objects.length; i++) {
    const offset = Buffer.byteLength(pdf, 'utf-8');
    xref.push(String(offset).padStart(10, '0') + ' 00000 n \n');
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const startxref = Buffer.byteLength(pdf, 'utf-8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  for (const entry of xref) {
    pdf += entry;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  const outDir = path.join(__dirname, '../public/downloads');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, Buffer.from(pdf, 'utf-8'));
  console.log(`Generated: ${filename} (${fs.statSync(outPath).size} bytes)`);
}

function escapePDF(str) {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

const resources = [
  {
    filename: 'grade-10-science-2024.pdf',
    title: '2024 Grade 10 Science 2nd Term Evaluation Paper',
    subtitle: 'Southern Province Department of Education - Model Paper with Answers',
    sections: [
      {
        heading: 'PART I - Multiple Choice Questions',
        lines: [
          '1. Which organelle is recognized as the powerhouse of eukaryotic cells?',
          '   (A) Ribosome      (B) Mitochondria   (C) Golgi Complex  (D) Nucleolus    [Ans: B]',
          '2. The standard SI unit for electric current is:',
          '   (A) Coulomb (C)   (B) Ampere (A)     (C) Volt (V)       (D) Ohm (Omega)  [Ans: B]',
          '3. What is the chemical formula of Sodium Chloride (Common Salt)?',
          '   (A) NaCl          (B) NaOH           (C) Na2CO3         (D) NaHCO3       [Ans: A]'
        ]
      },
      {
        heading: 'PART II - Structured Short Questions',
        lines: [
          '4. State the Law of Conservation of Energy: Energy cannot be created or destroyed,',
          '   it can only be transformed from one form to another.',
          '5. Write the chemical equation for the reaction of Hydrochloric acid with Magnesium:',
          '   Mg + 2HCl -> MgCl2 + H2 (Hydrogen gas)',
          '6. A body travels 150m in 5 seconds. Calculate its average speed: Speed = 150/5 = 30 m/s'
        ]
      },
      {
        heading: 'Marking Scheme & Study Guidance',
        lines: [
          'Review plant & animal cell diagrams, Newton\'s laws, and pH scale values before exam.',
          'Printed full copies and stationery available at Zenexis Online Ambalangoda.'
        ]
      }
    ]
  },
  {
    filename: 'grade-11-maths-model-2024.pdf',
    title: '2024 Grade 11 Mathematics 3rd Term Model Examination',
    subtitle: 'Target Paper for G.C.E. O/L Candidates with Step-by-Step Solutions',
    sections: [
      {
        heading: 'SECTION A - Short Mathematical Problems',
        lines: [
          '1. Solve the quadratic equation: x^2 - 7x + 12 = 0  -> (x - 3)(x - 4) = 0 => x = 3 or x = 4',
          '2. Find the 10th term of the arithmetic progression 3, 7, 11, 15...:',
          '   Tn = a + (n - 1)d = 3 + (10 - 1)*4 = 3 + 36 = 39',
          '3. Express log_10(1000) in numeric value: 10^3 = 1000 => log_10(1000) = 3'
        ]
      },
      {
        heading: 'SECTION B - Geometry & Mensuration',
        lines: [
          '4. Theorem: Angle in a semi-circle is a right angle (90 degrees).',
          '5. Calculate the curved surface area of a cylinder with radius 7cm and height 10cm:',
          '   Area = 2 * pi * r * h = 2 * (22/7) * 7 * 10 = 440 cm^2',
          '6. Probability of rolling an odd prime number on a fair 6-sided die: {3, 5} => P = 2/6 = 1/3'
        ]
      },
      {
        heading: 'Exam Tips from Zenexis Education Desk',
        lines: [
          'Always double-check algebraic factorization and include units (cm, m2, s) in answers.',
          'Mathematical instrument boxes, graph sheets, and calculators available at Zenexis.'
        ]
      }
    ]
  },
  {
    filename: 'ol-history-short-notes.pdf',
    title: 'G.C.E. O/L History Fast Revision Short Notes (Grades 10-11)',
    subtitle: 'Complete Summary of Sri Lankan & World History Milestones with Map Guidelines',
    sections: [
      {
        heading: '1. Anuradhapura & Polonnaruwa Hydraulic Civilization',
        lines: [
          '- King Pandukabhaya: Founded Anuradhapura city; established Abhayawapi (Basawakkulama).',
          '- King Devanampiyatissa: Arrival of Arahat Mahinda Thero (247 BC) and introduction of Buddhism.',
          '- King Dhatusena: Constructed Kala Wewa & Yoda Ela canal system to supply Tissa Wewa.',
          '- King Parakramabahu I: United the island; constructed the great Parakrama Samudraya.'
        ]
      },
      {
        heading: '2. Colonial Era & Independence Movement',
        lines: [
          '- 1505: Portuguese arrival | 1658: Dutch takeover | 1796: British maritime occupation.',
          '- 1815: Kandyan Convention signed on March 2, leading to complete British rule.',
          '- 1818 & 1848: Great Freedom Struggles led by Keppetipola Disawe and Gongalegoda Banda.',
          '- 1948: Dominion Independence granted on February 4.'
        ]
      },
      {
        heading: '3. Compulsory Map Locations for O/L Exam',
        lines: [
          'Gokanna (Trincomalee), Mahatittha (Manthai), Jambukola Pattana, Vijithapura, Dighavapi.'
        ]
      }
    ]
  },
  {
    filename: 'ol-science-formulas.pdf',
    title: 'G.C.E. O/L Science Comprehensive Formula & Constant Sheet',
    subtitle: 'Physics Equations, Chemistry Units & Periodic Table Essentials',
    sections: [
      {
        heading: 'Physics Formulas to Remember',
        lines: [
          '- Speed & Velocity: v = s / t  | Acceleration: a = (v - u) / t',
          '- Equations of Linear Motion: v = u + at | s = ut + 0.5*a*t^2 | v^2 = u^2 + 2as',
          '- Force & Momentum: F = ma  | Work Done: W = F * s | Power: P = W / t = V * I',
          '- Ohm\'s Law: V = I * R  | Electrical Energy: E = V * I * t = I^2 * R * t',
          '- Pressure: P = F / A  | Liquid Pressure: P = h * rho * g'
        ]
      },
      {
        heading: 'Chemistry Activity Series & Constants',
        lines: [
          '- Activity Series: K > Na > Ca > Mg > Al > Zn > Fe > Pb > (H) > Cu > Ag > Au',
          '- Concentration of Solutions: c = n / V (mol/dm3)',
          '- Periodic Table Groups: Group 1 (Alkali metals), Group 7 (Halogens), Group 8 (Noble gases).'
        ]
      },
      {
        heading: 'Zenexis Student Service',
        lines: [
          'Keep this sheet pinned above your study desk for daily morning formula memorization!'
        ]
      }
    ]
  },
  {
    filename: 'al-combined-maths-formulas.pdf',
    title: 'G.C.E. A/L Combined Mathematics Quick Revision Formula Book',
    subtitle: 'Pure Maths & Applied Maths Essential Identities, Calculus & Statics',
    sections: [
      {
        heading: 'Trigonometry & Complex Numbers',
        lines: [
          '- sin(A +/- B) = sinA cosB +/- cosA sinB  | cos(A +/- B) = cosA cosB -/+ sinA sinB',
          '- tan(A +/- B) = (tanA +/- tanB) / (1 -/+ tanA tanB)',
          '- de Moivre\'s Theorem: (cos(theta) + i*sin(theta))^n = cos(n*theta) + i*sin(n*theta)'
        ]
      },
      {
        heading: 'Calculus (Differentiation & Integration)',
        lines: [
          '- d/dx [sin(x)] = cos(x) | d/dx [cos(x)] = -sin(x) | d/dx [e^(kx)] = k * e^(kx)',
          '- Integration by Parts: int(u * dv) = u * v - int(v * du)',
          '- Standard Integral: int(1 / (a^2 + x^2)) dx = (1/a) * arctan(x/a) + C'
        ]
      },
      {
        heading: 'Applied Mathematics (Mechanics & Statics)',
        lines: [
          '- Projectiles: Max height H = (u^2 * sin^2(a)) / (2g) | Range R = (u^2 * sin(2a)) / g',
          '- Friction: F_max = mu * R | Work Energy Principle: Delta K.E. = Net Work Done'
        ]
      }
    ]
  },
  {
    filename: 'ol-english-past-2023.pdf',
    title: 'G.C.E. O/L English Language Examination Revision Pack (2023)',
    subtitle: 'Department of Examinations Standard Model Paper with Answers & Essay Guide',
    sections: [
      {
        heading: 'TEST 1 - Vocabulary & Matching',
        lines: [
          'Match words with definitions: (1) Sustainable (2) Innovation (3) Diligent (4) Perseverance',
          'Answers: 1-Capable of continuing over time, 2-New method or idea, 3-Hardworking, 4-Persistence.'
        ]
      },
      {
        heading: 'TEST 2 - Prepositions & Conjunctions',
        lines: [
          'Fill in blanks: "She arrived (at/in) the station (on/in) time (despite/although) heavy rain."',
          'Correct Answer: "She arrived at the station on time despite heavy rain."'
        ]
      },
      {
        heading: 'TEST 3 - Formal Letter Writing Template',
        lines: [
          'Structure: Sender Address -> Date -> Receiver Address -> Salutation -> Subject line ->',
          'Body (Reason, Details, Expected Action) -> Formal sign-off ("Yours faithfully").'
        ]
      },
      {
        heading: 'Official Advice',
        lines: [
          'Pay careful attention to subject-verb agreement and punctuation for maximum score.'
        ]
      }
    ]
  },
  {
    filename: 'kids-sinhala-english-tracing.pdf',
    title: 'Kids Sinhala Hodiya & English Alphabet Tracing Practice Pack',
    subtitle: 'Printable Handwriting Worksheets for Preschool, Kindergarten & Grade 1-2',
    sections: [
      {
        heading: 'Sinhala Vowel & Consonant Tracing (අ ආ ඇ ඈ ඉ ඊ / ක ඛ ග ඝ ඞ)',
        lines: [
          'Dot-tracing exercise: Follow the arrows with pencil to master letter curves.',
          'Practice 1: [ . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ]',
          'Practice 2: [ . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ]'
        ]
      },
      {
        heading: 'English Alphabet Letters (A B C D E F G - a b c d e f g)',
        lines: [
          'Trace Uppercase: A  B  C  D  E  F  G  H  I  J  K  L  M  N  O  P  Q  R  S  T  U  V  W  X  Y  Z',
          'Trace Lowercase: a  b  c  d  e  f  g  h  i  j  k  l  m  n  o  p  q  r  s  t  u  v  w  x  y  z',
          'Line tracing fun: [ ------------------------------------------------------------- ]'
        ]
      },
      {
        heading: 'Parents Note from Zenexis Kids World',
        lines: [
          'Print on A4 papers. Pastel colors, color pencils, and tracing books available at Zenexis Showroom!'
        ]
      }
    ]
  },
  {
    filename: 'kids-coloring-pack.pdf',
    title: 'Zenexis Kids Cute Animals & Cartoon Coloring Book',
    subtitle: 'Printable High-Resolution Coloring Templates for Creative Little Minds',
    sections: [
      {
        heading: 'Animal Kingdom Coloring Outlines',
        lines: [
          'Page 1: The Friendly Lion in the Savannah (Color Mane: Orange/Brown, Body: Yellow)',
          'Page 2: Playful Dolphins in the Ocean (Color Waves: Cyan/Blue, Dolphins: Grey/Blue)',
          'Page 3: Happy Little Elephant with Flowers (Color Elephant: Slate Grey, Flowers: Pink/Red)'
        ]
      },
      {
        heading: 'Vehicles & Adventure Outlines',
        lines: [
          'Page 4: The School Bus on the Sunshine Road (Color Bus: Yellow, Wheels: Black)',
          'Page 5: Space Rocket flying to the Moon and Stars (Color Rocket: Red/White, Stars: Gold)'
        ]
      },
      {
        heading: 'Zenexis Ambalangoda School Stationery',
        lines: [
          'Atlas Color Pencils, Faber-Castell Oil Pastels & Drawing Books in stock with COD delivery!'
        ]
      }
    ]
  },
  {
    filename: 'grade-8-english-2024.pdf',
    title: '2024 Grade 8 English 2nd Term Evaluation Paper',
    subtitle: 'Southern Province Department of Education - Reading, Grammar & Writing',
    sections: [
      {
        heading: 'PART A - Reading Comprehension',
        lines: [
          'Read the paragraph about the Sinharaja Rain Forest and answer questions 1-5:',
          'Sinharaja is Sri Lanka\'s last viable primary tropical rainforest. It is a UNESCO World Heritage site.',
          'Q1: Where is Sinharaja located? [Answer: Southwest lowland wet zone of Sri Lanka]',
          'Q2: What international status was granted to Sinharaja? [Answer: UNESCO World Heritage Site]'
        ]
      },
      {
        heading: 'PART B - Grammar & Vocabulary',
        lines: [
          'Change the following sentence into the Passive Voice:',
          '"The student completed the assignment." -> "The assignment was completed by the student."',
          'Give the opposite of: (a) Ancient [Modern]  (b) Diligent [Lazy]  (c) Frequent [Rare]'
        ]
      },
      {
        heading: 'Zenexis Education Guidance',
        lines: [
          'Practicing provincial papers builds confidence for end-of-term examinations.'
        ]
      }
    ]
  }
];

for (const res of resources) {
  createSimplePDF(res.title, res.subtitle, res.sections, res.filename);
}

console.log('All 9 educational PDF documents successfully generated!');
