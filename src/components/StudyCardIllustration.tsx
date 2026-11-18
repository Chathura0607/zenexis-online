'use client';

import React from 'react';

interface StudyCardIllustrationProps {
  type: string;
  className?: string;
}

export const StudyCardIllustration: React.FC<StudyCardIllustrationProps> = ({
  type,
  className = 'w-16 h-16 sm:w-20 sm:h-20',
}) => {
  switch (type) {
    case 'al':
      // Graduate with cap & diploma
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" fill="white" fillOpacity="0.18" />
          {/* Cap */}
          <path d="M50 18L18 32L50 44L82 32L50 18Z" fill="#1e293b" />
          <path d="M78 35V52" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="78" cy="54" r="2.5" fill="#f59e0b" />
          {/* Face */}
          <circle cx="50" cy="50" r="18" fill="#fed7aa" />
          {/* Hair */}
          <path d="M33 46C33 37 42 34 50 34C58 34 67 37 67 46" fill="#451a03" />
          {/* Eyes & Smile */}
          <circle cx="43" cy="50" r="2" fill="#1e293b" />
          <circle cx="57" cy="50" r="2" fill="#1e293b" />
          <path d="M44 56C47 60 53 60 56 56" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          {/* Body & Gown */}
          <path d="M26 86C26 70 36 67 50 67C64 67 74 70 74 86" fill="#0f172a" />
          <path d="M46 67L50 78L54 67" fill="#f59e0b" />
          {/* Diploma */}
          <rect x="58" y="72" width="22" height="7" rx="3.5" transform="rotate(-20 58 72)" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" />
        </svg>
      );

    case 'ol':
      // Female student holding paper with A+
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" fill="white" fillOpacity="0.18" />
          {/* Hair background */}
          <path d="M30 40C30 30 70 30 70 40V68C70 72 65 75 60 72L50 68L40 72C35 75 30 72 30 68V40Z" fill="#78350f" />
          {/* Face */}
          <circle cx="50" cy="48" r="17" fill="#fed7aa" />
          {/* Hair front */}
          <path d="M33 44C36 36 44 34 50 34C56 34 64 36 67 44C63 41 57 41 50 43C43 41 37 41 33 44Z" fill="#92400e" />
          {/* Eyes & Smile */}
          <circle cx="44" cy="48" r="2" fill="#1e293b" />
          <circle cx="56" cy="48" r="2" fill="#1e293b" />
          <path d="M45 54C48 58 52 58 55 54" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          {/* Body */}
          <path d="M28 86C28 72 37 68 50 68C63 68 72 72 72 86" fill="#0284c7" />
          {/* Paper with A+ */}
          <rect x="16" y="52" width="20" height="26" rx="2" fill="#ffffff" stroke="#0ea5e9" strokeWidth="1.5" />
          <path d="M20 59L25 59" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M20 64L30 64" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <text x="22" y="74" fill="#ef4444" fontSize="9" fontWeight="900" fontFamily="sans-serif">A+</text>
        </svg>
      );

    case 'preschool':
      // Cute toddler artist with paint brush & palette
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" fill="white" fillOpacity="0.2" />
          {/* Face */}
          <circle cx="48" cy="46" r="18" fill="#fde68a" />
          {/* Cute cheeks */}
          <circle cx="37" cy="50" r="3.5" fill="#fca5a5" />
          <circle cx="59" cy="50" r="3.5" fill="#fca5a5" />
          {/* Eyes & Big smile */}
          <circle cx="42" cy="44" r="2.5" fill="#1e293b" />
          <circle cx="54" cy="44" r="2.5" fill="#1e293b" />
          <path d="M42 52C45 57 51 57 54 52" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          {/* Toddler Cap */}
          <path d="M30 40C30 28 66 28 66 40H30Z" fill="#fbbf24" />
          <circle cx="48" cy="28" r="4" fill="#ef4444" />
          {/* Body with dungarees */}
          <path d="M28 86C28 70 38 66 48 66C58 66 68 70 68 86" fill="#3b82f6" />
          {/* Paint brush in hand */}
          <rect x="64" y="44" width="4" height="26" rx="2" transform="rotate(30 64 44)" fill="#d97706" />
          <path d="M76 42C78 40 82 44 79 46C76 48 74 44 76 42Z" fill="#ef4444" />
          {/* Color palette */}
          <ellipse cx="25" cy="68" rx="14" ry="10" fill="#fef08a" stroke="#d97706" strokeWidth="1.5" />
          <circle cx="18" cy="66" r="2.5" fill="#ef4444" />
          <circle cx="24" cy="64" r="2.5" fill="#3b82f6" />
          <circle cx="30" cy="68" r="2.5" fill="#10b981" />
        </svg>
      );

    case 'scholarship':
      // Grade 5 scholarship student studying with bright star
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" fill="white" fillOpacity="0.2" />
          {/* Bright Star */}
          <path d="M78 22L80 27L85 28L81 32L82 37L78 34L74 37L75 32L71 28L76 27L78 22Z" fill="#fde047" />
          {/* Face */}
          <circle cx="48" cy="46" r="17" fill="#fed7aa" />
          {/* Hair with side parting */}
          <path d="M31 43C31 32 65 32 65 43C59 38 43 38 31 43Z" fill="#1e293b" />
          {/* Glasses */}
          <circle cx="41" cy="46" r="5" stroke="#1e293b" strokeWidth="1.8" />
          <circle cx="55" cy="46" r="5" stroke="#1e293b" strokeWidth="1.8" />
          <path d="M46 46H50" stroke="#1e293b" strokeWidth="1.8" />
          {/* Eyes inside glasses */}
          <circle cx="41" cy="46" r="1.8" fill="#1e293b" />
          <circle cx="55" cy="46" r="1.8" fill="#1e293b" />
          {/* Smile */}
          <path d="M43 54C46 58 50 58 53 54" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          {/* School Uniform / Tie */}
          <path d="M26 86C26 70 36 66 48 66C60 66 70 70 70 86" fill="#ffffff" />
          <path d="M46 66L48 76L50 66" fill="#dc2626" />
          {/* Stack of books */}
          <rect x="60" y="68" width="24" height="6" rx="2" fill="#10b981" />
          <rect x="62" y="62" width="20" height="6" rx="2" fill="#3b82f6" />
          <rect x="64" y="56" width="16" height="6" rx="2" fill="#f59e0b" />
        </svg>
      );

    case 'senior':
      // High school senior student with laptop / book
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" fill="white" fillOpacity="0.2" />
          {/* Face */}
          <circle cx="50" cy="46" r="17" fill="#fde68a" />
          {/* Trendy hair */}
          <path d="M33 40C33 28 67 28 67 40C63 32 45 32 33 40Z" fill="#312e81" />
          {/* Eyes */}
          <circle cx="44" cy="46" r="2" fill="#1e293b" />
          <circle cx="56" cy="46" r="2" fill="#1e293b" />
          <path d="M45 53C48 56 52 56 55 53" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          {/* Blazer */}
          <path d="M26 86C26 69 36 65 50 65C64 65 74 69 74 86" fill="#1e1b4b" />
          <path d="M44 65L50 78L56 65" fill="#f59e0b" />
          {/* Open Book */}
          <path d="M32 76C40 73 50 75 50 82C50 75 60 73 68 76V88C60 85 50 87 50 88C50 87 40 85 32 88V76Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        </svg>
      );

    case 'notes':
      // Fast Revision Notes handbook & pen
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" fill="white" fillOpacity="0.2" />
          {/* Notebook */}
          <rect x="28" y="24" width="44" height="54" rx="4" fill="#ffffff" stroke="#a855f7" strokeWidth="2" />
          {/* Spiral binding */}
          <circle cx="28" cy="32" r="2" fill="#7e22ce" />
          <circle cx="28" cy="40" r="2" fill="#7e22ce" />
          <circle cx="28" cy="48" r="2" fill="#7e22ce" />
          <circle cx="28" cy="56" r="2" fill="#7e22ce" />
          <circle cx="28" cy="64" r="2" fill="#7e22ce" />
          {/* Note lines */}
          <path d="M38 36L64 36" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M38 44L60 44" stroke="#e9d5ff" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 52L64 52" stroke="#e9d5ff" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 60L54 60" stroke="#e9d5ff" strokeWidth="2" strokeLinecap="round" />
          {/* Pen */}
          <rect x="62" y="58" width="5" height="28" rx="2.5" transform="rotate(-35 62 58)" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
          <path d="M80 44L83 40L86 45Z" fill="#38bdf8" />
        </svg>
      );

    default:
      // Junior student with backpack
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" fill="white" fillOpacity="0.2" />
          {/* Backpack straps */}
          <path d="M28 65C28 50 34 46 38 46" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
          <path d="M72 65C72 50 66 46 62 46" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
          {/* Face */}
          <circle cx="50" cy="46" r="17" fill="#fed7aa" />
          {/* Spiky / cheerful hair */}
          <path d="M33 40C33 28 67 28 67 40C63 34 56 32 50 36C44 32 37 34 33 40Z" fill="#854d0e" />
          {/* Cheerful eyes */}
          <circle cx="44" cy="46" r="2" fill="#1e293b" />
          <circle cx="56" cy="46" r="2" fill="#1e293b" />
          <path d="M44 53C47 57 53 57 56 53" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          {/* T-shirt */}
          <path d="M28 86C28 70 38 66 50 66C62 66 72 70 72 86" fill="#10b981" />
          {/* Notebook held */}
          <rect x="42" y="66" width="16" height="20" rx="2" fill="#ffffff" stroke="#059669" strokeWidth="1.5" />
          <path d="M46 72H54" stroke="#059669" strokeWidth="1.5" />
          <path d="M46 77H52" stroke="#059669" strokeWidth="1.5" />
        </svg>
      );
  }
};
