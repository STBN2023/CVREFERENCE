type TeamCounterProps = {
  count: number;
};

export const TeamCounter = ({ count }: TeamCounterProps) => (
  <div className="fixed bottom-6 right-6 z-50">
    <div className="bg-blue-600 text-white rounded-full px-5 py-3 shadow-lg font-semibold text-lg flex items-center gap-2">
      <span>Équipe :</span>
      <span className="text-2xl">{count}</span>
    </div>
  </div>
);