export interface ProgramColorConfig {
  codigo: string;
  nombre: string;
  nombreCorto: string;
  colorHex: string;
  colorBgLight: string;
  colorBorder: string;
  colorText: string;
  tailwindColor: string;
}

export const PROGRAM_COLORS: Record<string, ProgramColorConfig> = {
  // CNOF Programs
  'C0714-2-001': {
    codigo: 'C0714-2-001',
    nombre: 'Fabricación de Prendas de Vestir',
    nombreCorto: 'Prendas de Vestir',
    colorHex: '#e11d48', // Rose 600
    colorBgLight: '#ffe4e6',
    colorBorder: '#f43f5e',
    colorText: '#be123c',
    tailwindColor: 'rose',
  },
  'G2145-1-001': {
    codigo: 'G2145-1-001',
    nombre: 'Mecánica de Motos y Vehículos Afines',
    nombreCorto: 'Mecánica de Motos',
    colorHex: '#2563eb', // Blue 600
    colorBgLight: '#dbeafe',
    colorBorder: '#3b82f6',
    colorText: '#1d4ed8',
    tailwindColor: 'blue',
  },
  'I2556-2-001': {
    codigo: 'I2556-2-001',
    nombre: 'Cocina',
    nombreCorto: 'Cocina',
    colorHex: '#ea580c', // Orange 600
    colorBgLight: '#ffedd5',
    colorBorder: '#f97316',
    colorText: '#c2410c',
    tailwindColor: 'orange',
  },
  'J2662-2-001': {
    codigo: 'J2662-2-001',
    nombre: 'Redes y Comunicaciones',
    nombreCorto: 'Redes y Comunicaciones',
    colorHex: '#0284c7', // Sky 600
    colorBgLight: '#e0f2fe',
    colorBorder: '#38bdf8',
    colorText: '#0369a1',
    tailwindColor: 'sky',
  },
  'J2662-2-002': {
    codigo: 'J2662-2-002',
    nombre: 'Plataformas y Servicios TI',
    nombreCorto: 'Plataformas TI',
    colorHex: '#0d9488', // Teal 600
    colorBgLight: '#ccfbf1',
    colorBorder: '#14b8a6',
    colorText: '#0f766e',
    tailwindColor: 'teal',
  },
  'S3496-1-001': {
    codigo: 'S3496-1-001',
    nombre: 'Peluquería y Barbería',
    nombreCorto: 'Peluquería y Barbería',
    colorHex: '#7c3aed', // Violet 600
    colorBgLight: '#ede9fe',
    colorBorder: '#8b5cf6',
    colorText: '#6d28d9',
    tailwindColor: 'violet',
  },
  'S3496-2-001': {
    codigo: 'S3496-2-001',
    nombre: 'Estilismo',
    nombreCorto: 'Estilismo',
    colorHex: '#c026d3', // Fuchsia 600
    colorBgLight: '#fae8ff',
    colorBorder: '#e879f9',
    colorText: '#a21caf',
    tailwindColor: 'fuchsia',
  },
  'M2982-1-002': {
    codigo: 'M2982-1-002',
    nombre: 'Apoyo Administrativo',
    nombreCorto: 'Apoyo Administrativo',
    colorHex: '#d97706', // Amber 600
    colorBgLight: '#fef3c7',
    colorBorder: '#f59e0b',
    colorText: '#b45309',
    tailwindColor: 'amber',
  },
  'C0714-1-004': {
    codigo: 'C0714-1-004',
    nombre: 'Costura y Acabados',
    nombreCorto: 'Costura y Acabados',
    colorHex: '#db2777', // Pink 600
    colorBgLight: '#fce7f3',
    colorBorder: '#f472b6',
    colorText: '#be185d',
    tailwindColor: 'pink',
  },
  'J2662-1-001': {
    codigo: 'J2662-1-001',
    nombre: 'Soporte Técnico TI',
    nombreCorto: 'Soporte Técnico',
    colorHex: '#4f46e5', // Indigo 600
    colorBgLight: '#e0e7ff',
    colorBorder: '#818cf8',
    colorText: '#4338ca',
    tailwindColor: 'indigo',
  },

  // Legacy aliases
  'CAL-01': {
    codigo: 'CAL-01',
    nombre: 'Corte y Ensamblaje de Calzado',
    nombreCorto: 'Calzado',
    colorHex: '#d97706',
    colorBgLight: '#fef3c7',
    colorBorder: '#f59e0b',
    colorText: '#b45309',
    tailwindColor: 'amber',
  },
  'MEC-02': {
    codigo: 'MEC-02',
    nombre: 'Mecánica de Motos y Vehículos Afines',
    nombreCorto: 'Mecánica de Motos',
    colorHex: '#2563eb',
    colorBgLight: '#dbeafe',
    colorBorder: '#3b82f6',
    colorText: '#1d4ed8',
    tailwindColor: 'blue',
  },
  'PAN-03': {
    codigo: 'PAN-03',
    nombre: 'Asistencia en Panadería y Pastelería',
    nombreCorto: 'Panadería',
    colorHex: '#ea580c',
    colorBgLight: '#ffedd5',
    colorBorder: '#f97316',
    colorText: '#c2410c',
    tailwindColor: 'orange',
  },
  'SOL-04': {
    codigo: 'SOL-04',
    nombre: 'Soldadura y Forja',
    nombreCorto: 'Soldadura',
    colorHex: '#dc2626',
    colorBgLight: '#fee2e2',
    colorBorder: '#ef4444',
    colorText: '#b91c1c',
    tailwindColor: 'red',
  },
  'MAD-05': {
    codigo: 'MAD-05',
    nombre: 'Fabricación de Muebles de Madera',
    nombreCorto: 'Muebles de Madera',
    colorHex: '#059669',
    colorBgLight: '#d1fae5',
    colorBorder: '#10b981',
    colorText: '#047857',
    tailwindColor: 'emerald',
  },
  'PEL-06': {
    codigo: 'PEL-06',
    nombre: 'Peluquería y Barbería',
    nombreCorto: 'Peluquería y Barbería',
    colorHex: '#7c3aed',
    colorBgLight: '#ede9fe',
    colorBorder: '#8b5cf6',
    colorText: '#6d28d9',
    tailwindColor: 'violet',
  },
  'TEX-07': {
    codigo: 'TEX-07',
    nombre: 'Patronaje y Confección Textil',
    nombreCorto: 'Confección Textil',
    colorHex: '#e11d48',
    colorBgLight: '#ffe4e6',
    colorBorder: '#f43f5e',
    colorText: '#be123c',
    tailwindColor: 'rose',
  },
};

export const PROGRAM_LIST = Object.values(PROGRAM_COLORS);

const COLOR_MAP_BY_NAME: Record<string, ProgramColorConfig> = {
  amber: PROGRAM_COLORS['M2982-1-002'],
  yellow: PROGRAM_COLORS['M2982-1-002'],
  blue: PROGRAM_COLORS['G2145-1-001'],
  sky: PROGRAM_COLORS['J2662-2-001'],
  indigo: PROGRAM_COLORS['J2662-1-001'],
  orange: PROGRAM_COLORS['I2556-2-001'],
  red: PROGRAM_COLORS['C0714-2-001'],
  teal: PROGRAM_COLORS['J2662-2-002'],
  emerald: PROGRAM_COLORS['J2662-2-002'],
  green: PROGRAM_COLORS['J2662-2-002'],
  violet: PROGRAM_COLORS['S3496-1-001'],
  purple: PROGRAM_COLORS['S3496-1-001'],
  fuchsia: PROGRAM_COLORS['S3496-2-001'],
  rose: PROGRAM_COLORS['C0714-2-001'],
  pink: PROGRAM_COLORS['C0714-1-004'],
};

export function getProgramColor(identifier?: string, fallbackColor?: string): ProgramColorConfig {
  if (!identifier && !fallbackColor) {
    return PROGRAM_COLORS['G2145-1-001'];
  }

  // 1. Direct code lookup
  if (identifier && PROGRAM_COLORS[identifier]) {
    return PROGRAM_COLORS[identifier];
  }

  // 2. Lookup by code inside identifier (e.g. C0714, G2145, I2556, J2662, S3496, M2982)
  const idUpper = (identifier || '').toUpperCase();
  for (const [code, cfg] of Object.entries(PROGRAM_COLORS)) {
    if (idUpper.includes(code)) return cfg;
  }

  // 3. Keyword matching in identifier (name / short text)
  const lower = (identifier || '').toLowerCase();
  if (lower.includes('estilism') || lower.includes('cosmeto')) {
    return PROGRAM_COLORS['S3496-2-001'];
  }
  if (lower.includes('peluquer') || lower.includes('barber')) {
    return PROGRAM_COLORS['S3496-1-001'];
  }
  if (lower.includes('plataforma') || lower.includes('servicios ti') || lower.includes('software') || lower.includes('computo') || lower.includes('sistemas')) {
    return PROGRAM_COLORS['J2662-2-002'];
  }
  if (lower.includes('redes') || lower.includes('comunicac')) {
    return PROGRAM_COLORS['J2662-2-001'];
  }
  if (lower.includes('mecanic') || lower.includes('moto') || lower.includes('vehic')) {
    return PROGRAM_COLORS['G2145-1-001'];
  }
  if (lower.includes('cocina') || lower.includes('gastronom') || lower.includes('culinar')) {
    return PROGRAM_COLORS['I2556-2-001'];
  }
  if (lower.includes('prenda') || lower.includes('vestir') || lower.includes('textil') || lower.includes('confecc')) {
    return PROGRAM_COLORS['C0714-2-001'];
  }
  if (lower.includes('administra') || lower.includes('apoyo') || lower.includes('secretar') || lower.includes('contab')) {
    return PROGRAM_COLORS['M2982-1-002'];
  }
  if (lower.includes('costura') || lower.includes('acabado')) {
    return PROGRAM_COLORS['C0714-1-004'];
  }
  if (lower.includes('soporte') || lower.includes('tecnico')) {
    return PROGRAM_COLORS['J2662-1-001'];
  }
  if (lower.includes('calzad') || lower.includes('cuero')) {
    return PROGRAM_COLORS['CAL-01'];
  }
  if (lower.includes('panad') || lower.includes('pastel')) {
    return PROGRAM_COLORS['PAN-03'];
  }
  if (lower.includes('soldad') || lower.includes('forja')) {
    return PROGRAM_COLORS['SOL-04'];
  }
  if (lower.includes('mueble') || lower.includes('mader')) {
    return PROGRAM_COLORS['MAD-05'];
  }

  // 4. Direct name/fallback lookup by color keyword
  if (fallbackColor) {
    const fc = fallbackColor.toLowerCase().trim();
    if (COLOR_MAP_BY_NAME[fc]) {
      return COLOR_MAP_BY_NAME[fc];
    }
    if (fc.startsWith('#')) {
      return {
        codigo: identifier || 'PROG',
        nombre: identifier || 'Programa',
        nombreCorto: identifier || 'Programa',
        colorHex: fc,
        colorBgLight: `${fc}20`,
        colorBorder: `${fc}60`,
        colorText: fc,
        tailwindColor: 'blue',
      };
    }
  }

  // 5. Default fallback list cycling if identifier exists
  const keys = Object.keys(PROGRAM_COLORS);
  if (identifier && identifier.length > 0) {
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = (hash + identifier.charCodeAt(i)) % keys.length;
    }
    return PROGRAM_COLORS[keys[hash]];
  }

  return PROGRAM_COLORS['G2145-1-001'];
}


