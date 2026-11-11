/** Анимированный фон приложения (фиксированный слой позади всего интерфейса). */
export function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <div className="aurora-orb aurora-orb-1" />
      <div className="aurora-orb aurora-orb-2" />
      <div className="aurora-orb aurora-orb-3" />
    </div>
  );
}
