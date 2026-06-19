import { Plus, Trash2 } from "lucide-react";

export type VariantDraft = { id?: string; size_ml: number | string; price: number | string; stock: number | string };

const PRESETS = [3, 6, 10, 15, 30];

export function VariantBuilder({ value, onChange }: { value: VariantDraft[]; onChange: (next: VariantDraft[]) => void }) {
  const add = (size: number | "") => onChange([...value, { size_ml: size === "" ? "" : size, price: "", stock: "" }]);
  const update = (i: number, patch: Partial<VariantDraft>) =>
    onChange(value.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => add(s)}
            className="rounded-sm border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/5 px-3 py-1.5 text-[11px] track-luxury text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10"
          >
            + {s}ml
          </button>
        ))}
        <button
          type="button"
          onClick={() => add("")}
          className="rounded-sm border border-border px-3 py-1.5 text-[11px] track-luxury text-muted-foreground hover:text-foreground"
        >
          + Custom size
        </button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No variants yet. Add a size above.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border">
          <table className="w-full text-sm">
            <thead className="bg-section text-left text-[10px] track-luxury text-muted-foreground">
              <tr>
                <th className="p-2">Size (ml)</th>
                <th className="p-2">Price (BDT)</th>
                <th className="p-2">Stock</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {value.map((v, i) => (
                <tr key={i} className="border-t border-border/60">
                  <td className="p-2">
                    <input
                      type="number"
                      min={1}
                      value={v.size_ml}
                      onChange={(e) => update(i, { size_ml: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="h-9 w-24 rounded-sm border border-border bg-background px-2"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={v.price}
                      onChange={(e) => update(i, { price: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="h-9 w-32 rounded-sm border border-border bg-background px-2"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => update(i, { stock: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="h-9 w-24 rounded-sm border border-border bg-background px-2"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
