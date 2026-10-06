export function LoadingGate({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="gate center">
      <div className="logo">GYMBROS</div>
      <div className="muted">{message}</div>
    </div>
  );
}
