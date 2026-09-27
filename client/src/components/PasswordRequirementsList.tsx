import React from 'react';
import { Check } from 'lucide-react';
import { checkPasswordRules } from '../utils/passwordValidator.js';

interface PasswordRequirementsListProps {
  password: string;
  confirmPassword?: string;
  showConfirmRule?: boolean;
}

export const PasswordRequirementsList: React.FC<PasswordRequirementsListProps> = ({
  password,
  confirmPassword,
  showConfirmRule = true,
}) => {
  const rules = checkPasswordRules(password, confirmPassword);

  const items = [
    { label: 'At least 8 characters', met: rules.minLength },
    { label: 'One lowercase letter (a–z)', met: rules.hasLowercase },
    { label: 'One uppercase letter (A–Z)', met: rules.hasUppercase },
    { label: 'One number (0–9)', met: rules.hasNumber },
    { label: 'One special character (!@#$%^&*)', met: rules.hasSpecialChar },
  ];

  if (showConfirmRule && confirmPassword !== undefined) {
    items.push({
      label: 'Passwords match exactly',
      met: password.length > 0 && password === confirmPassword,
    });
  }

  return (
    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs text-slate-600 transition-all">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
        Password Requirements:
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-colors shrink-0 ${
                item.met
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {item.met ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <span className="w-1 h-1 rounded-full bg-slate-400" />}
            </span>
            <span className={item.met ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
