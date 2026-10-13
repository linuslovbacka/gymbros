import Image from 'next/image';

/** Figma LL PLAY · Loading screen (1903:7735) */
export function LlPlayLoadingScreen({ message }: { message?: string }) {
  return (
    <div className="auth-llplay-loading" role="status" aria-live="polite">
      <div className="auth-llplay-loading__panel">
        <Image
          src="/ui/login/logo-barbell.svg"
          alt=""
          width={79}
          height={79}
          className="auth-llplay-loading__logo"
          priority
        />
      </div>
      {message ? <span className="auth-llplay-loading__sr">{message}</span> : null}
    </div>
  );
}
