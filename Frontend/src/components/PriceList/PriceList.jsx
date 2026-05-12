import "./PriceList.css";

export default function PriceList({ label, values }) {
  if (!values?.length) return null;
  return (
    <div className="br_pricelist">
      <span className="br_acc_stat_label">{label}</span>
      <div className="br_pricelist_chips">
        {values.map((v, i) => (
          <span key={i} className="br_pricelist_chip">${v.toFixed(2)}</span>
        ))}
      </div>
    </div>
  );
}
