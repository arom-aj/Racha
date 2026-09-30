export interface MotivationalQuote {
  id: number;
  text: string;
  author: string;
  category: 'disciplina' | 'enfoque' | 'constancia' | 'grandeza';
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    id: 1,
    text: "No se trata de motivación, se trata de disciplina. La disciplina siempre termina el trabajo.",
    author: "Jocko Willink",
    category: "disciplina"
  },
  {
    id: 2,
    text: "Somos lo que hacemos día a día. De modo que la excelencia no es un acto sino un hábito.",
    author: "Aristóteles",
    category: "constancia"
  },
  {
    id: 3,
    text: "Un pequeño avance cada día suma grandes resultados que transforman tu futuro.",
    author: "James Clear",
    category: "constancia"
  },
  {
    id: 4,
    text: "El dolor de la disciplina pesa gramos; el dolor del arrepentimiento pesa toneladas.",
    author: "Jim Rohn",
    category: "disciplina"
  },
  {
    id: 5,
    text: "Mientras otros descansan o dudan, vos estás construyendo tu mente línea a línea.",
    author: "Mentalidad RACHA",
    category: "enfoque"
  },
  {
    id: 6,
    text: "La única mala sesión de estudio es la que nunca ocurrió. Hoy diste el paso.",
    author: "Proverbio del Estudiante",
    category: "constancia"
  },
  {
    id: 7,
    text: "Hazlo incluso cuando no tengas ganas. Ahí es donde se forjan los mejores.",
    author: "David Goggins",
    category: "disciplina"
  },
  {
    id: 8,
    text: "No cuentes los días, haz que los días cuenten.",
    author: "Muhammad Ali",
    category: "grandeza"
  },
  {
    id: 9,
    text: "La paciencia y el estudio constante son el superpoder más subestimado del siglo XXI.",
    author: "Naval Ravikant",
    category: "enfoque"
  },
  {
    id: 10,
    text: "El fuego que enciende una racha no se apaga con el cansancio; se alimenta de tu compromiso.",
    author: "RACHA Dev",
    category: "grandeza"
  },
  {
    id: 11,
    text: "Si estudias 30 minutos al día, al año habrás acumulado más de 180 horas de ventaja competitiva.",
    author: "Regla del 1%",
    category: "constancia"
  },
  {
    id: 12,
    text: "Concéntrate en el proceso, no en el resultado inmediato. El conocimiento es acumulativo.",
    author: "Carl Sagan",
    category: "enfoque"
  },
  {
    id: 13,
    text: "La suerte favorece a la mente preparada.",
    author: "Louis Pasteur",
    category: "grandeza"
  },
  {
    id: 14,
    text: "Hoy superaste la pereza. Tu versión del futuro te lo va a agradecer con creces.",
    author: "Mentalidad RACHA",
    category: "disciplina"
  },
  {
    id: 15,
    text: "El éxito no es más que la suma de pequeños esfuerzos repetidos día tras día.",
    author: "Robert Collier",
    category: "constancia"
  },
  {
    id: 16,
    text: "Quien domina su atención y sus libros domina su destino.",
    author: "Marco Aurelio",
    category: "enfoque"
  },
  {
    id: 17,
    text: "Cada concepto que aprendes hoy es un ladrillo más en el imperio de tus habilidades.",
    author: "RACHA Dev",
    category: "grandeza"
  },
  {
    id: 18,
    text: "No busques el momento perfecto: toma el momento y hazlo productivo.",
    author: "Séneca",
    category: "enfoque"
  },
  {
    id: 19,
    text: "Tu cerebro se adapta a lo que le exiges con regularidad. Estás reprogramando tus límites.",
    author: "Andrew Huberman",
    category: "disciplina"
  },
  {
    id: 20,
    text: "La racha no es solo un número: es el reflejo de tu palabra cumplida consigo mismo.",
    author: "Filosofía RACHA",
    category: "constancia"
  }
];

export function getRandomQuote(excludeId?: number): MotivationalQuote {
  const pool = excludeId ? MOTIVATIONAL_QUOTES.filter(q => q.id !== excludeId) : MOTIVATIONAL_QUOTES;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] || MOTIVATIONAL_QUOTES[0];
}
