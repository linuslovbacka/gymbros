import { LlPlayLoadingScreen } from '@/components/LlPlayLoadingScreen';

export function LoadingGate({
  message = 'Loading…',
  variant = 'default',
}: {
  message?: string;
  variant?: 'default' | 'llplay';
}) {
  if (variant === 'llplay') {
    return <LlPlayLoadingScreen message={message} />;
  }

  return (
    <div className="gate center">
      <div className="logo">GYMBROS</div>
      <div className="muted">{message}</div>
    </div>
  );
}
