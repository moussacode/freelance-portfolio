'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { browserClient } from '@/lib/supabase/browser';

/** Même message pour un e-mail inconnu, un mauvais mot de passe ou un compte non admin. */
const BAD_CREDENTIALS = 'Identifiants incorrects.';

type Step = 'loading' | 'credentials' | 'verify' | 'enroll';

/**
 * Connexion en deux temps : e-mail + mot de passe, puis code TOTP à 6 chiffres (aal2 obligatoire).
 * L'enrôlement (QR code) n'est proposé que si le compte n'a AUCUN facteur TOTP vérifié.
 * Dès qu'un facteur est actif, l'écran demande uniquement le code. (Supabase refuse aussi, côté serveur,
 * d'ajouter un facteur sans être en aal2 quand un facteur vérifié existe.)
 */
export function LoginForm() {
  const supabase = browserClient();
  const [step, setStep] = useState<Step>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [enrollment, setEnrollment] = useState<{ qr: string; secret: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const codeInput = useRef<HTMLInputElement>(null);

  const done = () => window.location.assign('/admin');

  /** Après le mot de passe : admin ? puis code, ou enrôlement si aucun facteur vérifié. */
  const nextStep = async () => {
    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
    if (rpcError || isAdmin !== true) {
      await supabase.auth.signOut({ scope: 'local' });
      setError(BAD_CREDENTIALS);
      setStep('credentials');
      return;
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === 'aal2') return done();

    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) throw listError;
    const totp = factors.all.filter((f) => f.factor_type === 'totp');
    const verified = totp.find((f) => f.status === 'verified');
    if (verified) {
      setFactorId(verified.id);
      setStep('verify');
      return;
    }

    // Aucun facteur vérifié : on retire les enrôlements abandonnés, puis on en crée un nouveau.
    for (const f of totp) await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Admin MoussaCode ${new Date().toISOString().slice(0, 10)}`,
    });
    if (enrollError) throw enrollError;
    setFactorId(enrolled.id);
    setEnrollment({ qr: enrolled.totp.qr_code, secret: enrolled.totp.secret });
    setStep('enroll');
  };

  // Session déjà ouverte en aal1 (par exemple après une redirection du proxy) : on reprend au code.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) return setStep('credentials');
      try {
        await nextStep();
      } catch {
        setStep('credentials');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step === 'verify' || step === 'enroll') codeInput.current?.focus();
  }, [step]);

  const submitCredentials = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        // Seul le dépassement de quota est distingué : il ne dit rien sur l'existence du compte.
        setError(signInError.status === 429 ? 'Trop de tentatives. Réessayez dans quelques minutes.' : BAD_CREDENTIALS);
        return;
      }
      setPassword('');
      await nextStep();
    } catch {
      setError('Connexion impossible pour le moment. Réessayez.');
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
      if (verifyError) {
        setError(verifyError.status === 429 ? 'Trop de tentatives. Réessayez dans quelques minutes.' : 'Code incorrect ou expiré.');
        setCode('');
        return;
      }
      done();
    } catch {
      setError('Vérification impossible pour le moment. Réessayez.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setCode('');
    setEnrollment(null);
    setError('');
    setStep('credentials');
  };

  const errorBox = error && (
    <p className="adm-error" role="alert">
      <span className="adm-error__badge" aria-hidden="true" />
      {error}
    </p>
  );

  if (step === 'loading') {
    return (
      <div className="adm-card card" aria-busy="true">
        <p className="adm-muted">Chargement…</p>
      </div>
    );
  }

  if (step === 'credentials') {
    return (
      <form className="adm-card card" onSubmit={submitCredentials} noValidate={false}>
        <p className="tag">Admin</p>
        <h1 className="adm-title">Connexion</h1>
        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Mot de passe</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {errorBox}
        <button type="submit" className="btn btn--solid btn--big" disabled={busy}>
          {busy ? 'Connexion…' : 'Continuer'}
        </button>
      </form>
    );
  }

  return (
    <form className="adm-card card" onSubmit={submitCode}>
      <p className="tag">Admin</p>
      <h1 className="adm-title">{step === 'enroll' ? 'Activer la double vérification' : 'Code de vérification'}</h1>

      {step === 'enroll' && enrollment ? (
        <>
          <ol className="adm-steps">
            <li>Ouvrez votre application d’authentification (Google Authenticator, 1Password, Authy…).</li>
            <li>Scannez ce QR code, ou saisissez la clé à la main.</li>
            <li>Entrez le code à 6 chiffres affiché.</li>
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="adm-qr" src={enrollment.qr} alt="QR code à scanner avec l’application d’authentification" />
          <p className="adm-secret">
            <span className="label">Clé</span>
            <code>{enrollment.secret}</code>
          </p>
        </>
      ) : (
        <p className="adm-muted">Entrez le code à 6 chiffres de votre application d’authentification.</p>
      )}

      <label className="field">
        <span>Code à 6 chiffres</span>
        <input
          ref={codeInput}
          className="adm-code"
          type="text"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
      </label>
      {errorBox}
      <div className="adm-actions">
        <button type="submit" className="btn btn--solid btn--big" disabled={busy || code.length !== 6}>
          {busy ? 'Vérification…' : 'Valider'}
        </button>
        <button type="button" className="tlink" onClick={cancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
