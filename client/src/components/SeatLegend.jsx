export default function SeatLegend() {
  const items = [
    { className: 'seat-legend-dot--available', label: 'Available' },
    { className: 'seat-legend-dot--selected', label: 'Selected' },
    { className: 'seat-legend-dot--held', label: 'Held by You' },
    { className: 'seat-legend-dot--others', label: 'Held by Others' },
    { className: 'seat-legend-dot--booked', label: 'Booked' },
  ];

  return (
    <div className="seat-legend">
      {items.map((item) => (
        <div key={item.label} className="seat-legend-item">
          <span className={`seat-legend-dot ${item.className}`} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
