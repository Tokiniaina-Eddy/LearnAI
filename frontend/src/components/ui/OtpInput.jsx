import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Composant OTP à 6 chiffres avec UX avancée :
 * - Passage automatique au champ suivant
 * - Retour au champ précédent avec Backspace
 * - Collage direct des 6 chiffres
 * - Uniquement des chiffres
 * - Focus sur le premier champ vide au montage
 *
 * Props :
 *   value    {string}   Valeur courante (6 chiffres, ex: "482917")
 *   onChange {function} Appelé avec la nouvelle valeur string à chaque changement
 *   disabled {boolean}  Désactive tous les champs
 *   error    {boolean}  Applique le style d'erreur
 *   length   {number}   Longueur du code (défaut : 6)
 */
export default function OtpInput({ value = '', onChange, disabled = false, error = false, length = 6 }) {
  const inputsRef = useRef([]);

  // Convertir la valeur string en tableau de chiffres
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const focusInput = useCallback((index) => {
    const input = inputsRef.current[index];
    if (input) {
      input.focus();
      // Sélectionner le contenu pour faciliter le remplacement
      input.select();
    }
  }, []);

  // Focus auto sur le premier champ vide (ou le premier) au montage
  useEffect(() => {
    const firstEmpty = digits.findIndex((d) => d === '');
    focusInput(firstEmpty === -1 ? 0 : firstEmpty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = useCallback(
    (index, e) => {
      const inputVal = e.target.value;

      // Gérer le collage : prendre uniquement les chiffres
      if (inputVal.length > 1) {
        const pasted = inputVal.replace(/\D/g, '').slice(0, length);
        const newDigits = [...digits];
        for (let i = 0; i < pasted.length; i++) {
          if (index + i < length) newDigits[index + i] = pasted[i];
        }
        onChange(newDigits.join(''));
        // Focus sur le champ après le dernier collé
        const nextIndex = Math.min(index + pasted.length, length - 1);
        focusInput(nextIndex);
        return;
      }

      // Saisie d'un seul caractère
      const char = inputVal.replace(/\D/g, '');
      if (!char && inputVal !== '') return; // Ignorer les non-chiffres

      const newDigits = [...digits];
      newDigits[index] = char;
      onChange(newDigits.join(''));

      // Avancer automatiquement au champ suivant
      if (char && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [digits, onChange, focusInput, length]
  );

  const handleKeyDown = useCallback(
    (index, e) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        const newDigits = [...digits];
        if (digits[index]) {
          // Effacer le champ courant
          newDigits[index] = '';
          onChange(newDigits.join(''));
        } else if (index > 0) {
          // Revenir au champ précédent et l'effacer
          newDigits[index - 1] = '';
          onChange(newDigits.join(''));
          focusInput(index - 1);
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        e.preventDefault();
        focusInput(index + 1);
      } else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        // Laisser l'événement paste gérer le collage
      }
    },
    [digits, onChange, focusInput, length]
  );

  const handlePaste = useCallback(
    (index, e) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (!pasted) return;
      const newDigits = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < length) newDigits[index + i] = pasted[i];
      }
      onChange(newDigits.join(''));
      const nextIndex = Math.min(index + pasted.length, length - 1);
      focusInput(nextIndex);
    },
    [digits, onChange, focusInput, length]
  );

  const handleFocus = useCallback((e) => {
    e.target.select();
  }, []);

  const baseClass = [
    'w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none',
    'bg-surface-800 text-slate-50',
    'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text',
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-surface-600',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className="flex gap-2 sm:gap-3 justify-center"
      role="group"
      aria-label="Code OTP à 6 chiffres"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6} // Autoriser le collage de 6 chiffres d'un coup
          value={digit}
          disabled={disabled}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Chiffre ${index + 1} sur ${length}`}
          className={baseClass}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={handleFocus}
        />
      ))}
    </div>
  );
}
