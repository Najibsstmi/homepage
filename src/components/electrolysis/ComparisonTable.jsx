export default function ComparisonTable({ embedded = false }) {
  const rows = [
    ["Pepejal", "Ion tidak bebas bergerak", "Tidak menyala", "Tidak mengkonduksikan elektrik"],
    ["Leburan", "Ion bebas bergerak", "Menyala", "Mengkonduksikan elektrik"],
    ["Akueus NaCl", "Ion bebas bergerak", "Menyala", "Mengkonduksikan elektrik"],
  ];

  return (
    <section className={embedded ? "comparisonPanel comparisonPanel--embedded" : "electroPanel comparisonPanel"}>
      <h2>Perbandingan Keadaan Bahan</h2>
      <div className="electroTableWrap">
        <table>
          <thead>
            <tr>
              <th>Keadaan bahan</th>
              <th>Pergerakan ion</th>
              <th>Keadaan mentol</th>
              <th>Kesimpulan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td key={cell}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
