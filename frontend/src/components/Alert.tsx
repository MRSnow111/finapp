export function Alert({ message }: { message: string }) {
  if (!message) return null;
  const success = message.startsWith('✓');
  return (
    <div
      className={`animate-fade-up rounded-xl border px-4 py-2.5 text-sm ${
        success
          ? 'border-income/30 bg-income/15 text-income'
          : 'border-expense/30 bg-expense/15 text-expense'
      }`}
    >
      {message}
    </div>
  );
}
